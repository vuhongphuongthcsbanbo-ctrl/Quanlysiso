import React from 'react';
import { SessionType, normalizeSession, getSessionDisplayName } from '../../types';
import { Sun, Sunset, CalendarRange } from 'lucide-react';

export type ExtendedSessionMode = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

interface SessionSelectorProps {
  currentSession: ExtendedSessionMode;
  onChange: (session: ExtendedSessionMode) => void;
  showFullDayOption?: boolean;
  morningCount?: number;
  afternoonCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  currentSession,
  onChange,
  showFullDayOption = true,
  morningCount,
  afternoonCount,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <div className={`inline-flex items-center p-1 bg-slate-200/80 rounded-2xl gap-1 ${className}`}>
      {/* NÚT BUỔI SÁNG */}
      <button
        type="button"
        onClick={() => onChange('MORNING')}
        className={`flex items-center gap-2 rounded-xl font-black transition-all cursor-pointer select-none ${
          isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          currentSession === 'MORNING'
            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
        }`}
      >
        <Sun className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-current shrink-0`} />
        <span>BUỔI SÁNG</span>
        {morningCount !== undefined && (
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              currentSession === 'MORNING' ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-800'
            }`}
          >
            {morningCount}
          </span>
        )}
      </button>

      {/* NÚT BUỔI CHIỀU */}
      <button
        type="button"
        onClick={() => onChange('AFTERNOON')}
        className={`flex items-center gap-2 rounded-xl font-black transition-all cursor-pointer select-none ${
          isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
        } ${
          currentSession === 'AFTERNOON'
            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
        }`}
      >
        <Sunset className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-current shrink-0`} />
        <span>BUỔI CHIỀU</span>
        {afternoonCount !== undefined && (
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              currentSession === 'AFTERNOON' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-800'
            }`}
          >
            {afternoonCount}
          </span>
        )}
      </button>

      {/* TÙY CHỌN CẢ NGÀY */}
      {showFullDayOption && (
        <button
          type="button"
          onClick={() => onChange('FULL_DAY')}
          className={`flex items-center gap-2 rounded-xl font-black transition-all cursor-pointer select-none ${
            isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
          } ${
            currentSession === 'FULL_DAY'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-800/30'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <CalendarRange className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-current shrink-0`} />
          <span>CẢ NGÀY</span>
        </button>
      )}
    </div>
  );
};
