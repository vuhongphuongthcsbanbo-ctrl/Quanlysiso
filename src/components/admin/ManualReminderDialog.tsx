import React, { useState } from 'react';
import { reminderService } from '../../services/reminderService';
import { storageService } from '../../services/storageService';
import { SchoolClass, SessionType } from '../../types';
import {
  Send,
  X,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  Users,
} from 'lucide-react';

interface ManualReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  session: SessionType;
  // If targetClass is provided, it's single mode; if targetClassIds is provided, it's bulk mode
  targetClass?: SchoolClass | null;
  targetClassIds?: string[];
  onSentSuccess?: () => void;
}

export const ManualReminderDialog: React.FC<ManualReminderDialogProps> = ({
  isOpen,
  onClose,
  date,
  session,
  targetClass,
  targetClassIds,
  onSentSuccess,
}) => {
  const settings = storageService.getSettings();
  const deadlineTime = settings.morningDeadlineTime || '07:20';

  const isBulkMode = !!targetClassIds && targetClassIds.length > 0 && !targetClass;

  const defaultSingleMessage = targetClass
    ? `Vui lòng hoàn thành báo cáo sĩ số Lớp ${targetClass.name} buổi sáng hôm nay trước ${deadlineTime}.`
    : `Vui lòng hoàn thành báo cáo sĩ số buổi sáng hôm nay trước ${deadlineTime}.`;

  const [message, setMessage] = useState(defaultSingleMessage);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  // Với bulk mode: lấy danh sách các lớp cụ thể
  const allClasses = storageService.getClasses();
  const bulkClasses = isBulkMode
    ? allClasses.filter((c) => targetClassIds.includes(c.id))
    : [];

  const handleSendSingle = () => {
    if (!targetClass) return;
    setIsSending(true);
    setFeedback(null);

    try {
      const res = reminderService.sendManualReminder(
        targetClass.id,
        date,
        session,
        message,
        'Tổng Phụ trách'
      );
      if (res.success) {
        setFeedback({ success: true, text: res.message });
        setTimeout(() => {
          onSentSuccess?.();
          onClose();
        }, 1200);
      } else {
        setFeedback({ success: false, text: res.message });
      }
    } catch {
      setFeedback({ success: false, text: 'Đã xảy ra lỗi khi gửi nhắc nhở' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulk = () => {
    if (!targetClassIds || targetClassIds.length === 0) return;
    setIsSending(true);
    setFeedback(null);

    try {
      const res = reminderService.sendBulkManualReminder(
        targetClassIds,
        date,
        session,
        message,
        'Tổng Phụ trách'
      );

      let text = `Đã gửi nhắc thành công tới ${res.sentCount} GVCN (${res.sentClasses.join(', ')}).`;
      if (res.skippedCount > 0) {
        text += ` Đã tự động bỏ qua ${res.skippedCount} lớp đã nộp (${res.skippedClasses.join(', ')}).`;
      }

      setFeedback({ success: true, text });
      setTimeout(() => {
        onSentSuccess?.();
        onClose();
      }, 1800);
    } catch {
      setFeedback({ success: false, text: 'Đã xảy ra lỗi khi gửi nhắc hàng loạt' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isBulkMode ? 'GỬI NHẮC CÁC LỚP CHƯA BÁO CÁO' : `GỬI NHẮC LỚP ${targetClass?.name}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isBulkMode
                  ? `Nhắc đồng loạt ${bulkClasses.length} lớp chưa nộp sĩ số`
                  : `GVCN: ${targetClass?.teacherName || 'Chưa phân công'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Danh sách lớp nhận nhắc nếu ở chế độ bulk */}
          {isBulkMode && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Danh sách {bulkClasses.length} GVCN sẽ nhận nhắc nhở:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {bulkClasses.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs font-bold bg-white text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    {c.name} ({c.teacherName || 'GVCN'})
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 italic">
                * Hệ thống sẽ tự động kiểm tra lại ngay trước khi gửi: nếu lớp vừa nộp thì sẽ tự động loại bỏ.
              </p>
            </div>
          )}

          {/* Nội dung thông báo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Nội dung tin nhắn nhắc nhở:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              placeholder="Nhập nội dung nhắc nhở..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Hạn chót buổi sáng: {deadlineTime}</span>
              <button
                type="button"
                onClick={() => setMessage(defaultSingleMessage)}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Đặt lại mẫu mặc định
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isSending || !message.trim()}
            onClick={isBulkMode ? handleSendBulk : handleSendSingle}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending
                ? 'Đang gửi...'
                : isBulkMode
                ? `Gửi nhắc tới ${bulkClasses.length} GVCN`
                : 'Gửi nhắc ngay'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
