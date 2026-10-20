import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  Share2,
  PlusSquare,
  MoreVertical,
  LogIn,
  X,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Laptop,
  Check,
  Copy,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { storageService } from '../../services/storageService';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTeacherForLogin?: (teacherEmail: string) => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onSelectTeacherForLogin,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, installApp } = usePWAInstall();

  // Active tab: 'MOBILE' | 'DESKTOP' | 'LOGIN_GUIDE'
  const defaultTab = isIOS || isAndroid ? 'MOBILE' : 'DESKTOP';
  const [activeTab, setActiveTab] = useState<'MOBILE' | 'DESKTOP' | 'LOGIN_GUIDE'>(defaultTab);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      alert('Đã bắt đầu cài đặt ứng dụng vào thiết bị của bạn thành công!');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const assignedClasses = storageService.getClasses().filter(
    c => c.teacherName && c.teacherName !== 'Chưa phân công'
  );


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Download className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-amber-400/30">
                <Sparkles className="w-3 h-3" />
                Dành cho Giáo viên & BGH
              </div>
              <h3 className="text-lg sm:text-xl font-black mt-1">
                Cài Đặt Ứng Dụng THCS Bản Bo
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Cài đặt trực tiếp vào điện thoại & máy tính để mở báo cáo sĩ số mỗi sáng chỉ trong 30 giây
              </p>
            </div>
          </div>

          {/* Quick Direct Install Action Button if available */}
          {isInstallable && (
            <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-blue-100 font-medium">
                Thiết bị của bạn hỗ trợ cài đặt 1 chạm ngay:
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Cài Đặt Ngay Vào Máy</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ứng dụng đã được cài đặt và đang chạy ở chế độ độc lập (Standalone App).</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('MOBILE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'MOBILE'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Điện thoại (Android & iPhone)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DESKTOP')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'DESKTOP'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Máy tính (PC / Laptop)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGIN_GUIDE')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'LOGIN_GUIDE'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Hướng dẫn Đăng nhập GVCN</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
          {/* TAB 1: MOBILE INSTALLATION */}
          {activeTab === 'MOBILE' && (
            <div className="space-y-6">
              {/* Android Section */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <h4>Dành Cho Điện Thoại Android (Samsung, Oppo, Xiaomi, Vivo...)</h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Dùng trình duyệt <strong>Google Chrome</strong> hoặc <strong>Cốc Cốc</strong> mở ứng dụng:
                </p>
                <ol className="space-y-2.5 pl-2">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      Nhấn vào biểu tượng <strong>Ba chấm (⋮)</strong> ở góc trên cùng bên phải trình duyệt Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>
                      Chọn dòng <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong> (Add to Home screen).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      Nhấn <strong>"Cài đặt"</strong> để xác nhận. Biểu tượng logo trường <strong>THCS Bản Bo</strong> sẽ xuất hiện trên màn hình điện thoại như một App bình thường!
                    </span>
                  </li>
                </ol>
              </div>

              {/* iPhone / iPad Section */}
              <div className="bg-blue-50/60 rounded-2xl p-4 sm:p-5 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <h4>Dành Cho iPhone & iPad (Hệ Điều Hành iOS / Trình Duyệt Safari)</h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Mở trang web bằng trình duyệt <strong>Safari</strong> trên iPhone của Thầy/Cô:
                </p>
                <ol className="space-y-2.5 pl-2">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng màn hình (hình vuông có mũi tên chỉ lên: ⎋).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>
                      Vuốt xuống danh sách các tùy chọn và chọn <strong>"Thêm vào MH chính"</strong> (Add to Home Screen - có biểu tượng dấu cộng <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" />).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      Nhấn nút <strong>"Thêm" (Add)</strong> ở góc trên bên phải. Biểu tượng ứng dụng sẽ nằm ngay trên màn hình chính của iPhone!
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP INSTALLATION */}
          {activeTab === 'DESKTOP' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <h4>Cài Đặt Trên Máy Tính Bàn Hoặc Laptop (Windows, MacBook)</h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Ứng dụng hoạt động mượt mà trên các trình duyệt hiện đại như <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, hoặc <strong>Cốc Cốc</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Cách 1: Biểu tượng trên thanh địa chỉ</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Nhìn vào cuối thanh gõ địa chỉ web (URL) ở trên cùng trình duyệt, bấm vào biểu tượng <strong>"Cài đặt ứng dụng"</strong> (hình chiếc máy tính có mũi tên tải xuống ⤓) → Nhấn Cài đặt.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MoreVertical className="w-4 h-4 text-emerald-600" />
                      <span>Cách 2: Menu cài đặt trình duyệt</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Bấm vào menu 3 chấm (⋮) ở góc trên bên phải Chrome/Edge → Chọn <strong>"Lưu và chia sẻ"</strong> hoặc <strong>"Ứng dụng" (Apps)</strong> → Chọn <strong>"Cài đặt trang web này dưới dạng ứng dụng"</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Sau khi cài đặt, app sẽ có icon riêng ngoài màn hình Desktop (Desktop Shortcut) và thanh Taskbar, mở chạy độc lập toàn màn hình không có thanh địa chỉ web rườm rà.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGIN GUIDE FOR 20 GVCN */}
          {activeTab === 'LOGIN_GUIDE' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-2 text-sm">
                  <LogIn className="w-4 h-4 text-indigo-600" />
                  <span>Quy Trình Đăng Nhập Dành Cho Giáo Viên Chủ Nhiệm (20 Lớp)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Mỗi sáng từ <strong>07:00 đến 07:30</strong>, GVCN chỉ cần mở App trên điện thoại hoặc máy tính, đăng nhập bằng tên/email của mình để báo cáo sĩ số nhanh chóng.
                </p>
                <div className="text-[11px] text-indigo-800 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mẹo: Tích chọn "Ghi nhớ đăng nhập" để không phải nhập lại tài khoản ở các lần sau!</span>
                </div>
              </div>

              {/* Danh sách 20 GVCN với nút chọn nhanh */}
              <div>
                <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Danh sách GVCN & Lớp học:</span>
                  <span className="text-[10px] text-slate-400 font-normal">20 lớp chính thức</span>
                </div>

                {assignedClasses.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">Hiện tại 20 lớp đang ở trạng thái chưa phân công GVCN.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Quản trị viên có thể vào mục <strong>"Phân công GVCN"</strong> trong hệ thống để thực hiện phân công giáo viên chủ nhiệm.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-1">
                    {assignedClasses.map((cls) => {
                      const isCopied = copiedText === cls.name;
                      return (
                        <div
                          key={cls.id}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-black rounded text-[10px]">
                                Lớp {cls.name}
                              </span>
                              <span className="font-bold text-slate-900">{cls.teacherName}</span>
                            </div>
                            {cls.teacherPhone && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                SĐT: {cls.teacherPhone}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {cls.teacherPhone && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cls.teacherPhone!, cls.name)}
                                title="Sao chép số điện thoại"
                                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 cursor-pointer"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Cần hỗ trợ cài đặt? Liên hệ Quản trị viên THCS Bản Bo.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer ml-auto"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
