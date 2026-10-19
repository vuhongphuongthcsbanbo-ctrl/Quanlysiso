import { AttendanceReport, AttendanceRecord, SchoolClass, Student, SessionType, normalizeSession } from '../types';
import { storageService } from './storageService';
import { calculateAttendanceRate, filterApprovedReports, isSchoolDay } from './reportCalculationService';

export interface FrequentAbsentStudent {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  grade: number;
  boardingType: string;
  excusedCount: number;
  unexcusedCount: number;
  lateCount: number;
  totalAbsent: number;
  lastAbsentDate: string;
  lastReason?: string;
}

export interface MonthlyClassStat {
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  totalStudents: number;
  schoolDaysCount: number;
  expectedSessions: number;
  presentSessions: number;
  absentSessions: number;
  excusedSessions: number;
  unexcusedSessions: number;
  lateCount: number;
  earlyLeaveCount: number;
  boardingExpected: number;
  boardingPresent: number;
  boardingAbsent: number;
  attendanceRate: number;
}

export interface MonthOverMonthComparison {
  currentMonthLabel: string;
  previousMonthLabel: string;
  currentAbsent: number;
  previousAbsent: number;
  absentDiff: number;
  currentRate: number;
  previousRate: number;
  rateDiff: number;
}

export interface MonthlyAttendanceSummary {
  year: number;
  month: number;
  monthLabel: string;
  schoolDaysCount: number;
  totalExpectedSessions: number;
  totalPresentSessions: number;
  totalAbsentSessions: number;
  totalExcusedSessions: number;
  totalUnexcusedSessions: number;
  totalLateCount: number;
  totalEarlyLeaveCount: number;
  attendanceRate: number;
  studentsWithAbsenceCount: number;
  classStats: MonthlyClassStat[];
  frequentAbsentStudents: FrequentAbsentStudent[];
  comparisonWithPreviousMonth: MonthOverMonthComparison | null;
}

class MonthlyReportService {
  /**
   * Helper to format YYYY-MM
   */
  public getMonthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /**
   * Calculate Monthly Attendance
   */
  public getMonthlyAttendance(
    year: number,
    month: number,
    threshold: number = 3,
    gradeFilter?: number,
    classFilter?: string,
    session: SessionType = 'MORNING'
  ): MonthlyAttendanceSummary {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');

    // Get all approved reports in this month
    const reportsInMonth = filterApprovedReports(
      storageService.getReports().filter(
        r => r.date.startsWith(monthPrefix) && normalizeSession(r.session) === normSession
      )
    );

    // Days in this month
    const daysInMonth = new Date(year, month, 0).getDate();
    let schoolDaysCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dt = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (isSchoolDay(dt, settings)) {
        schoolDaysCount++;
      }
    }

    let filteredClasses = classes;
    if (gradeFilter) {
      filteredClasses = filteredClasses.filter(c => c.grade === gradeFilter);
    }
    if (classFilter && classFilter !== 'ALL') {
      filteredClasses = filteredClasses.filter(c => c.id === classFilter || c.name === classFilter);
    }

    let totalExpectedSessions = 0;
    let totalPresentSessions = 0;
    let totalAbsentSessions = 0;
    let totalExcusedSessions = 0;
    let totalUnexcusedSessions = 0;
    let totalLateCount = 0;
    let totalEarlyLeaveCount = 0;

    const classStats: MonthlyClassStat[] = filteredClasses.map(cls => {
      const clsReports = reportsInMonth.filter(r => r.classId === cls.id);
      let clsExpected = 0;
      let clsPresent = 0;
      let clsAbsent = 0;
      let clsExcused = 0;
      let clsUnexcused = 0;
      let clsLate = 0;
      let clsEarly = 0;
      let clsBoardingExp = 0;
      let clsBoardingPres = 0;
      let clsBoardingAbs = 0;

      clsReports.forEach(r => {
        clsExpected += r.totalStudents;
        clsPresent += r.presentCount;
        clsAbsent += r.absentCount;
        clsExcused += r.excusedAbsentCount ?? r.absentExcusedCount ?? 0;
        clsUnexcused += r.unexcusedAbsentCount ?? r.absentUnexcusedCount ?? 0;
        clsLate += r.lateCount || 0;
        clsEarly += r.earlyLeaveCount || 0;
        clsBoardingExp += r.boardingTotal;
        clsBoardingPres += r.boardingPresent;
        clsBoardingAbs += r.boardingAbsent;
      });

      totalExpectedSessions += clsExpected;
      totalPresentSessions += clsPresent;
      totalAbsentSessions += clsAbsent;
      totalExcusedSessions += clsExcused;
      totalUnexcusedSessions += clsUnexcused;
      totalLateCount += clsLate;
      totalEarlyLeaveCount += clsEarly;

      const clsRate = calculateAttendanceRate(clsExpected, clsPresent);
      const clsStudents = allStudents.filter(s => s.classId === cls.id || s.className === cls.name);

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherName: cls.teacherName || 'Chưa phân công',
        totalStudents: clsStudents.length,
        schoolDaysCount: clsReports.length,
        expectedSessions: clsExpected,
        presentSessions: clsPresent,
        absentSessions: clsAbsent,
        excusedSessions: clsExcused,
        unexcusedSessions: clsUnexcused,
        lateCount: clsLate,
        earlyLeaveCount: clsEarly,
        boardingExpected: clsBoardingExp,
        boardingPresent: clsBoardingPres,
        boardingAbsent: clsBoardingAbs,
        attendanceRate: clsRate,
      };
    });

    // Track frequent absent students
    const studentAbsenceMap = new Map<string, {
      studentId: string;
      studentName: string;
      studentCode: string;
      className: string;
      grade: number;
      boardingType: string;
      excusedCount: number;
      unexcusedCount: number;
      lateCount: number;
      totalAbsent: number;
      lastAbsentDate: string;
      lastReason?: string;
    }>();

    reportsInMonth.forEach(r => {
      (r.records || []).forEach(rec => {
        const st = String(rec.status).toUpperCase();
        const isAbsentExcused = st === 'ABSENT_EXCUSED' || (st === 'OTHER' && rec.absenceType === 'excused');
        const isAbsentUnexcused = st === 'ABSENT_UNEXCUSED' || st === 'FULL_DAY_ABSENCE' || (st === 'OTHER' && rec.absenceType === 'unexcused');
        const isLate = st === 'LATE';

        if (isAbsentExcused || isAbsentUnexcused || isLate) {
          const prev = studentAbsenceMap.get(rec.studentId) || {
            studentId: rec.studentId,
            studentName: rec.studentName,
            studentCode: rec.studentCode || '',
            className: rec.className,
            grade: rec.grade,
            boardingType: rec.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú',
            excusedCount: 0,
            unexcusedCount: 0,
            lateCount: 0,
            totalAbsent: 0,
            lastAbsentDate: rec.date,
            lastReason: rec.reason,
          };

          if (isAbsentExcused) {
            prev.excusedCount++;
            prev.totalAbsent++;
          }
          if (isAbsentUnexcused) {
            prev.unexcusedCount++;
            prev.totalAbsent++;
          }
          if (isLate) {
            prev.lateCount++;
          }

          if (rec.date >= prev.lastAbsentDate) {
            prev.lastAbsentDate = rec.date;
            if (rec.reason) prev.lastReason = rec.reason;
          }

          studentAbsenceMap.set(rec.studentId, prev);
        }
      });
    });

    const studentsWithAbsenceCount = Array.from(studentAbsenceMap.values()).filter(s => s.totalAbsent > 0).length;

    // Filter by threshold (e.g. >= 3, >= 5, >= 10)
    let frequentAbsentStudents = Array.from(studentAbsenceMap.values())
      .filter(s => s.totalAbsent >= threshold)
      .sort((a, b) => b.totalAbsent - a.totalAbsent);

    if (gradeFilter) {
      frequentAbsentStudents = frequentAbsentStudents.filter(s => s.grade === gradeFilter);
    }
    if (classFilter && classFilter !== 'ALL') {
      frequentAbsentStudents = frequentAbsentStudents.filter(s => s.className === classFilter);
    }

    const overallRate = calculateAttendanceRate(totalExpectedSessions, totalPresentSessions);

    // Month-over-month comparison
    let comparisonWithPreviousMonth: MonthOverMonthComparison | null = null;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevReports = filterApprovedReports(
      storageService.getReports().filter(
        r => r.date.startsWith(prevMonthPrefix) && normalizeSession(r.session) === normSession
      )
    );

    if (prevReports.length > 0) {
      let prevExp = 0;
      let prevPres = 0;
      let prevAbs = 0;
      prevReports.forEach(r => {
        prevExp += r.totalStudents;
        prevPres += r.presentCount;
        prevAbs += r.absentCount;
      });
      const prevRate = calculateAttendanceRate(prevExp, prevPres);
      comparisonWithPreviousMonth = {
        currentMonthLabel: `Tháng ${month}/${year}`,
        previousMonthLabel: `Tháng ${prevMonth}/${prevYear}`,
        currentAbsent: totalAbsentSessions,
        previousAbsent: prevAbs,
        absentDiff: totalAbsentSessions - prevAbs,
        currentRate: overallRate,
        previousRate: prevRate,
        rateDiff: Math.round((overallRate - prevRate) * 10) / 10,
      };
    }

    return {
      year,
      month,
      monthLabel: `Tháng ${month}/${year}`,
      schoolDaysCount,
      totalExpectedSessions,
      totalPresentSessions,
      totalAbsentSessions,
      totalExcusedSessions,
      totalUnexcusedSessions,
      totalLateCount,
      totalEarlyLeaveCount,
      attendanceRate: overallRate,
      studentsWithAbsenceCount,
      classStats,
      frequentAbsentStudents,
      comparisonWithPreviousMonth,
    };
  }
}

export const monthlyReportService = new MonthlyReportService();
