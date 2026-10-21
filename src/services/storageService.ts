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
  OFFICIAL_TEACHERS,
  INITIAL_STUDENTS,
  generateInitialReports,
  INITIAL_AUDIT_LOGS,
} from '../data/initialSeedData';
import { getTodayDateString } from '../utils/formatters';
import { notificationService } from './notificationService';
import { supabaseService } from './supabaseService';

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

    // Tự động xóa sạch toàn bộ dữ liệu giáo viên chủ nhiệm demo
    const purgedDemoGvcn = localStorage.getItem('thcs_banbo_purged_all_demo_gvcn_v2026_complete_sync');
    if (!purgedDemoGvcn) {
      this.clearAllDemoHeadTeachersData();
      localStorage.setItem('thcs_banbo_purged_all_demo_gvcn_v2026_complete_sync', 'true');
    }

    // Tự động xóa sạch toàn bộ dữ liệu học sinh demo
    const purgedDemoStudents = localStorage.getItem('thcs_banbo_purged_all_demo_students_v2026_final');
    if (!purgedDemoStudents) {
      this.clearAllDemoStudents();
      localStorage.setItem('thcs_banbo_purged_all_demo_students_v2026_final', 'true');
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
        vuUser.role = 'ADMIN';
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
          role: 'ADMIN',
          phone: '0988 567 899',
          title: 'Quản trị viên · THCS Bản Bo',
          accountStatus: 'ACTIVE',
          isActive: true,
          createdAt: '2026-08-15',
        });
      }

      // Đảm bảo bộ 3 tài khoản Quản trị & BGH chính thức luôn có mặt trong usersList
      for (const initUser of INITIAL_USERS) {
        const existing = usersList.find(
          u => u.id === initUser.id || (u.email && u.email.toLowerCase() === initUser.email.toLowerCase())
        );
        if (!existing) {
          usersList.push({ ...initUser });
        } else {
          existing.name = initUser.name;
          existing.fullName = initUser.fullName;
          existing.title = initUser.title;
          existing.role = initUser.role;
          existing.accountStatus = 'ACTIVE';
          existing.isActive = true;
        }
      }

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

      // Cập nhật danh sách giáo viên: duy trì cán bộ BGH/Admin và toàn bộ 20 giáo viên chính thức
      const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      let tList: any[] = rawTeachers ? JSON.parse(rawTeachers) : [];
      let bghTch = tList.find(t => t.id === 'tch_bgh' || t.role === 'BOARD_OF_MANAGEMENT' || t.email?.includes('hoangxuannhat'));
      if (bghTch) {
        bghTch.fullName = 'Hoàng Xuân Nhật';
        bghTch.email = 'hoangxuannhat@thcsbanbo.edu.vn';
        bghTch.phone = '0912 345 678';
        bghTch.role = 'BOARD_OF_MANAGEMENT';
        bghTch.notes = 'Hiệu trưởng Trường THCS Bản Bo';
        bghTch.accountStatus = 'ACTIVE';
      }
      for (const ot of OFFICIAL_TEACHERS) {
        if (!tList.some((t: any) => t.id === ot.id || (t.email && ot.email && t.email.toLowerCase() === ot.email.toLowerCase()))) {
          tList.push(ot);
        }
      }
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(tList));
      localStorage.setItem('thcs_banbo_teachers', JSON.stringify(tList));
    } catch {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
      localStorage.setItem('thcs_banbo_classes', JSON.stringify(INITIAL_CLASSES));
    }

    // Tự động đồng bộ giáo viên chủ nhiệm đã được phân công và kích hoạt vào 20 lớp
    this.syncClassesWithAssignedTeachers();

    // Kiểm tra danh sách học sinh: Nếu người dùng đã chủ động xóa tất cả học sinh thì giữ nguyên danh sách rỗng
    const studentsClearedByUser = localStorage.getItem('thcs_banbo_all_students_deleted_by_user') === 'true';
    let currentStudents: Student[] = [];
    const rawV2 = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (rawV2 !== null) {
      try {
        currentStudents = JSON.parse(rawV2);
      } catch {
        currentStudents = [];
      }
    }

    // Loại bỏ mọi học sinh demo cũ nếu còn sót lại
    currentStudents = currentStudents.filter(s => {
      if (!s) return false;
      if (s.isDemo === true) return false;
      if (s.source === 'DEMO') return false;
      if (s.id && (s.id.startsWith('stu_banbo_') || /^stu_[6-9]a[1-5]_\d{2}$/.test(s.id))) return false;
      return true;
    });

    // Nếu chưa có học sinh và chưa bị người dùng xóa, nạp ngay danh sách 781 học sinh chính thức
    if ((rawV2 === null || currentStudents.length === 0) && !studentsClearedByUser && INITIAL_STUDENTS.length > 0) {
      currentStudents = INITIAL_STUDENTS;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentStudents));
      localStorage.setItem('thcs_banbo_students', JSON.stringify(currentStudents));
      localStorage.setItem('thcs_banbo_dataset_status', 'ACTIVE_DATASET');
    } else {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentStudents));
      localStorage.setItem('thcs_banbo_students', JSON.stringify(currentStudents));
    }

    // Đồng bộ chuẩn sĩ số cho 20 lớp chính thức
    if (currentStudents.length > 0) {
      const classes = this.getClasses();
      const updatedClasses = classes.map(c => {
        const clsStudents = currentStudents.filter(s => (s.className === c.name || s.classId === c.id) && s.status === 'active');
        return {
          ...c,
          totalStudents: clsStudents.length > 0 ? clsStudents.length : c.totalStudents,
          boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
          nonBoardingCount: clsStudents.filter(s => s.boardingType !== 'BOARDING').length,
          dayCount: clsStudents.filter(s => s.boardingType !== 'BOARDING').length,
          maleCount: clsStudents.filter(s => s.gender === 'male').length,
          femaleCount: clsStudents.filter(s => s.gender === 'female').length,
        };
      });
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
      localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));
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
        role: 'ADMIN',
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

    // Nếu người dùng hiện tại là tài khoản gv thử nghiệm bị xóa, xóa session đăng nhập
    try {
      const rawCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const current = rawCurrent ? JSON.parse(rawCurrent) : null;
      if (current && (current.id.startsWith('user_gv_trial') || current.role === 'teacher_gvcn_trial')) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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

  /**
   * Xóa toàn bộ dữ liệu về giáo viên chủ nhiệm demo (theo yêu cầu của người dùng)
   */
  public clearAllDemoHeadTeachersData() {
    const adminEmails = [
      'vuhongphuongthcsbanbo@gmail.com',
      'phamngocthuy@thcsbanbo.edu.vn',
      'hoangxuannhat@thcsbanbo.edu.vn',
    ];

    const demoTeacherNames = [
      'Nguyễn Văn An', 'Lò Thị Mai', 'Trần Thị Thu', 'Hoàng Văn Bình', 'Điêu Văn Tiến',
      'Trần Quốc Hưng', 'Hoàng Thị Lan', 'Lò Văn Chiến', 'Nông Thị Thảo', 'Đèo Văn Nam',
      'Vàng A Tủa', 'Lê Thị Hồng', 'Lý A Sùng', 'Nguyễn Thị Ngọc', 'Hà Văn Dũng',
      'Đặng Minh Tuấn', 'Nùng Thị Hoa', 'Vũ Đình Trọng', 'Mai Thị Hằng', 'Tạ Văn Quyết'
    ];

    const demoUserIds = [
      'user_gv6a1', 'user_gv6a2', 'user_gv6a3', 'user_gv6a4', 'user_gv6a5',
      'user_gv7a1', 'user_gv7a2', 'user_gv7a3', 'user_gv7a4', 'user_gv7a5',
      'user_gv8a1', 'user_gv8a2', 'user_gv8a3', 'user_gv8a4', 'user_gv8a5',
      'user_gv9a1', 'user_gv9a2', 'user_gv9a3', 'user_gv9a4', 'user_gv9a5',
    ];

    const demoTeacherIds = [
      'tch_6a1', 'tch_6a2', 'tch_6a3', 'tch_6a4', 'tch_6a5',
      'tch_7a1', 'tch_7a2', 'tch_7a3', 'tch_7a4', 'tch_7a5',
      'tch_8a1', 'tch_8a2', 'tch_8a3', 'tch_8a4', 'tch_8a5',
      'tch_9a1', 'tch_9a2', 'tch_9a3', 'tch_9a4', 'tch_9a5',
    ];

    // 1. Dọn dẹp danh sách Users: chỉ giữ lại tài khoản quản trị/BGH và các tài khoản thật do người dùng tạo/đăng ký
    try {
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      let users: User[] = rawUsers ? JSON.parse(rawUsers) : INITIAL_USERS;
      users = users.filter(u => {
        if (demoUserIds.includes(u.id)) return false;
        if (u.id.startsWith('user_gv6') || u.id.startsWith('user_gv7') || u.id.startsWith('user_gv8') || u.id.startsWith('user_gv9')) return false;
        const email = (u.email || '').toLowerCase().trim();
        if (adminEmails.includes(email)) return true;
        if (demoTeacherNames.includes(u.name || '') || demoTeacherNames.includes(u.fullName || '')) {
          return false;
        }
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // ignore
    }

    // 2. Dọn dẹp danh sách Teachers (Hồ sơ giáo viên)
    try {
      const rawTeachers = localStorage.getItem(STORAGE_KEYS.TEACHERS);
      if (rawTeachers) {
        let teachers: any[] = JSON.parse(rawTeachers);
        teachers = teachers.filter(t => {
          if (demoTeacherIds.includes(t.id)) return false;
          if (t.id.startsWith('tch_6') || t.id.startsWith('tch_7') || t.id.startsWith('tch_8') || t.id.startsWith('tch_9')) return false;
          const email = (t.email || '').toLowerCase().trim();
          if (adminEmails.includes(email)) return true;
          if (demoTeacherNames.includes(t.fullName || '')) return false;
          return true;
        });
        localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
      }
    } catch {
      // ignore
    }

    // 3. Xóa thông tin GVCN demo trong 20 lớp (chỉ xóa nếu là demo, KHÔNG xóa giáo viên thực tế đã được phân công)
    try {
      const rawClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
      let classes: SchoolClass[] = rawClasses ? JSON.parse(rawClasses) : INITIAL_CLASSES;
      classes = classes.map(c => {
        const isDemo =
          (c.teacherName && demoTeacherNames.includes(c.teacherName)) ||
          (c.teacherId && (demoTeacherIds.includes(c.teacherId) || demoUserIds.includes(c.teacherId)));
        if (isDemo) {
          const defaultOfficial = INITIAL_CLASSES.find(ic => ic.id === c.id || ic.name === c.name);
          return {
            ...c,
            teacherId: defaultOfficial?.teacherId || undefined,
            teacherName: defaultOfficial?.teacherName || 'Chưa phân công',
            teacherPhone: defaultOfficial?.teacherPhone || undefined,
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
      localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
    } catch {
      // ignore
    }

    // 4. Xóa lịch sử phân công GVCN demo
    try {
      localStorage.setItem(STORAGE_KEYS.TEACHER_ASSIGNMENTS, JSON.stringify([]));
    } catch {
      // ignore
    }

    // 5. Xóa thông tin giáo viên demo trong báo cáo điểm danh nếu có
    try {
      const rawReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (rawReports) {
        let reports: AttendanceReport[] = JSON.parse(rawReports);
        let changed = false;
        reports = reports.map(r => {
          if (
            (r.teacherName && demoTeacherNames.includes(r.teacherName)) ||
            (r.submittedBy && demoTeacherNames.includes(r.submittedBy)) ||
            (r.teacherId && (demoTeacherIds.includes(r.teacherId) || demoUserIds.includes(r.teacherId)))
          ) {
            changed = true;
            return {
              ...r,
              teacherId: '',
              teacherName: 'Chưa phân công',
              submittedBy: 'Chưa phân công',
            };
          }
          return r;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        }
      }
    } catch {
      // ignore
    }

    // 6. Nếu đang đăng nhập bằng tài khoản GVCN demo, xóa session đăng nhập
    try {
      const rawCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (rawCurrent) {
        const current = JSON.parse(rawCurrent);
        if (current && (current.id.startsWith('user_gv') || demoUserIds.includes(current.id) || demoTeacherNames.includes(current.name || ''))) {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
      }
    } catch {
      // ignore
    }

    // 7. Ghi Audit log
    try {
      this.addAuditLog(
        'Vũ Hồng Phương',
        'Đã xóa toàn bộ dữ liệu mẫu về Giáo viên Chủ nhiệm (GVCN). Đưa danh sách 20 lớp về trạng thái chưa phân công để sẵn sàng nhập/phân công chính thức.',
        'teacher',
        'XÓA DỮ LIỆU GVCN DEMO'
      );
    } catch {
      // ignore
    }

    // 8. Đồng bộ dọn dẹp lên Supabase nền nếu online
    try {
      supabaseService.pushAllToSupabase().catch(() => {});
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    }
  }

  // RESET TO DEMO DATA
  public resetToDemoData() {
    const todayStr = getTodayDateString();
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem('thcs_banbo_dataset_status', 'ACTIVE_DATASET');
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    this.syncClassesStudentCounts(INITIAL_STUDENTS);
    const initialReports = generateInitialReports(todayStr, INITIAL_STUDENTS, this.getClasses());
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(initialReports));
    localStorage.removeItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    this.addAuditLog('HỆ THỐNG', 'Khôi phục dữ liệu 20 lớp và 781 học sinh chuẩn Trường THCS Bản Bo', 'settings');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    }
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
    const demoTeacherNames = [
      'Nguyễn Văn An', 'Lò Thị Mai', 'Trần Thị Thu', 'Hoàng Văn Bình', 'Điêu Văn Tiến',
      'Trần Quốc Hưng', 'Hoàng Thị Lan', 'Lò Văn Chiến', 'Nông Thị Thảo', 'Đèo Văn Nam',
      'Vàng A Tủa', 'Lê Thị Hồng', 'Lý A Sùng', 'Nguyễn Thị Ngọc', 'Hà Văn Dũng',
      'Đặng Minh Tuấn', 'Nùng Thị Hoa', 'Vũ Đình Trọng', 'Mai Thị Hằng', 'Tạ Văn Quyết'
    ];
    const demoUserIds = [
      'user_gv6a1', 'user_gv6a2', 'user_gv6a3', 'user_gv6a4', 'user_gv6a5',
      'user_gv7a1', 'user_gv7a2', 'user_gv7a3', 'user_gv7a4', 'user_gv7a5',
      'user_gv8a1', 'user_gv8a2', 'user_gv8a3', 'user_gv8a4', 'user_gv8a5',
      'user_gv9a1', 'user_gv9a2', 'user_gv9a3', 'user_gv9a4', 'user_gv9a5',
    ];

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      const list: User[] = raw ? JSON.parse(raw) : INITIAL_USERS;
      return list.filter(u => {
        if (demoUserIds.includes(u.id)) return false;
        if (u.id.startsWith('user_gv6') || u.id.startsWith('user_gv7') || u.id.startsWith('user_gv8') || u.id.startsWith('user_gv9')) return false;
        if (demoTeacherNames.includes(u.name || '') || demoTeacherNames.includes(u.fullName || '')) return false;

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

    // Cập nhật người dùng hiện tại nếu trùng id
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser({ ...current, ...user });
    }

    // Tự động đồng bộ sang danh sách lớp học nếu user là GVCN có phân công lớp
    if ((user.assignedClassName || user.assignedClassId) && (user.role === 'HEAD_TEACHER' || user.role === 'teacher_gvcn' || (user.role as string) === 'TEACHER')) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
        const classes: SchoolClass[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
        const targetClass = classes.find(
          c => c.id === user.assignedClassId || c.name === user.assignedClassName || c.name === user.assignedClassId
        );
        if (targetClass) {
          targetClass.teacherId = user.id;
          targetClass.teacherName = user.fullName || user.name;
          targetClass.teacherPhone = user.phone || targetClass.teacherPhone;
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
          localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
        }
      } catch {
        // ignore
      }
    }

    this.syncClassesWithAssignedTeachers();
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    window.dispatchEvent(new CustomEvent('thcs_banbo_users_changed'));
  }

  public updateUserStatus(userId: string, isActive: boolean) {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      target.isActive = isActive;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.syncClassesWithAssignedTeachers();
    }
  }

  // CURRENT AUTH USER
  public getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  /**
   * Tự động quét và đồng bộ thông tin GVCN từ danh sách tài khoản người dùng và hồ sơ giáo viên vào bảng 20 lớp
   */
  public syncClassesWithAssignedTeachers() {
    try {
      const users = this.getUsers();
      let teachers: any[] = [];
      try {
        const rawT = localStorage.getItem(STORAGE_KEYS.TEACHERS);
        teachers = rawT ? JSON.parse(rawT) : [];
      } catch {
        // ignore
      }

      const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
      let classes: SchoolClass[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;

      let changed = false;
      classes = classes.map(cls => {
        const clsNameNorm = cls.name.trim().toUpperCase();
        const clsIdNorm = cls.id.trim().toLowerCase();

        // 1. Tìm từ Users
        const assignedUser = users.find(u => {
          if (u.accountStatus === 'LOCKED' || u.isActive === false) return false;
          const uClass = (u.assignedClassName || '').trim().toUpperCase();
          const uClassId = (u.assignedClassId || '').trim().toLowerCase();
          return (
            (uClass && (uClass === clsNameNorm || `LỚP ${uClass}` === clsNameNorm)) ||
            (uClassId && (uClassId === clsIdNorm || uClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
            (cls.teacherId && (u.id === cls.teacherId || u.teacherId === cls.teacherId))
          );
        });

        // 2. Tìm từ Teachers nếu chưa thấy ở Users
        const assignedTeacher = !assignedUser ? teachers.find(t => {
          if (t.employmentStatus === 'LEFT') return false;
          const tClass = (t.assignedClassName || '').trim().toUpperCase();
          const tClassId = (t.assignedClassId || '').trim().toLowerCase();
          return (
            (tClass && (tClass === clsNameNorm || `LỚP ${tClass}` === clsNameNorm)) ||
            (tClassId && (tClassId === clsIdNorm || tClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
            (cls.teacherId && t.id === cls.teacherId)
          );
        }) : null;

        // 3. Lớp mặc định chính thức
        const defaultClass = INITIAL_CLASSES.find(ic => ic.id === cls.id || ic.name === cls.name);

        let newTeacherName = cls.teacherName;
        let newTeacherId = cls.teacherId;
        let newTeacherPhone = cls.teacherPhone;

        if (assignedUser) {
          newTeacherName = assignedUser.fullName || assignedUser.name;
          newTeacherId = assignedUser.id;
          newTeacherPhone = assignedUser.phone || cls.teacherPhone || defaultClass?.teacherPhone || '';
        } else if (assignedTeacher) {
          newTeacherName = assignedTeacher.fullName;
          newTeacherId = assignedTeacher.id;
          newTeacherPhone = assignedTeacher.phone || cls.teacherPhone || defaultClass?.teacherPhone || '';
        } else if ((!cls.teacherName || cls.teacherName === 'Chưa phân công') && defaultClass?.teacherName) {
          newTeacherName = defaultClass.teacherName;
          newTeacherId = defaultClass.teacherId;
          newTeacherPhone = defaultClass.teacherPhone || '';
        }

        if (cls.teacherName !== newTeacherName || cls.teacherId !== newTeacherId || cls.teacherPhone !== newTeacherPhone) {
          changed = true;
          return {
            ...cls,
            teacherId: newTeacherId,
            teacherName: newTeacherName,
            teacherPhone: newTeacherPhone,
          };
        }
        return cls;
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
        localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
        window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
        window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
      }
    } catch {
      // ignore
    }
  }

  // CLASSES (Dynamic - never hardcode count)
  public getClasses(): SchoolClass[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const classes: SchoolClass[] = raw ? JSON.parse(raw) : INITIAL_CLASSES;
      const students = this.getStudents();
      const users = this.getUsers();
      let teachers: any[] = [];
      try {
        const rawT = localStorage.getItem(STORAGE_KEYS.TEACHERS);
        teachers = rawT ? JSON.parse(rawT) : [];
      } catch {
        // ignore
      }

      const demoTeacherNames = [
        'Nguyễn Văn An', 'Lò Thị Mai', 'Trần Thị Thu', 'Hoàng Văn Bình', 'Điêu Văn Tiến',
        'Trần Quốc Hưng', 'Hoàng Thị Lan', 'Lò Văn Chiến', 'Nông Thị Thảo', 'Đèo Văn Nam',
        'Vàng A Tủa', 'Lê Thị Hồng', 'Lý A Sùng', 'Nguyễn Thị Ngọc', 'Hà Văn Dũng',
        'Đặng Minh Tuấn', 'Nùng Thị Hoa', 'Vũ Đình Trọng', 'Mai Thị Hằng', 'Tạ Văn Quyết'
      ];

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

        const isDemo = cls.teacherName && demoTeacherNames.includes(cls.teacherName);
        let finalTeacherName = isDemo ? 'Chưa phân công' : (cls.teacherName || 'Chưa phân công');
        let finalTeacherId = isDemo ? undefined : cls.teacherId;
        let finalTeacherPhone = isDemo ? undefined : cls.teacherPhone;

        const clsNameNorm = cls.name.trim().toUpperCase();
        const clsIdNorm = cls.id.trim().toLowerCase();

        // 1. Tự động tìm kiếm giáo viên chủ nhiệm tương ứng từ bảng tài khoản người dùng đã phân công
        const assignedUser = users.find(u => {
          if (u.accountStatus === 'LOCKED' || u.isActive === false) return false;
          const uClass = (u.assignedClassName || '').trim().toUpperCase();
          const uClassId = (u.assignedClassId || '').trim().toLowerCase();
          return (
            (uClass && (uClass === clsNameNorm || `LỚP ${uClass}` === clsNameNorm)) ||
            (uClassId && (uClassId === clsIdNorm || uClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
            (cls.teacherId && (u.id === cls.teacherId || u.teacherId === cls.teacherId))
          );
        });

        // 2. Tìm kiếm trong hồ sơ giáo viên nếu chưa tìm thấy ở user
        const assignedTeacher = !assignedUser ? teachers.find(t => {
          if (t.employmentStatus === 'LEFT') return false;
          const tClass = (t.assignedClassName || '').trim().toUpperCase();
          const tClassId = (t.assignedClassId || '').trim().toLowerCase();
          return (
            (tClass && (tClass === clsNameNorm || `LỚP ${tClass}` === clsNameNorm)) ||
            (tClassId && (tClassId === clsIdNorm || tClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
            (cls.teacherId && t.id === cls.teacherId)
          );
        }) : null;

        // 3. Fallback theo bảng phân công chính thức THCS Bản Bo
        const defaultClass = INITIAL_CLASSES.find(ic => ic.id === cls.id || ic.name === cls.name);

        if (assignedUser) {
          finalTeacherName = assignedUser.fullName || assignedUser.name;
          finalTeacherId = assignedUser.id;
          finalTeacherPhone = assignedUser.phone || finalTeacherPhone || defaultClass?.teacherPhone;
        } else if (assignedTeacher) {
          finalTeacherName = assignedTeacher.fullName;
          finalTeacherId = assignedTeacher.id;
          finalTeacherPhone = assignedTeacher.phone || finalTeacherPhone || defaultClass?.teacherPhone;
        } else if ((!finalTeacherName || finalTeacherName === 'Chưa phân công') && defaultClass?.teacherName) {
          finalTeacherName = defaultClass.teacherName;
          finalTeacherId = defaultClass.teacherId;
          finalTeacherPhone = defaultClass.teacherPhone || finalTeacherPhone;
        }

        return {
          ...cls,
          teacherName: finalTeacherName,
          teacherId: finalTeacherId,
          teacherPhone: finalTeacherPhone,
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
    if (!classId) return undefined;
    const clean = classId.trim().toUpperCase();
    const cleanId = classId.trim().toLowerCase();
    return this.getClasses().find(
      c =>
        c.id === classId ||
        c.id.toLowerCase() === cleanId ||
        c.name.toUpperCase() === clean ||
        c.code?.toUpperCase() === clean ||
        c.id.toLowerCase() === `cls_${clean.toLowerCase()}`
    );
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
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
  }

  public saveAllClasses(classes: SchoolClass[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
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

      // Phục hồi từ key legacy nếu key chính đang trống VÀ người dùng chưa từng xóa
      const studentsClearedByUser = localStorage.getItem('thcs_banbo_all_students_deleted_by_user') === 'true';
      if (!studentsClearedByUser && (!Array.isArray(list) || list.length === 0)) {
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

      // Loại bỏ hoàn toàn mọi học sinh demo giả lập
      const filtered = list.filter(s => {
        if (!s) return false;
        if (s.isDemo === true) return false;
        if (s.source === 'DEMO') return false;
        if (s.id && (s.id.startsWith('stu_banbo_') || /^stu_[6-9]a[1-5]_\d{2}$/.test(s.id))) return false;
        return true;
      });

      if (filtered.length !== list.length) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
        localStorage.setItem('thcs_banbo_students', JSON.stringify(filtered));
      }

      // Ensure boardingType compatibility
      return filtered.map(s => ({
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
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    supabaseService.saveStudentsBatchToSupabase(students).catch(() => {});
  }

  /**
   * XÓA TOÀN BỘ TẤT CẢ HỌC SINH TRONG HỆ THỐNG
   * Đưa danh sách học sinh về 0 để nhà trường nhập danh sách chính thức mới
   */
  public deleteAllStudents(performedByName: string = 'Quản trị viên'): { success: boolean; count: number } {
    const prev = this.getStudents();
    const count = prev.length;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem('thcs_banbo_students', JSON.stringify([]));
    localStorage.setItem('thcs_banbo_all_students_deleted_by_user', 'true');
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');
    localStorage.setItem('thcs_banbo_dataset_status', 'NO_DATA');

    // Đặt lại số lượng học sinh của 20 lớp chính thức về 0
    const classes = this.getClasses();
    const updatedClasses = classes.map(c => ({
      ...c,
      totalStudents: 0,
      maleCount: 0,
      femaleCount: 0,
      boardingCount: 0,
      nonBoardingCount: 0,
      dayCount: 0,
    }));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);

    this.addAuditLog(
      performedByName,
      `Đã xóa toàn bộ ${count} học sinh trong hệ thống. Sĩ số các lớp được đặt lại về 0 để sẵn sàng tải tệp danh sách mới.`,
      'student',
      'XÓA TẤT CẢ HỌC SINH'
    );

    try {
      supabaseService.deleteAllStudentsFromSupabase().catch(() => {});
      supabaseService.pushAllToSupabase().catch(() => {});
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }

    return { success: true, count };
  }

  /**
   * Khôi phục lại học sinh danh sách gốc của 20 lớp Trường THCS Bản Bo
   */
  public restoreDefaultStudents(performedByName: string = 'Quản trị viên'): { success: boolean; count: number } {
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(INITIAL_STUDENTS));
    const classes = this.getClasses();
    const updatedClasses = classes.map(c => {
      const clsStudents = INITIAL_STUDENTS.filter(s => s.className === c.name && s.status === 'active');
      const boardingCount = clsStudents.filter(s => s.boardingType === 'BOARDING' || s.studentType === 'boarding').length;
      const maleCount = clsStudents.filter(s => s.gender === 'male').length;
      const femaleCount = clsStudents.filter(s => s.gender === 'female').length;
      return {
        ...c,
        totalStudents: clsStudents.length,
        boardingCount,
        nonBoardingCount: clsStudents.length - boardingCount,
        dayCount: clsStudents.length - boardingCount,
        maleCount,
        femaleCount,
      };
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));

    this.addAuditLog(
      performedByName,
      `Đã khôi phục thành công ${INITIAL_STUDENTS.length} học sinh chính thức của 20 lớp Trường THCS Bản Bo.`,
      'student',
      'KHÔI PHỤC HỌC SINH'
    );

    try {
      supabaseService.saveStudentsBatchToSupabase(INITIAL_STUDENTS).catch(() => {});
      supabaseService.pushAllToSupabase().catch(() => {});
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    }

    return { success: true, count: INITIAL_STUDENTS.length };
  }

  /**
   * XÓA TOÀN BỘ DỮ LIỆU HỌC SINH DEMO
   * Giúp nhà trường có trạng thái sạch 100% để tải dữ liệu học sinh chuẩn
   */
  public clearAllDemoStudents(currentUserName: string = 'Phạm Ngọc Thúy') {
    const prev = this.getStudents();
    let realStudents = prev.filter(s => {
      if (!s) return false;
      if (s.isDemo === true) return false;
      if (s.source === 'DEMO') return false;
      if (s.id && (s.id.startsWith('stu_banbo_') || /^stu_[6-9]a[1-5]_\d{2}$/.test(s.id))) return false;
      return true;
    });

    if (realStudents.length === 0 && INITIAL_STUDENTS.length > 0) {
      realStudents = INITIAL_STUDENTS;
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');
    localStorage.setItem('thcs_banbo_all_students_deleted_by_user', 'false');
    localStorage.setItem('thcs_banbo_dataset_status', 'ACTIVE_DATASET');

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

    // Đồng bộ dọn dẹp lên Supabase nền nếu online
    try {
      supabaseService.pushAllToSupabase().catch(() => {});
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }
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

  public syncClassesStudentCounts(studentsList?: Student[]) {
    const students = studentsList || this.getStudents();
    const classes = this.getClasses();
    const updatedClasses = classes.map(c => {
      const clsStudents = students.filter(
        s => (s.className === c.name || s.classId === c.id) && s.status === 'active'
      );
      return {
        ...c,
        totalStudents: clsStudents.length,
        maleCount: clsStudents.filter(s => s.gender === 'male').length,
        femaleCount: clsStudents.filter(s => s.gender === 'female').length,
        boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
        nonBoardingCount: clsStudents.filter(s => s.boardingType !== 'BOARDING').length,
        dayCount: clsStudents.filter(s => s.boardingType !== 'BOARDING').length,
      };
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
    }
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
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
    this.syncClassesStudentCounts(students);
    supabaseService.saveStudentToSupabase(normalized).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }
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
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
    this.syncClassesStudentCounts(students);
    supabaseService.saveStudentToSupabase(target).catch(() => {});

    this.addAuditLog(
      updatedBy,
      `Thay đổi diện học sinh ${target.fullName} (${target.className}) từ ${oldTypeLabel} thành ${newTypeLabel}`,
      'student',
      'ĐỔI LOẠI BÁN TRÚ',
      'admin_tpt'
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }
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
    localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(merged));
    this.syncClassesStudentCounts(merged);
    supabaseService.saveStudentsBatchToSupabase(newStudents).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }
  }

  public deleteStudent(studentId: string) {
    const students = this.getStudents().filter(s => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
    this.syncClassesStudentCounts(students);
    supabaseService.deleteStudentFromSupabase(studentId).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
    }
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

    // Đồng bộ tức thời lên Supabase ở chế độ nền
    supabaseService.saveReportToSupabase(normalizedReport);
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
    supabaseService.saveReportToSupabase(report);

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
      reports
        .filter(r => reportIds.includes(r.id))
        .forEach(r => supabaseService.saveReportToSupabase(r));

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
    supabaseService.saveReportToSupabase(report);

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
    supabaseService.saveReportToSupabase(report);
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
