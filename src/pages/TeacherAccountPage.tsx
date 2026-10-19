import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
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
} from 'lucide-react';

interface TeacherAccountPageProps {
  onNavigateHome: () => void;
  onNavigate?: (page: any) => void;
}

export const TeacherAccountPage: React.FC<TeacherAccountPageProps> = ({
  onNavigateHome,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

  const assignedClass = currentUser?.assignedClassId
    ? storageService.getClassById(currentUser.assignedClassId)
    : null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setPasswordChangedSuccess(true);
    setTimeout(() => {
      setPasswordChangedSuccess(false);
      setShowPasswordModal(false);
      setNewPassword('');
    }, 2000);
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
            TÀI KHOẢN GIÁO VIÊN
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
              <span>GIÁO VIÊN CHỦ NHIỆM</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Lớp chủ nhiệm:</span>
            <strong className="text-slate-900">Lớp {assignedClass?.name || currentUser?.assignedClassName || 'Chưa phân công'}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Tên đăng nhập:</span>
            <strong className="text-slate-900 font-mono">{currentUser?.username}</strong>
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

        {/* Action Buttons (Mục XLI) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3">
            <h3 className="text-sm font-black text-slate-900">ĐỔI MẬT KHẨU ĐĂNG NHẬP</h3>
            {passwordChangedSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đổi mật khẩu thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Mật khẩu mới:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Lưu
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
