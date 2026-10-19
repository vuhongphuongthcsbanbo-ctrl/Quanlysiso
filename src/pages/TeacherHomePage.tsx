import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { formatFullVietnameseDate, getTodayDateString } from '../utils/formatters';
import { PageId } from '../components/common/Sidebar';
import { AttendanceReport, SessionType } from '../types';
import { MorningAttendanceCard } from '../components/teacher/MorningAttendanceCard';
import { AfternoonAttendanceCard } from '../components/teacher/AfternoonAttendanceCard';
import { TeacherSessionSelector, TeacherSessionMode } from '../components/teacher/TeacherSessionSelector';
import { TeacherDailyOverviewCard } from '../components/teacher/TeacherDailyOverviewCard';
import { AttendanceReminderBanner } from '../components/teacher/AttendanceReminderBanner';
import {
  ClipboardCheck,
  AlertCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Building2,
  UtensilsCrossed,
  Users,
  Calendar,
  History,
  User,
  ShieldAlert,
  Layers,
  BookOpen,
  GraduationCap,
  Download,
} from 'lucide-react';
import { PWAInstallModal } from '../components/common/PWAInstallModal';

interface TeacherHomePageProps {
  currentDate: string;
  onNavigate: (page: PageId, session?: SessionType) => void;
}

export const TeacherHomePage: React.FC<TeacherHomePageProps> = ({
  currentDate,
  onNavigate,
}) => {
  const { currentUser } = useAuth();

  // Get assigned class
  const assignedClass = useMemo(() => {
    if (!currentUser?.assignedClassId) return null;
    return storageService.getClassById(currentUser.assignedClassId) || null;
  }, [currentUser]);

  // If teacher is not assigned to any class (Mục II)
  if (!assignedClass) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">CHƯA ĐƯỢC PHÂN CÔNG LỚP CHỦ NHIỆM</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Bạn chưa được phân công lớp chủ nhiệm. Vui lòng liên hệ quản trị viên (hoặc Tổng Phụ trách) để được cấp quyền.
        </p>
      </div>
    );
  }

  // Load real students in class
  const students = useMemo(() => {
    return storageService.getStudentsByClass(assignedClass.id).filter(s => s.status === 'active' || !s.status);
  }, [assignedClass.id]);

  const totalStudents = students.length;
  const boardingTotal = students.filter(s => s.boardingType === 'BOARDING').length;
  const nonBoardingTotal = students.filter(s => s.boardingType === 'NON_BOARDING').length;

  // Check today's reports separately for Morning and Afternoon (Mục I, II, III, IV)
  const morningReport = useMemo(() => {
    return storageService.getReportByDateAndClass(currentDate, assignedClass.id, 'MORNING') || null;
  }, [currentDate, assignedClass.id]);

  const afternoonReport = useMemo(() => {
    return storageService.getReportByDateAndClass(currentDate, assignedClass.id, 'AFTERNOON') || null;
  }, [currentDate, assignedClass.id]);

  // Gợi ý thông minh theo thời gian (Mục LV)
  const currentHour = new Date().getHours();
  const recommendedSession: 'MORNING' | 'AFTERNOON' = currentHour >= 12 ? 'AFTERNOON' : 'MORNING';

  // Lựa chọn buổi hiển thị: BUỔI SÁNG, BUỔI CHIỀU hoặc TỔNG QUAN CẢ NGÀY
  const [activeSessionMode, setActiveSessionMode] = useState<TeacherSessionMode>(() => {
    if (currentHour >= 12 && morningReport) {
      return 'AFTERNOON';
    }
    return 'MORNING';
  });

  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-24">
      {/* ==================================================
          MỤC IV: TRANG CHỦ GVCN TRÊN ĐIỆN THOẠI
          TRƯỜNG THCS BẢN BO
          Xin chào, [TÊN GIÁO VIÊN]
          GVCN lớp: [TÊN LỚP]
          Ngày: [NGÀY HIỆN TẠI]
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="text-[11px] font-black text-blue-900 uppercase tracking-widest">
          TRƯỜNG THCS BẢN BO
        </div>

        <div>
          <div className="text-xs text-slate-500">Xin chào,</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {currentUser?.name}
          </div>
          <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>GVCN LỚP {assignedClass.name} (Khối {assignedClass.grade})</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-semibold">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatFullVietnameseDate(currentDate)}</span>
        </div>
      </div>

      {/* Banner nhắc báo sĩ số & cảnh báo thời gian thực (Mục VI - X, XXI) */}
      {(() => {
        const bannerSession: SessionType = activeSessionMode === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING';
        const bannerReport = bannerSession === 'AFTERNOON' ? afternoonReport : morningReport;
        return (
          <AttendanceReminderBanner
            currentDate={currentDate}
            session={bannerSession}
            assignedClass={assignedClass}
            report={bannerReport}
            settings={storageService.getSettings()}
            onNavigateToReport={() => onNavigate('attendance_report', bannerSession)}
          />
        );
      })()}

      {/* ==================================================
          MỤC IV: CARD SĨ SỐ LỚP
          Tổng HS: ...
          Bán trú: ...
          Ngoại trú: ...
      ================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
            SĨ SỐ LỚP {assignedClass.name}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Dữ liệu hồ sơ chính thức</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <div className="text-[10px] font-bold text-slate-300 uppercase">TỔNG HS</div>
            <div className="text-2xl font-black text-white mt-0.5 font-mono">
              {totalStudents}
            </div>
            <div className="text-[9px] text-slate-400">học sinh</div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <div className="text-[10px] font-bold text-amber-300 uppercase">BÁN TRÚ</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5 font-mono">
              {boardingTotal}
            </div>
            <div className="text-[9px] text-slate-400">ăn tại trường</div>
          </div>

          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10">
            <div className="text-[10px] font-bold text-blue-300 uppercase">NGOẠI TRÚ</div>
            <div className="text-2xl font-black text-blue-300 mt-0.5 font-mono">
              {nonBoardingTotal}
            </div>
            <div className="text-[9px] text-slate-400">tự túc</div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC II, III, IV, XV, XVI, XVII:
          BÁO CÁO SĨ SỐ HÔM NAY (BUỔI SÁNG, BUỔI CHIỀU & TỔNG QUAN CẢ NGÀY)
      ================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-700" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              BÁO CÁO SĨ SỐ HÔM NAY
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-bold">Lớp {assignedClass.name}</span>
        </div>

        {/* NÚT LỰA CHỌN BUỔI SÁNG, BUỔI CHIỀU VÀ TỔNG QUAN CẢ NGÀY */}
        <TeacherSessionSelector
          activeMode={activeSessionMode}
          onChange={setActiveSessionMode}
          morningReport={morningReport}
          afternoonReport={afternoonReport}
        />

        {/* 1. LỰA CHỌN BUỔI SÁNG */}
        {activeSessionMode === 'MORNING' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <MorningAttendanceCard
              report={morningReport}
              isRecommended={recommendedSession === 'MORNING'}
              onSelect={() => onNavigate('attendance_report', 'MORNING')}
            />
          </div>
        )}

        {/* 2. LỰA CHỌN BUỔI CHIỀU */}
        {activeSessionMode === 'AFTERNOON' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <AfternoonAttendanceCard
              report={afternoonReport}
              isRecommended={recommendedSession === 'AFTERNOON'}
              onSelect={() => onNavigate('attendance_report', 'AFTERNOON')}
            />
          </div>
        )}

        {/* 3. LỰA CHỌN TỔNG QUAN CẢ NGÀY */}
        {activeSessionMode === 'FULL_DAY' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <TeacherDailyOverviewCard
              currentClass={assignedClass}
              currentDate={currentDate}
              morningReport={morningReport}
              afternoonReport={afternoonReport}
              totalStudents={totalStudents}
              boardingTotal={boardingTotal}
              nonBoardingTotal={nonBoardingTotal}
              onSelectSession={(session) => onNavigate('attendance_report', session)}
            />
          </div>
        )}
      </div>

      {/* PHÍM TẮT TIỆN ÍCH CHO GVCN */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('teacher_class')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 text-left cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Hồ sơ lớp</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">Danh sách lớp</div>
          </div>
          <Building2 className="w-5 h-5 text-blue-700" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('teacher_history')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 text-left cursor-pointer transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Tra cứu</div>
            <div className="text-xs font-black text-slate-900 mt-0.5">Lịch sử sĩ số</div>
          </div>
          <History className="w-5 h-5 text-blue-700" />
        </button>
      </div>

      {/* CẨM NANG & TẬP HUẤN THỰC HÀNH CHO GVCN */}
      <div className="pt-2 space-y-3">
        {/* Nút Cài đặt App vào điện thoại / máy tính cho GVCN */}
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(true)}
          className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-md border border-blue-600/50 text-left cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" />
              <span>Tiện ích nhanh</span>
            </div>
            <div className="text-sm font-black text-white">
              Cài Đặt App Vào Điện Thoại & Máy Tính
            </div>
            <div className="text-[11px] text-blue-100">
              Mở trực tiếp từ màn hình chính để báo cáo sĩ số 30 giây mỗi sáng
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-200 shrink-0 ml-2" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('training_guide')}
          className="w-full bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-700/50 text-left cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Hỗ trợ giáo viên</span>
            </div>
            <div className="text-sm font-black text-white">
              Cẩm Nang Điểm Danh & Trắc Nghiệm
            </div>
            <div className="text-[11px] text-indigo-200">
              Quy chế mốc giờ, hướng dẫn nộp muộn, offline và bài kiểm tra nghiệp vụ
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-indigo-300 shrink-0 ml-2" />
        </button>
      </div>

      {/* Modal Cài Đặt App */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
