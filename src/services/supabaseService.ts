import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEYS, isBlacklistedStudent } from './storageService';
import {
  Student,
  SchoolClass,
  AttendanceReport,
  SchoolDailyReport,
  SavedPeriodReport,
  User,
  SchoolSettings,
  normalizeSession,
} from '../types';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://mqegeosjfggffvbuclgv.supabase.co';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_xNZJ80X6ypukLS1tI-uZQQ_Zzq8Qnme';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
  hasTables: boolean;
  missingTables?: string[];
  latencyMs?: number;
}

// SQL Script tạo cấu trúc cơ sở dữ liệu trên Supabase cho THCS Bản Bo
export const SUPABASE_SQL_SCHEMA = `-- ================================================================
-- HỆ THỐNG QUẢN LÝ SĨ SỐ VÀ BÁO CÁO HẰNG NGÀY - THCS BẢN BO
-- KỊCH BẢN TẠO BẢNG DỮ LIỆU TỰ ĐỘNG TRÊN SUPABASE (POSTGRESQL)
-- ================================================================

-- 1. Bảng cấu hình trường học
CREATE TABLE IF NOT EXISTS public.school_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_settings',
  school_name TEXT NOT NULL DEFAULT 'Trường THCS Bản Bo',
  academic_year TEXT NOT NULL DEFAULT '2026-2027',
  morning_cutoff_time TEXT DEFAULT '07:30',
  afternoon_cutoff_time TEXT DEFAULT '13:45',
  principal_name TEXT DEFAULT 'Hoàng Xuân Nhật',
  admin_name TEXT DEFAULT 'Phạm Ngọc Thúy',
  admin_title TEXT DEFAULT 'Tổng Phụ trách Đội',
  system_mode TEXT DEFAULT 'PRODUCTION',
  raw_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng tài khoản người dùng
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT DEFAULT '123456',
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  assigned_class_id TEXT,
  assigned_class_name TEXT,
  account_status TEXT DEFAULT 'ACTIVE',
  is_active BOOLEAN DEFAULT true,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng danh sách giáo viên
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  teacher_code TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  assigned_class_id TEXT,
  assigned_class_name TEXT,
  school_year_id TEXT DEFAULT '2026-2027',
  employment_status TEXT DEFAULT 'ACTIVE',
  account_status TEXT DEFAULT 'ACTIVE',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng danh mục lớp học (20 lớp)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL UNIQUE,
  grade INTEGER NOT NULL,
  room TEXT,
  head_teacher_id TEXT,
  head_teacher_name TEXT,
  head_teacher_phone TEXT,
  total_students INTEGER DEFAULT 0,
  male_count INTEGER DEFAULT 0,
  female_count INTEGER DEFAULT 0,
  boarding_count INTEGER DEFAULT 0,
  day_count INTEGER DEFAULT 0,
  non_boarding_count INTEGER DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Bảng danh sách học sinh
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  code TEXT,
  full_name TEXT NOT NULL,
  normalized_name TEXT,
  date_of_birth TEXT,
  gender TEXT DEFAULT 'UNSET',
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  boarding_type TEXT DEFAULT 'NON_BOARDING',
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  ethnic_group TEXT,
  status TEXT DEFAULT 'active',
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Bảng báo cáo sĩ số điểm danh (Theo ngày, buổi và lớp)
CREATE TABLE IF NOT EXISTS public.attendance_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  session TEXT NOT NULL DEFAULT 'MORNING',
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  teacher_id TEXT,
  teacher_name TEXT,
  total_students INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  absent_with_permission INTEGER DEFAULT 0,
  absent_without_permission INTEGER DEFAULT 0,
  present_boarding_count INTEGER DEFAULT 0,
  absent_boarding_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'APPROVED',
  submitted_at TEXT,
  submitted_by TEXT,
  approved_at TEXT,
  approved_by TEXT,
  notes TEXT,
  records JSONB,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Bảng thông báo hệ thống
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_user_id TEXT NOT NULL,
  recipient_role TEXT,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'NORMAL',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  class_id TEXT,
  class_name TEXT,
  date TEXT,
  session TEXT,
  is_read BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Bảng nhật ký thao tác (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  description TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tạo chỉ mục tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_reports_date_session ON public.attendance_reports(date, session);
CREATE INDEX IF NOT EXISTS idx_reports_class ON public.attendance_reports(class_id);

-- Cấu hình Row Level Security (RLS) để cho phép client ghi/đọc dữ liệu
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép truy cập đầy đủ (Public/Anon access)
DROP POLICY IF EXISTS "Cho phép truy cập settings" ON public.school_settings;
CREATE POLICY "Cho phép truy cập settings" ON public.school_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập users" ON public.users;
CREATE POLICY "Cho phép truy cập users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập teachers" ON public.teachers;
CREATE POLICY "Cho phép truy cập teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập classes" ON public.classes;
CREATE POLICY "Cho phép truy cập classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập students" ON public.students;
CREATE POLICY "Cho phép truy cập students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập attendance_reports" ON public.attendance_reports;
CREATE POLICY "Cho phép truy cập attendance_reports" ON public.attendance_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập notifications" ON public.notifications;
CREATE POLICY "Cho phép truy cập notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập audit_logs" ON public.audit_logs;
CREATE POLICY "Cho phép truy cập audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 9. Bảng báo cáo sĩ số tổng hợp theo ngày (Official Daily Reports)
CREATE TABLE IF NOT EXISTS public.daily_official_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  session TEXT NOT NULL DEFAULT 'MORNING',
  school_year_id TEXT DEFAULT '2026-2027',
  report_status TEXT DEFAULT 'PRELIMINARY',
  report_version INTEGER DEFAULT 1,
  total_students INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  finalized_at TEXT,
  finalized_by TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Bảng báo cáo định kỳ đã lưu (Tuần, Tháng, Học kỳ, Năm học)
CREATE TABLE IF NOT EXISTS public.period_reports (
  id TEXT PRIMARY KEY,
  period_type TEXT NOT NULL,
  period_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  school_year_id TEXT DEFAULT '2026-2027',
  session TEXT NOT NULL DEFAULT 'MORNING',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  report_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'SAVED',
  saved_at TEXT,
  saved_by TEXT,
  attendance_rate NUMERIC DEFAULT 100,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.daily_official_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép truy cập daily_official_reports" ON public.daily_official_reports;
CREATE POLICY "Cho phép truy cập daily_official_reports" ON public.daily_official_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép truy cập period_reports" ON public.period_reports;
CREATE POLICY "Cho phép truy cập period_reports" ON public.period_reports FOR ALL USING (true) WITH CHECK (true);
`;

class SupabaseService {
  private isOnline = false;
  private syncInProgress = false;

  constructor() {
    this.checkInitialConnection();
  }

  /**
   * Kiểm tra kết nối tới Supabase
   */
  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Gọi kiểm tra bảng classes
      const { data, error, status } = await supabase
        .from('classes')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        // Mã 42P01: relation "public.classes" does not exist (Bảng chưa tạo)
        if (error.code === '42P01' || error.message?.includes('does not exist') || status === 404) {
          this.isOnline = true;
          return {
            connected: true,
            hasTables: false,
            message: 'Đã kết nối thành công tới máy chủ Supabase, nhưng các bảng dữ liệu chưa được tạo trong SQL Editor.',
            latencyMs: latency,
          };
        }
        return {
          connected: false,
          hasTables: false,
          message: `Lỗi kết nối Supabase: ${error.message} (Code: ${error.code || status})`,
          latencyMs: latency,
        };
      }

      this.isOnline = true;
      return {
        connected: true,
        hasTables: true,
        message: 'Kết nối Supabase đang hoạt động xuất sắc! Cơ sở dữ liệu và bảng đã sẵn sàng.',
        latencyMs: latency,
      };
    } catch (err: any) {
      return {
        connected: false,
        hasTables: false,
        message: `Không thể kết nối tới ${SUPABASE_URL}: ${err?.message || 'Lỗi mạng hoặc CORS'}`,
      };
    }
  }

  private async checkInitialConnection() {
    try {
      const res = await this.testConnection();
      this.isOnline = res.connected;
      if (res.connected && res.hasTables) {
        // Tự động kiểm tra và đồng bộ nền
        this.pullFromSupabase();
      }
    } catch {
      this.isOnline = false;
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Đồng bộ toàn bộ dữ liệu từ máy cục bộ (LocalStorage) lên Supabase
   */
  public async pushAllToSupabase(): Promise<{ success: boolean; message: string; details?: any }> {
    if (this.syncInProgress) {
      return { success: false, message: 'Đang trong quá trình đồng bộ...' };
    }

    this.syncInProgress = true;
    try {
      // 1. Đồng bộ Lớp học
      const rawClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const classes: SchoolClass[] = rawClasses ? JSON.parse(rawClasses) : [];
      if (classes.length > 0) {
        const rows = classes.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          grade: c.grade,
          room: c.room || '',
          head_teacher_id: c.teacherId || null,
          head_teacher_name: c.teacherName || '',
          head_teacher_phone: c.teacherPhone || '',
          total_students: c.totalStudents || 0,
          male_count: c.maleCount || 0,
          female_count: c.femaleCount || 0,
          boarding_count: c.boardingCount || 0,
          day_count: c.dayCount || c.nonBoardingCount || 0,
          non_boarding_count: c.nonBoardingCount || 0,
          raw_data: c,
          updated_at: new Date().toISOString(),
        }));
        const { error: clsError } = await supabase.from('classes').upsert(rows, { onConflict: 'id' });
        if (clsError) throw new Error(`Lỗi đồng bộ lớp học: ${clsError.message}`);
      }

      // 2. Đồng bộ Học sinh
      const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const students: Student[] = rawStudents ? JSON.parse(rawStudents) : [];
      if (students.length > 0) {
        // Chia batch để tránh payload quá lớn
        const batchSize = 100;
        for (let i = 0; i < students.length; i += batchSize) {
          const slice = students.slice(i, i + batchSize);
          const rows = slice.map(s => ({
            id: s.id,
            code: s.code || s.studentCode || '',
            full_name: s.fullName,
            normalized_name: s.normalizedName || s.fullName || '',
            date_of_birth: s.dateOfBirth || '',
            gender: s.gender || 'UNSET',
            class_id: s.classId,
            class_name: s.className,
            grade: s.grade || 6,
            boarding_type: s.boardingType || 'NON_BOARDING',
            parent_name: s.parentName || '',
            parent_phone: s.parentPhone || '',
            address: s.address || '',
            ethnic_group: s.ethnicGroup || '',
            status: s.status || 'active',
            raw_data: s,
            updated_at: new Date().toISOString(),
          }));
          const { error: stuError } = await supabase.from('students').upsert(rows, { onConflict: 'id' });
          if (stuError) throw new Error(`Lỗi đồng bộ học sinh: ${stuError.message}`);
        }
      }

      // 3. Đồng bộ Báo cáo điểm danh
      const rawReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const reports: AttendanceReport[] = rawReports ? JSON.parse(rawReports) : [];
      if (reports.length === 0) {
        await supabase.from('attendance_reports').delete().neq('id', 'keep_none');
      }
      if (reports.length > 0) {
        const rows = reports.map(r => ({
          id: r.id,
          date: r.date,
          session: r.session || 'MORNING',
          class_id: r.classId,
          class_name: r.className,
          grade: r.grade || 6,
          teacher_id: r.teacherId || '',
          teacher_name: r.teacherName || '',
          total_students: r.totalStudents || 0,
          present_count: r.presentCount || 0,
          absent_count: r.absentCount || 0,
          absent_with_permission: r.excusedAbsentCount || 0,
          absent_without_permission: r.unexcusedAbsentCount || 0,
          present_boarding_count: r.boardingPresent || 0,
          absent_boarding_count: r.boardingAbsent || 0,
          status: r.status || 'APPROVED',
          submitted_at: r.submittedAt || null,
          submitted_by: r.submittedBy || '',
          approved_at: r.approvedAt || null,
          approved_by: r.approvedBy || '',
          notes: r.notes || '',
          records: r.records || [],
          raw_data: r,
          updated_at: new Date().toISOString(),
        }));
        const { error: repError } = await supabase.from('attendance_reports').upsert(rows, { onConflict: 'id' });
        if (repError) throw new Error(`Lỗi đồng bộ báo cáo: ${repError.message}`);
      }

      // 4. Đồng bộ Cài đặt trường học
      const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (rawSettings) {
        const settings: SchoolSettings = JSON.parse(rawSettings);
        await supabase.from('school_settings').upsert({
          id: 'current_settings',
          school_name: settings.schoolName || 'Trường THCS Bản Bo',
          academic_year: settings.schoolYear || '2026-2027',
          morning_cutoff_time: settings.morningDeadlineTime || '07:20',
          afternoon_cutoff_time: settings.afternoonDeadlineTime || '13:45',
          principal_name: settings.principalName || 'Hoàng Xuân Nhật',
          admin_name: settings.adminName || 'Phạm Ngọc Thúy',
          admin_title: settings.adminTitle || 'Tổng Phụ trách Đội',
          system_mode: settings.systemMode || 'PRODUCTION',
          raw_data: settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      // 5. Đồng bộ Người dùng
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const users: User[] = rawUsers ? JSON.parse(rawUsers) : [];
      if (users.length > 0) {
        const rows = users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          password: u.password || '123456',
          name: u.name,
          role: u.role,
          title: u.title || '',
          phone: u.phone || '',
          assigned_class_id: u.assignedClassId || null,
          assigned_class_name: u.assignedClassName || null,
          account_status: u.accountStatus || 'ACTIVE',
          is_active: u.isActive !== false,
          raw_data: u,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('users').upsert(rows, { onConflict: 'id' });
      }

      // 6. Đồng bộ Báo cáo ngày chính thức & Báo cáo định kỳ (Tuần, Tháng, Học kỳ, Năm học) nếu bảng tồn tại
      const rawDailyOfficial = localStorage.getItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
      const dailyOfficialList: SchoolDailyReport[] = rawDailyOfficial ? JSON.parse(rawDailyOfficial) : [];
      if (dailyOfficialList.length > 0) {
        try {
          const rows = dailyOfficialList.map(d => ({
            id: d.id,
            date: d.date,
            session: normalizeSession(d.session),
            school_year_id: d.schoolYearId || '2026-2027',
            report_status: d.reportStatus || 'PRELIMINARY',
            report_version: d.reportVersion || 1,
            total_students: d.totalStudentsSnapshot ?? d.totalStudents ?? 0,
            present_count: d.presentCount || 0,
            absent_count: d.absentCount || 0,
            finalized_at: d.finalizedAt || null,
            finalized_by: d.finalizedBy || '',
            raw_data: d,
            updated_at: new Date().toISOString(),
          }));
          await supabase.from('daily_official_reports').upsert(rows, { onConflict: 'id' });
        } catch {
          // Bảng tùy chọn có thể chưa được tạo trên Supabase
        }
      }

      const rawPeriodReports = localStorage.getItem(STORAGE_KEYS.PERIOD_REPORTS);
      const periodReportsList: SavedPeriodReport[] = rawPeriodReports ? JSON.parse(rawPeriodReports) : [];
      if (periodReportsList.length > 0) {
        try {
          const rows = periodReportsList.map(p => ({
            id: p.id,
            period_type: p.periodType,
            period_key: p.periodKey,
            title: p.title,
            school_year_id: p.schoolYearId || '2026-2027',
            session: normalizeSession(p.session),
            start_date: p.startDate,
            end_date: p.endDate,
            report_version: p.reportVersion || 1,
            status: p.status || 'SAVED',
            saved_at: p.savedAt,
            saved_by: p.savedBy,
            attendance_rate: p.attendanceRate || 0,
            raw_data: p,
            updated_at: new Date().toISOString(),
          }));
          await supabase.from('period_reports').upsert(rows, { onConflict: 'id' });
        } catch {
          // Bảng tùy chọn có thể chưa được tạo trên Supabase
        }
      }

      return {
        success: true,
        message: `Đồng bộ thành công lên Supabase: ${classes.length} lớp, ${students.length} học sinh, ${users.length} tài khoản, ${reports.length} báo cáo lớp, ${dailyOfficialList.length} báo cáo ngày, ${periodReportsList.length} báo cáo định kỳ!`,
        details: {
          classesCount: classes.length,
          studentsCount: students.length,
          usersCount: users.length,
          reportsCount: reports.length,
          dailyOfficialCount: dailyOfficialList.length,
          periodReportsCount: periodReportsList.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Có lỗi khi đồng bộ lên Supabase',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Tải dữ liệu từ Supabase về LocalStorage
   */
  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const demoTeacherNames = [
        'Nguyễn Văn An', 'Lò Thị Mai', 'Trần Thị Thu', 'Hoàng Văn Bình', 'Điêu Văn Tiến',
        'Trần Quốc Hưng', 'Hoàng Thị Lan', 'Lò Văn Chiến', 'Nông Thị Thảo', 'Đèo Văn Nam',
        'Vàng A Tủa', 'Lê Thị Hồng', 'Lý A Sùng', 'Nguyễn Thị Ngọc', 'Hà Văn Dũng',
        'Đặng Minh Tuấn', 'Nùng Thị Hoa', 'Vũ Đình Trọng', 'Mai Thị Hằng', 'Tạ Văn Quyết'
      ];

      // 1. Lấy lớp học
      const { data: clsData, error: clsErr } = await supabase.from('classes').select('*');
      if (!clsErr && clsData && clsData.length > 0) {
        let classes = clsData.map(c => {
          const raw = c.raw_data || {};
          const headTeacherName = c.head_teacher_name || raw.teacherName || '';
          const isDemo = headTeacherName && demoTeacherNames.includes(headTeacherName);
          const teacherName = isDemo ? 'Chưa phân công' : (headTeacherName || 'Chưa phân công');
          const teacherId = isDemo ? undefined : (c.head_teacher_id || raw.teacherId);
          const teacherPhone = isDemo ? undefined : (c.head_teacher_phone || raw.teacherPhone);
          return {
            ...raw,
            id: c.id,
            code: c.code || raw.code,
            name: c.name || raw.name,
            grade: c.grade || raw.grade,
            room: c.room || raw.room,
            isActive: raw.isActive !== false,
            teacherId,
            teacherName,
            teacherPhone,
            totalStudents: c.total_students ?? raw.totalStudents ?? 0,
            boardingCount: c.boarding_count ?? raw.boardingCount ?? 0,
            dayCount: c.day_count ?? raw.dayCount ?? 0,
          };
        });
        if (classes.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
          localStorage.setItem('thcs_banbo_classes', JSON.stringify(classes));
        }
      }

      // 1.5. Lấy hồ sơ giáo viên
      const { data: tchData, error: tchErr } = await supabase.from('teachers').select('*');
      if (!tchErr && tchData && tchData.length > 0) {
        const remoteTeachers = tchData
          .map(t => {
            const raw = t.raw_data || {};
            return {
              ...raw,
              id: t.id,
              teacherCode: t.teacher_code || raw.teacherCode,
              fullName: t.full_name || raw.fullName,
              email: t.email || raw.email,
              phone: t.phone || raw.phone,
              role: t.role || raw.role || 'HEAD_TEACHER',
              assignedClassId: t.assigned_class_id || raw.assignedClassId,
              assignedClassName: t.assigned_class_name || raw.assignedClassName,
              employmentStatus: t.employment_status || raw.employmentStatus || 'ACTIVE',
              accountStatus: t.account_status || raw.accountStatus || 'ACTIVE',
              schoolYearId: t.school_year_id || raw.schoolYearId || '2026-2027',
            };
          })
          .filter(t => !demoTeacherNames.includes(t.fullName));
        if (remoteTeachers.length > 0) {
          localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(remoteTeachers));
          localStorage.setItem('thcs_banbo_teachers', JSON.stringify(remoteTeachers));
        }
      }

      // 2. Lấy danh sách học sinh đầy đủ từ Supabase
      const { data: stuData, error: stuErr } = await supabase.from('students').select('*');
      if (!stuErr && stuData && stuData.length > 0) {
        const students: Student[] = stuData.map(s => {
          if (s.raw_data && typeof s.raw_data === 'object' && Object.keys(s.raw_data).length > 0) {
            return {
              ...s.raw_data,
              id: s.id || s.raw_data.id,
              code: s.code || s.raw_data.code || '',
              studentCode: s.code || s.raw_data.studentCode || '',
              fullName: s.full_name || s.raw_data.fullName,
              normalizedName: s.normalized_name || s.raw_data.normalizedName || s.full_name,
              dateOfBirth: s.date_of_birth || s.raw_data.dateOfBirth || '',
              gender: s.gender || s.raw_data.gender || 'UNSET',
              classId: s.class_id || s.raw_data.classId,
              className: s.class_name || s.raw_data.className,
              grade: s.grade || s.raw_data.grade || 6,
              boardingType: s.boarding_type || s.raw_data.boardingType || 'NON_BOARDING',
              studentType: (s.boarding_type === 'BOARDING' || s.raw_data.boardingType === 'BOARDING') ? 'boarding' : 'day',
              status: s.status || s.raw_data.status || 'active',
              parentName: s.parent_name || s.raw_data.parentName || '',
              parentPhone: s.parent_phone || s.raw_data.parentPhone || '',
              address: s.address || s.raw_data.address || '',
              isDemo: false,
              source: s.raw_data.source || 'EXCEL_IMPORT',
            };
          }
          return {
            id: s.id,
            code: s.code || `HS-${s.class_name}-${s.id}`,
            studentCode: s.code || `HS-${s.class_name}-${s.id}`,
            fullName: s.full_name,
            normalizedName: s.normalized_name || s.full_name,
            dateOfBirth: s.date_of_birth || '2014-01-01',
            gender: s.gender || 'UNSET',
            classId: s.class_id,
            className: s.class_name,
            grade: s.grade || 6,
            boardingType: s.boarding_type || 'NON_BOARDING',
            studentType: s.boarding_type === 'BOARDING' ? 'boarding' : 'day',
            parentName: s.parent_name || '',
            parentPhone: s.parent_phone || '',
            address: s.address || '',
            ethnicGroup: s.ethnic_group || 'Thái',
            status: s.status || 'active',
            schoolYearId: '2026-2027',
            source: 'EXCEL_IMPORT',
            isDemo: false,
            createdAt: s.created_at || new Date().toISOString(),
          };
        }).filter(s => {
          if (!s) return false;
          if (s.isDemo === true) return false;
          if (s.source === 'DEMO') return false;
          if (s.id && (s.id.startsWith('stu_banbo_') || /^stu_[6-9]a[1-5]_\d{2}$/.test(s.id))) return false;
          if (isBlacklistedStudent(s)) return false;
          return true;
        });

        if (students.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
          localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
          localStorage.setItem('thcs_banbo_dataset_status', 'ACTIVE_DATASET');
          localStorage.removeItem('thcs_banbo_all_students_deleted_by_user');

          // Cập nhật lại số lượng học sinh trong 20 lớp chính thức
          const rawCls = localStorage.getItem(STORAGE_KEYS.CLASSES);
          if (rawCls) {
            try {
              const currentClasses: any[] = JSON.parse(rawCls);
              const updatedClasses = currentClasses.map(c => {
                const clsStudents = students.filter(
                  stu => (stu.className === c.name || stu.classId === c.id) && stu.status === 'active'
                );
                return {
                  ...c,
                  totalStudents: clsStudents.length > 0 ? clsStudents.length : c.totalStudents,
                  boardingCount: clsStudents.filter(stu => stu.boardingType === 'BOARDING').length,
                  nonBoardingCount: clsStudents.filter(stu => stu.boardingType !== 'BOARDING').length,
                  dayCount: clsStudents.filter(stu => stu.boardingType !== 'BOARDING').length,
                  maleCount: clsStudents.filter(stu => stu.gender === 'male').length,
                  femaleCount: clsStudents.filter(stu => stu.gender === 'female').length,
                };
              });
              localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
              localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));
            } catch {
              // ignore
            }
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
            window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));
          }
        }
      }

      // 3. Lấy báo cáo điểm danh (Hợp nhất thay vì ghi đè để không làm mất báo cáo mới lưu cục bộ)
      const { data: repData, error: repErr } = await supabase.from('attendance_reports').select('raw_data');
      if (!repErr && repData && repData.length > 0) {
        let remoteReports = repData.map(r => r.raw_data).filter(Boolean);
        remoteReports = remoteReports.map(r => {
          if (r.records && Array.isArray(r.records)) {
            const initialLen = r.records.length;
            r.records = r.records.filter((rec: any) => !isBlacklistedStudent(rec));
            if (r.records.length !== initialLen) {
              r.totalStudents = r.records.length;
              r.presentCount = r.records.filter((rec: any) => rec.status === 'PRESENT').length;
              r.absentCount = r.records.filter((rec: any) => rec.status !== 'PRESENT').length;
              r.boardingPresent = r.records.filter((rec: any) => rec.boardingType === 'BOARDING' && rec.status === 'PRESENT').length;
              r.boardingTotal = r.records.filter((rec: any) => rec.boardingType === 'BOARDING').length;
            }
          }
          if (
            (r.teacherName && demoTeacherNames.includes(r.teacherName)) ||
            (r.submittedBy && demoTeacherNames.includes(r.submittedBy))
          ) {
            return {
              ...r,
              teacherId: '',
              teacherName: 'Chưa phân công',
              submittedBy: 'Chưa phân công',
            };
          }
          return r;
        });

        if (remoteReports.length > 0) {
          const rawLocal = localStorage.getItem(STORAGE_KEYS.REPORTS);
          const localReports: AttendanceReport[] = rawLocal ? JSON.parse(rawLocal) : [];
          const mergedMap = new Map<string, AttendanceReport>();

          const getKey = (rep: AttendanceReport) =>
            `${rep.date}_${(rep.classId || rep.className || '').toLowerCase()}_${normalizeSession(rep.session)}`;
          const statusRank = (s?: string) => {
            const up = String(s || '').toUpperCase();
            if (up === 'LOCKED') return 5;
            if (up === 'APPROVED') return 4;
            if (up === 'PENDING_APPROVAL' || up === 'SUBMITTED') return 3;
            if (up === 'REVISION_REQUIRED' || up === 'NEEDS_REVISION') return 2;
            return 1;
          };

          for (const lr of localReports) {
            mergedMap.set(getKey(lr), lr);
          }
          for (const rr of remoteReports) {
            const k = getKey(rr);
            const existing = mergedMap.get(k);
            if (!existing) {
              mergedMap.set(k, rr);
            } else {
              const localTime = Date.parse(existing.updatedAt || '') || 0;
              const remoteTime = Date.parse(rr.updatedAt || '') || 0;
              if (remoteTime > localTime || (remoteTime === localTime && statusRank(rr.status) > statusRank(existing.status))) {
                mergedMap.set(k, rr);
              }
            }
          }

          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(Array.from(mergedMap.values())));
        }
      }

      // 3.5. Lấy báo cáo tổng hợp ngày & báo cáo định kỳ nếu bảng tồn tại trên Supabase
      try {
        const { data: dailyOffData, error: dailyOffErr } = await supabase.from('daily_official_reports').select('raw_data');
        if (!dailyOffErr && dailyOffData && dailyOffData.length > 0) {
          const remoteDaily: SchoolDailyReport[] = dailyOffData.map(d => d.raw_data).filter(Boolean);
          const rawLocalDaily = localStorage.getItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS);
          const localDaily: SchoolDailyReport[] = rawLocalDaily ? JSON.parse(rawLocalDaily) : [];
          const map = new Map<string, SchoolDailyReport>();
          for (const item of localDaily) {
            map.set(`${item.date}_${normalizeSession(item.session)}`, item);
          }
          for (const item of remoteDaily) {
            const key = `${item.date}_${normalizeSession(item.session)}`;
            const existing = map.get(key);
            if (!existing || (item.reportVersion || 1) > (existing.reportVersion || 1) || (item.updatedAt || '') > (existing.updatedAt || '')) {
              map.set(key, item);
            }
          }
          localStorage.setItem(STORAGE_KEYS.DAILY_OFFICIAL_REPORTS, JSON.stringify(Array.from(map.values())));
        }
      } catch {
        // Bỏ qua nếu bảng chưa tồn tại
      }

      try {
        const { data: periodData, error: periodErr } = await supabase.from('period_reports').select('raw_data');
        if (!periodErr && periodData && periodData.length > 0) {
          const remotePeriod: SavedPeriodReport[] = periodData.map(p => p.raw_data).filter(Boolean);
          const rawLocalPeriod = localStorage.getItem(STORAGE_KEYS.PERIOD_REPORTS);
          const localPeriod: SavedPeriodReport[] = rawLocalPeriod ? JSON.parse(rawLocalPeriod) : [];
          const map = new Map<string, SavedPeriodReport>();
          for (const item of localPeriod) {
            map.set(item.periodKey || item.id, item);
          }
          for (const item of remotePeriod) {
            const key = item.periodKey || item.id;
            const existing = map.get(key);
            if (!existing || (item.reportVersion || 1) > (existing.reportVersion || 1) || (item.updatedAt || '') > (existing.updatedAt || '')) {
              map.set(key, item);
            }
          }
          localStorage.setItem(STORAGE_KEYS.PERIOD_REPORTS, JSON.stringify(Array.from(map.values())));
        }
      } catch {
        // Bỏ qua nếu bảng chưa tồn tại
      }

      // 4. Lấy cài đặt
      const { data: setData } = await supabase.from('school_settings').select('raw_data').eq('id', 'current_settings').single();
      if (setData?.raw_data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(setData.raw_data));
      }

      // 5. Lấy tài khoản người dùng
      const { data: usrData, error: usrErr } = await supabase.from('users').select('*');
      if (!usrErr && usrData && usrData.length > 0) {
        const remoteUsers: User[] = usrData
          .map(u => {
            const raw = u.raw_data || {};
            return {
              ...raw,
              id: u.id,
              username: u.username || raw.username,
              name: u.name || raw.name,
              fullName: u.name || raw.fullName || raw.name,
              email: u.email || raw.email,
              password: u.password || raw.password,
              role: u.role || raw.role,
              title: u.title || raw.title,
              phone: u.phone || raw.phone,
              assignedClassId: u.assigned_class_id || raw.assignedClassId,
              assignedClassName: u.assigned_class_name || raw.assignedClassName,
              accountStatus: u.account_status || raw.accountStatus || 'ACTIVE',
              isActive: u.is_active !== false,
            };
          })
          .filter(Boolean)
          .filter(u => {
            if (u.id.startsWith('user_gv6') || u.id.startsWith('user_gv7') || u.id.startsWith('user_gv8') || u.id.startsWith('user_gv9')) return false;
            if (demoTeacherNames.includes(u.name || '') || demoTeacherNames.includes(u.fullName || '')) return false;
            return true;
          });
        if (remoteUsers.length > 0) {
          const raw = localStorage.getItem(STORAGE_KEYS.USERS);
          const localUsers: User[] = raw ? JSON.parse(raw) : [];
          const map = new Map<string, User>();
          localUsers.forEach(u => map.set(u.id, u));
          remoteUsers.forEach(u => map.set(u.id, u));
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(map.values())));
        }
      }

      // Đồng bộ thông tin GVCN vào classes
      try {
        const rawCls = localStorage.getItem(STORAGE_KEYS.CLASSES);
        const rawUsrs = localStorage.getItem(STORAGE_KEYS.USERS);
        const rawTchs = localStorage.getItem(STORAGE_KEYS.TEACHERS);
        if (rawCls && rawUsrs) {
          let clss: SchoolClass[] = JSON.parse(rawCls);
          const usrs: User[] = JSON.parse(rawUsrs);
          const tchs: any[] = rawTchs ? JSON.parse(rawTchs) : [];
          clss = clss.map(cls => {
            const clsNameNorm = cls.name.trim().toUpperCase();
            const clsIdNorm = cls.id.trim().toLowerCase();
            const u = usrs.find(usr => {
              if (usr.accountStatus === 'LOCKED' || usr.isActive === false) return false;
              const uClass = (usr.assignedClassName || '').trim().toUpperCase();
              const uClassId = (usr.assignedClassId || '').trim().toLowerCase();
              return (
                (uClass && (uClass === clsNameNorm || `LỚP ${uClass}` === clsNameNorm)) ||
                (uClassId && (uClassId === clsIdNorm || uClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
                (cls.teacherId && (usr.id === cls.teacherId || usr.teacherId === cls.teacherId))
              );
            });
            const t = !u ? tchs.find(tch => {
              const tClass = (tch.assignedClassName || '').trim().toUpperCase();
              const tClassId = (tch.assignedClassId || '').trim().toLowerCase();
              return (
                (tClass && (tClass === clsNameNorm || `LỚP ${tClass}` === clsNameNorm)) ||
                (tClassId && (tClassId === clsIdNorm || tClassId === `cls_${clsNameNorm.toLowerCase()}`)) ||
                (cls.teacherId && tch.id === cls.teacherId)
              );
            }) : null;
            if (u) {
              return {
                ...cls,
                teacherId: u.id,
                teacherName: u.fullName || u.name,
                teacherPhone: u.phone || cls.teacherPhone,
              };
            } else if (t) {
              return {
                ...cls,
                teacherId: t.id,
                teacherName: t.fullName,
                teacherPhone: t.phone || cls.teacherPhone,
              };
            }
            return cls;
          });
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(clss));
          localStorage.setItem('thcs_banbo_classes', JSON.stringify(clss));
        }
      } catch {
        // ignore
      }

      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      return { success: true, message: 'Đã tải dữ liệu mới nhất từ Supabase về hệ thống!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể lấy dữ liệu từ Supabase' };
    }
  }

  /**
   * Lưu hoặc cập nhật một học sinh lên Supabase ngay lập tức
   */
  public async saveStudentToSupabase(student: Student): Promise<boolean> {
    try {
      if (!student || isBlacklistedStudent(student)) return false;
      const row = {
        id: student.id,
        code: student.code || student.studentCode || '',
        full_name: student.fullName,
        normalized_name: student.normalizedName || student.fullName || '',
        date_of_birth: student.dateOfBirth || '',
        gender: student.gender || 'UNSET',
        class_id: student.classId,
        class_name: student.className,
        grade: student.grade || 6,
        boarding_type: student.boardingType || 'NON_BOARDING',
        parent_name: student.parentName || '',
        parent_phone: student.parentPhone || '',
        address: student.address || '',
        ethnic_group: student.ethnicGroup || '',
        status: student.status || 'active',
        raw_data: student,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('students').upsert([row], { onConflict: 'id' });
      if (error) {
        console.warn('Lỗi lưu học sinh lên Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Lỗi kết nối Supabase khi lưu học sinh:', err);
      return false;
    }
  }

  /**
   * Lưu danh sách học sinh theo lô lên Supabase
   */
  public async saveStudentsBatchToSupabase(students: Student[]): Promise<boolean> {
    try {
      if (!students || students.length === 0) return true;
      const validStudents = students.filter(s => !isBlacklistedStudent(s));
      if (validStudents.length === 0) return true;
      const batchSize = 100;
      for (let i = 0; i < validStudents.length; i += batchSize) {
        const chunk = validStudents.slice(i, i + batchSize);
        const rows = chunk.map(s => ({
          id: s.id,
          code: s.code || s.studentCode || '',
          full_name: s.fullName,
          normalized_name: s.normalizedName || s.fullName || '',
          date_of_birth: s.dateOfBirth || '',
          gender: s.gender || 'UNSET',
          class_id: s.classId,
          class_name: s.className,
          grade: s.grade || 6,
          boarding_type: s.boardingType || 'NON_BOARDING',
          parent_name: s.parentName || '',
          parent_phone: s.parentPhone || '',
          address: s.address || '',
          ethnic_group: s.ethnicGroup || '',
          status: s.status || 'active',
          raw_data: s,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from('students').upsert(rows, { onConflict: 'id' });
        if (error) {
          console.warn('Lỗi batch học sinh lên Supabase:', error.message);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('Lỗi kết nối Supabase khi batch học sinh:', err);
      return false;
    }
  }

  /**
   * Xóa một học sinh khỏi Supabase
   */
  public async deleteStudentFromSupabase(studentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) {
        console.warn('Lỗi xóa học sinh trên Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Lỗi kết nối Supabase khi xóa học sinh:', err);
      return false;
    }
  }

  /**
   * Xóa toàn bộ học sinh trên Supabase (chỉ dùng khi người dùng chủ động bấm Xóa tất cả học sinh)
   */
  public async deleteAllStudentsFromSupabase(): Promise<boolean> {
    try {
      const { error } = await supabase.from('students').delete().neq('id', 'keep_none');
      if (error) {
        console.warn('Lỗi xóa tất cả học sinh trên Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Lỗi kết nối Supabase khi xóa tất cả học sinh:', err);
      return false;
    }
  }

  /**
   * Lưu hoặc cập nhật một lớp học lên Supabase
   */
  public async saveClassToSupabase(cls: SchoolClass): Promise<boolean> {
    try {
      const row = {
        id: cls.id,
        code: cls.code || cls.name,
        name: cls.name,
        grade: cls.grade,
        room: cls.room || '',
        head_teacher_id: cls.teacherId || null,
        head_teacher_name: cls.teacherName || '',
        head_teacher_phone: cls.teacherPhone || '',
        total_students: cls.totalStudents || 0,
        male_count: cls.maleCount || 0,
        female_count: cls.femaleCount || 0,
        boarding_count: cls.boardingCount || 0,
        day_count: cls.dayCount || cls.nonBoardingCount || 0,
        non_boarding_count: cls.nonBoardingCount || 0,
        raw_data: cls,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('classes').upsert([row], { onConflict: 'id' });
      return !error;
    } catch (err) {
      return false;
    }
  }

  /**
   * Lưu nhanh một báo cáo sĩ số lên Supabase
   */
  public async saveReportToSupabase(report: AttendanceReport) {
    try {
      await supabase.from('attendance_reports').upsert({
        id: report.id,
        date: report.date,
        session: report.session || 'MORNING',
        class_id: report.classId,
        class_name: report.className,
        grade: report.grade || 6,
        teacher_id: report.teacherId || '',
        teacher_name: report.teacherName || '',
        total_students: report.totalStudents || 0,
        present_count: report.presentCount || 0,
        absent_count: report.absentCount || 0,
        absent_with_permission: report.excusedAbsentCount || 0,
        absent_without_permission: report.unexcusedAbsentCount || 0,
        present_boarding_count: report.boardingPresent || 0,
        absent_boarding_count: report.boardingAbsent || 0,
        status: report.status || 'APPROVED',
        submitted_at: report.submittedAt || null,
        submitted_by: report.submittedBy || '',
        approved_at: report.approvedAt || null,
        approved_by: report.approvedBy || '',
        notes: report.notes || '',
        records: report.records || [],
        raw_data: report,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Lưu Supabase nền không thành công:', err);
    }
  }

  /**
   * Lưu báo cáo tổng hợp ngày (SchoolDailyReport) lên Supabase nếu bảng tồn tại
   */
  public async saveDailyOfficialReportToSupabase(report: SchoolDailyReport) {
    try {
      await supabase.from('daily_official_reports').upsert({
        id: report.id,
        date: report.date,
        session: normalizeSession(report.session),
        school_year_id: report.schoolYearId || '2026-2027',
        report_status: report.reportStatus || 'PRELIMINARY',
        report_version: report.reportVersion || 1,
        total_students: report.totalStudentsSnapshot ?? report.totalStudents ?? 0,
        present_count: report.presentCount || 0,
        absent_count: report.absentCount || 0,
        finalized_at: report.finalizedAt || null,
        finalized_by: report.finalizedBy || '',
        raw_data: report,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {
      // Bảng tùy chọn chưa tạo trên Supabase - bỏ qua an toàn
    }
  }

  public async deleteDailyOfficialReportFromSupabase(id: string) {
    try {
      await supabase.from('daily_official_reports').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  /**
   * Lưu báo cáo định kỳ (Tuần, Tháng, Học kỳ, Năm học) lên Supabase nếu bảng tồn tại
   */
  public async savePeriodReportToSupabase(report: SavedPeriodReport) {
    try {
      await supabase.from('period_reports').upsert({
        id: report.id,
        period_type: report.periodType,
        period_key: report.periodKey,
        title: report.title,
        school_year_id: report.schoolYearId || '2026-2027',
        session: normalizeSession(report.session),
        start_date: report.startDate,
        end_date: report.endDate,
        report_version: report.reportVersion || 1,
        status: report.status || 'SAVED',
        saved_at: report.savedAt,
        saved_by: report.savedBy,
        attendance_rate: report.attendanceRate || 0,
        raw_data: report,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch {
      // Bảng tùy chọn chưa tạo trên Supabase - bỏ qua an toàn
    }
  }

  public async deletePeriodReportFromSupabase(id: string) {
    try {
      await supabase.from('period_reports').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  /**
   * Lắng nghe thay đổi dữ liệu thời gian thực từ Supabase
   */
  public subscribeToRealtimeChanges(onReportChange?: () => void) {
    try {
      const channel = supabase
        .channel('thcs_banbo_realtime_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance_reports' },
          (payload) => {
            if (payload.new && (payload.new as any).raw_data) {
              const updatedReport: AttendanceReport = (payload.new as any).raw_data;
              const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
              let reports: AttendanceReport[] = raw ? JSON.parse(raw) : [];
              const idx = reports.findIndex(r => r.id === updatedReport.id);
              if (idx >= 0) {
                reports[idx] = updatedReport;
              } else {
                reports.push(updatedReport);
              }
              localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
              window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
              if (onReportChange) onReportChange();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'students' },
          (payload) => {
            const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
            let students: Student[] = raw ? JSON.parse(raw) : [];
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const rec = payload.new as any;
              const studentObj: Student = rec.raw_data || {
                id: rec.id,
                code: rec.code,
                fullName: rec.full_name,
                normalizedName: rec.normalized_name || rec.full_name,
                dateOfBirth: rec.date_of_birth,
                gender: rec.gender,
                classId: rec.class_id,
                className: rec.class_name,
                grade: rec.grade,
                boardingType: rec.boarding_type,
                parentName: rec.parent_name,
                parentPhone: rec.parent_phone,
                address: rec.address,
                ethnicGroup: rec.ethnic_group,
                status: rec.status,
              };
              const idx = students.findIndex(s => s.id === studentObj.id);
              if (idx >= 0) {
                students[idx] = studentObj;
              } else {
                students.push(studentObj);
              }
            } else if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as any)?.id;
              if (oldId) {
                students = students.filter(s => s.id !== oldId);
              }
            }
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
            localStorage.setItem('thcs_banbo_students', JSON.stringify(students));
            window.dispatchEvent(new CustomEvent('thcs_banbo_students_changed'));
            window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Không thể khởi tạo Supabase Realtime channel:', err);
      return () => {};
    }
  }
}

export const supabaseService = new SupabaseService();
