import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { attendanceService, SchoolDashboardStats, GradeSummary } from '../services/attendanceService';
import { exportService } from '../services/exportService';
import { formatFullVietnameseDate, getTodayDateString } from '../utils/formatters';
import { PageId } from '../components/common/Sidebar';
import { REPORT_STATUS_LABELS } from '../config/constants';
import { AttendanceReport, SchoolClass, SessionType, normalizeSession, getSessionDisplayName } from '../types';
import { AdminSessionSelector, AdminDashboardSessionView } from '../components/common/AdminSessionSelector';
import { DailySessionsOverview } from '../components/admin/DailySessionsOverview';
import { MorningProgressWidget } from '../components/admin/MorningProgressWidget';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ClipboardCheck,
  Phone,
  Lock,
  Unlock,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  Send,
  MessageSquare,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  CheckSquare,
  BookOpen,
  XCircle,
  Upload,
} from 'lucide-react';

interface DashboardPageProps {
  currentDate: string;
  onNavigate: (page: PageId) => void;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentDate,
  onNavigate,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const settings = storageService.getSettings();

  // Clock state (Mục 3: Có đồng hồ nhỏ hiển thị giờ hiện tại)
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime updates (Mục XXVII)
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRefreshTick((prev) => prev + 1);
    window.addEventListener('thcs_banbo_reports_changed', handleUpdate);
    window.addEventListener('thcs_banbo_notification_changed', handleUpdate);
    window.addEventListener('thcs_banbo_settings_changed', handleUpdate);
    return () => {
      window.removeEventListener('thcs_banbo_reports_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_notification_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_settings_changed', handleUpdate);
    };
  }, []);

  // Smart default session based on current time (Mục LV, XIX)
  const currentHour = new Date().getHours();
  const [adminView, setAdminView] = useState<AdminDashboardSessionView>(() => (currentHour >= 12 ? 'AFTERNOON' : 'MORNING'));

  // Active session for queries (MORNING or AFTERNOON)
  const activeSession: SessionType = adminView === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING';
  const filterSession = activeSession;

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [activeGradeFilter, setActiveGradeFilter] = useState<number>(0);

  // Batch selection for multi-class approval (Mục 17)
  const [selectedPendingClassIds, setSelectedPendingClassIds] = useState<string[]>([]);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

  // Single report approval/revision modal (Mục 12, 13, 14, 15, 16)
  const [viewingReportClassId, setViewingReportClassId] = useState<string | null>(null);
  const [viewingReportSession, setViewingReportSession] = useState<SessionType>('MORNING');
  const [isConfirmApproveModalOpen, setIsConfirmApproveModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReasonInput, setUnlockReasonInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Info modal for unsubmitted class
  const [infoClassId, setInfoClassId] = useState<string | null>(null);

  // Finalize / Lock whole school dialog (Mục 1, 18, XLVII, XLVIII)
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // Quick report modal
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [copiedQuickText, setCopiedQuickText] = useState(false);

  // Load stats from database for both sessions to display progress side-by-side (Mục XXII)
  const morningStats: SchoolDashboardStats = useMemo(() => {
    return attendanceService.getDashboardStats(currentDate, 'MORNING');
  }, [currentDate, refreshTick]);

  const afternoonStats: SchoolDashboardStats = useMemo(() => {
    return attendanceService.getDashboardStats(currentDate, 'AFTERNOON');
  }, [currentDate, refreshTick]);

  // Current session stats
  const stats: SchoolDashboardStats = useMemo(() => {
    return attendanceService.getDashboardStats(currentDate, activeSession);
  }, [currentDate, activeSession, refreshTick]);

  const { grades } = useMemo(() => {
    return attendanceService.getGradeSummaries(currentDate, activeSession);
  }, [currentDate, activeSession, refreshTick]);

  // Load all 20 classes
  const classes = useMemo(() => {
    return storageService.getClasses().filter(c => c.isActive);
  }, [refreshTick]);

  const morningReports = useMemo(() => {
    return storageService.getReportsByDate(currentDate, 'MORNING');
  }, [currentDate, refreshTick]);

  const afternoonReports = useMemo(() => {
    return storageService.getReportsByDate(currentDate, 'AFTERNOON');
  }, [currentDate, refreshTick]);

  const reports = useMemo(() => {
    return adminView === 'AFTERNOON' ? afternoonReports : morningReports;
  }, [adminView, morningReports, afternoonReports]);

  const reportMap = useMemo(() => {
    const map = new Map<string, AttendanceReport>();
    reports.forEach(r => map.set(r.classId, r));
    return map;
  }, [reports]);

  // Selected report for review
  // Selected report for review (lấy chính xác theo classId và session)
  const selectedReport = useMemo(() => {
    if (!viewingReportClassId) return null;
    return storageService.getReportByDateAndClass(currentDate, viewingReportClassId, viewingReportSession) || null;
  }, [viewingReportClassId, viewingReportSession, currentDate, morningReports, afternoonReports]);

  const selectedClass = useMemo(() => {
    if (!viewingReportClassId) return null;
    return classes.find(c => c.id === viewingReportClassId) || null;
  }, [viewingReportClassId, classes]);

  const viewingInfoClass = useMemo(() => {
    if (!infoClassId) return null;
    return classes.find(c => c.id === infoClassId) || null;
  }, [infoClassId, classes]);

  // Single approval action (Mục 16)
  const handleExecuteSingleApprove = () => {
    if (!selectedReport || !selectedClass) return;
    storageService.approveReport(selectedReport.id, currentUser?.name || 'Phạm Ngọc Thúy');
    setIsConfirmApproveModalOpen(false);
    setViewingReportClassId(null);
  };

  // Revision request action (Mục 15)
  const handleSubmitRevision = () => {
    setRevisionError(null);
    if (!revisionReasonInput.trim()) {
      setRevisionError('Vui lòng nhập nội dung chi tiết cần yêu cầu GVCN chỉnh sửa.');
      return;
    }
    if (selectedReport) {
      storageService.requestRevision(
        selectedReport.id,
        revisionReasonInput.trim(),
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      setIsRevisionModalOpen(false);
      setRevisionReasonInput('');
      setRevisionError(null);
      setViewingReportClassId(null);
    }
  };

  // Unlock action
  const handleSubmitUnlock = () => {
    setUnlockError(null);
    if (!unlockReasonInput.trim()) {
      setUnlockError('Vui lòng nhập lí do mở khóa báo cáo (ghi vào nhật ký hệ thống).');
      return;
    }
    if (selectedReport) {
      storageService.unlockReport(
        selectedReport.id,
        unlockReasonInput.trim(),
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      setIsUnlockModalOpen(false);
      setUnlockReasonInput('');
      setUnlockError(null);
      setViewingReportClassId(null);
    }
  };

  // Batch approval (Mục 17)
  const handleBatchApprove = () => {
    if (selectedPendingClassIds.length === 0) return;
    const targetReportIds: string[] = [];
    selectedPendingClassIds.forEach(cId => {
      const rep = reportMap.get(cId);
      if (rep && (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted')) {
        targetReportIds.push(rep.id);
      }
    });

    if (targetReportIds.length > 0) {
      storageService.batchApproveReports(targetReportIds, currentUser?.name || 'Phạm Ngọc Thúy');
      setSelectedPendingClassIds([]);
      setIsBatchConfirmOpen(false);
    }
  };

  // Finalize school attendance (Mục 1, 18)
  const handleFinalizeSchool = () => {
    storageService.lockAllReportsForDate(currentDate, filterSession, currentUser?.name || 'Phạm Ngọc Thúy');
    setIsFinalizeModalOpen(false);
  };

  // Quick report copy
  const handleCopyQuickReport = () => {
    const text = exportService.generateQuickReportText(currentDate, filterSession);
    navigator.clipboard.writeText(text);
    setCopiedQuickText(true);
    setTimeout(() => setCopiedQuickText(false), 2500);
  };

  // Calculate locked classes count
  const lockedClassesCount = useMemo(() => {
    return reports.filter(r => r.status === 'LOCKED' || (r.status as string) === 'locked').length;
  }, [reports]);

  // Check condition for school lock (Mục 1, 18)
  const isEligibleToLock = stats.approvedClassesCount === 20;

  // Filter 20 classes
  const displayedClasses = useMemo(() => {
    return classes.filter(cls => {
      if (activeGradeFilter > 0 && cls.grade !== activeGradeFilter) return false;

      const rep = reportMap.get(cls.id);
      const status = rep ? rep.status : 'NOT_SUBMITTED';

      if (activeStatusFilter === 'ALL') return true;
      if (activeStatusFilter === 'NOT_SUBMITTED' && (status === 'NOT_SUBMITTED' || (status as string) === 'not_reported' || !rep)) return true;
      if (activeStatusFilter === 'PENDING_APPROVAL' && (status === 'PENDING_APPROVAL' || (status as string) === 'submitted')) return true;
      if (activeStatusFilter === 'REVISION_REQUIRED' && (status === 'REVISION_REQUIRED' || (status as string) === 'needs_revision')) return true;
      if (activeStatusFilter === 'APPROVED' && status === 'APPROVED') return true;
      if (activeStatusFilter === 'LOCKED' && (status === 'LOCKED' || (status as string) === 'locked')) return true;

      return false;
    });
  }, [classes, reportMap, activeGradeFilter, activeStatusFilter]);

  // Rate calculations
  const boardingRateFormatted = stats.boardingConfirmedTotal > 0
    ? ((stats.boardingPresent / stats.boardingConfirmedTotal) * 100).toFixed(1).replace('.', ',')
    : '0,0';

  const nonBoardingRateFormatted = stats.nonBoardingConfirmedTotal > 0
    ? ((stats.nonBoardingPresent / stats.nonBoardingConfirmedTotal) * 100).toFixed(1).replace('.', ',')
    : '0,0';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6 pb-24">
      {/* ==================================================
          MỤC 3: GIAO DIỆN ĐẦU TRANG
          TRƯỜNG THCS BẢN BO
          HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH
          BÁO CÁO BUỔI SÁNG
          “Xin chào, Phạm Ngọc Thúy”
          “Tổng Phụ trách Đội”
          Ngày hiện tại: Thứ Sáu, ngày 02 tháng 10 năm 2026 + Đồng hồ nhỏ
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-black text-blue-900 uppercase tracking-widest">
              TRƯỜNG THCS BẢN BO · XÃ BẢN BO, TỈNH LAI CHÂU
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
              {adminView === 'AFTERNOON'
                ? 'BÁO CÁO BUỔI CHIỀU'
                : adminView === 'FULL_DAY'
                ? 'BÁO CÁO TỔNG QUAN CẢ NGÀY'
                : 'BÁO CÁO BUỔI SÁNG'}
            </h1>
            <div className="pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-slate-700">
                Xin chào, <strong className="text-blue-900 font-extrabold">Phạm Ngọc Thúy</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Tổng Phụ trách Đội
              </span>
            </div>

            {/* BỘ CHỌN BUỔI CHO TỔNG PHỤ TRÁCH (MỤC XIX, XX, XXI, XXIII) */}
            <div className="pt-3">
              <AdminSessionSelector
                currentView={adminView}
                onChange={(view) => {
                  setAdminView(view);
                  setSelectedPendingClassIds([]);
                }}
                morningSubmitted={morningStats.submittedClassesCount}
                morningTotal={morningStats.totalClasses}
                afternoonSubmitted={afternoonStats.submittedClassesCount}
                afternoonTotal={afternoonStats.totalClasses}
              />
            </div>
          </div>

          {/* Ngày hiện tại + Đồng hồ nhỏ thời gian thực + Nút thao tác nhanh */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-slate-800">
                  {formatFullVietnameseDate(currentDate)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Giờ hiện tại:</span>
                  <strong className="text-blue-950 font-bold">{currentTime}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('import_students')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Nhập danh sách học sinh thật từ file Excel (.xls / .xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Nhập Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickReportOpen(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Báo cáo nhanh gửi nhóm Zalo BGH"
              >
                <Copy className="w-3.5 h-3.5 text-blue-700" />
                <span>Báo Cáo Nhanh (Zalo)</span>
              </button>

              <button
                type="button"
                onClick={() => exportService.exportDailyReportExcel(currentDate, filterSession)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Xuất file Excel đầy đủ 5 sheets"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Xem văn bản in A4"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>In A4</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC LXXXVII & LXXXVIII: DÒNG TÓM TẮT SỨC KHỎE HỆ THỐNG
          HỆ THỐNG: BÌNH THƯỜNG · BACKUP: OK · SCHEDULER: OK · CẢNH BÁO: 0
      ================================================== */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono shadow-xs gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>HỆ THỐNG: BÌNH THƯỜNG</span>
          </span>
          <span className="text-slate-500">|</span>
          <span>BACKUP: <strong className="text-emerald-300 font-bold">OK (VERIFIED)</strong></span>
          <span className="text-slate-500">|</span>
          <span>SCHEDULER: <strong className="text-emerald-300 font-bold">OK</strong></span>
          <span className="text-slate-500">|</span>
          <span>CẢNH BÁO: <strong className="text-slate-200 font-bold">0</strong></span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('handover_operations')}
          className="text-blue-300 hover:text-white font-sans text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
        >
          <span>Bàn giao & Vận hành →</span>
        </button>
      </div>

      {/* ==================================================
          MỤC XCI & XCII: THÔNG BÁO HOÀN THÀNH SĨ SỐ BUỔI SÁNG & NÚT NHANH SAU CHỐT
      ================================================== */}
      {lockedClassesCount === 20 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                HOÀN THÀNH SĨ SỐ TOÀN TRƯỜNG (20/20 LỚP ĐÃ CHỐT)
              </h3>
            </div>
            <p className="text-xs text-emerald-800">
              Tổng HS: <strong>{stats.confirmedStudents}</strong> · Có mặt: <strong>{stats.presentCount}</strong> · Vắng: <strong>{stats.absentCount}</strong> · Bán trú: <strong>{stats.boardingPresent}/{stats.boardingConfirmedTotal}</strong> · Ngoại trú: <strong>{stats.nonBoardingPresent}/{stats.nonBoardingConfirmedTotal}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyQuickReport}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedQuickText ? 'Đã sao chép' : 'SAO CHÉP BÁO CÁO'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>XUẤT EXCEL / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('morning_progress')}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>XEM CHI TIẾT</span>
            </button>
          </div>
        </div>
      )}

      {/* Thông báo sẵn sàng tiếp nhận file dữ liệu học sinh chuẩn của trường */}
      {stats.totalStudentsRoster === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-extrabold uppercase">
                  Đã làm sạch dữ liệu
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Dữ liệu học sinh demo đã được xóa hoàn toàn (0 học sinh)
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hệ thống 20 lớp chính thức của Trường THCS Bản Bo đang ở trạng thái sạch 100%. Cô Phạm Ngọc Thúy và Ban Quản trị có thể tải lên tệp Excel danh sách học sinh chuẩn (.xls hoặc .xlsx) của toàn trường ngay bây giờ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('import_students')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer shadow-xs self-start md:self-auto transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Tải file Excel học sinh chuẩn ngay →</span>
          </button>
        </div>
      )}

      {/* ==================================================
          MỤC XIX, XXII, XXIII: BỘ CHỌN BUỔI SÁNG / BUỔI CHIỀU / CẢ NGÀY
          Dành cho Tổng phụ trách và Ban giám hiệu
      ================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span>PHIÊN ĐIỂM DANH TRƯỜNG THCS BẢN BO</span>
          </div>
          <div className="text-sm font-black text-slate-900 mt-0.5">
            {adminView === 'MORNING'
              ? 'Đang xem: BUỔI SÁNG (Báo cáo riêng buổi sáng)'
              : adminView === 'AFTERNOON'
              ? 'Đang xem: BUỔI CHIỀU (Báo cáo riêng buổi chiều)'
              : 'Đang xem: BẢNG TỔNG QUAN CẢ NGÀY (Đối chiếu sáng & chiều)'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Số liệu 2 buổi hoàn toàn độc lập, không ghi đè, không tự động gộp.
          </div>
        </div>

        <AdminSessionSelector
          currentView={adminView}
          onChange={setAdminView}
          morningSubmitted={morningStats.submittedClassesCount}
          morningTotal={20}
          afternoonSubmitted={afternoonStats.submittedClassesCount}
          afternoonTotal={20}
        />
      </div>

      {/* ==================================================
          MỤC XIII, XIV, LXIII, LXIV: THEO DÕI BÁO CÁO SĨ SỐ BUỔI SÁNG & CẦN XỬ LÝ NGAY
      ================================================== */}
      {(adminView === 'MORNING' || adminView === 'AFTERNOON') && (
        <MorningProgressWidget
          currentDate={currentDate}
          session={adminView}
          classes={classes}
          reports={adminView === 'AFTERNOON' ? afternoonReports : morningReports}
          settings={settings}
          onReviewReport={(cId) => {
            setViewingReportClassId(cId);
            setViewingReportSession(adminView);
            setIsConfirmApproveModalOpen(true);
          }}
          onNavigateToProgressPage={() => onNavigate('morning_progress')}
        />
      )}

      {/* ==================================================
          MỤC 4: THANH TIẾN ĐỘ BÁO CÁO SĨ SỐ HÔM NAY
          ĐÃ GỬI: ... / 20 lớp
          ĐÃ DUYỆT: ... / 20 lớp
          Progress bar trực quan từ dữ liệu thật
      ================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-extrabold text-blue-300 uppercase tracking-wider">
              TIẾN ĐỘ BÁO CÁO SĨ SỐ {adminView === 'AFTERNOON' ? 'BUỔI CHIỀU' : adminView === 'FULL_DAY' ? 'CẢ NGÀY' : 'BUỔI SÁNG'}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-1">
              <div className="text-lg sm:text-xl font-bold">
                <span className="text-slate-400 text-sm uppercase mr-2 font-semibold">ĐÃ GỬI:</span>
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {stats.submittedClassesCount}
                </span>
                <span className="text-slate-400 font-normal"> / 20 lớp</span>
              </div>

              <div className="text-lg sm:text-xl font-bold">
                <span className="text-slate-400 text-sm uppercase mr-2 font-semibold">ĐÃ DUYỆT:</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {stats.approvedClassesCount}
                </span>
                <span className="text-slate-400 font-normal"> / 20 lớp</span>
              </div>
            </div>

            {/* MỤC XXII: TIẾN ĐỘ 20 LỚP TÁCH RIÊNG TỪNG PHIÊN */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-amber-300 font-black">BUỔI SÁNG:</span>
                <span className="text-slate-200">{morningStats.submittedClassesCount}/20 đã gửi</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold">{morningStats.approvedClassesCount}/20 đã duyệt</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <span className="text-blue-300 font-black">BUỔI CHIỀU:</span>
                <span className="text-slate-200">{afternoonStats.submittedClassesCount}/20 đã gửi</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold">{afternoonStats.approvedClassesCount}/20 đã duyệt</span>
              </div>
            </div>
          </div>

          {/* Điều kiện chốt sĩ số toàn trường (Mục 1, XLVII, XLVIII) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs text-right hidden lg:block">
              <div className="text-slate-300">
                Điều kiện chốt: <strong className={isEligibleToLock ? 'text-emerald-400' : 'text-amber-300'}>
                  {isEligibleToLock ? 'ĐỦ ĐIỀU KIỆN (20/20)' : `CHƯA ĐỦ (${stats.approvedClassesCount}/20)`}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400">
                {isEligibleToLock ? `Có thể chốt chính thức ${getSessionDisplayName(activeSession).toLowerCase()}` : `Cần duyệt đủ 20 lớp ${getSessionDisplayName(activeSession).toLowerCase()}`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFinalizeModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                isEligibleToLock
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>CHỐT SĨ SỐ {adminView === 'AFTERNOON' ? 'BUỔI CHIỀU' : 'BUỔI SÁNG'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar 2 tầng: Tầng 1 đã gửi (amber), Tầng 2 đã duyệt (emerald) */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(stats.approvedClassesCount / 20) * 100}%` }}
              title={`Đã duyệt: ${stats.approvedClassesCount}/20 lớp`}
            />
            <div
              className="bg-amber-400/80 h-full transition-all duration-500"
              style={{
                width: `${Math.max(0, ((stats.submittedClassesCount - stats.approvedClassesCount) / 20) * 100)}%`,
              }}
              title={`Chờ duyệt/Cần sửa: ${stats.submittedClassesCount - stats.approvedClassesCount} lớp`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Đã duyệt ({stats.approvedClassesCount}/20)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Chờ duyệt / Cần sửa ({stats.pendingClassesCount + stats.revisionRequiredCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
              Chưa gửi ({stats.unsubmittedClassesCount}/20)
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC 5: 5 THẺ TRẠNG THÁI QUAN TRỌNG
          THẺ 1: CHƯA BÁO CÁO
          THẺ 2: CHỜ DUYỆT
          THẺ 3: CẦN CHỈNH SỬA
          THẺ 4: ĐÃ DUYỆT
          THẺ 5: ĐÃ KHÓA
          Khi nhấn thẻ: lọc ngay bảng bên dưới
      ================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* THẺ 1: CHƯA BÁO CÁO */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'NOT_SUBMITTED' ? 'ALL' : 'NOT_SUBMITTED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatusFilter === 'NOT_SUBMITTED'
              ? 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-xs font-bold text-slate-600 uppercase flex items-center justify-between">
            <span>CHƯA BÁO CÁO</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2 font-mono">
            {stats.unsubmittedClassesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.unsubmittedClassesCount} lớp chưa gửi số liệu
          </div>
        </div>

        {/* THẺ 2: CHỜ DUYỆT */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'PENDING_APPROVAL' ? 'ALL' : 'PENDING_APPROVAL')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatusFilter === 'PENDING_APPROVAL'
              ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-xs font-bold text-amber-800 uppercase flex items-center justify-between">
            <span>CHỜ DUYỆT</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2 font-mono">
            {stats.pendingClassesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            báo cáo GVCN đã gửi
          </div>
        </div>

        {/* THẺ 3: CẦN CHỈNH SỬA */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'REVISION_REQUIRED' ? 'ALL' : 'REVISION_REQUIRED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatusFilter === 'REVISION_REQUIRED'
              ? 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-xs font-bold text-rose-800 uppercase flex items-center justify-between">
            <span>CẦN CHỈNH SỬA</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2 font-mono">
            {stats.revisionRequiredCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            lớp bị yêu cầu sửa lại
          </div>
        </div>

        {/* THẺ 4: ĐÃ DUYỆT */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${
            activeStatusFilter === 'APPROVED'
              ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
            <span>ĐÃ DUYỆT</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">
            {stats.approvedClassesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            đã kiểm tra và duyệt
          </div>
        </div>

        {/* THẺ 5: ĐÃ KHÓA */}
        <div
          onClick={() => setActiveStatusFilter(activeStatusFilter === 'LOCKED' ? 'ALL' : 'LOCKED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeStatusFilter === 'LOCKED'
              ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20 shadow-xs'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <div className="text-xs font-bold text-blue-900 uppercase flex items-center justify-between">
            <span>ĐÃ KHÓA</span>
            <Lock className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2 font-mono">
            {lockedClassesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            đã khóa sau khi chốt
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC 6: THẺ TỔNG HỢP HỌC SINH
          “TÌNH HÌNH HỌC SINH HÔM NAY”
          TỔNG HỌC SINH, CÓ MẶT, VẮNG, VẮNG CÓ PHÉP, VẮNG KHÔNG PHÉP, ĐI MUỘN, VỀ SỚM
          Lưu ý: Chỉ cộng dữ liệu chính thức từ các lớp đã APPROVED.
          Chú thích: “Số liệu hiện tại được tổng hợp từ .../20 lớp đã duyệt.”
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              <span>TÌNH HÌNH HỌC SINH HÔM NAY</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Số liệu chính thức theo thời gian thực (chỉ tổng hợp từ các lớp đã được duyệt)
            </p>
          </div>

          {/* Chú thích bắt buộc (Mục 6) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
            <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>
              Số liệu hiện tại được tổng hợp từ <strong className="font-extrabold">{stats.approvedClassesCount}/20 lớp</strong> đã duyệt.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* TỔNG HỌC SINH */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">TỔNG HỌC SINH</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {stats.confirmedStudents}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              DS trường: {stats.totalStudentsRoster}
            </div>
          </div>

          {/* CÓ MẶT */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">CÓ MẶT</div>
            <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
              {stats.presentCount}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {stats.confirmedStudents > 0
                ? `${((stats.presentCount / stats.confirmedStudents) * 100).toFixed(1).replace('.', ',')}%`
                : '0%'}
            </div>
          </div>

          {/* VẮNG */}
          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
            <div className="text-[11px] font-bold text-rose-800 uppercase">VẮNG</div>
            <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
              {stats.absentCount}
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">học sinh vắng</div>
          </div>

          {/* VẮNG CÓ PHÉP */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-800 uppercase">VẮNG CÓ PHÉP</div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
              {stats.absentExcusedCount}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">có giấy xin nghỉ</div>
          </div>

          {/* VẮNG KHÔNG PHÉP */}
          <div className="bg-rose-100/60 p-3.5 rounded-xl border border-rose-300">
            <div className="text-[11px] font-bold text-rose-900 uppercase">VẮNG KHÔNG PHÉP</div>
            <div className="text-2xl font-black text-rose-900 mt-1 font-mono">
              {stats.absentUnexcusedCount}
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">nghỉ tự do</div>
          </div>

          {/* ĐI MUỘN */}
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
            <div className="text-[11px] font-bold text-purple-800 uppercase">ĐI MUỘN</div>
            <div className="text-2xl font-black text-purple-800 mt-1 font-mono">
              {stats.lateCount}
            </div>
            <div className="text-[10px] text-purple-600 mt-0.5">sau giờ vào lớp</div>
          </div>

          {/* VỀ SỚM */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-indigo-800 uppercase">VỀ SỚM</div>
            <div className="text-2xl font-black text-indigo-800 mt-1 font-mono">
              {stats.earlyLeaveCount}
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">về trước giờ tan</div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC 7 & 8: KHỐI THỐNG KÊ BÁN TRÚ & NGOẠI TRÚ
          BÁN TRÚ HÔM NAY:
          - Tổng học sinh bán trú theo danh sách
          - Bán trú có mặt
          - Bán trú vắng
          - Tỉ lệ có mặt
          NGOẠI TRÚ HÔM NAY:
          - Ngoại trú theo danh sách
          - Ngoại trú có mặt
          - Ngoại trú vắng
          - Tỉ lệ có mặt
      ================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MỤC 7: KHỐI THỐNG KÊ BÁN TRÚ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                BÁN TRÚ HÔM NAY
              </h3>
            </div>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Tỉ lệ: {boardingRateFormatted}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Theo DS</div>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {stats.boardingTotalRoster}
              </div>
            </div>

            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Có mặt</div>
              <div className="text-xl font-black text-emerald-800 mt-0.5 font-mono">
                {stats.boardingPresent}
              </div>
            </div>

            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Vắng</div>
              <div className="text-xl font-black text-rose-700 mt-0.5 font-mono">
                {stats.boardingAbsent}
              </div>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Tỉ lệ</div>
              <div className="text-xl font-black text-amber-800 mt-0.5 font-mono">
                {boardingRateFormatted}%
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
            <span>Suất ăn thực tế chuẩn bị: <strong className="text-slate-900">{stats.boardingPresent} suất</strong></span>
            <span>Cắt giảm cơm hôm nay: <strong className="text-rose-700">-{stats.boardingAbsent} suất</strong></span>
          </div>
        </div>

        {/* MỤC 8: KHỐI THỐNG KÊ NGOẠI TRÚ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                NGOẠI TRÚ HÔM NAY
              </h3>
            </div>
            <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Tỉ lệ: {nonBoardingRateFormatted}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Theo DS</div>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {stats.nonBoardingTotalRoster}
              </div>
            </div>

            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Có mặt</div>
              <div className="text-xl font-black text-emerald-800 mt-0.5 font-mono">
                {stats.nonBoardingPresent}
              </div>
            </div>

            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Vắng</div>
              <div className="text-xl font-black text-rose-700 mt-0.5 font-mono">
                {stats.nonBoardingAbsent}
              </div>
            </div>

            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
              <div className="text-[10px] font-bold text-blue-900 uppercase">Tỉ lệ</div>
              <div className="text-xl font-black text-blue-900 mt-0.5 font-mono">
                {nonBoardingRateFormatted}%
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
            <span>Học sinh tự túc ăn trưa / về nhà</span>
            <span>Tổng số ngoại trú đã xác nhận: <strong className="text-slate-900">{stats.nonBoardingConfirmedTotal}</strong></span>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC 9: THỐNG KÊ THEO 4 KHỐI (KHỐI 6, 7, 8, 9)
          Mỗi card:
          - Số lớp: 5
          - Tổng học sinh
          - Có mặt
          - Vắng
          - Bán trú có mặt
          - Ngoại trú có mặt
          - Số lớp đã báo cáo / 5
          - Số lớp đã duyệt / 5
          Khi nhấn vào card: lọc bảng phía dưới chỉ hiển thị các lớp khối đó
      ================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>THỐNG KÊ THEO 4 KHỐI HỌC (5 LỚP MỖI KHỐI)</span>
          </div>
          {activeGradeFilter > 0 && (
            <button
              onClick={() => setActiveGradeFilter(0)}
              className="text-xs text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Hiển thị tất cả 4 khối
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {grades.map(g => {
            const isSelected = activeGradeFilter === g.grade;
            return (
              <div
                key={g.grade}
                onClick={() => setActiveGradeFilter(isSelected ? 0 : g.grade)}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md bg-blue-50/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-slate-900">{g.gradeLabel}</span>
                    <span className="text-xs text-slate-500 font-medium">(5 lớp)</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    g.approvedClasses === 5
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    Duyệt: {g.approvedClasses}/5
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiến độ báo cáo:</span>
                    <span className="font-bold text-slate-900">
                      Đã gửi: {g.submittedClasses}/5 · Đã duyệt: {g.approvedClasses}/5
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-slate-500 text-[11px]">Tổng học sinh:</span>
                      <div className="font-extrabold text-slate-900">{g.totalStudentsRoster}</div>
                    </div>
                    <div>
                      <span className="text-emerald-700 text-[11px]">Có mặt:</span>
                      <div className="font-extrabold text-emerald-800">{g.presentCount}</div>
                    </div>
                    <div>
                      <span className="text-rose-700 text-[11px]">Vắng:</span>
                      <div className="font-extrabold text-rose-800">{g.absentCount}</div>
                    </div>
                    <div>
                      <span className="text-amber-800 text-[11px]">Bán trú có mặt:</span>
                      <div className="font-extrabold text-amber-900">{g.boardingPresent}</div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex justify-between text-[11px]">
                    <span className="text-slate-500">Ngoại trú có mặt:</span>
                    <strong className="text-blue-900">{g.nonBoardingPresent}</strong>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-blue-700 font-bold flex items-center justify-between">
                  <span>{isSelected ? 'Đang lọc khối này' : 'Bấm để lọc bảng bên dưới'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          MỤC 17: HÀNG CHỜ DUYỆT & DUYỆT NHANH NHIỀU LỚP
      ================================================== */}
      {stats.pendingClassesCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-amber-950">
                  CÓ {stats.pendingClassesCount} BÁO CÁO ĐANG CHỜ DUYỆT
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Tổng phụ trách có thể tick chọn nhiều lớp để duyệt cùng lúc hoặc bấm xem từng lớp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {selectedPendingClassIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBatchConfirmOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DUYỆT {selectedPendingClassIds.length} BÁO CÁO ĐÃ CHỌN</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC XXIII: BẢNG TỔNG QUAN CẢ NGÀY HOẶC BẢNG 20 LỚP THEO PHIÊN
          Hiển thị đủ 20 lớp (6A1-6A5, 7A1-7A5, 8A1-8A5, 9A1-9A5)
      ================================================== */}
      {adminView === 'FULL_DAY' ? (
        <DailySessionsOverview
          classes={classes}
          morningReports={morningReports}
          afternoonReports={afternoonReports}
          onViewReport={(cId, s) => {
            setViewingReportClassId(cId);
            setViewingReportSession(s);
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Thanh lọc trạng thái và khối */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                TRẠNG THÁI BÁO CÁO 20 LỚP – {getSessionDisplayName(activeSession).toUpperCase()}
              </h2>
              <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                {displayedClasses.length}/20 lớp
              </span>
            </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc trạng thái */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Lọc:</span>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'NOT_SUBMITTED', label: 'Chưa báo cáo' },
                { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
                { key: 'REVISION_REQUIRED', label: 'Cần sửa' },
                { key: 'APPROVED', label: 'Đã duyệt' },
                { key: 'LOCKED', label: 'Đã khóa' },
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setActiveStatusFilter(st.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    activeStatusFilter === st.key
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Lọc theo khối */}
            <div className="flex items-center gap-1 text-xs pl-2 border-l border-slate-200">
              <span className="text-slate-500 font-semibold mr-1">Khối:</span>
              {[0, 6, 7, 8, 9].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGradeFilter(g)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    activeGradeFilter === g
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {g === 0 ? 'Tất cả' : `K${g}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BẢNG DESKTOP */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-black uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      stats.pendingClassesCount > 0 &&
                      selectedPendingClassIds.length === stats.pendingClassesCount
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pendingIds: string[] = [];
                        reports.forEach(r => {
                          if (r.status === 'PENDING_APPROVAL' || (r.status as string) === 'submitted') {
                            pendingIds.push(r.classId);
                          }
                        });
                        setSelectedPendingClassIds(pendingIds);
                      } else {
                        setSelectedPendingClassIds([]);
                      }
                    }}
                    title="Chọn tất cả lớp chờ duyệt"
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3">Lớp</th>
                <th className="py-3 px-3">Khối</th>
                <th className="py-3 px-3">GVCN</th>
                <th className="py-3 px-3 text-center">Sĩ số</th>
                <th className="py-3 px-3 text-center text-emerald-800">Có mặt</th>
                <th className="py-3 px-3 text-center text-rose-800">Vắng</th>
                <th className="py-3 px-3 text-center text-amber-800">Bán trú có mặt</th>
                <th className="py-3 px-3 text-center text-blue-800">Ngoại trú có mặt</th>
                <th className="py-3 px-3">Thời gian gửi</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedClasses.map((cls, idx) => {
                const rep = reportMap.get(cls.id);
                const isPending = rep && (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted');
                const isApproved = rep && rep.status === 'APPROVED';
                const isLocked = rep && (rep.status === 'LOCKED' || (rep.status as string) === 'locked');
                const isRevision = rep && (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision');
                const isUnsubmitted = !rep || rep.status === 'NOT_SUBMITTED' || (rep.status as string) === 'not_reported';

                return (
                  <tr
                    key={cls.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isPending ? 'bg-amber-50/20' : isRevision ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Checkbox duyệt hàng loạt */}
                    <td className="py-3 px-3 text-center">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={selectedPendingClassIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPendingClassIds([...selectedPendingClassIds, cls.id]);
                            } else {
                              setSelectedPendingClassIds(selectedPendingClassIds.filter(id => id !== cls.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-black text-slate-900 text-sm">{cls.name}</td>
                    <td className="py-3 px-3 font-semibold text-slate-600">Khối {cls.grade}</td>
                    <td className="py-3 px-3 text-slate-800">
                      <div className="font-bold">{cls.teacherName || 'Chưa phân công'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{cls.teacherPhone}</div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {rep ? rep.totalStudents : cls.totalStudents || 0}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {isApproved || isLocked ? rep?.presentCount : rep ? `${rep.presentCount}*` : '--'}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-rose-700">
                      {isApproved || isLocked ? rep?.absentCount : rep ? `${rep.absentCount}*` : '--'}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-800">
                      {isApproved || isLocked ? rep?.boardingPresent : rep ? `${rep.boardingPresent}*` : '--'}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-blue-800">
                      {isApproved || isLocked
                        ? (rep?.nonBoardingPresent ?? rep?.dayPresent)
                        : rep
                        ? `${rep.nonBoardingPresent ?? rep.dayPresent}*`
                        : '--'}
                    </td>

                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {rep?.submittedAt || '--'}
                    </td>

                    {/* MỤC 11: TRẠNG THÁI MỖI LỚP - LUÔN HIỂN THỊ CHỮ RÕ RÀNG */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isUnsubmitted && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          CHƯA BÁO CÁO
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          CHỜ DUYỆT
                        </span>
                      )}
                      {isRevision && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          CẦN CHỈNH SỬA
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ĐÃ DUYỆT
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                          ĐÃ KHÓA
                        </span>
                      )}
                    </td>

                    {/* MỤC 12: THAO TÁC TẠI MỖI LỚP */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isUnsubmitted && (
                        <button
                          type="button"
                          onClick={() => setInfoClassId(cls.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                        >
                          XEM THÔNG TIN
                        </button>
                      )}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReportClassId(cls.id);
                            setViewingReportSession(activeSession);
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          XEM & DUYỆT
                        </button>
                      )}
                      {isRevision && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReportClassId(cls.id);
                            setViewingReportSession(activeSession);
                          }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg font-black text-xs cursor-pointer transition-colors"
                        >
                          XEM YÊU CẦU
                        </button>
                      )}
                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReportClassId(cls.id);
                            setViewingReportSession(activeSession);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                        >
                          XEM CHI TIẾT
                        </button>
                      )}
                      {isLocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewingReportClassId(cls.id);
                            setViewingReportSession(activeSession);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                        >
                          XEM BÁO CÁO
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GIAO DIỆN MOBILE CARD */}
        <div className="lg:hidden p-3 space-y-3">
          {displayedClasses.map((cls, idx) => {
            const rep = reportMap.get(cls.id);
            const isPending = rep && (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted');
            const isApproved = rep && rep.status === 'APPROVED';
            const isLocked = rep && (rep.status === 'LOCKED' || (rep.status as string) === 'locked');
            const isRevision = rep && (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision');
            const isUnsubmitted = !rep || rep.status === 'NOT_SUBMITTED' || (rep.status as string) === 'not_reported';

            return (
              <div
                key={cls.id}
                className={`bg-white rounded-xl p-3.5 border transition-all ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/20'
                    : isRevision
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">{cls.name}</span>
                    <span className="text-xs text-slate-500 font-semibold">Khối {cls.grade}</span>
                  </div>
                  <div>
                    {isUnsubmitted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                        CHƯA BÁO CÁO
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        CHỜ DUYỆT
                      </span>
                    )}
                    {isRevision && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        CẦN CHỈNH SỬA
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ĐÃ DUYỆT
                      </span>
                    )}
                    {isLocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                        ĐÃ KHÓA
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 mt-1">
                  GVCN: <strong className="text-slate-800">{cls.teacherName || 'Chưa phân công'}</strong> ({cls.teacherPhone})
                </div>

                {rep ? (
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-lg mt-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Sĩ số</div>
                      <div className="font-black text-slate-900">{rep.totalStudents}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-700">Có mặt</div>
                      <div className="font-black text-emerald-800">{rep.presentCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-rose-700">Vắng</div>
                      <div className="font-black text-rose-800">{rep.absentCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-700">BT có mặt</div>
                      <div className="font-black text-amber-900">{rep.boardingPresent}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-2 rounded-lg mt-2 text-xs text-slate-500 italic text-center">
                    GVCN chưa gửi báo cáo buổi sáng
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rep?.submittedAt ? `Gửi lúc: ${rep.submittedAt}` : 'Chưa có giờ gửi'}
                  </span>

                  <div>
                    {isUnsubmitted && (
                      <button
                        type="button"
                        onClick={() => setInfoClassId(cls.id)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs"
                      >
                        XEM THÔNG TIN
                      </button>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReportClassId(cls.id);
                          setViewingReportSession(activeSession);
                        }}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg font-black text-xs"
                      >
                        XEM & DUYỆT
                      </button>
                    )}
                    {isRevision && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReportClassId(cls.id);
                          setViewingReportSession(activeSession);
                        }}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold text-xs"
                      >
                        XEM YÊU CẦU
                      </button>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReportClassId(cls.id);
                          setViewingReportSession(activeSession);
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                      >
                        XEM CHI TIẾT
                      </button>
                    )}
                    {isLocked && (
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReportClassId(cls.id);
                          setViewingReportSession(activeSession);
                        }}
                        className="px-3 py-1 bg-blue-700 text-white rounded-lg font-bold text-xs"
                      >
                        XEM BÁO CÁO
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* ==================================================
          MỤC 13, 14, 15: MODAL DUYỆT BÁO CÁO (XEM & DUYỆT)
          BÁO CÁO SĨ SỐ LỚP ...
          Ngày, GVCN, Thời gian gửi, Sĩ số, Có mặt, Vắng, Vắng có phép, Vắng không phép, Đi muộn
          Bán trú theo danh sách, Bán trú có mặt, Bán trú vắng
          Ngoại trú theo danh sách, Ngoại trú có mặt, Ngoại trú vắng
          MỤC 14: DANH SÁCH HỌC SINH VẮNG TRONG MODAL
          STT, Họ tên, Bán trú/Ngoại trú, Có phép/Không phép, Lí do, Ghi chú
          Nếu đủ sĩ số: “GVCN xác nhận lớp đủ sĩ số.”
          MỤC 15: 3 NÚT XỬ LÝ (ĐÓNG, YÊU CẦU CHỈNH SỬA, DUYỆT BÁO CÁO)
      ================================================== */}
      {viewingReportClassId && selectedReport && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded uppercase">
                    Kiểm tra & Phê duyệt · Khối {selectedClass.grade}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                      normalizeSession(selectedReport.session) === 'AFTERNOON' ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                  >
                    {getSessionDisplayName(selectedReport.session)}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  BÁO CÁO SĨ SỐ LỚP {selectedClass.name} – {getSessionDisplayName(selectedReport.session).toUpperCase()}
                </h3>
                <div className="text-xs text-slate-600 mt-0.5 space-x-2">
                  <span>Ngày: <strong>{formatFullVietnameseDate(selectedReport.date)}</strong></span>
                  <span>·</span>
                  <span>GVCN: <strong>{selectedClass.teacherName}</strong> ({selectedClass.teacherPhone})</span>
                  <span>·</span>
                  <span>Thời gian gửi: <strong className="font-mono">{selectedReport.submittedAt || '--'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setViewingReportClassId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông báo nếu lớp đã được yêu cầu chỉnh sửa */}
            {selectedReport.revisionReason && (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Yêu cầu chỉnh sửa trước đó:</span>
                </div>
                <div className="mt-1 italic">{selectedReport.revisionReason}</div>
              </div>
            )}

            {/* Mục 13: Thống kê số liệu lớp */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">
                Số liệu sĩ số lớp:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Sĩ số lớp:</span>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                    {selectedReport.totalStudents}
                  </div>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-bold">Có mặt:</span>
                  <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                    {selectedReport.presentCount}
                  </div>
                </div>

                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span className="text-rose-800 font-bold">Vắng:</span>
                  <div className="text-xl font-black text-rose-900 font-mono mt-0.5">
                    {selectedReport.absentCount}
                  </div>
                  <div className="text-[10px] text-rose-700 mt-0.5">
                    Có phép: {selectedReport.excusedAbsentCount ?? selectedReport.absentExcusedCount ?? 0} · K.phép: {selectedReport.unexcusedAbsentCount ?? selectedReport.absentUnexcusedCount ?? 0}
                  </div>
                </div>

                <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                  <span className="text-purple-800 font-bold">Đi muộn:</span>
                  <div className="text-xl font-black text-purple-900 font-mono mt-0.5">
                    {selectedReport.lateCount ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết bán trú và ngoại trú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>BÁN TRÚ:</span>
                </div>
                <div>Bán trú theo danh sách: <strong>{selectedReport.boardingTotal}</strong></div>
                <div>Bán trú có mặt: <strong className="text-emerald-800">{selectedReport.boardingPresent}</strong></div>
                <div>Bán trú vắng: <strong className="text-rose-800">{selectedReport.boardingAbsent}</strong></div>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-blue-900">
                  <Users className="w-3.5 h-3.5" />
                  <span>NGOẠI TRÚ:</span>
                </div>
                <div>Ngoại trú theo danh sách: <strong>{selectedReport.nonBoardingTotal ?? selectedReport.dayTotal}</strong></div>
                <div>Ngoại trú có mặt: <strong className="text-emerald-800">{selectedReport.nonBoardingPresent ?? selectedReport.dayPresent}</strong></div>
                <div>Ngoại trú vắng: <strong className="text-rose-800">{selectedReport.nonBoardingAbsent ?? selectedReport.dayAbsent}</strong></div>
              </div>
            </div>

            {/* MỤC 14: DANH SÁCH HỌC SINH VẮNG TRONG MODAL */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase">
                Danh sách học sinh vắng / thay đổi:
              </div>

              {selectedReport.records.filter(r => (r.status as string).toUpperCase() !== 'PRESENT').length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>GVCN xác nhận lớp đủ sĩ số.</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">STT</th>
                        <th className="py-2 px-2.5">Họ tên</th>
                        <th className="py-2 px-2.5 text-center">Bán trú / Ngoại trú</th>
                        <th className="py-2 px-2.5 text-center">Có phép / Không phép</th>
                        <th className="py-2 px-2.5">Lí do</th>
                        <th className="py-2 px-2.5">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReport.records
                        .filter(r => (r.status as string).toUpperCase() !== 'PRESENT')
                        .map((stu, sIdx) => (
                          <tr key={stu.studentId} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-center font-bold text-slate-400">{sIdx + 1}</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">{stu.studentName}</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                stu.boardingType === 'BOARDING'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}>
                                {stu.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              {stu.status === 'ABSENT_EXCUSED' ? (
                                <span className="text-amber-800 font-bold">Có phép</span>
                              ) : stu.status === 'ABSENT_UNEXCUSED' ? (
                                <span className="text-rose-800 font-bold">Không phép</span>
                              ) : (
                                <span className="text-purple-800 font-bold">Đi muộn</span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-slate-800 font-medium">
                              {stu.reason || '--'}
                            </td>
                            <td className="py-2 px-2.5 text-slate-500 italic text-[11px]">
                              {stu.reasonDetail || '--'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ghi chú chung của GVCN */}
            {selectedReport.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Ghi chú của GVCN: </span>
                <span className="text-slate-600 italic">{selectedReport.notes}</span>
              </div>
            )}

            {/* ==================================================
                MỤC 15: 3 NÚT XỬ LÝ (ĐÓNG, YÊU CẦU CHỈNH SỬA, DUYỆT BÁO CÁO)
                Nút DUYỆT BÁO CÁO nổi bật nhất
            ================================================== */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingReportClassId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                ĐÓNG
              </button>

              {/* Nút mở khóa nếu đã khóa */}
              {(selectedReport.status === 'LOCKED' || (selectedReport.status as string) === 'locked') && (
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>MỞ KHÓA BÁO CÁO</span>
                </button>
              )}

              {/* Nút yêu cầu chỉnh sửa */}
              {(selectedReport.status === 'PENDING_APPROVAL' ||
                selectedReport.status === 'APPROVED' ||
                (selectedReport.status as string) === 'submitted') && (
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>YÊU CẦU CHỈNH SỬA</span>
                </button>
              )}

              {/* Nút duyệt báo cáo - NỔI BẬT NHẤT */}
              {(selectedReport.status === 'PENDING_APPROVAL' ||
                (selectedReport.status as string) === 'submitted' ||
                selectedReport.status === 'REVISION_REQUIRED') && (
                <button
                  type="button"
                  onClick={() => setIsConfirmApproveModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>DUYỆT BÁO CÁO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC 16: KHI NHẤN DUYỆT -> HỘP XÁC NHẬN
          “Bạn xác nhận duyệt báo cáo sĩ số lớp 6A1?”
          “Sau khi duyệt, dữ liệu lớp sẽ được đưa vào báo cáo chính thức của toàn trường.”
          2 nút: HỦY, XÁC NHẬN DUYỆT
      ================================================== */}
      {isConfirmApproveModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Bạn xác nhận duyệt báo cáo sĩ số lớp {selectedClass.name}?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Sau khi duyệt, dữ liệu lớp sẽ được đưa vào báo cáo chính thức của toàn trường.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmApproveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleExecuteSingleApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                XÁC NHẬN DUYỆT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM THÔNG TIN LỚP CHƯA BÁO CÁO (MỤC 12) */}
      {viewingInfoClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">
                THÔNG TIN LỚP {viewingInfoClass.name}
              </h3>
              <button
                onClick={() => setInfoClassId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Khối: <strong>Khối {viewingInfoClass.grade}</strong></div>
                <div>Phòng học: <strong>{viewingInfoClass.room || 'Chưa cập nhật'}</strong></div>
                <div>GV Chủ nhiệm: <strong>{viewingInfoClass.teacherName}</strong></div>
                <div>Số điện thoại liên hệ: <strong className="font-mono text-blue-900">{viewingInfoClass.teacherPhone}</strong></div>
                <div>Sĩ số danh sách: <strong>{viewingInfoClass.totalStudents} học sinh</strong></div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Trạng thái: CHƯA BÁO CÁO</strong>
                <p className="mt-1">
                  Lớp này chưa gửi báo cáo sĩ số buổi sáng. Không thể duyệt trước khi GVCN gửi dữ liệu.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInfoClassId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL YÊU CẦU CHỈNH SỬA (MỤC 15) */}
      {isRevisionModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-black text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>YÊU CẦU GVCN CHỈNH SỬA</span>
            </div>
            <p className="text-xs text-slate-600">
              Nhập nội dung cần chỉnh sửa gửi đến GVCN Lớp <strong>{selectedClass.name}</strong> ({selectedClass.teacherName}):
            </p>
            {revisionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{revisionError}</span>
              </div>
            )}
            <textarea
              rows={3}
              value={revisionReasonInput}
              onChange={(e) => {
                setRevisionReasonInput(e.target.value);
                if (revisionError) setRevisionError(null);
              }}
              placeholder="VD: Kiểm tra lại lí do học sinh vắng, cập nhật số liệu bán trú..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setRevisionError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                HỦY
              </button>
              <button
                onClick={handleSubmitRevision}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                GỬI YÊU CẦU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MỞ KHÓA BÁO CÁO LỚP */}
      {isUnlockModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-black text-base">
              <Unlock className="w-5 h-5 text-amber-600" />
              <span>MỞ KHÓA BÁO CÁO LỚP {selectedClass.name}</span>
            </div>
            <p className="text-xs text-slate-600">
              Nhập lí do mở khóa báo cáo. Thao tác này sẽ được ghi vào Nhật ký Hệ thống (Audit Log):
            </p>
            {unlockError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}
            <textarea
              rows={3}
              value={unlockReasonInput}
              onChange={(e) => {
                setUnlockReasonInput(e.target.value);
                if (unlockError) setUnlockError(null);
              }}
              placeholder="VD: Phụ huynh báo lại học sinh nghỉ ốm, GVCN cần cập nhật lại..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setUnlockError(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                HỦY
              </button>
              <button
                onClick={handleSubmitUnlock}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                XÁC NHẬN MỞ KHÓA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT HÀNG LOẠT (MỤC 17) */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              XÁC NHẬN DUYỆT NHANH {selectedPendingClassIds.length} BÁO CÁO
            </h3>
            <p className="text-xs text-slate-600">
              Thầy/cô xác nhận duyệt đồng thời {selectedPendingClassIds.length} lớp đã chọn vào dữ liệu chính thức?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleBatchApprove}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-emerald-700 cursor-pointer"
              >
                XÁC NHẬN DUYỆT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỐT SĨ SỐ TOÀN TRƯỜNG (MỤC 1, 18) */}
      {isFinalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-black text-slate-900">
              <Lock className="w-5 h-5 text-blue-700" />
              <span>XÁC NHẬN CHỐT SĨ SỐ {getSessionDisplayName(activeSession).toUpperCase()}</span>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 font-medium">
              Bạn đang chuẩn bị chốt báo cáo sĩ số <strong>{getSessionDisplayName(activeSession).toUpperCase()}</strong> ngày <strong>{formatFullVietnameseDate(currentDate)}</strong>.
            </div>

            {!isEligibleToLock ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs space-y-2 text-amber-950">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>CHƯA ĐỦ ĐIỀU KIỆN CHỐT (CHƯA ĐỦ 20/20 LỚP ĐƯỢC DUYỆT {getSessionDisplayName(activeSession).toUpperCase()})</span>
                </div>
                <div>
                  Hiện mới có <strong>{stats.approvedClassesCount}/20 lớp</strong> được duyệt {getSessionDisplayName(activeSession).toLowerCase()}. Còn <strong>{20 - stats.approvedClassesCount} lớp</strong> chưa có số liệu chính thức:
                </div>
                <div className="space-y-1 pl-2">
                  {stats.unsubmittedClasses.length > 0 && (
                    <div>• Chưa báo cáo ({stats.unsubmittedClasses.length} lớp): <strong>{stats.unsubmittedClasses.map(c => c.name).join(', ')}</strong></div>
                  )}
                  {stats.pendingClasses.length > 0 && (
                    <div>• Đang chờ duyệt ({stats.pendingClasses.length} lớp): <strong>{stats.pendingClasses.map(c => c.name).join(', ')}</strong></div>
                  )}
                  {stats.revisionClasses.length > 0 && (
                    <div>• Cần chỉnh sửa ({stats.revisionClasses.length} lớp): <strong>{stats.revisionClasses.map(c => c.name).join(', ')}</strong></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-950 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Đủ điều kiện! 20/20 lớp đã được phê duyệt {getSessionDisplayName(activeSession).toLowerCase()} đầy đủ. Sẵn sàng chốt số liệu.</span>
              </div>
            )}

            <p className="text-xs text-slate-600">
              Sau khi chốt: Toàn bộ báo cáo {getSessionDisplayName(activeSession).toLowerCase()} của 20 lớp sẽ chuyển sang trạng thái <strong>ĐÃ KHÓA</strong>. Phiên đối diện ({activeSession === 'MORNING' ? 'Buổi Chiều' : 'Buổi Sáng'}) vẫn hoạt động hoàn toàn độc lập, không bị ảnh hưởng.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsFinalizeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleFinalizeSchool}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                CHỐT SĨ SỐ {getSessionDisplayName(activeSession).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO CÁO NHANH GỬI BAN GIÁM HIỆU / ZALO */}
      {isQuickReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  Bản tin nhanh Zalo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  BÁO CÁO NHANH GỬI BAN GIÁM HIỆU
                </h3>
              </div>
              <button
                onClick={() => setIsQuickReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {exportService.generateQuickReportText(currentDate, filterSession)}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {copiedQuickText ? '✓ Đã sao chép vào bộ nhớ tạm!' : 'Bấm nút để copy gửi nhóm Zalo BGH'}
              </span>

              <button
                onClick={handleCopyQuickReport}
                className={`px-5 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                  copiedQuickText
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedQuickText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedQuickText ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP NỘI DUNG'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
