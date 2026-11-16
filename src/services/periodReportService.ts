import {
  SavedPeriodReport,
  SavedReportPeriodType,
  SessionType,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import { storageService } from './storageService';
import { weeklyReportService } from './weeklyReportService';
import { monthlyReportService } from './monthlyReportService';
import { semesterReportService, SEMESTER_CONFIGS } from './semesterReportService';

class PeriodReportService {
  private formatTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  public getWeeklyPeriodKey(startDate: string, endDate: string, session: SessionType = 'MORNING'): string {
    return `WEEK_${startDate}_${endDate}_${normalizeSession(session)}`;
  }

  public getMonthlyPeriodKey(year: number, month: number, session: SessionType = 'MORNING'): string {
    const mStr = String(month).padStart(2, '0');
    return `MONTH_${year}-${mStr}_${normalizeSession(session)}`;
  }

  public getSemesterPeriodKey(
    period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR',
    schoolYearId: string,
    session: SessionType = 'MORNING'
  ): string {
    const pType = period === 'FULL_YEAR' ? 'SCHOOL_YEAR' : period;
    return `${pType}_${schoolYearId}_${normalizeSession(session)}`;
  }

  /**
   * Lưu báo cáo sĩ số theo TUẦN
   */
  public saveWeeklyReport(
    startDate: string,
    endDate: string,
    session: SessionType = 'MORNING',
    savedBy: string,
    savedByTitle: string = 'Tổng Phụ trách Đội',
    options?: { notes?: string; lock?: boolean }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodKey = this.getWeeklyPeriodKey(startDate, endDate, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    const summary = weeklyReportService.getWeeklyAttendance(startDate, endDate, normSession);
    const nowTs = this.formatTimestamp();
    const newVersion = (existing?.reportVersion || 0) + 1;

    const versionHistory = [...(existing?.versionHistory || [])];
    if (existing) {
      versionHistory.push({
        version: existing.reportVersion || 1,
        savedAt: existing.savedAt || existing.updatedAt,
        savedBy: existing.savedBy,
        savedByTitle: existing.savedByTitle,
        notes: existing.notes,
        attendanceRate: existing.attendanceRate,
        presentCount: existing.totalPresentSessions,
        absentCount: existing.totalAbsentSessions,
        expectedSessions: existing.totalExpectedSessions,
      });
    }

    const report: SavedPeriodReport = {
      id: existing?.id || `rep_${periodKey}`,
      periodType: 'WEEKLY',
      periodKey,
      title: `Báo cáo tuần (${startDate} → ${endDate})`,
      schoolYearId,
      session: normSession,
      startDate,
      endDate,
      reportVersion: newVersion,
      status: options?.lock ? 'LOCKED' : existing?.status === 'LOCKED' && options?.lock !== false ? 'LOCKED' : 'SAVED',
      savedAt: nowTs,
      savedBy,
      savedByTitle,
      notes: options?.notes !== undefined ? options.notes : existing?.notes,
      schoolDaysCount: summary.schoolDaysCount,
      totalClasses: summary.classStats.length,
      totalStudentsRoster: summary.totalStudentsRoster,
      totalExpectedSessions: summary.totalExpectedSessions,
      totalPresentSessions: summary.totalPresentSessions,
      totalAbsentSessions: summary.totalAbsentSessions,
      totalExcusedSessions: summary.totalExcusedSessions,
      totalUnexcusedSessions: summary.totalUnexcusedSessions,
      totalLateCount: summary.totalLateCount,
      totalEarlyLeaveCount: summary.totalEarlyLeaveCount,
      attendanceRate: summary.attendanceRate,
      classStats: summary.classStats,
      daysBreakdown: summary.daysBreakdown,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };

    storageService.savePeriodReport(report);
    storageService.addAuditLog(
      savedBy,
      `Lưu báo cáo sĩ số TUẦN (${startDate} đến ${endDate}, ${getSessionDisplayName(normSession)}) - Phiên bản v${newVersion} (Chuyên cần: ${report.attendanceRate.toFixed(1)}%)`,
      'report',
      `LƯU BÁO CÁO TUẦN v${newVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Lưu báo cáo sĩ số theo THÁNG
   */
  public saveMonthlyReport(
    year: number,
    month: number,
    session: SessionType = 'MORNING',
    savedBy: string,
    savedByTitle: string = 'Tổng Phụ trách Đội',
    options?: { notes?: string; lock?: boolean; threshold?: number }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodKey = this.getMonthlyPeriodKey(year, month, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);

    // Luôn tổng hợp đầy đủ cả trường (không lọc khối/lớp) khi lưu snapshot tháng
    const summary = monthlyReportService.getMonthlyAttendance(
      year,
      month,
      options?.threshold ?? 3,
      undefined,
      undefined,
      normSession
    );

    const daysInMonth = new Date(year, month, 0).getDate();
    const mStr = String(month).padStart(2, '0');
    const startDate = `${year}-${mStr}-01`;
    const endDate = `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`;
    const nowTs = this.formatTimestamp();
    const newVersion = (existing?.reportVersion || 0) + 1;

    const allStudents = storageService.getStudents().filter(s => s.status === 'active');
    const boardingExpected = summary.classStats.reduce((s, c) => s + (c.boardingExpected || 0), 0);
    const boardingPresent = summary.classStats.reduce((s, c) => s + (c.boardingPresent || 0), 0);
    const boardingAbsent = summary.classStats.reduce((s, c) => s + (c.boardingAbsent || 0), 0);

    const versionHistory = [...(existing?.versionHistory || [])];
    if (existing) {
      versionHistory.push({
        version: existing.reportVersion || 1,
        savedAt: existing.savedAt || existing.updatedAt,
        savedBy: existing.savedBy,
        savedByTitle: existing.savedByTitle,
        notes: existing.notes,
        attendanceRate: existing.attendanceRate,
        presentCount: existing.totalPresentSessions,
        absentCount: existing.totalAbsentSessions,
        expectedSessions: existing.totalExpectedSessions,
      });
    }

    const report: SavedPeriodReport = {
      id: existing?.id || `rep_${periodKey}`,
      periodType: 'MONTHLY',
      periodKey,
      title: `Báo cáo Tháng ${month}/${year}`,
      schoolYearId,
      session: normSession,
      startDate,
      endDate,
      month,
      year,
      reportVersion: newVersion,
      status: options?.lock ? 'LOCKED' : existing?.status === 'LOCKED' && options?.lock !== false ? 'LOCKED' : 'SAVED',
      savedAt: nowTs,
      savedBy,
      savedByTitle,
      notes: options?.notes !== undefined ? options.notes : existing?.notes,
      schoolDaysCount: summary.schoolDaysCount,
      totalClasses: summary.classStats.length,
      totalStudentsRoster: allStudents.length,
      totalExpectedSessions: summary.totalExpectedSessions,
      totalPresentSessions: summary.totalPresentSessions,
      totalAbsentSessions: summary.totalAbsentSessions,
      totalExcusedSessions: summary.totalExcusedSessions,
      totalUnexcusedSessions: summary.totalUnexcusedSessions,
      totalLateCount: summary.totalLateCount,
      totalEarlyLeaveCount: summary.totalEarlyLeaveCount,
      boardingExpected,
      boardingPresent,
      boardingAbsent,
      attendanceRate: summary.attendanceRate,
      studentsWithAbsenceCount: summary.studentsWithAbsenceCount,
      classStats: summary.classStats,
      frequentAbsentStudents: summary.frequentAbsentStudents,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };

    storageService.savePeriodReport(report);
    storageService.addAuditLog(
      savedBy,
      `Lưu báo cáo sĩ số THÁNG ${month}/${year} (${getSessionDisplayName(normSession)}) - Phiên bản v${newVersion} (Chuyên cần: ${report.attendanceRate.toFixed(1)}%)`,
      'report',
      `LƯU BÁO CÁO THÁNG v${newVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Lưu báo cáo sĩ số theo HỌC KỲ (HK I / HK II) hoặc NĂM HỌC
   */
  public saveSemesterOrYearReport(
    period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR',
    session: SessionType = 'MORNING',
    savedBy: string,
    savedByTitle: string = 'Tổng Phụ trách Đội',
    options?: { notes?: string; lock?: boolean }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodType: SavedReportPeriodType = period === 'FULL_YEAR' ? 'SCHOOL_YEAR' : period;
    const periodKey = this.getSemesterPeriodKey(period, schoolYearId, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    const summary = semesterReportService.getSemesterReport(period, normSession);
    const config = SEMESTER_CONFIGS[period] || SEMESTER_CONFIGS.SEMESTER_1;
    const nowTs = this.formatTimestamp();
    const newVersion = (existing?.reportVersion || 0) + 1;

    const allStudents = storageService.getStudents().filter(s => s.status === 'active');

    const versionHistory = [...(existing?.versionHistory || [])];
    if (existing) {
      versionHistory.push({
        version: existing.reportVersion || 1,
        savedAt: existing.savedAt || existing.updatedAt,
        savedBy: existing.savedBy,
        savedByTitle: existing.savedByTitle,
        notes: existing.notes,
        attendanceRate: existing.attendanceRate,
        presentCount: existing.totalPresentSessions,
        absentCount: existing.totalAbsentSessions,
        expectedSessions: existing.totalExpectedSessions,
      });
    }

    const title =
      period === 'FULL_YEAR'
        ? `Báo cáo Năm học ${schoolYearId}`
        : period === 'SEMESTER_2'
        ? `Báo cáo Học kỳ II (${schoolYearId})`
        : `Báo cáo Học kỳ I (${schoolYearId})`;

    const report: SavedPeriodReport = {
      id: existing?.id || `rep_${periodKey}`,
      periodType,
      periodKey,
      title,
      schoolYearId,
      session: normSession,
      startDate: config.startDate,
      endDate: config.endDate,
      reportVersion: newVersion,
      status: options?.lock ? 'LOCKED' : existing?.status === 'LOCKED' && options?.lock !== false ? 'LOCKED' : 'SAVED',
      savedAt: nowTs,
      savedBy,
      savedByTitle,
      notes: options?.notes !== undefined ? options.notes : existing?.notes,
      schoolDaysCount: summary.totalDaysRecorded,
      totalClasses: summary.classStats.length,
      totalStudentsRoster: allStudents.length,
      totalExpectedSessions: summary.totalExpectedSessions,
      totalPresentSessions: summary.totalPresentSessions,
      totalAbsentSessions: summary.totalAbsentSessions,
      totalExcusedSessions: summary.totalExcusedSessions,
      totalUnexcusedSessions: summary.totalUnexcusedSessions,
      totalLateCount: summary.totalLateCount,
      totalEarlyLeaveCount: 0,
      attendanceRate: summary.attendanceRate,
      gradeStats: summary.gradeStats,
      classStats: summary.classStats,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };

    storageService.savePeriodReport(report);
    const actionLabel = period === 'FULL_YEAR' ? 'LƯU BÁO CÁO NĂM HỌC' : 'LƯU BÁO CÁO HỌC KỲ';
    storageService.addAuditLog(
      savedBy,
      `Lưu ${title} (${getSessionDisplayName(normSession)}) - Phiên bản v${newVersion} (Chuyên cần: ${report.attendanceRate.toFixed(1)}%)`,
      'report',
      `${actionLabel} v${newVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Khóa / Mở khóa báo cáo định kỳ đã lưu
   */
  public toggleLockPeriodReport(
    periodKey: string,
    lock: boolean,
    actorName: string
  ): SavedPeriodReport | null {
    const existing = storageService.getPeriodReportByKey(periodKey);
    if (!existing) return null;
    const nowTs = this.formatTimestamp();
    const updated: SavedPeriodReport = {
      ...existing,
      status: lock ? 'LOCKED' : 'SAVED',
      updatedAt: nowTs,
    };
    storageService.savePeriodReport(updated);
    storageService.addAuditLog(
      actorName,
      `${lock ? 'Chốt khóa' : 'Mở khóa'} ${updated.title} (${getSessionDisplayName(updated.session)})`,
      'report',
      lock ? 'CHỐT KHÓA BÁO CÁO ĐỊNH KỲ' : 'MỞ KHÓA BÁO CÁO ĐỊNH KỲ',
      'admin_tpt',
      updated.session
    );
    return updated;
  }
}

export const periodReportService = new PeriodReportService();
