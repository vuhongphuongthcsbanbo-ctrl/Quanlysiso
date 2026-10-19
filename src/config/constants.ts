import { SchoolSettings, ReportStatus, AttendanceItemStatus } from '../types';

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'TRƯỜNG THCS BẢN BO',
  schoolAddress: 'Xã Bản Bo, Tỉnh Lai Châu',
  commune: 'Xã Bản Bo',
  district: 'Huyện Tam Đường',
  province: 'Tỉnh Lai Châu',
  adminName: 'Phạm Ngọc Thúy',
  adminTitle: 'Tổng Phụ trách Đội',
  principalName: 'Hoàng Xuân Nhật',
  schoolYear: '2026-2027',
  semester: 'Học kỳ I',
  logoUrl: '',
  enableAfternoonSession: true,
  enableBoarding: true,
  autoLockTime: '11:30',
  defaultReasons: [
    'Ốm',
    'Đi khám bệnh',
    'Gia đình có việc',
    'Xin nghỉ',
    'Không rõ lí do',
    'Khác',
  ],
  // Giờ buổi sáng (Mục III: 06:45 -> 07:05 -> 07:15 -> 07:20 -> 07:30)
  morningStartTime: '06:45',
  morningReminder1Time: '07:05',
  morningReminder2Time: '07:15',
  morningDeadlineTime: '07:20',
  morningFinalizeTargetTime: '07:30',
  revisionDeadlineMinutes: 10,

  // Quyền nộp sớm / nộp muộn (Mục VI, XII, LXXIX, LXXX)
  allowEarlySubmission: true,
  allowLateSubmission: true,

  // Bật/tắt các loại nhắc nhở & thông báo (Mục XLV)
  enableReminder1: true,
  enableReminder2: true,
  enableOverdueAlert: true,
  notifyAdminOnSubmission: true,
  notifyAdminOnResubmission: true,
  notifyAdminBeforeFinalize: true,
  enablePush: false,

  // Cấu hình lịch học trong tuần (Mục IV)
  schoolDaysWeekly: [1, 2, 3, 4, 5], // Thứ 2 đến Thứ 6
  enableSaturday: false,
  timezone: 'Asia/Ho_Chi_Minh',

  // Giờ buổi chiều (Mục XXVI: 13:00 -> 13:25 -> 13:40 -> 13:45 -> 13:55)
  afternoonStartTime: '13:00',
  afternoonReminder1Time: '13:25',
  afternoonReminder2Time: '13:40',
  afternoonDeadlineTime: '13:45',
  afternoonFinalizeTargetTime: '13:55',
  afternoonRevisionDeadlineMinutes: 10,
  afternoonAllowEarlySubmission: true,
  afternoonAllowLateSubmission: true,
  afternoonAutoLockTime: '17:30',

  // Cấu hình học theo phiên (Mục XXX, XXXI, LXXVII)
  attendanceRequiredMorning: true,
  attendanceRequiredAfternoon: true,
  sessionsEnabled: ['MORNING', 'AFTERNOON'],

  // Trạng thái vận hành chính thức (Mục XX, XXI, CI, CIII)
  systemMode: 'PRODUCTION',
  rolloutMode: 'SCHOOL_WIDE',
  pilotMode: false,
  productionActivatedAt: '2026-10-15T06:10:00.000Z',
  productionActivatedBy: 'Phạm Ngọc Thúy',
  productionAttendanceStartDate: '2026-10-15',
  productionUrl: 'https://ais-pre-y2tlptayi6dmmqkeclltnn-168988181147.asia-southeast1.run.app',
  preProductionBackupStatus: 'VERIFIED',
  lastPreProductionBackupDate: '2026-10-15T06:05:00.000Z',
  backupSchedule: 'DAILY',
  fallbackProcedure: 'Trong trường hợp mạng vùng cao gián đoạn hoặc mất điện cục bộ, GVCN lập danh sách viết tay và báo cáo bằng điện thoại trực tiếp cho Tổng Phụ trách Đội (cô Phạm Ngọc Thúy - 0989 123 888) trước 07:30. Sau khi kết nối trở lại, Tổng Phụ trách Đội nhập bổ sung (LATE_MANUAL_ENTRY) vào hệ thống có ghi rõ lý do.',
  supportContact: {
    tptName: 'Phạm Ngọc Thúy',
    tptPhone: '0989 123 888',
    tptEmail: 'phamngocthuy@thcsbanbo.edu.vn',
    bghName: 'Hoàng Xuân Nhật',
    bghPhone: '0912 345 678',
    itSupport: '0989 123 888 (Phòng CNTT THCS Bản Bo)',
  },
};

export const OFFICIAL_20_CLASSES = [
  // Khối 6
  { code: '6A1', name: '6A1', grade: 6, room: 'Phòng 101' },
  { code: '6A2', name: '6A2', grade: 6, room: 'Phòng 102' },
  { code: '6A3', name: '6A3', grade: 6, room: 'Phòng 103' },
  { code: '6A4', name: '6A4', grade: 6, room: 'Phòng 104' },
  { code: '6A5', name: '6A5', grade: 6, room: 'Phòng 105' },
  // Khối 7
  { code: '7A1', name: '7A1', grade: 7, room: 'Phòng 201' },
  { code: '7A2', name: '7A2', grade: 7, room: 'Phòng 202' },
  { code: '7A3', name: '7A3', grade: 7, room: 'Phòng 203' },
  { code: '7A4', name: '7A4', grade: 7, room: 'Phòng 204' },
  { code: '7A5', name: '7A5', grade: 7, room: 'Phòng 205' },
  // Khối 8
  { code: '8A1', name: '8A1', grade: 8, room: 'Phòng 301' },
  { code: '8A2', name: '8A2', grade: 8, room: 'Phòng 302' },
  { code: '8A3', name: '8A3', grade: 8, room: 'Phòng 303' },
  { code: '8A4', name: '8A4', grade: 8, room: 'Phòng 304' },
  { code: '8A5', name: '8A5', grade: 8, room: 'Phòng 305' },
  // Khối 9
  { code: '9A1', name: '9A1', grade: 9, room: 'Phòng 401' },
  { code: '9A2', name: '9A2', grade: 9, room: 'Phòng 402' },
  { code: '9A3', name: '9A3', grade: 9, room: 'Phòng 403' },
  { code: '9A4', name: '9A4', grade: 9, room: 'Phòng 404' },
  { code: '9A5', name: '9A5', grade: 9, room: 'Phòng 405' },
];

export const ETHNIC_GROUPS = [
  'Thái',
  'Mông',
  'Lự',
  'Giáy',
  'Dao',
  'Kinh',
  'Khác',
];

export const ATTENDANCE_STATUS_LABELS: Record<string, { label: string; color: string; badgeClass: string }> = {
  PRESENT: { label: 'Có mặt', color: 'text-emerald-700', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  present: { label: 'Có mặt', color: 'text-emerald-700', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ABSENT_EXCUSED: { label: 'Vắng có phép', color: 'text-amber-700', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' },
  absent_excused: { label: 'Vắng có phép', color: 'text-amber-700', badgeClass: 'text-amber-700 bg-amber-50 border-amber-200' },
  ABSENT_UNEXCUSED: { label: 'Vắng không phép', color: 'text-rose-700', badgeClass: 'text-rose-700 bg-rose-50 border-rose-200' },
  absent_unexcused: { label: 'Vắng không phép', color: 'text-rose-700', badgeClass: 'text-rose-700 bg-rose-50 border-rose-200' },
  LATE: { label: 'Đi muộn', color: 'text-purple-700', badgeClass: 'text-purple-700 bg-purple-50 border-purple-200' },
  late: { label: 'Đi muộn', color: 'text-purple-700', badgeClass: 'text-purple-700 bg-purple-50 border-purple-200' },
  EARLY_LEAVE: { label: 'Về sớm', color: 'text-indigo-700', badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  early_leave: { label: 'Về sớm', color: 'text-indigo-700', badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  OTHER: { label: 'Khác', color: 'text-slate-700', badgeClass: 'text-slate-700 bg-slate-50 border-slate-200' },
  other: { label: 'Khác', color: 'text-slate-700', badgeClass: 'text-slate-700 bg-slate-50 border-slate-200' },
  full_day_absence: { label: 'Nghỉ cả ngày', color: 'text-red-700', badgeClass: 'text-red-700 bg-red-50 border-red-200' },
};

// Aliased export for backwards compatibility
export const STATUS_LABELS = ATTENDANCE_STATUS_LABELS;

export const REPORT_STATUS_LABELS: Record<string, { label: string; color: string; badgeClass: string }> = {
  NOT_SUBMITTED: {
    label: 'Chưa báo cáo',
    color: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
  },
  not_reported: {
    label: 'Chưa báo cáo',
    color: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt',
    color: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
  },
  submitted: {
    label: 'Chờ duyệt',
    color: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
  },
  REVISION_REQUIRED: {
    label: 'Cần chỉnh sửa',
    color: 'text-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
  },
  needs_revision: {
    label: 'Cần chỉnh sửa',
    color: 'text-rose-800',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
  },
  APPROVED: {
    label: 'Đã duyệt',
    color: 'text-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  },
  LOCKED: {
    label: 'Đã khóa',
    color: 'text-blue-900',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
  },
  locked: {
    label: 'Đã khóa',
    color: 'text-blue-900',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
  },
  draft: {
    label: 'Bản nháp',
    color: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
  },
};
