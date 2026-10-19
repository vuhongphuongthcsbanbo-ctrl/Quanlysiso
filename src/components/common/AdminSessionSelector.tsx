import React from 'react';
import { Sun, Sunset, CalendarRange } from 'lucide-react';

export type AdminDashboardSessionView = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

interface AdminSessionSelectorProps {
  currentView: AdminDashboardSessionView;
  onChange: (view: AdminDashboardSessionView) => void;
  morningSubmitted: number;
  morningTotal: number;
  afternoonSubmitted: number;
  afternoonTotal: number;
}

export const AdminSessionSelector: React.FC<AdminSessionSelectorProps> = ({
  currentView,
  onChange,
  morningSubmitted,
  morningTotal,
  afternoonSubmitted,
  afternoonTotal,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
      {/* NÚT BUỔI SÁNG */}
      <button
        type="button"
        onClick={() => onChange('MORNING')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer select-none ${
          currentView === 'MORNING'
            ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-400/40'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
        }`}
      >
        <Sun className="w-4 h-4 shrink-0 text-current" />
        <span>BUỔI SÁNG</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            currentView === 'MORNING' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'
          }`}
        >
          {morningSubmitted}/{morningTotal}
        </span>
      </button>

      {/* NÚT BUỔI CHIỀU */}
      <button
        type="button"
        onClick={() => onChange('AFTERNOON')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer select-none ${
          currentView === 'AFTERNOON'
            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
        }`}
      >
        <Sunset className="w-4 h-4 shrink-0 text-current" />
        <span>BUỔI CHIỀU</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
            currentView === 'AFTERNOON' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
          }`}
        >
          {afternoonSubmitted}/{afternoonTotal}
        </span>
      </button>

      {/* NÚT CẢ NGÀY */}
      <button
        type="button"
        onClick={() => onChange('FULL_DAY')}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer select-none ${
          currentView === 'FULL_DAY'
            ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-800/40'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
        }`}
      >
        <CalendarRange className="w-4 h-4 shrink-0 text-current" />
        <span>TỔNG QUAN CẢ NGÀY</span>
      </button>
    </div>
  );
};
