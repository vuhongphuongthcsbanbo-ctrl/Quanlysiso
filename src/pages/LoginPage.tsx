import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { UserRole } from '../types';
import {
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Download,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AppButton, AppInput, SchoolLogo } from '../theme/designSystem';
import { PWAInstallModal } from '../components/common/PWAInstallModal';



interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, register, switchUser } = useAuth();
  const settings = storageService.getSettings();
  const classes = storageService.getClasses();
  const registeredTeachers = storageService.getUsers().filter(
    u => u.role === 'teacher_gvcn' || (u.assignedClassName && u.id !== 'user_vuhongphuong' && u.id !== 'user_tpt' && u.id !== 'user_bgh')
  );

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form Đăng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [selectedGradeTab, setSelectedGradeTab] = useState(6);

  // Form Đăng ký
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher_gvcn');
  const [regClass, setRegClass] = useState('6A1');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAgreed, setRegAgreed] = useState(true);

  // Modal Quên mật khẩu
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Xử lý nộp form đăng nhập
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setSuccessMsg(null);

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
        setSuccessMsg('Đăng nhập thành công! Đang chuyển vào hệ thống...');
        setTimeout(() => {
          onLoginSuccess();
        }, 400);
      } else {
        setErrorMsg(result.message || 'Tài khoản hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại.');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Không thể kết nối hệ thống. Vui lòng thử lại.');
    }
  };

  // Xử lý nộp form đăng ký tài khoản
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanFullName = regFullName.trim();

    if (!cleanFullName) {
      setErrorMsg('Vui lòng nhập họ và tên đầy đủ của Thầy/Cô.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự (viết liền, không dấu).');
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setErrorMsg('Tên đăng nhập không được chứa khoảng cách (dấu cách).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Địa chỉ email không hợp lệ. Vui lòng nhập đúng email liên hệ.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Mật khẩu đăng ký phải có độ dài từ 6 ký tự trở lên.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu và xác nhận mật khẩu không khớp nhau.');
      return;
    }
    if (!regAgreed) {
      setErrorMsg('Vui lòng tích xác nhận cam kết thông tin trước khi tiếp tục.');
      return;
    }

    setIsLoading(true);

    try {
      const assignedClassObj = classes.find(c => c.name === regClass);
      const assignedClassId = assignedClassObj?.id || `cls_${regClass.toLowerCase()}`;
      const title =
        regRole === 'teacher_gvcn'
          ? `GVCN Lớp ${regClass}`
          : regRole === 'admin_tpt'
          ? 'Cán bộ Quản trị'
          : regRole === 'principal'
          ? 'Ban Giám hiệu'
          : 'Giáo viên bộ môn';

      const res = await register({
        username: cleanUsername,
        password: regPassword,
        fullName: cleanFullName,
        email: cleanEmail,
        phone: regPhone.trim(),
        role: regRole,
        assignedClassId: regRole === 'teacher_gvcn' ? assignedClassId : undefined,
        assignedClassName: regRole === 'teacher_gvcn' ? regClass : undefined,
        title,
      });

      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển vào hệ thống...');
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi đăng ký tài khoản.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    onLoginSuccess();
  };

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
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-3 sm:p-4">
      {/* Banner Cài đặt Ứng dụng PWA */}
      <div className="max-w-md w-full mb-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-md flex items-center justify-between gap-3 border border-blue-700/50">
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
        <div className="p-5 sm:p-6 text-center bg-gradient-to-b from-blue-950 to-blue-900 text-white relative">
          <div className="flex justify-center mb-2.5">
            <SchoolLogo logoUrl={settings.logoUrl} size="lg" />
          </div>

          <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-200 uppercase">
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

          {/* TAB CHỌN ĐĂNG NHẬP HOẶC ĐĂNG KÝ */}
          <div className="grid grid-cols-2 gap-1.5 mt-4 p-1 bg-blue-950/70 border border-blue-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-blue-950 shadow-md'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ĐĂNG NHẬP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ĐĂNG KÝ MỚI</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: FORM ĐĂNG NHẬP */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập hoặc Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập hoặc email..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu đăng nhập *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-[11px] text-slate-400">
                      Mật khẩu mặc định: <code className="bg-slate-100 text-blue-900 px-1 py-0.5 rounded font-mono font-bold">123456</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotOpen(true);
                        setForgotSubmitted(false);
                        setForgotError(null);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>

                <AppButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  loadingText="ĐANG XÁC THỰC..."
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  ĐĂNG NHẬP VÀO HỆ THỐNG
                </AppButton>
              </form>

              {/* Nút gợi ý chuyển sang đăng ký */}
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Chưa có tài khoản đăng nhập? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                >
                  Đăng ký tài khoản mới ngay
                </button>
              </div>

              {/* DÀNH CHO GIÁO VIÊN CHỦ NHIỆM BÁO CÁO SĨ SỐ */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>GVCN đăng nhập nhanh theo lớp (20 lớp):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTeacherSelector(!showTeacherSelector)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showTeacherSelector ? 'Thu gọn' : 'Xem danh sách'}</span>
                    {showTeacherSelector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTeacherSelector ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 space-y-2 animate-in fade-in duration-200">
                    {registeredTeachers.length === 0 ? (
                      <div className="p-3 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                        <div className="font-bold text-slate-700">Chưa có tài khoản Giáo viên Chủ nhiệm nào</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Quý Thầy/Cô vui lòng chuyển sang tab <strong className="text-blue-600">"Đăng ký tài khoản"</strong> ở trên để tạo tài khoản mới, hoặc Quản trị viên thực hiện cấp tài khoản tại mục Quản lý tài khoản.
                        </p>
                      </div>
                    ) : (
                      <>
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

                        {/* Teachers of active grade */}
                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {registeredTeachers
                            .filter((g) => {
                              const clsName = g.assignedClassName || '';
                              return clsName.startsWith(String(selectedGradeTab));
                            })
                            .map((gv) => (
                              <button
                                key={gv.id}
                                type="button"
                                onClick={() => handleQuickLogin(gv.id)}
                                className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  {gv.assignedClassName && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-black rounded-md text-[11px] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                      Lớp {gv.assignedClassName}
                                    </span>
                                  )}
                                  <div>
                                    <div className="font-bold text-xs text-slate-800 group-hover:text-blue-900">
                                      {gv.fullName || gv.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Tên đăng nhập: <code className="font-mono text-blue-900">{gv.username || gv.email}</code>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                  Vào ngay →
                                </span>
                              </button>
                            ))}
                          {registeredTeachers.filter((g) => (g.assignedClassName || '').startsWith(String(selectedGradeTab))).length === 0 && (
                            <div className="p-2.5 text-center text-xs text-slate-400">
                              Chưa có tài khoản GVCN khối {selectedGradeTab}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px]">
                      Bấm vào <strong>"Xem danh sách"</strong> để tra cứu tài khoản GVCN đã được cấp.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTeacherSelector(true)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer shadow-2xs"
                    >
                      Mở danh sách
                    </button>
                  </div>
                )}
              </div>

              {/* Tài khoản Quản trị & Ban Giám Hiệu */}
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
                    <div className="text-[10px] text-blue-700 font-semibold">Quản trị viên</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user_tpt')}
                    className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs">Phạm Ngọc Thúy</div>
                    <div className="text-[10px] text-rose-700 font-semibold">Tổng PT Đội</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('user_bgh')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs">Hoàng Xuân Nhật</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">Hiệu trưởng</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORM ĐĂNG KÝ TÀI KHOẢN MỚI */}
          {activeTab === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên đầy đủ *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn Toàn"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập (viết liền, không dấu) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <span className="text-xs font-bold">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="Ví dụ: nvtoan hoặc gvtoan"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                      autoComplete="username"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Dùng để đăng nhập vào phần mềm hằng ngày
                  </span>
                </div>

                {/* Email và Số điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Email liên hệ *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@thcsbanbo.edu.vn"
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Vai trò và Lớp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Vai trò công tác *
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-amber-500 outline-none"
                    >
                      <option value="teacher_gvcn">Giáo viên Chủ nhiệm (GVCN)</option>
                      <option value="viewer">Giáo viên Bộ môn / Nhân viên</option>
                      <option value="admin_tpt">Tổng Phụ trách / Quản trị</option>
                      <option value="principal">Ban Giám hiệu / Hiệu trưởng</option>
                    </select>
                  </div>

                  {regRole === 'teacher_gvcn' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Lớp chủ nhiệm *
                      </label>
                      <select
                        value={regClass}
                        onChange={(e) => setRegClass(e.target.value)}
                        className="w-full py-2 px-2.5 bg-amber-50 border border-amber-300 rounded-xl text-blue-950 font-black text-xs focus:bg-white focus:border-amber-500 outline-none"
                      >
                        {classes.length > 0 ? (
                          classes.map((c) => (
                            <option key={c.id} value={c.name}>
                              Lớp {c.name} (Khối {c.grade})
                            </option>
                          ))
                        ) : (
                          ['6A1', '6A2', '6A3', '6A4', '6A5', '7A1', '7A2', '7A3', '7A4', '7A5', '8A1', '8A2', '8A3', '8A4', '8A5', '9A1', '9A2', '9A3', '9A4', '9A5'].map((c) => (
                            <option key={c} value={c}>
                              Lớp {c}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Mật khẩu và Xác nhận */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mật khẩu (ít nhất 6 ký tự) *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Xác nhận mật khẩu *
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Cam kết */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regAgreed}
                    onChange={(e) => setRegAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    Tôi xác nhận là cán bộ, giáo viên, nhân viên Trường THCS Bản Bo và cam kết bảo mật tài khoản cá nhân.
                  </span>
                </label>

                {/* Nút Đăng ký */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isLoading ? 'ĐANG TẠO TÀI KHOẢN...' : 'HOÀN TẤT ĐĂNG KÝ & VÀO HỆ THỐNG'}</span>
                  </button>
                </div>
              </form>

              {/* Nút quay lại đăng nhập */}
              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Đã có tài khoản từ trước? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                >
                  Quay lại đăng nhập ngay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Trường THCS Bản Bo · Xã Bản Bo, Tỉnh Lai Châu</span>
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
                    Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của Thầy/Cô. Vui lòng kiểm tra hộp thư hoặc liên hệ Quản trị viên (Vũ Hồng Phương / Phạm Ngọc Thúy).
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
