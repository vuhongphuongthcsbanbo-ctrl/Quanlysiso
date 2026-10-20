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
    fullName: 'Phạm Ngọc Thúy',
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
  // 20 Giáo viên Chủ nhiệm chính thức Trường THCS Bản Bo (Năm học 2026–2027)
  {
    id: 'usr_1792072899788_6pf6',
    teacherId: 'tch_usr_1792072899788_6pf6',
    username: 'nguyetthuonglc',
    name: 'Đỗ Thị Nguyệt',
    fullName: 'Đỗ Thị Nguyệt',
    email: 'nguyetthuonglc@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0372528538',
    assignedClassId: 'cls_6a1',
    assignedClassName: '6A1',
    title: 'GVCN Lớp 6A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072903840_by2q',
    teacherId: 'tch_usr_1792072903840_by2q',
    username: 'nguyenlinh250615',
    name: 'Nguyễn Thị Thúy Ngân',
    fullName: 'Nguyễn Thị Thúy Ngân',
    email: 'nguyenlinh250615@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0399734316',
    assignedClassId: 'cls_6a2',
    assignedClassName: '6A2',
    title: 'GVCN Lớp 6A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072905165_hmbt',
    teacherId: 'tch_usr_1792072905165_hmbt',
    username: 'huanvanpt',
    name: 'Tống Văn Huấn',
    fullName: 'Tống Văn Huấn',
    email: 'huanvanpt@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0376340998',
    assignedClassId: 'cls_6a3',
    assignedClassName: '6A3',
    title: 'GVCN Lớp 6A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072906366_pbui',
    teacherId: 'tch_usr_1792072906366_pbui',
    username: 'lothichannt',
    name: 'Lò Thị Chăn',
    fullName: 'Lò Thị Chăn',
    email: 'lothichannt@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0358196189',
    assignedClassId: 'cls_6a4',
    assignedClassName: '6A4',
    title: 'GVCN Lớp 6A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072909115_922g',
    teacherId: 'tch_usr_1792072909115_922g',
    username: 'nguyenminh2002lc',
    name: 'Nguyễn Thị Minh',
    fullName: 'Nguyễn Thị Minh',
    email: 'nguyenminh2002lc@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0377155328',
    assignedClassId: 'cls_6a5',
    assignedClassName: '6A5',
    title: 'GVCN Lớp 6A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072910406_kdtz',
    teacherId: 'tch_usr_1792072910406_kdtz',
    username: 'ngonam1980',
    name: 'Ngô Thị Năm',
    fullName: 'Ngô Thị Năm',
    email: 'ngonam1980@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0975902608',
    assignedClassId: 'cls_7a1',
    assignedClassName: '7A1',
    title: 'GVCN Lớp 7A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072911854_0lk1',
    teacherId: 'tch_usr_1792072911854_0lk1',
    username: 'cuongquang1983',
    name: 'Nguyễn Văn Quang',
    fullName: 'Nguyễn Văn Quang',
    email: 'cuongquang1983@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0868746182',
    assignedClassId: 'cls_7a2',
    assignedClassName: '7A2',
    title: 'GVCN Lớp 7A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072913583_jybv',
    teacherId: 'tch_usr_1792072913583_jybv',
    username: 'trantunglambanbo',
    name: 'Trần Đăng Tùng',
    fullName: 'Trần Đăng Tùng',
    email: 'trantunglambanbo@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0866878323',
    assignedClassId: 'cls_7a3',
    assignedClassName: '7A3',
    title: 'GVCN Lớp 7A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072914721_iu40',
    teacherId: 'tch_usr_1792072914721_iu40',
    username: 'nguyenthuhsnt',
    name: 'Nguyễn Thị Thu',
    fullName: 'Nguyễn Thị Thu',
    email: 'nguyenthuhsnt@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0983689145',
    assignedClassId: 'cls_7a4',
    assignedClassName: '7A4',
    title: 'GVCN Lớp 7A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072917601_1cqw',
    teacherId: 'tch_usr_1792072917601_1cqw',
    username: 'nguyenthutd.laichau',
    name: 'Nguyễn Thị Thu',
    fullName: 'Nguyễn Thị Thu',
    email: 'nguyenthutd.laichau@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0987555090',
    assignedClassId: 'cls_7a5',
    assignedClassName: '7A5',
    title: 'GVCN Lớp 7A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072920620_qp13',
    teacherId: 'tch_usr_1792072920620_qp13',
    username: 'tuyenbanbo',
    name: 'Phạm Văn Tuyến',
    fullName: 'Phạm Văn Tuyến',
    email: 'tuyenbanbo@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0359347386',
    assignedClassId: 'cls_8a1',
    assignedClassName: '8A1',
    title: 'GVCN Lớp 8A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072921568_sutg',
    teacherId: 'tch_usr_1792072921568_sutg',
    username: 'tuanbanbo',
    name: 'Nguyễn Văn Tuấn',
    fullName: 'Nguyễn Văn Tuấn',
    email: 'tuanbanbo@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0869563353',
    assignedClassId: 'cls_8a2',
    assignedClassName: '8A2',
    title: 'GVCN Lớp 8A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072922706_c8ic',
    teacherId: 'tch_usr_1792072922706_c8ic',
    username: 'bichngocbanbo',
    name: 'Vũ Thị Bích Ngọc',
    fullName: 'Vũ Thị Bích Ngọc',
    email: 'bichngocbanbo@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0369785621',
    assignedClassId: 'cls_8a3',
    assignedClassName: '8A3',
    title: 'GVCN Lớp 8A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072924086_fwxs',
    teacherId: 'tch_usr_1792072924086_fwxs',
    username: 'nguyenminhchautd',
    name: 'Nguyễn Thị Yến',
    fullName: 'Nguyễn Thị Yến',
    email: 'nguyenminhchautd@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0862925262',
    assignedClassId: 'cls_8a4',
    assignedClassName: '8A4',
    title: 'GVCN Lớp 8A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072926044_4kq7',
    teacherId: 'tch_usr_1792072926044_4kq7',
    username: 'chiphuongsonbinh',
    name: 'Nguyễn Chi Phương',
    fullName: 'Nguyễn Chi Phương',
    email: 'chiphuongsonbinh@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0962259881',
    assignedClassId: 'cls_8a5',
    assignedClassName: '8A5',
    title: 'GVCN Lớp 8A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072927118_93ch',
    teacherId: 'tch_usr_1792072927118_93ch',
    username: 'thuhang.tbu',
    name: 'Nguyễn Thị Thu Hằng',
    fullName: 'Nguyễn Thị Thu Hằng',
    email: 'thuhang.tbu@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0362481532',
    assignedClassId: 'cls_9a1',
    assignedClassName: '9A1',
    title: 'GVCN Lớp 9A1',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072928839_vfr7',
    teacherId: 'tch_usr_1792072928839_vfr7',
    username: 'lobaoduong',
    name: 'Lò Bảo Dơng',
    fullName: 'Lò Bảo Dơng',
    email: 'lobaoduong@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0388710035',
    assignedClassId: 'cls_9a2',
    assignedClassName: '9A2',
    title: 'GVCN Lớp 9A2',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072930953_y68l',
    teacherId: 'tch_usr_1792072930953_y68l',
    username: 'sangphutho',
    name: 'Bùi Văn Sang',
    fullName: 'Bùi Văn Sang',
    email: 'sangphutho@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0339060668',
    assignedClassId: 'cls_9a3',
    assignedClassName: '9A3',
    title: 'GVCN Lớp 9A3',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072932248_47n6',
    teacherId: 'tch_usr_1792072932248_47n6',
    username: 'tridungtd',
    name: 'Trì Lệ Dung',
    fullName: 'Trì Lệ Dung',
    email: 'tridungtd@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0916084987',
    assignedClassId: 'cls_9a4',
    assignedClassName: '9A4',
    title: 'GVCN Lớp 9A4',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
  {
    id: 'usr_1792072933589_h5cs',
    teacherId: 'tch_usr_1792072933589_h5cs',
    username: 'nguyenminhtuan1978nt',
    name: 'Nguyễn Minh Tuấn',
    fullName: 'Nguyễn Minh Tuấn',
    email: 'nguyenminhtuan1978nt@gmail.com',
    role: 'HEAD_TEACHER',
    phone: '0986449001',
    assignedClassId: 'cls_9a5',
    assignedClassName: '9A5',
    title: 'GVCN Lớp 9A5',
    accountStatus: 'ACTIVE',
    isActive: true,
    password: '12345678',
    createdAt: '2026-10-15',
  },
];

// 20 Giáo viên Chủ nhiệm chính thức Trường THCS Bản Bo cho teacherService
export const OFFICIAL_TEACHERS: any[] = [
  {
    id: 'tch_usr_1792072899788_6pf6',
    teacherCode: 'NGUYETTHUONGLC',
    fullName: 'Đỗ Thị Nguyệt',
    email: 'nguyetthuonglc@gmail.com',
    phone: '0372528538',
    assignedClassId: 'cls_6a1',
    assignedClassName: '6A1',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072903840_by2q',
    teacherCode: 'NGUYENLINH250615',
    fullName: 'Nguyễn Thị Thúy Ngân',
    email: 'nguyenlinh250615@gmail.com',
    phone: '0399734316',
    assignedClassId: 'cls_6a2',
    assignedClassName: '6A2',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072905165_hmbt',
    teacherCode: 'HUANVANPT',
    fullName: 'Tống Văn Huấn',
    email: 'huanvanpt@gmail.com',
    phone: '0376340998',
    assignedClassId: 'cls_6a3',
    assignedClassName: '6A3',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072906366_pbui',
    teacherCode: 'LOTHICHANNT',
    fullName: 'Lò Thị Chăn',
    email: 'lothichannt@gmail.com',
    phone: '0358196189',
    assignedClassId: 'cls_6a4',
    assignedClassName: '6A4',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072909115_922g',
    teacherCode: 'NGUYENMINH2002LC',
    fullName: 'Nguyễn Thị Minh',
    email: 'nguyenminh2002lc@gmail.com',
    phone: '0377155328',
    assignedClassId: 'cls_6a5',
    assignedClassName: '6A5',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072910406_kdtz',
    teacherCode: 'NGONAM1980',
    fullName: 'Ngô Thị Năm',
    email: 'ngonam1980@gmail.com',
    phone: '0975902608',
    assignedClassId: 'cls_7a1',
    assignedClassName: '7A1',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072911854_0lk1',
    teacherCode: 'CUONGQUANG1983',
    fullName: 'Nguyễn Văn Quang',
    email: 'cuongquang1983@gmail.com',
    phone: '0868746182',
    assignedClassId: 'cls_7a2',
    assignedClassName: '7A2',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072913583_jybv',
    teacherCode: 'TRANTUNGLAMBANBO',
    fullName: 'Trần Đăng Tùng',
    email: 'trantunglambanbo@gmail.com',
    phone: '0866878323',
    assignedClassId: 'cls_7a3',
    assignedClassName: '7A3',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072914721_iu40',
    teacherCode: 'NGUYENTHUHSNT',
    fullName: 'Nguyễn Thị Thu',
    email: 'nguyenthuhsnt@gmail.com',
    phone: '0983689145',
    assignedClassId: 'cls_7a4',
    assignedClassName: '7A4',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072917601_1cqw',
    teacherCode: 'NGUYENTHUTD.LAICHAU',
    fullName: 'Nguyễn Thị Thu',
    email: 'nguyenthutd.laichau@gmail.com',
    phone: '0987555090',
    assignedClassId: 'cls_7a5',
    assignedClassName: '7A5',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072920620_qp13',
    teacherCode: 'TUYENBANBO',
    fullName: 'Phạm Văn Tuyến',
    email: 'tuyenbanbo@gmail.com',
    phone: '0359347386',
    assignedClassId: 'cls_8a1',
    assignedClassName: '8A1',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072921568_sutg',
    teacherCode: 'TUANBANBO',
    fullName: 'Nguyễn Văn Tuấn',
    email: 'tuanbanbo@gmail.com',
    phone: '0869563353',
    assignedClassId: 'cls_8a2',
    assignedClassName: '8A2',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072922706_c8ic',
    teacherCode: 'BICHNGOCBANBO',
    fullName: 'Vũ Thị Bích Ngọc',
    email: 'bichngocbanbo@gmail.com',
    phone: '0369785621',
    assignedClassId: 'cls_8a3',
    assignedClassName: '8A3',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072924086_fwxs',
    teacherCode: 'NGUYENMINHCHAUTD',
    fullName: 'Nguyễn Thị Yến',
    email: 'nguyenminhchautd@gmail.com',
    phone: '0862925262',
    assignedClassId: 'cls_8a4',
    assignedClassName: '8A4',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072926044_4kq7',
    teacherCode: 'CHIPHUONGSONBINH',
    fullName: 'Nguyễn Chi Phương',
    email: 'chiphuongsonbinh@gmail.com',
    phone: '0962259881',
    assignedClassId: 'cls_8a5',
    assignedClassName: '8A5',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072927118_93ch',
    teacherCode: 'THUHANG.TBU',
    fullName: 'Nguyễn Thị Thu Hằng',
    email: 'thuhang.tbu@gmail.com',
    phone: '0362481532',
    assignedClassId: 'cls_9a1',
    assignedClassName: '9A1',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072928839_vfr7',
    teacherCode: 'LOBAODUONG',
    fullName: 'Lò Bảo Dơng',
    email: 'lobaoduong@gmail.com',
    phone: '0388710035',
    assignedClassId: 'cls_9a2',
    assignedClassName: '9A2',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072930953_y68l',
    teacherCode: 'SANGPHUTHO',
    fullName: 'Bùi Văn Sang',
    email: 'sangphutho@gmail.com',
    phone: '0339060668',
    assignedClassId: 'cls_9a3',
    assignedClassName: '9A3',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072932248_47n6',
    teacherCode: 'TRIDUNGTD',
    fullName: 'Trì Lệ Dung',
    email: 'tridungtd@gmail.com',
    phone: '0916084987',
    assignedClassId: 'cls_9a4',
    assignedClassName: '9A4',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
  {
    id: 'tch_usr_1792072933589_h5cs',
    teacherCode: 'NGUYENMINHTUAN1978NT',
    fullName: 'Nguyễn Minh Tuấn',
    email: 'nguyenminhtuan1978nt@gmail.com',
    phone: '0986449001',
    assignedClassId: 'cls_9a5',
    assignedClassName: '9A5',
    role: 'HEAD_TEACHER',
    employmentStatus: 'ACTIVE',
    accountStatus: 'ACTIVE',
  },
];

// CHÍNH THỨC 20 LỚP CỦA TRƯỜNG THCS BẢN BO ĐÃ ĐƯỢC PHÂN CÔNG GVCN CHÍNH THỨC
export const INITIAL_CLASSES: SchoolClass[] = [
  // Khối 6 (5 lớp)
  { id: 'cls_6a1', code: '6A1', name: '6A1', grade: 6, room: 'Phòng 101', isActive: true, teacherId: 'usr_1792072899788_6pf6', teacherName: 'Đỗ Thị Nguyệt', teacherPhone: '0372528538' },
  { id: 'cls_6a2', code: '6A2', name: '6A2', grade: 6, room: 'Phòng 102', isActive: true, teacherId: 'usr_1792072903840_by2q', teacherName: 'Nguyễn Thị Thúy Ngân', teacherPhone: '0399734316' },
  { id: 'cls_6a3', code: '6A3', name: '6A3', grade: 6, room: 'Phòng 103', isActive: true, teacherId: 'usr_1792072905165_hmbt', teacherName: 'Tống Văn Huấn', teacherPhone: '0376340998' },
  { id: 'cls_6a4', code: '6A4', name: '6A4', grade: 6, room: 'Phòng 104', isActive: true, teacherId: 'usr_1792072906366_pbui', teacherName: 'Lò Thị Chăn', teacherPhone: '0358196189' },
  { id: 'cls_6a5', code: '6A5', name: '6A5', grade: 6, room: 'Phòng 105', isActive: true, teacherId: 'usr_1792072909115_922g', teacherName: 'Nguyễn Thị Minh', teacherPhone: '0377155328' },

  // Khối 7 (5 lớp)
  { id: 'cls_7a1', code: '7A1', name: '7A1', grade: 7, room: 'Phòng 201', isActive: true, teacherId: 'usr_1792072910406_kdtz', teacherName: 'Ngô Thị Năm', teacherPhone: '0975902608' },
  { id: 'cls_7a2', code: '7A2', name: '7A2', grade: 7, room: 'Phòng 202', isActive: true, teacherId: 'usr_1792072911854_0lk1', teacherName: 'Nguyễn Văn Quang', teacherPhone: '0868746182' },
  { id: 'cls_7a3', code: '7A3', name: '7A3', grade: 7, room: 'Phòng 203', isActive: true, teacherId: 'usr_1792072913583_jybv', teacherName: 'Trần Đăng Tùng', teacherPhone: '0866878323' },
  { id: 'cls_7a4', code: '7A4', name: '7A4', grade: 7, room: 'Phòng 204', isActive: true, teacherId: 'usr_1792072914721_iu40', teacherName: 'Nguyễn Thị Thu', teacherPhone: '0983689145' },
  { id: 'cls_7a5', code: '7A5', name: '7A5', grade: 7, room: 'Phòng 205', isActive: true, teacherId: 'usr_1792072917601_1cqw', teacherName: 'Nguyễn Thị Thu', teacherPhone: '0987555090' },

  // Khối 8 (5 lớp)
  { id: 'cls_8a1', code: '8A1', name: '8A1', grade: 8, room: 'Phòng 301', isActive: true, teacherId: 'usr_1792072920620_qp13', teacherName: 'Phạm Văn Tuyến', teacherPhone: '0359347386' },
  { id: 'cls_8a2', code: '8A2', name: '8A2', grade: 8, room: 'Phòng 302', isActive: true, teacherId: 'usr_1792072921568_sutg', teacherName: 'Nguyễn Văn Tuấn', teacherPhone: '0869563353' },
  { id: 'cls_8a3', code: '8A3', name: '8A3', grade: 8, room: 'Phòng 303', isActive: true, teacherId: 'usr_1792072922706_c8ic', teacherName: 'Vũ Thị Bích Ngọc', teacherPhone: '0369785621' },
  { id: 'cls_8a4', code: '8A4', name: '8A4', grade: 8, room: 'Phòng 304', isActive: true, teacherId: 'usr_1792072924086_fwxs', teacherName: 'Nguyễn Thị Yến', teacherPhone: '0862925262' },
  { id: 'cls_8a5', code: '8A5', name: '8A5', grade: 8, room: 'Phòng 305', isActive: true, teacherId: 'usr_1792072926044_4kq7', teacherName: 'Nguyễn Chi Phương', teacherPhone: '0962259881' },

  // Khối 9 (5 lớp)
  { id: 'cls_9a1', code: '9A1', name: '9A1', grade: 9, room: 'Phòng 401', isActive: true, teacherId: 'usr_1792072927118_93ch', teacherName: 'Nguyễn Thị Thu Hằng', teacherPhone: '0362481532' },
  { id: 'cls_9a2', code: '9A2', name: '9A2', grade: 9, room: 'Phòng 402', isActive: true, teacherId: 'usr_1792072928839_vfr7', teacherName: 'Lò Bảo Dơng', teacherPhone: '0388710035' },
  { id: 'cls_9a3', code: '9A3', name: '9A3', grade: 9, room: 'Phòng 403', isActive: true, teacherId: 'usr_1792072930953_y68l', teacherName: 'Bùi Văn Sang', teacherPhone: '0339060668' },
  { id: 'cls_9a4', code: '9A4', name: '9A4', grade: 9, room: 'Phòng 404', isActive: true, teacherId: 'usr_1792072932248_47n6', teacherName: 'Trì Lệ Dung', teacherPhone: '0916084987' },
  { id: 'cls_9a5', code: '9A5', name: '9A5', grade: 9, room: 'Phòng 405', isActive: true, teacherId: 'usr_1792072933589_h5cs', teacherName: 'Nguyễn Minh Tuấn', teacherPhone: '0986449001' },
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

export const DEMO_PRESET_STUDENTS: Student[] = [];
// Danh sách học sinh trường THCS Bản Bo: Để trống để nhà trường tải lên danh sách học sinh thực tế từ file Excel
export const INITIAL_STUDENTS: Student[] = [];

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
    description: 'Yêu cầu kiểm tra lại lí do vắng của học sinh',
  },
];
