import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { INITIAL_CLASSES } from '../data/initialSeedData';
import { calculateAttendanceSummary, AttendanceSummaryCalculation } from '../services/reportCalculationService';
import { draftService } from '../services/draftService';
import {
  SchoolClass,
  Student,
  AttendanceRecord,
  AttendanceReport,
  AttendanceItemStatus,
  SessionType,
  BoardingType,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import {
  formatFullVietnameseDate,
  getTodayDateString,
} from '../utils/formatters';
import {
  calculateLateMinutes,
  calculateRemainingMinutes,
  getVietnamTimeString,
  parseTimeStringToMinutes,
} from '../utils/vietnamTime';
import { notificationService } from '../services/notificationService';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  UtensilsCrossed,
  Users,
  Send,
  Lock,
  Search,
  Sparkles,
  Smartphone,
  Eye,
  Check,
  X,
  AlertCircle,
  FileCheck,
  RotateCcw,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  Filter,
  Info,
  Calendar,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { TeacherSessionSelector, TeacherSessionMode } from '../components/teacher/TeacherSessionSelector';
import { TeacherDailyOverviewCard } from '../components/teacher/TeacherDailyOverviewCard';
import { ConfirmDialog } from '../theme/designSystem';

interface AttendanceReportPageProps {
  currentDate: string;
  session?: SessionType;
  onNavigateHome?: () => void;
}

export const AttendanceReportPage: React.FC<AttendanceReportPageProps> = ({
  currentDate,
  session: propSession,
  onNavigateHome,
}) => {
  const { currentUser, isTeacher, isAdmin } = useAuth();
  const settings = storageService.getSettings();
  
  const allClasses = useMemo(() => {
    return storageService.getClasses().filter(c => c.isActive);
  }, []);

  // Resolve assigned class for teacher
  const resolvedTeacherClass = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.assignedClassId) {
      const cls = storageService.getClassById(currentUser.assignedClassId);
      if (cls) return cls;
    }
    if (currentUser.assignedClassName) {
      const cls = storageService.getClassById(currentUser.assignedClassName);
      if (cls) return cls;
    }
    const cleanName = (currentUser.fullName || currentUser.name || '').trim().toLowerCase();
    const matchedClass = allClasses.find(c =>
      (currentUser.id && c.teacherId === currentUser.id) ||
      (currentUser.teacherId && c.teacherId === currentUser.teacherId) ||
      (cleanName && c.teacherName && c.teacherName.trim().toLowerCase() === cleanName) ||
      (currentUser.phone && c.teacherPhone && c.teacherPhone === currentUser.phone)
    );
    if (matchedClass) return matchedClass;

    try {
      const rawTeachers = localStorage.getItem('thcs_banbo_v2_teachers');
      if (rawTeachers) {
        const teachers: any[] = JSON.parse(rawTeachers);
        const tch = teachers.find(t =>
          (currentUser.teacherId && t.id === currentUser.teacherId) ||
          (currentUser.email && t.email && t.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
          (cleanName && t.fullName && t.fullName.trim().toLowerCase() === cleanName)
        );
        if (tch && (tch.assignedClassId || tch.assignedClassName)) {
          return storageService.getClassById(tch.assignedClassId || tch.assignedClassName) || null;
        }
      }
    } catch {
      // ignore
    }

    // Fallback danh mục 20 lớp chính thức
    const defaultCls = INITIAL_CLASSES.find(ic =>
      (currentUser.id && ic.teacherId === currentUser.id) ||
      (currentUser.teacherId && ic.teacherId === currentUser.teacherId) ||
      (cleanName && ic.teacherName && ic.teacherName.trim().toLowerCase() === cleanName) ||
      (currentUser.phone && ic.teacherPhone && ic.teacherPhone === currentUser.phone) ||
      (currentUser.assignedClassName && ic.name.toUpperCase() === currentUser.assignedClassName.toUpperCase())
    );
    if (defaultCls) return defaultCls;

    return null;
  }, [currentUser, allClasses]);

  // Selected class logic
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (resolvedTeacherClass) return resolvedTeacherClass.id;
    if (currentUser?.assignedClassId) return currentUser.assignedClassId;
    return allClasses[0]?.id || 'cls_6a1';
  });

  useEffect(() => {
    if (resolvedTeacherClass && selectedClassId !== resolvedTeacherClass.id) {
      setSelectedClassId(resolvedTeacherClass.id);
    }
  }, [resolvedTeacherClass]);

  // Chế độ chọn buổi trong mục "Báo cáo hôm nay": BUỔI SÁNG, BUỔI CHIỀU hoặc TỔNG QUAN CẢ NGÀY
  const [activeSessionMode, setActiveSessionMode] = useState<TeacherSessionMode>(() => {
    const norm = (propSession || 'MORNING').toString().toUpperCase();
    return norm === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING';
  });
  const [pendingSessionMode, setPendingSessionMode] = useState<TeacherSessionMode | null>(null);

  // Đồng bộ khi propSession thay đổi từ ngoài
  useEffect(() => {
    if (propSession) {
      const norm = propSession.toString().toUpperCase();
      if (norm === 'AFTERNOON' || norm === 'MORNING') {
        setActiveSessionMode(norm as TeacherSessionMode);
      }
    }
  }, [propSession]);

  const selectedSession = useMemo<SessionType>(() => {
    return activeSessionMode === 'AFTERNOON' ? 'AFTERNOON' : 'MORNING';
  }, [activeSessionMode]);

  const reportDate = currentDate;

  const currentClass = useMemo(() => {
    if (!selectedClassId) return null;
    return storageService.getClassById(selectedClassId) || null;
  }, [selectedClassId]);

  // If teacher has NO assigned class (Mục II)
  const isTeacherWithoutClass = isTeacher && !resolvedTeacherClass && !currentUser?.assignedClassId;

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick(v => v + 1);
    window.addEventListener('thcs_banbo_students_changed', handleUpdate);
    window.addEventListener('thcs_banbo_classes_changed', handleUpdate);
    return () => {
      window.removeEventListener('thcs_banbo_students_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_classes_changed', handleUpdate);
    };
  }, []);

  // Students in class (Only active students)
  const studentsInClass: Student[] = useMemo(() => {
    if (!selectedClassId) return [];
    return storageService.getStudentsByClass(selectedClassId).filter(s => s.status === 'active' || !s.status);
  }, [selectedClassId, refreshTick]);

  // Main UI Step states:
  // 'initial' | 'mode_selector' | 'has_absent_list' | 'confirm_full' | 'review_report' | 'submission_success'
  const [currentStep, setCurrentStep] = useState<'mode_selector' | 'has_absent_list' | 'confirm_full' | 'review_report' | 'submission_success'>('mode_selector');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [reportNotes, setReportNotes] = useState<string>('');
  const [existingReport, setExistingReport] = useState<AttendanceReport | null>(null);

  // Mobile Bottom Sheet modal for editing a single student (Mục XIV, XV, XVI, XVII, XVIII, XIX)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceItemStatus>('PRESENT');
  const [editReason, setEditReason] = useState<string>('Ốm');
  const [editCustomReason, setEditCustomReason] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editTime, setEditTime] = useState<string>(selectedSession === 'AFTERNOON' ? '13:45' : '07:25');

  // Search & Filter (Mục XI, XIII)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'boarding' | 'non_boarding' | 'changed' | 'absent'>('all');

  // Checkbox confirmation in review modal (Mục IX & XXVIII)
  const [isConfirmedByTeacher, setIsConfirmedByTeacher] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Track unsaved changes for navigation warning (Mục XLVI)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Load existing report or initialize default records
  useEffect(() => {
    if (!selectedClassId) return;
    const targetClass = storageService.getClassById(selectedClassId);
    if (!targetClass) return;

    const classStudents = storageService.getStudentsByClass(selectedClassId).filter(s => s.status === 'active' || !s.status);
    const existing = storageService.getReportByDateAndClass(reportDate, selectedClassId, selectedSession);

    if (existing) {
      setExistingReport(existing);
      setReportNotes(existing.notes || '');

      const recordMap = new Map<string, AttendanceRecord>();
      existing.records.forEach(r => recordMap.set(r.studentId, r));

      const merged: AttendanceRecord[] = classStudents.map(stu => {
        if (recordMap.has(stu.id)) {
          return recordMap.get(stu.id)!;
        }
        return {
          id: `rec_${stu.id}_${Date.now()}`,
          reportId: existing.id,
          studentId: stu.id,
          studentName: stu.fullName,
          studentCode: stu.code,
          classId: targetClass.id,
          className: targetClass.name,
          grade: targetClass.grade,
          date: reportDate,
          session: selectedSession,
          boardingType: stu.boardingType,
          status: 'PRESENT',
          hasBoardingMeal: stu.boardingType === 'BOARDING',
          updatedAt: new Date().toISOString(),
        };
      });

      setRecords(merged);

      // Check if this was a full-attendance report or has absences
      const hasAnyAbsence = existing.absentCount > 0 || existing.lateCount > 0;
      if (hasAnyAbsence) {
        setCurrentStep('has_absent_list');
      } else {
        setCurrentStep('mode_selector');
      }
    } else {
      setExistingReport(null);
      setReportNotes('');

      // Check for local draft (Mục XLIII: Tự động lưu bản nháp)
      const draft = draftService.getDraft(targetClass.id, reportDate, selectedSession);
      if (draft && draft.records && draft.records.length > 0) {
        setRecords(draft.records);
        setReportNotes(draft.notes || '');
        setCurrentStep('has_absent_list');
      } else {
        // MỤC I: Mặc định TẤT CẢ HỌC SINH = CÓ MẶT
        const initial: AttendanceRecord[] = classStudents.map(stu => ({
          id: `rec_${stu.id}_${Date.now()}`,
          reportId: `rep_${targetClass.id}_${reportDate}_${selectedSession}`,
          studentId: stu.id,
          studentName: stu.fullName,
          studentCode: stu.code,
          classId: targetClass.id,
          className: targetClass.name,
          grade: targetClass.grade,
          date: reportDate,
          session: selectedSession,
          boardingType: stu.boardingType,
          status: 'PRESENT',
          hasBoardingMeal: stu.boardingType === 'BOARDING',
          updatedAt: new Date().toISOString(),
        }));

        setRecords(initial);
        setCurrentStep('mode_selector');
      }
    }
  }, [selectedClassId, reportDate, selectedSession, refreshTick]);

  // Centralized calculations (Mục LII: calculateAttendanceSummary)
  const summary: AttendanceSummaryCalculation = useMemo(() => {
    return calculateAttendanceSummary(studentsInClass, records);
  }, [studentsInClass, records]);

  // Report status flags
  const isLocked = existingReport?.status === 'LOCKED' || (existingReport?.status as string) === 'locked';
  const isApproved = existingReport?.status === 'APPROVED';
  const isPending = existingReport?.status === 'PENDING_APPROVAL' || (existingReport?.status as string) === 'submitted';
  const isRevisionRequired = existingReport?.status === 'REVISION_REQUIRED' || (existingReport?.status as string) === 'needs_revision';

  // Save draft on record changes (Mục XLIII)
  useEffect(() => {
    if (selectedClassId && records.length > 0 && !isLocked && !isApproved) {
      draftService.saveDraft(selectedClassId, reportDate, selectedSession, records, reportNotes);
    }
  }, [records, reportNotes, selectedClassId, reportDate, selectedSession, isLocked, isApproved]);

  // Navigation warning on page leave (Mục XLVI)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Báo cáo chưa hoàn thành. Bạn có muốn rời khỏi trang?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isTeacherWithoutClass) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">CHƯA ĐƯỢC PHÂN CÔNG LỚP CHỦ NHIỆM</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Bạn chưa được phân công lớp chủ nhiệm. Vui lòng liên hệ quản trị viên.
        </p>
      </div>
    );
  }

  if (!currentClass) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải thông tin lớp...</div>;
  }

  // MỤC VIII & IX: CHỌN "LỚP ĐỦ SĨ SỐ"
  const handleChooseFullClass = () => {
    if (isLocked) return;
    // Set all records to PRESENT
    setRecords(prev =>
      prev.map(r => ({
        ...r,
        status: 'PRESENT',
        reason: undefined,
        reasonDetail: undefined,
        note: undefined,
        hasBoardingMeal: r.boardingType === 'BOARDING',
        updatedAt: new Date().toISOString(),
      }))
    );
    setIsConfirmedByTeacher(false);
    setValidationError(null);
    setCurrentStep('confirm_full');
  };

  // MỤC X: CHỌN "CÓ HỌC SINH VẮNG / THAY ĐỔI"
  const handleChooseHasAbsent = () => {
    if (isLocked) return;
    setCurrentStep('has_absent_list');
  };

  // Open Edit Sheet for a student (Mục XIV)
  const handleOpenEditStudent = (stu: Student) => {
    if (isLocked) return;
    const existingRec = records.find(r => r.studentId === stu.id);
    setEditingStudent(stu);
    setEditStatus(existingRec?.status || 'PRESENT');
    setEditReason(existingRec?.reason || 'Ốm');
    setEditCustomReason(existingRec?.reasonDetail || '');
    setEditNote(existingRec?.note || '');
    setEditTime(selectedSession === 'AFTERNOON' ? (settings.afternoonDeadlineTime || '13:45') : '07:25');
  };

  // Save student status change
  const handleSaveStudentStatus = () => {
    if (!editingStudent) return;

    setRecords(prev =>
      prev.map(r => {
        if (r.studentId === editingStudent.id) {
          const finalReason = editReason === 'Khác' ? editCustomReason : editReason;
          const isAbsent = editStatus === 'ABSENT_EXCUSED' || editStatus === 'ABSENT_UNEXCUSED';

          return {
            ...r,
            status: editStatus,
            absenceType: editStatus === 'ABSENT_EXCUSED' ? 'excused' : editStatus === 'ABSENT_UNEXCUSED' ? 'unexcused' : undefined,
            reason: isAbsent ? finalReason : editStatus === 'LATE' || editStatus === 'EARLY_LEAVE' ? editReason : undefined,
            reasonDetail: editCustomReason,
            note: editNote,
            hasBoardingMeal: r.boardingType === 'BOARDING' && !isAbsent,
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    setHasUnsavedChanges(true);
    setEditingStudent(null);
  };

  // Submit report to TPT (Mục XXIX, XLV: Chống bấm gửi nhiều lần với Idempotent logic)
  const handleSubmitAttendanceReport = async () => {
    if (isSubmitting) return; // Prevent double click
    if (summary.validationError) {
      setValidationError(summary.validationError);
      return;
    }
    if (!isConfirmedByTeacher) {
      setValidationError('Thầy/cô vui lòng tích chọn xác nhận số liệu trước khi gửi.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const timestamp = `${reportDate} ${timeStr}`;

      const reportId = `rep_${currentClass.id}_${reportDate}_${selectedSession}`;
      const isRevisionResubmit = existingReport?.status === 'REVISION_REQUIRED';

      // Tính toán quá hạn nộp báo cáo (Mục XII, LXXXVII, Test 5)
      const isMorning = selectedSession === 'MORNING';
      const deadlineTime = isMorning ? (settings.morningDeadlineTime || '07:20') : (settings.afternoonDeadlineTime || '13:45');
      const startTime = isMorning ? (settings.morningStartTime || '06:45') : (settings.afternoonStartTime || '13:00');
      const sessionLabel = isMorning ? 'buổi sáng' : 'buổi chiều';
      const lateMins = calculateLateMinutes(deadlineTime, timeStr);
      const isLate = lateMins > 0;

      // Kiểm tra chặn nếu chưa đến giờ mở (Mục VI)
      const allowEarly = isMorning
        ? (settings.allowEarlySubmission ?? true)
        : (settings.afternoonAllowEarlySubmission ?? settings.allowEarlySubmission ?? true);
      if (
        !allowEarly &&
        parseTimeStringToMinutes(timeStr) < parseTimeStringToMinutes(startTime)
      ) {
        setValidationError(`Báo cáo sĩ số ${sessionLabel} sẽ bắt đầu từ ${startTime}. Hiện tại hệ thống chưa mở nhận.`);
        setIsSubmitting(false);
        return;
      }

      // Kiểm tra chặn nếu quá hạn và không cho báo muộn (Mục LXXX)
      const allowLate = isMorning
        ? (settings.allowLateSubmission ?? true)
        : (settings.afternoonAllowLateSubmission ?? settings.allowLateSubmission ?? true);
      if (
        !allowLate &&
        isLate
      ) {
        setValidationError(`Thời gian báo cáo ${sessionLabel} đã kết thúc (Hạn: ${deadlineTime}). Vui lòng liên hệ Tổng phụ trách để được mở quyền báo bổ sung.`);
        setIsSubmitting(false);
        return;
      }

      const newReport: AttendanceReport = {
        id: reportId,
        date: reportDate,
        session: selectedSession,
        classId: currentClass.id,
        className: currentClass.name,
        grade: currentClass.grade,
        teacherId: currentUser?.id || 'gvcn',
        teacherName: currentUser?.name || currentClass.teacherName || 'GVCN',
        totalStudents: summary.totalStudents,
        presentCount: summary.presentCount,
        absentCount: summary.absentCount,
        excusedAbsentCount: summary.excusedAbsentCount,
        unexcusedAbsentCount: summary.unexcusedAbsentCount,
        lateCount: summary.lateCount,
        earlyLeaveCount: summary.earlyLeaveCount,
        boardingTotal: summary.boardingTotal,
        boardingPresent: summary.boardingPresent,
        boardingAbsent: summary.boardingAbsent,
        boardingMealsExpected: summary.boardingPresent,
        nonBoardingTotal: summary.nonBoardingTotal,
        nonBoardingPresent: summary.nonBoardingPresent,
        nonBoardingAbsent: summary.nonBoardingAbsent,
        status: 'PENDING_APPROVAL', // Luôn chuyển PENDING_APPROVAL để TPT duyệt
        submittedAt: timestamp,
        submittedBy: currentUser?.name || 'GVCN',
        isLateSubmission: isLate,
        deadlineAt: deadlineTime,
        lateByMinutes: isLate ? lateMins : 0,
        revisionReason: existingReport?.revisionReason,
        revisionCount: isRevisionResubmit ? (existingReport?.revisionCount || 0) + 1 : existingReport?.revisionCount,
        revisionHistory: existingReport?.revisionHistory,
        notes: reportNotes,
        records: records,
        updatedAt: timestamp,
      };

      storageService.saveReport(newReport);

      // Thông báo cho Quản trị viên / Tổng phụ trách (Mục XXVI)
      if (settings.notifyAdminOnSubmission ?? true) {
        notificationService.createNotification({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin_tpt',
          type: isRevisionResubmit ? 'ATTENDANCE_RESUBMITTED' : 'ATTENDANCE_SUBMITTED',
          priority: isLate ? 'HIGH' : 'NORMAL',
          title: isRevisionResubmit
            ? `LỚP ${newReport.className} ĐÃ GỬI LẠI BÁO CÁO (${sessionLabel.toUpperCase()})`
            : `BÁO CÁO SĨ SỐ MỚI - LỚP ${newReport.className} (${sessionLabel.toUpperCase()})`,
          message: isRevisionResubmit
            ? `Lớp ${newReport.className} đã gửi lại báo cáo sĩ số ${sessionLabel} sau chỉnh sửa (Có mặt: ${newReport.presentCount}/${newReport.totalStudents}).`
            : `Lớp ${newReport.className} vừa gửi báo cáo sĩ số ${sessionLabel}${isLate ? ` (Muộn ${lateMins} phút)` : ''}.`,
          classId: currentClass.id,
          className: currentClass.name,
          reportId: reportId,
          date: reportDate,
          session: selectedSession,
          actionUrl: 'dashboard',
          createdBy: currentUser?.name || 'GVCN',
          deduplicationKey: `${reportDate}_${currentClass.id}_${selectedSession}_SUBMIT_${Date.now()}`,
          metadata: {
            isLateSubmission: isLate,
            lateByMinutes: lateMins,
            teacherName: currentUser?.name || 'GVCN',
          },
        });
      }

      // Audit Log (Mục LIX)
      storageService.addAuditLog(
        currentUser?.name || 'GVCN',
        isRevisionResubmit
          ? `Gửi lại báo cáo sĩ số Lớp ${newReport.className} ${sessionLabel} sau chỉnh sửa (Có mặt: ${newReport.presentCount}/${newReport.totalStudents})`
          : `Gửi báo cáo sĩ số Lớp ${newReport.className} ${sessionLabel} ngày ${reportDate} (Có mặt: ${newReport.presentCount}/${newReport.totalStudents}, Vắng: ${newReport.absentCount}${isLate ? `, Muộn: ${lateMins}p` : ''})`,
        'attendance',
        isRevisionResubmit ? 'RESUBMIT_ATTENDANCE' : 'SUBMIT_ATTENDANCE',
        currentUser?.role
      );

      // Clear draft on success
      draftService.clearDraft(currentClass.id, reportDate, selectedSession);
      setExistingReport(newReport);
      setHasUnsavedChanges(false);
      window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      setCurrentStep('submission_success');
    } catch (err: any) {
      setValidationError('Có lỗi xảy ra khi lưu báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students for list view (Mục XI, XIII)
  const filteredStudents = useMemo(() => {
    return studentsInClass.filter(stu => {
      const rec = records.find(r => r.studentId === stu.id);
      const s = rec?.status ? String(rec.status).toUpperCase() : 'PRESENT';
      const isAbsent = s === 'ABSENT_EXCUSED' || s === 'ABSENT_UNEXCUSED';
      const isChanged = s !== 'PRESENT';

      if (filterType === 'boarding' && stu.boardingType !== 'BOARDING') return false;
      if (filterType === 'non_boarding' && stu.boardingType !== 'NON_BOARDING') return false;
      if (filterType === 'changed' && !isChanged) return false;
      if (filterType === 'absent' && !isAbsent) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = stu.fullName.toLowerCase().includes(term);
        const matchCode = stu.code.toLowerCase().includes(term);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [studentsInClass, records, filterType, searchTerm]);

  // List of absent students
  const absentStudentsList = useMemo(() => {
    return records.filter(r => {
      const s = String(r.status).toUpperCase();
      return s === 'ABSENT_EXCUSED' || s === 'ABSENT_UNEXCUSED' || s === 'LATE' || s === 'EARLY_LEAVE';
    });
  }, [records]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-28">
      {/* ==================================================
          TOP HEADER THÔNG BÁO VÀ THÔNG TIN LỚP
      ================================================== */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              title="Về trang chủ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                TRƯỜNG THCS BẢN BO
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                activeSessionMode === 'FULL_DAY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : selectedSession === 'AFTERNOON'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-amber-500 text-white shadow-xs'
              }`}>
                {activeSessionMode === 'FULL_DAY' ? 'CẢ NGÀY' : getSessionDisplayName(selectedSession).toUpperCase()}
              </span>
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase">
              BÁO CÁO SĨ SỐ LỚP {currentClass.name}
              {activeSessionMode !== 'FULL_DAY' ? ` – ${getSessionDisplayName(selectedSession).toUpperCase()}` : ' – TỔNG QUAN CẢ NGÀY'}
            </h1>
            <div className="text-[11px] text-slate-500">
              {formatFullVietnameseDate(reportDate)} · GVCN: <strong>{currentUser?.name}</strong>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {(!existingReport || existingReport.status === 'NOT_SUBMITTED' || (existingReport.status as string) === 'not_reported') && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
              CHƯA BÁO CÁO
            </span>
          )}
          {(existingReport?.status === 'PENDING_APPROVAL' || (existingReport?.status as string) === 'submitted') && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              CHỜ DUYỆT
            </span>
          )}
          {(existingReport?.status === 'REVISION_REQUIRED' || (existingReport?.status as string) === 'needs_revision') && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              CẦN CHỈNH SỬA
            </span>
          )}
          {existingReport?.status === 'APPROVED' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              ĐÃ DUYỆT
            </span>
          )}
          {(existingReport?.status === 'LOCKED' || (existingReport?.status as string) === 'locked') && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
              ĐÃ KHÓA
            </span>
          )}
        </div>
      </div>

      {/* NÚT LỰA CHỌN BUỔI SÁNG, BUỔI CHIỀU VÀ TỔNG QUAN CẢ NGÀY */}
      <TeacherSessionSelector
        activeMode={activeSessionMode}
        onChange={(newMode) => {
          if (hasUnsavedChanges && currentStep !== 'mode_selector' && currentStep !== 'submission_success') {
            if (!window.confirm('Bạn có thay đổi điểm danh chưa lưu. Bạn có muốn đổi buổi?')) {
              return;
            }
          }
          setActiveSessionMode(newMode);
        }}
        morningReport={storageService.getReportByDateAndClass(reportDate, currentClass.id, 'MORNING') || null}
        afternoonReport={storageService.getReportByDateAndClass(reportDate, currentClass.id, 'AFTERNOON') || null}
      />

      {/* 3. LỰA CHỌN TỔNG QUAN CẢ NGÀY */}
      {activeSessionMode === 'FULL_DAY' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <TeacherDailyOverviewCard
            currentClass={currentClass}
            currentDate={reportDate}
            morningReport={storageService.getReportByDateAndClass(reportDate, currentClass.id, 'MORNING') || null}
            afternoonReport={storageService.getReportByDateAndClass(reportDate, currentClass.id, 'AFTERNOON') || null}
            totalStudents={studentsInClass.length}
            boardingTotal={studentsInClass.filter(s => s.boardingType === 'BOARDING').length}
            nonBoardingTotal={studentsInClass.filter(s => s.boardingType === 'NON_BOARDING').length}
            onSelectSession={(sess) => setActiveSessionMode(sess as TeacherSessionMode)}
          />
        </div>
      )}

      {/* 1 & 2. LỰA CHỌN BUỔI SÁNG HOẶC BUỔI CHIỀU (QUY TRÌNH BÁO CÁO ĐIỂM DANH) */}
      {activeSessionMode !== 'FULL_DAY' && (
        <>
          {/* Thông báo nếu Tổng phụ trách yêu cầu chỉnh sửa (Mục XXXIII) */}
          {existingReport?.revisionReason && (existingReport.status === 'REVISION_REQUIRED' || (existingReport.status as string) === 'needs_revision') && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 text-xs space-y-1 text-rose-950">
              <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>NỘI DUNG TỔNG PHỤ TRÁCH YÊU CẦU CHỈNH SỬA:</span>
              </div>
              <div className="italic bg-white p-2.5 rounded-xl border border-rose-200 mt-1">
                "{existingReport.revisionReason}"
              </div>
            </div>
          )}

      {/* ==================================================
          BƯỚC 1: MÀN HÌNH CHỌN TÌNH HÌNH SĨ SỐ (MỤC VII)
          “TÌNH HÌNH SĨ SỐ LỚP HÔM NAY?”
          1. LỚP ĐỦ SĨ SỐ
          2. CÓ HỌC SINH VẮNG / THAY ĐỔI
      ================================================== */}
      {currentStep === 'mode_selector' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Card Sĩ số lớp */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
            <div className="text-[11px] font-extrabold text-amber-300 uppercase">
              HỒ SƠ SĨ SỐ LỚP {currentClass.name}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase">Sĩ số</div>
                <div className="text-xl font-black text-white font-mono">{summary.totalStudents}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <div className="text-[10px] text-amber-300 uppercase">Bán trú</div>
                <div className="text-xl font-black text-amber-300 font-mono">{summary.boardingTotal}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                <div className="text-[10px] text-blue-300 uppercase">Ngoại trú</div>
                <div className="text-xl font-black text-blue-300 font-mono">{summary.nonBoardingTotal}</div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <h2 className="text-base font-black text-slate-900 uppercase">
              TÌNH HÌNH SĨ SỐ LỚP {getSessionDisplayName(selectedSession).toUpperCase()} HÔM NAY?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn phương án phù hợp để hệ thống tự động thiết lập số liệu cho {getSessionDisplayName(selectedSession).toLowerCase()}
            </p>
          </div>

          {studentsInClass.length === 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs space-y-1.5 text-amber-950">
              <div className="font-extrabold flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>CHƯA CÓ DANH SÁCH HỌC SINH</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Dữ liệu học sinh mẫu thử nghiệm đã được dọn sạch. Thầy/cô hoặc Tổng phụ trách hãy tải lên tệp Excel danh sách học sinh chuẩn của Trường THCS Bản Bo trước khi lập báo cáo điểm danh.
              </p>
            </div>
          )}

          {/* HAI NÚT LỚN CHO ĐIỆN THOẠI (MỤC VII) */}
          <div className="space-y-3 pt-1">
            {/* LỰA CHỌN 1: LỚP ĐỦ SĨ SỐ (Chỉ mất 3 thao tác) */}
            <button
              type="button"
              disabled={isLocked || studentsInClass.length === 0}
              onClick={handleChooseFullClass}
              className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-left shadow-md flex items-center justify-between cursor-pointer transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-base font-black uppercase">1. LỚP ĐỦ SĨ SỐ</div>
                  <div className="text-xs text-emerald-100 mt-0.5">
                    100% học sinh có mặt đầy đủ ({summary.totalStudents}/{summary.totalStudents})
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-200" />
            </button>

            {/* LỰA CHỌN 2: CÓ HỌC SINH VẮNG / THAY ĐỔI */}
            <button
              type="button"
              disabled={isLocked || studentsInClass.length === 0}
              onClick={handleChooseHasAbsent}
              className="w-full p-4 bg-white hover:bg-slate-50 border-2 border-slate-300 active:scale-98 text-slate-900 rounded-2xl text-left shadow-xs flex items-center justify-between cursor-pointer transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <UserX className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-base font-black uppercase">2. CÓ HỌC SINH VẮNG / THAY ĐỔI</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Có học sinh nghỉ phép, không phép, đi muộn, về sớm
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC VIII & IX: MÀN HÌNH XÁC NHẬN LỚP ĐỦ SĨ SỐ
          XÁC NHẬN SĨ SỐ
          Lớp, Ngày, Sĩ số, Có mặt, Vắng 0, Bán trú, Ngoại trú
          Checkbox: “Tôi đã kiểm tra và xác nhận số liệu trên.”
          Nút: QUAY LẠI, GỬI TỔNG PHỤ TRÁCH
      ================================================== */}
      {currentStep === 'confirm_full' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="text-center border-b border-slate-100 pb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-black text-slate-900 uppercase">
              XÁC NHẬN SĨ SỐ {getSessionDisplayName(selectedSession).toUpperCase()} – LỚP {currentClass.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Thầy/cô xác nhận lớp đủ sĩ số trong {getSessionDisplayName(selectedSession).toLowerCase()} hôm nay.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Sĩ số lớp:</span>
              <strong className="text-slate-900 font-mono text-sm">{summary.totalStudents}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-emerald-700 font-bold">Có mặt:</span>
              <strong className="text-emerald-800 font-mono text-sm">{summary.presentCount}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-rose-700">Vắng:</span>
              <strong className="text-rose-800 font-mono text-sm">0</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-amber-800">Bán trú có mặt:</span>
              <strong className="text-amber-900 font-mono">{summary.boardingPresent}/{summary.boardingTotal} có mặt</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-blue-800">Ngoại trú có mặt:</span>
              <strong className="text-blue-900 font-mono">{summary.nonBoardingPresent}/{summary.nonBoardingTotal} có mặt</strong>
            </div>
          </div>

          {/* Ghi chú thêm (không bắt buộc) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Ghi chú thêm cho Tổng phụ trách (nếu có):
            </label>
            <textarea
              rows={2}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="VD: Lớp đủ sĩ số, nề nếp tốt..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Checkbox bắt buộc (Mục IX) */}
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-emerald-950 font-semibold select-none">
              <input
                type="checkbox"
                checked={isConfirmedByTeacher}
                onChange={(e) => setIsConfirmedByTeacher(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Tôi đã kiểm tra và xác nhận số liệu trên.</span>
            </label>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 2 Nút: QUAY LẠI, GỬI TỔNG PHỤ TRÁCH (Mục IX) */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('mode_selector')}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer text-center"
            >
              QUAY LẠI
            </button>

            <button
              type="button"
              disabled={!isConfirmedByTeacher || isSubmitting}
              onClick={handleSubmitAttendanceReport}
              className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <span>ĐANG GỬI...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI TỔNG PHỤ TRÁCH</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC X, XI, XII, XIII: MÀN HÌNH CHỌN HỌC SINH VẮNG / THAY ĐỔI
          - Mặc định: Tất cả học sinh = CÓ MẶT
          - Thanh tìm kiếm học sinh
          - Bộ lọc: TẤT CẢ, BÁN TRÚ, NGOẠI TRÚ, ĐÃ THAY ĐỔI, VẮNG
          - Sticky bottom summary: Sĩ số, Có mặt, Vắng, BT có mặt, Nút XEM & GỬI BÁO CÁO
      ================================================== */}
      {currentStep === 'has_absent_list' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Thanh chuyển chế độ nhanh */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('mode_selector')}
              className="text-xs text-blue-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đổi chế độ</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              Chạm vào học sinh để đổi tình trạng
            </span>
          </div>

          {/* MỤC XI: THANH TÌM KIẾM HỌC SINH */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên hoặc mã học sinh..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 shadow-2xs"
            />
          </div>

          {/* MỤC XIII: BỘ LỌC DANH SÁCH */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { key: 'all', label: `Tất cả (${summary.totalStudents})` },
              { key: 'changed', label: `Đã đổi (${summary.absentCount + summary.lateCount})` },
              { key: 'absent', label: `Vắng (${summary.absentCount})` },
              { key: 'boarding', label: `Bán trú (${summary.boardingTotal})` },
              { key: 'non_boarding', label: `Ngoại trú (${summary.nonBoardingTotal})` },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  filterType === f.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* MỤC XII: DANH SÁCH HỌC SINH DỄ CHẠM TRÊN MOBILE */}
          <div className="space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center text-xs text-slate-400 border border-slate-200">
                Không tìm thấy học sinh phù hợp.
              </div>
            ) : (
              filteredStudents.map((stu) => {
                const rec = records.find(r => r.studentId === stu.id);
                const status = rec?.status ? String(rec.status).toUpperCase() : 'PRESENT';
                const isAbsentExcused = status === 'ABSENT_EXCUSED';
                const isAbsentUnexcused = status === 'ABSENT_UNEXCUSED';
                const isLate = status === 'LATE';
                const isEarlyLeave = status === 'EARLY_LEAVE';
                const isPresent = status === 'PRESENT';

                return (
                  <div
                    key={stu.id}
                    onClick={() => handleOpenEditStudent(stu)}
                    className={`bg-white rounded-xl p-3 border shadow-2xs transition-all flex items-center justify-between cursor-pointer ${
                      isAbsentExcused
                        ? 'border-amber-300 bg-amber-50/20'
                        : isAbsentUnexcused
                        ? 'border-rose-300 bg-rose-50/20'
                        : isLate
                        ? 'border-purple-300 bg-purple-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {stu.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {stu.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            stu.boardingType === 'BOARDING'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}>
                            {stu.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                          </span>
                          <span>Mã: {stu.code}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isPresent && (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>CÓ MẶT</span>
                        </div>
                      )}
                      {isAbsentExcused && (
                        <div>
                          <div className="text-amber-800 font-black text-xs">VẮNG CÓ PHÉP</div>
                          <div className="text-[10px] text-amber-700 italic">{rec?.reason || 'Có đơn'}</div>
                        </div>
                      )}
                      {isAbsentUnexcused && (
                        <div>
                          <div className="text-rose-800 font-black text-xs">VẮNG K.PHÉP</div>
                          <div className="text-[10px] text-rose-700 italic">{rec?.reason || 'Chưa rõ'}</div>
                        </div>
                      )}
                      {isLate && (
                        <div>
                          <div className="text-purple-800 font-black text-xs">ĐI MUỘN</div>
                          <div className="text-[10px] text-purple-700">{rec?.reasonDetail || 'Đến muộn'}</div>
                        </div>
                      )}
                      {isEarlyLeave && (
                        <div>
                          <div className="text-indigo-800 font-black text-xs">VỀ SỚM</div>
                        </div>
                      )}

                      <span className="text-[10px] text-blue-600 font-bold hover:underline block mt-0.5">
                        THAY ĐỔI
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ==================================================
              MỤC XXI: THANH TÓM TẮT CỐ ĐỊNH Ở CUỐI MOBILE (STICKY BOTTOM SUMMARY)
              Sĩ số: 38 | Có mặt: 36 | Vắng: 2 | Bán trú có mặt: 30
              Nút: “XEM & GỬI BÁO CÁO”
          ================================================== */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white px-3 py-2.5 shadow-xl border-t border-slate-800 safe-area-bottom">
            <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-2">
                  <span>Sĩ số: <strong className="text-white font-mono">{summary.totalStudents}</strong></span>
                  <span>·</span>
                  <span>Có mặt: <strong className="text-emerald-400 font-mono">{summary.presentCount}</strong></span>
                  <span>·</span>
                  <span>Vắng: <strong className="text-rose-400 font-mono">{summary.absentCount}</strong></span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Bán trú có mặt: <strong className="text-amber-300 font-mono">{summary.boardingPresent}/{summary.boardingTotal}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsConfirmedByTeacher(false);
                  setValidationError(null);
                  setCurrentStep('review_report');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors whitespace-nowrap"
              >
                XEM & GỬI BÁO CÁO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC XXV, XXVI, XXVII, XXVIII: MÀN HÌNH KIỂM TRA TRƯỚC KHI GỬI
          (KIỂM TRA BÁO CÁO)
          LỚP ..., Ngày ..., GVCN ...
          SĨ SỐ (Tổng HS, Có mặt, Vắng, Có phép, Không phép, Đi muộn, Về sớm)
          BÁN TRÚ (Theo DS, Có mặt, Vắng)
          NGOẠI TRÚ (Theo DS, Có mặt, Vắng)
          DANH SÁCH HỌC SINH VẮNG
          CHECKBOX XÁC NHẬN -> BẬT NÚT GỬI TỔNG PHỤ TRÁCH DUYỆT
      ================================================== */}
      {currentStep === 'review_report' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded uppercase">
              Bước cuối cùng
            </span>
            <h2 className="text-base font-black text-slate-900 uppercase mt-1">
              KIỂM TRA BÁO CÁO SĨ SỐ LỚP {currentClass.name}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Ngày: <strong>{formatFullVietnameseDate(reportDate)}</strong> · GVCN: <strong>{currentUser?.name}</strong>
            </div>
          </div>

          {/* SĨ SỐ TỔNG HỢP (Mục XXV) */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-700 uppercase">SĨ SỐ LỚP:</div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-500">Tổng HS</span>
                <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{summary.totalStudents}</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl">
                <span className="text-[10px] text-emerald-700">Có mặt</span>
                <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">{summary.presentCount}</div>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl">
                <span className="text-[10px] text-rose-700">Vắng</span>
                <div className="text-lg font-black text-rose-800 font-mono mt-0.5">{summary.absentCount}</div>
              </div>
              <div className="bg-purple-50 p-2 rounded-xl">
                <span className="text-[10px] text-purple-700">Đi muộn</span>
                <div className="text-lg font-black text-purple-800 font-mono mt-0.5">{summary.lateCount}</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between px-1">
              <span>Vắng có phép: <strong className="text-amber-800">{summary.excusedAbsentCount}</strong></span>
              <span>Vắng không phép: <strong className="text-rose-800">{summary.unexcusedAbsentCount}</strong></span>
              <span>Về sớm: <strong className="text-indigo-800">{summary.earlyLeaveCount}</strong></span>
            </div>
          </div>

          {/* BÁN TRÚ & NGOẠI TRÚ (Mục XXV) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-amber-950 space-y-1">
              <div className="font-bold text-amber-900">BÁN TRÚ:</div>
              <div>Theo danh sách: <strong>{summary.boardingTotal}</strong></div>
              <div>Có mặt: <strong className="text-emerald-800">{summary.boardingPresent}</strong></div>
              <div>Vắng: <strong className="text-rose-800">{summary.boardingAbsent}</strong></div>
            </div>

            <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-blue-950 space-y-1">
              <div className="font-bold text-blue-900">NGOẠI TRÚ:</div>
              <div>Theo danh sách: <strong>{summary.nonBoardingTotal}</strong></div>
              <div>Có mặt: <strong className="text-emerald-800">{summary.nonBoardingPresent}</strong></div>
              <div>Vắng: <strong className="text-rose-800">{summary.nonBoardingAbsent}</strong></div>
            </div>
          </div>

          {/* MỤC XXVI: DANH SÁCH HỌC SINH VẮNG */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase">
              DANH SÁCH HỌC SINH VẮNG / THAY ĐỔI ({absentStudentsList.length}):
            </div>

            {absentStudentsList.length === 0 ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lớp đủ sĩ số.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {absentStudentsList.map((stu) => (
                  <div
                    key={stu.studentId}
                    className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-slate-900">{stu.studentName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">
                          {stu.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                        </span>
                        <span> · </span>
                        <span className="text-rose-800 font-bold">
                          {stu.status === 'ABSENT_EXCUSED' ? 'Vắng có phép' : stu.status === 'ABSENT_UNEXCUSED' ? 'Vắng không phép' : 'Đi muộn'}
                        </span>
                        {stu.reason && <span> · Lí do: {stu.reason}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Ghi chú thêm:
            </label>
            <textarea
              rows={2}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="VD: Học sinh Lò Văn C bị ốm phụ huynh đã gọi điện..."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
            />
          </div>

          {/* MỤC XXVIII: CHECKBOX XÁC NHẬN GỬI */}
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-emerald-950 font-semibold select-none">
              <input
                type="checkbox"
                checked={isConfirmedByTeacher}
                onChange={(e) => setIsConfirmedByTeacher(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Tôi xác nhận số liệu sĩ số lớp là chính xác.</span>
            </label>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 2 Nút: QUAY LẠI, GỬI TỔNG PHỤ TRÁCH DUYỆT */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('has_absent_list')}
              className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer text-center"
            >
              QUAY LẠI
            </button>

            <button
              type="button"
              disabled={!isConfirmedByTeacher || isSubmitting}
              onClick={handleSubmitAttendanceReport}
              className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <span>ĐANG GỬI...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>XÁC NHẬN BÁO CÁO {getSessionDisplayName(selectedSession).toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          MỤC XXX: SAU KHI GỬI THÀNH CÔNG (MÀN HÌNH RÕ RÀNG)
          GỬI BÁO CÁO THÀNH CÔNG
          Báo cáo sĩ số lớp [LỚP] đã được gửi đến Tổng phụ trách.
          Trạng thái: ĐANG CHỜ DUYỆT
          Thời gian gửi: ...
          Tóm tắt: Sĩ số, Có mặt, Vắng, Bán trú có mặt, Ngoại trú có mặt
          Nút: VỀ TRANG CHỦ, XEM BÁO CÁO
      ================================================== */}
      {currentStep === 'submission_success' && existingReport && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase">
              GỬI BÁO CÁO THÀNH CÔNG!
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Báo cáo sĩ số lớp <strong>{currentClass.name}</strong> đã được gửi đến Tổng phụ trách lúc <strong>{existingReport.submittedAt}</strong>.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>TRẠNG THÁI: ĐANG CHỜ DUYỆT</span>
            </div>
          </div>

          {/* Tóm tắt */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 text-left">
            <div className="font-bold text-slate-700 mb-1">Tóm tắt số liệu gửi đi:</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>Sĩ số: <strong className="text-slate-900">{existingReport.totalStudents}</strong></div>
              <div>Có mặt: <strong className="text-emerald-800">{existingReport.presentCount}</strong></div>
              <div>Vắng: <strong className="text-rose-800">{existingReport.absentCount}</strong></div>
              <div>Bán trú có mặt: <strong className="text-amber-800">{existingReport.boardingPresent}/{existingReport.boardingTotal}</strong></div>
              <div className="col-span-2">Ngoại trú có mặt: <strong className="text-blue-900">{existingReport.nonBoardingPresent}/{existingReport.nonBoardingTotal}</strong></div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                VỀ TRANG CHỦ
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentStep('review_report')}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer text-center"
            >
              XEM BÁO CÁO
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* ==================================================
          MỤC XIV, XV, XVI, XVII, XVIII, XIX:
          BOTTOM SHEET MODAL CHỈNH TÌNH TRẠNG MỘT HỌC SINH
          - Họ tên, Lớp, Bán trú/Ngoại trú
          - Trạng thái: CÓ MẶT, VẮNG CÓ PHÉP, VẮNG KHÔNG PHÉP, ĐI MUỘN, VỀ SỚM, KHÁC
          - Lí do (Ốm, Đi khám, Gia đình có việc, Xin nghỉ, Việc cá nhân, Khác)
          - Ghi chú
      ================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  editingStudent.boardingType === 'BOARDING'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {editingStudent.boardingType === 'BOARDING' ? 'Học sinh Bán trú' : 'Học sinh Ngoại trú'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {editingStudent.fullName}
                </h3>
                <div className="text-[11px] text-slate-500">
                  Lớp {currentClass.name} · Mã: {editingStudent.code}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MỤC XIV: CHỌN TRẠNG THÁI HÔM NAY */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block uppercase">
                TRẠNG THÁI HÔM NAY:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'PRESENT', label: 'CÓ MẶT', color: 'bg-emerald-600 text-white' },
                  { key: 'ABSENT_EXCUSED', label: 'VẮNG CÓ PHÉP', color: 'bg-amber-600 text-white' },
                  { key: 'ABSENT_UNEXCUSED', label: 'VẮNG K.PHÉP', color: 'bg-rose-600 text-white' },
                  { key: 'LATE', label: 'ĐI MUỘN', color: 'bg-purple-600 text-white' },
                  { key: 'EARLY_LEAVE', label: 'VỀ SỚM', color: 'bg-indigo-600 text-white' },
                  { key: 'OTHER', label: 'KHÁC', color: 'bg-slate-700 text-white' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setEditStatus(opt.key as any)}
                    className={`py-2.5 px-3 rounded-xl font-bold cursor-pointer transition-all text-center ${
                      editStatus === opt.key
                        ? `${opt.color} shadow-sm ring-2 ring-slate-900/10`
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MỤC XV: VẮNG CÓ PHÉP -> CHỌN LÍ DO */}
            {editStatus === 'ABSENT_EXCUSED' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  LÍ DO NGHỈ:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {['Ốm', 'Đi khám bệnh', 'Gia đình có việc', 'Xin nghỉ', 'Việc cá nhân', 'Khác'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditReason(r)}
                      className={`p-2 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                        editReason === r
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {editReason === 'Khác' && (
                  <input
                    type="text"
                    value={editCustomReason}
                    onChange={(e) => setEditCustomReason(e.target.value)}
                    placeholder="Nhập lí do cụ thể..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                )}
              </div>
            )}

            {/* MỤC XVI: VẮNG KHÔNG PHÉP */}
            {editStatus === 'ABSENT_UNEXCUSED' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-rose-800 block">
                  TÌNH TRẠNG: VẮNG KHÔNG PHÉP
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {['Chưa rõ lí do', 'Tự ý nghỉ học', 'Phụ huynh chưa liên lạc được'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditReason(r)}
                      className={`p-2 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                        editReason === r
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MỤC XVII: ĐI MUỘN */}
            {editStatus === 'LATE' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-purple-800 block">
                  GIỜ ĐẾN LỚP:
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
                <input
                  type="text"
                  value={editCustomReason}
                  onChange={(e) => setEditCustomReason(e.target.value)}
                  placeholder="Lí do đi muộn (hỏng xe, dậy muộn...)"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            )}

            {/* MỤC XVIII: VỀ SỚM */}
            {editStatus === 'EARLY_LEAVE' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-indigo-800 block">
                  GIỜ VỀ:
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
                <input
                  type="text"
                  value={editCustomReason}
                  onChange={(e) => setEditCustomReason(e.target.value)}
                  placeholder="Lí do về sớm (ốm đột xuất, gia đình đón...)"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            )}

            {/* MỤC XIX: KHÁC */}
            {editStatus === 'OTHER' && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  MÔ TẢ TRƯỜNG HỢP ĐẶC BIỆT:
                </label>
                <input
                  type="text"
                  value={editCustomReason}
                  onChange={(e) => setEditCustomReason(e.target.value)}
                  placeholder="VD: Tham gia hoạt động cấp huyện..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>
            )}

            {/* Ghi chú chung */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                Ghi chú thêm:
              </label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ghi chú nội bộ..."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Nút lưu tình trạng */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleSaveStudentStatus}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                LƯU TÌNH TRẠNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
