export type UserRole =
  | 'admin_tpt'
  | 'principal'
  | 'teacher_gvcn'
  | 'viewer'
  | 'ADMIN'
  | 'BOARD_OF_MANAGEMENT'
  | 'HEAD_TEACHER'
  | 'VIEWER';

export type EmploymentStatus = 'ACTIVE' | 'TEMPORARILY_INACTIVE' | 'LEFT';
export type AccountStatus = 'NOT_CREATED' | 'INVITED' | 'ACTIVE' | 'LOCKED' | 'DISABLED';

export interface UserPermissions {
  canManageUsers: boolean;
  canManageTeachers: boolean;
  canManageStudents: boolean;
  canManageClasses: boolean;
  canSubmitAttendance: boolean;
  canApproveAttendance: boolean;
  canFinalizeAttendance: boolean;
  canUnlockAttendance: boolean;
  canViewSchoolDashboard: boolean;
  canExportReports: boolean;
  canExportSchoolReports?: boolean;
  canExportClassReports?: boolean;
  canExportStudentAttendance?: boolean;
  canManageBoarding: boolean;
  canManageSettings: boolean;
}

export interface TemporaryAssignment {
  temporaryTeacherId: string;
  temporaryTeacherName: string;
  classId: string;
  className: string;
  temporaryFrom: string;
  temporaryUntil: string;
  reason: string;
  assignedBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  authUid?: string;
  teacherId?: string;
  username: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  phone?: string;
  assignedClassId?: string; // For GVCN
  assignedClassName?: string;
  title: string; // e.g. "Tổng Phụ trách Đội", "Hiệu trưởng", "GVCN Lớp 6A1"
  accountStatus?: AccountStatus;
  employmentStatus?: EmploymentStatus;
  schoolYearId?: string;
  isActive: boolean;
  avatarUrl?: string;
  password?: string;
  passwordUpdatedAt?: string;
  lastLoginAt?: string;
  isFirstLogin?: boolean;
  temporaryAssignments?: TemporaryAssignment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string; // UUID độc lập, không dùng email làm ID
  teacherCode: string; // Mã giáo viên: GV01, GV6A1...
  fullName: string;
  email: string; // Chuẩn hóa chữ thường
  phone: string;
  role: UserRole;
  assignedClassId?: string; // cls_6a1 hoặc 6A1
  assignedClassName?: string; // 6A1
  schoolYearId: string; // '2026-2027'
  employmentStatus: EmploymentStatus;
  accountStatus: AccountStatus;
  authUid?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  schoolYearId: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'ENDED' | 'TEMPORARY';
  reason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BoardingType = 'BOARDING' | 'NON_BOARDING' | 'UNSET';
export type StudentType = 'boarding' | 'day'; // Backward compatibility
export type StudentStatus = 'active' | 'transferred' | 'dropped' | 'temporary_leave'; // Đang học | Chuyển trường | Nghỉ học | Tạm nghỉ

export interface Student {
  id: string;
  code: string; // Mã học sinh
  studentCode?: string; // Tương thích alias
  fullName: string;
  normalizedName?: string; // lo thi huong (phục vụ đối soát, tìm kiếm)
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'UNSET';
  classId: string;
  className: string;
  grade: number; // 6, 7, 8, 9
  boardingType: BoardingType; // BOARDING = Bán trú, NON_BOARDING = Ngoại trú, UNSET = Chưa xác định
  studentType?: StudentType; // Backward compatibility helper
  parentName?: string;
  parentPhone?: string;
  address?: string; // Bản / Xã
  ethnicGroup?: string; // Dân tộc: Thái, Mông, Dao, Giáy, Kinh...
  nationality?: string; // Quốc tịch
  notes?: string;
  status: StudentStatus;
  schoolYearId?: string; // 2026-2027
  source?: 'EXCEL_IMPORT' | 'DEMO' | 'MANUAL';
  sourceFileName?: string;
  importBatchId?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  schoolYearId: string;
  uploadedBy: string;
  uploadedAt: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  importedRows: number;
  status: 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
}

export type DatasetStatus = 'DEMO_DATA' | 'DRAFT_IMPORT' | 'ACTIVE_DATASET' | 'NO_DATA';

export interface SchoolClass {
  id: string;
  code: string;
  name: string; // 6A1, 6A2...
  grade: number; // 6, 7, 8, 9
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
  room?: string;
  isActive: boolean;
  totalStudents?: number;
  maleCount?: number;
  femaleCount?: number;
  boardingCount?: number;
  dayCount?: number;
  nonBoardingCount?: number;
}

export type SessionType =
  | 'MORNING'
  | 'AFTERNOON'
  | 'morning'
  | 'afternoon'
  | 'full_day'
  | 'FULL_DAY';

export function normalizeSession(session?: string | null): 'MORNING' | 'AFTERNOON' {
  if (!session) return 'MORNING';
  const s = session.toString().toUpperCase().trim();
  if (s === 'AFTERNOON' || s === 'CHIEU' || s === 'CHIỀU') return 'AFTERNOON';
  return 'MORNING';
}

export function getSessionDisplayName(session?: string | null): string {
  return normalizeSession(session) === 'AFTERNOON' ? 'BUỔI CHIỀU' : 'BUỔI SÁNG';
}

export type ReportStatus =
  | 'NOT_SUBMITTED' // Chưa báo cáo
  | 'PENDING_APPROVAL' // Chờ Tổng phụ trách duyệt
  | 'REVISION_REQUIRED' // Tổng phụ trách yêu cầu chỉnh sửa
  | 'APPROVED' // Đã duyệt
  | 'LOCKED' // Đã khóa
  // Legacy aliases for backwards compatibility
  | 'submitted'
  | 'draft'
  | 'needs_revision'
  | 'locked'
  | 'not_reported';

export type AttendanceItemStatus =
  | 'PRESENT'
  | 'ABSENT_EXCUSED'
  | 'ABSENT_UNEXCUSED'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'OTHER'
  // Legacy lowercase aliases
  | 'present'
  | 'absent_excused'
  | 'absent_unexcused'
  | 'late'
  | 'early_leave'
  | 'full_day_absence'
  | 'other';

export interface RevisionHistoryItem {
  timestamp: string;
  requestedBy: string;
  reason: string;
  resubmittedAt?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  reportId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  grade: number;
  date: string; // YYYY-MM-DD
  session: SessionType;
  boardingType: BoardingType;
  studentType?: StudentType; // Backward compatibility
  status: AttendanceItemStatus;
  absenceType?: 'excused' | 'unexcused';
  reason?: string; // 'Ốm', 'Đi khám bệnh', 'Gia đình có việc', 'Xin nghỉ', 'Không rõ lí do', 'Khác'
  reasonDetail?: string;
  note?: string;
  hasBoardingMeal?: boolean; // Suất ăn trưa bán trú
  hasBoardingNap?: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface AttendanceReport {
  id: string;
  date: string; // YYYY-MM-DD
  session: SessionType;
  schoolYearId?: string;
  classId: string;
  className: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  excusedAbsentCount: number;
  unexcusedAbsentCount: number;
  lateCount: number;
  earlyLeaveCount?: number;
  // Bán trú
  boardingTotal: number;
  boardingPresent: number;
  boardingAbsent: number;
  boardingMealsExpected?: number;
  // Ngoại trú
  nonBoardingTotal: number;
  nonBoardingPresent: number;
  nonBoardingAbsent: number;
  // Legacy aliases
  dayTotal?: number;
  dayPresent?: number;
  dayAbsent?: number;
  absentExcusedCount?: number;
  absentUnexcusedCount?: number;

  status: ReportStatus;
  submittedAt?: string;
  submittedBy?: string;
  isLateSubmission?: boolean;
  deadlineAt?: string;
  lateByMinutes?: number;
  lateReason?: string;
  revisionDeadlineAt?: string;
  revisionRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lockedAt?: string;
  lockedBy?: string;
  revisionReason?: string;
  revisionCount?: number;
  revisionHistory?: RevisionHistoryItem[];
  unlockReason?: string;
  unlockedBy?: string;
  unlockedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt: string;
  records: AttendanceRecord[];
}

export interface ReportVersionHistoryItem {
  version: number;
  finalizedAt: string;
  finalizedBy: string;
  finalizedByTitle?: string;
  revisionReason?: string;
  totalStudentsSnapshot?: number;
  presentCount?: number;
  absentCount?: number;
  boardingPresent?: number;
  nonBoardingPresent?: number;
}

export interface SchoolDailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  session: SessionType;
  schoolYearId: string;
  reportVersion?: number; // v1, v2... (Mục LVIII, LXI)
  reportStatus: 'PRELIMINARY' | 'OFFICIAL' | 'LOCKED'; // Báo cáo Sơ bộ hoặc Báo cáo Chính thức
  totalClasses: number;
  submittedClasses: number;
  approvedClasses: number;
  pendingClasses?: number;
  unsubmittedClassesCount?: number;
  totalStudents: number;
  totalStudentsSnapshot?: number; // Snapshot sĩ số tại thời điểm chốt (Mục LXI, LXXVII)
  confirmedStudents: number;
  presentCount: number;
  absentCount: number;
  excusedAbsentCount: number;
  unexcusedAbsentCount: number;
  lateCount: number;
  earlyLeaveCount?: number;
  boardingTotal: number;
  boardingTotalSnapshot?: number; // Snapshot tổng bán trú (Mục LXI)
  boardingPresent: number;
  boardingAbsent: number;
  nonBoardingTotal: number;
  nonBoardingTotalSnapshot?: number; // Snapshot tổng ngoại trú (Mục LXI)
  nonBoardingPresent: number;
  nonBoardingAbsent: number;
  finalizedAt?: string;
  finalizedBy?: string;
  finalizedByTitle?: string;
  revisionReason?: string;
  unapprovedClassesList?: string[];
  versionHistory?: ReportVersionHistoryItem[];
  classesSnapshot?: Array<{
    classId: string;
    className: string;
    grade: number;
    teacherName: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    excusedAbsentCount: number;
    unexcusedAbsentCount: number;
    lateCount: number;
    boardingTotal: number;
    boardingPresent: number;
    boardingAbsent: number;
    nonBoardingTotal: number;
    nonBoardingPresent: number;
    nonBoardingAbsent: number;
    status: ReportStatus;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  commune: string; // Xã Bản Bo
  province: string; // Tỉnh Lai Châu
  district: string; // Huyện Tam Đường
  adminName: string; // Phạm Ngọc Thúy
  adminTitle: string; // Tổng Phụ trách Đội
  principalName: string; // Hoàng Xuân Nhật
  schoolYear: string; // 2026-2027
  semester: string; // Học kỳ I
  logoUrl?: string;
  enableAfternoonSession: boolean;
  enableBoarding: boolean;
  autoLockTime: string; // '11:30'
  defaultReasons: string[];

  // Cấu hình giờ Buổi Sáng (Mục III, XXV)
  morningStartTime?: string; // Mặc định '06:45'
  morningReminder1Time?: string; // Mặc định '07:05'
  morningReminder2Time?: string; // Mặc định '07:15'
  morningDeadlineTime?: string; // Mặc định '07:20'
  morningFinalizeTargetTime?: string; // Mặc định '07:30'
  revisionDeadlineMinutes?: number; // Mặc định 10 phút

  // Quyền nộp sớm / nộp muộn (Mục VI, XII, LXXIX, LXXX)
  allowEarlySubmission?: boolean; // Mặc định true
  allowLateSubmission?: boolean; // Mặc định true

  // Bật/tắt các loại nhắc nhở & cảnh báo (Mục XLV)
  enableReminder1?: boolean; // Mặc định true
  enableReminder2?: boolean; // Mặc định true
  enableOverdueAlert?: boolean; // Mặc định true
  notifyAdminOnSubmission?: boolean; // Mặc định true
  notifyAdminOnResubmission?: boolean; // Mặc định true
  notifyAdminBeforeFinalize?: boolean; // Mặc định true
  enablePush?: boolean; // Mặc định false (tùy chọn)

  // Cấu hình lịch học trong tuần (Mục IV)
  schoolDaysWeekly?: number[]; // [1, 2, 3, 4, 5] (Thứ 2 đến Thứ 6)
  enableSaturday?: boolean; // false / true nếu học Thứ 7
  timezone?: string; // 'Asia/Ho_Chi_Minh'

  // Cấu hình giờ Buổi Chiều (Mục XXVI)
  afternoonStartTime?: string; // e.g. '13:00'
  afternoonReminder1Time?: string; // e.g. '13:25'
  afternoonReminder2Time?: string; // e.g. '13:40'
  afternoonDeadlineTime?: string; // e.g. '13:45'
  afternoonFinalizeTargetTime?: string; // e.g. '13:55'
  afternoonRevisionDeadlineMinutes?: number; // Mặc định 10 phút
  afternoonAllowEarlySubmission?: boolean; // Mặc định true
  afternoonAllowLateSubmission?: boolean; // Mặc định true
  afternoonAutoLockTime?: string; // e.g. '17:30'

  // Cấu hình học theo ngày / phiên (Mục XXX, XXXI, LXXVII)
  attendanceRequiredMorning?: boolean;
  attendanceRequiredAfternoon?: boolean;
  sessionsEnabled?: ('MORNING' | 'AFTERNOON')[];

  // Cấu hình Bàn giao & Vận hành chính thức (Mục IV, XI, XV, XX, XXXV, LXXVII)
  systemMode?: 'SETUP' | 'PILOT' | 'PRODUCTION' | 'MAINTENANCE';
  rolloutMode?: 'PILOT' | 'SCHOOL_WIDE';
  pilotMode?: boolean;
  productionActivatedAt?: string;
  productionActivatedBy?: string;
  productionAttendanceStartDate?: string;
  productionUrl?: string;
  fallbackProcedure?: string;
  supportContact?: {
    tptName: string;
    tptPhone: string;
    tptEmail: string;
    bghName: string;
    bghPhone: string;
    itSupport: string;
  };
  backupSchedule?: 'DAILY' | 'WEEKLY';
  lastPreProductionBackupDate?: string;
  preProductionBackupStatus?: 'COMPLETED' | 'VERIFIED' | 'FAILED' | 'NONE';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: UserRole | string;
  action: string;
  entity: 'attendance' | 'class' | 'student' | 'user' | 'teacher' | 'settings' | 'report' | 'permission';
  entityId: string;
  description: string;
  session?: SessionType;
  targetUserId?: string;
  targetTeacherId?: string;
  classId?: string;
  performedBy?: string;
  performedAt?: string;
  previousValue?: string;
  newValue?: string;
  oldValue?: string;
  reason?: string;
}

// ==========================================
// HỆ THỐNG THÔNG BÁO & NHẮC BÁO SĨ SỐ (Mục XVIII - XXV)
// ==========================================

export type NotificationType =
  | 'ATTENDANCE_REMINDER'
  | 'ATTENDANCE_OVERDUE'
  | 'ATTENDANCE_SUBMITTED'
  | 'ATTENDANCE_APPROVED'
  | 'ATTENDANCE_REVISION_REQUIRED'
  | 'ATTENDANCE_RESUBMITTED'
  | 'REPORT_FINALIZED'
  | 'ACCOUNT_NOTICE'
  | 'SYSTEM_NOTICE';

export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface AppNotification {
  id: string;
  recipientUserId: string; // authUid hoặc userId của người nhận
  recipientRole?: UserRole | string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  classId?: string;
  className?: string;
  reportId?: string;
  date: string; // YYYY-MM-DD
  session: SessionType;
  actionUrl?: string; // Deep-link hành động: e.g. 'attendance_report'
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  deduplicationKey?: string; // Khóa chống trùng: YYYY-MM-DD_CLASS_SESSION_TYPE
  createdBy: string;
  source?: 'SCHEDULED_BACKEND' | 'ADMIN_MANUAL' | 'SYSTEM' | 'TEACHER_ACTION';
  metadata?: {
    deadlineTime?: string;
    lateByMinutes?: number;
    revisionReason?: string;
    teacherName?: string;
    submittedAt?: string;
    [key: string]: any;
  };
}

// ==========================================
// LỊCH SỬ NHẮC BÁO SĨ SỐ (Mục XXXVI, LXX)
// ==========================================

export type ReminderType =
  | 'REMINDER_1'
  | 'REMINDER_2'
  | 'OVERDUE_ALERT'
  | 'MANUAL_REMINDER'
  | 'REVISION_REMINDER'
  | 'PRE_FINALIZE_ALERT';

export interface ReminderLog {
  id: string;
  date: string;
  session: SessionType;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  reminderType: ReminderType;
  scheduledAt: string;
  sentAt: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  notificationId?: string;
  deduplicationKey: string;
  createdBy: string;
  deliveryChannel?: 'IN_APP' | 'PUSH' | 'WEB';
  messageSummary?: string;
}

// ==========================================
// LỊCH HOẠT ĐỘNG NHÀ TRƯỜNG (Mục IV, LXXI)
// ==========================================

export type DayType =
  | 'SCHOOL_DAY'
  | 'HOLIDAY'
  | 'NO_SCHOOL_DAY'
  | 'SPECIAL_SCHOOL_DAY';

export interface SchoolCalendarDay {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  title: string;
  isAttendanceRequired: boolean;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ==========================================
// TRẠNG THÁI THEO DÕI HẠN BÁO CÁO (Mục V)
// ==========================================

export type AttendanceDeadlineStatus =
  | 'BEFORE_START' // Chưa đến giờ mở báo cáo
  | 'IN_PROGRESS' // Đang nhận báo cáo (chưa đến hạn)
  | 'REMINDER_1_TRIGGERED' // Đã đến giờ nhắc lần 1
  | 'REMINDER_2_TRIGGERED' // Đã đến giờ nhắc lần 2
  | 'OVERDUE' // Quá giờ hạn chót nhưng chưa nộp
  | 'OVERDUE_REVISION' // Quá giờ hạn chỉnh sửa mà chưa nộp lại
  | 'ON_TIME' // Đã nộp đúng hạn
  | 'LATE_SUBMITTED' // Đã nộp sau hạn (muộn)
  | 'APPROVED' // Đã duyệt hoàn thành
  | 'LOCKED'; // Đã khóa


