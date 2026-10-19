import { AttendanceRecord, SessionType, normalizeSession } from '../types';
import { storageService } from './storageService';
import { filterApprovedReports } from './reportCalculationService';
import { getTodayDateString } from '../utils/formatters';

export interface BoardingClassRow {
  classId: string;
  className: string;
  grade: number;
  totalBoarding: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  isApproved: boolean;
}

export interface BoardingGradeSummary {
  grade: number;
  gradeLabel: string;
  totalBoarding: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  classes: BoardingClassRow[];
}

export interface BoardingDayReport {
  date: string;
  session: SessionType;
  type: 'BOARDING' | 'NON_BOARDING';
  totalRoster: number;
  confirmedTotal: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
  gradeSummaries: BoardingGradeSummary[];
  classRows: BoardingClassRow[];
  absentStudents: AttendanceRecord[];
}

class BoardingReportService {
  /**
   * Get Daily Boarding or Non-Boarding Report
   */
  public getDailyReport(
    date: string = getTodayDateString(),
    type: 'BOARDING' | 'NON_BOARDING' = 'BOARDING',
    session: SessionType = 'MORNING'
  ): BoardingDayReport {
    const normSession = normalizeSession(session);
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');
    const targetStudents = allStudents.filter(s => s.boardingType === type);

    const reports = storageService.getReportsByDate(date, normSession);
    const approvedReports = filterApprovedReports(reports);
    const repMap = new Map();
    reports.forEach(r => repMap.set(r.classId, r));

    let confirmedTotal = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    const classRows: BoardingClassRow[] = classes.map(cls => {
      const rep = repMap.get(cls.id);
      const isApproved =
        rep && (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked');

      const clsStudents = targetStudents.filter(s => s.classId === cls.id || s.className === cls.name);
      let clsTotal = clsStudents.length;
      let clsPres = 0;
      let clsAbs = 0;

      if (rep) {
        if (type === 'BOARDING') {
          clsTotal = rep.boardingTotal;
          if (isApproved) {
            clsPres = rep.boardingPresent;
            clsAbs = rep.boardingAbsent;
          }
        } else {
          clsTotal = rep.nonBoardingTotal ?? rep.dayTotal ?? clsStudents.length;
          if (isApproved) {
            clsPres = rep.nonBoardingPresent ?? rep.dayPresent ?? 0;
            clsAbs = rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0;
          }
        }
      }

      if (isApproved) {
        confirmedTotal += clsTotal;
        totalPresent += clsPres;
        totalAbsent += clsAbs;
      }

      const rate = clsTotal > 0 ? (clsPres / clsTotal) * 100 : 100;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        totalBoarding: clsTotal,
        presentCount: isApproved ? clsPres : 0,
        absentCount: isApproved ? clsAbs : 0,
        attendanceRate: Math.round(rate * 10) / 10,
        isApproved: !!isApproved,
      };
    });

    // Group by Grade 6-9
    const grades = [6, 7, 8, 9];
    const gradeSummaries: BoardingGradeSummary[] = grades.map(g => {
      const gClasses = classRows.filter(c => c.grade === g);
      const gTotal = gClasses.reduce((sum, c) => sum + c.totalBoarding, 0);
      const gPres = gClasses.reduce((sum, c) => sum + c.presentCount, 0);
      const gAbs = gClasses.reduce((sum, c) => sum + c.absentCount, 0);
      const rate = gTotal > 0 ? (gPres / gTotal) * 100 : 100;

      return {
        grade: g,
        gradeLabel: `Khối ${g}`,
        totalBoarding: gTotal,
        presentCount: gPres,
        absentCount: gAbs,
        attendanceRate: Math.round(rate * 10) / 10,
        classes: gClasses,
      };
    });

    // Absent list for this type (Mục VII, VIII, XXVI, XXVIII)
    const absentStudents: AttendanceRecord[] = [];
    approvedReports.forEach(r => {
      (r.records || []).forEach(rec => {
        // Use rec.boardingType at report time to preserve historical state (Mục LXXIX)
        const recType = rec.boardingType || (rec.studentType === 'boarding' ? 'BOARDING' : 'NON_BOARDING');
        if (recType === type) {
          const st = String(rec.status).toUpperCase();
          if (st === 'ABSENT_EXCUSED' || st === 'ABSENT_UNEXCUSED' || st === 'FULL_DAY_ABSENCE' || (st === 'OTHER' && (rec.absenceType === 'excused' || rec.absenceType === 'unexcused'))) {
            absentStudents.push(rec);
          }
        }
      });
    });

    const overallRate = confirmedTotal > 0 ? (totalPresent / confirmedTotal) * 100 : 100;

    return {
      date,
      session: normSession,
      type,
      totalRoster: targetStudents.length,
      confirmedTotal,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      attendanceRate: Math.round(overallRate * 10) / 10,
      gradeSummaries,
      classRows,
      absentStudents,
    };
  }

  /**
   * Monthly Boarding or Non-Boarding Report (Mục XXVII)
   */
  public getMonthlyReport(
    year: number,
    month: number,
    type: 'BOARDING' | 'NON_BOARDING' = 'BOARDING',
    session: SessionType = 'MORNING'
  ) {
    const normSession = normalizeSession(session);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active' && s.boardingType === type);

    const approvedReports = filterApprovedReports(
      storageService.getReports().filter(
        r => r.date.startsWith(monthPrefix) && normalizeSession(r.session) === normSession
      )
    );

    let totalExpectedSessions = 0;
    let totalPresentSessions = 0;
    let totalAbsentSessions = 0;

    const classStats = classes.map(cls => {
      const clsReports = approvedReports.filter(r => r.classId === cls.id);
      const clsStudents = allStudents.filter(s => s.classId === cls.id || s.className === cls.name);

      let clsExp = 0;
      let clsPres = 0;
      let clsAbs = 0;

      clsReports.forEach(r => {
        if (type === 'BOARDING') {
          clsExp += r.boardingTotal;
          clsPres += r.boardingPresent;
          clsAbs += r.boardingAbsent;
        } else {
          const nbTot = r.nonBoardingTotal ?? r.dayTotal ?? 0;
          const nbPres = r.nonBoardingPresent ?? r.dayPresent ?? 0;
          const nbAbs = r.nonBoardingAbsent ?? r.dayAbsent ?? 0;
          clsExp += nbTot;
          clsPres += nbPres;
          clsAbs += nbAbs;
        }
      });

      totalExpectedSessions += clsExp;
      totalPresentSessions += clsPres;
      totalAbsentSessions += clsAbs;

      const rate = clsExp > 0 ? (clsPres / clsExp) * 100 : 100;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        rosterCount: clsStudents.length,
        recordedDays: clsReports.length,
        expectedSessions: clsExp,
        presentSessions: clsPres,
        absentSessions: clsAbs,
        attendanceRate: Math.round(rate * 10) / 10,
      };
    });

    const overallRate = totalExpectedSessions > 0 ? (totalPresentSessions / totalExpectedSessions) * 100 : 100;

    return {
      year,
      month,
      type,
      totalStudentsRoster: allStudents.length,
      totalExpectedSessions,
      totalPresentSessions,
      totalAbsentSessions,
      attendanceRate: Math.round(overallRate * 10) / 10,
      classStats,
    };
  }
}

export const boardingReportService = new BoardingReportService();
