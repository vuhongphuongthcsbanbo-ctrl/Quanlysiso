import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';
import { Header } from './components/common/Header';
import { Sidebar, PageId } from './components/common/Sidebar';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { TeacherBottomNav } from './components/teacher/TeacherBottomNav';
import { NetworkStatusBanner } from './components/teacher/NetworkStatusBanner';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { StudentDetailModal } from './components/students/StudentDetailModal';
import { AccessDeniedModal } from './components/common/AccessDeniedModal';
import { ConfirmDialog } from './theme/designSystem';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeacherHomePage } from './pages/TeacherHomePage';
import { TeacherClassPage } from './pages/TeacherClassPage';
import { TeacherHistoryPage } from './pages/TeacherHistoryPage';
import { TeacherAccountPage } from './pages/TeacherAccountPage';
import { AttendanceReportPage } from './pages/AttendanceReportPage';
import { UnreportedClassesPage } from './pages/UnreportedClassesPage';
import { AbsentStudentsPage } from './pages/AbsentStudentsPage';
import { BoardingPage } from './pages/BoardingPage';
import { DayStudentsPage } from './pages/DayStudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { StudentsPage } from './pages/StudentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeachersPage } from './pages/TeachersPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentImportPage } from './pages/StudentImportPage';
import { MorningProgressPage } from './pages/MorningProgressPage';
import { SchoolCalendarPage } from './pages/SchoolCalendarPage';
import { BoardingAssignment } from './components/admin/BoardingAssignment';
import { DatasetVerification } from './components/admin/DatasetVerification';
import { TrainingGuidePage } from './pages/TrainingGuidePage';
import { OperationalReadinessPage } from './pages/OperationalReadinessPage';
import { HandoverOperationsPage } from './pages/HandoverOperationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { getTodayDateString } from './utils/formatters';
import { SessionType } from './types';

const ADMIN_PAGES: PageId[] = [
  'import_students',
  'boarding_management',
  'dataset_verification',
  'accounts',
  'settings',
  'operational_readiness',
  'handover_operations',
  'audit_log',
];

const MainLayout: React.FC = () => {
  const { currentUser, isTeacher, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [activeAttendanceSession, setActiveAttendanceSession] = useState<SessionType>('MORNING');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    const unsub = supabaseService.subscribeToRealtimeChanges();
    return () => {
      unsub();
    };
  }, []);

  // If not logged in, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  // System Maintenance Mode Check (Requirement LIX)
  const settings = storageService.getSettings();
  if ((settings as any).isMaintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  // Check 403 Forbidden for teacher attempting admin-only resources
  const isForbiddenForUser = isTeacher && ADMIN_PAGES.includes(currentPage);

  const handleExecuteReset = () => {
    storageService.resetToDemoData();
    setIsResetConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Network Status Banner for Offline Detection (Requirement LVII & LVIII) */}
      <NetworkStatusBanner />

      {/* Official Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onResetDemo={() => setIsResetConfirmOpen(true)}
        onNavigate={(page) => setCurrentPage(page)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-50/70">
          {/* 403 Access Denied check */}
          {isForbiddenForUser ? (
            <AccessDeniedModal
              attemptedResource={currentPage}
              onGoHome={() => setCurrentPage('dashboard')}
            />
          ) : (
            <>
              {/* Dashboard: If Teacher -> Show TeacherHomePage; If TPT/Admin/BGH -> Show TPT DashboardPage */}
              {currentPage === 'dashboard' && (
                isTeacher ? (
                  <TeacherHomePage
                    currentDate={currentDate}
                    onNavigate={(page, session) => {
                      if (session) setActiveAttendanceSession(session);
                      setCurrentPage(page);
                    }}
                  />
                ) : (
                  <DashboardPage
                    currentDate={currentDate}
                    onNavigate={(page) => setCurrentPage(page)}
                    onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                  />
                )
              )}

              {/* Attendance reporting flow */}
              {currentPage === 'attendance_report' && (
                <AttendanceReportPage
                  currentDate={currentDate}
                  session={activeAttendanceSession}
                  onNavigateHome={() => setCurrentPage('dashboard')}
                />
              )}

              {/* Teacher Dedicated Pages */}
              {currentPage === 'teacher_class' && (
                <TeacherClassPage
                  onNavigateHome={() => setCurrentPage('dashboard')}
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                />
              )}

              {currentPage === 'teacher_history' && (
                <TeacherHistoryPage
                  onNavigateHome={() => setCurrentPage('dashboard')}
                />
              )}

              {currentPage === 'teacher_account' && (
                <TeacherAccountPage
                  onNavigateHome={() => setCurrentPage('dashboard')}
                  onNavigate={(page) => setCurrentPage(page as PageId)}
                />
              )}

              {/* Admin Dedicated Excel Import & Dataset Lifecycle Pages */}
              {currentPage === 'import_students' && (
                <StudentImportPage onNavigate={(page) => setCurrentPage(page as PageId)} />
              )}

              {currentPage === 'boarding_management' && <BoardingAssignment />}

              {currentPage === 'dataset_verification' && (
                <DatasetVerification
                  onDatasetActivated={() => setCurrentPage('dashboard')}
                  onNavigateToImport={() => setCurrentPage('import_students')}
                />
              )}

              {/* Admin & Management Pages */}
              {currentPage === 'unreported_classes' && (
                <UnreportedClassesPage
                  currentDate={currentDate}
                  onNavigateToClassReport={() => setCurrentPage('attendance_report')}
                />
              )}

              {currentPage === 'classes_attendance' && (
                <DashboardPage
                  currentDate={currentDate}
                  onNavigate={(page) => setCurrentPage(page)}
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                />
              )}

              {currentPage === 'absent_students' && (
                <AbsentStudentsPage
                  currentDate={currentDate}
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                />
              )}

              {currentPage === 'boarding' && (
                <BoardingPage
                  currentDate={currentDate}
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                />
              )}

              {currentPage === 'day_students' && (
                <DayStudentsPage
                  currentDate={currentDate}
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                />
              )}

              {currentPage === 'statistics' && (
                <ReportsPage currentDate={currentDate} />
              )}

              {currentPage === 'reports' && (
                <ReportsPage currentDate={currentDate} />
              )}

              {currentPage === 'students' && (
                <StudentsPage
                  onSelectStudentProfile={(stuId) => setViewingStudentId(stuId)}
                  onNavigate={(page) => setCurrentPage(page as PageId)}
                />
              )}

              {currentPage === 'classes' && (
                <ClassesPage />
              )}

              {currentPage === 'teachers' && (
                <TeachersPage />
              )}

              {currentPage === 'accounts' && (
                <UserManagementPage />
              )}

              {currentPage === 'audit_log' && (
                <AuditLogPage />
              )}

              {currentPage === 'morning_progress' && (
                <MorningProgressPage currentDate={currentDate} />
              )}

              {currentPage === 'school_calendar' && (
                <SchoolCalendarPage />
              )}

              {currentPage === 'training_guide' && (
                <TrainingGuidePage onNavigate={(page) => setCurrentPage(page as PageId)} />
              )}

              {currentPage === 'operational_readiness' && (
                <OperationalReadinessPage onNavigate={(page) => setCurrentPage(page as PageId)} />
              )}

              {currentPage === 'handover_operations' && (
                <HandoverOperationsPage />
              )}

              {currentPage === 'settings' && (
                <SettingsPage />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation:
          If GVCN -> 5-tab TeacherBottomNav (TRANG CHỦ, BÁO SĨ SỐ, LỚP CỦA TÔI, THÔNG BÁO, TÀI KHOẢN)
          If Admin/Principal -> MobileBottomBar */}
      {isTeacher ? (
        <TeacherBottomNav
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
        />
      ) : (
        <MobileBottomBar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />
      )}

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStudent={(stu) => setViewingStudentId(stu.id)}
        onSelectClass={() => setCurrentPage('classes_attendance')}
      />

      <StudentDetailModal
        studentId={viewingStudentId}
        onClose={() => setViewingStudentId(null)}
      />

      {/* Confirm Dialog for Resetting Data (replacing window.confirm) */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="KHÔI PHỤC DỮ LIỆU BAN ĐẦU"
        message="Thầy/Cô có chắc chắn muốn khôi phục lại dữ liệu mẫu 20 lớp của Trường THCS Bản Bo? Toàn bộ phiên làm việc thử nghiệm sẽ được đưa về mặc định."
        confirmLabel="KHÔI PHỤC"
        cancelLabel="HỦY"
        variant="warning"
        onConfirm={handleExecuteReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
