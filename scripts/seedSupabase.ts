import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  generateInitialReports,
  INITIAL_AUDIT_LOGS,
} from '../src/data/initialSeedData';
import { DEFAULT_SETTINGS } from '../src/config/constants';

const url = 'https://mqegeosjfggffvbuclgv.supabase.co';
const key = 'sb_publishable_xNZJ80X6ypukLS1tI-uZQQ_Zzq8Qnme';
const supabase = createClient(url, key);

async function seed() {
  console.log('--- BẮT ĐẦU NẠP DỮ LIỆU LÊN SUPABASE ---');

  // 1. Cài đặt trường học (school_settings)
  console.log('1. Đang nạp bảng school_settings...');
  const settingsRow = {
    id: 'current_settings',
    school_name: DEFAULT_SETTINGS.schoolName || 'Trường THCS Bản Bo',
    academic_year: DEFAULT_SETTINGS.schoolYear || '2026-2027',
    morning_cutoff_time: DEFAULT_SETTINGS.morningDeadlineTime || '07:20',
    afternoon_cutoff_time: DEFAULT_SETTINGS.afternoonDeadlineTime || '13:45',
    principal_name: DEFAULT_SETTINGS.principalName || 'Hoàng Xuân Nhật',
    admin_name: DEFAULT_SETTINGS.adminName || 'Phạm Ngọc Thúy',
    admin_title: DEFAULT_SETTINGS.adminTitle || 'Tổng Phụ trách Đội',
    system_mode: 'PRODUCTION',
    raw_data: DEFAULT_SETTINGS,
    updated_at: new Date().toISOString(),
  };
  const { error: setErr } = await supabase.from('school_settings').upsert(settingsRow, { onConflict: 'id' });
  if (setErr) console.error('Lỗi settings:', setErr.message);
  else console.log('✓ Cài đặt trường học: Thành công');

  // 2. Tài khoản người dùng chính thức (users - 3 tài khoản BGH & Quản trị)
  console.log('2. Đang nạp bảng users (3 tài khoản chính thức)...');
  const userRows = INITIAL_USERS.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    password: u.password || '123456',
    name: u.fullName || u.name,
    role: u.role,
    title: u.title || '',
    phone: u.phone || '',
    assigned_class_id: null,
    assigned_class_name: null,
    account_status: 'ACTIVE',
    is_active: true,
    raw_data: { ...u, password: u.password || '123456' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const { error: userErr } = await supabase.from('users').upsert(userRows, { onConflict: 'id' });
  if (userErr) console.error('Lỗi users:', userErr.message);
  else console.log(`✓ Tài khoản người dùng: Đã nạp thành công ${userRows.length} tài khoản`);

  // 3. Danh sách lớp học (classes) - 20 lớp (Chưa phân công GVCN)
  console.log('3. Đang nạp bảng classes (20 lớp học)...');
  const classRows = INITIAL_CLASSES.map(c => {
    const clsStudents = INITIAL_STUDENTS.filter(s => s.className === c.name);
    const boardingCount = clsStudents.filter(s => s.boardingType === 'BOARDING' || s.studentType === 'boarding').length;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      grade: c.grade,
      room: c.room || '',
      head_teacher_id: null,
      head_teacher_name: 'Chưa phân công',
      head_teacher_phone: '',
      total_students: clsStudents.length,
      male_count: clsStudents.filter(s => s.gender === 'male').length,
      female_count: clsStudents.filter(s => s.gender === 'female').length,
      boarding_count: boardingCount,
      day_count: clsStudents.length - boardingCount,
      non_boarding_count: clsStudents.length - boardingCount,
      raw_data: c,
      updated_at: new Date().toISOString(),
    };
  });
  const { error: clsErr } = await supabase.from('classes').upsert(classRows, { onConflict: 'id' });
  if (clsErr) console.error('Lỗi classes:', clsErr.message);
  else console.log(`✓ Danh mục lớp: Đã nạp thành công ${classRows.length} lớp học`);

  // 4. Danh sách học sinh (students) - 629 học sinh (chia batch 100)
  console.log('4. Đang nạp bảng students (629 học sinh)...');
  let stuSuccess = 0;
  const batchSize = 100;
  for (let i = 0; i < INITIAL_STUDENTS.length; i += batchSize) {
    const chunk = INITIAL_STUDENTS.slice(i, i + batchSize);
    const stuRows = chunk.map(s => ({
      id: s.id,
      code: s.code || s.studentCode || '',
      full_name: s.fullName,
      normalized_name: s.normalizedName || '',
      date_of_birth: s.dateOfBirth || '',
      gender: s.gender || 'UNSET',
      class_id: s.classId,
      class_name: s.className,
      grade: s.grade || 6,
      boarding_type: s.boardingType || (s.studentType === 'boarding' ? 'BOARDING' : 'NON_BOARDING'),
      parent_name: s.parentName || '',
      parent_phone: s.parentPhone || '',
      address: s.address || '',
      ethnic_group: s.ethnicGroup || '',
      status: s.status || 'active',
      raw_data: s,
      updated_at: new Date().toISOString(),
    }));
    const { error: stuErr } = await supabase.from('students').upsert(stuRows, { onConflict: 'id' });
    if (stuErr) {
      console.error(`Lỗi students batch ${i}:`, stuErr.message);
    } else {
      stuSuccess += stuRows.length;
    }
  }
  console.log(`✓ Danh sách học sinh: Đã nạp thành công ${stuSuccess}/${INITIAL_STUDENTS.length} học sinh`);

  // 5. Báo cáo điểm danh (attendance_reports)
  console.log('5. Đang nạp bảng attendance_reports...');
  const todayStr = new Date().toISOString().split('T')[0];
  const initialReports = generateInitialReports(todayStr, INITIAL_STUDENTS, INITIAL_CLASSES);
  const reportRows = initialReports.map(r => ({
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
  const { error: repErr } = await supabase.from('attendance_reports').upsert(reportRows, { onConflict: 'id' });
  if (repErr) console.error('Lỗi reports:', repErr.message);
  else console.log(`✓ Báo cáo sĩ số: Đã nạp thành công ${reportRows.length} báo cáo điểm danh`);

  console.log('--- HOÀN TẤT NẠP DỮ LIỆU LÊN SUPABASE ---');
}

seed().catch(console.error);
