import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { teacherService } from '../services/teacherService';
import { storageService } from '../services/storageService';
import { User, Teacher, UserRole, AccountStatus } from '../types';
import {
  UserCog,
  Users,
  Search,
  Filter,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Plus,
  Sparkles,
  Mail,
  UserCheck,
  Building2,
  X,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Check,
  Phone,
  Power,
  Shield,
  RefreshCw,
  ExternalLink,
  Pencil,
  AtSign,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>(() => userService.getUsers());
  const [teachers, setTeachers] = useState<Teacher[]>(() => teacherService.getTeachers());

  // Active Tab
  const [activeTab, setActiveTab] = useState<'TEACHERS' | 'ALL_USERS'>('TEACHERS');

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Lock Modal
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [targetLockUser, setTargetLockUser] = useState<User | null>(null);
  const [lockReason, setLockReason] = useState('');

  // Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRoleUser, setTargetRoleUser] = useState<User | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('HEAD_TEACHER');

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetPasswordPerson, setTargetPasswordPerson] = useState<{
    id: string;
    name: string;
    email: string;
    username: string;
    className?: string;
    isTeacher: boolean;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireChangeOnFirstLogin, setRequireChangeOnFirstLogin] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Edit Username Modal
  const [isEditUsernameModalOpen, setIsEditUsernameModalOpen] = useState(false);
  const [targetEditUser, setTargetEditUser] = useState<User | null>(null);
  const [editNewUsername, setEditNewUsername] = useState('');
  const [editUsernameError, setEditUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Handover / Credential result modal
  const [credentialModalData, setCredentialModalData] = useState<{
    name: string;
    username: string;
    email: string;
    className?: string;
    password: string;
    requireChangeOnFirstLogin: boolean;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Bulk Create Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<'PREVIEW' | 'RESULT'>('PREVIEW');
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string, link?: string) => {
    setNotification({ type, message, link });
    setTimeout(() => setNotification(null), 7000);
  };

  const refreshData = () => {
    setUsers(userService.getUsers());
    setTeachers(teacherService.getTeachers());
  };

  // Helper map teacher to user
  const teachersWithAccounts = useMemo(() => {
    return teachers.map(tch => {
      const cleanEmail = tch.email.trim().toLowerCase();
      const matchedUser = users.find(
        u => (tch.id && u.teacherId === tch.id) || (u.email && u.email.toLowerCase() === cleanEmail)
      );
      const isAccountActive = matchedUser ? matchedUser.isActive && matchedUser.accountStatus === 'ACTIVE' : tch.accountStatus === 'ACTIVE';
      const isAccountLocked = matchedUser ? matchedUser.accountStatus === 'LOCKED' || !matchedUser.isActive : tch.accountStatus === 'LOCKED';
      const hasPassword = !!matchedUser?.password;

      return {
        teacher: tch,
        user: matchedUser,
        isAccountActive,
        isAccountLocked,
        hasPassword,
        statusText: isAccountLocked
          ? 'ĐÃ KHÓA'
          : isAccountActive
          ? 'HOẠT ĐỘNG'
          : matchedUser
          ? 'CHỜ KÍCH HOẠT'
          : 'CHƯA TẠO TK',
      };
    });
  }, [teachers, users]);

  // Filtered teachers tab
  const filteredTeachers = useMemo(() => {
    return teachersWithAccounts.filter(({ teacher, user, isAccountActive, isAccountLocked }) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = teacher.fullName.toLowerCase().includes(q);
        const mEmail = teacher.email.toLowerCase().includes(q);
        const mClass = (teacher.assignedClassName || '').toLowerCase().includes(q);
        const mCode = (teacher.teacherCode || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mClass && !mCode) return false;
      }

      if (roleFilter !== 'ALL') {
        const roleUpper = teacher.role.toUpperCase();
        if (roleFilter === 'GVCN' && roleUpper !== 'HEAD_TEACHER' && teacher.role !== 'teacher_gvcn') return false;
        if (roleFilter === 'BGH' && roleUpper !== 'BOARD_OF_MANAGEMENT' && teacher.role !== 'principal') return false;
        if (roleFilter === 'ADMIN' && roleUpper !== 'ADMIN' && teacher.role !== 'admin_tpt') return false;
        if (roleFilter === 'VIEWER' && roleUpper !== 'VIEWER' && teacher.role !== 'viewer') return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && !isAccountActive) return false;
        if (statusFilter === 'LOCKED' && !isAccountLocked) return false;
        if (statusFilter === 'NOT_ACTIVE' && (isAccountActive || isAccountLocked)) return false;
      }

      return true;
    });
  }, [teachersWithAccounts, searchTerm, roleFilter, statusFilter]);

  // Filtered users tab
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = u.name.toLowerCase().includes(q);
        const mEmail = u.email.toLowerCase().includes(q);
        const mClass = (u.assignedClassName || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mClass) return false;
      }

      if (roleFilter !== 'ALL') {
        const roleUpper = u.role.toUpperCase();
        if (roleFilter === 'GVCN' && roleUpper !== 'HEAD_TEACHER' && u.role !== 'teacher_gvcn') return false;
        if (roleFilter === 'BGH' && roleUpper !== 'BOARD_OF_MANAGEMENT' && u.role !== 'principal') return false;
        if (roleFilter === 'ADMIN' && roleUpper !== 'ADMIN' && u.role !== 'admin_tpt') return false;
        if (roleFilter === 'VIEWER' && roleUpper !== 'VIEWER' && u.role !== 'viewer') return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE' && (!u.isActive || u.accountStatus === 'LOCKED')) return false;
        if (statusFilter === 'LOCKED' && u.isActive && u.accountStatus !== 'LOCKED') return false;
      }

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Thống kê
  const totalTeacherCount = teachers.length;
  const activeTeacherCount = teachersWithAccounts.filter(t => t.isAccountActive).length;
  const lockedTeacherCount = teachersWithAccounts.filter(t => t.isAccountLocked).length;
  const pendingTeacherCount = totalTeacherCount - activeTeacherCount - lockedTeacherCount;

  // XỬ LÝ KÍCH HOẠT TÀI KHOẢN GIÁO VIÊN
  const handleActivateTeacher = async (tch: Teacher) => {
    const res = await userService.activateTeacherAccount(
      tch.id,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // XỬ LÝ KÍCH HOẠT TÀI KHOẢN TỪ USER RECORD
  const handleActivateUser = async (u: User) => {
    const res = await userService.activateTeacherAccount(
      u.id,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // MỞ MODAL ĐẶT MẬT KHẨU
  const handleOpenPasswordModalForTeacher = (tch: Teacher, matchedUser?: User) => {
    const username = matchedUser?.username || tch.email.split('@')[0] || `gv_${tch.assignedClassName?.toLowerCase() || 'banbo'}`;
    setTargetPasswordPerson({
      id: tch.id,
      name: tch.fullName,
      email: tch.email,
      username,
      className: tch.assignedClassName,
      isTeacher: true,
    });
    // Gợi ý mật khẩu mặc định mạnh
    const suggested = userService.generateSuggestedPassword(tch.assignedClassName ? `BanBo${tch.assignedClassName}` : 'BanBo');
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
    setRequireChangeOnFirstLogin(true);
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handleOpenPasswordModalForUser = (u: User) => {
    setTargetPasswordPerson({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username || u.email.split('@')[0],
      className: u.assignedClassName,
      isTeacher: false,
    });
    const suggested = userService.generateSuggestedPassword(u.assignedClassName ? `BanBo${u.assignedClassName}` : 'BanBo');
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
    setRequireChangeOnFirstLogin(true);
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  // SINH MẬT KHẨU GỢI Ý MỚI
  const handleGenerateNewRandomPassword = () => {
    const prefix = targetPasswordPerson?.className ? `BanBo${targetPasswordPerson.className}` : 'BanBo';
    const suggested = userService.generateSuggestedPassword(prefix);
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
  };

  // LƯU MẬT KHẨU MỚI
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPasswordPerson) return;

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordError('Mật khẩu phải có độ dài tối thiểu 4 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError(null);

    const res = await userService.setPasswordForTeacher(
      targetPasswordPerson.id,
      newPassword.trim(),
      requireChangeOnFirstLogin,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    setIsSettingPassword(false);

    if (res.success && res.credentials) {
      setIsPasswordModalOpen(false);
      setCredentialModalData(res.credentials);
      showNotify('success', res.message);
      refreshData();
    } else {
      setPasswordError(res.message);
    }
  };

  // SAO CHÉP THÔNG TIN TÀI KHOẢN VÀ MẬT KHẨU
  const handleCopyCredentials = () => {
    if (!credentialModalData) return;
    const textToCopy = `TRƯỜNG THCS BẢN BO - THÔNG TIN TÀI KHOẢN ĐIỂM DANH SĨ SỐ
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kính gửi Thầy/Cô: ${credentialModalData.name}
${credentialModalData.className ? `Phụ trách: Lớp ${credentialModalData.className}` : ''}
Email đăng nhập: ${credentialModalData.email}
Tên đăng nhập: ${credentialModalData.username}
Mật khẩu mới: ${credentialModalData.password}
${credentialModalData.requireChangeOnFirstLogin ? '(Lưu ý: Hệ thống sẽ yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên)' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Đường link đăng nhập: https://thcsbanbo.edu.vn/login`;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Xử lý Khóa tài khoản
  const handleOpenLockModal = (u: User) => {
    setTargetLockUser(u);
    setLockReason('');
    setIsLockModalOpen(true);
  };

  const handleConfirmLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLockUser) return;

    const res = userService.lockUserAccount(
      targetLockUser.id,
      lockReason,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      setIsLockModalOpen(false);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // Mở khóa tài khoản
  const handleUnlockUser = (u: User) => {
    const res = userService.unlockUserAccount(
      u.id,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // Gửi liên kết đặt lại mật khẩu
  const handleSendResetPassword = (u: User) => {
    const res = userService.sendPasswordReset(
      u.email,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message, res.resetLink);
    } else {
      showNotify('error', res.message);
    }
  };

  // Đổi vai trò (Role)
  const handleOpenRoleModal = (u: User) => {
    setTargetRoleUser(u);
    setSelectedNewRole(u.role);
    setIsRoleModalOpen(true);
  };

  const handleConfirmRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRoleUser) return;

    const res = userService.changeUserRole(
      targetRoleUser.id,
      selectedNewRole,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      setIsRoleModalOpen(false);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // Mở modal sửa tên đăng nhập
  const handleOpenEditUsername = (u: User) => {
    setTargetEditUser(u);
    setEditNewUsername(u.username || '');
    setEditUsernameError(null);
    setIsEditUsernameModalOpen(true);
  };

  const handleConfirmEditUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEditUser) return;
    setEditUsernameError(null);
    setIsSavingUsername(true);

    const res = userService.updateUsername(
      targetEditUser.id,
      editNewUsername,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Vũ Hồng Phương'
    );

    setIsSavingUsername(false);
    if (res.success) {
      showNotify('success', res.message);
      setIsEditUsernameModalOpen(false);
      refreshData();
    } else {
      setEditUsernameError(res.message);
    }
  };

  // Mở modal tạo tài khoản hàng loạt cho 20 lớp
  const handleOpenBulkModal = () => {
    setBulkStep('PREVIEW');
    setBulkResult(null);
    setIsBulkModalOpen(true);
  };

  const handleExecuteBulkCreate = async () => {
    setIsBulkLoading(true);
    const teacherIdsToCreate = teachers
      .filter(t => t.employmentStatus === 'ACTIVE' && t.assignedClassName)
      .map(t => t.id);

    const res = await userService.bulkCreateTeacherAccounts(
      teacherIdsToCreate,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    setIsBulkLoading(false);
    setBulkResult(res);
    setBulkStep('RESULT');
    refreshData();
  };

  // Kích hoạt tất cả tài khoản chưa kích hoạt
  const handleActivateAllAccounts = async () => {
    const res = await userService.activateAllPendingAccounts(
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Vũ Hồng Phương'
    );
    if (res.success) {
      showNotify('success', res.message);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  // Xóa tài khoản thử nghiệm để kích hoạt chính thức
  const handleClearDemoAccounts = () => {
    storageService.clearDemoTeacherAccounts();
    showNotify('success', 'Đã xóa toàn bộ tài khoản giáo viên thử nghiệm! Danh sách 20 GVCN hiện ở trạng thái sẵn sàng để Thầy/Cô kích hoạt chính thức.');
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Bảo Mật & Phân Quyền · Trường THCS Bản Bo
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Trị Tài Khoản & Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kích hoạt tài khoản trực tiếp cho từng giáo viên, thiết lập mật khẩu đăng nhập an toàn và quản lý quyền truy cập
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleClearDemoAccounts}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer transition-all active:scale-98"
              title="Xóa toàn bộ tài khoản giáo viên thử nghiệm và đưa 20 GVCN về trạng thái chờ kích hoạt chính thức"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Xóa TK Thử Nghiệm</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBulkModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Tạo & Kích Hoạt GVCN Hàng Loạt</span>
            </button>

            <button
              type="button"
              onClick={handleActivateAllAccounts}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98"
              title="Kích hoạt toàn bộ tài khoản chưa kích hoạt trong hệ thống"
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>Kích Hoạt Tất Cả</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold space-y-1.5 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          {notification.link && (
            <div className="pl-7 pt-1">
              <span className="text-[11px] text-slate-600">Liên kết an toàn để gửi cho giáo viên: </span>
              <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 text-[11px] select-all">
                {notification.link}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Giáo Viên</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalTeacherCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">giáo viên trong hồ sơ</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Đã Kích Hoạt</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeTeacherCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">được phép đăng nhập</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Chưa Kích Hoạt / Chờ</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingTeacherCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">cần kích hoạt & đặt mật khẩu</div>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs">
          <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Đã Khóa</div>
          <div className="text-2xl font-black text-red-700 mt-1">{lockedTeacherCount}</div>
          <div className="text-[10px] text-red-600 mt-0.5">tạm ngừng quyền truy cập</div>
        </div>
      </div>

      {/* Activation Status Banner */}
      {pendingTeacherCount > 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Hiện có <strong>{pendingTeacherCount}</strong> tài khoản giáo viên chưa được kích hoạt hoặc chờ cấp mật khẩu.
            </span>
          </div>
          <button
            type="button"
            onClick={handleActivateAllAccounts}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>Kích hoạt tất cả ngay</span>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Hệ thống đã sẵn sàng ban hành: Thầy <strong>Hoàng Xuân Nhật (Hiệu trưởng)</strong>, Cô <strong>Phạm Ngọc Thúy (Tổng phụ trách Đội)</strong>, Thầy/Cô <strong>Vũ Hồng Phương (Quản trị viên)</strong> cùng toàn thể Giáo viên Chủ nhiệm (20 lớp) đều đã được kích hoạt tài khoản chính thức!
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('TEACHERS')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'TEACHERS'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tài Khoản Giáo Viên & GVCN ({teachers.length})</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
            20 Lớp Chính Thức
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL_USERS')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'ALL_USERS'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tất Cả Tài Khoản Hệ Thống ({users.length})</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, email, lớp, mã GV..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="GVCN">Giáo viên chủ nhiệm (HEAD_TEACHER)</option>
            <option value="BGH">Ban Giám hiệu (BOARD_OF_MANAGEMENT)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="VIEWER">Chỉ xem (VIEWER)</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đã kích hoạt / Hoạt động</option>
            <option value="NOT_ACTIVE">Chưa kích hoạt / Chờ tạo</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>

        {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl font-semibold cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* TAB 1: TEACHERS & HEAD TEACHERS TABLE (Mục tiêu trọng tâm: Kích hoạt & Đặt mật khẩu) */}
      {activeTab === 'TEACHERS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="font-black text-slate-800 text-xs uppercase tracking-wide">
                Danh Sách Giáo Viên Chủ Nhiệm 20 Lớp & Giáo Viên Bộ Môn
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Hiển thị {filteredTeachers.length} / {teachers.length} giáo viên
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold w-12 text-center">STT</th>
                  <th className="p-3.5 font-bold">Giáo viên</th>
                  <th className="p-3.5 font-bold">Lớp chủ nhiệm</th>
                  <th className="p-3.5 font-bold">Email tài khoản</th>
                  <th className="p-3.5 font-bold">Số điện thoại</th>
                  <th className="p-3.5 font-bold text-center">Trạng thái TK</th>
                  <th className="p-3.5 font-bold text-center">Mật khẩu</th>
                  {isAdmin && <th className="p-3.5 font-bold text-center w-64">Thao tác tài khoản</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Không tìm thấy giáo viên nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(({ teacher: tch, user, isAccountActive, isAccountLocked, hasPassword }, idx) => {
                    const isCurrent = user?.id === currentUser?.id;
                    return (
                      <tr key={tch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-black text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{tch.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Mã GV: <span className="font-mono font-bold">{tch.teacherCode}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {tch.assignedClassName ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-xs border border-blue-200">
                              Lớp {tch.assignedClassName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa phân lớp</span>
                          )}
                        </td>
                        <td className="p-3.5 font-medium text-slate-700">
                          <div>{tch.email}</div>
                          {user?.username && (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>User: <strong className="text-blue-900">{user.username}</strong></span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUsername(user)}
                                  className="text-amber-700 hover:text-amber-900 font-sans font-bold flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-amber-100 cursor-pointer text-[10px]"
                                  title="Sửa tên đăng nhập"
                                >
                                  <Pencil className="w-2.5 h-2.5" /> Sửa
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 font-medium">
                          {tch.phone || 'Chưa cập nhật'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isAccountLocked
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : isAccountActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isAccountLocked ? (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>ĐÃ KHÓA</span>
                              </>
                            ) : isAccountActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>HOẠT ĐỘNG</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>CHƯA KÍCH HOẠT</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {hasPassword ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <KeyRound className="w-3 h-3 text-indigo-600" />
                              <span>Đã đặt</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Mặc định</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* 1. NÚT KÍCH HOẠT TÀI KHOẢN (Cho từng giáo viên) */}
                              {!isAccountActive || isAccountLocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivateTeacher(tch)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                                  title="Kích hoạt tài khoản ngay cho giáo viên này"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Kích hoạt</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isCurrent}
                                  onClick={() => user && handleOpenLockModal(user)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                    isCurrent
                                      ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                      : 'text-slate-600 hover:text-red-700 hover:bg-red-50 border-slate-200 cursor-pointer'
                                  }`}
                                  title={isCurrent ? 'Không thể tự khóa tài khoản của bạn' : 'Khóa tài khoản'}
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Khóa</span>
                                </button>
                              )}

                              {/* 2. NÚT ĐẶT MẬT KHẨU (Cho từng giáo viên) */}
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModalForTeacher(tch, user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                                title="Đặt mật khẩu đăng nhập cho giáo viên này"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                                <span>Đặt mật khẩu</span>
                              </button>

                              {/* 3. NÚT SỬA TÊN ĐĂNG NHẬP (Cho từng giáo viên) */}
                              {user && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUsername(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                                  title="Chỉnh sửa tên đăng nhập của giáo viên này"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Sửa tên ĐN</span>
                                </button>
                              )}

                              {/* 4. Nút phân vai trò nếu có User */}
                              {user && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRoleModal(user)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                                  title="Đổi vai trò & phân quyền"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ALL SYSTEM USERS TABLE */}
      {activeTab === 'ALL_USERS' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="font-black text-slate-800 text-xs uppercase tracking-wide">
                Tất Cả Người Dùng Hệ Thống (Admin, BGH, GVCN, Viewer)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Hiển thị {filteredUsers.length} / {users.length} tài khoản
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold w-12 text-center">STT</th>
                  <th className="p-3.5 font-bold">Họ và tên</th>
                  <th className="p-3.5 font-bold">Email / Tên đăng nhập</th>
                  <th className="p-3.5 font-bold">Vai trò (Role)</th>
                  <th className="p-3.5 font-bold">Lớp phân công</th>
                  <th className="p-3.5 font-bold text-center">Trạng thái</th>
                  <th className="p-3.5 font-bold">Đăng nhập gần nhất</th>
                  {isAdmin && <th className="p-3.5 font-bold text-center w-56">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Không tìm thấy tài khoản người dùng nào.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isLocked = !u.isActive || u.accountStatus === 'LOCKED';
                    const isCurrent = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-black text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.title}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-700">{u.email}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>User: <strong className="text-blue-900">{u.username}</strong></span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditUsername(u)}
                                className="text-amber-700 hover:text-amber-900 font-sans font-bold flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-amber-100 cursor-pointer text-[10px]"
                                title="Sửa tên đăng nhập"
                              >
                                <Pencil className="w-2.5 h-2.5" /> Sửa
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.role === 'ADMIN' || u.role === 'admin_tpt'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'BOARD_OF_MANAGEMENT' || u.role === 'principal'
                                ? 'bg-indigo-100 text-indigo-800'
                                : u.role === 'VIEWER' || u.role === 'viewer'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {u.role.toUpperCase() === 'HEAD_TEACHER' || u.role === 'teacher_gvcn'
                              ? 'GV CHỦ NHIỆM'
                              : u.role.toUpperCase() === 'BOARD_OF_MANAGEMENT' || u.role === 'principal'
                              ? 'HIỆU TRƯỞNG (BGH)'
                              : u.role.toUpperCase() === 'ADMIN' || u.role === 'admin_tpt'
                              ? (u.title?.includes('Tổng Phụ') || u.name?.includes('Thúy') || u.id === 'user_tpt' ? 'TỔNG PHỤ TRÁCH ĐỘI' : 'QUẢN TRỊ VIÊN')
                              : 'GIÁM SÁT / XEM'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {u.assignedClassName ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-xs">
                              Lớp {u.assignedClassName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isLocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLocked ? 'ĐÃ KHÓA' : 'HOẠT ĐỘNG'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Kích hoạt nếu bị khóa */}
                              {isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivateUser(u)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  title="Kích hoạt lại tài khoản"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Kích hoạt</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isCurrent}
                                  onClick={() => handleOpenLockModal(u)}
                                  className={`p-1.5 rounded-lg ${
                                    isCurrent
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-red-600 hover:bg-red-50 cursor-pointer'
                                  }`}
                                  title={isCurrent ? 'Không thể tự khóa tài khoản của bạn' : 'Khóa tài khoản'}
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              )}

                              {/* Đặt mật khẩu */}
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModalForUser(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer"
                                title="Đặt mật khẩu"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                                <span>Đặt MK</span>
                              </button>

                              {/* Sửa tên đăng nhập */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUsername(u)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                                title="Sửa tên đăng nhập tài khoản này"
                              >
                                <Pencil className="w-3 h-3 text-amber-700" />
                                <span>Sửa tên ĐN</span>
                              </button>

                              {/* Đổi Role */}
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(u)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                                title="Đổi vai trò & phân quyền"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ĐẶT MẬT KHẨU CHO GIÁO VIÊN / TÀI KHOẢN                */}
      {/* ============================================================== */}
      {isPasswordModalOpen && targetPasswordPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Đặt Mật Khẩu Đăng Nhập
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấp mật khẩu an toàn và đồng bộ kích hoạt tài khoản
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin giáo viên */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Giáo viên:</span>
                <span className="font-black text-slate-900 text-sm">{targetPasswordPerson.name}</span>
              </div>
              {targetPasswordPerson.className && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chủ nhiệm:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-xs">
                    Lớp {targetPasswordPerson.className}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-700">{targetPasswordPerson.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-slate-800">{targetPasswordPerson.username}</span>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewRandomPassword}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo mật khẩu gợi ý</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requireChangeOnFirstLogin"
                  checked={requireChangeOnFirstLogin}
                  onChange={e => setRequireChangeOnFirstLogin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="requireChangeOnFirstLogin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Yêu cầu giáo viên đổi mật khẩu ở lần đăng nhập đầu tiên
                </label>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                Sau khi lưu, tài khoản sẽ được chuyển sang trạng thái <strong>HOẠT ĐỘNG</strong> và bạn có thể sao chép thông tin để gửi qua Zalo cho thầy/cô.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSettingPassword}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSettingPassword ? 'Đang lưu...' : 'Lưu Mật Khẩu & Kích Hoạt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: THÔNG BÁO BÀN GIAO TÀI KHOẢN (Copyable Zalo / SMS)     */}
      {/* ============================================================== */}
      {credentialModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Đã Thiết Lập Mật Khẩu Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tài khoản đã sẵn sàng đăng nhập vào hệ thống
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Bạn có thể sao chép thông tin bên dưới để gửi tin nhắn thông báo cho giáo viên qua <strong>Zalo</strong> hoặc <strong>SMS</strong>:
            </p>

            {/* Box sao chép thông tin */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs space-y-2 border border-slate-800 relative group">
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                THCS BẢN BO · THÔNG TIN TÀI KHOẢN
              </div>
              <div className="pt-1 space-y-1 text-slate-200">
                <div>Thầy/Cô: <strong className="text-white">{credentialModalData.name}</strong></div>
                {credentialModalData.className && (
                  <div>Phụ trách: <strong className="text-blue-300">Lớp {credentialModalData.className}</strong></div>
                )}
                <div>Email: <strong className="text-white">{credentialModalData.email}</strong></div>
                <div>Tên đăng nhập: <strong className="text-emerald-300">{credentialModalData.username}</strong></div>
                <div>Mật khẩu: <strong className="text-amber-300 text-sm">{credentialModalData.password}</strong></div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Đăng nhập tại: https://thcsbanbo.edu.vn/login
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Đã sao chép vào bộ nhớ tạm!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép thông tin gửi Zalo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCredentialModalData(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KHÓA TÀI KHOẢN                                        */}
      {/* ============================================================== */}
      {isLockModalOpen && targetLockUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Khóa Tài Khoản Người Dùng</h4>
                <p className="text-xs text-slate-500">{targetLockUser.name} ({targetLockUser.email})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sau khi khóa, người dùng sẽ không thể đăng nhập vào hệ thống để báo cáo sĩ số hoặc xem thông tin.
            </p>

            <form onSubmit={handleConfirmLock} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do khóa tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lockReason}
                  onChange={e => setLockReason(e.target.value)}
                  placeholder="Ví dụ: Tạm dừng công tác, chuyển công tác..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác nhận khóa tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ĐỔI VAI TRÒ (ROLE)                                    */}
      {/* ============================================================== */}
      {isRoleModalOpen && targetRoleUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-base">
              Phân Quyền Vai Trò: {targetRoleUser.name}
            </h4>

            <form onSubmit={handleConfirmRole} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Chọn vai trò mới</label>
                <select
                  value={selectedNewRole}
                  onChange={e => setSelectedNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="HEAD_TEACHER">Giáo viên chủ nhiệm (HEAD_TEACHER)</option>
                  <option value="BOARD_OF_MANAGEMENT">Ban Giám hiệu (BOARD_OF_MANAGEMENT)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="VIEWER">Chỉ xem báo cáo (VIEWER)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: TẠO TÀI KHOẢN HÀNG LOẠT                               */}
      {/* ============================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base uppercase">
                  Tạo & Kích Hoạt Tài Khoản GVCN Hàng Loạt (20 Lớp Chính Thức)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy trình an toàn: kiểm tra email, tạo Auth User và kích hoạt ngay cho 20 lớp chính thức
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkStep === 'PREVIEW' ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-600">
                  Hệ thống đã rà soát 20 giáo viên được phân công chủ nhiệm năm học 2026–2027:
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {teachers
                    .filter(t => t.assignedClassName)
                    .map((t, idx) => {
                      const alreadyHasAccount = users.some(u => u.email.toLowerCase() === t.email.toLowerCase());
                      const hasEmail = !!t.email.trim();
                      return (
                        <div key={t.id} className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400 w-5">{idx + 1}</span>
                            <span className="font-extrabold text-slate-900">{t.fullName}</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-black text-[11px]">
                              Lớp {t.assignedClassName}
                            </span>
                            <span className="text-slate-500">{t.email || '(Thiếu email)'}</span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              alreadyHasAccount
                                ? 'bg-slate-100 text-slate-600'
                                : hasEmail
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {alreadyHasAccount ? 'ĐÃ CÓ TÀI KHOẢN' : hasEmail ? 'SẴN SÀNG TẠO' : 'THIẾU EMAIL'}
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    HỦY
                  </button>
                  <button
                    type="button"
                    disabled={isBulkLoading}
                    onClick={handleExecuteBulkCreate}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {isBulkLoading ? <span>Đang tạo tài khoản...</span> : <span>XÁC NHẬN TẠO & KÍCH HOẠT HÀNG LOẠT</span>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Tổng số</div>
                    <div className="text-xl font-black text-slate-800 mt-0.5">{bulkResult?.total}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="text-emerald-700 text-[10px] uppercase font-bold">Thành công</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">{bulkResult?.successCount}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-blue-700 text-[10px] uppercase font-bold">Đã có từ trước</div>
                    <div className="text-xl font-black text-blue-700 mt-0.5">{bulkResult?.alreadyExistsCount}</div>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="text-amber-700 text-[10px] uppercase font-bold">Thiếu email</div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">{bulkResult?.missingEmailCount}</div>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  {bulkResult?.details?.map((d: any, i: number) => (
                    <div key={i} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{d.teacherName}</span>{' '}
                        <span className="text-slate-400">({d.email || 'Chưa có'})</span> · Lớp {d.className}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          d.status === 'SUCCESS' ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {d.message}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    HOÀN TẤT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: CHỈNH SỬA TÊN ĐĂNG NHẬP (USERNAME)                     */}
      {/* ============================================================== */}
      {isEditUsernameModalOpen && targetEditUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase">
                    Chỉnh Sửa Tên Đăng Nhập
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {targetEditUser.name} · {targetEditUser.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUsernameModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUsernameError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editUsernameError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmEditUsername} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500 text-[11px]">Tên đăng nhập hiện tại:</div>
                <div className="font-mono font-bold text-slate-800 text-sm">
                  {targetEditUser.username || '(Chưa có)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Email liên kết: {targetEditUser.email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên đăng nhập mới *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editNewUsername}
                    onChange={(e) => setEditNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="ví dụ: vuhongphuong hoặc gv_6a1"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-mono text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Quy tắc: Ít nhất 3 ký tự, viết liền không dấu, không khoảng cách. Tên đăng nhập này sẽ dùng để đăng nhập vào phần mềm và đồng bộ lên Supabase.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditUsernameModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingUsername}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingUsername ? 'ĐANG LƯU...' : 'LƯU TÊN ĐĂNG NHẬP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
