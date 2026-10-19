import { Student, AttendanceRecord, SessionType } from '../types';
import { storageService } from './storageService';
import { filterApprovedReports, calculateAttendanceRate } from './reportCalculationService';

export interface StudentTimelineItem {
  date: string;
  session: SessionType;
  status: string;
  statusLabel: string;
  className: string;
  grade: number;
  boardingType: string;
  reason?: string;
  reasonDetail?: string;
  note?: string;
  isLate: boolean;
  isEarlyLeave: boolean;
}

export interface StudentAttendanceFullProfile {
  student: Student;
  schoolYear: string;
  totalRequiredSessions: number;
  totalPresentSessions: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  attendanceRate: number;
  timeline: StudentTimelineItem[];
}

class StudentAttendanceReportService {
  /**
   * Get full student attendance profile with timeline
   * Historical preservation (Mục XIII, LXXVII, LXXIX):
   * Uses className and boardingType from the record at that report time.
   */
  public getStudentProfile(
    studentId: string,
    filterYear?: string,
    filterMonth?: string
  ): StudentAttendanceFullProfile | null {
    const students = storageService.getStudents();
    const student = students.find(s => s.id === studentId || s.code === studentId);
    if (!student) return null;

    const settings = storageService.getSettings();
    const approvedReports = filterApprovedReports(storageService.getReports());

    const timeline: StudentTimelineItem[] = [];
    let totalRequiredSessions = 0;
    let totalPresentSessions = 0;
    let absentExcusedCount = 0;
    let absentUnexcusedCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;

    // Filter reports
    let targetReports = approvedReports;
    if (filterMonth) {
      targetReports = targetReports.filter(r => r.date.startsWith(filterMonth));
    }

    // Sort by date desc
    targetReports.sort((a, b) => b.date.localeCompare(a.date));

    targetReports.forEach(report => {
      // Find record for this student in this report
      const rec = (report.records || []).find(
        r => r.studentId === student.id || r.studentCode === student.code
      );

      // If student was in this class at that date
      if (rec || report.classId === student.classId || report.className === student.className) {
        totalRequiredSessions++;

        const status = rec?.status ? String(rec.status).toUpperCase() : 'PRESENT';
        let statusLabel = 'Có mặt';
        let isLate = false;
        let isEarlyLeave = false;

        switch (status) {
          case 'PRESENT':
            totalPresentSessions++;
            statusLabel = 'Có mặt';
            break;
          case 'ABSENT_EXCUSED':
            absentExcusedCount++;
            statusLabel = 'Vắng có phép';
            break;
          case 'ABSENT_UNEXCUSED':
          case 'FULL_DAY_ABSENCE':
            absentUnexcusedCount++;
            statusLabel = 'Vắng không phép';
            break;
          case 'LATE':
            totalPresentSessions++; // Đi muộn vẫn tính có mặt
            lateCount++;
            isLate = true;
            statusLabel = 'Đi học muộn';
            break;
          case 'EARLY_LEAVE':
            totalPresentSessions++; // Về sớm vẫn tính có mặt
            earlyLeaveCount++;
            isEarlyLeave = true;
            statusLabel = 'Về sớm';
            break;
          case 'OTHER':
            if (rec?.absenceType === 'excused') {
              absentExcusedCount++;
              statusLabel = 'Vắng có phép (Khác)';
            } else if (rec?.absenceType === 'unexcused') {
              absentUnexcusedCount++;
              statusLabel = 'Vắng không phép (Khác)';
            } else {
              totalPresentSessions++;
              statusLabel = 'Có mặt (Khác)';
            }
            break;
          default:
            totalPresentSessions++;
            statusLabel = 'Có mặt';
            break;
        }

        timeline.push({
          date: report.date,
          session: report.session,
          status,
          statusLabel,
          className: rec?.className || report.className,
          grade: rec?.grade || report.grade,
          boardingType: rec?.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú',
          reason: rec?.reason,
          reasonDetail: rec?.reasonDetail,
          note: rec?.note,
          isLate,
          isEarlyLeave,
        });
      }
    });

    const attendanceRate = calculateAttendanceRate(totalRequiredSessions, totalPresentSessions);

    return {
      student,
      schoolYear: settings.schoolYear || '2026-2027',
      totalRequiredSessions,
      totalPresentSessions,
      absentExcusedCount,
      absentUnexcusedCount,
      lateCount,
      earlyLeaveCount,
      attendanceRate,
      timeline,
    };
  }
}

export const studentAttendanceReportService = new StudentAttendanceReportService();
