import React from 'react';
import { PageId } from './Sidebar';
import {
  LayoutDashboard,
  Clock,
  UserX,
  FileSpreadsheet,
  Menu,
} from 'lucide-react';

interface MobileBottomBarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMenu: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentPage,
  onNavigate,
  onOpenMenu,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1 shadow-lg print:hidden safe-area-bottom">
      <div className="grid grid-cols-5 items-center text-center">
        {/* 1. TỔNG QUAN */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'dashboard' ? 'text-blue-800 font-black' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Về trang tổng quan"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight uppercase">TỔNG QUAN</span>
        </button>

        {/* 2. CHỜ DUYỆT */}
        <button
          onClick={() => onNavigate('unreported_classes')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'unreported_classes' ? 'text-amber-800 font-black' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Xem các lớp chờ duyệt"
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight uppercase">CHỜ DUYỆT</span>
        </button>

        {/* 3. VẮNG */}
        <button
          onClick={() => onNavigate('absent_students')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'absent_students' ? 'text-rose-700 font-black' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Xem học sinh vắng"
        >
          <UserX className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight uppercase">HS VẮNG</span>
        </button>

        {/* 4. BÁO CÁO */}
        <button
          onClick={() => onNavigate('reports')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'reports' ? 'text-blue-800 font-black' : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Xem báo cáo và xuất file"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight uppercase">BÁO CÁO</span>
        </button>

        {/* 5. THÊM */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center py-1 cursor-pointer text-slate-500 hover:text-slate-900 font-medium"
          aria-label="Mở menu quản trị khác"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight uppercase">THÊM</span>
        </button>
      </div>
    </div>
  );
};
