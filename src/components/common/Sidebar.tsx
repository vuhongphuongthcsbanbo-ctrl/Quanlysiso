import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  UserX,
  UtensilsCrossed,
  Users,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
  UserCog,
  Settings,
  LogOut,
  X,
  FileUp,
  ShieldCheck,
  TrendingUp,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Rocket,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'attendance_report'
  | 'morning_progress'
  | 'school_calendar'
  | 'teacher_class'
  | 'teacher_history'
  | 'teacher_account'
  | 'import_students'
  | 'boarding_management'
  | 'dataset_verification'
  | 'unreported_classes'
  | 'classes_attendance'
  | 'absent_students'
  | 'boarding'
  | 'day_students'
  | 'statistics'
  | 'reports'
  | 'students'
  | 'classes'
  | 'teachers'
  | 'accounts'
  | 'audit_log'
  | 'settings'
  | 'training_guide'
  | 'operational_readiness'
  | 'handover_operations';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, isAdmin, isTeacher, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleNav = (page: PageId) => {
    onNavigate(page);
    onCloseMobile();
  };

  // Menu Groups per Requirement XVII
  const navGroups: NavGroup[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
        {
          id: 'attendance_report',
          label: isTeacher ? `Báo sĩ số lớp ${currentUser?.assignedClassName || ''}` : 'Báo cáo điểm danh',
          icon: ClipboardCheck,
          highlight: true,
          badge: isTeacher ? (currentUser?.assignedClassName || 'Lớp') : 'Điểm danh',
        },
      ],
    },
    {
      title: 'SĨ SỐ HỌC SINH',
      items: [
        { id: 'morning_progress', label: 'Tiến độ hôm nay', icon: TrendingUp },
        { id: 'unreported_classes', label: 'Lớp chờ duyệt / chưa báo', icon: Clock },
        { id: 'classes_attendance', label: 'Sĩ số 20 lớp', icon: Building2 },
        { id: 'absent_students', label: 'Học sinh vắng', icon: UserX },
        { id: 'boarding', label: 'Bán trú hôm nay', icon: UtensilsCrossed },
        { id: 'day_students', label: 'Ngoại trú hôm nay', icon: Users },
      ],
    },
    {
      title: 'BÁO CÁO & XUẤT',
      items: [
        { id: 'reports', label: 'Báo cáo ngày/tuần/tháng', icon: FileSpreadsheet },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'QUẢN LÝ DỮ LIỆU',
            items: [
              { id: 'students' as PageId, label: 'Danh sách học sinh', icon: GraduationCap },
              { id: 'classes' as PageId, label: 'Danh sách 20 lớp', icon: Building2 },
              { id: 'teachers' as PageId, label: 'Giáo viên & GVCN', icon: Briefcase },
              { id: 'boarding_management' as PageId, label: 'Phân loại bán trú', icon: UtensilsCrossed },
              { id: 'import_students' as PageId, label: 'Nhập học sinh (Excel)', icon: FileUp, highlight: true },
              { id: 'dataset_verification' as PageId, label: 'Kiểm tra dữ liệu', icon: ShieldCheck },
            ],
          },
          {
            title: 'HỆ THỐNG',
            items: [
              { id: 'accounts' as PageId, label: 'Quản lý tài khoản', icon: UserCog },
              { id: 'school_calendar' as PageId, label: 'Lịch học & Nghỉ lễ', icon: Calendar },
              { id: 'operational_readiness' as PageId, label: 'Kiểm tra sẵn sàng', icon: ShieldCheck },
              { id: 'handover_operations' as PageId, label: 'Bàn giao & Vận hành', icon: Rocket, highlight: true, badge: 'Go-Live' },
              { id: 'audit_log' as PageId, label: 'Lịch sử chỉnh sửa', icon: Sparkles },
              { id: 'settings' as PageId, label: 'Cài đặt hệ thống', icon: Settings },
            ],
          },
        ]
      : []),
    {
      title: 'HỖ TRỢ & VẬN HÀNH',
      items: [
        { id: 'training_guide' as PageId, label: 'Cẩm nang & Tập huấn', icon: BookOpen, highlight: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-200 flex flex-col transition-all duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="truncate">
              <div className="text-[10px] font-bold text-amber-400 tracking-wider uppercase truncate">
                THCS Bản Bo · Lai Châu
              </div>
              <div className="text-xs font-black text-white tracking-tight uppercase truncate">
                QUẢN LÝ SĨ SỐ HỌC SINH
              </div>
            </div>
          ) : (
            <div className="mx-auto font-black text-amber-400 text-xs">BB</div>
          )}

          {/* Close on Mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse on Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 cursor-pointer"
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Report CTA for Teachers */}
        {isTeacher && !isCollapsed && (
          <div className="p-2.5 bg-blue-950/60 border-b border-blue-900/40">
            <button
              onClick={() => handleNav('attendance_report')}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>BÁO SĨ SỐ LỚP {currentUser?.assignedClassName || ''}</span>
            </button>
          </div>
        )}

        {/* Navigation Groups & Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              {isCollapsed && <div className="border-t border-slate-800 my-2" />}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                    } text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                      item.highlight && !isActive
                        ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/30'
                        : isActive
                        ? 'bg-blue-700 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          isActive
                            ? 'bg-blue-900 text-white'
                            : 'bg-emerald-900 text-emerald-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between mb-1.5">
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser?.title || (isTeacher ? `GVCN ${currentUser?.assignedClassName || ''}` : 'Quản trị')}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logout()}
              className="w-full flex justify-center p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {!isCollapsed && (
            <div className="text-[10px] text-slate-500 text-center">
              THCS Bản Bo · v2.6.0
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
