import { User, SchoolClass, Student } from '../types';
import { storageService } from './storageService';
import { teacherService } from './teacherService';
import { permissionService } from './permissionService';

export interface ReadinessCheckResult {
  className: string;
  grade: number;
  hasStudents: boolean;
  studentCount: number;
  hasBoardingSet: boolean;
  unsetBoardingCount: number;
  hasHeadTeacher: boolean;
  headTeacherName?: string;
  hasUserAccount: boolean;
  isAccountActive: boolean;
  isReadyForAttendance: boolean;
  unreadyReasons: string[];
}

export class SecurityService {
  /**
   * Kiểm tra xem người dùng hiện tại có được phép truy cập lớp học này không
   */
  public canAccessClass(user: User | null, classIdOrName: string): boolean {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    if (role === 'ADMIN' || user.role === 'admin_tpt') return true;
    if (role === 'BOARD_OF_MANAGEMENT' || user.role === 'principal') return true;
    if (role === 'VIEWER' || user.role === 'viewer') return true;

    // Đối với GVCN: Chỉ được truy cập đúng lớp mình chủ nhiệm hoặc lớp được phân công tạm thời
    const cleanTarget = classIdOrName.trim().toUpperCase();
    const cleanUserClass = (user.assignedClassName || user.assignedClassId || '').toUpperCase();

    if (cleanUserClass && (cleanUserClass === cleanTarget || `CLS_${cleanTarget.toLowerCase()}` === user.assignedClassId)) {
      return true;
    }

    // Kiểm tra phân công tạm thời nếu có
    if (user.temporaryAssignments && user.temporaryAssignments.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const isTemp = user.temporaryAssignments.some(
        ta =>
          (ta.className.toUpperCase() === cleanTarget || ta.classId === classIdOrName) &&
          today >= ta.temporaryFrom &&
          today <= ta.temporaryUntil
      );
      if (isTemp) return true;
    }

    return false;
  }

  /**
   * Kiểm tra quyền nộp báo cáo điểm danh lớp
   */
  public canSubmitClassReport(user: User | null, classIdOrName: string): boolean {
    if (!user || !user.isActive || user.accountStatus === 'LOCKED') return false;
    const role = (user.role || '').toUpperCase();
    if (role === 'ADMIN' || user.role === 'admin_tpt') return true;

    if (role === 'HEAD_TEACHER' || user.role === 'teacher_gvcn') {
      return this.canAccessClass(user, classIdOrName);
    }

    return false;
  }

  /**
   * Kiểm tra quyền quản trị (Chỉ ADMIN)
   */
  public canAccessAdminRoutes(user: User | null): boolean {
    if (!user || !user.isActive || user.accountStatus === 'LOCKED') return false;
    const role = (user.role || '').toUpperCase();
    return role === 'ADMIN' || user.role === 'admin_tpt';
  }

  /**
   * KIỂM TRA SẴN SÀNG VẬN HÀNH TOÀN TRƯỜNG (20 LỚP CHÍNH THỨC)
   * Quét thực tế 100% từ cơ sở dữ liệu:
   * 1. Có học sinh?
   * 2. Đã xác định bán trú/ngoại trú?
   * 3. Có GVCN?
   * 4. GVCN có tài khoản?
   * 5. Tài khoản đang hoạt động?
   * 6. Sẵn sàng điểm danh?
   */
  public checkOperationalReadiness(): {
    totalClasses: number;
    readyCount: number;
    unreadyCount: number;
    isSystemReady: boolean;
    classResults: ReadinessCheckResult[];
    globalWarnings: string[];
  } {
    const classes = storageService.getClasses();
    const students = storageService.getStudents();
    const teachers = teacherService.getTeachers();
    const users = storageService.getUsers();

    const classResults: ReadinessCheckResult[] = [];
    const globalWarnings: string[] = [];

    classes.forEach(c => {
      const unreadyReasons: string[] = [];
      const classStudents = students.filter(
        s => (s.className === c.name || s.classId === c.id) && s.status === 'active'
      );
      const studentCount = classStudents.length;
      const hasStudents = studentCount > 0;
      if (!hasStudents) {
        unreadyReasons.push(`Chưa có danh sách học sinh trong cơ sở dữ liệu.`);
      }

      const unsetBoardingCount = classStudents.filter(s => s.boardingType === 'UNSET').length;
      const hasBoardingSet = hasStudents && unsetBoardingCount === 0;
      if (hasStudents && unsetBoardingCount > 0) {
        unreadyReasons.push(`Còn ${unsetBoardingCount} học sinh chưa phân định Bán trú / Ngoại trú.`);
      }

      // Kiểm tra GVCN
      const activeTeacher = teachers.find(
        t =>
          t.employmentStatus === 'ACTIVE' &&
          (t.assignedClassName === c.name || t.assignedClassId === c.id || t.id === c.teacherId)
      );
      const hasHeadTeacher = !!activeTeacher;
      if (!hasHeadTeacher) {
        unreadyReasons.push(`Lớp ${c.name} chưa có GVCN nên chưa thể thực hiện báo cáo sĩ số bằng tài khoản GVCN.`);
      }

      // Kiểm tra tài khoản
      let hasUserAccount = false;
      let isAccountActive = false;
      if (activeTeacher) {
        const u = users.find(
          usr => usr.teacherId === activeTeacher.id || usr.email.toLowerCase() === activeTeacher.email.toLowerCase()
        );
        if (u) {
          hasUserAccount = true;
          isAccountActive = u.isActive && u.accountStatus !== 'LOCKED';
          if (!isAccountActive) {
            unreadyReasons.push(`Tài khoản của GVCN (${activeTeacher.fullName}) đang bị khóa hoặc chưa kích hoạt.`);
          }
        } else {
          unreadyReasons.push(`GVCN (${activeTeacher.fullName}) chưa có tài khoản đăng nhập.`);
        }
      }

      const isReadyForAttendance = hasStudents && hasHeadTeacher && hasUserAccount && isAccountActive;

      classResults.push({
        className: c.name,
        grade: c.grade,
        hasStudents,
        studentCount,
        hasBoardingSet,
        unsetBoardingCount,
        hasHeadTeacher,
        headTeacherName: activeTeacher?.fullName,
        hasUserAccount,
        isAccountActive,
        isReadyForAttendance,
        unreadyReasons,
      });
    });

    const readyCount = classResults.filter(cr => cr.isReadyForAttendance).length;
    const unreadyCount = classResults.length - readyCount;

    if (unreadyCount > 0) {
      globalWarnings.push(`Hiện có ${unreadyCount}/20 lớp chưa sẵn sàng vận hành chính thức.`);
    }

    const missingTeachers = classResults.filter(cr => !cr.hasHeadTeacher);
    if (missingTeachers.length > 0) {
      globalWarnings.push(`Các lớp chưa được phân công GVCN: ${missingTeachers.map(m => m.className).join(', ')}.`);
    }

    const missingAccounts = classResults.filter(cr => cr.hasHeadTeacher && (!cr.hasUserAccount || !cr.isAccountActive));
    if (missingAccounts.length > 0) {
      globalWarnings.push(`Các lớp có GVCN chưa có tài khoản kích hoạt: ${missingAccounts.map(m => m.className).join(', ')}.`);
    }

    return {
      totalClasses: classes.length,
      readyCount,
      unreadyCount,
      isSystemReady: unreadyCount === 0,
      classResults,
      globalWarnings,
    };
  }
}

export const securityService = new SecurityService();
