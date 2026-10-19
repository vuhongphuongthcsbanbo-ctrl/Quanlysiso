import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { NotificationCard } from './NotificationCard';
import {
  Bell,
  X,
  CheckCheck,
  Filter,
  Inbox,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTarget: (targetPage: string, metadata?: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateToTarget,
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REMINDERS' | 'REVISIONS'>('ALL');

  const loadNotifications = () => {
    if (!currentUser) return;
    const list = notificationService.getNotificationsForUser(currentUser.id, currentUser.role);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'REMINDERS') {
      return (
        n.type === 'ATTENDANCE_REMINDER' ||
        n.type === 'ATTENDANCE_OVERDUE' ||
        n.priority === 'HIGH' ||
        n.priority === 'URGENT'
      );
    }
    if (filter === 'REVISIONS') {
      return n.type === 'ATTENDANCE_REVISION_REQUIRED';
    }
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    notificationService.markAllAsReadForUser(currentUser.id, currentUser.role);
    loadNotifications();
  };

  const handleActionClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    onClose();

    // Điều hướng thông minh theo loại nghiệp vụ (Mục XXII)
    if (notif.type === 'ATTENDANCE_REVISION_REQUIRED' || notif.type === 'ATTENDANCE_REMINDER' || notif.type === 'ATTENDANCE_OVERDUE') {
      onNavigateToTarget('attendance_report', { classId: notif.classId, session: notif.session });
    } else if (notif.type === 'ATTENDANCE_APPROVED') {
      onNavigateToTarget('teacher_history', { classId: notif.classId });
    } else if (notif.type === 'ATTENDANCE_SUBMITTED' || notif.type === 'ATTENDANCE_RESUBMITTED') {
      onNavigateToTarget('dashboard', { classId: notif.classId, session: notif.session });
    } else if (notif.actionUrl) {
      onNavigateToTarget(notif.actionUrl, { classId: notif.classId });
    } else {
      onNavigateToTarget('dashboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="Đóng bảng thông báo"
      />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  TRUNG TÂM THÔNG BÁO
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Trường THCS Bản Bo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Filters & Mark all read */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'UNREAD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter('REMINDERS')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'REMINDERS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nhắc nhở
            </button>

            <button
              type="button"
              onClick={() => setFilter('REVISIONS')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                filter === 'REVISIONS'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cần sửa
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer hover:underline"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                Bạn chưa có thông báo mới.
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Hệ thống sẽ tự động gửi thông báo khi đến giờ báo cáo, có nhắc nhở sĩ số, hoặc khi báo cáo được duyệt.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkAsRead={handleMarkAsRead}
                onActionClick={handleActionClick}
              />
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Thông báo được đồng bộ theo thời gian thực (Múi giờ Việt Nam GMT+7)
        </div>
      </div>
    </div>
  );
};
