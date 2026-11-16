import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { weeklyReportService } from '../../services/weeklyReportService';
import { storageService } from '../../services/storageService';
import { periodReportService } from '../../services/periodReportService';
import { SessionType, getSessionDisplayName } from '../../types';
import { getTodayDateString } from '../../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Save,
  Lock,
  Unlock,
  Clock,
  History,
} from 'lucide-react';

interface WeeklyAttendanceReportViewProps {
  currentDate: string;
  session: SessionType;
  initialStartDate?: string;
  initialEndDate?: string;
}

export const WeeklyAttendanceReportView: React.FC<WeeklyAttendanceReportViewProps> = ({
  currentDate = getTodayDateString(),
  session = 'MORNING',
  initialStartDate,
  initialEndDate,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const canSaveReport =
    isAdmin ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'BOARD_OF_MANAGEMENT' ||
    !!currentUser?.permissions?.canFinalizeAttendance ||
    !!currentUser?.permissions?.canExportSchoolReports;

  const initialRange = useMemo(
    () =>
      initialStartDate && initialEndDate
        ? { startDate: initialStartDate, endDate: initialEndDate }
        : weeklyReportService.getWeekRange(currentDate),
    [currentDate, initialStartDate, initialEndDate]
  );

  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [refreshTick, setRefreshTick] = useState(0);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIVE' | 'SAVED'>('LIVE');

  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
    }
  }, [initialStartDate, initialEndDate]);

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

  const periodKey = useMemo(
    () => periodReportService.getWeeklyPeriodKey(startDate, endDate, session),
    [startDate, endDate, session]
  );

  const savedSnapshot = useMemo(() => {
    return storageService.getPeriodReportByKey(periodKey);
  }, [periodKey, refreshTick]);

  const weeklyData = useMemo(() => {
    return weeklyReportService.getWeeklyAttendance(startDate, endDate, session);
  }, [startDate, endDate, session, refreshTick]);

  useEffect(() => {
    if (!savedSnapshot && viewMode === 'SAVED') {
      setViewMode('LIVE');
    }
  }, [savedSnapshot, viewMode]);

  const activeData = useMemo(() => {
    if (viewMode === 'SAVED' && savedSnapshot) {
      return {
        weekLabel: `Từ ${savedSnapshot.startDate} đến ${savedSnapshot.endDate}`,
        startDate: savedSnapshot.startDate,
        endDate: savedSnapshot.endDate,
        schoolDaysCount: savedSnapshot.schoolDaysCount,
        totalStudentsRoster: savedSnapshot.totalStudentsRoster,
        totalExpectedSessions: savedSnapshot.totalExpectedSessions,
        totalPresentSessions: savedSnapshot.totalPresentSessions,
        totalAbsentSessions: savedSnapshot.totalAbsentSessions,
        totalExcusedSessions: savedSnapshot.totalExcusedSessions,
        totalUnexcusedSessions: savedSnapshot.totalUnexcusedSessions,
        totalLateCount: savedSnapshot.totalLateCount,
        totalEarlyLeaveCount: savedSnapshot.totalEarlyLeaveCount,
        attendanceRate: savedSnapshot.attendanceRate,
        classStats: savedSnapshot.classStats || [],
        daysBreakdown: savedSnapshot.daysBreakdown || [],
      };
    }
    return weeklyData;
  }, [viewMode, savedSnapshot, weeklyData]);

  const handleSaveWeekly = (lockAfterSave: boolean = false) => {
    const settings = storageService.getSettings();
    const saved = periodReportService.saveWeeklyReport(
      startDate,
      endDate,
      session,
      currentUser?.name || settings.adminName || 'Quản trị viên',
      currentUser?.title || settings.adminTitle || 'Tổng Phụ trách Đội',
      {
        notes: saveNotes.trim() || undefined,
        lock: lockAfterSave,
      }
    );
    setSaveNotes('');
    setSaveBanner(
      `Đã lưu báo cáo tuần (${startDate} → ${endDate}, ${getSessionDisplayName(session)}) · Phiên bản v${saved.reportVersion} lúc ${saved.savedAt}`
    );
    setTimeout(() => setSaveBanner(null), 5000);
  };

  const handleToggleLock = () => {
    if (!savedSnapshot) return;
    const settings = storageService.getSettings();
    const updated = periodReportService.toggleLockPeriodReport(
      savedSnapshot.periodKey,
      savedSnapshot.status !== 'LOCKED',
      currentUser?.name || settings.adminName || 'Quản trị viên'
    );
    if (updated) {
      setSaveBanner(
        updated.status === 'LOCKED'
          ? `Đã chốt khóa báo cáo tuần v${updated.reportVersion}`
          : `Đã mở khóa báo cáo tuần v${updated.reportVersion} để cập nhật`
      );
      setTimeout(() => setSaveBanner(null), 4000);
    }
  };

  const handlePrevWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const range = weeklyReportService.getWeekRange(`${y}-${m}-${day}`);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleNextWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const range = weeklyReportService.getWeekRange(`${y}-${m}-${day}`);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleCurrentWeek = () => {
    const range = weeklyReportService.getWeekRange(getTodayDateString());
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div className="space-y-4">
      {/* Date Range Navigation & Save Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Báo cáo chuyên cần theo tuần · {getSessionDisplayName(session)}
              </span>
              {savedSnapshot ? (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    savedSnapshot.status === 'LOCKED'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {savedSnapshot.status === 'LOCKED' ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  <span>
                    {savedSnapshot.status === 'LOCKED' ? 'Đã chốt khóa' : 'Đã lưu kho'} (v{savedSnapshot.reportVersion})
                  </span>
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Chưa lưu vào kho</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              THỐNG KÊ CHUYÊN CẦN TUẦN HỌC
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Từ <strong>{startDate}</strong> đến <strong>{endDate}</strong> · Số ngày học thực tế:{' '}
              <strong className="text-slate-900">{activeData.schoolDaysCount}</strong> ngày
              {savedSnapshot && (
                <span className="ml-2 text-emerald-700 font-medium">
                  · Lưu gần nhất: {savedSnapshot.savedAt} ({savedSnapshot.savedBy})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={handlePrevWeek}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tuần trước</span>
            </button>

            <button
              onClick={handleCurrentWeek}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold cursor-pointer"
            >
              Tuần này
            </button>

            <button
              onClick={handleNextWeek}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              title="Tuần sau"
            >
              <span className="hidden sm:inline">Tuần sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save / Lock Controls */}
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
                placeholder="Ghi chú lưu báo cáo tuần (tùy chọn)..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 min-w-[200px]"
              />
              <button
                onClick={() => handleSaveWeekly(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedSnapshot ? `Cập nhật lưu tuần (v${savedSnapshot.reportVersion + 1})` : 'Lưu báo cáo tuần'}</span>
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
                      <span>Mở khóa tuần</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chốt khóa tuần</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSaveWeekly(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lưu & Chốt tuần</span>
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

      {/* KPI Cards (Mục XIV) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Số ngày học</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeData.schoolDaysCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Loại trừ ngày nghỉ/lễ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Tỉ lệ chuyên cần</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{activeData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{activeData.totalPresentSessions}/{activeData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Lượt có mặt</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{activeData.totalPresentSessions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{activeData.totalAbsentSessions}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Có phép: {activeData.totalExcusedSessions} · K.Phép: {activeData.totalUnexcusedSessions}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{activeData.totalLateCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">lượt đi muộn</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Về sớm</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{activeData.totalEarlyLeaveCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">lượt về sớm</div>
        </div>
      </div>

      {/* Daily Breakdown inside Week */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Diễn biến từng ngày trong tuần
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {activeData.daysBreakdown.map((day: any) => (
            <div
              key={day.date}
              className={`p-3 rounded-xl border ${
                day.isSchoolDay
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="font-bold text-slate-900">{day.dayName}</div>
              <div className="text-[10px] text-slate-500">{day.date}</div>
              {day.isSchoolDay ? (
                <div className="mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Có mặt:</span>
                    <span className="font-bold text-emerald-800">{day.presentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vắng:</span>
                    <span className="font-bold text-rose-800">{day.absentCount}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Tỉ lệ:</span>
                    <span className="font-bold text-blue-900">{Number(day.attendanceRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic mt-2">Ngày nghỉ / không học</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Class Statistics Table for the Week (Mục XV) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            THỐNG KÊ THEO 20 LỚP TRONG TUẦN
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
                <th className="p-3 text-center">Sĩ số BQ</th>
                <th className="p-3 text-center">Số ngày học</th>
                <th className="p-3 text-center">Lượt có mặt</th>
                <th className="p-3 text-center">Lượt vắng</th>
                <th className="p-3 text-center">Có phép</th>
                <th className="p-3 text-center">Không phép</th>
                <th className="p-3 text-center">Đi muộn</th>
                <th className="p-3 text-center">Tỉ lệ chuyên cần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeData.classStats.map((c: any) => (
                <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.className}</td>
                  <td className="p-3 text-slate-700">{c.teacherName}</td>
                  <td className="p-3 text-center font-medium text-slate-800">{c.averageStudentCount}</td>
                  <td className="p-3 text-center text-slate-600">{c.schoolDaysCount}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{c.presentSessions}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{c.absentSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.excusedSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.unexcusedSessions}</td>
                  <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                  <td className="p-3 text-center font-extrabold text-blue-900">
                    {Number(c.attendanceRate || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
