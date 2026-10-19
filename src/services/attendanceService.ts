import {
  AttendanceReport,
  AttendanceRecord,
  SchoolClass,
  Student,
  SchoolDailyReport,
  SessionType,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import { storageService } from './storageService';
import { getTodayDateString } from '../utils/formatters';

export interface SchoolDashboardStats {
  totalClasses: number;
  submittedClassesCount: number;
  approvedClassesCount: number;
  pendingClassesCount: number;
  revisionRequiredCount: number;
  unsubmittedClassesCount: number;

  totalStudentsRoster: number; // Tổng số học sinh toàn trường theo danh sách
  confirmedStudents: number; // Tổng số học sinh của các lớp ĐÃ DUYỆT

  // Sĩ số chính thức (chỉ tính từ các lớp đã APPROVED hoặc LOCKED)
  presentCount: number;
  absentCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  earlyLeaveCount: number;

  // Bán trú
  boardingTotalRoster: number;
  boardingConfirmedTotal: number;
  boardingPresent: number;
  boardingAbsent: number;
  boardingMealsExpected: number;

  // Ngoại trú
  nonBoardingTotalRoster: number;
  nonBoardingConfirmedTotal: number;
  nonBoardingPresent: number;
  nonBoardingAbsent: number;

  // Rates
  attendanceRate: number;
  reportedPercent: number;
  approvedPercent: number;

  unsubmittedClasses: SchoolClass[];
  pendingClasses: SchoolClass[];
  revisionClasses: SchoolClass[];
  approvedClasses: SchoolClass[];
}

export interface GradeSummary {
  grade: number;
  gradeLabel: string;
  totalClasses: number;
  approvedClasses: number;
  submittedClasses: number;
  totalStudentsRoster: number;
  confirmedStudents: number;
  presentCount: number;
  absentCount: number;
  boardingTotal: number;
  boardingPresent: number;
  boardingAbsent: number;
  nonBoardingTotal: number;
  nonBoardingPresent: number;
  nonBoardingAbsent: number;
  attendanceRate: number;
}

export interface BusinessWarning {
  id: string;
  type: 'unreported' | 'pending' | 'revision' | 'high_absence' | 'unspecified_reason';
  level: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  classId?: string;
  className?: string;
}

class AttendanceService {
  /**
   * Get comprehensive dashboard metrics for a specific date and session
   * STRICT PRINCIPLE (Mục I, XX, XXI, XXXV):
   * - Buổi sáng và Buổi chiều là HAI BÁO CÁO ĐỘC LẬP
   * - Chỉ lấy đúng phiên được yêu cầu (MORNING hoặc AFTERNOON)
   * - Chỉ tính các lớp ĐÃ DUYỆT (APPROVED/LOCKED) vào sĩ số chính thức!
   */
  public getDashboardStats(
    date: string = getTodayDateString(),
    session: SessionType = 'MORNING'
  ): SchoolDashboardStats {
    const classes = storageService.getClasses().filter(c => c.isActive);
    const students = storageService.getStudents().filter(s => s.status === 'active');
    const norm = normalizeSession(session);
    const reports = storageService.getReportsByDate(date, norm);

    const totalClasses = classes.length;
    const totalStudentsRoster = students.length;
    const boardingTotalRoster = students.filter(s => s.boardingType === 'BOARDING').length;
    const nonBoardingTotalRoster = students.filter(s => s.boardingType === 'NON_BOARDING').length;

    const reportByClassId = new Map<string, AttendanceReport>();
    reports.forEach(r => reportByClassId.set(r.classId, r));

    let submittedClassesCount = 0;
    let approvedClassesCount = 0;
    let pendingClassesCount = 0;
    let revisionRequiredCount = 0;
    let unsubmittedClassesCount = 0;

    let confirmedStudents = 0;
    let presentCount = 0;
    let absentCount = 0;
    let absentExcusedCount = 0;
    let absentUnexcusedCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;

    let boardingConfirmedTotal = 0;
    let boardingPresent = 0;
    let boardingAbsent = 0;
    let boardingMealsExpected = 0;

    let nonBoardingConfirmedTotal = 0;
    let nonBoardingPresent = 0;
    let nonBoardingAbsent = 0;

    const unsubmittedClasses: SchoolClass[] = [];
    const pendingClasses: SchoolClass[] = [];
    const revisionClasses: SchoolClass[] = [];
    const approvedClasses: SchoolClass[] = [];

    for (const cls of classes) {
      const rep = reportByClassId.get(cls.id);
      if (!rep || rep.status === 'NOT_SUBMITTED' || (rep.status as string) === 'not_reported') {
        unsubmittedClassesCount++;
        unsubmittedClasses.push(cls);
      } else if (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted') {
        submittedClassesCount++;
        pendingClassesCount++;
        pendingClasses.push(cls);
      } else if (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision') {
        submittedClassesCount++;
        revisionRequiredCount++;
        revisionClasses.push(cls);
      } else if (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked') {
        submittedClassesCount++;
        approvedClassesCount++;
        approvedClasses.push(cls);

        // ONLY APPROVED OR LOCKED CLASSES CONTRIBUTE TO CONFIRMED FIGURES!
        confirmedStudents += rep.totalStudents;
        presentCount += rep.presentCount;
        absentCount += rep.absentCount;
        absentExcusedCount += rep.excusedAbsentCount ?? rep.absentExcusedCount ?? 0;
        absentUnexcusedCount += rep.unexcusedAbsentCount ?? rep.absentUnexcusedCount ?? 0;
        lateCount += rep.lateCount ?? 0;
        earlyLeaveCount += rep.earlyLeaveCount ?? 0;

        boardingConfirmedTotal += rep.boardingTotal;
        boardingPresent += rep.boardingPresent;
        boardingAbsent += rep.boardingAbsent;
        boardingMealsExpected += rep.boardingMealsExpected ?? rep.boardingPresent;

        nonBoardingConfirmedTotal += rep.nonBoardingTotal ?? rep.dayTotal ?? 0;
        nonBoardingPresent += rep.nonBoardingPresent ?? rep.dayPresent ?? 0;
        nonBoardingAbsent += rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0;
      }
    }

    const reportedPercent = totalClasses > 0 ? (submittedClassesCount / totalClasses) * 100 : 0;
    const approvedPercent = totalClasses > 0 ? (approvedClassesCount / totalClasses) * 100 : 0;
    const attendanceRate = confirmedStudents > 0 ? (presentCount / confirmedStudents) * 100 : 0;

    return {
      totalClasses,
      submittedClassesCount,
      approvedClassesCount,
      pendingClassesCount,
      revisionRequiredCount,
      unsubmittedClassesCount,
      totalStudentsRoster,
      confirmedStudents,
      presentCount,
      absentCount,
      absentExcusedCount,
      absentUnexcusedCount,
      lateCount,
      earlyLeaveCount,
      boardingTotalRoster,
      boardingConfirmedTotal,
      boardingPresent,
      boardingAbsent,
      boardingMealsExpected,
      nonBoardingTotalRoster,
      nonBoardingConfirmedTotal,
      nonBoardingPresent,
      nonBoardingAbsent,
      attendanceRate,
      reportedPercent,
      approvedPercent,
      unsubmittedClasses,
      pendingClasses,
      revisionClasses,
      approvedClasses,
    };
  }

  /**
   * Get summary statistics broken down by grade (Khối 6, 7, 8, 9)
   * Section AL: 4 grade cards with 5 classes each
   */
  public getGradeSummaries(date: string = getTodayDateString(), session: SessionType = 'MORNING'): {
    grades: GradeSummary[];
    total: GradeSummary;
  } {
    const classes = storageService.getClasses().filter(c => c.isActive);
    const students = storageService.getStudents().filter(s => s.status === 'active');
    const norm = normalizeSession(session);
    const reports = storageService.getReportsByDate(date, norm);

    const gradeList = [6, 7, 8, 9];
    const grades: GradeSummary[] = [];

    let allRosterStudents = 0;
    let allConfirmedStudents = 0;
    let allPresent = 0;
    let allAbsent = 0;
    let allBoardingTotal = 0;
    let allBoardingPresent = 0;
    let allBoardingAbsent = 0;
    let allNonBoardingTotal = 0;
    let allNonBoardingPresent = 0;
    let allNonBoardingAbsent = 0;
    let allApprovedClasses = 0;
    let allSubmittedClasses = 0;

    for (const g of gradeList) {
      const gradeClasses = classes.filter(c => c.grade === g);
      const gradeStudents = students.filter(s => s.grade === g);
      const gradeReports = reports.filter(r => r.grade === g);

      const gTotalStudentsRoster = gradeStudents.length;
      const gBoardingTotal = gradeStudents.filter(s => s.boardingType === 'BOARDING').length;
      const gNonBoardingTotal = gradeStudents.filter(s => s.boardingType === 'NON_BOARDING').length;

      let gConfirmed = 0;
      let gPresent = 0;
      let gAbsent = 0;
      let gBoardingPresent = 0;
      let gBoardingAbsent = 0;
      let gNonBoardingPresent = 0;
      let gNonBoardingAbsent = 0;
      let gApproved = 0;
      let gSubmitted = 0;

      for (const cls of gradeClasses) {
        const rep = gradeReports.find(r => r.classId === cls.id);
        if (rep) {
          if (rep.status !== 'NOT_SUBMITTED' && (rep.status as string) !== 'not_reported') {
            gSubmitted++;
          }
          if (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked') {
            gApproved++;
            gConfirmed += rep.totalStudents;
            gPresent += rep.presentCount;
            gAbsent += rep.absentCount;
            gBoardingPresent += rep.boardingPresent;
            gBoardingAbsent += rep.boardingAbsent;
            gNonBoardingPresent += rep.nonBoardingPresent ?? rep.dayPresent ?? 0;
            gNonBoardingAbsent += rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0;
          }
        }
      }

      const attRate = gConfirmed > 0 ? (gPresent / gConfirmed) * 100 : 0;

      grades.push({
        grade: g,
        gradeLabel: `Khối ${g}`,
        totalClasses: gradeClasses.length,
        approvedClasses: gApproved,
        submittedClasses: gSubmitted,
        totalStudentsRoster: gTotalStudentsRoster,
        confirmedStudents: gConfirmed,
        presentCount: gPresent,
        absentCount: gAbsent,
        boardingTotal: gBoardingTotal,
        boardingPresent: gBoardingPresent,
        boardingAbsent: gBoardingAbsent,
        nonBoardingTotal: gNonBoardingTotal,
        nonBoardingPresent: gNonBoardingPresent,
        nonBoardingAbsent: gNonBoardingAbsent,
        attendanceRate: attRate,
      });

      allRosterStudents += gTotalStudentsRoster;
      allConfirmedStudents += gConfirmed;
      allPresent += gPresent;
      allAbsent += gAbsent;
      allBoardingTotal += gBoardingTotal;
      allBoardingPresent += gBoardingPresent;
      allBoardingAbsent += gBoardingAbsent;
      allNonBoardingTotal += gNonBoardingTotal;
      allNonBoardingPresent += gNonBoardingPresent;
      allNonBoardingAbsent += gNonBoardingAbsent;
      allApprovedClasses += gApproved;
      allSubmittedClasses += gSubmitted;
    }

    const allAttRate = allConfirmedStudents > 0 ? (allPresent / allConfirmedStudents) * 100 : 0;

    const total: GradeSummary = {
      grade: 0,
      gradeLabel: 'TOÀN TRƯỜNG',
      totalClasses: classes.length,
      approvedClasses: allApprovedClasses,
      submittedClasses: allSubmittedClasses,
      totalStudentsRoster: allRosterStudents,
      confirmedStudents: allConfirmedStudents,
      presentCount: allPresent,
      absentCount: allAbsent,
      boardingTotal: allBoardingTotal,
      boardingPresent: allBoardingPresent,
      boardingAbsent: allBoardingAbsent,
      nonBoardingTotal: allNonBoardingTotal,
      nonBoardingPresent: allNonBoardingPresent,
      nonBoardingAbsent: allNonBoardingAbsent,
      attendanceRate: allAttRate,
    };

    return { grades, total };
  }

  /**
   * Get absent and late students for a specific date and session
   * Only includes students from APPROVED/LOCKED reports (or include pending if requested)
   */
  public getAbsentStudents(
    date: string = getTodayDateString(),
    filters?: {
      grade?: number;
      classId?: string;
      session?: SessionType | 'ALL';
      boardingType?: string;
      excused?: 'all' | 'excused' | 'unexcused';
      searchTerm?: string;
      includePending?: boolean;
    }
  ): AttendanceRecord[] {
    let reports = storageService.getReportsByDate(date);
    if (filters?.session && filters.session !== 'ALL') {
      const norm = normalizeSession(filters.session);
      reports = reports.filter(r => normalizeSession(r.session) === norm);
    }

    let absentRecords: AttendanceRecord[] = [];

    for (const rep of reports) {
      const isApprovedOrLocked = rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked';
      if (!isApprovedOrLocked && !filters?.includePending) {
        continue; // Strict: only approved unless explicitly asked
      }

      if (rep.records && rep.records.length > 0) {
        const notPresents = rep.records.filter(r => {
          const s = (r.status as string).toUpperCase();
          return s === 'ABSENT_EXCUSED' || s === 'ABSENT_UNEXCUSED' || s === 'LATE' || s === 'EARLY_LEAVE' || s === 'FULL_DAY_ABSENCE';
        });
        absentRecords.push(...notPresents);
      }
    }

    if (!filters) return absentRecords;

    return absentRecords.filter(rec => {
      if (filters.grade && rec.grade !== filters.grade) return false;
      if (filters.classId && filters.classId !== 'all' && rec.classId !== filters.classId) return false;

      const recBoarding = rec.boardingType || (rec.studentType === 'boarding' ? 'BOARDING' : 'NON_BOARDING');
      if (filters.boardingType && filters.boardingType !== 'all') {
        if (filters.boardingType === 'BOARDING' && recBoarding !== 'BOARDING') return false;
        if (filters.boardingType === 'NON_BOARDING' && recBoarding !== 'NON_BOARDING') return false;
      }

      const recStatus = (rec.status as string).toUpperCase();
      if (filters.excused === 'excused' && recStatus !== 'ABSENT_EXCUSED') return false;
      if (filters.excused === 'unexcused' && recStatus !== 'ABSENT_UNEXCUSED') return false;

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(term);
        const matchCode = rec.studentCode.toLowerCase().includes(term);
        const matchClass = rec.className.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchClass) return false;
      }
      return true;
    });
  }

  /**
   * Business warnings before finalizing
   * Section AK, XLI: Precise class-level warnings with session specification
   */
  public getBusinessWarnings(date: string = getTodayDateString(), session: SessionType = 'MORNING'): BusinessWarning[] {
    const warnings: BusinessWarning[] = [];
    const classes = storageService.getClasses().filter(c => c.isActive);
    const norm = normalizeSession(session);
    const sessionLabel = getSessionDisplayName(norm);
    const reports = storageService.getReportsByDate(date, norm);
    const reportMap = new Map<string, AttendanceReport>();
    reports.forEach(r => reportMap.set(r.classId, r));

    // 1. Unsubmitted classes
    for (const c of classes) {
      const rep = reportMap.get(c.id);
      if (!rep || rep.status === 'NOT_SUBMITTED' || (rep.status as string) === 'not_reported') {
        warnings.push({
          id: `warn_unrep_${c.id}_${norm}`,
          type: 'unreported',
          level: 'warning',
          title: `Lớp ${c.name}: Chưa báo cáo sĩ số ${sessionLabel}`,
          message: `GVCN ${c.teacherName || 'Chưa phân công'} (${c.teacherPhone || 'Chưa có SĐT'}) chưa gửi báo cáo sĩ số ${sessionLabel.toLowerCase()}.`,
          classId: c.id,
          className: c.name,
        });
      } else if (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted') {
        warnings.push({
          id: `warn_pend_${c.id}_${norm}`,
          type: 'pending',
          level: 'info',
          title: `Lớp ${c.name}: ${sessionLabel} đang chờ duyệt`,
          message: `GVCN ${c.teacherName} đã gửi lúc ${rep.submittedAt || ''}. Tổng phụ trách cần kiểm tra và bấm duyệt.`,
          classId: c.id,
          className: c.name,
        });
      } else if (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision') {
        warnings.push({
          id: `warn_rev_${c.id}_${norm}`,
          type: 'revision',
          level: 'danger',
          title: `Lớp ${c.name}: ${sessionLabel} cần chỉnh sửa`,
          message: `Tổng phụ trách đã yêu cầu sửa: "${rep.revisionReason || ''}". Đang chờ GVCN sửa lại.`,
          classId: c.id,
          className: c.name,
        });
      } else if (rep.absentCount >= 3) {
        warnings.push({
          id: `warn_high_${c.id}_${norm}`,
          type: 'high_absence',
          level: 'danger',
          title: `Lớp ${c.name}: Tỉ lệ vắng cao ${sessionLabel} (${rep.absentCount} học sinh)`,
          message: `Có ${rep.excusedAbsentCount ?? rep.absentExcusedCount} có phép, ${rep.unexcusedAbsentCount ?? rep.absentUnexcusedCount} không phép. Cần GVCN theo dõi sát sao.`,
          classId: c.id,
          className: c.name,
        });
      }
    }

    return warnings;
  }

  /**
   * Student attendance profile / history
   */
  public getStudentAttendanceProfile(studentId: string) {
    const students = storageService.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const allReports = storageService.getReports();
    const historyRecords: AttendanceRecord[] = [];

    let totalDaysTracked = 0;
    let presentDays = 0;
    let absentExcused = 0;
    let absentUnexcused = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;

    for (const rep of allReports) {
      const rec = rep.records.find(r => r.studentId === studentId);
      if (rec) {
        totalDaysTracked++;
        const s = (rec.status as string).toUpperCase();
        if (s === 'PRESENT') {
          presentDays++;
        } else if (s === 'ABSENT_EXCUSED') {
          absentExcused++;
          historyRecords.push(rec);
        } else if (s === 'ABSENT_UNEXCUSED') {
          absentUnexcused++;
          historyRecords.push(rec);
        } else if (s === 'LATE') {
          lateCount++;
          historyRecords.push(rec);
        } else if (s === 'EARLY_LEAVE') {
          earlyLeaveCount++;
          historyRecords.push(rec);
        }
      }
    }

    const attendanceRate = totalDaysTracked > 0 ? ((presentDays + lateCount + earlyLeaveCount) / totalDaysTracked) * 100 : 100;

    return {
      student,
      totalDaysTracked,
      presentDays,
      absentExcused,
      absentUnexcused,
      lateCount,
      earlyLeaveCount,
      totalAbsences: absentExcused + absentUnexcused,
      attendanceRate,
      historyRecords: historyRecords.sort((a, b) => b.date.localeCompare(a.date)),
    };
  }
}

export const attendanceService = new AttendanceService();
