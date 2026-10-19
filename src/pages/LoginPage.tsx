import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import {
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  Smartphone,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppButton, AppInput, SchoolLogo } from '../theme/designSystem';
import { PWAInstallModal } from '../components/common/PWAInstallModal';

const GVCN_LIST = [
  { grade: 6, class: '6A1', name: 'Nguyễn Văn An', id: 'user_gv6a1', email: 'nguyenvanan@thcsbanbo.edu.vn' },
  { grade: 6, class: '6A2', name: 'Lò Thị Mai', id: 'user_gv6a2', email: 'lothimai@thcsbanbo.edu.vn' },
  { grade: 6, class: '6A3', name: 'Trần Thị Thu', id: 'user_gv6a3', email: 'tranthithu@thcsbanbo.edu.vn' },
  { grade: 6, class: '6A4', name: 'Hoàng Văn Bình', id: 'user_gv6a4', email: 'hoangvanbinh@thcsbanbo.edu.vn' },
  { grade: 6, class: '6A5', name: 'Điêu Văn Tiến', id: 'user_gv6a5', email: 'dieuvantien@thcsbanbo.edu.vn' },
  { grade: 7, class: '7A1', name: 'Trần Quốc Hưng', id: 'user_gv7a1', email: 'tranquochung@thcsbanbo.edu.vn' },
  { grade: 7, class: '7A2', name: 'Hoàng Thị Lan', id: 'user_gv7a2', email: 'hoangthilan@thcsbanbo.edu.vn' },
  { grade: 7, class: '7A3', name: 'Lò Văn Chiến', id: 'user_gv7a3', email: 'lovanchien@thcsbanbo.edu.vn' },
  { grade: 7, class: '7A4', name: 'Nông Thị Thảo', id: 'user_gv7a4', email: 'nongthithao@thcsbanbo.edu.vn' },
  { grade: 7, class: '7A5', name: 'Đèo Văn Nam', id: 'user_gv7a5', email: 'deovannam@thcsbanbo.edu.vn' },
  { grade: 8, class: '8A1', name: 'Vàng A Tủa', id: 'user_gv8a1', email: 'vangatua@thcsbanbo.edu.vn' },
  { grade: 8, class: '8A2', name: 'Lê Thị Hồng', id: 'user_gv8a2', email: 'lethihong@thcsbanbo.edu.vn' },
  { grade: 8, class: '8A3', name: 'Lý A Sùng', id: 'user_gv8a3', email: 'lyasung@thcsbanbo.edu.vn' },
  { grade: 8, class: '8A4', name: 'Nguyễn Thị Ngọc', id: 'user_gv8a4', email: 'nguyenthingoc@thcsbanbo.edu.vn' },
  { grade: 8, class: '8A5', name: 'Hà Văn Dũng', id: 'user_gv8a5', email: 'havandung@thcsbanbo.edu.vn' },
  { grade: 9, class: '9A1', name: 'Đặng Minh Tuấn', id: 'user_gv9a1', email: 'dangminhtuan@thcsbanbo.edu.vn' },
  { grade: 9, class: '9A2', name: 'Nùng Thị Hoa', id: 'user_gv9a2', email: 'nungthihoa@thcsbanbo.edu.vn' },
  { grade: 9, class: '9A3', name: 'Vũ Đình Trọng', id: 'user_gv9a3', email: 'vudinhtrong@thcsbanbo.edu.vn' },
  { grade: 9, class: '9A4', name: 'Mai Thị Hằng', id: 'user_gv9a4', email: 'maithihang@thcsbanbo.edu.vn' },
  { grade: 9, class: '9A5', name: 'Tạ Văn Quyết', id: 'user_gv9a5', email: 'tavanquyet@thcsbanbo.edu.vn' },
];

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, switchUser } = useAuth();
  const settings = storageService.getSettings();

  const [username, setUsername] = useState('vuhongphuong');
  const [password, setPassword] = useState('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [selectedGradeTab, setSelectedGradeTab] = useState(6);

  // Modal Quên mật khẩu
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleSubmitForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Vui lòng nhập email đăng ký của Thầy/Cô.');
      return;
    }
    if (!forgotEmail.includes('@')) {
      setForgotError('Email chưa đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }
    // Bảo mật: không báo rõ email tồn tại hay không
    setForgotSubmitted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu đăng nhập.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username.trim(), password);
      setIsLoading(false);

      if (result.success) {
        onLoginSuccess();
      } else {
        // Thông báo lỗi thân thiện theo chuẩn Requirement XIII
        if (result.message?.toLowerCase().includes('khóa') || result.message?.toLowerCase().includes('disabled')) {
          setErrorMsg('Tài khoản hiện không thể sử dụng. Vui lòng liên hệ Quản trị viên.');
        } else if (result.message?.toLowerCase().includes('mạng') || result.message?.toLowerCase().includes('network')) {
          setErrorMsg('Không thể kết nối hệ thống. Vui lòng thử lại.');
        } else {
          setErrorMsg('Tài khoản hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.');
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Không thể kết nối hệ thống. Vui lòng thử lại.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Banner Cài đặt Ứng dụng PWA vào Máy tính & Điện thoại */}
      <div className="max-w-md w-full mb-3 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 border border-blue-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="font-bold text-xs">Cài đặt App vào Điện thoại & Máy tính</div>
            <div className="text-[10px] text-blue-200">Dành cho GVCN báo cáo sĩ số nhanh mỗi sáng</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
        >
          Cài đặt
        </button>
      </div>

      {/* Container */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Nhận diện Trường THCS Bản Bo */}
        <div className="p-6 text-center bg-blue-900 text-white relative">
          <div className="flex justify-center mb-3">
            <SchoolLogo logoUrl={settings.logoUrl} size="lg" />
          </div>

          <div className="text-[11px] font-bold tracking-widest text-blue-200 uppercase">
            Xã Bản Bo · Tỉnh Lai Châu
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight mt-0.5 text-white">
            {settings.schoolName || 'TRƯỜNG THCS BẢN BO'}
          </h1>
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mt-1">
            HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH
          </div>
          <div className="text-[11px] font-medium text-blue-200 mt-1">
            Năm học: <span className="font-bold text-white">{settings.schoolYear || '2026–2027'}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AppInput
              label="Email hoặc Tên tài khoản"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập hoặc email..."
              startIcon={<User className="w-4 h-4" />}
              autoComplete="username"
            />

            <div>
              <AppInput
                label="Mật khẩu"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                startIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
              />
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-[11px] text-slate-400">Bảo mật thông tin nội bộ</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(true);
                    setForgotSubmitted(false);
                    setForgotError(null);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  QUÊN MẬT KHẨU?
                </button>
              </div>
            </div>

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              loadingText="ĐANG ĐĂNG NHẬP..."
              endIcon={<ArrowRight className="w-4 h-4" />}
            >
              ĐĂNG NHẬP
            </AppButton>
          </form>

          {/* DÀNH CHO GIÁO VIÊN CHỦ NHIỆM BÁO CÁO SĨ SỐ */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>GVCN đăng nhập theo tên để báo cáo sĩ số:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTeacherSelector(!showTeacherSelector)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{showTeacherSelector ? 'Thu gọn' : 'Chọn tên (20 lớp)'}</span>
                {showTeacherSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTeacherSelector ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-2 animate-in fade-in duration-200">
                {/* Grade tabs */}
                <div className="grid grid-cols-4 gap-1">
                  {[6, 7, 8, 9].map((gr) => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => setSelectedGradeTab(gr)}
                      className={`py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        selectedGradeTab === gr
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      Khối {gr}
                    </button>
                  ))}
                </div>

                {/* 5 GVCN of active grade */}
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {GVCN_LIST.filter((g) => g.grade === selectedGradeTab).map((gv) => (
                    <button
                      key={gv.id}
                      type="button"
                      onClick={() => handleQuickLogin(gv.id)}
                      className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-black rounded-md text-[11px] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          Lớp {gv.class}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-800 group-hover:text-blue-900">
                            {gv.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Báo cáo sĩ số Lớp {gv.class}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Đăng nhập →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 text-[11px]">
                  Bấm vào <strong>"Chọn tên (20 lớp)"</strong> ở trên hoặc gõ tên Thầy/Cô vào ô đăng nhập.
                </span>
                <button
                  type="button"
                  onClick={() => setShowTeacherSelector(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer shadow-2xs"
                >
                  Chọn ngay
                </button>
              </div>
            )}
          </div>

          {/* Quick Login Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Tài khoản Quản trị & Ban Giám Hiệu:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('user_vuhongphuong')}
                className="p-2.5 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-black text-blue-900 text-xs">Vũ Hồng Phương</div>
                <div className="text-[10px] text-blue-700 font-semibold">Quản trị viên chính</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user_tpt')}
                className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-xs">Phạm Ngọc Thúy</div>
                <div className="text-[10px] text-rose-700 font-semibold">Tổng phụ trách Đội</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user_bgh')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-xs">Hoàng Xuân Nhật</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Hiệu trưởng (BGH)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Trường THCS Bản Bo · Quản lý Sĩ số Học sinh
        </div>
      </div>

      {/* MODAL QUÊN MẬT KHẨU */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base uppercase">
              QUÊN MẬT KHẨU ĐĂNG NHẬP
            </h3>

            {!forgotSubmitted ? (
              <form onSubmit={handleSubmitForgot} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nhập địa chỉ email trường học đã đăng ký. Hệ thống sẽ gửi liên kết thiết lập mật khẩu an toàn tới email của Thầy/Cô.
                </p>

                <AppInput
                  label="Email của Thầy/Cô"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ví dụ: nguyenvanan@thcsbanbo.edu.vn"
                  errorText={forgotError || undefined}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotSubmitted(false);
                    }}
                  >
                    HỦY
                  </AppButton>
                  <AppButton
                    type="submit"
                    variant="primary"
                    size="sm"
                  >
                    GỬI LIÊN KẾT
                  </AppButton>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Yêu cầu đã được tiếp nhận an toàn!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của Thầy/Cô. Vui lòng kiểm tra hộp thư hoặc liên hệ Quản trị viên (Phạm Ngọc Thúy).
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <AppButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotSubmitted(false);
                      setForgotEmail('');
                    }}
                  >
                    ĐÓNG
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT APP CHO GVCN */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onSelectTeacherForLogin={(email) => {
          setUsername(email);
          const allUsers = storageService.getUsers();
          const target = allUsers.find(
            (u) =>
              (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
              (u.username && u.username.toLowerCase() === email.toLowerCase())
          );
          if (target) {
            handleQuickLogin(target.id);
          }
        }}
      />
    </div>
  );
};
