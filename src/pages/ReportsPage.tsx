import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { dailyReportService } from '../services/dailyReportService';
import { excelExportService } from '../../src/services/excelExportService';
import { pdfExportService } from '../../src/services/pdfExportService';
import { printService } from '../../src/services/printService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';
import { SessionType } from '../types';

// Sub-components
import { AttendanceCharts } from '../components/reports/AttendanceCharts';
import { PrintPreviewModal } from '../components/reports/PrintPreviewModal';
import { AbsentStudentReport } from '../components/reports/AbsentStudentReport';
import { WeeklyAttendanceReportView } from '../components/reports/WeeklyAttendanceReportView';
import { MonthlyAttendanceReportView } from '../components/reports/MonthlyAttendanceReportView';
import { SemesterAttendanceReportView } from '../components/reports/SemesterAttendanceReportView';
import { ClassAttendanceReportView } from '../components/reports/ClassAttendanceReportView';
import { GradeAttendanceReportView } from '../components/reports/GradeAttendanceReportView';
import { BoardingReportView } from '../components/reports/BoardingReportView';
import { StudentAttendanceProfileTab } from '../components/reports/StudentAttendanceProfileTab';
import { TeacherSubmissionReportView } from '../components/reports/TeacherSubmissionReportView';
import { ReportArchiveView } from '../components/reports/ReportArchiveView';
import { DataHealthCheckView } from '../components/reports/DataHealthCheckView';

import {
  FileSpreadsheet,
  FileDown,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Calendar,
  Building2,
  UtensilsCrossed,
  Users,
  UserX,
  TrendingUp,
  BarChart3,
  Archive,
  ShieldCheck,
  ArrowRight,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../theme/designSystem';

export type ReportSubTab =
  | 'TODAY'
  | 'BY_DATE'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'SEMESTER'
  | 'SCHOOL_YEAR'
  | 'BY_CLASS'
  | 'BY_GRADE'
  | 'BOARDING'
  | 'NON_BOARDING'
  | 'ABSENT'
  | 'STUDENT_PROFILE'
  | 'TEACHER_PROGRESS'
  | 'ARCHIVE'
  | 'DATA_HEALTH';

interface ReportsPageProps {
  currentDate: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ currentDate }) => {
  const { currentUser, isAdmin } = useAuth();
  const settings = storageService.getSettings();

  const [activeTab, setActiveTab] = useState<ReportSubTab>('TODAY');
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [selectedSession, setSelectedSession] = useState<SessionType>('MORNING');
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'OVERVIEW' | 'CLASSES' | 'ABSENT' | 'BOARDING'>('OVERVIEW');
  const [unlockReasonInput, setUnlockReasonInput] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<string | null>(null);

  const dailyReportContainerRef = useRef<HTMLDivElement>(null);

  // Permission checks (Mục LXVI, LXVII)
  const canExportSchool =
    isAdmin ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'BOARD_OF_MANAGEMENT' ||
    !!currentUser?.permissions?.canExportSchoolReports ||
    !!currentUser?.permissions?.canExportReports;

  const canExportClass =
    canExportSchool || !!currentUser?.permissions?.canExportClassReports;

  // Real data for Daily report
  const dailyData = useMemo(() => {
    return dailyReportService.getDailyAttendanceReport(selectedDate, selectedSession);
  }, [selectedDate, selectedSession]);

  // Comparison with previous day (Mục LXXIII)
  const dayComparison = useMemo(() => {
    return dailyReportService.compareWithPreviousDay(selectedDate, selectedSession);
  }, [selectedDate, selectedSession]);

  // Classes list
  const classes = useMemo(() => storageService.getClasses(), []);

  // Trend data for line chart (past 7 days)
  const trendData = useMemo(() => {
    const list = [];
    const cur = new Date(selectedDate);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(cur);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dtStr = `${y}-${m}-${day}`;

      const rep = dailyReportService.getDailyAttendanceReport(dtStr, selectedSession);
      list.push({
        date: dtStr,
        dayLabel: dayNames[d.getDay()],
        present: rep.presentCount,
        absent: rep.absentCount,
        total: rep.confirmedStudents,
        rate: rep.attendanceRate,
      });
    }
    return list;
  }, [selectedDate, selectedSession]);

  // Copy Quick Report Text (Mục XII)
  const handleCopyQuick = () => {
    const text = dailyReportService.generateQuickReportText(selectedDate, selectedSession);
    navigator.clipboard.writeText(text);
    setCopiedQuick(true);
    setTimeout(() => setCopiedQuick(false), 2500);
  };

  // Export Excel (Mục XXXV - XLIII)
  const handleExportDailyExcel = async () => {
    if (!canExportSchool) {
      setExportErrorMessage('Bạn không có quyền xuất báo cáo cấp trường.');
      return;
    }
    setIsExportingExcel(true);
    setExportErrorMessage(null);
    try {
      const ok = excelExportService.exportDailyReportExcel(
        selectedDate,
        selectedSession,
        currentUser?.id,
        currentUser?.name
      );
      if (!ok) {
        setExportErrorMessage('Không thể tạo file báo cáo. Vui lòng thử lại.');
      }
    } catch {
      setExportErrorMessage('Không thể tạo file báo cáo. Vui lòng thử lại.');
    } finally {
      setTimeout(() => setIsExportingExcel(false), 600);
    }
  };

  // Export PDF (Mục XLV - LI, LXXXIII)
  const handleExportDailyPdf = async () => {
    if (!canExportSchool) {
      setExportErrorMessage('Bạn không có quyền xuất báo cáo cấp trường.');
      return;
    }
    if (!dailyReportContainerRef.current) return;

    setIsExportingPdf(true);
    setExportErrorMessage(null);
    const prefix = dailyData.isOfficial ? 'Bao_cao_si_so_THCS_Ban_Bo' : 'Bao_cao_si_so_SO_BO_THCS_Ban_Bo';
    const filename = `${prefix}_${selectedDate}.pdf`;

    try {
      const ok = await pdfExportService.exportElementToPdf(
        dailyReportContainerRef.current,
        filename,
        'portrait',
        currentUser?.name
      );
      if (!ok) {
        setExportErrorMessage('Không thể tạo file báo cáo. Vui lòng thử lại.');
      }
    } catch {
      setExportErrorMessage('Không thể tạo file báo cáo. Vui lòng thử lại.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Finalize Daily Report (Mục LVIII, LXI)
  const handleFinalizeReport = () => {
    if (!isAdmin) {
      setExportErrorMessage('Chỉ Quản trị viên / Tổng Phụ trách Đội mới có quyền chốt khóa báo cáo sĩ số.');
      return;
    }
    setIsConfirmFinalizeOpen(true);
  };

  const executeFinalizeReport = () => {
    dailyReportService.finalizeDailyReport(
      selectedDate,
      selectedSession,
      currentUser?.name || settings.adminName,
      currentUser?.title || settings.adminTitle
    );
    setIsConfirmFinalizeOpen(false);
  };

  // Unlock Daily Report (Mục LVIII, CXII)
  const handleConfirmUnlock = () => {
    setUnlockError(null);
    if (!unlockReasonInput.trim()) {
      setUnlockError('Vui lòng nhập lý do mở khóa báo cáo.');
      return;
    }

    dailyReportService.unlockDailyReport(
      selectedDate,
      selectedSession,
      currentUser?.name || settings.adminName,
      unlockReasonInput.trim()
    );

    setShowUnlockModal(false);
    setUnlockReasonInput('');
  };

  // Navigation tabs list (Mục IV)
  const tabsList: Array<{ id: ReportSubTab; label: string; adminOnly?: boolean }> = [
    { id: 'TODAY', label: 'HÔM NAY' },
    { id: 'BY_DATE', label: 'THEO NGÀY' },
    { id: 'WEEKLY', label: 'THEO TUẦN' },
    { id: 'MONTHLY', label: 'THEO THÁNG' },
    { id: 'SEMESTER', label: 'THEO HỌC KỲ' },
    { id: 'SCHOOL_YEAR', label: 'THEO NĂM HỌC' },
    { id: 'BY_CLASS', label: 'THEO LỚP' },
    { id: 'BY_GRADE', label: 'THEO KHỐI' },
    { id: 'BOARDING', label: 'BÁN TRÚ' },
    { id: 'NON_BOARDING', label: 'NGOẠI TRÚ' },
    { id: 'ABSENT', label: 'HỌC SINH VẮNG' },
    { id: 'STUDENT_PROFILE', label: 'CHUYÊN CẦN' },
    { id: 'TEACHER_PROGRESS', label: 'TIẾN ĐỘ GVCN' },
    { id: 'ARCHIVE', label: 'KHO BÁO CÁO' },
    { id: 'DATA_HEALTH', label: 'KIỂM TRA DỮ LIỆU', adminOnly: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* 1. Header & Main Title */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            {settings.schoolName} · Năm học {settings.schoolYear}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            HỆ THỐNG BÁO CÁO – THỐNG KÊ – XUẤT HỒ SƠ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị: <strong>{settings.adminName}</strong> ({settings.adminTitle}) · Bản Bo, Tam Đường, Lai Châu
          </p>
        </div>

        {/* Global Action Buttons for Current Daily Report */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleCopyQuick}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            title="Sao chép báo cáo gửi Zalo / Ban Giám hiệu"
          >
            {copiedQuick ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedQuick ? 'Đã sao chép' : 'Sao chép nhanh BGH'}</span>
          </button>

          {canExportSchool && (
            <button
              onClick={handleExportDailyExcel}
              disabled={isExportingExcel}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                isExportingExcel
                  ? 'bg-emerald-400 text-white cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Xuất Excel 6 sheets chuẩn theo quy định"
            >
              {isExportingExcel ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>ĐANG TẠO FILE...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất Excel 6 sheets</span>
                </>
              )}
            </button>
          )}

          {canExportSchool && (
            <button
              onClick={handleExportDailyPdf}
              disabled={isExportingPdf}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                isExportingPdf
                  ? 'bg-rose-400 text-white cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
              title="Xuất PDF thật hỗ trợ đầy đủ tiếng Việt"
            >
              {isExportingPdf ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>ĐANG TẠO FILE...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Xuất PDF</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Xem trước và In A4"
          >
            <Eye className="w-4 h-4" />
            <span>Xem bản in / In A4</span>
          </button>
        </div>
      </div>

      {/* Error message banner if export failed */}
      {exportErrorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs font-bold text-center">
          {exportErrorMessage}
        </div>
      )}

      {/* 2. Main Navigation Bar with 14 Groups (Mục IV) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs print:hidden overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabsList.map(tab => {
            if (tab.adminOnly && !isAdmin) return null;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'TODAY') {
                    setSelectedDate(getTodayDateString());
                  }
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          CONTENT AREA PER TAB
          ========================================================================= */}

      {/* TAB 1 & 2: HÔM NAY / THEO NGÀY (Mục VI - XIII) */}
      {(activeTab === 'TODAY' || activeTab === 'BY_DATE') && (
        <div className="space-y-4">
          {/* Date Picker & Status Banner (Mục LV, LVII) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-500">Ngày:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                />
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
                dailyData.isOfficial
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {dailyData.isOfficial ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>BÁO CÁO CHÍNH THỨC (v{dailyData.reportVersion})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>BÁO CÁO SƠ BỘ ({dailyData.approvedClasses}/{dailyData.totalClasses} LỚP ĐÃ DUYỆT)</span>
                  </>
                )}
              </div>
            </div>

            {/* Lock / Unlock actions for Admin */}
            {isAdmin && (
              <div className="flex items-center gap-2 text-xs">
                {dailyData.isOfficialLocked ? (
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở khóa hiệu chỉnh</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinalizeReport}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Chốt khóa báo cáo ngày</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Ban Giám hiệu text preview box */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="font-mono text-xs whitespace-pre-line leading-relaxed">
              {dailyReportService.generateQuickReportText(selectedDate, selectedSession)}
            </div>
            <div className="shrink-0 flex md:flex-col gap-2">
              <button
                onClick={handleCopyQuick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                {copiedQuick ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedQuick ? 'Đã sao chép!' : 'Sao chép Zalo BGH'}</span>
              </button>
            </div>
          </div>

          {/* KPI Cards (Mục LXXV, LXXVI) with Click actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng số HS</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{dailyData.totalStudentsRoster}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">theo danh sách chính thức</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Có mặt hôm nay</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">{dailyData.presentCount}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Tỉ lệ: {dailyData.attendanceRate.toFixed(1)}%</div>
            </div>

            {/* Click Vắng -> chuyển sang tab Học sinh vắng */}
            <div
              onClick={() => setActiveTab('ABSENT')}
              className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20 hover:border-rose-400 cursor-pointer transition-all hover:shadow-md"
              title="Nhấn để xem danh sách chi tiết học sinh vắng"
            >
              <div className="text-[11px] font-bold text-rose-800 uppercase flex items-center justify-between">
                <span>Vắng hôm nay</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-950 mt-1">{dailyData.absentCount}</div>
              <div className="text-[10px] text-rose-700 mt-0.5">Phép: {dailyData.excusedAbsentCount} · K.Phép: {dailyData.unexcusedAbsentCount}</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
              <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
              <div className="text-2xl font-black text-purple-950 mt-1">{dailyData.lateCount}</div>
              <div className="text-[10px] text-purple-700 mt-0.5">Về sớm: {dailyData.earlyLeaveCount}</div>
            </div>

            {/* Click Bán trú -> chuyển sang tab Bán trú */}
            <div
              onClick={() => setActiveTab('BOARDING')}
              className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs bg-amber-50/20 hover:border-amber-400 cursor-pointer transition-all hover:shadow-md"
              title="Nhấn để xem báo cáo bán trú"
            >
              <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center justify-between">
                <span>Bán trú có mặt</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {dailyData.boardingPresent}/{dailyData.boardingTotalRoster}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">Vắng: {dailyData.boardingAbsent} HS</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs">
              <div className="text-[11px] font-bold text-blue-800 uppercase">Tiến độ duyệt</div>
              <div className="text-2xl font-black text-blue-950 mt-1">
                {dailyData.approvedClasses}/{dailyData.totalClasses}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">lớp hoàn thành</div>
            </div>
          </div>

          {/* Day-over-Day Comparison Box (Mục LXXIII) */}
          {dayComparison && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
              <div className="font-bold text-slate-700 uppercase">
                So sánh với ngày học trước ({dayComparison.previousDate}):
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-slate-500">Có mặt:</span>{' '}
                  <strong className="text-slate-900">{dayComparison.currentPresent}</strong> vs {dayComparison.previousPresent}{' '}
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    dayComparison.presentDiff >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {dayComparison.presentDiff >= 0 ? `+${dayComparison.presentDiff}` : dayComparison.presentDiff} HS
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Vắng:</span>{' '}
                  <strong className="text-slate-900">{dayComparison.currentAbsent}</strong> vs {dayComparison.previousAbsent}{' '}
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    dayComparison.absentDiff <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {dayComparison.absentDiff > 0 ? `+${dayComparison.absentDiff}` : dayComparison.absentDiff} HS
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Charts (Mục XXXI - XXXIV) */}
          <AttendanceCharts
            trendData={trendData}
            gradeData={dailyData.gradeGroups}
            presentCount={dailyData.presentCount}
            absentCount={dailyData.absentCount}
            boardingPresent={dailyData.boardingPresent}
            boardingAbsent={dailyData.boardingAbsent}
          />

          {/* Mobile switcher pills (Mục XCIII) */}
          <div className="sm:hidden flex items-center gap-1 bg-slate-200 p-1 rounded-xl text-xs font-bold print:hidden">
            <button
              onClick={() => setMobileViewMode('OVERVIEW')}
              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer ${
                mobileViewMode === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Khối 6–9
            </button>
            <button
              onClick={() => setMobileViewMode('CLASSES')}
              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer ${
                mobileViewMode === 'CLASSES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              20 Lớp
            </button>
            <button
              onClick={() => setMobileViewMode('ABSENT')}
              className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer ${
                mobileViewMode === 'ABSENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              HS Vắng ({dailyData.absentRecords.length})
            </button>
          </div>

          {/* Wrapper for printable / PDF capture content */}
          <div ref={dailyReportContainerRef} className="space-y-4">
            {/* Phân nhóm theo khối 6 - 9 (Mục X) */}
            <div className={`${mobileViewMode !== 'OVERVIEW' ? 'hidden sm:block' : ''} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden`}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase">
                  TỔNG HỢP THEO 4 KHỐI (KHỐI 6, 7, 8, 9)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                      <th className="p-3">Khối</th>
                      <th className="p-3 text-center">Số lớp</th>
                      <th className="p-3 text-center">Tổng HS</th>
                      <th className="p-3 text-center">Có mặt</th>
                      <th className="p-3 text-center">Vắng</th>
                      <th className="p-3 text-center">Bán trú</th>
                      <th className="p-3 text-center">Ngoại trú</th>
                      <th className="p-3 text-center">Tỉ lệ chuyên cần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyData.gradeGroups.map(g => (
                      <tr key={g.grade} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{g.gradeLabel}</td>
                        <td className="p-3 text-center text-slate-600">{g.totalClassesCount} lớp</td>
                        <td className="p-3 text-center font-medium">{g.totalStudents}</td>
                        <td className="p-3 text-center font-bold text-emerald-800">{g.presentCount}</td>
                        <td className="p-3 text-center font-bold text-rose-800">{g.absentCount}</td>
                        <td className="p-3 text-center text-slate-700">{g.boardingPresent}/{g.boardingTotal}</td>
                        <td className="p-3 text-center text-slate-700">{g.nonBoardingPresent}/{g.nonBoardingTotal}</td>
                        <td className="p-3 text-center font-extrabold text-blue-900">{g.attendanceRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BẢNG 20 LỚP CHI TIẾT (Mục IX, XCIV) */}
            <div className={`${mobileViewMode !== 'CLASSES' ? 'hidden sm:block' : ''} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden`}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase">
                  BẢNG CHI TIẾT SĨ SỐ 20 LỚP (TRƯỜNG THCS BẢN BO)
                </h4>
                <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                  Đã duyệt: {dailyData.approvedClasses}/20 lớp
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                      <th className="p-3 w-10 text-center">STT</th>
                      <th className="p-3">Lớp</th>
                      <th className="p-3">Khối</th>
                      <th className="p-3">GVCN</th>
                      <th className="p-3 text-center">Sĩ số</th>
                      <th className="p-3 text-center">Có mặt</th>
                      <th className="p-3 text-center">Vắng</th>
                      <th className="p-3 text-center">Có phép</th>
                      <th className="p-3 text-center">Không phép</th>
                      <th className="p-3 text-center">Đi muộn</th>
                      <th className="p-3 text-center">Bán trú có mặt</th>
                      <th className="p-3 text-center">Ngoại trú có mặt</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyData.classRows.map(c => (
                      <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{c.stt}</td>
                        <td className="p-3 font-bold text-slate-900">{c.className}</td>
                        <td className="p-3 text-slate-600">Khối {c.grade}</td>
                        <td className="p-3 text-slate-800 font-medium">{c.teacherName}</td>
                        <td className="p-3 text-center font-medium">{c.totalStudents}</td>
                        <td className="p-3 text-center font-bold text-emerald-800">{c.presentCount}</td>
                        <td className="p-3 text-center font-bold text-rose-800">{c.absentCount}</td>
                        <td className="p-3 text-center text-slate-700">{c.excusedAbsentCount}</td>
                        <td className="p-3 text-center text-slate-700">{c.unexcusedAbsentCount}</td>
                        <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                        <td className="p-3 text-center text-slate-700">{c.boardingPresent}/{c.boardingTotal}</td>
                        <td className="p-3 text-center text-slate-700">{c.nonBoardingPresent}/{c.nonBoardingTotal}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'REVISION_REQUIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danh sách học sinh vắng trong ngày (Mục XI) */}
            <div className={`${mobileViewMode !== 'ABSENT' ? 'hidden sm:block' : ''} bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden`}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase">
                  DANH SÁCH HỌC SINH VẮNG HÔM NAY ({dailyData.absentRecords.length} HỌC SINH)
                </h4>
                <button
                  onClick={() => setActiveTab('ABSENT')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <span>Xem đầy đủ & bộ lọc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {dailyData.absentRecords.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic">
                  Không có học sinh vắng trong các lớp đã được phê duyệt hôm nay.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                        <th className="p-3 w-10 text-center">STT</th>
                        <th className="p-3">Họ và tên</th>
                        <th className="p-3 text-center">Lớp</th>
                        <th className="p-3 text-center">Khối</th>
                        <th className="p-3 text-center">Diện</th>
                        <th className="p-3 text-center">Phân loại vắng</th>
                        <th className="p-3">Lí do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyData.absentRecords.slice(0, 15).map((r, idx) => (
                        <tr
                          key={idx}
                          onClick={() => {
                            setSelectedStudentForProfile(r.studentId);
                            setActiveTab('STUDENT_PROFILE');
                          }}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{r.studentName}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{r.className}</td>
                          <td className="p-3 text-center text-slate-600">Khối {r.grade}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {r.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'ABSENT_EXCUSED' || r.absenceType === 'excused'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {r.status === 'ABSENT_EXCUSED' || r.absenceType === 'excused' ? 'Có phép' : 'Không phép'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">{r.reason || 'Chưa rõ'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THEO TUẦN (Mục XIV, XV, XVI) */}
      {activeTab === 'WEEKLY' && (
        <WeeklyAttendanceReportView currentDate={selectedDate} session={selectedSession} />
      )}

      {/* TAB 4: THEO THÁNG (Mục XVIII, XIX, XX, XLIV) */}
      {activeTab === 'MONTHLY' && (
        <MonthlyAttendanceReportView
          session={selectedSession}
          canExport={canExportSchool}
          onSelectStudentProfile={(stuId) => {
            setSelectedStudentForProfile(stuId);
            setActiveTab('STUDENT_PROFILE');
          }}
        />
      )}

      {/* TAB 5: THEO HỌC KỲ (Mục XXI) */}
      {activeTab === 'SEMESTER' && (
        <SemesterAttendanceReportView session={selectedSession} />
      )}

      {/* TAB 6: THEO NĂM HỌC (Mục XXII) */}
      {activeTab === 'SCHOOL_YEAR' && (
        <SemesterAttendanceReportView session={selectedSession} />
      )}

      {/* TAB 7: THEO LỚP (Mục LXII, LXIII, LXIV) */}
      {activeTab === 'BY_CLASS' && (
        <ClassAttendanceReportView
          currentDate={selectedDate}
          classes={classes}
          canExport={canExportClass}
          onSelectStudentProfile={(stuId) => {
            setSelectedStudentForProfile(stuId);
            setActiveTab('STUDENT_PROFILE');
          }}
        />
      )}

      {/* TAB 8: THEO KHỐI (Mục X) */}
      {activeTab === 'BY_GRADE' && (
        <GradeAttendanceReportView currentDate={selectedDate} session={selectedSession} />
      )}

      {/* TAB 9: BÁN TRÚ (Mục VII, XXV, XXVI, XXVII) */}
      {activeTab === 'BOARDING' && (
        <BoardingReportView
          currentDate={selectedDate}
          session={selectedSession}
          defaultType="BOARDING"
          onSelectStudentProfile={(stuId) => {
            setSelectedStudentForProfile(stuId);
            setActiveTab('STUDENT_PROFILE');
          }}
        />
      )}

      {/* TAB 10: NGOẠI TRÚ (Mục VIII, XXVIII) */}
      {activeTab === 'NON_BOARDING' && (
        <BoardingReportView
          currentDate={selectedDate}
          session={selectedSession}
          defaultType="NON_BOARDING"
          onSelectStudentProfile={(stuId) => {
            setSelectedStudentForProfile(stuId);
            setActiveTab('STUDENT_PROFILE');
          }}
        />
      )}

      {/* TAB 11: HỌC SINH VẮNG (Mục XI, LXX, LXXI, LXXII) */}
      {activeTab === 'ABSENT' && (
        <AbsentStudentReport
          date={selectedDate}
          session={selectedSession}
          absentRecords={dailyData.absentRecords}
          classes={classes}
          canExport={canExportSchool}
          onSelectStudentProfile={(stuId) => {
            setSelectedStudentForProfile(stuId);
            setActiveTab('STUDENT_PROFILE');
          }}
        />
      )}

      {/* TAB 12: CHUYÊN CẦN (Mục XXIII, XXIV) */}
      {activeTab === 'STUDENT_PROFILE' && (
        <StudentAttendanceProfileTab
          initialStudentId={selectedStudentForProfile}
          onSelectStudentProfile={(stuId) => setSelectedStudentForProfile(stuId)}
        />
      )}

      {/* TAB 13: TIẾN ĐỘ GVCN (Mục XXIX, XXX) */}
      {activeTab === 'TEACHER_PROGRESS' && (
        <TeacherSubmissionReportView currentDate={selectedDate} session={selectedSession} />
      )}

      {/* TAB 14: KHO BÁO CÁO (Mục XC, XCI) */}
      {activeTab === 'ARCHIVE' && (
        <ReportArchiveView
          onViewReportDate={(dt, sess) => {
            setSelectedDate(dt);
            setSelectedSession(sess);
            setActiveTab('BY_DATE');
          }}
        />
      )}

      {/* TAB 15: KIỂM TRA DỮ LIỆU (Mục CIX, CX, CXI) */}
      {activeTab === 'DATA_HEALTH' && isAdmin && (
        <DataHealthCheckView />
      )}

      {/* Print Preview Modal (Mục XLVI - LIV) */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        date={selectedDate}
        session={selectedSession}
        schoolName={settings.schoolName}
        schoolAddress={settings.schoolAddress}
        isOfficial={dailyData.isOfficial}
        reportVersion={dailyData.reportVersion}
        finalizedAt={dailyData.finalizedAt}
        finalizedBy={dailyData.finalizedBy}
        finalizedByTitle={dailyData.finalizedByTitle}
        totalClasses={dailyData.totalClasses}
        approvedClasses={dailyData.approvedClasses}
        totalStudentsRoster={dailyData.totalStudentsRoster}
        confirmedStudents={dailyData.confirmedStudents}
        presentCount={dailyData.presentCount}
        absentCount={dailyData.absentCount}
        excusedAbsentCount={dailyData.excusedAbsentCount}
        unexcusedAbsentCount={dailyData.unexcusedAbsentCount}
        lateCount={dailyData.lateCount}
        earlyLeaveCount={dailyData.earlyLeaveCount}
        boardingTotalRoster={dailyData.boardingTotalRoster}
        boardingPresent={dailyData.boardingPresent}
        boardingAbsent={dailyData.boardingAbsent}
        nonBoardingTotalRoster={dailyData.nonBoardingTotalRoster}
        nonBoardingPresent={dailyData.nonBoardingPresent}
        nonBoardingAbsent={dailyData.nonBoardingAbsent}
        attendanceRate={dailyData.attendanceRate}
        classRows={dailyData.classRows}
        gradeGroups={dailyData.gradeGroups}
        absentRecords={dailyData.absentRecords}
      />

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                MỞ KHÓA BÁO CÁO NGÀY {selectedDate}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Báo cáo sau khi mở khóa sẽ chuyển về trạng thái Sơ bộ để tiếp nhận chỉnh sửa. Khi chốt lại, hệ thống sẽ lưu thành phiên bản mới (v{dailyData.reportVersion + 1}) mà không làm mất dấu vết phiên bản cũ.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do mở khóa hiệu chỉnh: <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={unlockReasonInput}
                onChange={(e) => setUnlockReasonInput(e.target.value)}
                placeholder="Ví dụ: GVCN 7A1 xin đính chính 1 học sinh có phép..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
              {unlockError && (
                <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{unlockError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockReasonInput('');
                  setUnlockError(null);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Xác nhận mở khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Finalize Report Dialog */}
      <ConfirmDialog
        isOpen={isConfirmFinalizeOpen}
        title="CHỐT KHÓA BÁO CÁO CHÍNH THỨC"
        message={
          dailyData.approvedClasses < dailyData.totalClasses
            ? `Hiện chỉ có ${dailyData.approvedClasses}/${dailyData.totalClasses} lớp được duyệt. Thầy/Cô có chắc chắn muốn chốt khóa báo cáo sĩ số chính thức ngày ${selectedDate} với số liệu hiện tại không?`
            : `Xác nhận chốt khóa báo cáo sĩ số chính thức ngày ${selectedDate} cho toàn trường THCS Bản Bo? Dữ liệu sau khi chốt sẽ được bảo vệ toàn vẹn.`
        }
        confirmLabel="CHỐT KHÓA CHÍNH THỨC"
        cancelLabel="HỦY"
        variant={dailyData.approvedClasses < dailyData.totalClasses ? 'warning' : 'primary'}
        onConfirm={executeFinalizeReport}
        onCancel={() => setIsConfirmFinalizeOpen(false)}
      />
    </div>
  );
};
