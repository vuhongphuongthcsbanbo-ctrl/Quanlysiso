import React from 'react';
import { Wrench, Shield, RefreshCw } from 'lucide-react';
import { SchoolLogo, AppButton } from '../theme/designSystem';
import { storageService } from '../services/storageService';

export const MaintenancePage: React.FC = () => {
  const settings = storageService.getSettings();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
        <div className="flex justify-center">
          <SchoolLogo logoUrl={settings.logoUrl} size="lg" />
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            XÃ BẢN BO · TỈNH LAI CHÂU
          </div>
          <h1 className="text-xl font-black text-blue-900 uppercase tracking-tight mt-0.5">
            {settings.schoolName || 'TRƯỜNG THCS BẢN BO'}
          </h1>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Wrench className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-amber-950">
            Hệ thống đang được bảo trì.
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Hệ thống quản lý sĩ số đang thực hiện nâng cấp kỹ thuật định kỳ. Vui lòng quay lại sau.
          </p>
        </div>

        <div className="pt-2">
          <AppButton
            variant="secondary"
            size="md"
            startIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => window.location.reload()}
          >
            TẢI LẠI TRANG
          </AppButton>
        </div>

        <div className="text-[10px] text-slate-400">
          Ban Quản trị Hệ thống: Cô Phạm Ngọc Thúy (Tổng phụ trách)
        </div>
      </div>
    </div>
  );
};
