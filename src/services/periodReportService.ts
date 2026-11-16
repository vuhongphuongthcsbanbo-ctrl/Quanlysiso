import {
  SavedPeriodReport,
  SavedReportPeriodType,
  SessionType,
  normalizeSession,
  getSessionDisplayName,
} from '../types';
import { storageService } from './storageService';
import { dailyReportService } from './dailyReportService';
import { weeklyReportService } from './weeklyReportService';
import { monthlyReportService } from './monthlyReportService';
import { semesterReportService } from './semesterReportService';
import { calculatePercentage } from './reportCalculationService';

class PeriodReportService {
  private isAutoSaving = false;

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

  private buildWeeklyPayload(
    startDate: string,
    endDate: string,
    session: SessionType,
    savedBy: string,
    savedByTitle: string,
    existing: SavedPeriodReport | null,
    isAutoSaved: boolean,
    options?: { notes?: string; lock?: boolean }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodKey = this.getWeeklyPeriodKey(startDate, endDate, normSession);
    const summary = weeklyReportService.getWeeklyAttendance(startDate, endDate, normSession);
    const nowTs = this.formatTimestamp();

    const versionHistory = [...(existing?.versionHistory || [])];
    let nextVersion = existing?.reportVersion || 1;
    if (!isAutoSaved && existing) {
      nextVersion = (existing.reportVersion || 1) + 1;
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

    return {
      id: existing?.id || `rep_${periodKey}`,
      periodType: 'WEEKLY',
      periodKey,
      title: `Báo cáo tuần (${startDate} → ${endDate})`,
      schoolYearId,
      session: normSession,
      startDate,
      endDate,
      reportVersion: nextVersion,
      status: options?.lock
        ? 'LOCKED'
        : existing?.status === 'LOCKED' && options?.lock !== false
        ? 'LOCKED'
        : 'SAVED',
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
      absentRate: summary.absentRate,
      excusedRate: summary.excusedRate,
      unexcusedRate: summary.unexcusedRate,
      lateRate: summary.lateRate,
      isAutoSaved,
      classStats: summary.classStats,
      daysBreakdown: summary.daysBreakdown,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };
  }

  private buildMonthlyPayload(
    year: number,
    month: number,
    session: SessionType,
    savedBy: string,
    savedByTitle: string,
    existing: SavedPeriodReport | null,
    isAutoSaved: boolean,
    options?: { notes?: string; lock?: boolean; threshold?: number }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodKey = this.getMonthlyPeriodKey(year, month, normSession);

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
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');

    const versionHistory = [...(existing?.versionHistory || [])];
    let nextVersion = existing?.reportVersion || 1;
    if (!isAutoSaved && existing) {
      nextVersion = (existing.reportVersion || 1) + 1;
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

    return {
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
      reportVersion: nextVersion,
      status: options?.lock
        ? 'LOCKED'
        : existing?.status === 'LOCKED' && options?.lock !== false
        ? 'LOCKED'
        : 'SAVED',
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
      boardingExpected: summary.boardingExpected,
      boardingPresent: summary.boardingPresent,
      boardingAbsent: summary.boardingAbsent,
      boardingRate: summary.boardingRate,
      attendanceRate: summary.attendanceRate,
      absentRate: summary.absentRate,
      excusedRate: summary.excusedRate,
      unexcusedRate: summary.unexcusedRate,
      lateRate: summary.lateRate,
      isAutoSaved,
      studentsWithAbsenceCount: summary.studentsWithAbsenceCount,
      classStats: summary.classStats,
      frequentAbsentStudents: summary.frequentAbsentStudents,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };
  }

  private buildSemesterPayload(
    period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR',
    session: SessionType,
    savedBy: string,
    savedByTitle: string,
    existing: SavedPeriodReport | null,
    isAutoSaved: boolean,
    options?: { notes?: string; lock?: boolean }
  ): SavedPeriodReport {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodType: SavedReportPeriodType = period === 'FULL_YEAR' ? 'SCHOOL_YEAR' : period;
    const periodKey = this.getSemesterPeriodKey(period, schoolYearId, normSession);
    const summary = semesterReportService.getSemesterReport(period, normSession);
    const config = semesterReportService.getConfig(period, schoolYearId);
    const nowTs = this.formatTimestamp();
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');

    const versionHistory = [...(existing?.versionHistory || [])];
    let nextVersion = existing?.reportVersion || 1;
    if (!isAutoSaved && existing) {
      nextVersion = (existing.reportVersion || 1) + 1;
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

    return {
      id: existing?.id || `rep_${periodKey}`,
      periodType,
      periodKey,
      title,
      schoolYearId,
      session: normSession,
      startDate: config.startDate,
      endDate: config.endDate,
      reportVersion: nextVersion,
      status: options?.lock
        ? 'LOCKED'
        : existing?.status === 'LOCKED' && options?.lock !== false
        ? 'LOCKED'
        : 'SAVED',
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
      absentRate: summary.absentRate,
      excusedRate: summary.excusedRate,
      unexcusedRate: summary.unexcusedRate,
      lateRate: summary.lateRate,
      isAutoSaved,
      gradeStats: summary.gradeStats,
      classStats: summary.classStats,
      versionHistory,
      createdAt: existing?.createdAt || nowTs,
      updatedAt: nowTs,
    };
  }

  private hasPeriodChanged(existing: SavedPeriodReport | null, next: SavedPeriodReport): boolean {
    if (!existing) return true;
    return (
      existing.totalStudentsRoster !== next.totalStudentsRoster ||
      existing.totalExpectedSessions !== next.totalExpectedSessions ||
      existing.totalPresentSessions !== next.totalPresentSessions ||
      existing.totalAbsentSessions !== next.totalAbsentSessions ||
      existing.totalExcusedSessions !== next.totalExcusedSessions ||
      existing.totalUnexcusedSessions !== next.totalUnexcusedSessions ||
      existing.totalLateCount !== next.totalLateCount ||
      existing.attendanceRate !== next.attendanceRate ||
      existing.absentRate !== next.absentRate ||
      existing.schoolDaysCount !== next.schoolDaysCount ||
      (existing.boardingPresent ?? 0) !== (next.boardingPresent ?? 0) ||
      (existing.studentsWithAbsenceCount ?? 0) !== (next.studentsWithAbsenceCount ?? 0)
    );
  }

  /**
   * Lưu thủ công báo cáo sĩ số theo TUẦN
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
    const periodKey = this.getWeeklyPeriodKey(startDate, endDate, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    const report = this.buildWeeklyPayload(
      startDate,
      endDate,
      normSession,
      savedBy,
      savedByTitle,
      existing,
      false,
      options
    );
    storageService.savePeriodReport(report);
    storageService.addAuditLog(
      savedBy,
      `Lưu báo cáo sĩ số TUẦN (${startDate} đến ${endDate}, ${getSessionDisplayName(normSession)}) - Phiên bản v${report.reportVersion} (Có mặt: ${report.attendanceRate.toFixed(1)}%, Vắng: ${(report.absentRate ?? calculatePercentage(report.totalAbsentSessions, report.totalExpectedSessions)).toFixed(1)}%)`,
      'report',
      `LƯU BÁO CÁO TUẦN v${report.reportVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Tự động lưu báo cáo TUẦN nếu chưa khóa và có dữ liệu mới/thay đổi
   */
  public autoSaveWeeklyReport(
    startDate: string,
    endDate: string,
    session: SessionType = 'MORNING',
    savedBy: string = 'Hệ thống tự động',
    options?: { silent?: boolean }
  ): SavedPeriodReport | null {
    const normSession = normalizeSession(session);
    const periodKey = this.getWeeklyPeriodKey(startDate, endDate, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    if (existing?.status === 'LOCKED') return null;

    const next = this.buildWeeklyPayload(
      startDate,
      endDate,
      normSession,
      savedBy,
      existing?.savedByTitle || 'Tự động đồng bộ',
      existing,
      true
    );
    if (!existing && next.totalExpectedSessions === 0) return null;
    if (!this.hasPeriodChanged(existing, next)) return null;

    storageService.savePeriodReport(next, { silent: options?.silent });
    return next;
  }

  /**
   * Lưu thủ công báo cáo sĩ số theo THÁNG
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
    const periodKey = this.getMonthlyPeriodKey(year, month, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    const report = this.buildMonthlyPayload(
      year,
      month,
      normSession,
      savedBy,
      savedByTitle,
      existing,
      false,
      options
    );
    storageService.savePeriodReport(report);
    storageService.addAuditLog(
      savedBy,
      `Lưu báo cáo sĩ số THÁNG ${month}/${year} (${getSessionDisplayName(normSession)}) - Phiên bản v${report.reportVersion} (Có mặt: ${report.attendanceRate.toFixed(1)}%, Vắng: ${(report.absentRate ?? calculatePercentage(report.totalAbsentSessions, report.totalExpectedSessions)).toFixed(1)}%)`,
      'report',
      `LƯU BÁO CÁO THÁNG v${report.reportVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Tự động lưu báo cáo THÁNG nếu chưa khóa và có dữ liệu mới/thay đổi
   */
  public autoSaveMonthlyReport(
    year: number,
    month: number,
    session: SessionType = 'MORNING',
    savedBy: string = 'Hệ thống tự động',
    options?: { silent?: boolean; threshold?: number }
  ): SavedPeriodReport | null {
    const normSession = normalizeSession(session);
    const periodKey = this.getMonthlyPeriodKey(year, month, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    if (existing?.status === 'LOCKED') return null;

    const next = this.buildMonthlyPayload(
      year,
      month,
      normSession,
      savedBy,
      existing?.savedByTitle || 'Tự động đồng bộ',
      existing,
      true,
      { threshold: options?.threshold }
    );
    if (!existing && next.totalExpectedSessions === 0) return null;
    if (!this.hasPeriodChanged(existing, next)) return null;

    storageService.savePeriodReport(next, { silent: options?.silent });
    return next;
  }

  /**
   * Lưu thủ công báo cáo sĩ số theo HỌC KỲ (HK I / HK II) hoặc NĂM HỌC
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
    const periodKey = this.getSemesterPeriodKey(period, schoolYearId, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    const report = this.buildSemesterPayload(
      period,
      normSession,
      savedBy,
      savedByTitle,
      existing,
      false,
      options
    );
    storageService.savePeriodReport(report);
    const actionLabel = period === 'FULL_YEAR' ? 'LƯU BÁO CÁO NĂM HỌC' : 'LƯU BÁO CÁO HỌC KỲ';
    storageService.addAuditLog(
      savedBy,
      `Lưu ${report.title} (${getSessionDisplayName(normSession)}) - Phiên bản v${report.reportVersion} (Có mặt: ${report.attendanceRate.toFixed(1)}%, Vắng: ${(report.absentRate ?? calculatePercentage(report.totalAbsentSessions, report.totalExpectedSessions)).toFixed(1)}%)`,
      'report',
      `${actionLabel} v${report.reportVersion}`,
      'admin_tpt',
      normSession
    );
    return report;
  }

  /**
   * Tự động lưu báo cáo HỌC KỲ hoặc NĂM HỌC nếu chưa khóa và có dữ liệu mới/thay đổi
   */
  public autoSaveSemesterOrYearReport(
    period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR',
    session: SessionType = 'MORNING',
    savedBy: string = 'Hệ thống tự động',
    options?: { silent?: boolean }
  ): SavedPeriodReport | null {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const schoolYearId = settings.schoolYear || '2026-2027';
    const periodKey = this.getSemesterPeriodKey(period, schoolYearId, normSession);
    const existing = storageService.getPeriodReportByKey(periodKey);
    if (existing?.status === 'LOCKED') return null;

    const next = this.buildSemesterPayload(
      period,
      normSession,
      savedBy,
      existing?.savedByTitle || 'Tự động đồng bộ',
      existing,
      true
    );
    if (!existing && next.totalExpectedSessions === 0) return null;
    if (!this.hasPeriodChanged(existing, next)) return null;

    storageService.savePeriodReport(next, { silent: options?.silent });
    return next;
  }

  /**
   * Tự động lưu ĐỒNG BỘ cả 5 cấp báo cáo (Ngày, Tuần, Tháng, Học kỳ, Năm học) cho một ngày & buổi cụ thể
   */
  public autoSaveAllForDate(
    date: string,
    session: SessionType = 'MORNING',
    actorName: string = 'Hệ thống tự động',
    options?: { silent?: boolean }
  ) {
    if (this.isAutoSaving || !date) return;
    this.isAutoSaving = true;
    try {
      const normSession = normalizeSession(session);
      const settings = storageService.getSettings();

      // 1. Tự động lưu theo NGÀY
      dailyReportService.autoSaveDailySnapshot(date, normSession, actorName, options);

      // 2. Tự động lưu theo TUẦN chứa ngày này
      const weekRange = weeklyReportService.getWeekRange(date, !!settings.enableSaturday);
      this.autoSaveWeeklyReport(weekRange.startDate, weekRange.endDate, normSession, actorName, options);

      // 3. Tự động lưu theo THÁNG của ngày này
      const [yStr, mStr] = date.split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      if (year && month) {
        this.autoSaveMonthlyReport(year, month, normSession, actorName, options);
      }

      // 4. Tự động lưu theo HỌC KỲ tương ứng
      const semPeriod = semesterReportService.getSemesterForDate(date, settings.schoolYear);
      this.autoSaveSemesterOrYearReport(semPeriod, normSession, actorName, options);

      // 5. Tự động lưu theo NĂM HỌC
      this.autoSaveSemesterOrYearReport('FULL_YEAR', normSession, actorName, options);
    } finally {
      this.isAutoSaving = false;
    }
  }

  /**
   * Quét toàn bộ dữ liệu điểm danh hiện có và tự động lưu/cập nhật tất cả báo cáo Ngày, Tuần, Tháng, Học kỳ, Năm học
   */
  public reconcileAllAutoSavedReports(actorName: string = 'Hệ thống tự động'): boolean {
    if (this.isAutoSaving) return false;
    this.isAutoSaving = true;
    let changed = false;

    try {
      const allReports = storageService.getReports();
      if (allReports.length === 0) return false;

      const settings = storageService.getSettings();
      const dateSessionMap = new Map<string, { date: string; session: 'MORNING' | 'AFTERNOON' }>();
      const weekSessionMap = new Map<string, { startDate: string; endDate: string; session: 'MORNING' | 'AFTERNOON' }>();
      const monthSessionMap = new Map<string, { year: number; month: number; session: 'MORNING' | 'AFTERNOON' }>();
      const semesterSessionMap = new Map<string, { period: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR'; session: 'MORNING' | 'AFTERNOON' }>();

      for (const r of allReports) {
        if (!r.date) continue;
        const ns = normalizeSession(r.session);
        dateSessionMap.set(`${r.date}_${ns}`, { date: r.date, session: ns });

        const wr = weeklyReportService.getWeekRange(r.date, !!settings.enableSaturday);
        weekSessionMap.set(`${wr.startDate}_${wr.endDate}_${ns}`, {
          startDate: wr.startDate,
          endDate: wr.endDate,
          session: ns,
        });

        const [yStr, mStr] = r.date.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        if (y && m) {
          monthSessionMap.set(`${y}-${m}_${ns}`, { year: y, month: m, session: ns });
        }

        const sem = semesterReportService.getSemesterForDate(r.date, settings.schoolYear);
        semesterSessionMap.set(`${sem}_${ns}`, { period: sem, session: ns });
        semesterSessionMap.set(`FULL_YEAR_${ns}`, { period: 'FULL_YEAR', session: ns });
      }

      dateSessionMap.forEach(({ date, session }) => {
        if (dailyReportService.autoSaveDailySnapshot(date, session, actorName, { silent: true })) {
          changed = true;
        }
      });

      weekSessionMap.forEach(({ startDate, endDate, session }) => {
        if (this.autoSaveWeeklyReport(startDate, endDate, session, actorName, { silent: true })) {
          changed = true;
        }
      });

      monthSessionMap.forEach(({ year, month, session }) => {
        if (this.autoSaveMonthlyReport(year, month, session, actorName, { silent: true })) {
          changed = true;
        }
      });

      semesterSessionMap.forEach(({ period, session }) => {
        if (this.autoSaveSemesterOrYearReport(period, session, actorName, { silent: true })) {
          changed = true;
        }
      });

      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
      }
      return changed;
    } finally {
      this.isAutoSaving = false;
    }
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

// Tự động lưu Ngày, Tuần, Tháng, Học kỳ, Năm học mỗi khi dữ liệu điểm danh lớp được gửi, duyệt hoặc cập nhật
storageService.registerAttendanceAutoSaveHook((date, session, actorName) => {
  periodReportService.autoSaveAllForDate(date, session, actorName || 'Hệ thống tự động');
});
