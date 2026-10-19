import { AttendanceReport, SchoolClass, Student, SessionType, normalizeSession } from '../types';
import { storageService } from './storageService';
import { calculateAttendanceRate, filterApprovedReports } from './reportCalculationService';

export interface SemesterDates {
  name: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
  label: string;
  startDate: string;
  endDate: string;
}

export const SEMESTER_CONFIGS: Record<string, SemesterDates> = {
  SEMESTER_1: {
    name: 'SEMESTER_1',
    label: 'Học kỳ I (2026–2027)',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
  },
  SEMESTER_2: {
    name: 'SEMESTER_2',
    label: 'Học kỳ II (2026–2027)',
    startDate: '2027-01-18',
    endDate: '2027-05-25',
  },
  FULL_YEAR: {
    name: 'FULL_YEAR',
    label: 'Cả năm học 2026–2027',
    startDate: '2026-09-01',
    endDate: '2027-05-25',
  },
};

export interface GradePeriodStat {
  grade: number;
  gradeLabel: string;
  totalClasses: number;
  totalStudents: number;
  expectedSessions: number;
  presentSessions: number;
  absentSessions: number;
  excusedSessions: number;
  unexcusedSessions: number;
  lateCount: number;
  attendanceRate: number;
}

export interface ClassPeriodStat {
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  totalStudents: number;
  schoolDaysRecorded: number;
  expectedSessions: number;
  presentSessions: number;
  absentSessions: number;
  excusedSessions: number;
  unexcusedSessions: number;
  lateCount: number;
  attendanceRate: number;
}

export interface SemesterReportSummary {
  periodKey: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalDaysRecorded: number;
  totalExpectedSessions: number;
  totalPresentSessions: number;
  totalAbsentSessions: number;
  totalExcusedSessions: number;
  totalUnexcusedSessions: number;
  totalLateCount: number;
  attendanceRate: number;
  gradeStats: GradePeriodStat[];
  classStats: ClassPeriodStat[];
}

class SemesterReportService {
  public getSemesterReport(
    period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR',
    session: SessionType = 'MORNING'
  ): SemesterReportSummary {
    const config = SEMESTER_CONFIGS[period] || SEMESTER_CONFIGS.SEMESTER_1;
    const normSession = normalizeSession(session);
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');

    const reportsInPeriod = filterApprovedReports(
      storageService.getReports().filter(
        r =>
          normalizeSession(r.session) === normSession &&
          r.date >= config.startDate &&
          r.date <= config.endDate
      )
    );

    const distinctDates = new Set<string>();
    reportsInPeriod.forEach(r => distinctDates.add(r.date));

    let totalExpectedSessions = 0;
    let totalPresentSessions = 0;
    let totalAbsentSessions = 0;
    let totalExcusedSessions = 0;
    let totalUnexcusedSessions = 0;
    let totalLateCount = 0;

    const classStats: ClassPeriodStat[] = classes.map(cls => {
      const clsReports = reportsInPeriod.filter(r => r.classId === cls.id);
      let clsExp = 0;
      let clsPres = 0;
      let clsAbs = 0;
      let clsExc = 0;
      let clsUnexc = 0;
      let clsLate = 0;

      clsReports.forEach(r => {
        clsExp += r.totalStudents;
        clsPres += r.presentCount;
        clsAbs += r.absentCount;
        clsExc += r.excusedAbsentCount ?? r.absentExcusedCount ?? 0;
        clsUnexc += r.unexcusedAbsentCount ?? r.absentUnexcusedCount ?? 0;
        clsLate += r.lateCount || 0;
      });

      totalExpectedSessions += clsExp;
      totalPresentSessions += clsPres;
      totalAbsentSessions += clsAbs;
      totalExcusedSessions += clsExc;
      totalUnexcusedSessions += clsUnexc;
      totalLateCount += clsLate;

      const clsRate = calculateAttendanceRate(clsExp, clsPres);
      const clsStudents = allStudents.filter(s => s.classId === cls.id || s.className === cls.name);

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherName: cls.teacherName || 'Chưa phân công',
        totalStudents: clsStudents.length,
        schoolDaysRecorded: clsReports.length,
        expectedSessions: clsExp,
        presentSessions: clsPres,
        absentSessions: clsAbs,
        excusedSessions: clsExc,
        unexcusedSessions: clsUnexc,
        lateCount: clsLate,
        attendanceRate: clsRate,
      };
    });

    const grades = [6, 7, 8, 9];
    const gradeStats: GradePeriodStat[] = grades.map(g => {
      const gClasses = classStats.filter(c => c.grade === g);
      const gStudents = gClasses.reduce((sum, c) => sum + c.totalStudents, 0);
      const gExp = gClasses.reduce((sum, c) => sum + c.expectedSessions, 0);
      const gPres = gClasses.reduce((sum, c) => sum + c.presentSessions, 0);
      const gAbs = gClasses.reduce((sum, c) => sum + c.absentSessions, 0);
      const gExc = gClasses.reduce((sum, c) => sum + c.excusedSessions, 0);
      const gUnexc = gClasses.reduce((sum, c) => sum + c.unexcusedSessions, 0);
      const gLate = gClasses.reduce((sum, c) => sum + c.lateCount, 0);
      const gRate = calculateAttendanceRate(gExp, gPres);

      return {
        grade: g,
        gradeLabel: `Khối ${g}`,
        totalClasses: gClasses.length,
        totalStudents: gStudents,
        expectedSessions: gExp,
        presentSessions: gPres,
        absentSessions: gAbs,
        excusedSessions: gExc,
        unexcusedSessions: gUnexc,
        lateCount: gLate,
        attendanceRate: gRate,
      };
    });

    const overallRate = calculateAttendanceRate(totalExpectedSessions, totalPresentSessions);

    return {
      periodKey: period,
      periodLabel: config.label,
      startDate: config.startDate,
      endDate: config.endDate,
      totalDaysRecorded: distinctDates.size,
      totalExpectedSessions,
      totalPresentSessions,
      totalAbsentSessions,
      totalExcusedSessions,
      totalUnexcusedSessions,
      totalLateCount,
      attendanceRate: overallRate,
      gradeStats,
      classStats,
    };
  }
}

export const semesterReportService = new SemesterReportService();
