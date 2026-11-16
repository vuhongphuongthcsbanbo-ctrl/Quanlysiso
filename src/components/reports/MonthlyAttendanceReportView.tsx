import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { monthlyReportService } from '../../services/monthlyReportService';
import { excelExportService } from '../../services/excelExportService';
import { storageService } from '../../services/storageService';
import { periodReportService } from '../../services/periodReportService';
import { calculatePercentage } from '../../services/reportCalculationService';
import { SessionType, getSessionDisplayName } from '../../types';
import { getTodayDateString } from '../../utils/formatters';
import {
  FileSpreadsheet,
  UserX,
  Save,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  History,
  Sparkles,
} from 'lucide-react';

interface MonthlyAttendanceReportViewProps {
  currentDate?: string;
  session: SessionType;
  canExport: boolean;
  initialYear?: number;
  initialMonth?: number;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const MonthlyAttendanceReportView: React.FC<MonthlyAttendanceReportViewProps> = ({
  currentDate,
  session = 'MORNING',
  canExport,
  initialYear,
  initialMonth,
  onSelectStudentProfile,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const canSaveReport =
    isAdmin ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'BOARD_OF_MANAGEMENT' ||
    !!currentUser?.permissions?.canFinalizeAttendance ||
    !!currentUser?.permissions?.canExportSchoolReports;

  const settings = storageService.getSettings();
  const schoolYearId = settings.schoolYear || '2026-2027';

  const fallbackDate = currentDate || getTodayDateString();
  const [fallbackY, fallbackM] = fallbackDate.split('-').map(Number);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear || fallbackY || 2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || fallbackM || 11);
  const [threshold, setThreshold] = useState<number>(3);
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIVE' | 'SAVED'>('LIVE');

  useEffect(() => {
    if (initialYear && initialMonth) {
      setSelectedYear(initialYear);
      setSelectedMonth(initialMonth);
    } else if (currentDate) {
      const [y, m] = currentDate.split('-').map(Number);
      if (y && m) {
        setSelectedYear(y);
        setSelectedMonth(m);
      }
    }
  }, [initialYear, initialMonth, currentDate]);

  useEffect(() => {
    const onChanged = () => setRefreshTick(t => t + 1);
    window.addEventListener('thcs_banbo_reports_changed', onChanged);
    window.addEventListener('thcs_banbo_students_changed', onChanged);
    window.addEventListener('thcs_banbo_classes_changed', onChanged);
    return () => {
      window.removeEventListener('thcs_banbo_reports_changed', onChanged);
      window.removeEventListener('thcs_banbo_students_changed', onChanged);
      window.removeEventListener('thcs_banbo_classes_changed', onChanged);
    };
  }, []);

  const monthOptions = useMemo(() => {
    const parts = schoolYearId.split('-').map(Number);
    const y1 = parts[0] || selectedYear;
    const y2 = parts[1] || y1 + 1;
    const opts = [
      { year: y1, month: 8 },
      { year: y1, month: 9 },
      { year: y1, month: 10 },
      { year: y1, month: 11 },
      { year: y1, month: 12 },
      { year: y2, month: 1 },
      { year: y2, month: 2 },
      { year: y2, month: 3 },
      { year: y2, month: 4 },
      { year: y2, month: 5 },
    ];
    if (!opts.some(o => o.year === selectedYear && o.month === selectedMonth)) {
      opts.push({ year: selectedYear, month: selectedMonth });
      opts.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
    }
    return opts;
  }, [schoolYearId, selectedYear, selectedMonth]);

  // Tự động lưu báo cáo tháng nếu có dữ liệu mới
  useEffect(() => {
    periodReportService.autoSaveMonthlyReport(
      selectedYear,
      selectedMonth,
      session,
      currentUser?.name || settings.adminName || 'Hệ thống tự động',
      { threshold }
    );
  }, [selectedYear, selectedMonth, session, threshold, refreshTick, currentUser?.name, settings.adminName]);

  const periodKey = useMemo(
    () => periodReportService.getMonthlyPeriodKey(selectedYear, selectedMonth, session),
    [selectedYear, selectedMonth, session]
  );

  const savedSnapshot = useMemo(() => {
    return storageService.getPeriodReportByKey(periodKey);
  }, [periodKey, refreshTick]);

  useEffect(() => {
    if (!savedSnapshot && viewMode === 'SAVED') {
      setViewMode('LIVE');
    }
  }, [savedSnapshot, viewMode]);

  const monthData = useMemo(() => {
    return monthlyReportService.getMonthlyAttendance(
      selectedYear,
      selectedMonth,
      threshold,
      gradeFilter !== 'ALL' ? Number(gradeFilter) : undefined,
      undefined,
      session
    );
  }, [selectedYear, selectedMonth, threshold, gradeFilter, session, refreshTick]);

  const displayData = useMemo(() => {
    if (viewMode === 'SAVED' && savedSnapshot) {
      const filteredClasses =
        gradeFilter !== 'ALL'
          ? (savedSnapshot.classStats || []).filter((c: any) => c.grade === Number(gradeFilter))
          : savedSnapshot.classStats || [];
      const filteredFrequent =
        gradeFilter !== 'ALL'
          ? (savedSnapshot.frequentAbsentStudents || []).filter(
              (s: any) => s.grade === Number(gradeFilter) && s.totalAbsent >= threshold
            )
          : (savedSnapshot.frequentAbsentStudents || []).filter((s: any) => s.totalAbsent >= threshold);

      const expected = savedSnapshot.totalExpectedSessions;
      const bExpected = savedSnapshot.boardingExpected ?? monthData.boardingExpected;
      const bPresent = savedSnapshot.boardingPresent ?? monthData.boardingPresent;
      return {
        ...monthData,
        schoolDaysCount: savedSnapshot.schoolDaysCount,
        totalExpectedSessions: expected,
        totalPresentSessions: savedSnapshot.totalPresentSessions,
        totalAbsentSessions: savedSnapshot.totalAbsentSessions,
        totalExcusedSessions: savedSnapshot.totalExcusedSessions,
        totalUnexcusedSessions: savedSnapshot.totalUnexcusedSessions,
        totalLateCount: savedSnapshot.totalLateCount,
        totalEarlyLeaveCount: savedSnapshot.totalEarlyLeaveCount,
        attendanceRate: savedSnapshot.attendanceRate,
        absentRate:
          savedSnapshot.absentRate ??
          calculatePercentage(savedSnapshot.totalAbsentSessions, expected),
        excusedRate:
          savedSnapshot.excusedRate ??
          calculatePercentage(savedSnapshot.totalExcusedSessions, expected),
        unexcusedRate:
          savedSnapshot.unexcusedRate ??
          calculatePercentage(savedSnapshot.totalUnexcusedSessions, expected),
        lateRate:
          savedSnapshot.lateRate ??
          calculatePercentage(savedSnapshot.totalLateCount, expected),
        boardingExpected: bExpected,
        boardingPresent: bPresent,
        boardingAbsent: savedSnapshot.boardingAbsent ?? monthData.boardingAbsent,
        boardingRate:
          savedSnapshot.boardingRate ?? calculatePercentage(bPresent, bExpected),
        studentsWithAbsenceCount: savedSnapshot.studentsWithAbsenceCount ?? monthData.studentsWithAbsenceCount,
        classStats: filteredClasses,
        frequentAbsentStudents: filteredFrequent,
      };
    }
    return monthData;
  }, [viewMode, savedSnapshot, monthData, gradeFilter, threshold]);

  const handleSaveMonthly = (lockAfterSave: boolean = false) => {
    const curSettings = storageService.getSettings();
    const saved = periodReportService.saveMonthlyReport(
      selectedYear,
      selectedMonth,
      session,
      currentUser?.name || curSettings.adminName || 'Quản trị viên',
      currentUser?.title || curSettings.adminTitle || 'Tổng Phụ trách Đội',
      {
        notes: saveNotes.trim() || undefined,
        lock: lockAfterSave,
        threshold,
      }
    );
    setSaveNotes('');
    setSaveBanner(
      `Đã lưu báo cáo Tháng ${selectedMonth}/${selectedYear} (${getSessionDisplayName(session)}) · Phiên bản v${saved.reportVersion} lúc ${saved.savedAt}`
    );
    setTimeout(() => setSaveBanner(null), 5000);
  };

  const handleToggleLock = () => {
    if (!savedSnapshot) return;
    const curSettings = storageService.getSettings();
    const updated = periodReportService.toggleLockPeriodReport(
      savedSnapshot.periodKey,
      savedSnapshot.status !== 'LOCKED',
      currentUser?.name || curSettings.adminName || 'Quản trị viên'
    );
    if (updated) {
      setSaveBanner(
        updated.status === 'LOCKED'
          ? `Đã chốt khóa báo cáo Tháng ${selectedMonth}/${selectedYear} v${updated.reportVersion}`
          : `Đã mở khóa báo cáo Tháng ${selectedMonth}/${selectedYear} v${updated.reportVersion}`
      );
      setTimeout(() => setSaveBanner(null), 4000);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    excelExportService.exportMonthlyReportExcel(selectedYear, selectedMonth);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const comp = monthData.comparisonWithPreviousMonth;

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Báo cáo định kỳ tháng · {getSessionDisplayName(session)}
              </span>
              {savedSnapshot ? (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    savedSnapshot.status === 'LOCKED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : savedSnapshot.isAutoSaved
                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {savedSnapshot.status === 'LOCKED' ? (
                    <Lock className="w-3 h-3" />
                  ) : savedSnapshot.isAutoSaved ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  <span>
                    {savedSnapshot.status === 'LOCKED'
                      ? 'Đã chốt khóa'
                      : savedSnapshot.isAutoSaved
                      ? 'Tự động lưu'
                      : 'Đã lưu kho'}{' '}
                    (v{savedSnapshot.reportVersion})
                  </span>
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Chưa phát sinh dữ liệu duyệt tháng này</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              BÁO CÁO CHUYÊN CẦN THÁNG {selectedMonth}/{selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Năm học {schoolYearId} · Số ngày học trong tháng:{' '}
              <strong className="text-slate-900">{displayData.schoolDaysCount}</strong> ngày (đã loại trừ ngày nghỉ lễ)
              {savedSnapshot && (
                <span className="ml-2 text-emerald-700 font-medium">
                  · Lưu gần nhất: {savedSnapshot.savedAt} ({savedSnapshot.savedBy})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Select Month */}
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  Tháng {opt.month} / {opt.year}
                </option>
              ))}
            </select>

            {/* Select Grade */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 cursor-pointer"
            >
              <option value="ALL">Tất cả Khối 6–9</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>

            {canExport && (
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                  isExporting
                    ? 'bg-emerald-400 text-white cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isExporting ? 'ĐANG TẠO FILE...' : 'Xuất Excel tháng'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Save / Lock Monthly Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {savedSnapshot && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
                <button
                  onClick={() => setViewMode('LIVE')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    viewMode === 'LIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Số liệu hiện tại
                </button>
                <button
                  onClick={() => setViewMode('SAVED')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
                    viewMode === 'SAVED' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>Bản đã lưu (v{savedSnapshot.reportVersion})</span>
                </button>
              </div>
            )}
          </div>

          {canSaveReport && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Ghi chú lưu báo cáo tháng (tùy chọn)..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 min-w-[200px]"
              />
              <button
                onClick={() => handleSaveMonthly(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedSnapshot ? `Cập nhật lưu tháng (v${savedSnapshot.reportVersion + 1})` : 'Lưu báo cáo tháng'}</span>
              </button>

              {savedSnapshot ? (
                <button
                  onClick={handleToggleLock}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                    savedSnapshot.status === 'LOCKED'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  }`}
                >
                  {savedSnapshot.status === 'LOCKED' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở khóa tháng</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chốt khóa tháng</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSaveMonthly(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lưu & Chốt tháng</span>
                </button>
              )}
            </div>
          )}
        </div>

        {saveBanner && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}
      </div>

      {/* KPI Cards (Mục XVIII) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Ngày học</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{displayData.schoolDaysCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Bán trú đạt: <strong>{displayData.boardingRate.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Chuyên cần tháng</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{displayData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{displayData.totalPresentSessions}/{displayData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Lượt có mặt</div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {displayData.totalPresentSessions}
            <span className="text-xs font-extrabold text-blue-700 ml-1">
              ({displayData.attendanceRate.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">trên tổng {displayData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">
            {displayData.totalAbsentSessions}
            <span className="text-xs font-extrabold text-rose-700 ml-1">
              ({displayData.absentRate.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[10px] text-rose-700 mt-0.5">
            Phép: {displayData.totalExcusedSessions} ({displayData.excusedRate.toFixed(1)}%) · K.P: {displayData.totalUnexcusedSessions} ({displayData.unexcusedRate.toFixed(1)}%)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
          <div className="text-2xl font-black text-purple-950 mt-1">
            {displayData.totalLateCount}
            <span className="text-xs font-extrabold text-purple-700 ml-1">
              ({displayData.lateRate.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[10px] text-purple-700 mt-0.5">lượt trong tháng</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">HS có phát sinh nghỉ</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{displayData.studentsWithAbsenceCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">học sinh trong tháng</div>
        </div>
      </div>

      {/* Month-over-Month Comparison (Mục LXXIV) */}
      {comp && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase">So sánh với {comp.previousMonthLabel}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Lượt vắng:</span>
              <strong className="text-slate-900">{comp.currentAbsent}</strong>
              <span className="text-slate-400">vs {comp.previousAbsent}</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                comp.absentDiff < 0 ? 'bg-emerald-100 text-emerald-800' : comp.absentDiff > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {comp.absentDiff > 0 ? `+${comp.absentDiff}` : comp.absentDiff} lượt
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tỉ lệ chuyên cần:</span>
              <strong className="text-slate-900">{comp.currentRate.toFixed(1)}%</strong>
              <span className="text-slate-400">vs {comp.previousRate.toFixed(1)}%</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                comp.rateDiff > 0 ? 'bg-emerald-100 text-emerald-800' : comp.rateDiff < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {comp.rateDiff > 0 ? `+${comp.rateDiff}%` : `${comp.rateDiff}%`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section: HỌC SINH CÓ NHIỀU LƯỢT VẮNG (Mục XIX, XX) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Theo dõi học sinh có nhiều lượt vắng (Mục XIX)
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              DANH SÁCH HỌC SINH CÓ TỪ {threshold} LƯỢT VẮNG TRỞ LÊN
            </div>
            <div className="text-[11px] text-slate-500 italic mt-0.5">
              * Chỉ số chỉ phục vụ công tác theo dõi và phối hợp phụ huynh của nhà trường, không dùng làm kết luận kỷ luật.
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <span className="text-slate-500 px-2">Ngưỡng:</span>
            {[3, 5, 10].map(val => (
              <button
                key={val}
                onClick={() => setThreshold(val)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  threshold === val ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Từ {val} lượt
              </button>
            ))}
          </div>
        </div>

        {displayData.frequentAbsentStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold">Không có học sinh nào đạt ngưỡng từ {threshold} lượt vắng trở lên trong tháng này.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3 text-center">Lớp</th>
                  <th className="p-3 text-center">Khối</th>
                  <th className="p-3 text-center">Diện</th>
                  <th className="p-3 text-center">Tổng lượt vắng</th>
                  <th className="p-3 text-center">Có phép</th>
                  <th className="p-3 text-center">Không phép</th>
                  <th className="p-3 text-center">Đi muộn</th>
                  <th className="p-3">Ngày vắng gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayData.frequentAbsentStudents.map((st: any, idx: number) => (
                  <tr
                    key={st.studentId}
                    onClick={() => onSelectStudentProfile?.(st.studentId)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{st.studentName}</div>
                      {st.studentCode && (
                        <div className="text-[10px] font-mono text-slate-400">{st.studentCode}</div>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">{st.className}</td>
                    <td className="p-3 text-center text-slate-600">Khối {st.grade}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.boardingType === 'Bán trú' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {st.boardingType}
                      </span>
                    </td>
                    <td className="p-3 text-center font-black text-rose-900 text-sm">
                      {st.totalAbsent}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-800">{st.excusedCount}</td>
                    <td className="p-3 text-center font-bold text-rose-800">{st.unexcusedCount}</td>
                    <td className="p-3 text-center text-purple-700">{st.lateCount}</td>
                    <td className="p-3 text-slate-600">
                      <div>{st.lastAbsentDate}</div>
                      {st.lastReason && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{st.lastReason}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Statistics for Month */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            THỐNG KÊ CHI TIẾT {displayData.classStats.length} LỚP TRONG THÁNG {selectedMonth}/{selectedYear}
          </h4>
          <span className="text-xs text-slate-500">
            Công thức: Lượt có mặt / Tổng lượt dự kiến × 100
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Lớp</th>
                <th className="p-3">GVCN</th>
                <th className="p-3 text-center">Sĩ số</th>
                <th className="p-3 text-center">Số ngày</th>
                <th className="p-3 text-center">Lượt có mặt</th>
                <th className="p-3 text-center">Lượt vắng</th>
                <th className="p-3 text-center">Có phép</th>
                <th className="p-3 text-center">Không phép</th>
                <th className="p-3 text-center">Đi muộn</th>
                <th className="p-3 text-center">% Có mặt</th>
                <th className="p-3 text-center">% Vắng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayData.classStats.map((c: any) => {
                const cAbsentRate =
                  c.absentRate ?? calculatePercentage(c.absentSessions || 0, c.expectedSessions || 0);
                return (
                  <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{c.className}</td>
                    <td className="p-3 text-slate-700">{c.teacherName}</td>
                    <td className="p-3 text-center font-medium">{c.totalStudents}</td>
                    <td className="p-3 text-center text-slate-600">{c.schoolDaysCount}</td>
                    <td className="p-3 text-center font-bold text-emerald-800">{c.presentSessions}</td>
                    <td className="p-3 text-center font-bold text-rose-800">{c.absentSessions}</td>
                    <td className="p-3 text-center text-slate-700">{c.excusedSessions}</td>
                    <td className="p-3 text-center text-slate-700">{c.unexcusedSessions}</td>
                    <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                    <td className="p-3 text-center font-black text-blue-900">
                      {Number(c.attendanceRate || 0).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center font-bold text-rose-700">
                      {Number(cAbsentRate).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900">
                <td className="p-3" colSpan={2}>TỔNG CỘNG {gradeFilter === 'ALL' ? 'TOÀN TRƯỜNG' : `KHỐI ${gradeFilter}`}</td>
                <td className="p-3 text-center">
                  {displayData.classStats.reduce((sum: number, c: any) => sum + (c.totalStudents || 0), 0)} HS
                </td>
                <td className="p-3 text-center">{displayData.schoolDaysCount} ngày</td>
                <td className="p-3 text-center text-emerald-800">{displayData.totalPresentSessions}</td>
                <td className="p-3 text-center text-rose-800">{displayData.totalAbsentSessions}</td>
                <td className="p-3 text-center">{displayData.totalExcusedSessions}</td>
                <td className="p-3 text-center">{displayData.totalUnexcusedSessions}</td>
                <td className="p-3 text-center text-purple-800">{displayData.totalLateCount}</td>
                <td className="p-3 text-center text-blue-900">{displayData.attendanceRate.toFixed(1)}%</td>
                <td className="p-3 text-center text-rose-700">{displayData.absentRate.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

