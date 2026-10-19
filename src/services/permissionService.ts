import { User, UserRole, UserPermissions } from '../types';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  ADMIN: {
    canManageUsers: true,
    canManageTeachers: true,
    canManageStudents: true,
    canManageClasses: true,
    canSubmitAttendance: true,
    canApproveAttendance: true,
    canFinalizeAttendance: true,
    canUnlockAttendance: true,
    canViewSchoolDashboard: true,
    canExportReports: true,
    canExportSchoolReports: true,
    canExportClassReports: true,
    canExportStudentAttendance: true,
    canManageBoarding: true,
    canManageSettings: true,
  },
  admin_tpt: {
    canManageUsers: true,
    canManageTeachers: true,
    canManageStudents: true,
    canManageClasses: true,
    canSubmitAttendance: true,
    canApproveAttendance: true,
    canFinalizeAttendance: true,
    canUnlockAttendance: true,
    canViewSchoolDashboard: true,
    canExportReports: true,
    canExportSchoolReports: true,
    canExportClassReports: true,
    canExportStudentAttendance: true,
    canManageBoarding: true,
    canManageSettings: true,
  },
  BOARD_OF_MANAGEMENT: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: false,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: true,
    canExportReports: true,
    canExportSchoolReports: true,
    canExportClassReports: true,
    canExportStudentAttendance: true,
    canManageBoarding: false,
    canManageSettings: false,
  },
  principal: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: false,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: true,
    canExportReports: true,
    canExportSchoolReports: true,
    canExportClassReports: true,
    canExportStudentAttendance: true,
    canManageBoarding: false,
    canManageSettings: false,
  },
  HEAD_TEACHER: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: true,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: false,
    canExportReports: false,
    canExportSchoolReports: false,
    canExportClassReports: true, // được xuất báo cáo lớp mình
    canExportStudentAttendance: true, // được xuất chuyên cần học sinh lớp mình
    canManageBoarding: false,
    canManageSettings: false,
  },
  teacher_gvcn: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: true,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: false,
    canExportReports: false,
    canExportSchoolReports: false,
    canExportClassReports: true,
    canExportStudentAttendance: true,
    canManageBoarding: false,
    canManageSettings: false,
  },
  VIEWER: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: false,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: true,
    canExportReports: false,
    canExportSchoolReports: false,
    canExportClassReports: false,
    canExportStudentAttendance: false,
    canManageBoarding: false,
    canManageSettings: false,
  },
  viewer: {
    canManageUsers: false,
    canManageTeachers: false,
    canManageStudents: false,
    canManageClasses: false,
    canSubmitAttendance: false,
    canApproveAttendance: false,
    canFinalizeAttendance: false,
    canUnlockAttendance: false,
    canViewSchoolDashboard: true,
    canExportReports: false,
    canExportSchoolReports: false,
    canExportClassReports: false,
    canExportStudentAttendance: false,
    canManageBoarding: false,
    canManageSettings: false,
  },
};

export const PERMISSION_LABELS: Record<keyof UserPermissions, { title: string; description: string }> = {
  canManageUsers: {
    title: 'Quản lý tài khoản',
    description: 'Tạo, khóa, mở khóa, gửi liên kết đặt lại mật khẩu cho người dùng',
  },
  canManageTeachers: {
    title: 'Quản lý hồ sơ giáo viên',
    description: 'Thêm, sửa thông tin và theo dõi tình trạng công tác của giáo viên',
  },
  canManageClasses: {
    title: 'Phân công GVCN lớp',
    description: 'Phân công hoặc thay đổi GVCN chính và GVCN thay thế tạm thời cho 20 lớp',
  },
  canManageStudents: {
    title: 'Quản lý danh sách học sinh',
    description: 'Nhập học sinh từ Excel, kiểm tra và chỉnh sửa hồ sơ học sinh',
  },
  canSubmitAttendance: {
    title: 'Báo cáo sĩ số buổi sáng',
    description: 'Điểm danh và gửi báo cáo sĩ số, lý do vắng học sinh của lớp',
  },
  canApproveAttendance: {
    title: 'Phê duyệt báo cáo',
    description: 'Kiểm duyệt và phê duyệt báo cáo sĩ số các lớp gửi về',
  },
  canFinalizeAttendance: {
    title: 'Chốt số liệu toàn trường',
    description: 'Chốt báo cáo chính thức và lưu trữ nhật ký sĩ số ngày',
  },
  canUnlockAttendance: {
    title: 'Mở khóa báo cáo',
    description: 'Cho phép GVCN nộp lại hoặc chỉnh sửa báo cáo sau giờ quy định',
  },
  canViewSchoolDashboard: {
    title: 'Xem Dashboard toàn trường',
    description: 'Xem tổng quan sĩ số, biểu đồ, tỷ lệ chuyên cần và danh sách vắng toàn trường',
  },
  canExportReports: {
    title: 'Xuất báo cáo & Excel',
    description: 'Xuất file Excel, PDF và các biểu mẫu thống kê định kỳ',
  },
  canExportSchoolReports: {
    title: 'Xuất báo cáo toàn trường',
    description: 'Xuất file Excel và PDF báo cáo tổng hợp cấp trường',
  },
  canExportClassReports: {
    title: 'Xuất báo cáo theo lớp',
    description: 'Xuất file danh sách sĩ số và tình hình chuyên cần của lớp',
  },
  canExportStudentAttendance: {
    title: 'Xuất hồ sơ chuyên cần HS',
    description: 'Xuất chi tiết lịch sử chuyên cần của học sinh',
  },
  canManageBoarding: {
    title: 'Quản lý bán trú',
    description: 'Thiết lập danh sách học sinh ăn nghỉ trưa bán trú',
  },
  canManageSettings: {
    title: 'Cài đặt hệ thống',
    description: 'Cấu hình năm học, thông tin trường và quy chế điểm danh',
  },
};

const CUSTOM_PERMISSIONS_STORAGE_KEY = 'thcs_banbo_role_permissions';

class PermissionService {
  public getDefaultPermissions(role: UserRole): UserPermissions {
    const custom = this.getCustomRolePermissions();
    if (custom[role]) {
      return custom[role];
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['VIEWER'];
  }

  public getCustomRolePermissions(): Record<string, UserPermissions> {
    try {
      const raw = localStorage.getItem(CUSTOM_PERMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_ROLE_PERMISSIONS;
    } catch {
      return DEFAULT_ROLE_PERMISSIONS;
    }
  }

  public saveRolePermissions(role: string, perms: UserPermissions) {
    const all = this.getCustomRolePermissions();
    all[role] = perms;
    localStorage.setItem(CUSTOM_PERMISSIONS_STORAGE_KEY, JSON.stringify(all));
  }

  public hasPermission(user: User | null, permission: keyof UserPermissions): boolean {
    if (!user) return false;
    if (user.role === 'admin_tpt' || user.role === 'ADMIN') return true; // ADMIN luôn có toàn quyền
    if (user.permissions && user.permissions[permission] !== undefined) {
      return user.permissions[permission];
    }
    const def = this.getDefaultPermissions(user.role);
    return !!def[permission];
  }
}

export const permissionService = new PermissionService();
