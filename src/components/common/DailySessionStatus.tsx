import React from 'react';
import { AttendanceReport } from '../../types';
import { SessionStatusBadge } from './SessionStatusBadge';
import { Sun, Sunset, ArrowRight } from 'lucide-react';

interface DailySessionStatusProps {
  morningReport: AttendanceReport | null;
  afternoonReport: AttendanceReport | null;
  onOpenMorning?: () => void;
  onOpenAfternoon?: () => void;
}

export const DailySessionStatus: React.FC<DailySessionStatusProps> = ({
  morningReport,
  afternoonReport,
  onOpenMorning,
  onOpenAfternoon,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* KHỐI BUỔI SÁNG */}
      <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <span className="font-black text-xs text-amber-950 uppercase">BUỔI SÁNG</span>
          </div>
          <SessionStatusBadge status={morningReport?.status} size="sm" />
        </div>

        {morningReport ? (
          <div className="flex items-center justify-between text-xs text-slate-700 px-1 pt-1 border-t border-amber-100">
            <span>
              Sĩ số: <strong>{morningReport.totalStudents}</strong>
            </span>
            <span>
              Có mặt: <strong className="text-emerald-700">{morningReport.presentCount}</strong>
            </span>
            <span>
              Vắng: <strong className="text-rose-700">{morningReport.absentCount}</strong>
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-amber-800 italic pt-1 border-t border-amber-100">
            Chưa có báo cáo sĩ số buổi sáng
          </div>
        )}

        {onOpenMorning && (
          <button
            type="button"
            onClick={onOpenMorning}
            className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{morningReport ? 'Xem báo cáo sáng' : 'Báo sĩ số sáng'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KHỐI BUỔI CHIỀU */}
      <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sunset className="w-4 h-4" />
            </div>
            <span className="font-black text-xs text-blue-950 uppercase">BUỔI CHIỀU</span>
          </div>
          <SessionStatusBadge status={afternoonReport?.status} size="sm" />
        </div>

        {afternoonReport ? (
          <div className="flex items-center justify-between text-xs text-slate-700 px-1 pt-1 border-t border-blue-100">
            <span>
              Sĩ số: <strong>{afternoonReport.totalStudents}</strong>
            </span>
            <span>
              Có mặt: <strong className="text-emerald-700">{afternoonReport.presentCount}</strong>
            </span>
            <span>
              Vắng: <strong className="text-rose-700">{afternoonReport.absentCount}</strong>
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-blue-800 italic pt-1 border-t border-blue-100">
            Chưa có báo cáo sĩ số buổi chiều
          </div>
        )}

        {onOpenAfternoon && (
          <button
            type="button"
            onClick={onOpenAfternoon}
            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{afternoonReport ? 'Xem báo cáo chiều' : 'Báo sĩ số chiều'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
