import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { formatVietnameseDate, getTodayDateString } from '../../utils/formatters';
import { User } from '../../types';
import {
  ChevronDown,
  LogOut,
  Search,
  Menu,
  BookOpen,
  GraduationCap,
  Calendar,
  Building2,
  Shield,
  UserCheck,
  Download,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { trainingService } from '../../services/trainingService';
import { SchoolLogo } from '../../theme/designSystem';
import { PWAInstallModal } from './PWAInstallModal';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onToggleMobileMenu: () => void;
  onOpenSearch: () => void;
  onResetDemo?: () => void;
  onNavigate?: (page: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  onToggleMobileMenu,
  onOpenSearch,
  onNavigate,
}) => {
  const { currentUser, switchUser, logout, isAdmin, isTeacher } = useAuth();
  const settings = storageService.getSettings();
  const allUsers = storageService.getUsers();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  const [isTrainingActive, setIsTrainingActive] = useState<boolean>(() => trainingService.isTrainingMode());

  // Lọc danh sách người dùng cho nút "Đổi vai trò":
  // Xóa bỏ hoàn toàn thầy Hoàng Xuân Nhật với vai trò giáo viên (thầy chỉ có duy nhất vai trò Hiệu trưởng - Ban Giám Hiệu)
  const roleSwitcherUsers = useMemo(() => {
    const filtered = allUsers.filter((u) => {
      const isNhat = (u.name || '').includes('Hoàng Xuân Nhật') || (u.fullName || '').includes('Hoàng Xuân Nhật');
      if (isNhat) {
        const r = u.role as string;
        if (
          r === 'teacher_gvcn' ||
          r === 'HEAD_TEACHER' ||
          r === 'teacher' ||
          r === 'TEACHER' ||
          r !== 'principal' ||
          (u.title || '').toLowerCase().includes('giáo viên') ||
          (u.title || '').toLowerCase().includes('gvcn') ||
          u.assignedClassName ||
          u.id !== 'user_bgh'
        ) {
          return false;
        }
      }
      return true;
    });

    const seen = new Set<string>();
    return filtered.filter((u) => {
      const key = `${u.name}_${u.role}`;
      if (seen.has(key) || seen.has(u.id)) return false;
      seen.add(key);
      seen.add(u.id);
      return true;
    });
  }, [allUsers]);

  useEffect(() => {
    const handleModeChange = () => {
      setIsTrainingActive(trainingService.isTrainingMode());
    };
    window.addEventListener('thcs_banbo_training_mode_changed', handleModeChange);
    return () => window.removeEventListener('thcs_banbo_training_mode_changed', handleModeChange);
  }, []);

  const getRoleBadge = (role?: string, user?: User | null) => {
    // Thầy Vũ Hồng Phương CHỈ LÀ QUẢN TRỊ VIÊN (Admin), KHÔNG PHẢI TỔNG PHỤ TRÁCH ĐỘI
    const isVu = user && (user.id === 'user_vuhongphuong' || (user.name || '').includes('Vũ Hồng Phương') || (user.fullName || '').includes('Vũ Hồng Phương'));
    if (isVu) {
      return <span className="text-[11px] bg-purple-50 text-purple-800 border border-purple-200 font-bold px-2 py-0.5 rounded-lg">Quản trị viên</span>;
    }

    const isThuy = user && (user.id === 'user_tpt' || (user.name || '').includes('Phạm Ngọc Thúy') || (user.fullName || '').includes('Phạm Ngọc Thúy'));
    if (isThuy) {
      return <span className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2 py-0.5 rounded-lg">Tổng Phụ trách Đội</span>;
    }

    switch (role) {
      case 'ADMIN':
        return <span className="text-[11px] bg-purple-50 text-purple-800 border border-purple-200 font-bold px-2 py-0.5 rounded-lg">Quản trị viên</span>;
      case 'admin_tpt':
        return <span className="text-[11px] bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2 py-0.5 rounded-lg">Tổng Phụ trách Đội</span>;
      case 'principal':
      case 'BOARD_OF_MANAGEMENT':
        return <span className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-lg">Hiệu trưởng</span>;
      case 'teacher_gvcn':
      case 'HEAD_TEACHER':
        return <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-lg">GVCN</span>;
      case 'viewer':
      case 'VIEWER':
        return <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-lg">Bán trú</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs print:hidden">
      {/* Top Banner Notice: TRAINING MODE */}
      {isTrainingActive && (
        <div className="bg-purple-900 text-white px-3 py-1.5 text-xs flex items-center justify-between font-medium shadow-inner">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-black uppercase text-[10px] tracking-wider animate-pulse flex items-center gap-1">
              🎓 CHẾ ĐỘ THỰC HÀNH
            </span>
            <span className="text-slate-100 text-[11px] sm:text-xs truncate">
              DỮ LIỆU KHÔNG ĐƯỢC TÍNH VÀO BÁO CÁO CHÍNH THỨC TRƯỜNG THCS BẢN BO
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate?.('training_guide')}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              Cẩm nang & Trắc nghiệm
            </button>
            <button
              onClick={() => {
                trainingService.setTrainingMode(false);
                setIsTrainingActive(false);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              Thoát tập huấn
            </button>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle + School Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            aria-label="Mở danh mục điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none min-w-0"
          >
            <SchoolLogo logoUrl={settings.logoUrl} size="md" />

            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {settings.schoolAddress || 'Xã Bản Bo · Lai Châu'}
              </div>
              <h1 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-tight truncate leading-tight">
                {settings.schoolName || 'TRƯỜNG THCS BẢN BO'}
              </h1>
              <div className="hidden sm:block text-[10px] font-bold text-amber-700 uppercase tracking-wider truncate">
                HỆ THỐNG QUẢN LÝ SĨ SỐ HỌC SINH
              </div>
            </div>
          </div>
        </div>

        {/* Center: Date Context */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatVietnameseDate(currentDate)}</span>
          {currentDate !== getTodayDateString() && (
            <button
              onClick={() => onDateChange(getTodayDateString())}
              className="ml-1 text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
          )}
        </div>

        {/* Right: Controls (Search, Training, Fast Switcher, Notifications, User) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Tìm kiếm học sinh, lớp, giáo viên"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </button>

          {/* Quick Button to Training & Operational Guide */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('training_guide')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl cursor-pointer transition-all"
              title="Cẩm nang vận hành & Chế độ tập huấn"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="hidden lg:inline">Tập huấn</span>
            </button>
          )}

          {/* Nút Cài đặt App vào điện thoại & máy tính */}
          <button
            type="button"
            onClick={() => setShowPWAInstallModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all shadow-2xs"
            title="Cài đặt App vào máy tính & điện thoại cho GVCN"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Cài đặt App</span>
          </button>

          {/* Fast Role Switcher Dropdown (Essential for testing all roles) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleSwitcher(!showRoleSwitcher);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
              title="Chuyển đổi vai trò thử nghiệm"
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Đổi vai trò</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm nhanh:
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1 py-1">
                  {roleSwitcherUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        currentUser?.id === u.id
                          ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {u.title} {u.assignedClassName ? `(${u.assignedClassName})` : ''}
                        </div>
                      </div>
                      {getRoleBadge(u.role, u)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell with Badge */}
          <NotificationBell onNavigateToTarget={(page) => onNavigate?.(page)} />

          {/* User Account Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleSwitcher(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs border border-blue-200">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {currentUser?.title || (isTeacher ? `GVCN ${currentUser?.assignedClassName || ''}` : 'Quản trị')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 border-b border-slate-100 space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser?.email}</div>
                  <div className="pt-1">{getRoleBadge(currentUser?.role, currentUser)}</div>
                </div>

                <div className="py-1 space-y-0.5 text-xs">
                  {isTeacher && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate?.('teacher_account');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl font-medium cursor-pointer"
                    >
                      Tài khoản & Đổi mật khẩu
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate?.('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl font-medium cursor-pointer"
                    >
                      Cài đặt trường học
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate?.('training_guide');
                    }}
                    className="w-full text-left px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold cursor-pointer"
                  >
                    Cẩm nang & Tập huấn
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Hướng dẫn & Cài đặt App cho GVCN */}
      <PWAInstallModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
      />
    </header>
  );
};
