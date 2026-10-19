import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from './storageService';
import { Student, SchoolClass, AttendanceReport, User, SchoolSettings, AuditLog } from '../types';

// Chuẩn hóa URL (loại bỏ /rest/v1/ hoặc dấu / thừa ở cuối)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mqegeosjfggffvbuclgv.supabase.co';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xNZJ80X6ypukLS1tI-uZQQ_Zzq8Qnme';

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
            normalized_name: s.normalizedName || '',
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

      return {
        success: true,
        message: `Đồng bộ thành công lên Supabase: ${classes.length} lớp, ${students.length} học sinh, ${users.length} tài khoản, ${reports.length} báo cáo sĩ số!`,
        details: {
          classesCount: classes.length,
          studentsCount: students.length,
          usersCount: users.length,
          reportsCount: reports.length,
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
      // 1. Lấy lớp học
      const { data: clsData, error: clsErr } = await supabase.from('classes').select('raw_data');
      if (!clsErr && clsData && clsData.length > 0) {
        const classes = clsData.map(c => c.raw_data).filter(Boolean);
        if (classes.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
        }
      }

      // 2. Lấy học sinh
      const { data: stuData, error: stuErr } = await supabase.from('students').select('raw_data');
      if (!stuErr && stuData && stuData.length > 0) {
        const students = stuData.map(s => s.raw_data).filter(Boolean);
        if (students.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        }
      }

      // 3. Lấy báo cáo điểm danh
      const { data: repData, error: repErr } = await supabase.from('attendance_reports').select('raw_data');
      if (!repErr && repData && repData.length > 0) {
        const reports = repData.map(r => r.raw_data).filter(Boolean);
        if (reports.length > 0) {
          localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        }
      }

      // 4. Lấy cài đặt
      const { data: setData } = await supabase.from('school_settings').select('raw_data').eq('id', 'current_settings').single();
      if (setData?.raw_data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(setData.raw_data));
      }

      // 5. Lấy tài khoản người dùng
      const { data: usrData, error: usrErr } = await supabase.from('users').select('raw_data');
      if (!usrErr && usrData && usrData.length > 0) {
        const remoteUsers: User[] = usrData.map(u => u.raw_data).filter(Boolean);
        if (remoteUsers.length > 0) {
          const raw = localStorage.getItem(STORAGE_KEYS.USERS);
          const localUsers: User[] = raw ? JSON.parse(raw) : [];
          const map = new Map<string, User>();
          localUsers.forEach(u => map.set(u.id, u));
          remoteUsers.forEach(u => map.set(u.id, u));
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(map.values())));
        }
      }

      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      return { success: true, message: 'Đã tải dữ liệu mới nhất từ Supabase về hệ thống!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể lấy dữ liệu từ Supabase' };
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
   * Lắng nghe thay đổi dữ liệu thời gian thực từ Supabase
   */
  public subscribeToRealtimeChanges(onReportChange?: () => void) {
    try {
      const channel = supabase
        .channel('thcs_banbo_attendance_channel')
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
