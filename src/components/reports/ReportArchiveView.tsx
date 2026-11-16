import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  SchoolDailyReport,
  SavedPeriodReport,
  SavedReportPeriodType,
  SessionType,
  getSessionDisplayName,
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  Archive,
  Lock,
  Eye,
  Search,
  CheckCircle2,
  History,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { ConfirmDialog } from '../../theme/designSystem';

type ArchiveFilterCategory = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEMESTER' | 'SCHOOL_YEAR';

interface UnifiedArchiveEntry {
  kind: 'DAILY' | 'PERIOD';
  id: string;
  periodType: SavedReportPeriodType;
  category: Exclude<ArchiveFilterCategory, 'ALL'>;
  title: string;
  subtitle: string;
  dateSortKey: string;
  session: 'MORNING' | 'AFTERNOON';
  version: number;
  savedBy: string;
  savedByTitle: string;
  savedAt: string;
  totalStudents: number;
  presentValue: string;
  absentValue: string;
  rate: number;
  isLocked: boolean;
  statusLabel: string;
  rawDaily?: SchoolDailyReport;
  rawPeriod?: SavedPeriodReport;
}

interface ReportArchiveViewProps {
  onViewReportDate: (date: string, session: SessionType) => void;
  onViewPeriodReport?: (report: SavedPeriodReport) => void;
}

export const ReportArchiveView: React.FC<ReportArchiveViewProps> = ({
  onViewReportDate,
  onViewPeriodReport,
}) => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ArchiveFilterCategory>('ALL');
  const [refreshTick, setRefreshTick] = useState(0);
  const [viewingDaily, setViewingDaily] = useState<SchoolDailyReport | null>(null);
  const [viewingPeriod, setViewingPeriod] = useState<SavedPeriodReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedArchiveEntry | null>(null);

  useEffect(() => {
    const onChanged = () => setRefreshTick(t => t + 1);
    window.addEventListener('thcs_banbo_reports_changed', onChanged);
    return () => window.removeEventListener('thcs_banbo_reports_changed', onChanged);
  }, []);

  const allEntries: UnifiedArchiveEntry[] = useMemo(() => {
    const dailyList = storageService.getAllDailyOfficialReports();
    const periodList = storageService.getPeriodReports();

    const mappedDaily: UnifiedArchiveEntry[] = dailyList.map(r => {
      const total = r.totalStudentsSnapshot ?? r.totalStudents;
      const rate = r.confirmedStudents > 0
        ? Math.round((r.presentCount / r.confirmedStudents) * 1000) / 10
        : total > 0
        ? Math.round((r.presentCount / total) * 1000) / 10
        : 100;
      const isLocked = r.reportStatus === 'LOCKED';
      const statusLabel =
        r.reportStatus === 'LOCKED'
          ? 'Đã khóa chính thức'
          : r.reportStatus === 'OFFICIAL'
          ? 'Đã lưu chính thức'
          : 'Đã lưu sơ bộ';

      return {
        kind: 'DAILY',
        id: r.id,
        periodType: 'DAILY',
        category: 'DAILY',
        title: `Báo cáo ngày ${r.date}`,
        subtitle: `${r.approvedClasses}/${r.totalClasses} lớp duyệt · Bán trú: ${r.boardingPresent}/${r.boardingTotalSnapshot ?? r.boardingTotal}`,
        dateSortKey: r.updatedAt || r.finalizedAt || r.date,
        session: r.session === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING',
        version: r.reportVersion || 1,
        savedBy: r.finalizedBy || 'Phạm Ngọc Thúy',
        savedByTitle: r.finalizedByTitle || 'Tổng Phụ trách Đội',
        savedAt: r.finalizedAt || r.updatedAt,
        totalStudents: total,
        presentValue: `${r.presentCount} HS`,
        absentValue: `${r.absentCount} HS`,
        rate,
        isLocked,
        statusLabel,
        rawDaily: r,
      };
    });

    const mappedPeriod: UnifiedArchiveEntry[] = periodList.map(p => {
      const category: Exclude<ArchiveFilterCategory, 'ALL'> =
        p.periodType === 'WEEKLY'
          ? 'WEEKLY'
          : p.periodType === 'MONTHLY'
          ? 'MONTHLY'
          : p.periodType === 'SCHOOL_YEAR'
          ? 'SCHOOL_YEAR'
          : 'SEMESTER';

      return {
        kind: 'PERIOD',
        id: p.id,
        periodType: p.periodType,
        category,
        title: p.title,
        subtitle: `${p.startDate} → ${p.endDate} · ${p.schoolDaysCount} ngày học`,
        dateSortKey: p.updatedAt || p.savedAt || p.endDate,
        session: p.session,
        version: p.reportVersion || 1,
        savedBy: p.savedBy,
        savedByTitle: p.savedByTitle || 'Tổng Phụ trách Đội',
        savedAt: p.savedAt || p.updatedAt,
        totalStudents: p.totalStudentsRoster,
        presentValue: `${p.totalPresentSessions} lượt`,
        absentValue: `${p.totalAbsentSessions} lượt`,
        rate: p.attendanceRate,
        isLocked: p.status === 'LOCKED',
        statusLabel: p.status === 'LOCKED' ? 'Đã chốt khóa' : 'Đã lưu kho',
        rawPeriod: p,
      };
    });

    return [...mappedDaily, ...mappedPeriod].sort((a, b) =>
      b.dateSortKey.localeCompare(a.dateSortKey)
    );
  }, [refreshTick]);

  const counts = useMemo(() => {
    return {
      ALL: allEntries.length,
      DAILY: allEntries.filter(e => e.category === 'DAILY').length,
      WEEKLY: allEntries.filter(e => e.category === 'WEEKLY').length,
      MONTHLY: allEntries.filter(e => e.category === 'MONTHLY').length,
      SEMESTER: allEntries.filter(e => e.category === 'SEMESTER').length,
      SCHOOL_YEAR: allEntries.filter(e => e.category === 'SCHOOL_YEAR').length,
    };
  }, [allEntries]);

  const filtered = useMemo(() => {
    return allEntries.filter(entry => {
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const haystack = `${entry.title} ${entry.subtitle} ${entry.savedBy} ${entry.dateSortKey}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allEntries, categoryFilter, searchQuery]);

  const categoryBadge = (cat: Exclude<ArchiveFilterCategory, 'ALL'>) => {
    switch (cat) {
      case 'DAILY':
        return { label: 'Theo ngày', cls: 'bg-blue-100 text-blue-800' };
      case 'WEEKLY':
        return { label: 'Theo tuần', cls: 'bg-indigo-100 text-indigo-800' };
      case 'MONTHLY':
        return { label: 'Theo tháng', cls: 'bg-purple-100 text-purple-800' };
      case 'SEMESTER':
        return { label: 'Theo học kỳ', cls: 'bg-amber-100 text-amber-800' };
      case 'SCHOOL_YEAR':
        return { label: 'Theo năm học', cls: 'bg-emerald-100 text-emerald-800' };
    }
  };

  const handleExecuteDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'DAILY') {
      storageService.deleteDailyOfficialReport(deleteTarget.id);
    } else {
      storageService.deletePeriodReport(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
              Kho lưu trữ số liệu chính thức
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              KHO BÁO CÁO SĨ SỐ ĐÃ LƯU (NGÀY · TUẦN · THÁNG · HỌC KỲ · NĂM HỌC)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu trữ nguyên vẹn snapshot sĩ số lịch sử, thông tin người lưu/chốt, thời gian và lịch sử phiên bản (v1, v2...)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo ngày, tháng, tuần, người lưu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 min-w-[240px]"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DAILY', label: 'Theo ngày' },
              { id: 'WEEKLY', label: 'Theo tuần' },
              { id: 'MONTHLY', label: 'Theo tháng' },
              { id: 'SEMESTER', label: 'Theo học kỳ' },
              { id: 'SCHOOL_YEAR', label: 'Theo năm học' },
            ] as Array<{ id: ArchiveFilterCategory; label: string }>
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  categoryFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List of Archived Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">
              Chưa có báo cáo nào được lưu trong mục này.
            </div>
            <p className="text-slate-400 mt-1 max-w-md mx-auto">
              Thầy/Cô có thể bấm nút <strong>"Lưu báo cáo ngày"</strong>, <strong>"Lưu báo cáo tuần"</strong>,{' '}
              <strong>"Lưu báo cáo tháng"</strong>, <strong>"Lưu báo cáo học kỳ"</strong> hoặc{' '}
              <strong>"Lưu báo cáo năm học"</strong> ở từng tab tương ứng để lưu trữ vào kho.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3">Kỳ báo cáo</th>
                  <th className="p-3 text-center">Loại</th>
                  <th className="p-3 text-center">Buổi</th>
                  <th className="p-3 text-center">Phiên bản</th>
                  <th className="p-3">Người lưu / Thời gian</th>
                  <th className="p-3 text-center">Sĩ số</th>
                  <th className="p-3 text-center">Có mặt</th>
                  <th className="p-3 text-center">Vắng</th>
                  <th className="p-3 text-center">Tỉ lệ</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(entry => {
                  const badge = categoryBadge(entry.category);
                  return (
                    <tr key={`${entry.kind}_${entry.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{entry.title}</div>
                        <div className="text-[11px] text-slate-500">{entry.subtitle}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700 whitespace-nowrap">
                        {getSessionDisplayName(entry.session)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                          v{entry.version}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{entry.savedBy}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{entry.savedAt}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">
                        {entry.totalStudents} HS
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-800 whitespace-nowrap">
                        {entry.presentValue}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-800 whitespace-nowrap">
                        {entry.absentValue}
                      </td>
                      <td className="p-3 text-center font-black text-blue-900">
                        {entry.rate.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 whitespace-nowrap ${
                            entry.isLocked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {entry.isLocked ? <Lock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{entry.statusLabel}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              if (entry.rawDaily) {
                                setViewingDaily(entry.rawDaily);
                                setViewingPeriod(null);
                              } else if (entry.rawPeriod) {
                                setViewingPeriod(entry.rawPeriod);
                                setViewingDaily(null);
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title="Xem snapshot đã lưu"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            onClick={() => {
                              if (entry.rawDaily) {
                                onViewReportDate(entry.rawDaily.date, entry.rawDaily.session);
                              } else if (entry.rawPeriod && onViewPeriodReport) {
                                onViewPeriodReport(entry.rawPeriod);
                              }
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                            title="Mở tab báo cáo này"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && !entry.isLocked && (
                            <button
                              onClick={() => setDeleteTarget(entry)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer"
                              title="Xóa bản lưu chưa khóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Snapshot Details Modal */}
      {viewingDaily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 border border-slate-200 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">
                  Snapshot Ngày · Phiên bản v{viewingDaily.reportVersion || 1} · {getSessionDisplayName(viewingDaily.session)}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  BÁO CÁO SĨ SỐ NGÀY {viewingDaily.date}
                </h4>
                <p className="text-xs text-slate-500">
                  Người lưu: {viewingDaily.finalizedBy} ({viewingDaily.finalizedByTitle}) lúc {viewingDaily.finalizedAt || viewingDaily.updatedAt}
                </p>
              </div>
              <button
                onClick={() => setViewingDaily(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Sĩ số snapshot:</span>
                <strong className="text-sm text-slate-900">{viewingDaily.totalStudentsSnapshot ?? viewingDaily.totalStudents} HS</strong>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block">Có mặt:</span>
                <strong className="text-sm text-emerald-950">{viewingDaily.presentCount} HS</strong>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-rose-800 block">Vắng:</span>
                <strong className="text-sm text-rose-950">{viewingDaily.absentCount} HS</strong>
              </div>
              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                <span className="text-purple-800 block">Bán trú có mặt:</span>
                <strong className="text-sm text-purple-950">{viewingDaily.boardingPresent} HS</strong>
              </div>
            </div>

            {viewingDaily.classesSnapshot && viewingDaily.classesSnapshot.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                  Chi tiết 20 lớp tại thời điểm lưu
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="p-2">Lớp</th>
                        <th className="p-2 text-center">Sĩ số</th>
                        <th className="p-2 text-center">Có mặt</th>
                        <th className="p-2 text-center">Vắng</th>
                        <th className="p-2 text-center">Bán trú</th>
                        <th className="p-2 text-center">Ngoại trú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingDaily.classesSnapshot.map(c => (
                        <tr key={c.classId}>
                          <td className="p-2 font-bold text-slate-900">{c.className}</td>
                          <td className="p-2 text-center">{c.totalStudents}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{c.presentCount}</td>
                          <td className="p-2 text-center font-bold text-rose-700">{c.absentCount}</td>
                          <td className="p-2 text-center">{c.boardingPresent}/{c.boardingTotal}</td>
                          <td className="p-2 text-center">{c.nonBoardingPresent}/{c.nonBoardingTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewingDaily.versionHistory && viewingDaily.versionHistory.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Lịch sử các phiên bản trước đó</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {viewingDaily.versionHistory.map(vh => (
                    <div key={vh.version} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">Phiên bản v{vh.version}</strong>
                        <div className="text-[11px] text-slate-500">Lưu bởi: {vh.finalizedBy} lúc {vh.finalizedAt}</div>
                        {vh.revisionReason && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">Ghi chú / Lý do: "{vh.revisionReason}"</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 font-bold">{vh.presentCount} có mặt</span> · <span className="text-rose-800 font-bold">{vh.absentCount} vắng</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const targetDate = viewingDaily.date;
                  const targetSession = viewingDaily.session;
                  setViewingDaily(null);
                  onViewReportDate(targetDate, targetSession);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Mở trong tab Theo ngày
              </button>
              <button
                onClick={() => setViewingDaily(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Snapshot Details Modal (Tuần, Tháng, Học kỳ, Năm học) */}
      {viewingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 border border-slate-200 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded uppercase">
                  Snapshot Phiên bản v{viewingPeriod.reportVersion || 1} · {getSessionDisplayName(viewingPeriod.session)}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  {viewingPeriod.title.toUpperCase()}
                </h4>
                <p className="text-xs text-slate-500">
                  Từ {viewingPeriod.startDate} đến {viewingPeriod.endDate} · Lưu bởi: {viewingPeriod.savedBy} lúc {viewingPeriod.savedAt}
                </p>
                {viewingPeriod.notes && (
                  <p className="text-xs text-blue-800 mt-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ghi chú: {viewingPeriod.notes}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingPeriod(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Số ngày học:</span>
                <strong className="text-sm text-slate-900">{viewingPeriod.schoolDaysCount} ngày</strong>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block">Tỉ lệ chuyên cần:</span>
                <strong className="text-sm text-emerald-950">{viewingPeriod.attendanceRate.toFixed(1)}%</strong>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                <span className="text-blue-800 block">Lượt có mặt:</span>
                <strong className="text-sm text-blue-950">{viewingPeriod.totalPresentSessions} lượt</strong>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-rose-800 block">Tổng lượt vắng:</span>
                <strong className="text-sm text-rose-950">{viewingPeriod.totalAbsentSessions} lượt</strong>
              </div>
            </div>

            {viewingPeriod.classStats && viewingPeriod.classStats.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                  Bảng tổng hợp các lớp đã lưu
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="p-2">Lớp</th>
                        <th className="p-2 text-center">Số ngày</th>
                        <th className="p-2 text-center">Lượt có mặt</th>
                        <th className="p-2 text-center">Lượt vắng</th>
                        <th className="p-2 text-center">Tỉ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingPeriod.classStats.map((c: any) => (
                        <tr key={c.classId}>
                          <td className="p-2 font-bold text-slate-900">{c.className}</td>
                          <td className="p-2 text-center">{c.schoolDaysCount ?? c.schoolDaysRecorded ?? 0}</td>
                          <td className="p-2 text-center font-bold text-emerald-700">{c.presentSessions}</td>
                          <td className="p-2 text-center font-bold text-rose-700">{c.absentSessions}</td>
                          <td className="p-2 text-center font-black text-blue-900">{Number(c.attendanceRate || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewingPeriod.versionHistory && viewingPeriod.versionHistory.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Lịch sử các phiên bản trước đó</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {viewingPeriod.versionHistory.map(vh => (
                    <div key={vh.version} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">Phiên bản v{vh.version}</strong>
                        <div className="text-[11px] text-slate-500">Lưu bởi: {vh.savedBy} lúc {vh.savedAt}</div>
                        {vh.notes && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">Ghi chú: "{vh.notes}"</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 font-bold">{vh.presentCount} có mặt</span> · <span className="text-rose-800 font-bold">{vh.absentCount} vắng</span> ({vh.attendanceRate.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              {onViewPeriodReport && (
                <button
                  onClick={() => {
                    const target = viewingPeriod;
                    setViewingPeriod(null);
                    onViewPeriodReport(target);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Mở tab báo cáo này
                </button>
              )}
              <button
                onClick={() => setViewingPeriod(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Unlocked Snapshot Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="XÓA BẢN LƯU BÁO CÁO"
        message={`Thầy/Cô có chắc chắn muốn xóa bản lưu "${deleteTarget?.title}" khỏi kho báo cáo? Dữ liệu điểm danh gốc của từng lớp theo ngày vẫn được giữ nguyên.`}
        confirmLabel="XÓA BẢN LƯU"
        cancelLabel="HỦY"
        variant="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
