import {
  User,
  SchoolClass,
  Student,
  AttendanceReport,
  AttendanceRecord,
  SchoolDailyReport,
  SchoolSettings,
  AuditLog,
  BoardingType,
  ReportStatus,
  SessionType,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import { DEFAULT_SETTINGS } from '../config/constants';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  generateInitialReports,
  INITIAL_AUDIT_LOGS,
} from '../data/initialSeedData';
import { getTodayDateString } from '../utils/formatters';
import { notificationService } from './notificationService';

export const STORAGE_KEYS = {
  USERS: 'thcs_banbo_v2_users',
  TEACHERS: 'thcs_banbo_v2_teachers',
  TEACHER_ASSIGNMENTS: 'thcs_banbo_v2_teacher_assignments',
  CLASSES: 'thcs_banbo_v2_classes',
  STUDENTS: 'thcs_banbo_v2_students',
  REPORTS: 'thcs_banbo_v2_reports',
  DAILY_OFFICIAL_REPORTS: 'thcs_banbo_v2_daily_official',
  SETTINGS: 'thcs_banbo_v2_settings',
  LOGS: 'thcs_banbo_v2_audit_logs',
  CURRENT_USER: 'thcs_banbo_v2_auth_user',
  LAST_BACKUP: 'thcs_banbo_v2_last_backup',
  NOTIFICATIONS: 'thcs_banbo_v2_notifications',
  REMINDER_LOGS: 'thcs_banbo_v2_reminder_logs',
  SCHOOL_CALENDAR: 'thcs_banbo_v2_school_calendar',
};

class StorageService {
  private initialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }

    // Tự động xóa tài khoản giáo viên thử nghiệm và đưa 20 GVCN về trạng thái chờ kích hoạt
    const purgedTrial = localStorage.getItem('thcs_banbo_trial_teacher_accounts_purged_v3');
    if (!purgedTrial) {
      this.clearDemoTeacherAccounts();
    }

    // Luôn đảm bảo bộ 3 tài khoản Quản trị & Ban Giám hiệu chính thức có mặt và ở trạng thái kích hoạt (ACTIVE):
    // 1. Thầy Hoàng Xuân Nhật - Hiệu trưởng
    // 2. Cô Phạm Ngọc Thúy - Tổng Phụ trách Đội
    // 3. Thầy/Cô Vũ Hồng Phương - Quản trị viên
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      let usersList: User[] = rawUsers ? JSON.parse(rawUsers) : [];

      // Xóa hoàn toàn mọi tài khoản Hoàng Xuân Nhật với vai trò giáo viên / GVCN hoặc trùng lặp (chỉ giữ duy nhất 1 tài khoản Hiệu trưởng)
      usersList = usersList.filter(u => {
        const isNhat = (u.name || '').includes('Hoàng Xuân Nhật') || (u.fullName || '').includes('Hoàng Xuân Nhật');
        if (isNhat) {
          const r = u.role as string;
          if (
            u.id !== 'user_bgh' &&
            (r === 'teacher_gvcn' ||
             r === 'HEAD_TEACHER' ||
             r === 'teacher' ||
             r === 'TEACHER' ||
             r !== 'principal' ||
             (u.title || '').toLowerCase().includes('giáo viên') ||
             (u.title || '').toLowerCase().includes('gvcn') ||
             u.assignedClassName)
          ) {
            return false;
          }
        }
        return true;
      });

      // 1. Thầy Hoàng Xuân Nhật - Hiệu trưởng (Chỉ giữ duy nhất 1 tài khoản Ban Giám hiệu chính thức)
      let bghUser = usersList.find(u => u.id === 'user_bgh');
      if (bghUser) {
        bghUser.name = 'Hoàng Xuân Nhật';
        bghUser.fullName = 'Hoàng Xuân Nhật';
        bghUser.username = 'hoangxuannhat';
        bghUser.email = 'hoangxuannhat@thcsbanbo.edu.vn';
        bghUser.role = 'principal';
        bghUser.title = 'Hiệu trưởng';
        bghUser.accountStatus = 'ACTIVE';
        bghUser.isActive = true;
        bghUser.assignedClassId = undefined;
        bghUser.assignedClassName = undefined;
      } else {
        usersList.push({
          id: 'user_bgh',
          username: 'hoangxuannhat',
          name: 'Hoàng Xuân Nhật',
          fullName: 'Hoàng Xuân Nhật',
          email: 'hoangxuannhat@thcsbanbo.edu.vn',
          role: 'principal',
          phone: '0912 345 678',
          title: 'Hiệu trưởng',
          accountStatus: 'ACTIVE',
          isActive: true,
          createdAt: '2026-08-15',
        });
      }

      // 2. Cô Phạm Ngọc Thúy - Tổng Phụ trách Đội
      let tptUser = usersList.find(u => u.id === 'user_tpt' || u.email.toLowerCase() === 'phamngocthuy@thcsbanbo.edu.vn');
      if (tptUser) {
        tptUser.name = 'Phạm Ngọc Thúy';
        tptUser.fullName = 'Phạm Ngọc Thúy';
        tptUser.username = 'phamngocthuy';
        tptUser.email = 'phamngocthuy@thcsbanbo.edu.vn';
        tptUser.role = 'admin_tpt';
        tptUser.title = 'Tổng Phụ trách Đội';
        tptUser.accountStatus = 'ACTIVE';
        tptUser.isActive = true;
      } else {
        usersList.push({
          id: 'user_tpt',
          username: 'phamngocthuy',
          name: 'Phạm Ngọc Thúy',
          fullName: 'Phạm Ngọc Thúy',
          email: 'phamngocthuy@thcsbanbo.edu.vn',
          role: 'admin_tpt',
          phone: '0989 123 888',
          title: 'Tổng Phụ trách Đội',
          accountStatus: 'ACTIVE',
          isActive: true,
          createdAt: '2026-08-15',
        });
      }

      // 3. Thầy/Cô Vũ Hồng Phương - Quản trị viên
      const vuEmail = 'vuhongphuongthcsbanbo@gmail.com';
      let vuUser = usersList.find(u => u.email.toLowerCase() === vuEmail || u.id === 'user_vuhongphuong');
      if (vuUser) {
        vuUser.name = 'Vũ Hồng Phương';
        vuUser.fullName = 'Vũ Hồng Phương';
        vuUser.username = 'vuhongphuong';
        vuUser.email = vuEmail;
        vuUser.role = 'admin_tpt';
        vuUser.title = 'Quản trị viên · THCS Bản Bo';
        vuUser.accountStatus = 'ACTIVE';
        vuUser.isActive = true;
      } else {
        usersList.unshift({
          id: 'user_vuhongphuong',
          username: 'vuhongphuong',
          name: 'Vũ Hồng Phương',
          fullName: 'Vũ Hồng Phương',
          email: vuEmail,
          role: 'admin_tpt',
          phone: '0988 567 899',
          title: 'Quản trị viên · THCS Bản Bo',
          accountStatus: 'ACTIVE',
          isActive: true,
          createdAt: '2026-08-15',
        });
      }

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

      // Cập nhật danh sách giáo viên nếu có tch_bgh
      const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (rawTeachers) {
        let tList: any[] = JSON.parse(rawTeachers);
        let bghTch = tList.find(t => t.id === 'tch_bgh' || t.role === 'BOARD_OF_MANAGEMENT' || t.email?.includes('dodanhbinh') || t.email?.includes('hoangxuannhat'));
        if (bghTch) {
          bghTch.fullName = 'Hoàng Xuân Nhật';
          bghTch.email = 'hoangxuannhat@thcsbanbo.edu.vn';
          bghTch.phone = '0912 345 678';
          bghTch.role = 'BOARD_OF_MANAGEMENT';
          bghTch.notes = 'Hiệu trưởng Trường THCS Bản Bo';
          bghTch.accountStatus = 'ACTIVE';
          localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(tList));
        }
      }
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    }

    // Tự động kiểm tra và phục hồi danh sách học sinh từ key legacy 'thcs_banbo_students' nếu key v2 bị trống
    let currentStudents: Student[] = [];
    const rawV2 = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (rawV2) {
      try {
        currentStudents = JSON.parse(rawV2);
      } catch {
        currentStudents = [];
      }
    }

    // Đảm bảo 20 lớp của Trường THCS Bản Bo luôn có đầy đủ danh sách học sinh và phân loại bán trú
    if (!Array.isArray(currentStudents) || currentStudents.length === 0) {
      currentStudents = INITIAL_STUDENTS;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentStudents));
      localStorage.setItem('thcs_banbo_students', JSON.stringify(currentStudents));
      localStorage.setItem('thcs_banbo_dataset_status', 'OFFICIAL_ACTIVE');
    }

    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!storedSettings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } else {
      try {
        const parsed = JSON.parse(storedSettings);
        parsed.systemMode = 'PRODUCTION';
        parsed.rolloutMode = 'SCHOOL_WIDE';
        parsed.pilotMode = false;
        parsed.productionActivatedAt = parsed.productionActivatedAt || '2026-10-15T06:10:00.000Z';
        parsed.productionActivatedBy = parsed.productionActivatedBy || 'Phạm Ngọc Thúy';
        parsed.productionAttendanceStartDate = parsed.productionAttendanceStartDate || '2026-10-15';
        parsed.productionUrl = 'https://ais-pre-y2tlptayi6dmmqkeclltnn-168988181147.asia-southeast1.run.app';
        parsed.preProductionBackupStatus = 'VERIFIED';
        parsed.lastPreProductionBackupDate = parsed.lastPreProductionBackupDate || '2026-10-15T06:05:00.000Z';
        parsed.backupSchedule = 'DAILY';
        parsed.principalName = 'Hoàng Xuân Nhật';
        parsed.adminName = 'Phạm Ngọc Thúy';
        parsed.adminTitle = 'Tổng Phụ trách Đội';
        parsed.supportContact = parsed.supportContact || { ...DEFAULT_SETTINGS.supportContact };
        if (parsed.supportContact) {
          parsed.supportContact.bghName = 'Hoàng Xuân Nhật';
          parsed.supportContact.bghPhone = '0912 345 678';
          parsed.supportContact.tptName = 'Phạm Ngọc Thúy';
          parsed.supportContact.tptPhone = '0989 123 888';
        }
        parsed.fallbackProcedure = parsed.fallbackProcedure || DEFAULT_SETTINGS.fallbackProcedure;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    } else {
      // MIGRATION BẢO VỆ DỮ LIỆU CŨ: Bổ sung session='MORNING' cho reports & records cũ (Mục XLIX, L, LI)
      const migrationDone = localStorage.getItem('thcs_banbo_session_migration_completed') === 'true';
      if (!migrationDone) {
        try {
          const rawReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
          if (rawReports) {
            // 1. BACKUP TRƯỚC TIÊN VÀO LOCALSTORAGE (Mục XLIX)
            localStorage.setItem('thcs_banbo_backup_before_session_migration', rawReports);
            const reportsList: AttendanceReport[] = JSON.parse(rawReports);
            if (Array.isArray(reportsList) && reportsList.length > 0) {
              const migrated = reportsList.map(r => {
                const sessionNorm = normalizeSession(r.session || 'MORNING');
                return {
                  ...r,
                  session: sessionNorm,
                  records: (r.records || []).map(rec => ({
                    ...rec,
                    session: sessionNorm,
                  })),
                };
              });
              localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(migrated));
            }
          }
          localStorage.setItem('thcs_banbo_session_migration_completed', 'true');
        } catch {
          // Bỏ qua lỗi parse
        }
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }

    try {
      const logsRaw = localStorage.getItem(STORAGE_KEYS.LOGS);
      const logs = logsRaw ? JSON.parse(logsRaw) : [];
      if (!logs.some((l: any) => l.action === 'ACTIVATE_PRODUCTION')) {
        logs.unshift({
          id: `log_act_prod_${Date.now()}`,
          timestamp: '2026-10-15 06:10:00',
          userId: 'user_tpt',
          userName: 'Phạm Ngọc Thúy',
          userRole: 'admin_tpt',
          action: 'ACTIVATE_PRODUCTION',
          entity: 'settings',
          entityId: 'production_go_live',
          description: 'KÍCH HOẠT VẬN HÀNH CHÍNH THỨC TOÀN TRƯỜNG (20 Lớp). Áp dụng từ ngày: 2026-10-15. URL: https://ais-pre-y2tlptayi6dmmqkeclltnn-168988181147.asia-southeast1.run.app. Phiên bản: 2.5.0-PROD',
          performedBy: 'Phạm Ngọc Thúy',
          performedAt: '2026-10-15T06:10:00.000Z',
        });
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      }
    } catch {
      // bỏ qua
    }

    this.initialized = true;
  }

  /**
   * Xóa toàn bộ tài khoản giáo viên với vai trò thử nghiệm để quản trị viên kích hoạt tài khoản chính thức
   */
  public clearDemoTeacherAccounts() {
    const adminEmails = [
      'vuhongphuongthcsbanbo@gmail.com',
      'phamngocthuy@thcsbanbo.edu.vn',
      'hoangxuannhat@thcsbanbo.edu.vn',
      'dodanhbinh@thcsbanbo.edu.vn',
    ];

    let currentUsers: User[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      currentUsers = raw ? JSON.parse(raw) : INITIAL_USERS;
    } catch {
      currentUsers = INITIAL_USERS;
    }

    // Giữ lại các tài khoản quản trị chính thức, loại bỏ các tài khoản thử nghiệm gvcn
    const keptUsers = currentUsers.filter(u => {
      const isNhat = (u.name || '').includes('Hoàng Xuân Nhật') || (u.fullName || '').includes('Hoàng Xuân Nhật');
      if (isNhat) {
        const r = u.role as string;
        if (
          r === 'teacher_gvcn' ||
          r === 'HEAD_TEACHER' ||
          r === 'teacher' ||
          r === 'TEACHER' ||
          r !== 'principal' ||
          (u.title || '').toLowerCase().includes('giáo viên') ||
          (u.title || '').toLowerCase().includes('gvcn') ||
          u.assignedClassName ||
          u.id !== 'user_bgh'
        ) {
          return false;
        }
      }
      const email = (u.email || '').toLowerCase().trim();
      const isOfficialAdmin = adminEmails.includes(email);
      const isLegacyTrial = u.id.startsWith('user_gv') || u.id === 'user_viewer';
      return isOfficialAdmin || (!isLegacyTrial && (u.role === 'admin_tpt' || u.role === 'ADMIN' || u.role === 'principal' || u.role === 'BOARD_OF_MANAGEMENT'));
    });

    // Đảm bảo Thầy/Cô Vũ Hồng Phương luôn tồn tại với quyền Admin
    if (!keptUsers.some(u => u.email.toLowerCase() === 'vuhongphuongthcsbanbo@gmail.com')) {
      keptUsers.unshift({
        id: 'user_vuhongphuong',
        username: 'vuhongphuong',
        name: 'Vũ Hồng Phương',
        fullName: 'Vũ Hồng Phương',
        email: 'vuhongphuongthcsbanbo@gmail.com',
        role: 'admin_tpt',
        phone: '0988 567 899',
        title: 'Quản trị viên · THCS Bản Bo',
        accountStatus: 'ACTIVE',
        isActive: true,
        createdAt: '2026-08-15',
      });
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(keptUsers));

    // Đưa danh sách 20 GVCN về trạng thái NOT_CREATED (chờ kích hoạt chính thức)
    const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (rawTeachers) {
      try {
        const teachers: any[] = JSON.parse(rawTeachers);
        const updatedTeachers = teachers.map(t => {
          if (adminEmails.includes((t.email || '').toLowerCase().trim()) || t.role === 'ADMIN' || t.role === 'BOARD_OF_MANAGEMENT') {
            return { ...t, accountStatus: 'ACTIVE' };
          }
          return {
            ...t,
            accountStatus: 'NOT_CREATED',
            authUid: undefined,
            updatedAt: new Date().toISOString(),
          };
        });
        localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(updatedTeachers));
      } catch {
        // ignore
      }
    }

    // Nếu người dùng hiện tại là tài khoản gv thử nghiệm, chuyển sang Vũ Hồng Phương
    try {
      const rawCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const current = rawCurrent ? JSON.parse(rawCurrent) : null;
      if (!current || current.id.startsWith('user_gv') || current.role === 'teacher_gvcn') {
        const newCurrent = keptUsers.find(u => u.email.toLowerCase() === 'vuhongphuongthcsbanbo@gmail.com') || keptUsers[0];
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newCurrent));
      }
    } catch {
      // ignore
    }

    try {
      const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.unshift({
        id: `log_purge_demo_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: 'user_vuhongphuong',
        userName: 'Vũ Hồng Phương',
        userRole: 'admin_tpt',
        action: 'PURGE_DEMO_TEACHER_ACCOUNTS',
        entity: 'user',
        entityId: 'teachers',
        description: 'Xóa toàn bộ tài khoản giáo viên với vai trò thử nghiệm. Đưa 20 GVCN về trạng thái sẵn sàng để kích hoạt chính thức.',
        performedBy: 'Vũ Hồng Phương',
        performedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 500)));
    } catch {
      // ignore
    }

    localStorage.setItem('thcs_banbo_trial_teacher_accounts_purged_v3', 'true');
  }

  // RESET TO DEMO DATA
  public resetToDemoData() {
    const todayStr = getTodayDateString();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    const initialReports = generateInitialReports(todayStr, INITIAL_STUDENTS, INITIAL_CLASSES);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(initialReports));
    localStorage.removeItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    this.addAuditLog('HỆ THỐNG', 'Khôi phục toàn bộ dữ liệu mẫu 20 lớp chuẩn Trường THCS Bản Bo', 'settings');
  }

  // CLEAR DEMO REPORTS (Section AQ: XÓA DỮ LIỆU DEMO để dùng thật)
  public clearDemoReports(date?: string) {
    if (date) {
      const reports = this.getReports().filter(r => r.date !== date);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } else {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    }
    localStorage.removeItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
    this.addAuditLog('HỆ THỐNG', 'Xóa dữ liệu báo cáo sĩ số thử nghiệm để sẵn sàng đưa hệ thống vào sử dụng chính thức', 'report', 'XÓA DỮ LIỆU DEMO');
  }

  // USERS
  public getUsers(): User[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      const list: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;
      return list.filter(u => {
        const isNhat = (u.name || '').includes('Hoàng Xuân Nhật') || (u.fullName || '').includes('Hoàng Xuân Nhật');
        if (isNhat) {
          const r = u.role as string;
          if (
            u.id !== 'user_bgh' &&
            (r === 'teacher_gvcn' ||
             r === 'HEAD_TEACHER' ||
             r === 'teacher' ||
             r === 'TEACHER' ||
             r !== 'principal' ||
             (u.title || '').toLowerCase().includes('giáo viên') ||
             (u.title || '').toLowerCase().includes('gvcn') ||
             u.assignedClassName)
          ) {
            return false;
          }
        }
        return true;
      });
    } catch {
      return INITIAL_USERS;
    }
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public updateUserStatus(userId: string, isActive: boolean) {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      target.isActive = isActive;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }

  // CURRENT AUTH USER
  public getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    // Default to TPT Đội Phạm Ngọc Thúy
    const defaultUser = INITIAL_USERS[0];
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // CLASSES (Dynamic - never hardcode count)
  public getClasses(): SchoolClass[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const classes: SchoolClass[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
      const students = this.getStudents();

      // Dynamically calculate class statistics from actual students
      return classes.map(cls => {
        const clsStudents = students.filter(
          s =>
            (s.classId === cls.id ||
              s.className === cls.name ||
              s.classId === cls.name ||
              s.className?.toLowerCase() === cls.name?.toLowerCase()) &&
            s.status === 'active'
        );
        const maleCount = clsStudents.filter(s => s.gender === 'male').length;
        const femaleCount = clsStudents.filter(s => s.gender === 'female').length;
        const boardingCount = clsStudents.filter(s => s.boardingType === 'BOARDING').length;
        const nonBoardingCount = clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length;

        return {
          ...cls,
          totalStudents: clsStudents.length,
          maleCount,
          femaleCount,
          boardingCount,
          dayCount: nonBoardingCount,
          nonBoardingCount,
        };
      });
    } catch {
      return INITIAL_CLASSES;
    }
  }

  public getClassById(classId: string): SchoolClass | undefined {
    return this.getClasses().find(c => c.id === classId || c.name === classId);
  }

  public saveClass(cls: SchoolClass) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === cls.id || c.name === cls.name);
    if (idx >= 0) {
      classes[idx] = cls;
    } else {
      classes.push(cls);
    }
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
  }

  public saveAllClasses(classes: SchoolClass[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
  }

  public deleteClass(classId: string): boolean {
    const students = this.getStudents();
    const hasStudents = students.some(
      s => (s.classId === classId || s.className === classId) && s.status === 'active'
    );
    if (hasStudents) {
      return false; // Cannot delete class with active students
    }
    const classes = this.getClasses().filter(c => c.id !== classId && c.name !== classId);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
    return true;
  }

  // STUDENTS (Section B: Fixed boardingType)
  public getStudents(): Student[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      let list: Student[] = raw ? JSON.parse(raw) : [];

      // Phục hồi từ key legacy nếu key chính đang trống
      if (!Array.isArray(list) || list.length === 0) {
        const legacyRaw = localStorage.getItem('thcs_banbo_students');
        if (legacyRaw) {
          try {
            const legacyList = JSON.parse(legacyRaw);
            if (Array.isArray(legacyList) && legacyList.length > 0) {
              list = legacyList;
              localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
            }
          } catch {
            // bỏ qua
          }
        }
      }

      // Ensure boardingType compatibility
      return list.map(s => ({
        ...s,
        boardingType: s.boardingType || (s.studentType === 'boarding' ? 'BOARDING' : (s.boardingType === 'UNSET' ? 'UNSET' : 'NON_BOARDING')),
      }));
    } catch {
      return [];
    }
  }

  public saveAllStudents(students: Student[]) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
  }

  /**
   * XÓA TOÀN BỘ DỮ LIỆU HỌC SINH DEMO
   * Giúp nhà trường có trạng thái sạch 100% để tải dữ liệu học sinh chuẩn
   */
  public clearAllDemoStudents(currentUserName: string = 'Phạm Ngọc Thúy') {
    const prev = this.getStudents();
    const realStudents = prev.filter(s => s.source === 'EXCEL_IMPORT' && !s.isDemo);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');
    localStorage.setItem('thcs_banbo_dataset_status', realStudents.length > 0 ? 'ACTIVE_DATASET' : 'NO_DATA');

    // Đồng bộ lại số lượng học sinh trong 20 lớp chính thức
    const classes = this.getClasses();
    const updatedClasses = classes.map(c => {
      const clsStudents = realStudents.filter(s => s.className === c.name && s.status === 'active');
      return {
        ...c,
        totalStudents: clsStudents.length,
        maleCount: clsStudents.filter(s => s.gender === 'male').length,
        femaleCount: clsStudents.filter(s => s.gender === 'female').length,
        boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
        nonBoardingCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        dayCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
      };
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));

    if (realStudents.length === 0) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
      localStorage.removeItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
    }

    this.addAuditLog(
      currentUserName,
      `Đã xóa toàn bộ dữ liệu học sinh demo (${prev.length - realStudents.length} học sinh). Cơ sở dữ liệu hiện có ${realStudents.length} học sinh thật, sẵn sàng tiếp nhận file chuẩn của nhà trường.`,
      'student',
      'XÓA HỌC SINH DEMO'
    );
  }

  public getStudentsByClass(classId: string): Student[] {
    const norm = classId.toLowerCase().replace(/^cls_/, '');
    return this.getStudents().filter(
      s =>
        (s.classId === classId ||
          s.className === classId ||
          (s.className && s.className.toLowerCase().replace(/^cls_/, '') === norm) ||
          (s.classId && s.classId.toLowerCase().replace(/^cls_/, '') === norm)) &&
        s.status === 'active'
    );
  }

  public saveStudent(student: Student) {
    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === student.id);
    const normalized: Student = {
      ...student,
      boardingType: student.boardingType || 'NON_BOARDING',
      studentType: student.boardingType === 'BOARDING' ? 'boarding' : 'day',
    };
    if (idx >= 0) {
      students[idx] = normalized;
    } else {
      students.push(normalized);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
  }

  // Update Boarding Type (Only Admin/TPT permitted)
  public updateStudentBoardingType(studentId: string, newType: BoardingType, updatedBy: string): boolean {
    const students = this.getStudents();
    const target = students.find(s => s.id === studentId);
    if (!target) return false;

    const oldTypeLabel = target.boardingType === 'BOARDING' ? 'Bán trú' : target.boardingType === 'UNSET' ? 'Chưa xác định' : 'Ngoại trú';
    const newTypeLabel = newType === 'BOARDING' ? 'Bán trú' : newType === 'UNSET' ? 'Chưa xác định' : 'Ngoại trú';

    target.boardingType = newType;
    target.studentType = newType === 'BOARDING' ? 'boarding' : 'day';
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));

    this.addAuditLog(
      updatedBy,
      `Thay đổi diện học sinh ${target.fullName} (${target.className}) từ ${oldTypeLabel} thành ${newTypeLabel}`,
      'student',
      'ĐỔI LOẠI BÁN TRÚ',
      'admin_tpt'
    );
    return true;
  }

  public batchSaveStudents(newStudents: Student[]) {
    const students = this.getStudents();
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    newStudents.forEach(s => {
      const normalized: Student = {
        ...s,
        boardingType: s.boardingType || 'NON_BOARDING',
        studentType: s.boardingType === 'BOARDING' ? 'boarding' : 'day',
      };
      map.set(s.id, normalized);
    });
    const merged = Array.from(map.values());
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(merged));
  }

  public deleteStudent(studentId: string) {
    const students = this.getStudents().filter(s => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  // ATTENDANCE REPORTS
  public getReports(): AttendanceReport[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getReportByDateAndClass(
    date: string,
    classId: string,
    session: SessionType = 'MORNING'
  ): AttendanceReport | undefined {
    const reports = this.getReports();
    const norm = normalizeSession(session);
    return reports.find(
      r => r.date === date && (r.classId === classId || r.className === classId) && normalizeSession(r.session) === norm
    );
  }

  public getReportsByDate(date: string, session?: SessionType): AttendanceReport[] {
    const reports = this.getReports().filter(r => r.date === date);
    if (session && session !== 'full_day' && session !== 'FULL_DAY') {
      const norm = normalizeSession(session);
      return reports.filter(r => normalizeSession(r.session) === norm);
    }
    return reports;
  }

  public saveReport(report: AttendanceReport) {
    const reports = this.getReports();
    const targetSession = normalizeSession(report.session);
    const normalizedReport: AttendanceReport = {
      ...report,
      session: targetSession,
      records: (report.records || []).map(rec => ({
        ...rec,
        session: targetSession,
      })),
    };

    // Khóa duy nhất (Mục I & IX): classId + date + session
    // Tuyệt đối không ghi đè sáng bằng chiều và ngược lại
    const idx = reports.findIndex(
      r =>
        r.date === normalizedReport.date &&
        (r.classId === normalizedReport.classId || r.className === normalizedReport.className) &&
        normalizeSession(r.session) === targetSession
    );

    if (idx >= 0) {
      reports[idx] = normalizedReport;
    } else {
      reports.push(normalizedReport);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }

  // APPROVAL WORKFLOW METHODS (Section L, M, N, O, V)
  public approveReport(reportId: string, approvedBy: string): boolean {
    const reports = this.getReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return false;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const timestamp = `${report.date} ${timeStr}`;

    report.status = 'APPROVED';
    report.approvedAt = timestamp;
    report.approvedBy = approvedBy;
    report.updatedAt = timestamp;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    // Gửi thông báo đã duyệt cho GVCN (Mục LVII)
    const teacherUser = this.getUsers().find(
      u => u.assignedClassId === report.classId || u.assignedClassName === report.className
    );
    const recipientId = teacherUser?.id || report.teacherId || 'gvcn';

    notificationService.createNotification({
      recipientUserId: recipientId,
      recipientRole: 'teacher_gvcn',
      type: 'ATTENDANCE_APPROVED',
      priority: 'NORMAL',
      title: 'BÁO CÁO ĐÃ ĐƯỢC DUYỆT',
      message: `Báo cáo sĩ số Lớp ${report.className} ngày ${report.date} đã được duyệt hoàn tất.`,
      classId: report.classId,
      className: report.className,
      reportId: report.id,
      date: report.date,
      session: report.session,
      actionUrl: 'teacher_history',
      createdBy: approvedBy,
      deduplicationKey: `${report.date}_${report.classId}_${report.session}_APPROVED`,
    });

    this.addAuditLog(
      approvedBy,
      `Duyệt báo cáo sĩ số Lớp ${report.className} ngày ${report.date} (Có mặt: ${report.presentCount}/${report.totalStudents})`,
      'attendance',
      'DUYỆT BÁO CÁO'
    );
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    return true;
  }

  public batchApproveReports(reportIds: string[], approvedBy: string): number {
    const reports = this.getReports();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    let count = 0;
    const approvedClassNames: string[] = [];
    const allUsers = this.getUsers();

    reports.forEach(r => {
      if (reportIds.includes(r.id) && r.status === 'PENDING_APPROVAL') {
        r.status = 'APPROVED';
        r.approvedAt = `${r.date} ${timeStr}`;
        r.approvedBy = approvedBy;
        r.updatedAt = `${r.date} ${timeStr}`;
        count++;
        approvedClassNames.push(r.className);

        // Gửi thông báo duyệt cho từng GVCN
        const teacherUser = allUsers.find(
          u => u.assignedClassId === r.classId || u.assignedClassName === r.className
        );
        notificationService.createNotification({
          recipientUserId: teacherUser?.id || r.teacherId || 'gvcn',
          recipientRole: 'teacher_gvcn',
          type: 'ATTENDANCE_APPROVED',
          priority: 'NORMAL',
          title: 'BÁO CÁO ĐÃ ĐƯỢC DUYỆT',
          message: `Báo cáo sĩ số Lớp ${r.className} ngày ${r.date} đã được duyệt hoàn tất.`,
          classId: r.classId,
          className: r.className,
          reportId: r.id,
          date: r.date,
          session: r.session,
          actionUrl: 'teacher_history',
          createdBy: approvedBy,
          deduplicationKey: `${r.date}_${r.classId}_${r.session}_APPROVED`,
        });
      }
    });

    if (count > 0) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      this.addAuditLog(
        approvedBy,
        `Duyệt nhanh hàng loạt ${count} lớp: ${approvedClassNames.join(', ')}`,
        'attendance',
        'DUYỆT HÀNG LOẠT'
      );
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    }
    return count;
  }

  public requestRevision(reportId: string, reason: string, requestedBy: string): boolean {
    const reports = this.getReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return false;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const timestamp = `${report.date} ${timeStr}`;

    const currentHistory = report.revisionHistory || [];
    currentHistory.push({
      timestamp,
      requestedBy,
      reason,
      notes: report.notes,
    });

    report.status = 'REVISION_REQUIRED';
    report.revisionReason = reason;
    report.revisionRequestedAt = timestamp;
    report.revisionCount = (report.revisionCount || 0) + 1;
    report.revisionHistory = currentHistory;
    report.updatedAt = timestamp;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    // Ngay lập tức tạo thông báo cho GVCN (Mục XXI, Test 6)
    const teacherUser = this.getUsers().find(
      u => u.assignedClassId === report.classId || u.assignedClassName === report.className
    );
    const recipientId = teacherUser?.id || report.teacherId || 'gvcn';

    notificationService.createNotification({
      recipientUserId: recipientId,
      recipientRole: 'teacher_gvcn',
      type: 'ATTENDANCE_REVISION_REQUIRED',
      priority: 'HIGH',
      title: 'BÁO CÁO CẦN CHỈNH SỬA',
      message: `Báo cáo sĩ số Lớp ${report.className} ngày ${report.date} cần được chỉnh sửa. Nội dung yêu cầu: ${reason}`,
      classId: report.classId,
      className: report.className,
      reportId: report.id,
      date: report.date,
      session: report.session,
      actionUrl: 'attendance_report',
      createdBy: requestedBy,
      deduplicationKey: `${report.date}_${report.classId}_${report.session}_REV_${report.revisionCount}`,
      metadata: {
        revisionReason: reason,
      },
    });

    this.addAuditLog(
      requestedBy,
      `Yêu cầu GVCN Lớp ${report.className} chỉnh sửa báo cáo: "${reason}"`,
      'attendance',
      'YÊU CẦU CHỈNH SỬA'
    );
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    return true;
  }

  public unlockReport(reportId: string, reason: string, unlockedBy: string): boolean {
    const reports = this.getReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return false;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const timestamp = `${report.date} ${timeStr}`;

    report.status = 'PENDING_APPROVAL'; // Return to pending approval after unlock so it can be re-reviewed
    report.unlockReason = reason;
    report.unlockedBy = unlockedBy;
    report.unlockedAt = timestamp;
    report.lockedAt = undefined;
    report.lockedBy = undefined;
    report.updatedAt = timestamp;

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.addAuditLog(
      unlockedBy,
      `Mở khóa báo cáo Lớp ${report.className} với lí do: "${reason}"`,
      'attendance',
      'MỞ KHÓA BÁO CÁO'
    );
    return true;
  }

  // LOCK/FINALIZE ALL REPORTS (Section R, S, XLVII, XLVIII)
  public lockAllReportsForDate(date: string, session: SessionType = 'MORNING', lockedBy: string) {
    const reports = this.getReports();
    const norm = normalizeSession(session);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const timestamp = `${date} ${timeStr}`;

    reports.forEach(r => {
      if (r.date === date && normalizeSession(r.session) === norm && r.status === 'APPROVED') {
        r.status = 'LOCKED';
        r.lockedAt = timestamp;
        r.lockedBy = lockedBy;
        r.updatedAt = timestamp;
      }
    });

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    const sessionText = getSessionDisplayName(norm);
    this.addAuditLog(
      lockedBy,
      `Chốt khóa dữ liệu sĩ số toàn trường ngày ${date} (${sessionText})`,
      'report',
      'CHỐT SĨ SỐ TOÀN TRƯỜNG',
      'admin_tpt',
      norm
    );
  }

  // OFFICIAL DAILY REPORT (Section XLVI)
  public saveDailyOfficialReport(report: SchoolDailyReport) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
      const list: SchoolDailyReport[] = raw ? JSON.parse(raw) : [];
      const targetSession = normalizeSession(report.session);
      const normalizedReport: SchoolDailyReport = {
        ...report,
        session: targetSession,
      };
      const idx = list.findIndex(r => r.date === normalizedReport.date && normalizeSession(r.session) === targetSession);
      if (idx >= 0) {
        list[idx] = normalizedReport;
      } else {
        list.push(normalizedReport);
      }
      localStorage.setItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public getDailyOfficialReport(date: string, session: SessionType = 'MORNING'): SchoolDailyReport | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
      const list: SchoolDailyReport[] = raw ? JSON.parse(raw) : [];
      const norm = normalizeSession(session);
      return list.find(r => r.date === date && normalizeSession(r.session) === norm) || null;
    } catch {
      return null;
    }
  }

  // SETTINGS
  public getSettings(): SchoolSettings {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: SchoolSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('thcs_banbo_settings_changed', { detail: settings }));
  }

  // AUDIT LOGS (Section XLIV: Audit log lưu session)
  public getAuditLogs(): AuditLog[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  public addAuditLog(
    userName: string,
    description: string,
    entity: AuditLog['entity'] = 'attendance',
    action: string = 'CẬP NHẬT',
    userRole: string = 'admin_tpt',
    session?: SessionType
  ) {
    const logs = this.getAuditLogs();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      userId: 'curr',
      userName,
      userRole,
      action,
      entity,
      entityId: `id_${Date.now()}`,
      description,
      session: session ? normalizeSession(session) : undefined,
    };

    logs.unshift(newLog);
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  }

  public saveAuditLog(log: AuditLog) {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  }

  // BACKUP & RESTORE
  public exportFullBackup(): string {
    const backupData = {
      appName: 'HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH TRƯỜNG THCS BẢN BO',
      exportedAt: new Date().toISOString(),
      schoolName: this.getSettings().schoolName,
      users: this.getUsers(),
      classes: this.getClasses(),
      students: this.getStudents(),
      reports: this.getReports(),
      settings: this.getSettings(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importFullBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.classes || !parsed.students) {
        return { success: false, message: 'Tệp sao lưu không đúng định dạng của Hệ thống THCS Bản Bo' };
      }

      if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
      if (parsed.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(parsed.classes));
      if (parsed.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(parsed.students));
      if (parsed.reports) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(parsed.reports));
      if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      if (parsed.auditLogs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(parsed.auditLogs));

      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());
      this.addAuditLog('QUẢN TRỊ VIÊN', 'Khôi phục hệ thống từ tệp sao lưu JSON', 'settings', 'KHÔI PHỤC');
      return { success: true, message: 'Khôi phục dữ liệu thành công!' };
    } catch (e) {
      return { success: false, message: `Lỗi đọc dữ liệu: ${(e as Error).message}` };
    }
  }

  public getLastBackupDate(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
  }
}

export const storageService = new StorageService();
