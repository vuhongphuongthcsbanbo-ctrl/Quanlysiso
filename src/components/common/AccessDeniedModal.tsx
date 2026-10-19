import React from 'react';
import { ShieldAlert, Home, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../../theme/designSystem';

interface AccessDeniedModalProps {
  attemptedResource?: string;
  onGoHome: () => void;
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({ attemptedResource, onGoHome }) => {
  const { currentUser } = useAuth();

  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-4 animate-in fade-in py-12">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs border border-rose-200">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 uppercase">
          BẠN KHÔNG CÓ QUYỀN TRUY CẬP NỘI DUNG NÀY
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Tài khoản <strong>{currentUser?.name || 'hiện tại'}</strong> với vai trò{' '}
          <span className="font-bold text-rose-700">{currentUser?.title || currentUser?.role}</span> không có quyền truy cập{' '}
          {attemptedResource ? `khu vực "${attemptedResource}"` : 'trang này'}.
        </p>
      </div>

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left space-y-1 max-w-md mx-auto">
        <div className="font-bold flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-amber-700" />
          <span>Chính sách phân quyền Trường THCS Bản Bo:</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          - Giáo viên chủ nhiệm quản lý và báo cáo sĩ số cho lớp được phân công.
          <br />- Tổng Phụ trách và Ban Giám hiệu quản lý tổng thể toàn trường và cấu hình hệ thống.
        </p>
      </div>

      <div className="pt-2">
        <AppButton
          variant="primary"
          size="md"
          startIcon={<Home className="w-4 h-4" />}
          onClick={onGoHome}
        >
          VỀ TRANG CHỦ
        </AppButton>
      </div>
    </div>
  );
};
