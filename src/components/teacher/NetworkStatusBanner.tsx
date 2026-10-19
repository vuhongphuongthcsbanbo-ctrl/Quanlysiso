import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [showReconnectedToast, setShowReconnectedToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      const timer = setTimeout(() => setShowReconnectedToast(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-amber-600 text-white px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50 animate-in fade-in select-none">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Bạn đang ngoại tuyến. Một số thao tác có thể chưa được đồng bộ.</span>
      </div>
    );
  }

  if (showReconnectedToast) {
    return (
      <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50 animate-in fade-in select-none">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Đã kết nối lại.</span>
      </div>
    );
  }

  return null;
};
