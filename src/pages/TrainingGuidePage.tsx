import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import {
  trainingService,
  TRAINING_SCENARIOS,
  TRAINING_QUIZ_QUESTIONS,
  TrainingScenario,
} from '../services/trainingService';
import { PageId } from '../components/common/Sidebar';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  RotateCcw,
  Users,
  Building2,
  UtensilsCrossed,
  Shield,
  ShieldCheck,
  Award,
  ChevronRight,
  FileText,
  HelpCircle,
  Play,
  UserCheck,
  Check,
  ExternalLink,
  PhoneCall,
  Calendar,
  Layers,
  ArrowRight,
  WifiOff,
} from 'lucide-react';
import { ConfirmDialog } from '../theme/designSystem';

interface TrainingGuidePageProps {
  onNavigate?: (page: PageId) => void;
}

type TabType = 'MANUALS' | 'SANDBOX_SCENARIOS' | 'QUIZ' | 'POCKET_GUIDE' | 'PILOT_PLAN';

export const TrainingGuidePage: React.FC<TrainingGuidePageProps> = ({ onNavigate }) => {
  const { currentUser, switchUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('MANUALS');
  const [activeRoleManual, setActiveRoleManual] = useState<'GVCN' | 'BGH' | 'TPT' | 'BAN_TRU' | 'TRUC_BAN'>('GVCN');
  const [isTrainingModeActive, setIsTrainingModeActive] = useState<boolean>(() => trainingService.isTrainingMode());
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario | null>(TRAINING_SCENARIOS[0]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean; completedAt: string } | null>(
    () => trainingService.getQuizResult()
  );

  useEffect(() => {
    const handleModeChange = () => {
      setIsTrainingModeActive(trainingService.isTrainingMode());
    };
    window.addEventListener('thcs_banbo_training_mode_changed', handleModeChange);
    return () => window.removeEventListener('thcs_banbo_training_mode_changed', handleModeChange);
  }, []);

  const handleToggleTrainingMode = () => {
    const nextState = !isTrainingModeActive;
    trainingService.setTrainingMode(nextState);
    setIsTrainingModeActive(nextState);
  };

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  const handleResetTraining = () => {
    setIsResetConfirmOpen(true);
  };

  const executeResetTraining = () => {
    trainingService.resetTrainingData();
    setIsResetConfirmOpen(false);
    setResetSuccessMessage(true);
    setTimeout(() => setResetSuccessMessage(false), 3000);
  };

  // Submit quiz
  const handleSubmitQuiz = () => {
    let score = 0;
    TRAINING_QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    trainingService.saveQuizResult(score, TRAINING_QUIZ_QUESTIONS.length, quizAnswers);
    setIsQuizSubmitted(true);
    setQuizResult({
      score,
      total: TRAINING_QUIZ_QUESTIONS.length,
      passed: score >= 8,
      completedAt: new Date().toISOString(),
    });
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setIsQuizSubmitted(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                <GraduationCap className="w-3.5 h-3.5" />
                BẢN BO · TẬP HUẤN & CHUYỂN GIAO
              </span>
              <span className="text-xs text-indigo-200">Phiên bản Vận hành 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cẩm Nang Vận Hành & Trung Tâm Tập Huấn
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Tài liệu hướng dẫn nghiệp vụ toàn diện cho 20 lớp học Trường THCS Bản Bo. Tích hợp môi trường thực hành ảo an toàn, bài trắc nghiệm chuẩn hóa và kế hoạch bàn giao vận hành.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Training Mode Switch Button */}
            <button
              type="button"
              onClick={handleToggleTrainingMode}
              className={`flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                isTrainingModeActive
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-4 ring-amber-400/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isTrainingModeActive ? 'ĐANG BẬT CHẾ ĐỘ TẬP HUẤN' : 'BẬT CHẾ ĐỘ THỰC HÀNH'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs border border-white/20 cursor-pointer transition-colors"
              title="In toàn bộ tài liệu hướng dẫn ra giấy hoặc xuất PDF"
            >
              <Printer className="w-4 h-4" />
              <span>IN TÀI LIỆU (PDF)</span>
            </button>
          </div>
        </div>

        {/* Training Mode Warning Ribbon if Active */}
        {isTrainingModeActive && (
          <div className="mt-5 pt-4 border-t border-indigo-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Môi trường thực hành ảo đang được kích hoạt: Bạn có thể thử nghiệm báo cáo thoải mái mà không ảnh hưởng đến số liệu thật của trường.</span>
            </div>
            <button
              type="button"
              onClick={handleResetTraining}
              className="flex items-center gap-1.5 text-indigo-200 hover:text-white underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại dữ liệu thực hành</span>
            </button>
          </div>
        )}

        {resetSuccessMessage && (
          <div className="mt-3 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đã làm mới dữ liệu tập huấn thành công! Toàn bộ bài thực hành đã được đưa về trạng thái ban đầu.</span>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('MANUALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MANUALS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. CẨM NANG THEO VAI TRÒ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SANDBOX_SCENARIOS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SANDBOX_SCENARIOS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>2. MÔI TRƯỜNG & KỊCH BẢN THỰC HÀNH</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUIZ')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'QUIZ'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>3. TRẮC NGHIỆM ĐÁNH GIÁ NGHIỆP VỤ</span>
          {quizResult && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${quizResult.passed ? 'bg-emerald-400 text-slate-900' : 'bg-rose-400 text-white'}`}>
              {quizResult.score}/10
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('POCKET_GUIDE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'POCKET_GUIDE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>4. THẺ BỎ TÚI & MỐC GIỜ VÀNG</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PILOT_PLAN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PILOT_PLAN'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5. LỘ TRÌNH TRIỂN KHAI & BÀN GIAO</span>
        </button>
      </div>

      {/* ==============================================================
          TAB 1: CẨM NANG THEO VAI TRÒ
      ============================================================== */}
      {activeTab === 'MANUALS' && (
        <div className="space-y-6">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Chọn nhóm đối tượng:
            </span>
            {[
              { id: 'GVCN', label: '1. Giáo Viên Chủ Nhiệm (20 Lớp)', icon: Users },
              { id: 'BGH', label: '2. Ban Giám Hiệu (Hiệu Trưởng/Phó HT)', icon: Shield },
              { id: 'TPT', label: '3. Tổng Phụ Trách Đội & Trực Ban', icon: UserCheck },
              { id: 'BAN_TRU', label: '4. Y Tế Học Đường & Bếp Ăn Bán Trú', icon: UtensilsCrossed },
              { id: 'TRUC_BAN', label: '5. Bảo Vệ & Trực Cổng Trường', icon: Building2 },
            ].map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRoleManual(r.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    activeRoleManual === r.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* MANUAL CONTENT FOR GVCN */}
          {activeRoleManual === 'GVCN' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  Tài liệu Hướng dẫn Chuyên môn · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Quy Trình 4 Bước Báo Cáo Sĩ Số Dành Cho Giáo Viên Chủ Nhiệm
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Áp dụng cho 20 lớp (6A1-6A5, 7A1-7A5, 8A1-8A5, 9A1-9A5) trên điện thoại thông minh hoặc máy tính bảng
                </p>
              </div>

              {/* 4 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Mở Điểm Danh Đúng Giờ</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đăng nhập tài khoản GVCN. Buổi sáng mở từ <strong className="text-slate-900">06:45</strong> đến <strong className="text-emerald-700">07:15</strong>. Buổi chiều mở từ <strong className="text-slate-900">13:00</strong> đến <strong className="text-emerald-700">13:45</strong>.
                  </p>
                  <div className="pt-2 text-[11px] text-emerald-700 font-semibold">
                    ✓ Nhắc 1: 07:05 (sáng) / 13:25 (chiều)
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Chọn Học Sinh Vắng</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hệ thống mặc định cả lớp ĐỦ. Chỉ cần nhấp vào học sinh vắng để chọn phân loại lý do: <em>Ốm đau, Có phép việc gia đình, Không phép, Nghi bỏ học</em>.
                  </p>
                  <div className="pt-2 text-[11px] text-blue-700 font-semibold">
                    ✓ Nhập chi tiết lời nhắn phụ huynh
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Xác Nhận Ăn Bán Trú</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kiểm tra số lượng học sinh bán trú ăn cơm trưa. Nếu có học sinh ngoại trú xin ăn trưa phát sinh, tích chọn để báo thêm suất cho nhà bếp trước 07:30.
                  </p>
                  <div className="pt-2 text-[11px] text-amber-800 font-semibold">
                    ✓ Khớp 100% định mức thực tế
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Bấm Gửi Báo Cáo</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nhấn nút <strong className="text-slate-900">GỬI BÁO CÁO</strong>. Báo cáo chuyển sang trạng thái "Đã nộp", Ban Giám Hiệu và TPT Đội sẽ thấy kết quả tức thì.
                  </p>
                  <div className="pt-2 text-[11px] text-purple-700 font-semibold">
                    ✓ Nhận mã xác nhận và thời gian gửi
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Xử Lý Khi Nộp Sau Hạn Chót (Sau 07:15)</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    Nếu nộp sau 07:15, hệ thống sẽ yêu cầu nhập bắt buộc <strong>Lý do nộp muộn</strong> (Ví dụ: <em>"Bận xử lý học sinh sốt tại lớp", "Đường đèo sạt lở đến muộn 5 phút"</em>). Sau khi nhập, bấm nộp muộn; BGH sẽ phê duyệt và ghi nhận vào lịch sử kiểm toán.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase">
                    <WifiOff className="w-4 h-4 text-emerald-600" />
                    <span>Cơ Chế Báo Cáo Ngoại Tuyến (Offline Mode)</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    Nếu trong lớp bị mất sóng 4G hoặc Wi-Fi trường bị ngắt, thầy cô <strong>vẫn mở app và điểm danh bình thường</strong>. Hệ thống tự động lưu trữ trên máy điện thoại và tự động đồng bộ gửi lên máy chủ ngay khi có sóng trở lại.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL CONTENT FOR BGH */}
          {activeRoleManual === 'BGH' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  Tài liệu Hướng dẫn Chuyên môn · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Nghiệp Vụ Giám Sát, Phê Duyệt & Khóa Sổ Toàn Trường (BGH)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Dành cho Hiệu trưởng và các Phó Hiệu trưởng phụ trách chuyên môn & bán trú
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">A</span>
                    Giám sát Tiến độ Nộp Thời Gian Thực (Live Matrix 20/20 Lớp)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Màn hình Dashboard tự động cập nhật mỗi 5 giây. BGH dễ dàng quan sát thấy lớp nào đã nộp (màu xanh), lớp nào đang sửa (màu vàng), lớp nào quá hạn chưa nộp (màu đỏ nhấp nháy).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">B</span>
                    Quy Trình "Yêu Cầu Chỉnh Sửa" Báo Cáo
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nếu phát hiện lớp báo thiếu lý do vắng hoặc số liệu ăn bán trú chưa chuẩn, BGH bấm nút <strong>"YÊU CẦU CHỈNH SỬA"</strong>, gõ lời nhắc (ví dụ: <em>"Đề nghị cô kiểm tra lại học sinh A vắng có phép hay không phép"</em>). GVCN sẽ nhận chuông báo và được quyền sửa đổi trong vòng 10 phút.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">C</span>
                    Phê Duyệt Hàng Loạt & Khóa Sổ Toàn Trường (Finalize)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    BGH có nút <strong>"Duyệt nhanh tất cả lớp đã nộp"</strong> (Batch Approve). Đúng <strong className="text-slate-900">07:30</strong> (buổi sáng) hoặc <strong className="text-slate-900">14:00</strong> (buổi chiều), BGH bấm <strong>"KHÓA SỔ BÁO CÁO"</strong>. Sau khi khóa, không ai có thể sửa đổi nếu không có mật khẩu BGH.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs">D</span>
                    Cảnh Báo Chuyên Cần & Nguy Cơ Bỏ Học (Vùng Cao Bản Bo)
                  </h4>
                  <p className="text-xs text-rose-950 leading-relaxed">
                    Hệ thống tự động lọc các học sinh vắng liên tiếp ≥ 3 ngày hoặc vắng nhiều ngày trong tháng, phân loại theo dân tộc (Mông, Dao, Thái, Giáy...). BGH căn cứ danh sách này để giao nhiệm vụ cho GVCN phối hợp Ban chỉ đạo PCGD xã đến tận bản vận động các em tiếp tục đến trường.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL CONTENT FOR TPT */}
          {activeRoleManual === 'TPT' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
                  Tài liệu Hướng dẫn Chuyên môn · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Nhiệm Vụ Tổng Phụ Trách Đội & Trực Ban Hàng Ngày
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Theo dõi nền nếp, gửi cảnh báo đôn đốc 1-chạm và xuất sổ trực ban
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-rose-700 uppercase">1. Đôn Đốc 1-Chạm</div>
                  <h4 className="font-bold text-sm text-slate-900">Gửi Cảnh Báo Cho GVCN</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vào trang "Lớp Chưa Báo Cáo", TPT Đội bấm nút <em>"Gửi nhắc nhở tất cả"</em> để kích hoạt thông báo khẩn cấp đến máy điện thoại của các GVCN còn chậm trễ.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-blue-700 uppercase">2. Bàn Giao Suất Ăn</div>
                  <h4 className="font-bold text-sm text-slate-900">Chốt Bán Trú Trước 07:30</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vào trang "Quản lý Bán Trú", xuất danh sách tổng số học sinh ăn cơm trưa từng khối 6, 7, 8, 9 gửi trực tiếp sang bộ phận cấp dưỡng để bắt đầu nấu ăn.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-700 uppercase">3. Xuất Sổ Trực Ban</div>
                  <h4 className="font-bold text-sm text-slate-900">In / Xuất Báo Cáo Ngày</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bấm nút "Xuất Sổ Trực Ban Điểm Danh (PDF)" để in ra 1 tờ A4 đóng vào sổ trực nhật Đội và lưu trữ theo dõi thi đua giữa các lớp trong tuần.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL CONTENT FOR BAN TRU */}
          {activeRoleManual === 'BAN_TRU' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Tài liệu Hướng dẫn Chuyên môn · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Quy Trình Cán Bộ Y Tế Học Đường & Tổ Nuôi Dưỡng Bán Trú
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Giám sát sức khỏe dịch bệnh học sinh và định mức khẩu phần ăn bán trú
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    Tổ Nuôi Dưỡng / Nhân Viên Bếp Ăn Bán Trú
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Lúc <strong>07:30</strong>: Mở màn hình Bán Trú để nhận số suất ăn trưa thực tế chính thức của 20 lớp.</li>
                    <li>Đối chiếu: Tổng số học sinh bán trú trừ đi học sinh bán trú nghỉ học cộng học sinh ngoại trú xin ăn phát sinh.</li>
                    <li>In phiếu xuất kho thực phẩm theo đúng đầu người, ký xác nhận cùng đại diện BGH.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Cán Bộ Y Tế Học Đường
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Lọc danh sách học sinh vắng với lý do "Ốm đau / Sức khỏe" trên toàn trường.</li>
                    <li>Nếu lớp nào có ≥ 3 học sinh cùng ốm sốt, cán bộ y tế lập tức đến kiểm tra phòng dịch.</li>
                    <li>Ghi nhật ký theo dõi sức khỏe học sinh bán trú nội trú tại trường.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL CONTENT FOR TRUC BAN / BAO VE */}
          {activeRoleManual === 'TRUC_BAN' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Tài liệu Hướng dẫn Chuyên môn · THCS Bản Bo
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Nhiệm Vụ Bảo Vệ Cổng Trường & Kiểm Soát Học Sinh Ra Vào
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sau 07:15, nhân viên bảo vệ tra cứu danh sách học sinh nghỉ học có phép trên hệ thống để kiểm soát cổng trường. Tuyệt đối không cho học sinh tự ý bỏ tiết ra ngoài cổng trường khi chưa có giấy xác nhận hoặc chưa được GVCN cập nhật trên hệ thống.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 2: MÔI TRƯỜNG & KỊCH BẢN THỰC HÀNH (SANDBOX)
      ============================================================== */}
      {activeTab === 'SANDBOX_SCENARIOS' && (
        <div className="space-y-6">
          {/* Training Control Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
                  SANDBOX
                </span>
                <h3 className="font-black text-base text-slate-900">
                  Môi Trường Thực Hành Độc Lập Cho 20 Lớp THCS Bản Bo
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Khi Chế độ Tập huấn được bật, các báo cáo nộp thử sẽ được lưu ở khoang bộ nhớ riêng biệt, không chạm vào dữ liệu thật. Bạn có thể tự do chuyển đổi giữa các vai trò để làm quen thao tác.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleTrainingMode}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs ${
                  isTrainingModeActive
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isTrainingModeActive ? 'TẮT TẬP HUẤN' : 'BẬT CHẾ ĐỘ TẬP HUẤN NGAY'}
              </button>
              <button
                type="button"
                onClick={handleResetTraining}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Quick Role Switcher for Training */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Đổi Nhanh Tài Khoản Thử Nghiệm Để Thực Hành
                </h4>
                <p className="text-xs text-slate-500">
                  Đang đăng nhập với: <strong>{currentUser?.fullName}</strong> ({currentUser?.role})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { id: 'admin_tpt', name: 'Thầy Cường', role: 'TPT Đội' },
                { id: 'principal', name: 'Thầy Hiệu Trưởng', role: 'BGH' },
                { id: 'gvcn_6a1', name: 'Cô Mai', role: 'GVCN 6A1' },
                { id: 'gvcn_7a2', name: 'Cô Thu', role: 'GVCN 7A2' },
                { id: 'gvcn_8a1', name: 'Thầy Dũng', role: 'GVCN 8A1' },
                { id: 'gvcn_9a3', name: 'Cô Hồng', role: 'GVCN 9A3' },
              ].map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    switchUser(u.id);
                    if (!isTrainingModeActive) trainingService.setTrainingMode(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    currentUser?.id === u.id
                      ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-900 ring-2 ring-indigo-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="font-bold truncate">{u.name}</div>
                  <div className="text-[10px] text-slate-500">{u.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4 Realistic Scenarios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario List */}
            <div className="lg:col-span-1 space-y-3">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider px-1">
                4 Kịch Bản Thực Hành Bắt Buộc:
              </h4>
              {TRAINING_SCENARIOS.map(sc => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedScenario?.id === sc.id
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                      {sc.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{sc.timeEstimate}</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 leading-snug">
                    {sc.title}
                  </h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">Lớp {sc.sampleClassName}</span>
                    <span>·</span>
                    <span className="text-amber-700 font-semibold">{sc.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Scenario Detail */}
            {selectedScenario && (
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                        {selectedScenario.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        Đối tượng: <strong>{selectedScenario.targetRole}</strong>
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {selectedScenario.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isTrainingModeActive) trainingService.setTrainingMode(true);
                      if (onNavigate) {
                        onNavigate('attendance_report');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>NẠP VÀ THỰC HÀNH NGAY</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <h6 className="font-bold text-slate-900 uppercase text-[11px] text-indigo-700 mb-1">
                      Bối Cảnh Thực Tế Tại Bản Bo:
                    </h6>
                    <p className="p-3.5 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-200">
                      {selectedScenario.context}
                    </p>
                  </div>

                  <div>
                    <h6 className="font-bold text-slate-900 uppercase text-[11px] text-indigo-700 mb-1.5">
                      Mục Tiêu Nghiệp Vụ Cần Đạt:
                    </h6>
                    <ul className="space-y-1.5 pl-2">
                      {selectedScenario.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h6 className="font-bold text-slate-900 uppercase text-[11px] text-indigo-700 mb-1.5">
                      Các Bước Thao Tác Cụ Thể:
                    </h6>
                    <div className="space-y-2">
                      {selectedScenario.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-slate-800 leading-snug">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Kết Quả Kỳ Vọng Sau Khi Hoàn Thành:
                    </div>
                    <p className="leading-relaxed">{selectedScenario.expectedResult}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: TRẮC NGHIỆM ĐÁNH GIÁ NGHIỆP VỤ (QUIZ)
      ============================================================== */}
      {activeTab === 'QUIZ' && (
        <div className="space-y-6">
          {/* Certificate Card if Passed */}
          {quizResult && quizResult.passed && (
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/90 text-amber-600 flex items-center justify-center shadow-lg shrink-0">
                    <Award className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="bg-slate-900 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      CHỨNG NHẬN ĐẠT CHUẨN VẬN HÀNH
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black mt-1">
                      Chúc Mừng Thầy/Cô {currentUser?.fullName}!
                    </h3>
                    <p className="text-xs text-slate-900 font-medium mt-0.5">
                      Đã hoàn thành xuất sắc bài kiểm tra nghiệp vụ hệ thống sĩ số Trường THCS Bản Bo ({quizResult.score}/10 câu đúng · {Math.round((quizResult.score / 10) * 100)}%).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Giấy Chứng Nhận</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRetakeQuiz}
                    className="px-4 py-2.5 bg-white/80 hover:bg-white text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Làm lại
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Container */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  Đánh Giá Nghiệp Vụ Vận Hành Hệ Thống · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  10 Câu Hỏi Trắc Nghiệm Củng Cố Quy Chế & Kỹ Năng
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Yêu cầu đạt tối thiểu 8/10 câu (80%) để đủ điều kiện cấp chứng nhận vận hành chính thức
                </p>
              </div>

              {isQuizSubmitted && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">
                    Điểm số: <strong className={quizResult?.passed ? 'text-emerald-600 text-lg' : 'text-rose-600 text-lg'}>{quizResult?.score}/10</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleRetakeQuiz}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Làm lại bài
                  </button>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {TRAINING_QUIZ_QUESTIONS.map((q, idx) => {
                const selected = quizAnswers[q.id];
                const isCorrect = isQuizSubmitted && selected === q.correctIndex;
                const isWrong = isQuizSubmitted && selected !== undefined && selected !== q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isQuizSubmitted
                        ? isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isWrong
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-3 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {q.question}
                        </h4>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selected === optIdx;
                            const isTargetCorrect = isQuizSubmitted && optIdx === q.correctIndex;

                            let optStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                            if (isChosen) {
                              optStyle = 'bg-indigo-600 text-white border-indigo-600 font-semibold';
                            }
                            if (isQuizSubmitted) {
                              if (isTargetCorrect) {
                                optStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                              } else if (isChosen && !isTargetCorrect) {
                                optStyle = 'bg-rose-600 text-white border-rose-600 line-through';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={isQuizSubmitted}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${optStyle}`}
                              >
                                <span className="font-bold shrink-0">
                                  {['A', 'B', 'C', 'D'][optIdx]}.
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation after submission */}
                        {isQuizSubmitted && (
                          <div className={`p-3 rounded-xl text-xs space-y-1 ${isCorrect ? 'bg-emerald-100/70 text-emerald-950' : 'bg-amber-100/70 text-amber-950'}`}>
                            <div className="font-bold flex items-center gap-1.5">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-700" />
                              )}
                              <span>Giải thích căn cứ quy chế THCS Bản Bo:</span>
                            </div>
                            <p className="leading-relaxed pl-5">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            {!isQuizSubmitted && (
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < TRAINING_QUIZ_QUESTIONS.length}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs cursor-pointer disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    NỘP BÀI ĐÁNH GIÁ ({Object.keys(quizAnswers).length}/{TRAINING_QUIZ_QUESTIONS.length} CÂU)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 4: THẺ BỎ TÚI & MỐC GIỜ VÀNG (POCKET GUIDE)
      ============================================================== */}
      {activeTab === 'POCKET_GUIDE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                  Thẻ Ghi Nhớ Bỏ Túi 1 Trang · THCS Bản Bo
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Quy Chế Mốc Giờ Vàng Điểm Danh Trong Ngày
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  In ra để dán tại bảng tin Hội đồng Sư phạm, Phòng Trực ban và bàn làm việc của 20 GVCN
                </p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Thẻ Bỏ Túi</span>
              </button>
            </div>

            {/* Timeline Infographic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MORNING SESSION */}
              <div className="border-2 border-emerald-300 rounded-2xl p-5 bg-emerald-50/40 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h3 className="font-black text-base text-emerald-950 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    BUỔI SÁNG (5 Mốc Giờ Chuẩn)
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Khóa lúc 07:30
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { time: '06:45', title: '1. MỞ CỔNG NHẬN BÁO CÁO', desc: 'GVCN bắt đầu vào lớp và gửi báo cáo sĩ số trên app.', color: 'text-emerald-700' },
                    { time: '07:05', title: '2. NHẮC NHỞ LẦN 1 (Tự động)', desc: 'Hệ thống gửi tin nhắn nhắc nhở GVCN các lớp chưa gửi.', color: 'text-blue-700' },
                    { time: '07:10', title: '3. NHẮC NHỞ LẦN 2 (Khẩn cấp)', desc: 'Cảnh báo đỏ trước hạn chót 5 phút; TPT Đội đôn đốc.', color: 'text-amber-700' },
                    { time: '07:15', title: '4. HẠN CHÓT NỘP (DEADLINE)', desc: 'Sau mốc này, nộp báo cáo bị đánh dấu NỘP MUỘN kèm giải trình.', color: 'text-rose-700' },
                    { time: '07:30', title: '5. KHÓA SỔ & CHỐT ĂN BÁN TRÚ', desc: 'BGH khóa sổ toàn trường, xuất số suất ăn giao Nhà bếp.', color: 'text-purple-700' },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className={`font-black text-sm ${m.color} shrink-0 w-12 pt-0.5`}>
                        {m.time}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-600">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AFTERNOON SESSION */}
              <div className="border-2 border-indigo-300 rounded-2xl p-5 bg-indigo-50/40 space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <h3 className="font-black text-base text-indigo-950 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600" />
                    BUỔI CHIỀU (5 Mốc Giờ Chuẩn)
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Khóa lúc 13:55
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { time: '13:00', title: '1. MỞ CỔNG NHẬN BÁO CÁO', desc: 'Bắt đầu nhận báo cáo sĩ số ca học buổi chiều.', color: 'text-indigo-700' },
                    { time: '13:25', title: '2. NHẮC NHỞ LẦN 1 (Tự động)', desc: 'Hệ thống gửi thông báo nhắc đợt 1 đến điện thoại GVCN.', color: 'text-blue-700' },
                    { time: '13:40', title: '3. NHẮC NHỞ LẦN 2 (Khẩn cấp)', desc: 'Cảnh báo trước hạn chót 5 phút buổi chiều.', color: 'text-amber-700' },
                    { time: '13:45', title: '4. HẠN CHÓT NỘP (DEADLINE)', desc: 'Hạn chót gửi sĩ số chiều; sau 13:45 tính là nộp muộn.', color: 'text-rose-700' },
                    { time: '13:55', title: '5. KHÓA SỔ BÁO CÁO CHIỀU', desc: 'BGH khóa sổ ca chiều và hoàn thiện cơ sở dữ liệu ngày.', color: 'text-purple-700' },
                  ].map((m, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
                      <span className={`font-black text-sm ${m.color} shrink-0 w-12 pt-0.5`}>
                        {m.time}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-600">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Golden Rules */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <h4 className="font-black text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                4 Điều Ghi Nhớ Bất Biến Dành Cho GVCN THCS Bản Bo:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-200">
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="font-bold text-amber-300 block mb-1">1. ĐÚNG GIỜ:</span>
                  Nộp trước 07:15 sáng và trước 13:45 chiều. Tuyệt đối không để BGH phải nhắc nhở bằng điện thoại.
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="font-bold text-amber-300 block mb-1">2. RÕ LÝ DO:</span>
                  Học sinh vắng bắt buộc phân loại rõ: Ốm đau, việc gia đình, không phép hay nghi bỏ học.
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="font-bold text-amber-300 block mb-1">3. CHUẨN SUẤT ĂN:</span>
                  Số lượng học sinh ăn trưa bán trú phải khớp 100% với thực tế tại nhà ăn của trường.
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="font-bold text-amber-300 block mb-1">4. KHÔNG SỢ MẤT MẠNG:</span>
                  Cứ điểm danh nộp bình thường khi mất sóng, app sẽ tự gửi ngay khi điện thoại có kết nối.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 5: LỘ TRÌNH TRIỂN KHAI & BÀN GIAO (PILOT PLAN)
      ============================================================== */}
      {activeTab === 'PILOT_PLAN' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Kế Hoạch Thử Nghiệm & Chuyển Giao Công Nghệ · Năm Học 2026 - 2027
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Lộ Trình Triển Khai Thử Nghiệm 3 Giai Đoạn Tại Trường THCS Bản Bo
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kế hoạch phối hợp đồng bộ giữa Ban Giám Hiệu, 20 Giáo viên Chủ nhiệm và Đội ngũ Kỹ thuật
              </p>
            </div>

            {/* 3 Phases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-blue-800">
                  <span>GIAI ĐOẠN 1</span>
                  <span className="bg-blue-200/80 px-2 py-0.5 rounded">Tuần 1</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Chuẩn Bị, Kích Hoạt & Tập Huấn 20 GVCN
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Kích hoạt 20 tài khoản GVCN và phân công lớp chính xác.</li>
                  <li>Tổ chức 1 buổi tập huấn thực hành 60 phút tại Hội đồng trường.</li>
                  <li>100% GVCN hoàn thành bài thi trắc nghiệm nghiệp vụ đạt ≥ 80%.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-amber-800">
                  <span>GIAI ĐOẠN 2</span>
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded">Tuần 2</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Vận Hành Thử Nghiệm Song Song Sổ Giấy
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>GVCN vừa báo trên app, vừa duy trì sổ giấy trực ban đối chiếu.</li>
                  <li>Kiểm thử quy trình xuất ăn bán trú sang nhà bếp mỗi ngày.</li>
                  <li>Rút kinh nghiệm và tinh chỉnh thời gian nhắc nhở phù hợp.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-emerald-800">
                  <span>GIAI ĐOẠN 3</span>
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded">Tuần 3 trở đi</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Vận Hành Số Hóa Chính Thức 100%
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>Chấm dứt hoàn toàn sổ ghi chép giấy truyền thống.</li>
                  <li>Số liệu điểm danh trên phần mềm là căn cứ pháp lý duy nhất.</li>
                  <li>Ký biên bản nghiệm thu bàn giao chính thức cho THCS Bản Bo.</li>
                </ul>
              </div>
            </div>

            {/* SLA Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tiêu Chí Nghiệm Thu Chất Lượng Vận Hành (SLA)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Chỉ số đánh giá (KPI)</th>
                      <th className="p-3">Mục tiêu cam kết</th>
                      <th className="p-3">Phương thức đo lường</th>
                      <th className="p-3">Đơn vị chịu trách nhiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Tỷ lệ nộp báo cáo đúng hạn (trước 07:15)</td>
                      <td className="p-3 text-emerald-700 font-bold">≥ 98% toàn trường</td>
                      <td className="p-3">Hệ thống đo lường tự động từng phút</td>
                      <td className="p-3">20 Giáo viên Chủ nhiệm</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Độ chính xác suất ăn bán trú trưa</td>
                      <td className="p-3 text-emerald-700 font-bold">100% không sai lệch</td>
                      <td className="p-3">Đối chiếu giữa BGH và Cán bộ Nhà bếp</td>
                      <td className="p-3">GVCN & Bộ phận Cấp dưỡng</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Tỷ lệ học sinh vắng có lý do rõ ràng</td>
                      <td className="p-3 text-emerald-700 font-bold">100% trong buổi</td>
                      <td className="p-3">Hệ thống bắt buộc nhập phân loại lý do</td>
                      <td className="p-3">GVCN & BGH</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Thời gian khắc phục sự cố kỹ thuật</td>
                      <td className="p-3 text-emerald-700 font-bold">&lt; 15 phút</td>
                      <td className="p-3">Hotline hỗ trợ trực ban 24/7</td>
                      <td className="p-3">Quản trị viên & TPT Đội</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Handover & Technical Support Contact */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  Đầu Mối Hỗ Trợ Kỹ Thuật & Tiếp Nhận Sự Cố (Trường THCS Bản Bo)
                </div>
                <p className="text-xs text-slate-600">
                  Tổng Phụ Trách Đội: Thầy Đỗ Văn Cường · Quản Trị Hệ Thống: Phòng Công Nghệ Thông Tin
                </p>
              </div>

              <div className="text-xs text-right">
                <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                  Sẵn sàng nghiệm thu bàn giao 100%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Training Data Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="LÀM MỚI DỮ LIỆU TẬP HUẤN"
        message="Thầy/Cô có muốn đặt lại toàn bộ dữ liệu môi trường tập huấn về ban đầu để tiếp tục luyện tập thao tác báo cáo sĩ số?"
        confirmLabel="LÀM MỚI"
        cancelLabel="HỦY"
        variant="warning"
        onConfirm={executeResetTraining}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
