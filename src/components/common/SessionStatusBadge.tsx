import React from 'react';
import { ReportStatus } from '../../types';
import { Clock, CheckCircle2, AlertTriangle, Lock, AlertCircle } from 'lucide-react';

interface SessionStatusBadgeProps {
  status?: ReportStatus;
  timeStr?: string;
  size?: 'sm' | 'md';
}

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({
  status = 'NOT_SUBMITTED',
  timeStr,
  size = 'md',
}) => {
  const normStatus = (status as string).toUpperCase();

  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (normStatus === 'APPROVED') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 ${padding}`}>
        <CheckCircle2 className={`${iconSize} text-emerald-600 shrink-0`} />
        <span>ĐÃ DUYỆT</span>
        {timeStr && <span className="opacity-75 font-mono text-[10px] ml-0.5">{timeStr}</span>}
      </span>
    );
  }

  if (normStatus === 'PENDING_APPROVAL' || normStatus === 'SUBMITTED') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 ${padding}`}>
        <Clock className={`${iconSize} text-amber-600 shrink-0`} />
        <span>ĐÃ GỬI – CHỜ DUYỆT</span>
        {timeStr && <span className="opacity-75 font-mono text-[10px] ml-0.5">{timeStr}</span>}
      </span>
    );
  }

  if (normStatus === 'REVISION_REQUIRED' || normStatus === 'NEEDS_REVISION') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-rose-100 text-rose-900 border border-rose-400 ${padding}`}>
        <AlertTriangle className={`${iconSize} text-rose-600 shrink-0`} />
        <span>CẦN CHỈNH SỬA</span>
      </span>
    );
  }

  if (normStatus === 'LOCKED') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-slate-200 text-slate-800 border border-slate-300 ${padding}`}>
        <Lock className={`${iconSize} text-slate-600 shrink-0`} />
        <span>ĐÃ CHỐT KHÓA</span>
        {timeStr && <span className="opacity-75 font-mono text-[10px] ml-0.5">{timeStr}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-300 ${padding}`}>
      <AlertCircle className={`${iconSize} text-slate-400 shrink-0`} />
      <span>CHƯA BÁO CÁO</span>
    </span>
  );
};
