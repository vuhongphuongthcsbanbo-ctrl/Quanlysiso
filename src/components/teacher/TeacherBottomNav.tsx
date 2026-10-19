import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageId } from '../common/Sidebar';
import { storageService } from '../../services/storageService';
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  History,
  User,
  GraduationCap,
} from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';

interface TeacherBottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const TeacherBottomNav: React.FC<TeacherBottomNavProps> = ({
  currentPage,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const assignedClass = currentUser?.assignedClassName || '';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 py-1 shadow-lg print:hidden safe-area-bottom">
      <div className="grid grid-cols-5 items-center text-center">
        {/* 1. TRANG CHỦ */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'dashboard'
              ? 'text-blue-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">TRANG CHỦ</span>
        </button>

        {/* 2. BÁO SĨ SỐ (NỔI BẬT) */}
        <button
          type="button"
          onClick={() => onNavigate('attendance_report')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'attendance_report'
              ? 'text-emerald-700 font-extrabold'
              : 'text-emerald-600 font-bold'
          }`}
        >
          <div className="bg-emerald-600 text-white p-1 rounded-full shadow-xs -mt-2">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 text-emerald-800 tracking-tight">
            BÁO SĨ SỐ
          </span>
        </button>

        {/* 3. LỚP CỦA TÔI */}
        <button
          type="button"
          onClick={() => onNavigate('teacher_class')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'teacher_class'
              ? 'text-blue-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">
            LỚP {assignedClass || 'TÔI'}
          </span>
        </button>

        {/* 4. THÔNG BÁO (Mục LIX: có badge số chưa đọc) */}
        <NotificationBell
          isMobileTab={true}
          onNavigateToTarget={(page) => onNavigate(page as PageId)}
        />

        {/* 5. TÀI KHOẢN */}
        <button
          type="button"
          onClick={() => onNavigate('teacher_account')}
          className={`flex flex-col items-center py-1 cursor-pointer transition-colors ${
            currentPage === 'teacher_account'
              ? 'text-blue-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">TÀI KHOẢN</span>
        </button>
      </div>
    </nav>
  );
};
