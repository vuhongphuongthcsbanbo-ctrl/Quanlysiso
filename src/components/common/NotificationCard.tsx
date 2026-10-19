import React from 'react';
import { AppNotification, NotificationPriority, NotificationType } from '../../types';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  ExternalLink,
  Lock,
  Info,
} from 'lucide-react';

interface NotificationCardProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onActionClick?: (notification: AppNotification) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onActionClick,
}) => {
  const getIcon = (type: NotificationType, priority: NotificationPriority) => {
    switch (type) {
      case 'ATTENDANCE_REVISION_REQUIRED':
        return <RotateCcw className="w-5 h-5 text-rose-600" />;
      case 'ATTENDANCE_OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'ATTENDANCE_REMINDER':
        return priority === 'HIGH' ? (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        ) : (
          <Clock className="w-5 h-5 text-blue-600" />
        );
      case 'ATTENDANCE_APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'ATTENDANCE_SUBMITTED':
      case 'ATTENDANCE_RESUBMITTED':
        return <Check className="w-5 h-5 text-blue-600" />;
      case 'REPORT_FINALIZED':
        return <Lock className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[10px] uppercase font-black bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded">
            Khẩn cấp
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
            Ưu tiên cao
          </span>
        );
      default:
        return null;
    }
  };

  const getActionLabel = (type: NotificationType) => {
    switch (type) {
      case 'ATTENDANCE_REVISION_REQUIRED':
        return 'XEM VÀ CHỈNH SỬA';
      case 'ATTENDANCE_REMINDER':
      case 'ATTENDANCE_OVERDUE':
        return 'BÁO SĨ SỐ NGAY';
      case 'ATTENDANCE_APPROVED':
        return 'XEM BÁO CÁO';
      case 'ATTENDANCE_SUBMITTED':
      case 'ATTENDANCE_RESUBMITTED':
        return 'XEM VÀ DUYỆT';
      case 'REPORT_FINALIZED':
        return 'XEM BÁO CÁO TOÀN TRƯỜNG';
      default:
        return 'CHI TIẾT';
    }
  };

  return (
    <div
      className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
        !notification.isRead
          ? 'bg-blue-50/70 border-blue-200 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 rounded-full ring-4 ring-blue-100 animate-pulse" />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            notification.priority === 'URGENT'
              ? 'bg-rose-100'
              : notification.priority === 'HIGH'
              ? 'bg-amber-100'
              : 'bg-slate-100'
          }`}
        >
          {getIcon(notification.type, notification.priority)}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h4
              className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-1 ${
                !notification.isRead ? 'text-slate-900' : 'text-slate-800'
              }`}
            >
              {notification.title}
            </h4>
            {getPriorityBadge(notification.priority)}
            {notification.className && (
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                Lớp {notification.className}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-2 break-words">
            {notification.message}
          </p>

          {/* Hộp hiển thị lý do yêu cầu chỉnh sửa (Mục XXI) */}
          {notification.type === 'ATTENDANCE_REVISION_REQUIRED' &&
            notification.metadata?.revisionReason && (
              <div className="p-2.5 mb-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <span className="font-bold text-rose-950 block mb-0.5">Nội dung yêu cầu chỉnh sửa:</span>
                <span className="italic">{notification.metadata.revisionReason}</span>
              </div>
            )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-400">
            <span>{notification.createdAt}</span>

            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer font-medium"
                >
                  Đánh dấu đã đọc
                </button>
              )}

              {onActionClick && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkAsRead(notification.id);
                    onActionClick(notification);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                    notification.type === 'ATTENDANCE_REVISION_REQUIRED'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : notification.type === 'ATTENDANCE_OVERDUE'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : notification.type === 'ATTENDANCE_REMINDER'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>{getActionLabel(notification.type)}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
