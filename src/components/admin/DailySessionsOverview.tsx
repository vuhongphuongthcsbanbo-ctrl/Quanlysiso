import React from 'react';
import { SchoolClass, AttendanceReport, SessionType } from '../../types';
import { SessionStatusBadge } from '../common/SessionStatusBadge';
import { Sun, Sunset, Eye, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DailySessionsOverviewProps {
  classes: SchoolClass[];
  morningReports: AttendanceReport[];
  afternoonReports: AttendanceReport[];
  onViewReport: (classId: string, session: SessionType) => void;
  onApproveSingleReport?: (reportId: string) => void;
}

export const DailySessionsOverview: React.FC<DailySessionsOverviewProps> = ({
  classes,
  morningReports,
  afternoonReports,
  onViewReport,
  onApproveSingleReport,
}) => {
  const morningMap = new Map<string, AttendanceReport>();
  morningReports.forEach(r => morningMap.set(r.classId, r));

  const afternoonMap = new Map<string, AttendanceReport>();
  afternoonReports.forEach(r => afternoonMap.set(r.classId, r));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500 text-white uppercase tracking-wider">
              BẢNG TỔNG QUAN CẢ NGÀY
            </span>
            <span className="text-xs text-slate-300">20 lớp toàn trường</span>
          </div>
          <h3 className="text-base font-black text-white mt-1">
            TIẾN ĐỘ & TRẠNG THÁI BUỔI SÁNG VÀ BUỔI CHIỀU
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mỗi buổi báo cáo độc lập. Tổng phụ trách duyệt riêng từng buổi, không duyệt gộp.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-2 rounded-xl border border-white/10 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200">
            Nguyên tắc bảo vệ: <strong>Duyệt độc lập theo buổi</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-black uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-3">Lớp</th>
              <th className="py-3 px-3">Khối</th>
              <th className="py-3 px-3">GVCN</th>
              <th className="py-3 px-3 text-center">Sĩ số</th>
              <th className="py-3 px-3 bg-amber-50/70 border-x border-amber-200/50">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>BUỔI SÁNG</span>
                </div>
              </th>
              <th className="py-3 px-3 bg-blue-50/70 border-r border-blue-200/50">
                <div className="flex items-center gap-1.5 text-blue-900">
                  <Sunset className="w-3.5 h-3.5 text-blue-600" />
                  <span>BUỔI CHIỀU</span>
                </div>
              </th>
              <th className="py-3 px-3 text-center">Lượt có mặt</th>
              <th className="py-3 px-3 text-center">Lượt vắng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map((cls, idx) => {
              const mRep = morningMap.get(cls.id);
              const aRep = afternoonMap.get(cls.id);

              // Calculate session student turns (lượt học: sáng + chiều)
              const mPresent = mRep && (mRep.status === 'APPROVED' || mRep.status === 'LOCKED') ? mRep.presentCount : 0;
              const aPresent = aRep && (aRep.status === 'APPROVED' || aRep.status === 'LOCKED') ? aRep.presentCount : 0;
              const totalTurnsPresent = mPresent + aPresent;

              const mAbsent = mRep && (mRep.status === 'APPROVED' || mRep.status === 'LOCKED') ? mRep.absentCount : 0;
              const aAbsent = aRep && (aRep.status === 'APPROVED' || aRep.status === 'LOCKED') ? aRep.absentCount : 0;
              const totalTurnsAbsent = mAbsent + aAbsent;

              return (
                <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-black text-slate-900 text-sm">{cls.name}</td>
                  <td className="py-3 px-3 font-semibold text-slate-600">Khối {cls.grade}</td>
                  <td className="py-3 px-3 text-slate-800">
                    <div className="font-bold">{cls.teacherName || 'Chưa phân công'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{cls.teacherPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-black text-slate-900">
                    {cls.totalStudents || 0}
                  </td>

                  {/* CỘT BUỔI SÁNG */}
                  <td className="py-2.5 px-3 bg-amber-50/30 border-x border-amber-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <SessionStatusBadge status={mRep?.status} size="sm" />
                        {mRep && (
                          <div className="text-[10px] text-slate-600 font-medium">
                            Có mặt: <strong className="text-emerald-700">{mRep.presentCount}</strong> | Vắng:{' '}
                            <strong className="text-rose-700">{mRep.absentCount}</strong>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onViewReport(cls.id, 'MORNING')}
                        className="p-1 text-slate-400 hover:text-amber-700 rounded-md hover:bg-amber-100 cursor-pointer"
                        title="Xem báo cáo buổi sáng"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* CỘT BUỔI CHIỀU */}
                  <td className="py-2.5 px-3 bg-blue-50/30 border-r border-blue-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <SessionStatusBadge status={aRep?.status} size="sm" />
                        {aRep && (
                          <div className="text-[10px] text-slate-600 font-medium">
                            Có mặt: <strong className="text-emerald-700">{aRep.presentCount}</strong> | Vắng:{' '}
                            <strong className="text-rose-700">{aRep.absentCount}</strong>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onViewReport(cls.id, 'AFTERNOON')}
                        className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-100 cursor-pointer"
                        title="Xem báo cáo buổi chiều"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* THỐNG KÊ LƯỢT CẢ NGÀY */}
                  <td className="py-3 px-3 text-center font-bold text-emerald-800">
                    {totalTurnsPresent > 0 ? `${totalTurnsPresent} lượt` : '--'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-rose-800">
                    {totalTurnsAbsent > 0 ? `${totalTurnsAbsent} lượt` : '0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
