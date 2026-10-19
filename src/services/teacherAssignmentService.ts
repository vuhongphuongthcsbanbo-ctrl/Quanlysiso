import { TeacherAssignment, TemporaryAssignment } from '../types';
import { storageService } from './storageService';
import { teacherService } from './teacherService';

const ASSIGNMENTS_STORAGE_KEY = 'thcs_banbo_v2_teacher_assignments';

export class TeacherAssignmentService {
  public getAssignments(): TeacherAssignment[] {
    try {
      const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      if (raw) {
        const list: TeacherAssignment[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch {
      // Bỏ qua
    }

    const initial = this.generateInitialAssignments();
    this.saveAssignments(initial);
    return initial;
  }

  public saveAssignments(assignments: TeacherAssignment[]) {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  }

  public getAssignmentHistoryForClass(classIdOrName: string): TeacherAssignment[] {
    const clean = classIdOrName.trim().toUpperCase();
    return this.getAssignments().filter(
      a =>
        a.classId === classIdOrName ||
        a.className.toUpperCase() === clean ||
        a.classId === `cls_${clean.toLowerCase()}`
    );
  }

  /**
   * Phân công GVCN cho lớp chưa có GVCN
   */
  public assignHeadTeacher(
    classId: string,
    teacherId: string,
    effectiveDate: string,
    reason: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const teachers = teacherService.getTeachers();
    const targetTeacher = teachers.find(t => t.id === teacherId);
    if (!targetTeacher) {
      return { success: false, message: 'Không tìm thấy hồ sơ giáo viên được chọn.' };
    }

    if (targetTeacher.employmentStatus !== 'ACTIVE') {
      return {
        success: false,
        message: `Thầy/cô ${targetTeacher.fullName} đang ở trạng thái "${targetTeacher.employmentStatus}", không thể phân công chủ nhiệm.`,
      };
    }

    // Kiểm tra xem giáo viên này có đang chủ nhiệm lớp khác không
    if (targetTeacher.assignedClassId && targetTeacher.assignedClassId !== classId) {
      return {
        success: false,
        message: `Thầy/cô ${targetTeacher.fullName} hiện đang là GVCN của lớp ${targetTeacher.assignedClassName || targetTeacher.assignedClassId}. Một giáo viên không thể là GVCN chính của hai lớp cùng lúc.`,
      };
    }

    const classes = storageService.getClasses();
    const cls = classes.find(c => c.id === classId || c.name === classId);
    if (!cls) {
      return { success: false, message: 'Không tìm thấy lớp học trong danh sách 20 lớp chính thức.' };
    }

    // Cập nhật teacher
    targetTeacher.assignedClassId = cls.id;
    targetTeacher.assignedClassName = cls.name;
    targetTeacher.updatedAt = new Date().toISOString();
    teacherService.saveTeachers(teachers);

    // Cập nhật lớp
    cls.teacherId = targetTeacher.id;
    cls.teacherName = targetTeacher.fullName;
    cls.teacherPhone = targetTeacher.phone;
    storageService.saveClass(cls);

    // Cập nhật User tương ứng nếu có
    const users = storageService.getUsers();
    const user = users.find(u => u.teacherId === targetTeacher.id || u.email.toLowerCase() === targetTeacher.email.toLowerCase());
    if (user) {
      user.assignedClassId = cls.id;
      user.assignedClassName = cls.name;
      user.updatedAt = new Date().toISOString();
      storageService.saveUser(user);
    }

    // Tạo bản ghi lịch sử phân công
    const assignments = this.getAssignments();
    const newAssignment: TeacherAssignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teacherId: targetTeacher.id,
      teacherName: targetTeacher.fullName,
      classId: cls.id,
      className: cls.name,
      schoolYearId: '2026-2027',
      startDate: effectiveDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      reason: reason.trim() || 'Phân công GVCN đầu năm học',
      createdBy: performedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assignments.push(newAssignment);
    this.saveAssignments(assignments);

    // Audit log
    storageService.saveAuditLog({
      id: `log_asg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'ASSIGN_HEAD_TEACHER',
      entity: 'class',
      entityId: cls.id,
      classId: cls.id,
      targetTeacherId: targetTeacher.id,
      description: `Phân công thầy/cô ${targetTeacher.fullName} làm GVCN Lớp ${cls.name}. Lý do: ${reason || 'Phân công ban đầu'}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      reason,
      newValue: JSON.stringify({ teacherId: targetTeacher.id, teacherName: targetTeacher.fullName, className: cls.name }),
    });

    return { success: true, message: `Phân công GVCN lớp ${cls.name} thành công!` };
  }

  /**
   * Thay đổi GVCN cho lớp đang có GVCN (Bắt buộc nhập lý do & ngày hiệu lực)
   * Tuyệt đối không ghi đè âm thầm, lưu snapshot vào lịch sử
   */
  public changeHeadTeacher(
    classId: string,
    newTeacherId: string,
    effectiveDate: string,
    reason: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'Bắt buộc nhập lý do thay đổi giáo viên chủ nhiệm (tối thiểu 5 ký tự).' };
    }

    if (!effectiveDate) {
      return { success: false, message: 'Vui lòng chọn ngày có hiệu lực cho việc thay đổi GVCN.' };
    }

    const teachers = teacherService.getTeachers();
    const newTeacher = teachers.find(t => t.id === newTeacherId);
    if (!newTeacher) {
      return { success: false, message: 'Không tìm thấy hồ sơ giáo viên mới.' };
    }

    if (newTeacher.employmentStatus !== 'ACTIVE') {
      return {
        success: false,
        message: `Thầy/cô ${newTeacher.fullName} không ở trạng thái đang công tác, không thể phân công chủ nhiệm.`,
      };
    }

    if (newTeacher.assignedClassId && newTeacher.assignedClassId !== classId) {
      return {
        success: false,
        message: `Thầy/cô ${newTeacher.fullName} hiện đang chủ nhiệm lớp ${newTeacher.assignedClassName || newTeacher.assignedClassId}. Vui lòng gỡ phân công lớp cũ trước.`,
      };
    }

    const classes = storageService.getClasses();
    const cls = classes.find(c => c.id === classId || c.name === classId);
    if (!cls) {
      return { success: false, message: 'Không tìm thấy lớp học cần thay đổi GVCN.' };
    }

    const oldTeacherId = cls.teacherId;
    const oldTeacherName = cls.teacherName;
    const oldTeacher = teachers.find(t => t.id === oldTeacherId);

    // 1. Chấm dứt phân công của giáo viên cũ
    if (oldTeacher) {
      oldTeacher.assignedClassId = undefined;
      oldTeacher.assignedClassName = undefined;
      oldTeacher.updatedAt = new Date().toISOString();
    }

    // 2. Gán lớp cho giáo viên mới
    newTeacher.assignedClassId = cls.id;
    newTeacher.assignedClassName = cls.name;
    newTeacher.updatedAt = new Date().toISOString();
    teacherService.saveTeachers(teachers);

    // 3. Cập nhật thông tin trong bảng lớp
    cls.teacherId = newTeacher.id;
    cls.teacherName = newTeacher.fullName;
    cls.teacherPhone = newTeacher.phone;
    storageService.saveClass(cls);

    // 4. Đồng bộ quyền User
    const users = storageService.getUsers();
    // Gỡ quyền lớp của user cũ
    const oldUser = users.find(u => u.teacherId === oldTeacherId || (oldTeacher && u.email.toLowerCase() === oldTeacher.email.toLowerCase()));
    if (oldUser && oldUser.assignedClassId === cls.id) {
      oldUser.assignedClassId = undefined;
      oldUser.assignedClassName = undefined;
      oldUser.updatedAt = new Date().toISOString();
      storageService.saveUser(oldUser);
    }
    // Gán quyền lớp cho user mới
    const newUser = users.find(u => u.teacherId === newTeacher.id || u.email.toLowerCase() === newTeacher.email.toLowerCase());
    if (newUser) {
      newUser.assignedClassId = cls.id;
      newUser.assignedClassName = cls.name;
      newUser.updatedAt = new Date().toISOString();
      storageService.saveUser(newUser);
    }

    // 5. Cập nhật lịch sử phân công
    const assignments = this.getAssignments();
    // Đóng phân công cũ
    const activeOldAsg = assignments.find(a => (a.classId === cls.id || a.className === cls.name) && a.status === 'ACTIVE');
    if (activeOldAsg) {
      activeOldAsg.endDate = effectiveDate;
      activeOldAsg.status = 'ENDED';
      activeOldAsg.updatedAt = new Date().toISOString();
    }

    // Tạo bản ghi mới
    const newAsg: TeacherAssignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teacherId: newTeacher.id,
      teacherName: newTeacher.fullName,
      classId: cls.id,
      className: cls.name,
      schoolYearId: '2026-2027',
      startDate: effectiveDate,
      status: 'ACTIVE',
      reason: reason.trim(),
      createdBy: performedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assignments.push(newAsg);
    this.saveAssignments(assignments);

    // 6. Ghi Audit Log bắt buộc
    storageService.saveAuditLog({
      id: `log_change_gvcn_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CHANGE_HEAD_TEACHER',
      entity: 'class',
      entityId: cls.id,
      classId: cls.id,
      targetTeacherId: newTeacher.id,
      description: `Thay đổi GVCN Lớp ${cls.name}: từ "${oldTeacherName || 'Chưa có'}" sang "${newTeacher.fullName}". Ngày hiệu lực: ${effectiveDate}. Lý do: ${reason}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      reason,
      oldValue: JSON.stringify({ teacherId: oldTeacherId, teacherName: oldTeacherName }),
      newValue: JSON.stringify({ teacherId: newTeacher.id, teacherName: newTeacher.fullName, effectiveDate }),
    });

    return {
      success: true,
      message: `Đã thay đổi GVCN Lớp ${cls.name} thành thầy/cô ${newTeacher.fullName} (Hiệu lực: ${effectiveDate}).`,
    };
  }

  /**
   * Phân công giáo viên chủ nhiệm thay thế tạm thời (Mục LII & LIII)
   * Không xóa GVCN chính, cho phép GV tạm thời báo cáo trong khoảng thời gian chỉ định
   */
  public addTemporaryTeacher(
    classId: string,
    tempTeacherId: string,
    fromDate: string,
    toDate: string,
    reason: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    if (!reason || reason.trim().length < 3) {
      return { success: false, message: 'Vui lòng nhập lý do phân công tạm thời (nghỉ ốm, công tác, tập huấn...).' };
    }

    const teachers = teacherService.getTeachers();
    const tempTeacher = teachers.find(t => t.id === tempTeacherId);
    if (!tempTeacher) return { success: false, message: 'Không tìm thấy giáo viên thay thế.' };

    const classes = storageService.getClasses();
    const cls = classes.find(c => c.id === classId || c.name === classId);
    if (!cls) return { success: false, message: 'Không tìm thấy lớp học.' };

    const tempAssignment: TemporaryAssignment = {
      temporaryTeacherId: tempTeacher.id,
      temporaryTeacherName: tempTeacher.fullName,
      classId: cls.id,
      className: cls.name,
      temporaryFrom: fromDate,
      temporaryUntil: toDate,
      reason: reason.trim(),
      assignedBy: performedByName,
      createdAt: new Date().toISOString(),
    };

    // Gán vào User của giáo viên tạm thời
    const users = storageService.getUsers();
    const tempUser = users.find(u => u.teacherId === tempTeacher.id || u.email.toLowerCase() === tempTeacher.email.toLowerCase());
    if (tempUser) {
      if (!tempUser.temporaryAssignments) tempUser.temporaryAssignments = [];
      tempUser.temporaryAssignments.push(tempAssignment);
      storageService.saveUser(tempUser);
    }

    // Lưu vào lịch sử phân công
    const assignments = this.getAssignments();
    assignments.push({
      id: `asg_temp_${Date.now()}`,
      teacherId: tempTeacher.id,
      teacherName: tempTeacher.fullName,
      classId: cls.id,
      className: cls.name,
      schoolYearId: '2026-2027',
      startDate: fromDate,
      endDate: toDate,
      status: 'TEMPORARY',
      reason: `Thay thế tạm thời cho GVCN chính: ${reason}`,
      createdBy: performedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.saveAssignments(assignments);

    storageService.saveAuditLog({
      id: `log_temp_gvcn_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'ADD_TEMPORARY_TEACHER',
      entity: 'class',
      entityId: cls.id,
      classId: cls.id,
      targetTeacherId: tempTeacher.id,
      description: `Phân công thầy/cô ${tempTeacher.fullName} báo cáo sĩ số tạm thời lớp ${cls.name} từ ${fromDate} đến ${toDate}. Lý do: ${reason}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      reason,
    });

    return {
      success: true,
      message: `Đã phân công thầy/cô ${tempTeacher.fullName} phụ trách tạm thời lớp ${cls.name} từ ${fromDate} đến ${toDate}.`,
    };
  }

  /**
   * Hủy phân công tạm thời
   */
  public removeTemporaryTeacher(
    classId: string,
    tempTeacherId: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const users = storageService.getUsers();
    users.forEach(u => {
      if (u.temporaryAssignments) {
        u.temporaryAssignments = u.temporaryAssignments.filter(
          ta => !(ta.classId === classId && ta.temporaryTeacherId === tempTeacherId)
        );
        storageService.saveUser(u);
      }
    });

    storageService.saveAuditLog({
      id: `log_rm_temp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'REMOVE_TEMPORARY_TEACHER',
      entity: 'class',
      entityId: classId,
      classId,
      targetTeacherId: tempTeacherId,
      description: `Đã kết thúc phân công tạm thời cho lớp ${classId}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Đã hủy phân công tạm thời.' };
  }

  private generateInitialAssignments(): TeacherAssignment[] {
    const classes = storageService.getClasses();
    const teachers = teacherService.getTeachers();
    const result: TeacherAssignment[] = [];

    classes.forEach(c => {
      const tch = teachers.find(t => t.assignedClassName === c.name || t.assignedClassId === c.id);
      if (tch) {
        result.push({
          id: `asg_init_${c.name.toLowerCase()}`,
          teacherId: tch.id,
          teacherName: tch.fullName,
          classId: c.id,
          className: c.name,
          schoolYearId: '2026-2027',
          startDate: '2026-08-15',
          status: 'ACTIVE',
          reason: 'Phân công GVCN đầu năm học 2026-2027',
          createdBy: 'Phạm Ngọc Thúy',
          createdAt: '2026-08-15T00:00:00.000Z',
          updatedAt: '2026-08-15T00:00:00.000Z',
        });
      }
    });

    return result;
  }
}

export const teacherAssignmentService = new TeacherAssignmentService();
