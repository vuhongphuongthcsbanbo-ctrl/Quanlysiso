import { AttendanceReport, SchoolClass, SessionType, normalizeSession } from '../types';
import { storageService } from './storageService';
import { calculateAttendanceRate, filterApprovedReports, isSchoolDay } from './reportCalculationService';

export interface WeeklyClassStat {
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  averageStudentCount: number;
  schoolDaysCount: number;
  expectedSessions: number;
  presentSessions: number;
  absentSessions: number;
  excusedSessions: number;
  unexcusedSessions: number;
  lateCount: number;
  earlyLeaveCount: number;
  attendanceRate: number;
}

export interface WeeklyAttendanceSummary {
  weekLabel: string;
  startDate: string;
  endDate: string;
  schoolDaysCount: number;
  totalStudentsRoster: number;
  totalExpectedSessions: number;
  totalPresentSessions: number;
  totalAbsentSessions: number;
  totalExcusedSessions: number;
  totalUnexcusedSessions: number;
  totalLateCount: number;
  totalEarlyLeaveCount: number;
  attendanceRate: number;
  classStats: WeeklyClassStat[];
  daysBreakdown: Array<{
    date: string;
    dayName: string;
    isSchoolDay: boolean;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    approvedClassesCount: number;
  }>;
}

class WeeklyReportService {
  /**
   * Helper to format Date to YYYY-MM-DD
   */
  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Get start (Monday) and end (Friday or Saturday) of a week containing a given date
   */
  public getWeekRange(dateStr: string, includeSaturday: boolean = false): { startDate: string; endDate: string } {
    const d = new Date(dateStr);
    const day = d.getDay();
    // In JS, 0 is Sunday, 1 is Monday...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const endDays = includeSaturday ? 5 : 4; // Monday + 4 = Friday, + 5 = Saturday
    const weekend = new Date(monday);
    weekend.setDate(monday.getDate() + endDays);

    return {
      startDate: this.formatDate(monday),
      endDate: this.formatDate(weekend),
    };
  }

  /**
   * Calculate Weekly Attendance
   */
  public getWeeklyAttendance(
    startDate: string,
    endDate: string,
    session: SessionType = 'MORNING'
  ): WeeklyAttendanceSummary {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const classes = storageService.getClasses().filter(c => c.isActive);
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');
    const allReports = storageService.getReports().filter(
      r => normalizeSession(r.session) === normSession && r.date >= startDate && r.date <= endDate
    );

    // List all distinct dates in range
    const cur = new Date(startDate);
    const end = new Date(endDate);
    const dateList: string[] = [];
    while (cur <= end) {
      dateList.push(this.formatDate(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    let actualSchoolDaysCount = 0;

    const daysBreakdown = dateList.map(dt => {
      const dObj = new Date(dt);
      const isDayRequired = isSchoolDay(dt, settings);
      if (isDayRequired) actualSchoolDaysCount++;

      const dayReports = filterApprovedReports(allReports.filter(r => r.date === dt));
      let dayPresent = 0;
      let dayAbsent = 0;
      let dayTotal = 0;

      dayReports.forEach(r => {
        dayTotal += r.totalStudents;
        dayPresent += r.presentCount;
        dayAbsent += r.absentCount;
      });

      const dayRate = calculateAttendanceRate(dayTotal, dayPresent);

      return {
        date: dt,
        dayName: dayNames[dObj.getDay()],
        isSchoolDay: isDayRequired,
        presentCount: dayPresent,
        absentCount: dayAbsent,
        attendanceRate: dayRate,
        approvedClassesCount: dayReports.length,
      };
    });

    let totalExpectedSessions = 0;
    let totalPresentSessions = 0;
    let totalAbsentSessions = 0;
    let totalExcusedSessions = 0;
    let totalUnexcusedSessions = 0;
    let totalLateCount = 0;
    let totalEarlyLeaveCount = 0;

    const classStats: WeeklyClassStat[] = classes.map(cls => {
      const clsReports = filterApprovedReports(allReports.filter(r => r.classId === cls.id));
      const clsDaysCount = clsReports.length;

      let clsExpected = 0;
      let clsPresent = 0;
      let clsAbsent = 0;
      let clsExcused = 0;
      let clsUnexcused = 0;
      let clsLate = 0;
      let clsEarly = 0;

      clsReports.forEach(r => {
        clsExpected += r.totalStudents;
        clsPresent += r.presentCount;
        clsAbsent += r.absentCount;
        clsExcused += r.excusedAbsentCount ?? r.absentExcusedCount ?? 0;
        clsUnexcused += r.unexcusedAbsentCount ?? r.absentUnexcusedCount ?? 0;
        clsLate += r.lateCount || 0;
        clsEarly += r.earlyLeaveCount || 0;
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
      const avgStudents = clsDaysCount > 0 ? Math.round(clsExpected / clsDaysCount) : clsStudents.length;

      return {
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherName: cls.teacherName || 'Chưa phân công',
        averageStudentCount: avgStudents,
        schoolDaysCount: clsDaysCount,
        expectedSessions: clsExpected,
        presentSessions: clsPresent,
        absentSessions: clsAbsent,
        excusedSessions: clsExcused,
        unexcusedSessions: clsUnexcused,
        lateCount: clsLate,
        earlyLeaveCount: clsEarly,
        attendanceRate: clsRate,
      };
    });

    const overallRate = calculateAttendanceRate(totalExpectedSessions, totalPresentSessions);

    return {
      weekLabel: `Từ ${startDate} đến ${endDate}`,
      startDate,
      endDate,
      schoolDaysCount: actualSchoolDaysCount,
      totalStudentsRoster: allStudents.length,
      totalExpectedSessions,
      totalPresentSessions,
      totalAbsentSessions,
      totalExcusedSessions,
      totalUnexcusedSessions,
      totalLateCount,
      totalEarlyLeaveCount,
      attendanceRate: overallRate,
      classStats,
      daysBreakdown,
    };
  }
}

export const weeklyReportService = new WeeklyReportService();
