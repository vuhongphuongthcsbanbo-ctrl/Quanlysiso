import { User, SchoolClass, Student, AttendanceReport, AttendanceRecord, AuditLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
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
  },
  {
    id: 'user_tpt',
    username: 'phamngocthuy',
    name: 'Phạm Ngọc Thúy',
    email: 'phamngocthuy@thcsbanbo.edu.vn',
    role: 'admin_tpt',
    phone: '0989 123 888',
    title: 'Tổng Phụ trách Đội',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
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
  },
  // 20 GIÁO VIÊN CHỦ NHIỆM CHÍNH THỨC CỦA TRƯỜNG THCS BẢN BO
  {
    id: 'user_gv6a1',
    teacherId: 'tch_6a1',
    username: 'nguyenvanan',
    name: 'Nguyễn Văn An',
    fullName: 'Nguyễn Văn An',
    email: 'nguyenvanan@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0982 123 456',
    title: 'GVCN Lớp 6A1',
    assignedClassId: 'cls_6a1',
    assignedClassName: '6A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv6a2',
    teacherId: 'tch_6a2',
    username: 'lothimai',
    name: 'Lò Thị Mai',
    fullName: 'Lò Thị Mai',
    email: 'lothimai@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0984 234 567',
    title: 'GVCN Lớp 6A2',
    assignedClassId: 'cls_6a2',
    assignedClassName: '6A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv6a3',
    teacherId: 'tch_6a3',
    username: 'tranthithu',
    name: 'Trần Thị Thu',
    fullName: 'Trần Thị Thu',
    email: 'tranthithu@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0981 345 678',
    title: 'GVCN Lớp 6A3',
    assignedClassId: 'cls_6a3',
    assignedClassName: '6A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv6a4',
    teacherId: 'tch_6a4',
    username: 'hoangvanbinh',
    name: 'Hoàng Văn Bình',
    fullName: 'Hoàng Văn Bình',
    email: 'hoangvanbinh@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0983 456 789',
    title: 'GVCN Lớp 6A4',
    assignedClassId: 'cls_6a4',
    assignedClassName: '6A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv6a5',
    teacherId: 'tch_6a5',
    username: 'dieuvantien',
    name: 'Điêu Văn Tiến',
    fullName: 'Điêu Văn Tiến',
    email: 'dieuvantien@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0985 567 890',
    title: 'GVCN Lớp 6A5',
    assignedClassId: 'cls_6a5',
    assignedClassName: '6A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv7a1',
    teacherId: 'tch_7a1',
    username: 'tranquochung',
    name: 'Trần Quốc Hưng',
    fullName: 'Trần Quốc Hưng',
    email: 'tranquochung@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0973 345 678',
    title: 'GVCN Lớp 7A1',
    assignedClassId: 'cls_7a1',
    assignedClassName: '7A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv7a2',
    teacherId: 'tch_7a2',
    username: 'hoangthilan',
    name: 'Hoàng Thị Lan',
    fullName: 'Hoàng Thị Lan',
    email: 'hoangthilan@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0912 456 789',
    title: 'GVCN Lớp 7A2',
    assignedClassId: 'cls_7a2',
    assignedClassName: '7A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv7a3',
    teacherId: 'tch_7a3',
    username: 'lovanchien',
    name: 'Lò Văn Chiến',
    fullName: 'Lò Văn Chiến',
    email: 'lovanchien@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0971 678 901',
    title: 'GVCN Lớp 7A3',
    assignedClassId: 'cls_7a3',
    assignedClassName: '7A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv7a4',
    teacherId: 'tch_7a4',
    username: 'nongthithao',
    name: 'Nông Thị Thảo',
    fullName: 'Nông Thị Thảo',
    email: 'nongthithao@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0914 789 012',
    title: 'GVCN Lớp 7A4',
    assignedClassId: 'cls_7a4',
    assignedClassName: '7A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv7a5',
    teacherId: 'tch_7a5',
    username: 'deovannam',
    name: 'Đèo Văn Nam',
    fullName: 'Đèo Văn Nam',
    email: 'deovannam@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0975 890 123',
    title: 'GVCN Lớp 7A5',
    assignedClassId: 'cls_7a5',
    assignedClassName: '7A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv8a1',
    teacherId: 'tch_8a1',
    username: 'vangatua',
    name: 'Vàng A Tủa',
    fullName: 'Vàng A Tủa',
    email: 'vangatua@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0965 567 890',
    title: 'GVCN Lớp 8A1',
    assignedClassId: 'cls_8a1',
    assignedClassName: '8A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv8a2',
    teacherId: 'tch_8a2',
    username: 'lethihong',
    name: 'Lê Thị Hồng',
    fullName: 'Lê Thị Hồng',
    email: 'lethihong@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0986 678 901',
    title: 'GVCN Lớp 8A2',
    assignedClassId: 'cls_8a2',
    assignedClassName: '8A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv8a3',
    teacherId: 'tch_8a3',
    username: 'lyasung',
    name: 'Lý A Sùng',
    fullName: 'Lý A Sùng',
    email: 'lyasung@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0963 901 234',
    title: 'GVCN Lớp 8A3',
    assignedClassId: 'cls_8a3',
    assignedClassName: '8A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv8a4',
    teacherId: 'tch_8a4',
    username: 'nguyenthingoc',
    name: 'Nguyễn Thị Ngọc',
    fullName: 'Nguyễn Thị Ngọc',
    email: 'nguyenthingoc@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0987 012 345',
    title: 'GVCN Lớp 8A4',
    assignedClassId: 'cls_8a4',
    assignedClassName: '8A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv8a5',
    teacherId: 'tch_8a5',
    username: 'havandung',
    name: 'Hà Văn Dũng',
    fullName: 'Hà Văn Dũng',
    email: 'havandung@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0968 123 456',
    title: 'GVCN Lớp 8A5',
    assignedClassId: 'cls_8a5',
    assignedClassName: '8A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv9a1',
    teacherId: 'tch_9a1',
    username: 'dangminhtuan',
    name: 'Đặng Minh Tuấn',
    fullName: 'Đặng Minh Tuấn',
    email: 'dangminhtuan@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0977 789 012',
    title: 'GVCN Lớp 9A1',
    assignedClassId: 'cls_9a1',
    assignedClassName: '9A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv9a2',
    teacherId: 'tch_9a2',
    username: 'nungthihoa',
    name: 'Nùng Thị Hoa',
    fullName: 'Nùng Thị Hoa',
    email: 'nungthihoa@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0918 890 123',
    title: 'GVCN Lớp 9A2',
    assignedClassId: 'cls_9a2',
    assignedClassName: '9A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv9a3',
    teacherId: 'tch_9a3',
    username: 'vudinhtrong',
    name: 'Vũ Đình Trọng',
    fullName: 'Vũ Đình Trọng',
    email: 'vudinhtrong@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0978 234 567',
    title: 'GVCN Lớp 9A3',
    assignedClassId: 'cls_9a3',
    assignedClassName: '9A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv9a4',
    teacherId: 'tch_9a4',
    username: 'maithihang',
    name: 'Mai Thị Hằng',
    fullName: 'Mai Thị Hằng',
    email: 'maithihang@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0988 345 678',
    title: 'GVCN Lớp 9A4',
    assignedClassId: 'cls_9a4',
    assignedClassName: '9A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'user_gv9a5',
    teacherId: 'tch_9a5',
    username: 'tavanquyet',
    name: 'Tạ Văn Quyết',
    fullName: 'Tạ Văn Quyết',
    email: 'tavanquyet@thcsbanbo.edu.vn',
    role: 'teacher_gvcn',
    phone: '0919 456 789',
    title: 'GVCN Lớp 9A5',
    assignedClassId: 'cls_9a5',
    assignedClassName: '9A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    createdAt: '2026-08-15',
  },
];

// CHÍNH THỨC 20 LỚP CỦA TRƯỜNG THCS BẢN BO
export const INITIAL_CLASSES: SchoolClass[] = [
  // Khối 6 (5 lớp)
  { id: 'cls_6a1', code: '6A1', name: '6A1', grade: 6, teacherId: 'tch_6a1', teacherName: 'Nguyễn Văn An', teacherPhone: '0982 123 456', room: 'Phòng 101', isActive: true },
  { id: 'cls_6a2', code: '6A2', name: '6A2', grade: 6, teacherId: 'tch_6a2', teacherName: 'Lò Thị Mai', teacherPhone: '0984 234 567', room: 'Phòng 102', isActive: true },
  { id: 'cls_6a3', code: '6A3', name: '6A3', grade: 6, teacherId: 'tch_6a3', teacherName: 'Trần Thị Thu', teacherPhone: '0981 345 678', room: 'Phòng 103', isActive: true },
  { id: 'cls_6a4', code: '6A4', name: '6A4', grade: 6, teacherId: 'tch_6a4', teacherName: 'Hoàng Văn Bình', teacherPhone: '0983 456 789', room: 'Phòng 104', isActive: true },
  { id: 'cls_6a5', code: '6A5', name: '6A5', grade: 6, teacherId: 'tch_6a5', teacherName: 'Điêu Văn Tiến', teacherPhone: '0985 567 890', room: 'Phòng 105', isActive: true },

  // Khối 7 (5 lớp)
  { id: 'cls_7a1', code: '7A1', name: '7A1', grade: 7, teacherId: 'tch_7a1', teacherName: 'Trần Quốc Hưng', teacherPhone: '0973 345 678', room: 'Phòng 201', isActive: true },
  { id: 'cls_7a2', code: '7A2', name: '7A2', grade: 7, teacherId: 'tch_7a2', teacherName: 'Hoàng Thị Lan', teacherPhone: '0912 456 789', room: 'Phòng 202', isActive: true },
  { id: 'cls_7a3', code: '7A3', name: '7A3', grade: 7, teacherId: 'tch_7a3', teacherName: 'Lò Văn Chiến', teacherPhone: '0971 678 901', room: 'Phòng 203', isActive: true },
  { id: 'cls_7a4', code: '7A4', name: '7A4', grade: 7, teacherId: 'tch_7a4', teacherName: 'Nông Thị Thảo', teacherPhone: '0914 789 012', room: 'Phòng 204', isActive: true },
  { id: 'cls_7a5', code: '7A5', name: '7A5', grade: 7, teacherId: 'tch_7a5', teacherName: 'Đèo Văn Nam', teacherPhone: '0975 890 123', room: 'Phòng 205', isActive: true },

  // Khối 8 (5 lớp)
  { id: 'cls_8a1', code: '8A1', name: '8A1', grade: 8, teacherId: 'tch_8a1', teacherName: 'Vàng A Tủa', teacherPhone: '0965 567 890', room: 'Phòng 301', isActive: true },
  { id: 'cls_8a2', code: '8A2', name: '8A2', grade: 8, teacherId: 'tch_8a2', teacherName: 'Lê Thị Hồng', teacherPhone: '0986 678 901', room: 'Phòng 302', isActive: true },
  { id: 'cls_8a3', code: '8A3', name: '8A3', grade: 8, teacherId: 'tch_8a3', teacherName: 'Lý A Sùng', teacherPhone: '0963 901 234', room: 'Phòng 303', isActive: true },
  { id: 'cls_8a4', code: '8A4', name: '8A4', grade: 8, teacherId: 'tch_8a4', teacherName: 'Nguyễn Thị Ngọc', teacherPhone: '0987 012 345', room: 'Phòng 304', isActive: true },
  { id: 'cls_8a5', code: '8A5', name: '8A5', grade: 8, teacherId: 'tch_8a5', teacherName: 'Hà Văn Dũng', teacherPhone: '0968 123 456', room: 'Phòng 305', isActive: true },

  // Khối 9 (5 lớp)
  { id: 'cls_9a1', code: '9A1', name: '9A1', grade: 9, teacherId: 'tch_9a1', teacherName: 'Đặng Minh Tuấn', teacherPhone: '0977 789 012', room: 'Phòng 401', isActive: true },
  { id: 'cls_9a2', code: '9A2', name: '9A2', grade: 9, teacherId: 'tch_9a2', teacherName: 'Nùng Thị Hoa', teacherPhone: '0918 890 123', room: 'Phòng 402', isActive: true },
  { id: 'cls_9a3', code: '9A3', name: '9A3', grade: 9, teacherId: 'tch_9a3', teacherName: 'Vũ Đình Trọng', teacherPhone: '0978 234 567', room: 'Phòng 403', isActive: true },
  { id: 'cls_9a4', code: '9A4', name: '9A4', grade: 9, teacherId: 'tch_9a4', teacherName: 'Mai Thị Hằng', teacherPhone: '0988 345 678', room: 'Phòng 404', isActive: true },
  { id: 'cls_9a5', code: '9A5', name: '9A5', grade: 9, teacherId: 'tch_9a5', teacherName: 'Tạ Văn Quyết', teacherPhone: '0919 456 789', room: 'Phòng 405', isActive: true },
];

// Helper to generate realistic students for all 20 classes
const generateInitialStudents = (): Student[] => {
  const students: Student[] = [];

  const classConfigs = [
    // Khối 6
    { id: 'cls_6a1', name: '6A1', grade: 6, count: 34, boardingRatio: 0.76 },
    { id: 'cls_6a2', name: '6A2', grade: 6, count: 32, boardingRatio: 0.72 },
    { id: 'cls_6a3', name: '6A3', grade: 6, count: 33, boardingRatio: 0.70 },
    { id: 'cls_6a4', name: '6A4', grade: 6, count: 31, boardingRatio: 0.74 },
    { id: 'cls_6a5', name: '6A5', grade: 6, count: 30, boardingRatio: 0.80 },
    // Khối 7
    { id: 'cls_7a1', name: '7A1', grade: 7, count: 35, boardingRatio: 0.74 },
    { id: 'cls_7a2', name: '7A2', grade: 7, count: 34, boardingRatio: 0.71 },
    { id: 'cls_7a3', name: '7A3', grade: 7, count: 32, boardingRatio: 0.75 },
    { id: 'cls_7a4', name: '7A4', grade: 7, count: 33, boardingRatio: 0.69 },
    { id: 'cls_7a5', name: '7A5', grade: 7, count: 30, boardingRatio: 0.73 },
    // Khối 8
    { id: 'cls_8a1', name: '8A1', grade: 8, count: 32, boardingRatio: 0.75 },
    { id: 'cls_8a2', name: '8A2', grade: 8, count: 31, boardingRatio: 0.71 },
    { id: 'cls_8a3', name: '8A3', grade: 8, count: 33, boardingRatio: 0.70 },
    { id: 'cls_8a4', name: '8A4', grade: 8, count: 29, boardingRatio: 0.69 },
    { id: 'cls_8a5', name: '8A5', grade: 8, count: 30, boardingRatio: 0.77 },
    // Khối 9
    { id: 'cls_9a1', name: '9A1', grade: 9, count: 32, boardingRatio: 0.72 },
    { id: 'cls_9a2', name: '9A2', grade: 9, count: 30, boardingRatio: 0.70 },
    { id: 'cls_9a3', name: '9A3', grade: 9, count: 31, boardingRatio: 0.68 },
    { id: 'cls_9a4', name: '9A4', grade: 9, count: 28, boardingRatio: 0.71 },
    { id: 'cls_9a5', name: '9A5', grade: 9, count: 29, boardingRatio: 0.76 },
  ];

  const firstNamesM = [
    'Văn Nam', 'Văn Chung', 'Văn Dũng', 'A Sùng', 'A Pao', 'Văn Phong',
    'Thành Long', 'Hữu Thắng', 'Minh Hải', 'Đức Huy', 'Quốc Bảo', 'Văn Tuấn',
    'A Vàng', 'Văn Sơn', 'Tuấn Kiệt', 'A Chớ', 'Văn Hiệp', 'A Thào'
  ];
  const firstNamesF = [
    'Thị Mai', 'Thị Thảo', 'Thị Mẩy', 'Thị Huệ', 'Thị Sen', 'Thị Hương',
    'Ngọc Ánh', 'Thu Trang', 'Hồng Nhung', 'Thị Duyên', 'Thị Pằng', 'Thị Sao',
    'Như Quỳnh', 'Thị Liễu', 'Thị Lan', 'Thị Mỷ', 'Thị Chứ', 'Thị Dua'
  ];
  const lastNames = ['Lò', 'Điêu', 'Vàng', 'Cứ', 'Nông', 'Đèo', 'Hoàng', 'Hà', 'Lý', 'Trần', 'Nguyễn', 'Vũ', 'Hùng'];
  const hamlets = ['Bản Nà Bó', 'Bản Hợp 1', 'Bản Hợp 2', 'Bản Nà Khương', 'Bản Phiêng Đăm', 'Bản Chát', 'Bản Tiên Bình'];
  const ethnicList = ['Thái', 'Thái', 'Mông', 'Dao', 'Lự', 'Giáy', 'Kinh'];

  let globalIndex = 1;

  for (const cfg of classConfigs) {
    const boardingTarget = Math.round(cfg.count * cfg.boardingRatio);
    for (let i = 1; i <= cfg.count; i++) {
      const isMale = (i % 2 === 1);
      const lName = lastNames[(globalIndex + i) % lastNames.length];
      const fName = isMale
        ? firstNamesM[(globalIndex + i) % firstNamesM.length]
        : firstNamesF[(globalIndex + i) % firstNamesF.length];
      const fullName = `${lName} ${fName}`;
      const isBoarding = i <= boardingTarget;
      const birthYear = 2026 - (cfg.grade + 5);
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String((i % 28) + 1).padStart(2, '0');

      students.push({
        id: `stu_${cfg.name.toLowerCase()}_${String(i).padStart(2, '0')}`,
        code: `HS${cfg.grade}${String(i).padStart(3, '0')}`,
        fullName,
        dateOfBirth: `${birthYear}-${month}-${day}`,
        gender: isMale ? 'male' : 'female',
        classId: cfg.id,
        className: cfg.name,
        grade: cfg.grade,
        boardingType: isBoarding ? 'BOARDING' : 'NON_BOARDING',
        studentType: isBoarding ? 'boarding' : 'day',
        parentName: `${lastNames[(i * 3) % lastNames.length]} Văn Phóng`,
        parentPhone: `098${String(1000000 + globalIndex).slice(0, 7)}`,
        address: hamlets[(i + globalIndex) % hamlets.length],
        ethnicGroup: ethnicList[(i + globalIndex) % ethnicList.length],
        status: 'active',
        createdAt: '2026-08-20',
      });
      globalIndex++;
    }
  }

  return students;
};

export const DEMO_PRESET_STUDENTS: Student[] = generateInitialStudents();
// Dữ liệu học sinh chính thức 20 lớp của Trường THCS Bản Bo (629 học sinh, phân định Bán trú / Ngoại trú 100%)
export const INITIAL_STUDENTS: Student[] = DEMO_PRESET_STUDENTS;

// Generate initial demo attendance reports for testing all states
export const generateInitialReports = (todayStr: string, students: Student[], classes: SchoolClass[]): AttendanceReport[] => {
  // Nếu chưa có học sinh nào trong cơ sở dữ liệu, không tạo báo cáo giả lập
  if (!students || students.length === 0) {
    return [];
  }
  const reports: AttendanceReport[] = [];

  // Helper to build a report for a class
  const buildReport = (
    cId: string,
    status: AttendanceReport['status'],
    submittedTime: string,
    approvedInfo?: { by: string; at: string },
    revisionInfo?: { reason: string; count: number },
    absentConfig?: { boardingAbsentCount: number; dayAbsentCount: number; lateCount: number }
  ): AttendanceReport => {
    const cls = classes.find(c => c.id === cId)!;
    const clsStudents = students.filter(s => s.classId === cId);
    const bStudents = clsStudents.filter(s => s.boardingType === 'BOARDING');
    const dStudents = clsStudents.filter(s => s.boardingType === 'NON_BOARDING');

    const bAbsTarget = absentConfig?.boardingAbsentCount || 0;
    const dAbsTarget = absentConfig?.dayAbsentCount || 0;
    const lateTarget = absentConfig?.lateCount || 0;

    let bAbsCount = 0;
    let dAbsCount = 0;
    let lateApplied = 0;

    const records: AttendanceRecord[] = clsStudents.map(stu => {
      let itemStatus: AttendanceRecord['status'] = 'PRESENT';
      let reason: string | undefined = undefined;
      let reasonDetail: string | undefined = undefined;
      let absenceType: 'excused' | 'unexcused' | undefined = undefined;

      if (stu.boardingType === 'BOARDING' && bAbsCount < bAbsTarget) {
        bAbsCount++;
        itemStatus = bAbsCount === 1 ? 'ABSENT_EXCUSED' : 'ABSENT_UNEXCUSED';
        absenceType = bAbsCount === 1 ? 'excused' : 'unexcused';
        reason = bAbsCount === 1 ? 'Ốm' : 'Không rõ lí do';
        reasonDetail = bAbsCount === 1 ? 'Sốt nhẹ, gia đình đã gọi điện xin phép' : 'Chưa liên lạc được';
      } else if (stu.boardingType === 'NON_BOARDING' && dAbsCount < dAbsTarget) {
        dAbsCount++;
        itemStatus = 'ABSENT_EXCUSED';
        absenceType = 'excused';
        reason = 'Gia đình có việc';
        reasonDetail = 'Gia đình có việc hiếu';
      } else if (lateApplied < lateTarget) {
        lateApplied++;
        itemStatus = 'LATE';
        reason = 'Khác';
        reasonDetail = 'Hỏng xe trên đường';
      }

      const isAbsent = itemStatus === 'ABSENT_EXCUSED' || itemStatus === 'ABSENT_UNEXCUSED';

      return {
        id: `rec_${cId}_${stu.id}`,
        reportId: `rep_${cId}_${todayStr}`,
        studentId: stu.id,
        studentName: stu.fullName,
        studentCode: stu.code,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        date: todayStr,
        session: 'morning',
        boardingType: stu.boardingType,
        studentType: stu.boardingType === 'BOARDING' ? 'boarding' : 'day',
        status: itemStatus,
        absenceType,
        reason,
        reasonDetail,
        hasBoardingMeal: stu.boardingType === 'BOARDING' && !isAbsent,
        hasBoardingNap: stu.boardingType === 'BOARDING' && !isAbsent,
        createdAt: `${todayStr}T07:15:00`,
        updatedAt: `${todayStr}T07:20:00`,
      };
    });

    const bTotal = bStudents.length;
    const dTotal = dStudents.length;
    const bAbsent = bAbsTarget;
    const dAbsent = dAbsTarget;
    const totalAbsent = bAbsent + dAbsent;
    const totalPresent = clsStudents.length - totalAbsent;

    return {
      id: `rep_${cId}_${todayStr}`,
      date: todayStr,
      session: 'morning',
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      teacherId: cls.teacherId || '',
      teacherName: cls.teacherName || '',
      totalStudents: clsStudents.length,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      excusedAbsentCount: records.filter(r => r.status === 'ABSENT_EXCUSED').length,
      unexcusedAbsentCount: records.filter(r => r.status === 'ABSENT_UNEXCUSED').length,
      lateCount: lateTarget,
      earlyLeaveCount: 0,
      boardingTotal: bTotal,
      boardingPresent: bTotal - bAbsent,
      boardingAbsent: bAbsent,
      boardingMealsExpected: bTotal - bAbsent,
      nonBoardingTotal: dTotal,
      nonBoardingPresent: dTotal - dAbsent,
      nonBoardingAbsent: dAbsent,
      dayTotal: dTotal,
      dayPresent: dTotal - dAbsent,
      dayAbsent: dAbsent,
      status,
      submittedAt: submittedTime ? `${todayStr} ${submittedTime}` : undefined,
      submittedBy: cls.teacherName,
      approvedAt: approvedInfo ? `${todayStr} ${approvedInfo.at}` : undefined,
      approvedBy: approvedInfo ? approvedInfo.by : undefined,
      revisionReason: revisionInfo ? revisionInfo.reason : undefined,
      revisionCount: revisionInfo ? revisionInfo.count : 0,
      records,
      updatedAt: `${todayStr} ${submittedTime || '07:00'}`,
    };
  };

  // 1. APPROVED CLASSES (8 lớp đã được TPT duyệt):
  // 6A1 (có 2 bán trú nghỉ), 6A2 (đủ), 7A1 (đủ), 7A2 (1 ngoại trú nghỉ), 7A3 (đủ), 8A1 (đủ), 8A3 (đủ), 9A1 (đủ)
  reports.push(buildReport('cls_6a1', 'APPROVED', '07:15', { by: 'Phạm Ngọc Thúy', at: '07:25' }, undefined, { boardingAbsentCount: 2, dayAbsentCount: 0, lateCount: 1 }));
  reports.push(buildReport('cls_6a2', 'APPROVED', '07:18', { by: 'Phạm Ngọc Thúy', at: '07:26' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_7a1', 'APPROVED', '07:16', { by: 'Phạm Ngọc Thúy', at: '07:28' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_7a2', 'APPROVED', '07:20', { by: 'Phạm Ngọc Thúy', at: '07:29' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 1, lateCount: 0 }));
  reports.push(buildReport('cls_7a3', 'APPROVED', '07:22', { by: 'Phạm Ngọc Thúy', at: '07:30' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_8a1', 'APPROVED', '07:14', { by: 'Phạm Ngọc Thúy', at: '07:31' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_8a3', 'APPROVED', '07:19', { by: 'Phạm Ngọc Thúy', at: '07:32' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_9a1', 'APPROVED', '07:21', { by: 'Phạm Ngọc Thúy', at: '07:33' }, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));

  // 2. PENDING_APPROVAL CLASSES (4 lớp đang chờ TPT duyệt):
  // 6A3 (đủ), 7A4 (1 bán trú nghỉ), 8A4 (đủ), 9A2 (1 ngoại trú nghỉ)
  reports.push(buildReport('cls_6a3', 'PENDING_APPROVAL', '07:28', undefined, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_7a4', 'PENDING_APPROVAL', '07:30', undefined, undefined, { boardingAbsentCount: 1, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_8a4', 'PENDING_APPROVAL', '07:31', undefined, undefined, { boardingAbsentCount: 0, dayAbsentCount: 0, lateCount: 0 }));
  reports.push(buildReport('cls_9a2', 'PENDING_APPROVAL', '07:33', undefined, undefined, { boardingAbsentCount: 0, dayAbsentCount: 1, lateCount: 0 }));

  // 3. REVISION_REQUIRED CLASSES (1 lớp TPT yêu cầu GVCN sửa):
  // 8A2
  reports.push(buildReport('cls_8a2', 'REVISION_REQUIRED', '07:10', undefined, { reason: 'Kiểm tra lại lí do vắng của học sinh Lò Văn Cúc (phụ huynh đã gọi xin phép chưa hay không phép?).', count: 1 }, { boardingAbsentCount: 1, dayAbsentCount: 1, lateCount: 0 }));

  // 4. NOT_SUBMITTED CLASSES (7 lớp còn lại chưa gửi báo cáo):
  // 6A4, 6A5, 7A5, 8A5, 9A3, 9A4, 9A5
  // Do NOT add reports for these classes so they show NOT_SUBMITTED strictly!

  return reports;
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: '2026-10-11 07:33:15',
    userId: 'user_tpt',
    userName: 'Phạm Ngọc Thúy',
    userRole: 'admin_tpt',
    action: 'DUYỆT BÁO CÁO',
    entity: 'report',
    entityId: 'rep_cls_9a1',
    description: 'Tổng Phụ trách Đội duyệt báo cáo sĩ số Lớp 9A1 (Có mặt: 32/32, Vắng: 0)',
  },
  {
    id: 'log_002',
    timestamp: '2026-10-11 07:25:30',
    userId: 'user_tpt',
    userName: 'Phạm Ngọc Thúy',
    userRole: 'admin_tpt',
    action: 'YÊU CẦU CHỈNH SỬA',
    entity: 'report',
    entityId: 'rep_cls_8a2',
    description: 'Yêu cầu GVCN Lớp 8A2 kiểm tra lại lí do vắng của học sinh',
  },
  {
    id: 'log_003',
    timestamp: '2026-10-11 07:15:20',
    userId: 'user_gv6a1',
    userName: 'Nguyễn Văn An',
    userRole: 'teacher_gvcn',
    action: 'GỬI BÁO CÁO',
    entity: 'attendance',
    entityId: 'rep_cls_6a1',
    description: 'GVCN Lớp 6A1 gửi báo cáo sĩ số buổi sáng ngày 11/10/2026 (Có mặt: 32, Vắng: 2)',
  },
];
