import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherService } from '../services/teacherService';
import { userService } from '../services/userService';
import { storageService } from '../services/storageService';
import { Teacher, EmploymentStatus, UserRole } from '../types';
import { OFFICIAL_CLASS_NAMES } from '../services/studentValidationService';
import * as XLSX from 'xlsx';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Building2,
  Shield,
  X,
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teachers, setTeachers] = useState<Teacher[]>(() => teacherService.getTeachers());
  const classes = storageService.getClasses();

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetTeacher, setStatusTargetTeacher] = useState<Teacher | null>(null);
  const [newStatus, setNewStatus] = useState<EmploymentStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Excel Import Preview Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetPasswordTeacher, setTargetPasswordTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireChangeOnFirstLogin, setRequireChangeOnFirstLogin] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

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

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    teacherCode: '',
    email: '',
    phone: '',
    role: 'HEAD_TEACHER' as UserRole,
    assignedClassId: '',
    employmentStatus: 'ACTIVE' as EmploymentStatus,
    notes: '',
  });

  const refreshTeachers = () => {
    setTeachers(teacherService.getTeachers());
  };

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      teacherCode: `GV-${String(teachers.length + 1).padStart(2, '0')}`,
      email: '',
      phone: '',
      role: 'HEAD_TEACHER',
      assignedClassId: '',
      employmentStatus: 'ACTIVE',
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (tch: Teacher) => {
    setEditingTeacher(tch);
    setFormData({
      fullName: tch.fullName,
      teacherCode: tch.teacherCode,
      email: tch.email,
      phone: tch.phone,
      role: tch.role,
      assignedClassId: tch.assignedClassId || '',
      employmentStatus: tch.employmentStatus,
      notes: tch.notes || '',
    });
    setIsFormModalOpen(true);
  };

  // Save Teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      // Sửa
      const res = teacherService.updateTeacher(
        editingTeacher.id,
        {
          fullName: formData.fullName,
          teacherCode: formData.teacherCode,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          assignedClassId: formData.assignedClassId || undefined,
          assignedClassName: classes.find(c => c.id === formData.assignedClassId)?.name || undefined,
          notes: formData.notes,
        },
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      if (res.success) {
        showNotify('success', res.message);
        setIsFormModalOpen(false);
        refreshTeachers();
      } else {
        showNotify('error', res.message);
      }
    } else {
      // Thêm mới
      const res = teacherService.createTeacher(
        formData,
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      if (res.success) {
        showNotify('success', res.message);
        setIsFormModalOpen(false);
        refreshTeachers();
      } else {
        showNotify('error', res.message);
      }
    }
  };

  // Open Status Modal
  const handleOpenStatusModal = (tch: Teacher) => {
    setStatusTargetTeacher(tch);
    setNewStatus(tch.employmentStatus);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  // Save Employment Status
  const handleSaveEmploymentStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetTeacher) return;

    const res = teacherService.setEmploymentStatus(
      statusTargetTeacher.id,
      newStatus,
      statusReason,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      setIsStatusModalOpen(false);
      refreshTeachers();
    } else {
      showNotify('error', res.message);
    }
  };

  // Kích hoạt tài khoản trực tiếp cho giáo viên
  const handleActivateTeacher = async (tch: Teacher) => {
    const res = await userService.activateTeacherAccount(
      tch.id,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );
    if (res.success) {
      showNotify('success', res.message);
      refreshTeachers();
    } else {
      showNotify('error', res.message);
    }
  };

  // Mở modal đặt mật khẩu cho giáo viên
  const handleOpenPasswordModal = (tch: Teacher) => {
    setTargetPasswordTeacher(tch);
    const suggested = userService.generateSuggestedPassword(tch.assignedClassName ? `BanBo${tch.assignedClassName}` : 'BanBo');
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
    setRequireChangeOnFirstLogin(true);
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handleGenerateNewRandomPassword = () => {
    const prefix = targetPasswordTeacher?.assignedClassName ? `BanBo${targetPasswordTeacher.assignedClassName}` : 'BanBo';
    const suggested = userService.generateSuggestedPassword(prefix);
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setShowPassword(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPasswordTeacher) return;

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
      targetPasswordTeacher.id,
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
      refreshTeachers();
    } else {
      setPasswordError(res.message);
    }
  };

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

  // File Excel Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const res = teacherService.importTeachersFromExcel(
          data,
          currentUser?.id || 'admin_tpt',
          currentUser?.name || 'Phạm Ngọc Thúy'
        );
        setImportResult(res);
        setIsImportModalOpen(true);
        if (res.success) {
          refreshTeachers();
        }
      } catch (err: any) {
        showNotify('error', `Lỗi đọc file Excel: ${err?.message || 'File hỏng'}`);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = t.fullName.toLowerCase().includes(q);
        const mEmail = t.email.toLowerCase().includes(q);
        const mCode = t.teacherCode.toLowerCase().includes(q);
        const mClass = (t.assignedClassName || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mCode && !mClass) return false;
      }

      if (employmentFilter !== 'ALL' && t.employmentStatus !== employmentFilter) {
        return false;
      }

      if (accountFilter !== 'ALL' && t.accountStatus !== accountFilter) {
        return false;
      }

      return true;
    });
  }, [teachers, searchTerm, employmentFilter, accountFilter]);

  // Statistics
  const activeCount = teachers.filter(t => t.employmentStatus === 'ACTIVE').length;
  const inactiveCount = teachers.filter(t => t.employmentStatus === 'TEMPORARILY_INACTIVE').length;
  const leftCount = teachers.filter(t => t.employmentStatus === 'LEFT').length;
  const hasAccountCount = teachers.filter(t => t.accountStatus === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Trường THCS Bản Bo · Năm học 2026–2027
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Lý Danh Sách Giáo Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phạm Ngọc Thúy · Quản trị hồ sơ cán bộ, giáo viên và GVCN 20 lớp chính thức
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => teacherService.downloadSampleTemplate()}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              title="Tải file mẫu Excel danh sách GVCN"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Tải File Mẫu GVCN</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50 rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
              title="Nhập danh sách giáo viên từ file Excel"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Nhập Excel Giáo Viên</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Giáo Viên</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Hồ Sơ</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{teachers.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">giáo viên & cán bộ</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Đang Công Tác</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">sẵn sàng phân công</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Tạm Ngừng / Nghỉ</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{inactiveCount + leftCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">{inactiveCount} tạm ngừng · {leftCount} đã chuyển</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Đã Có Tài Khoản</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{hasAccountCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">tài khoản hoạt động</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, mã GV, email, lớp..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <select
            value={employmentFilter}
            onChange={e => setEmploymentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái công tác</option>
            <option value="ACTIVE">Đang công tác</option>
            <option value="TEMPORARILY_INACTIVE">Tạm ngừng</option>
            <option value="LEFT">Đã chuyển/nghỉ</option>
          </select>

          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-semibold text-slate-700"
          >
            <option value="ALL">Tất cả tài khoản</option>
            <option value="ACTIVE">Đã kích hoạt</option>
            <option value="INVITED">Chờ kích hoạt</option>
            <option value="NOT_CREATED">Chưa tạo tài khoản</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>

        {(searchTerm || employmentFilter !== 'ALL' || accountFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setEmploymentFilter('ALL');
              setAccountFilter('ALL');
            }}
            className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl font-semibold cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3.5 font-bold w-12 text-center">STT</th>
                <th className="p-3.5 font-bold">Họ và tên</th>
                <th className="p-3.5 font-bold">Mã GV</th>
                <th className="p-3.5 font-bold">Số điện thoại</th>
                <th className="p-3.5 font-bold">Email đăng nhập</th>
                <th className="p-3.5 font-bold">Lớp chủ nhiệm</th>
                <th className="p-3.5 font-bold">Vai trò</th>
                <th className="p-3.5 font-bold text-center">Tài khoản</th>
                <th className="p-3.5 font-bold text-center">Công tác</th>
                {isAdmin && <th className="p-3.5 font-bold text-center w-28">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Không tìm thấy giáo viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((tch, idx) => (
                  <tr key={tch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-black text-slate-900">
                      <div>{tch.fullName}</div>
                      {tch.notes && <div className="text-[10px] text-slate-400 font-normal">{tch.notes}</div>}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-bold">{tch.teacherCode}</td>
                    <td className="p-3.5 font-medium text-slate-700">{tch.phone || 'Chưa có'}</td>
                    <td className="p-3.5 font-medium text-slate-600">{tch.email}</td>
                    <td className="p-3.5">
                      {tch.assignedClassName ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-xs">
                          Lớp {tch.assignedClassName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa phân lớp</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">
                        {tch.role === 'ADMIN'
                          ? 'ADMIN'
                          : tch.role === 'BOARD_OF_MANAGEMENT'
                          ? 'BGH'
                          : 'GVCN'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tch.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tch.accountStatus === 'LOCKED'
                            ? 'bg-red-100 text-red-800'
                            : tch.accountStatus === 'INVITED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tch.accountStatus === 'ACTIVE'
                          ? 'HOẠT ĐỘNG'
                          : tch.accountStatus === 'LOCKED'
                          ? 'ĐÃ KHÓA'
                          : tch.accountStatus === 'INVITED'
                          ? 'CHỜ KÍCH HOẠT'
                          : 'CHƯA TẠO'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tch.employmentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tch.employmentStatus === 'TEMPORARILY_INACTIVE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tch.employmentStatus === 'ACTIVE'
                          ? 'ĐANG CÔNG TÁC'
                          : tch.employmentStatus === 'TEMPORARILY_INACTIVE'
                          ? 'TẠM NGỪNG'
                          : 'ĐÃ CHUYỂN'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tch)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Kích hoạt tài khoản */}
                          {tch.accountStatus !== 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleActivateTeacher(tch)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                              title="Kích hoạt tài khoản đăng nhập"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Kích hoạt</span>
                            </button>
                          ) : (
                            <span className="p-1 text-emerald-600" title="Tài khoản đang hoạt động">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}

                          {/* Đặt mật khẩu */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(tch)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                            title="Đặt mật khẩu đăng nhập cho giáo viên"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                            <span>Đặt MK</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(tch)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="Đổi trạng thái công tác"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW (Mục LXVII) */}
      <div className="md:hidden space-y-3">
        {filteredTeachers.map(tch => (
          <div key={tch.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-black text-sm text-slate-900">{tch.fullName}</div>
                <div className="text-[11px] font-mono text-slate-500">{tch.teacherCode} · {tch.email}</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  tch.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tch.accountStatus === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'CHƯA TẠO TK'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">
                GVCN:{' '}
                <strong className="text-blue-700">
                  {tch.assignedClassName ? `Lớp ${tch.assignedClassName}` : 'Chưa phân lớp'}
                </strong>
              </span>
              <span className="text-slate-500">
                SĐT: <strong>{tch.phone || 'Chưa có'}</strong>
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(tch)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold text-center"
                >
                  Sửa hồ sơ
                </button>
                {tch.accountStatus !== 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => handleActivateTeacher(tch)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Kích hoạt</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenPasswordModal(tch)}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đặt mật khẩu</span>
                  </button>
                )}
                {tch.accountStatus !== 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleOpenPasswordModal(tch)}
                    className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold"
                    title="Đặt mật khẩu"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(tch)}
                  className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold"
                >
                  Trạng thái
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL THÊM / SỬA GIÁO VIÊN */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">
                {editingTeacher ? 'Sửa Hồ Sơ Giáo Viên' : 'Thêm Giáo Viên Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Họ và tên giáo viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã giáo viên</label>
                  <input
                    type="text"
                    value={formData.teacherCode}
                    onChange={e => setFormData({ ...formData, teacherCode: e.target.value })}
                    placeholder="GV-01"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0982 123 456"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nguyenvanan@thcsbanbo.edu.vn"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Email dùng để nhận liên kết kích hoạt và đăng nhập an toàn vào hệ thống.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="HEAD_TEACHER">Giáo viên chủ nhiệm (HEAD_TEACHER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    <option value="BOARD_OF_MANAGEMENT">Ban Giám hiệu (BOARD_OF_MANAGEMENT)</option>
                    <option value="VIEWER">Chỉ xem (VIEWER)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Lớp chủ nhiệm (nếu có)</label>
                  <select
                    value={formData.assignedClassId}
                    onChange={e => setFormData({ ...formData, assignedClassId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="">Chưa phân lớp</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về giáo viên..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI TRẠNG THÁI CÔNG TÁC */}
      {isStatusModalOpen && statusTargetTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base">
              Thay Đổi Trạng Thái Công Tác: {statusTargetTeacher.fullName}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Lưu ý: Không xóa hồ sơ giáo viên để bảo toàn tính toàn vẹn của lịch sử báo cáo điểm danh.
            </p>

            <form onSubmit={handleSaveEmploymentStatus} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as EmploymentStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden font-semibold"
                >
                  <option value="ACTIVE">Đang công tác</option>
                  <option value="TEMPORARILY_INACTIVE">Tạm ngừng công tác</option>
                  <option value="LEFT">Đã chuyển trường / Nghỉ công tác</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lý do thay đổi</label>
                <input
                  type="text"
                  required
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="Ví dụ: Nghỉ thai sản, chuyển công tác..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Cập nhật trạng thái
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KẾT QUẢ IMPORT EXCEL */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base">
              Kết Quả Nhập Danh Sách Giáo Viên Từ Excel
            </h3>

            {importResult.success ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đã nhập thành công {importResult.importedCount} giáo viên vào danh sách!</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Hồ sơ đã được lưu trữ an toàn. Bạn có thể chọn từng giáo viên để tạo tài khoản hoặc sử dụng chức
                  năng "Tạo tài khoản GVCN hàng loạt".
                </p>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs font-medium space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Không thể nhập dữ liệu do phát hiện lỗi sau:</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-1 text-red-800 max-h-48 overflow-y-auto">
                  {importResult.errors?.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importResult.duplicateEmails?.map((err: string, i: number) => (
                    <li key={`dup_e_${i}`}>{err}</li>
                  ))}
                  {importResult.duplicateClasses?.map((err: string, i: number) => (
                    <li key={`dup_c_${i}`}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT MẬT KHẨU CHO GIÁO VIÊN */}
      {isPasswordModalOpen && targetPasswordTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Đặt Mật Khẩu Đăng Nhập Giáo Viên
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

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Giáo viên:</span>
                <span className="font-black text-slate-900 text-sm">{targetPasswordTeacher.fullName}</span>
              </div>
              {targetPasswordTeacher.assignedClassName && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Chủ nhiệm:</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-xs">
                    Lớp {targetPasswordTeacher.assignedClassName}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-700">{targetPasswordTeacher.email}</span>
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
                  id="requireChangeOnFirstLoginTeacher"
                  checked={requireChangeOnFirstLogin}
                  onChange={e => setRequireChangeOnFirstLogin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="requireChangeOnFirstLoginTeacher" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Yêu cầu giáo viên đổi mật khẩu ở lần đăng nhập đầu tiên
                </label>
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

      {/* MODAL THÔNG BÁO BÀN GIAO TÀI KHOẢN (Copyable Zalo / SMS) */}
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
    </div>
  );
};
