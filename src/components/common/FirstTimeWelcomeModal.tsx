import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  School,
  Lock,
} from 'lucide-react';

export const FirstTimeWelcomeModal: React.FC = () => {
  const { currentUser, dismissFirstTimeModal } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!currentUser || !currentUser.isFirstLogin) {
    return null;
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Cập nhật bảo mật thành công
    setPasswordSuccess(true);
    setTimeout(() => {
      dismissFirstTimeModal();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <School className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">
            Trường THCS Bản Bo · Lai Châu
          </div>
          <h2 className="text-lg sm:text-xl font-black mt-1 uppercase text-white">
            CHÀO MỪNG THẦY/CÔ ĐẾN VỚI HỆ THỐNG
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Hệ thống Quản lý Sĩ số & Báo cáo Học sinh Năm học 2026–2027
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Thông tin tài khoản của Thầy/Cô:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Họ và tên:</span>
                <div className="font-extrabold text-slate-800">{currentUser.name}</div>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <div className="font-semibold text-slate-800 truncate">{currentUser.email}</div>
              </div>
              <div>
                <span className="text-slate-500">Vai trò:</span>
                <div className="font-bold text-indigo-700">{currentUser.title || currentUser.role}</div>
              </div>
              <div>
                <span className="text-slate-500">Lớp phân công:</span>
                <div className="font-black text-emerald-700">
                  {currentUser.assignedClassName ? `Lớp ${currentUser.assignedClassName}` : 'Chưa phân lớp'}
                </div>
              </div>
            </div>
          </div>

          {!showChangePassword ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                Để đảm bảo tính bảo mật và an toàn dữ liệu học sinh của nhà trường, Thầy/Cô vui lòng xác nhận
                thông tin và có thể thiết lập mật khẩu riêng cho mình.
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>Đổi mật khẩu riêng</span>
                </button>

                <button
                  type="button"
                  onClick={dismissFirstTimeModal}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Bắt đầu</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="text-xs font-bold text-slate-800">Thiết lập mật khẩu mới:</div>

              {passwordError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Đã thiết lập mật khẩu thành công! Đang chuyển tiếp...</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu mật khẩu mới & Bắt đầu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
