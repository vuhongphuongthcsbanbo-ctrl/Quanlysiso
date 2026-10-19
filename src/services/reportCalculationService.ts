import { Student, AttendanceRecord, AttendanceReport, SchoolClass, SessionType, normalizeSession } from '../types';
import { schoolCalendarService } from './schoolCalendarService';
import { SchoolSettings } from '../types';

export interface AttendanceSummaryCalculation {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  excusedAbsentCount: number;
  unexcusedAbsentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  boardingTotal: number;
  boardingPresent: number;
  boardingAbsent: number;
  nonBoardingTotal: number;
  nonBoardingPresent: number;
  nonBoardingAbsent: number;
  attendanceRate: number;
  validationError?: string;
}

/**
 * calculateAttendanceSummary
 * Centralized calculation function complying with:
 * - Mục I, XXI, XXII, XXIII, XXIV, LII
 * - Only active students are counted
 * - Mặc định mọi học sinh = PRESENT (countsAsPresent: true, countsAsAbsent: false)
 * - ABSENT_EXCUSED / ABSENT_UNEXCUSED: countsAsPresent: false, countsAsAbsent: true
 * - LATE: countsAsPresent: true, lateCount: +1 (Đi muộn vẫn tính có mặt)
 * - EARLY_LEAVE: countsAsPresent: true, earlyLeaveCount: +1 (Về sớm vẫn tính có mặt)
 * - Automatic deduction for Boarding vs Non-Boarding
 */
export function calculateAttendanceSummary(
  students: Student[],
  attendanceRecords: AttendanceRecord[]
): AttendanceSummaryCalculation {
  const activeStudents = students.filter(s => s.status === 'active' || !s.status);
  const totalStudents = activeStudents.length;

  const boardingStudents = activeStudents.filter(s => s.boardingType === 'BOARDING');
  const nonBoardingStudents = activeStudents.filter(s => s.boardingType === 'NON_BOARDING');

  const boardingTotal = boardingStudents.length;
  const nonBoardingTotal = nonBoardingStudents.length;

  const recordMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach(r => recordMap.set(r.studentId, r));

  let presentCount = 0;
  let absentCount = 0;
  let excusedAbsentCount = 0;
  let unexcusedAbsentCount = 0;
  let lateCount = 0;
  let earlyLeaveCount = 0;

  let boardingAbsent = 0;
  let nonBoardingAbsent = 0;

  for (const student of activeStudents) {
    const record = recordMap.get(student.id);
    const status = record?.status ? String(record.status).toUpperCase() : 'PRESENT';
    const isBoarding = student.boardingType === 'BOARDING';

    switch (status) {
      case 'PRESENT':
        presentCount++;
        break;

      case 'ABSENT_EXCUSED':
        absentCount++;
        excusedAbsentCount++;
        if (isBoarding) boardingAbsent++;
        else nonBoardingAbsent++;
        break;

      case 'ABSENT_UNEXCUSED':
      case 'FULL_DAY_ABSENCE':
        absentCount++;
        unexcusedAbsentCount++;
        if (isBoarding) boardingAbsent++;
        else nonBoardingAbsent++;
        break;

      case 'LATE':
        // Đi muộn vẫn được tính có mặt buổi sáng, không tăng absentCount
        presentCount++;
        lateCount++;
        break;

      case 'EARLY_LEAVE':
        // Về sớm vẫn được tính có mặt buổi sáng
        presentCount++;
        earlyLeaveCount++;
        break;

      case 'OTHER':
        if (record?.absenceType === 'unexcused' || record?.absenceType === 'excused') {
          absentCount++;
          if (record.absenceType === 'excused') excusedAbsentCount++;
          else unexcusedAbsentCount++;
          if (isBoarding) boardingAbsent++;
          else nonBoardingAbsent++;
        } else {
          presentCount++;
        }
        break;

      default:
        presentCount++;
        break;
    }
  }

  const boardingPresent = Math.max(0, boardingTotal - boardingAbsent);
  const nonBoardingPresent = Math.max(0, nonBoardingTotal - nonBoardingAbsent);

  // Attendance rate %
  const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 100;

  // Strict Validation Rules
  let validationError: string | undefined;
  if (presentCount + absentCount !== totalStudents) {
    validationError = `Tổng học sinh có mặt (${presentCount}) và vắng (${absentCount}) không khớp với sĩ số lớp (${totalStudents}).`;
  } else if (boardingTotal + nonBoardingTotal !== totalStudents) {
    validationError = `Tổng học sinh bán trú (${boardingTotal}) và ngoại trú (${nonBoardingTotal}) không khớp sĩ số (${totalStudents}).`;
  } else if (boardingPresent + boardingAbsent !== boardingTotal) {
    validationError = `Số liệu bán trú có mặt (${boardingPresent}) và vắng (${boardingAbsent}) không khớp danh sách bán trú (${boardingTotal}).`;
  } else if (nonBoardingPresent + nonBoardingAbsent !== nonBoardingTotal) {
    validationError = `Số liệu ngoại trú có mặt (${nonBoardingPresent}) và vắng (${nonBoardingAbsent}) không khớp danh sách ngoại trú (${nonBoardingTotal}).`;
  }

  return {
    totalStudents,
    presentCount,
    absentCount,
    excusedAbsentCount,
    unexcusedAbsentCount,
    lateCount,
    earlyLeaveCount,
    boardingTotal,
    boardingPresent,
    boardingAbsent,
    nonBoardingTotal,
    nonBoardingPresent,
    nonBoardingAbsent,
    attendanceRate,
    validationError,
  };
}

/**
 * Centralized Attendance Rate Formula (Mục XVI, LXXXI)
 * expectedAttendanceSessions: tổng số lượt học sinh phải có mặt trong khoảng thời gian
 * presentAttendanceSessions: tổng số lượt được tính có mặt (bao gồm cả đi muộn, về sớm)
 * attendanceRate = presentAttendanceSessions / expectedAttendanceSessions * 100
 */
export function calculateAttendanceRate(
  expectedAttendanceSessions: number,
  presentAttendanceSessions: number
): number {
  if (expectedAttendanceSessions <= 0) return 100;
  const rate = (presentAttendanceSessions / expectedAttendanceSessions) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

/**
 * Filter approved reports only (Mục III: Dữ liệu được tính vào báo cáo chính thức)
 * Chỉ sử dụng attendanceReports có status = 'APPROVED' hoặc 'LOCKED'
 */
export function filterApprovedReports(reports: AttendanceReport[]): AttendanceReport[] {
  return reports.filter(
    r => r.status === 'APPROVED' || r.status === 'LOCKED' || (r.status as string) === 'locked'
  );
}

/**
 * Check if date is a required school day (handling holidays and non-school days)
 */
export function isSchoolDay(dateStr: string, settings?: SchoolSettings): boolean {
  const check = schoolCalendarService.isAttendanceRequiredForDate(dateStr, settings);
  return check.required;
}
