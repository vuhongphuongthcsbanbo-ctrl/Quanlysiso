import React from 'react';
import { FileQuestion, Home } from 'lucide-react';
import { AppButton } from '../theme/designSystem';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
        <FileQuestion className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-900 uppercase">
          KHÔNG TÌM THẤY TRANG
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Đường dẫn Thầy/Cô đang truy cập không tồn tại hoặc đã được chuyển sang vị trí mới trong hệ thống.
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
