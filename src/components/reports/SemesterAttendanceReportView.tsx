import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { semesterReportService } from '../../services/semesterReportService';
import { storageService } from '../../services/storageService';
import { periodReportService } from '../../services/periodReportService';
import { calculatePercentage } from '../../services/reportCalculationService';
import { SessionType, getSessionDisplayName } from '../../types';
import { CheckCircle2, Save, Lock, Unlock, Clock, History, Sparkles } from 'lucide-react';

interface SemesterAttendanceReportViewProps {
  session: SessionType;
  defaultPeriod?: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
}

export const SemesterAttendanceReportView: React.FC<SemesterAttendanceReportViewProps> = ({
  session = 'MORNING',
  defaultPeriod = 'SEMESTER_1',
}) => {
  const { currentUser, isAdmin } = useAuth();
  const canSaveReport =
    isAdmin ||
    currentUser?.role === 'principal' ||
    currentUser?.role === 'BOARD_OF_MANAGEMENT' ||
    !!currentUser?.permissions?.canFinalizeAttendance ||
    !!currentUser?.permissions?.canExportSchoolReports;

  const [period, setPeriod] = useState<'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR'>(defaultPeriod);
  const [refreshTick, setRefreshTick] = useState(0);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIVE' | 'SAVED'>('LIVE');

  useEffect(() => {
    setPeriod(defaultPeriod);
  }, [defaultPeriod]);

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

  const settings = storageService.getSettings();
  const schoolYearId = settings.schoolYear || '2026-2027';

  // Tự động lưu báo cáo học kỳ / năm học nếu có dữ liệu mới
  useEffect(() => {
    periodReportService.autoSaveSemesterOrYearReport(
      period,
      session,
      currentUser?.name || settings.adminName || 'Hệ thống tự động'
    );
  }, [period, session, refreshTick, currentUser?.name, settings.adminName]);

  const periodKey = useMemo(
    () => periodReportService.getSemesterPeriodKey(period, schoolYearId, session),
    [period, schoolYearId, session]
  );

  const savedSnapshot = useMemo(() => {
    return storageService.getPeriodReportByKey(periodKey);
  }, [periodKey, refreshTick]);

  useEffect(() => {
    if (!savedSnapshot && viewMode === 'SAVED') {
      setViewMode('LIVE');
    }
  }, [savedSnapshot, viewMode]);

  const reportData = useMemo(() => {
    return semesterReportService.getSemesterReport(period, session);
  }, [period, session, refreshTick]);

  const displayData = useMemo(() => {
    if (viewMode === 'SAVED' && savedSnapshot) {
      const expected = savedSnapshot.totalExpectedSessions;
      return {
        ...reportData,
        totalDaysRecorded: savedSnapshot.schoolDaysCount,
        totalExpectedSessions: expected,
        totalPresentSessions: savedSnapshot.totalPresentSessions,
        totalAbsentSessions: savedSnapshot.totalAbsentSessions,
        totalExcusedSessions: savedSnapshot.totalExcusedSessions,
        totalUnexcusedSessions: savedSnapshot.totalUnexcusedSessions,
        totalLateCount: savedSnapshot.totalLateCount,
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
        gradeStats: savedSnapshot.gradeStats || reportData.gradeStats,
        classStats: savedSnapshot.classStats || reportData.classStats,
      };
    }
    return reportData;
  }, [viewMode, savedSnapshot, reportData]);

  const periodNoun = period === 'FULL_YEAR' ? 'năm học' : period === 'SEMESTER_2' ? 'học kỳ II' : 'học kỳ I';

  const handleSaveSemesterOrYear = (lockAfterSave: boolean = false) => {
    const saved = periodReportService.saveSemesterOrYearReport(
      period,
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
      `Đã lưu ${saved.title} (${getSessionDisplayName(session)}) · Phiên bản v${saved.reportVersion} lúc ${saved.savedAt}`
    );
    setTimeout(() => setSaveBanner(null), 5000);
  };

  const handleToggleLock = () => {
    if (!savedSnapshot) return;
    const updated = periodReportService.toggleLockPeriodReport(
      savedSnapshot.periodKey,
      savedSnapshot.status !== 'LOCKED',
      currentUser?.name || settings.adminName || 'Quản trị viên'
    );
    if (updated) {
      setSaveBanner(
        updated.status === 'LOCKED'
          ? `Đã chốt khóa ${updated.title} v${updated.reportVersion}`
          : `Đã mở khóa ${updated.title} v${updated.reportVersion}`
      );
      setTimeout(() => setSaveBanner(null), 4000);
    }
  };

  const totalGradeStudents = displayData.gradeStats.reduce(
    (sum: number, g: any) => sum + (g.totalStudents || 0),
    0
  );
  const totalGradeClasses = displayData.gradeStats.reduce(
    (sum: number, g: any) => sum + (g.totalClasses || 0),
    0
  );
  const totalClassStudents = displayData.classStats.reduce(
    (sum: number, c: any) => sum + (c.totalStudents || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Period Selection & Save Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Báo cáo định kỳ {period === 'FULL_YEAR' ? 'năm học' : 'học kỳ'} · {getSessionDisplayName(session)}
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
                  <span>Chưa phát sinh dữ liệu duyệt {periodNoun}</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              BÁO CÁO CHUYÊN CẦN {displayData.periodLabel.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Giai đoạn: Từ {displayData.startDate} đến {displayData.endDate} · Số ngày đã ghi nhận:{' '}
              <strong className="text-slate-900">{displayData.totalDaysRecorded}</strong> ngày
              {savedSnapshot && (
                <span className="ml-2 text-emerald-700 font-medium">
                  · Lưu gần nhất: {savedSnapshot.savedAt} ({savedSnapshot.savedBy})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('SEMESTER_1')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'SEMESTER_1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học kỳ I
            </button>
            <button
              onClick={() => setPeriod('SEMESTER_2')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'SEMESTER_2'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học kỳ II
            </button>
            <button
              onClick={() => setPeriod('FULL_YEAR')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                period === 'FULL_YEAR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả năm học {schoolYearId}
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
                placeholder={`Ghi chú lưu báo cáo ${periodNoun} (tùy chọn)...`}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 min-w-[200px]"
              />
              <button
                onClick={() => handleSaveSemesterOrYear(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savedSnapshot
                    ? `Cập nhật lưu ${periodNoun} (v${savedSnapshot.reportVersion + 1})`
                    : `Lưu báo cáo ${periodNoun}`}
                </span>
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
                      <span>Mở khóa</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chốt khóa {periodNoun}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSaveSemesterOrYear(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lưu & Chốt {periodNoun}</span>
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

      {/* KPI Cards (Mục XXI, XXII) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">
            Tỉ lệ chuyên cần {period === 'FULL_YEAR' ? 'năm' : 'kỳ'}
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{displayData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{displayData.totalPresentSessions}/{displayData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng lượt có mặt</div>
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
          <div className="text-[10px] text-purple-700 mt-0.5">lượt trong {period === 'FULL_YEAR' ? 'năm' : 'kỳ'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Số ngày đã ghi nhận</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{displayData.totalDaysRecorded}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ngày có báo cáo đã duyệt</div>
        </div>
      </div>

      {/* Grade Level Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            TỔNG HỢP THEO KHỐI (6, 7, 8, 9)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Khối</th>
                <th className="p-3 text-center">Số lớp</th>
                <th className="p-3 text-center">Tổng HS</th>
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
              {displayData.gradeStats.map((g: any) => {
                const gAbsentRate =
                  g.absentRate ?? calculatePercentage(g.absentSessions || 0, g.expectedSessions || 0);
                return (
                  <tr key={g.grade} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{g.gradeLabel}</td>
                    <td className="p-3 text-center text-slate-600">{g.totalClasses} lớp</td>
                    <td className="p-3 text-center font-medium">{g.totalStudents}</td>
                    <td className="p-3 text-center font-bold text-emerald-800">{g.presentSessions}</td>
                    <td className="p-3 text-center font-bold text-rose-800">{g.absentSessions}</td>
                    <td className="p-3 text-center text-slate-700">{g.excusedSessions}</td>
                    <td className="p-3 text-center text-slate-700">{g.unexcusedSessions}</td>
                    <td className="p-3 text-center text-purple-700">{g.lateCount}</td>
                    <td className="p-3 text-center font-extrabold text-blue-900">
                      {Number(g.attendanceRate || 0).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center font-bold text-rose-700">
                      {Number(gAbsentRate).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900">
                <td className="p-3">TỔNG TOÀN TRƯỜNG</td>
                <td className="p-3 text-center">{totalGradeClasses} lớp</td>
                <td className="p-3 text-center">{totalGradeStudents} HS</td>
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

      {/* Class Level Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            TỔNG HỢP CHI TIẾT {displayData.classStats.length} LỚP TRONG {period === 'FULL_YEAR' ? 'NĂM HỌC' : 'HỌC KỲ'}
          </h4>
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
                    <td className="p-3 text-center text-slate-600">{c.schoolDaysRecorded}</td>
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
                <td className="p-3" colSpan={2}>TỔNG CỘNG TOÀN TRƯỜNG</td>
                <td className="p-3 text-center">{totalClassStudents} HS</td>
                <td className="p-3 text-center">{displayData.totalDaysRecorded} ngày</td>
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

