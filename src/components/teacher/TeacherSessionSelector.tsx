import React from 'react';
import { Sun, Sunset, CalendarRange, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AttendanceReport } from '../../types';

export type TeacherSessionMode = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

interface TeacherSessionSelectorProps {
  activeMode: TeacherSessionMode;
  onChange: (mode: TeacherSessionMode) => void;
  morningReport: AttendanceReport | null;
  afternoonReport: AttendanceReport | null;
  className?: string;
}

export const TeacherSessionSelector: React.FC<TeacherSessionSelectorProps> = ({
  activeMode,
  onChange,
  morningReport,
  afternoonReport,
  className = '',
}) => {
  // Helper to get compact status badge info
  const getSessionBadgeInfo = (report: AttendanceReport | null) => {
    if (!report || report.status === 'NOT_SUBMITTED' || (report.status as string) === 'not_reported') {
      return { text: 'Chưa báo', bg: 'bg-slate-200 text-slate-700', isDone: false };
    }
    const s = String(report.status).toUpperCase();
    if (s === 'APPROVED') {
      return { text: 'Đã duyệt', bg: 'bg-emerald-100 text-emerald-800 font-bold', isDone: true };
    }
    if (s === 'PENDING_APPROVAL' || s === 'SUBMITTED') {
      return { text: 'Chờ duyệt', bg: 'bg-amber-100 text-amber-900 font-bold', isDone: false };
    }
    if (s === 'REVISION_REQUIRED' || s === 'NEEDS_REVISION') {
      return { text: 'Cần sửa', bg: 'bg-rose-100 text-rose-800 font-bold', isDone: false };
    }
    if (s === 'LOCKED') {
      return { text: 'Đã khóa', bg: 'bg-blue-100 text-blue-900 font-bold', isDone: true };
    }
    return { text: 'Chưa báo', bg: 'bg-slate-200 text-slate-700', isDone: false };
  };

  const morningBadge = getSessionBadgeInfo(morningReport);
  const afternoonBadge = getSessionBadgeInfo(afternoonReport);

  return (
    <div className={`w-full ${className}`}>
      {/* Container nút bấm 3 chế độ được thiết kế tối ưu trên điện thoại và máy tính */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/70 shadow-2xs">
        {/* 1. NÚT BUỔI SÁNG */}
        <button
          type="button"
          onClick={() => onChange('MORNING')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl transition-all cursor-pointer select-none text-center min-h-[46px] ${
            activeMode === 'MORNING'
              ? 'bg-amber-500 text-white font-black shadow-sm ring-2 ring-amber-400/40'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60 font-bold'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sun className={`w-4 h-4 shrink-0 ${activeMode === 'MORNING' ? 'text-white' : 'text-amber-600'}`} />
            <span className="text-xs sm:text-sm whitespace-nowrap">BUỔI SÁNG</span>
          </div>
          <span
            className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md whitespace-nowrap ${
              activeMode === 'MORNING'
                ? 'bg-amber-600 text-white font-bold'
                : morningBadge.bg
            }`}
          >
            {morningBadge.text}
          </span>
        </button>

        {/* 2. NÚT BUỔI CHIỀU */}
        <button
          type="button"
          onClick={() => onChange('AFTERNOON')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl transition-all cursor-pointer select-none text-center min-h-[46px] ${
            activeMode === 'AFTERNOON'
              ? 'bg-blue-600 text-white font-black shadow-sm ring-2 ring-blue-500/40'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60 font-bold'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sunset className={`w-4 h-4 shrink-0 ${activeMode === 'AFTERNOON' ? 'text-white' : 'text-blue-600'}`} />
            <span className="text-xs sm:text-sm whitespace-nowrap">BUỔI CHIỀU</span>
          </div>
          <span
            className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md whitespace-nowrap ${
              activeMode === 'AFTERNOON'
                ? 'bg-blue-700 text-white font-bold'
                : afternoonBadge.bg
            }`}
          >
            {afternoonBadge.text}
          </span>
        </button>

        {/* 3. NÚT TỔNG QUAN CẢ NGÀY */}
        <button
          type="button"
          onClick={() => onChange('FULL_DAY')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-xl transition-all cursor-pointer select-none text-center min-h-[46px] ${
            activeMode === 'FULL_DAY'
              ? 'bg-slate-900 text-white font-black shadow-sm ring-2 ring-slate-800/40'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60 font-bold'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CalendarRange className={`w-4 h-4 shrink-0 ${activeMode === 'FULL_DAY' ? 'text-white' : 'text-indigo-600'}`} />
            <span className="text-xs sm:text-sm whitespace-nowrap">TỔNG QUAN</span>
          </div>
          <span
            className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md whitespace-nowrap ${
              activeMode === 'FULL_DAY'
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            Cả ngày
          </span>
        </button>
      </div>
    </div>
  );
};
