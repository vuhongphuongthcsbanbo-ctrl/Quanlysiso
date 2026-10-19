import {
  AttendanceReport,
  AttendanceRecord,
  SchoolClass,
  Student,
  SchoolDailyReport,
  SessionType,
  ReportStatus,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import { storageService } from './storageService';
import { attendanceService } from './attendanceService';
import { calculateAttendanceRate, filterApprovedReports } from './reportCalculationService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';

export interface DailyClassRow {
  stt: number;
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  teacherPhone?: string;
  totalStudents: number;
  presentCount: number | string;
  absentCount: number | string;
  excusedAbsentCount: number | string;
  unexcusedAbsentCount: number | string;
  lateCount: number | string;
  earlyLeaveCount: number | string;
  boardingTotal: number;
  boardingPresent: number | string;
  boardingAbsent: number | string;
  nonBoardingTotal: number;
  nonBoardingPresent: number | string;
  nonBoardingAbsent: number | string;
  status: ReportStatus;
  statusText: string;
  isApproved: boolean;
  submittedAt?: string;
  approvedAt?: string;
  deadlineAt?: string;
  lateByMinutes?: number;
  revisionCount?: number;
}

export interface GradeGroupSummary {
  grade: number;
  gradeLabel: string;
  classes: DailyClassRow[];
  totalStudents: number;
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
  approvedClassesCount: number;
  totalClassesCount: number;
}

export interface DayOverDayComparison {
  currentDate: string;
  previousDate: string;
  currentPresent: number;
  previousPresent: number;
  presentDiff: number;
  currentAbsent: number;
  previousAbsent: number;
  absentDiff: number;
  currentRate: number;
  previousRate: number;
  rateDiff: number;
}

class DailyReportService {
  /**
   * Get full daily attendance report snapshot
   */
  public getDailyAttendanceReport(
    date: string = getTodayDateString(),
    session: SessionType = 'MORNING'
  ) {
    const normSession = normalizeSession(session);
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');
    const settings = storageService.getSettings();
    const reports = storageService.getReportsByDate(date, normSession);
    const savedOfficial = storageService.getDailyOfficialReport(date, normSession);

    const reportMap = new Map<string, AttendanceReport>();
    reports.forEach(r => reportMap.set(r.classId, r));

    let totalStudentsRoster = allStudents.length;
    let confirmedStudents = 0;
    let presentCount = 0;
    let absentCount = 0;
    let excusedAbsentCount = 0;
    let unexcusedAbsentCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;

    let boardingTotalRoster = allStudents.filter(s => s.boardingType === 'BOARDING').length;
    let boardingConfirmed = 0;
    let boardingPresent = 0;
    let boardingAbsent = 0;

    let nonBoardingTotalRoster = allStudents.filter(s => s.boardingType === 'NON_BOARDING').length;
    let nonBoardingConfirmed = 0;
    let nonBoardingPresent = 0;
    let nonBoardingAbsent = 0;

    let submittedCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let revisionCount = 0;
    let unsubmittedCount = 0;

    const classRows: DailyClassRow[] = [];

    // Construct 20 class rows
    classes.forEach((cls, idx) => {
      const rep = reportMap.get(cls.id);
      const isApproved =
        !!rep && (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked');
      const isPending = !!rep && (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted');
      const isRevision = !!rep && (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision');

      let statusText = 'CHƯA BÁO CÁO';
      if (rep?.status === 'APPROVED') statusText = 'ĐÃ DUYỆT';
      else if (rep?.status === 'LOCKED' || (rep?.status as string) === 'locked') statusText = 'ĐÃ KHÓA';
      else if (isPending) statusText = 'CHỜ DUYỆT';
      else if (isRevision) statusText = 'CẦN CHỈNH SỬA';

      if (!rep || rep.status === 'NOT_SUBMITTED') {
        unsubmittedCount++;
      } else if (isPending) {
        submittedCount++;
        pendingCount++;
      } else if (isRevision) {
        submittedCount++;
        revisionCount++;
      } else if (isApproved) {
        submittedCount++;
        approvedCount++;

        confirmedStudents += rep.totalStudents;
        presentCount += rep.presentCount;
        absentCount += rep.absentCount;
        excusedAbsentCount += rep.excusedAbsentCount ?? rep.absentExcusedCount ?? 0;
        unexcusedAbsentCount += rep.unexcusedAbsentCount ?? rep.absentUnexcusedCount ?? 0;
        lateCount += rep.lateCount || 0;
        earlyLeaveCount += rep.earlyLeaveCount || 0;

        boardingConfirmed += rep.boardingTotal;
        boardingPresent += rep.boardingPresent;
        boardingAbsent += rep.boardingAbsent;

        const nbTotal = rep.nonBoardingTotal ?? rep.dayTotal ?? 0;
        const nbPresent = rep.nonBoardingPresent ?? rep.dayPresent ?? 0;
        const nbAbsent = rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0;

        nonBoardingConfirmed += nbTotal;
        nonBoardingPresent += nbPresent;
        nonBoardingAbsent += nbAbsent;
      }

      // Class-specific active student count
      const clsStudents = allStudents.filter(s => s.classId === cls.id || s.className === cls.name);
      const clsBoardingTotal = rep?.boardingTotal ?? clsStudents.filter(s => s.boardingType === 'BOARDING').length;
      const clsNonBoardingTotal = rep?.nonBoardingTotal ?? clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length;
      const clsTotalStudents = rep?.totalStudents ?? clsStudents.length;

      classRows.push({
        stt: idx + 1,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherName: rep?.teacherName || cls.teacherName || 'Chưa phân công',
        teacherPhone: cls.teacherPhone,
        totalStudents: clsTotalStudents,
        presentCount: isApproved ? rep.presentCount : '--',
        absentCount: isApproved ? rep.absentCount : '--',
        excusedAbsentCount: isApproved ? (rep.excusedAbsentCount ?? rep.absentExcusedCount ?? 0) : '--',
        unexcusedAbsentCount: isApproved ? (rep.unexcusedAbsentCount ?? rep.absentUnexcusedCount ?? 0) : '--',
        lateCount: isApproved ? rep.lateCount : '--',
        earlyLeaveCount: isApproved ? (rep.earlyLeaveCount || 0) : '--',
        boardingTotal: clsBoardingTotal,
        boardingPresent: isApproved ? rep.boardingPresent : '--',
        boardingAbsent: isApproved ? rep.boardingAbsent : '--',
        nonBoardingTotal: clsNonBoardingTotal,
        nonBoardingPresent: isApproved ? (rep.nonBoardingPresent ?? rep.dayPresent ?? 0) : '--',
        nonBoardingAbsent: isApproved ? (rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0) : '--',
        status: rep?.status || 'NOT_SUBMITTED',
        statusText,
        isApproved,
        submittedAt: rep?.submittedAt,
        approvedAt: rep?.approvedAt,
        deadlineAt: rep?.deadlineAt,
        lateByMinutes: rep?.lateByMinutes,
        revisionCount: rep?.revisionCount || 0,
      });
    });

    // Check if official snapshot is locked
    const isOfficialLocked = !!savedOfficial && savedOfficial.reportStatus === 'LOCKED';
    const isAllClassesApproved = approvedCount === classes.length && classes.length > 0;
    const isOfficial = isOfficialLocked || isAllClassesApproved;

    // Use saved snapshot if finalized and available to guarantee historical immutability (Mục XIII, LXI, LXXVII)
    if (isOfficialLocked && savedOfficial) {
      if (savedOfficial.totalStudentsSnapshot !== undefined) {
        totalStudentsRoster = savedOfficial.totalStudentsSnapshot;
      }
      if (savedOfficial.boardingTotalSnapshot !== undefined) {
        boardingTotalRoster = savedOfficial.boardingTotalSnapshot;
      }
      if (savedOfficial.nonBoardingTotalSnapshot !== undefined) {
        nonBoardingTotalRoster = savedOfficial.nonBoardingTotalSnapshot;
      }
    }

    const attendanceRate = calculateAttendanceRate(confirmedStudents, presentCount);
    const boardingRate = boardingConfirmed > 0 ? (boardingPresent / boardingConfirmed) * 100 : 100;
    const nonBoardingRate = nonBoardingConfirmed > 0 ? (nonBoardingPresent / nonBoardingConfirmed) * 100 : 100;

    // Group by grades 6, 7, 8, 9
    const gradesList = [6, 7, 8, 9];
    const gradeGroups: GradeGroupSummary[] = gradesList.map(grade => {
      const gClasses = classRows.filter(r => r.grade === grade);
      const gTotal = gClasses.reduce((sum, c) => sum + c.totalStudents, 0);
      let gConfirmed = 0;
      let gPresent = 0;
      let gAbsent = 0;
      let gBoardingTotal = 0;
      let gBoardingPresent = 0;
      let gBoardingAbsent = 0;
      let gNonBoardingTotal = 0;
      let gNonBoardingPresent = 0;
      let gNonBoardingAbsent = 0;
      let gApprovedCount = 0;

      gClasses.forEach(c => {
        gBoardingTotal += c.boardingTotal;
        gNonBoardingTotal += c.nonBoardingTotal;
        if (c.isApproved) {
          gApprovedCount++;
          gConfirmed += c.totalStudents;
          gPresent += typeof c.presentCount === 'number' ? c.presentCount : 0;
          gAbsent += typeof c.absentCount === 'number' ? c.absentCount : 0;
          gBoardingPresent += typeof c.boardingPresent === 'number' ? c.boardingPresent : 0;
          gBoardingAbsent += typeof c.boardingAbsent === 'number' ? c.boardingAbsent : 0;
          gNonBoardingPresent += typeof c.nonBoardingPresent === 'number' ? c.nonBoardingPresent : 0;
          gNonBoardingAbsent += typeof c.nonBoardingAbsent === 'number' ? c.nonBoardingAbsent : 0;
        }
      });

      return {
        grade,
        gradeLabel: `Khối ${grade}`,
        classes: gClasses,
        totalStudents: gTotal,
        confirmedStudents: gConfirmed,
        presentCount: gPresent,
        absentCount: gAbsent,
        boardingTotal: gBoardingTotal,
        boardingPresent: gBoardingPresent,
        boardingAbsent: gBoardingAbsent,
        nonBoardingTotal: gNonBoardingTotal,
        nonBoardingPresent: gNonBoardingPresent,
        nonBoardingAbsent: gNonBoardingAbsent,
        attendanceRate: calculateAttendanceRate(gConfirmed, gPresent),
        approvedClassesCount: gApprovedCount,
        totalClassesCount: gClasses.length,
      };
    });

    // Absent students list for this day
    const absentRecords: AttendanceRecord[] = [];
    reports.forEach(r => {
      // For official reporting, only approved/locked class records are counted officially
      if (r.status === 'APPROVED' || r.status === 'LOCKED' || (r.status as string) === 'locked') {
        (r.records || []).forEach(rec => {
          const st = String(rec.status).toUpperCase();
          if (st === 'ABSENT_EXCUSED' || st === 'ABSENT_UNEXCUSED' || st === 'FULL_DAY_ABSENCE' || (st === 'OTHER' && (rec.absenceType === 'excused' || rec.absenceType === 'unexcused'))) {
            absentRecords.push(rec);
          }
        });
      }
    });

    const boardingAbsentRecords = absentRecords.filter(r => r.boardingType === 'BOARDING');
    const nonBoardingAbsentRecords = absentRecords.filter(r => r.boardingType === 'NON_BOARDING');

    const unapprovedClasses = classRows.filter(c => !c.isApproved).map(c => c.className);

    return {
      date,
      session: normSession,
      sessionLabel: getSessionDisplayName(normSession),
      schoolYearId: settings.schoolYear || '2026-2027',
      isOfficial,
      isOfficialLocked,
      reportStatus: isOfficialLocked ? 'LOCKED' : isAllClassesApproved ? 'OFFICIAL' : 'PRELIMINARY',
      reportVersion: savedOfficial?.reportVersion || 1,
      finalizedAt: savedOfficial?.finalizedAt,
      finalizedBy: savedOfficial?.finalizedBy || settings.adminName,
      finalizedByTitle: savedOfficial?.finalizedByTitle || settings.adminTitle,
      totalClasses: classes.length,
      submittedClasses: submittedCount,
      approvedClasses: approvedCount,
      pendingClasses: pendingCount,
      revisionClasses: revisionCount,
      unsubmittedClassesCount: unsubmittedCount,
      unapprovedClasses,
      totalStudentsRoster,
      confirmedStudents,
      presentCount,
      absentCount,
      excusedAbsentCount,
      unexcusedAbsentCount,
      lateCount,
      earlyLeaveCount,
      attendanceRate,
      boardingTotalRoster,
      boardingConfirmed,
      boardingPresent,
      boardingAbsent,
      boardingRate: Math.round(boardingRate * 10) / 10,
      nonBoardingTotalRoster,
      nonBoardingConfirmed,
      nonBoardingPresent,
      nonBoardingAbsent,
      nonBoardingRate: Math.round(nonBoardingRate * 10) / 10,
      classRows,
      gradeGroups,
      absentRecords,
      boardingAbsentRecords,
      nonBoardingAbsentRecords,
      savedOfficial,
    };
  }

  /**
   * Finalize and lock daily report with snapshot & versioning (Mục LVIII, LX, LXI)
   */
  public finalizeDailyReport(
    date: string,
    session: SessionType = 'MORNING',
    finalizedBy: string,
    finalizedByTitle: string = 'Tổng Phụ trách Đội',
    revisionReason?: string
  ): SchoolDailyReport {
    const reportData = this.getDailyAttendanceReport(date, session);
    const existing = storageService.getDailyOfficialReport(date, session);
    const newVersion = (existing?.reportVersion || 0) + 1;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${date} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const versionHistory = existing?.versionHistory || [];
    if (existing) {
      versionHistory.push({
        version: existing.reportVersion || 1,
        finalizedAt: existing.finalizedAt || existing.updatedAt,
        finalizedBy: existing.finalizedBy || 'Admin',
        finalizedByTitle: existing.finalizedByTitle,
        revisionReason: existing.revisionReason,
        totalStudentsSnapshot: existing.totalStudentsSnapshot,
        presentCount: existing.presentCount,
        absentCount: existing.absentCount,
        boardingPresent: existing.boardingPresent,
        nonBoardingPresent: existing.nonBoardingPresent,
      });
    }

    const officialReport: SchoolDailyReport = {
      id: `daily_${date}_${session}`,
      date,
      session,
      schoolYearId: reportData.schoolYearId,
      reportVersion: newVersion,
      reportStatus: 'LOCKED',
      totalClasses: reportData.totalClasses,
      submittedClasses: reportData.submittedClasses,
      approvedClasses: reportData.approvedClasses,
      pendingClasses: reportData.pendingClasses,
      unsubmittedClassesCount: reportData.unsubmittedClassesCount,
      totalStudents: reportData.totalStudentsRoster,
      totalStudentsSnapshot: reportData.totalStudentsRoster,
      confirmedStudents: reportData.confirmedStudents,
      presentCount: reportData.presentCount,
      absentCount: reportData.absentCount,
      excusedAbsentCount: reportData.excusedAbsentCount,
      unexcusedAbsentCount: reportData.unexcusedAbsentCount,
      lateCount: reportData.lateCount,
      earlyLeaveCount: reportData.earlyLeaveCount,
      boardingTotal: reportData.boardingTotalRoster,
      boardingTotalSnapshot: reportData.boardingTotalRoster,
      boardingPresent: reportData.boardingPresent,
      boardingAbsent: reportData.boardingAbsent,
      nonBoardingTotal: reportData.nonBoardingTotalRoster,
      nonBoardingTotalSnapshot: reportData.nonBoardingTotalRoster,
      nonBoardingPresent: reportData.nonBoardingPresent,
      nonBoardingAbsent: reportData.nonBoardingAbsent,
      finalizedAt: timestamp,
      finalizedBy,
      finalizedByTitle,
      unapprovedClassesList: reportData.unapprovedClasses,
      versionHistory,
      classesSnapshot: reportData.classRows.map(c => ({
        classId: c.classId,
        className: c.className,
        grade: c.grade,
        teacherName: c.teacherName,
        totalStudents: c.totalStudents,
        presentCount: typeof c.presentCount === 'number' ? c.presentCount : 0,
        absentCount: typeof c.absentCount === 'number' ? c.absentCount : 0,
        excusedAbsentCount: typeof c.excusedAbsentCount === 'number' ? c.excusedAbsentCount : 0,
        unexcusedAbsentCount: typeof c.unexcusedAbsentCount === 'number' ? c.unexcusedAbsentCount : 0,
        lateCount: typeof c.lateCount === 'number' ? c.lateCount : 0,
        boardingTotal: c.boardingTotal,
        boardingPresent: typeof c.boardingPresent === 'number' ? c.boardingPresent : 0,
        boardingAbsent: typeof c.boardingAbsent === 'number' ? c.boardingAbsent : 0,
        nonBoardingTotal: c.nonBoardingTotal,
        nonBoardingPresent: typeof c.nonBoardingPresent === 'number' ? c.nonBoardingPresent : 0,
        nonBoardingAbsent: typeof c.nonBoardingAbsent === 'number' ? c.nonBoardingAbsent : 0,
        status: c.status,
      })),
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    storageService.saveDailyOfficialReport(officialReport);
    storageService.lockAllReportsForDate(date, session, finalizedBy);

    storageService.addAuditLog(
      finalizedBy,
      `Chốt khóa báo cáo sĩ số toàn trường ngày ${date} (Phiên bản v${newVersion})${revisionReason ? ` - Lý do: ${revisionReason}` : ''}`,
      'report',
      `CHỐT SĨ SỐ v${newVersion}`
    );

    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    return officialReport;
  }

  /**
   * Unlock daily report for revision (Mục LVIII, CXII)
   */
  public unlockDailyReport(
    date: string,
    session: SessionType = 'MORNING',
    unlockedBy: string,
    reason: string
  ): boolean {
    const existing = storageService.getDailyOfficialReport(date, session);
    if (!existing) return false;

    existing.reportStatus = 'PRELIMINARY';
    existing.updatedAt = new Date().toISOString();
    storageService.saveDailyOfficialReport(existing);

    // Also set locked reports back to APPROVED so teachers/admin can request revisions
    const reports = storageService.getReportsByDate(date, session);
    reports.forEach(r => {
      if (r.status === 'LOCKED' || (r.status as string) === 'locked') {
        r.status = 'APPROVED';
      }
    });
    localStorage.setItem('thcs_banbo_v2_reports', JSON.stringify(storageService.getReports()));

    storageService.addAuditLog(
      unlockedBy,
      `Mở khóa báo cáo ngày ${date} để hiệu chỉnh. Lí do: "${reason}"`,
      'report',
      'MỞ KHÓA BÁO CÁO'
    );
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    return true;
  }

  /**
   * Generate Quick Text for Ban Giám hiệu (Mục XII)
   */
  public generateQuickReportText(date: string = getTodayDateString(), session: SessionType = 'MORNING'): string {
    const rep = this.getDailyAttendanceReport(date, session);
    const unapproved = rep.unapprovedClasses;

    let text = `TRƯỜNG THCS BẢN BO
BÁO CÁO SĨ SỐ BUỔI SÁNG NGÀY ${formatVietnameseDate(date).toUpperCase()}
------------------------------------
Tổng số HS: ${rep.totalStudentsRoster}
Có mặt: ${rep.presentCount}
Vắng: ${rep.absentCount}
Có phép: ${rep.excusedAbsentCount}
Không phép: ${rep.unexcusedAbsentCount}
Đi muộn: ${rep.lateCount}
Bán trú: ${rep.boardingPresent}/${rep.boardingTotalRoster} có mặt.
Ngoại trú: ${rep.nonBoardingPresent}/${rep.nonBoardingTotalRoster} có mặt.
Lớp đã báo cáo: ${rep.submittedClasses}/${rep.totalClasses}.
Lớp đã duyệt: ${rep.approvedClasses}/${rep.totalClasses}.`;

    if (unapproved.length > 0) {
      text += `\nCòn các lớp: ${unapproved.join(', ')}`;
    }

    text += `\n------------------------------------\nNgười lập: ${rep.finalizedBy} - ${rep.finalizedByTitle}`;
    return text;
  }

  /**
   * Compare Today vs Yesterday (or most recent prior school day) (Mục LXXIII)
   */
  public compareWithPreviousDay(date: string, session: SessionType = 'MORNING'): DayOverDayComparison | null {
    const curRep = this.getDailyAttendanceReport(date, session);

    // Find previous school day by searching back up to 10 days
    const d = new Date(date);
    let prevRep = null;
    let prevDateStr = '';

    for (let i = 1; i <= 10; i++) {
      const prior = new Date(d);
      prior.setDate(prior.getDate() - i);
      const y = prior.getFullYear();
      const m = String(prior.getMonth() + 1).padStart(2, '0');
      const dt = String(prior.getDate()).padStart(2, '0');
      const pStr = `${y}-${m}-${dt}`;

      // Check if there are reports on this day
      const priorReports = storageService.getReportsByDate(pStr, session);
      if (priorReports.length > 0) {
        prevRep = this.getDailyAttendanceReport(pStr, session);
        prevDateStr = pStr;
        break;
      }
    }

    if (!prevRep) return null;

    return {
      currentDate: date,
      previousDate: prevDateStr,
      currentPresent: curRep.presentCount,
      previousPresent: prevRep.presentCount,
      presentDiff: curRep.presentCount - prevRep.presentCount,
      currentAbsent: curRep.absentCount,
      previousAbsent: prevRep.absentCount,
      absentDiff: curRep.absentCount - prevRep.absentCount,
      currentRate: curRep.attendanceRate,
      previousRate: prevRep.attendanceRate,
      rateDiff: Math.round((curRep.attendanceRate - prevRep.attendanceRate) * 10) / 10,
    };
  }
}

export const dailyReportService = new DailyReportService();
