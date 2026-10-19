import React from 'react';
import { AttendanceReport } from '../../types';
import { SessionStatusBadge } from '../common/SessionStatusBadge';
import { Sun, ClipboardCheck, AlertTriangle, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface MorningAttendanceCardProps {
  report: AttendanceReport | null;
  isRecommended: boolean;
  onSelect: () => void;
}

export const MorningAttendanceCard: React.FC<MorningAttendanceCardProps> = ({
  report,
  isRecommended,
  onSelect,
}) => {
  const settings = storageService.getSettings();
  const deadlineStr = settings.morningDeadlineTime || '07:20';
  const status = report ? report.status : 'NOT_SUBMITTED';
  const normStatus = (status as string).toUpperCase();
  const isPending = normStatus === 'PENDING_APPROVAL' || normStatus === 'SUBMITTED';
  const isRevision = normStatus === 'REVISION_REQUIRED' || normStatus === 'NEEDS_REVISION';
  const isApproved = normStatus === 'APPROVED';
  const isLocked = normStatus === 'LOCKED';
  const isUnsubmitted = !report || normStatus === 'NOT_SUBMITTED' || normStatus === 'NOT_REPORTED';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isRevision
          ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/30'
          : isRecommended && isUnsubmitted
          ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/30 shadow-md'
          : isApproved
          ? 'bg-emerald-50/40 border-emerald-300'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="p-4 space-y-3">
        {/* Header: Buổi sáng */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 uppercase">BUỔI SÁNG</span>
                {isRecommended && isUnsubmitted && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-md tracking-wider">
                    HIỆN TẠI
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Báo cáo trước {deadlineStr}</div>
            </div>
          </div>

          <SessionStatusBadge
            status={report?.status}
            timeStr={report?.approvedAt?.split(' ')[1] || report?.submittedAt?.split(' ')[1]}
            size="sm"
          />
        </div>

        {/* Số liệu thống kê nếu đã báo cáo */}
        {report && !isUnsubmitted && (
          <div className="grid grid-cols-4 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 text-center text-xs shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold">Sĩ số</span>
              <div className="font-black text-slate-900 mt-0.5">{report.totalStudents}</div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-semibold">Có mặt</span>
              <div className="font-black text-emerald-700 mt-0.5">{report.presentCount}</div>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 font-semibold">Vắng</span>
              <div className="font-black text-rose-700 mt-0.5">{report.absentCount}</div>
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-semibold">Ăn BT</span>
              <div className="font-black text-amber-700 mt-0.5">{report.boardingPresent}</div>
            </div>
          </div>
        )}

        {/* Cảnh báo chỉnh sửa nếu có */}
        {isRevision && (
          <div className="p-2.5 bg-white rounded-xl border border-rose-300 text-xs text-rose-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-900">Yêu cầu sửa:</div>
              <div className="italic">{report?.revisionReason || 'Vui lòng kiểm tra lại danh sách vắng.'}</div>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div>
          {isUnsubmitted && (
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ring-2 ring-emerald-500/20"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>BÁO SĨ SỐ BUỔI SÁNG</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          )}

          {isPending && (
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>XEM & CHỈNH SỬA BÁO CÁO SÁNG</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          )}

          {isRevision && (
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>CHỈNH SỬA BÁO CÁO SÁNG THEO YÊU CẦU</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          )}

          {isApproved && (
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>XEM CHI TIẾT BÁO CÁO SÁNG ĐÃ DUYỆT</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-60" />
            </button>
          )}

          {isLocked && (
            <button
              type="button"
              onClick={onSelect}
              className="w-full py-2.5 px-4 bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-blue-400" />
              <span>XEM BÁO CÁO SÁNG ĐÃ CHỐT</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
