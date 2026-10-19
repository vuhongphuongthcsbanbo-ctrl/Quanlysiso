import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  onNavigateToTarget: (targetPage: string, metadata?: any) => void;
  className?: string;
  isMobileTab?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigateToTarget,
  className = '',
  isMobileTab = false,
}) => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const updateCount = () => {
    if (!currentUser) return;
    const count = notificationService.getUnreadCount(currentUser.id, currentUser.role);
    setUnreadCount(count);
  };

  useEffect(() => {
    updateCount();
    const unsub = notificationService.subscribe(() => {
      updateCount();
    });
    return () => unsub();
  }, [currentUser]);

  if (isMobileTab) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center py-1 cursor-pointer transition-colors relative text-slate-500 hover:text-slate-900"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center ring-2 ring-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">THÔNG BÁO</span>
        </button>

        <NotificationCenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onNavigateToTarget={onNavigateToTarget}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${className}`}
        title={`Thông báo (${unreadCount} chưa đọc)`}
        aria-label="Mở trung tâm thông báo"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNavigateToTarget={onNavigateToTarget}
      />
    </>
  );
};
