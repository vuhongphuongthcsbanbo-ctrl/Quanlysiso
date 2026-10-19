import React, { useState, useMemo } from 'react';
import { SchoolDailyReport, SessionType, getSessionDisplayName } from '../../types';
import { storageService } from '../../services/storageService';
import { formatVietnameseDate } from '../../utils/formatters';
import { Archive, Lock, Calendar, Eye, Search, CheckCircle2, History, ShieldAlert } from 'lucide-react';

interface ReportArchiveViewProps {
  onViewReportDate: (date: string, session: SessionType) => void;
}

export const ReportArchiveView: React.FC<ReportArchiveViewProps> = ({
  onViewReportDate,
}) => {
  const [searchDate, setSearchDate] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState<SchoolDailyReport | null>(null);

  // Retrieve archived locked reports
  const archivedReports: SchoolDailyReport[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('thcs_banbo_v2_daily_official');
      if (!raw) return [];
      const list: SchoolDailyReport[] = JSON.parse(raw);
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  }, []);

  const filtered = useMemo(() => {
    if (!searchDate) return archivedReports;
    return archivedReports.filter(r => r.date.includes(searchDate));
  }, [archivedReports, searchDate]);

  return (
    <div className="space-y-4">
      {/* Top Banner (Mục XC, XCI) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Kho lưu trữ số liệu chính thức
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            KHO BÁO CÁO SĨ SỐ ĐÃ CHỐT (Mục XC, XCI)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu trữ nguyên vẹn snapshot dữ liệu lịch sử, thông tin người chốt, thời gian chốt và lịch sử phiên bản (v1, v2...)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo ngày (YYYY-MM-DD)..."
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* List of Archived Locked Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">Chưa có báo cáo nào được chốt trong kho lưu trữ.</div>
            <p className="text-slate-400 mt-1">
              Khi Tổng Phụ trách hoàn tất quy trình "Chốt sĩ số ngày", báo cáo chính thức kèm snapshot và phiên bản sẽ được tự động lưu trữ tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3">Ngày</th>
                  <th className="p-3 text-center">Buổi</th>
                  <th className="p-3 text-center">Phiên bản</th>
                  <th className="p-3">Người chốt</th>
                  <th className="p-3 text-center">Thời gian chốt</th>
                  <th className="p-3 text-center">Sĩ số snapshot</th>
                  <th className="p-3 text-center">Có mặt</th>
                  <th className="p-3 text-center">Vắng</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{r.date}</td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {getSessionDisplayName(r.session)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                        v{r.reportVersion || 1}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      <div>{r.finalizedBy || 'Phạm Ngọc Thúy'}</div>
                      <div className="text-[10px] text-slate-400">{r.finalizedByTitle || 'Tổng Phụ trách Đội'}</div>
                    </td>
                    <td className="p-3 text-center text-slate-600 font-mono">
                      {r.finalizedAt || r.updatedAt}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {r.totalStudentsSnapshot ?? r.totalStudents} HS
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-800">
                      {r.presentCount}
                    </td>
                    <td className="p-3 text-center font-bold text-rose-800">
                      {r.absentCount}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Đã khóa chính thức</span>
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setViewingSnapshot(r);
                          onViewReportDate(r.date, r.session);
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Details Modal if viewing */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 border border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">
                  Snapshot Phiên bản v{viewingSnapshot.reportVersion || 1}
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                  BÁO CÁO ĐÃ CHỐT NGÀY {viewingSnapshot.date}
                </h4>
                <p className="text-xs text-slate-500">
                  Người chốt: {viewingSnapshot.finalizedBy} ({viewingSnapshot.finalizedByTitle}) lúc {viewingSnapshot.finalizedAt}
                </p>
              </div>
              <button
                onClick={() => setViewingSnapshot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Sĩ số snapshot:</span>
                <strong className="text-sm text-slate-900">{viewingSnapshot.totalStudentsSnapshot ?? viewingSnapshot.totalStudents} HS</strong>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block">Có mặt:</span>
                <strong className="text-sm text-emerald-950">{viewingSnapshot.presentCount} HS</strong>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <span className="text-rose-800 block">Vắng:</span>
                <strong className="text-sm text-rose-950">{viewingSnapshot.absentCount} HS</strong>
              </div>
              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                <span className="text-purple-800 block">Bán trú có mặt:</span>
                <strong className="text-sm text-purple-950">{viewingSnapshot.boardingPresent} HS</strong>
              </div>
            </div>

            {/* Version History (Mục LVIII, LIX) */}
            {viewingSnapshot.versionHistory && viewingSnapshot.versionHistory.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Lịch sử các phiên bản trước đó</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {viewingSnapshot.versionHistory.map(vh => (
                    <div key={vh.version} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">Phiên bản v{vh.version}</strong>
                        <div className="text-[11px] text-slate-500">Chốt bởi: {vh.finalizedBy} lúc {vh.finalizedAt}</div>
                        {vh.revisionReason && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">Lý do điều chỉnh: "{vh.revisionReason}"</div>
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

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
