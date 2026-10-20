import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { userService } from '../services/userService';
import {
  User,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  GraduationCap,
  Pencil,
  AtSign,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface TeacherAccountPageProps {
  onNavigateHome: () => void;
  onNavigate?: (page: any) => void;
}

export const TeacherAccountPage: React.FC<TeacherAccountPageProps> = ({
  onNavigateHome,
  onNavigate,
}) => {
  const { currentUser, logout, updateCurrentUser } = useAuth();

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

  // Username Modal
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const assignedClass = currentUser?.assignedClassId
    ? storageService.getClassById(currentUser.assignedClassId)
    : null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    if (currentUser) {
      currentUser.password = newPassword.trim();
      currentUser.passwordUpdatedAt = new Date().toISOString();
      storageService.saveUser(currentUser);
      updateCurrentUser({ password: currentUser.password });
    }
    setPasswordChangedSuccess(true);
    setTimeout(() => {
      setPasswordChangedSuccess(false);
      setShowPasswordModal(false);
      setNewPassword('');
    }, 1800);
  };

  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setUsernameError(null);
    setIsSavingUsername(true);

    const res = userService.updateUsername(
      currentUser.id,
      newUsername,
      currentUser.id,
      currentUser.name
    );

    setIsSavingUsername(false);

    if (res.success && res.user) {
      updateCurrentUser({ username: res.user.username });
      setUsernameSuccess(true);
      setTimeout(() => {
        setUsernameSuccess(false);
        setShowUsernameModal(false);
      }, 1500);
    } else {
      setUsernameError(res.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={onNavigateHome}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-black text-slate-900 uppercase">
            TÀI KHOẢN CÁ NHÂN
          </h1>
          <div className="text-xs text-slate-500">
            Hệ thống Quản lý Sĩ số · THCS Bản Bo
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xl uppercase shadow-xs">
            {currentUser?.name.charAt(0) || 'G'}
          </div>
          <div>
            <div className="text-base font-black text-slate-900">{currentUser?.name}</div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser?.title || 'GIÁO VIÊN'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Lớp phân công:</span>
            <strong className="text-slate-900">
              {assignedClass?.name || currentUser?.assignedClassName ? `Lớp ${assignedClass?.name || currentUser?.assignedClassName}` : 'Chưa phân lớp'}
            </strong>
          </div>

          {/* Dòng Tên đăng nhập với nút Sửa */}
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-slate-500">Tên đăng nhập:</span>
            <div className="flex items-center gap-2">
              <strong className="text-blue-900 font-mono text-sm">{currentUser?.username}</strong>
              <button
                type="button"
                onClick={() => {
                  setNewUsername(currentUser?.username || '');
                  setUsernameError(null);
                  setShowUsernameModal(true);
                }}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title="Sửa tên đăng nhập"
              >
                <Pencil className="w-3 h-3 text-amber-700" />
                <span>Sửa</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Email công vụ:</span>
            <strong className="text-slate-900">{currentUser?.email}</strong>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-500">Số điện thoại:</span>
            <strong className="text-slate-900 font-mono">{currentUser?.phone || 'Chưa cập nhật'}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {/* Nút sửa tên đăng nhập */}
          <button
            type="button"
            onClick={() => {
              setNewUsername(currentUser?.username || '');
              setUsernameError(null);
              setShowUsernameModal(true);
            }}
            className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Pencil className="w-4 h-4 text-amber-700" />
            <span>SỬA TÊN ĐĂNG NHẬP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <KeyRound className="w-4 h-4 text-slate-600" />
            <span>ĐỔI MẬT KHẨU</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('training_guide')}
            className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-indigo-700" />
            <span>CẨM NANG VẬN HÀNH & TẬP HUẤN</span>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>ĐĂNG XUẤT</span>
          </button>
        </div>
      </div>

      {/* Modal Sửa Tên Đăng Nhập */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3.5 border border-slate-200 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase">SỬA TÊN ĐĂNG NHẬP</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUsernameModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {usernameSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đổi tên đăng nhập thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleChangeUsername} className="space-y-3">
                {usernameError && (
                  <div className="p-2.5 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-start gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{usernameError}</span>
                  </div>
                )}

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
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="Nhập tên đăng nhập mới..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono text-xs focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Viết liền không dấu (tối thiểu 3 ký tự). Tên này sẽ dùng để đăng nhập vào phần mềm và đồng bộ lên Supabase.
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUsernameModal(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUsername}
                    className="flex-1 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingUsername ? 'ĐANG LƯU...' : 'LƯU TÊN ĐN'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">ĐỔI MẬT KHẨU ĐĂNG NHẬP</h3>
            {passwordChangedSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đổi mật khẩu thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập ít nhất 6 ký tự..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
                  >
                    LƯU MẬT KHẨU
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
