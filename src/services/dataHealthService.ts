import { AttendanceReport, SchoolDailyReport } from '../types';
import { storageService } from './storageService';

export type HealthIssueSeverity = 'DANGER' | 'WARNING' | 'INFO';

export interface HealthIssueItem {
  id: string;
  type: 'MISSING_SNAPSHOT' | 'MISMATCH_TOTAL' | 'ORPHAN_RECORD' | 'INVALID_CLASS_SIZE' | 'DUPLICATE_REPORT';
  severity: HealthIssueSeverity;
  title: string;
  description: string;
  date?: string;
  className?: string;
  classId?: string;
  details?: string;
}

export interface DataHealthReport {
  checkedAt: string;
  totalIssuesCount: number;
  dangerCount: number;
  warningCount: number;
  infoCount: number;
  isHealthy: boolean;
  issues: HealthIssueItem[];
}

class DataHealthService {
  public checkDataHealth(): DataHealthReport {
    const issues: HealthIssueItem[] = [];
    const classes = storageService.getClasses();
    const students = storageService.getStudents();
    const reports = storageService.getReports();
    const studentIdSet = new Set(students.map(s => s.id));

    // 1. Kiểm tra lớp có sĩ số âm hoặc bất hợp lý
    classes.forEach(c => {
      const clsStudents = students.filter(s => s.classId === c.id || s.className === c.name);
      if (clsStudents.length === 0) {
        issues.push({
          id: `empty_class_${c.id}`,
          type: 'INVALID_CLASS_SIZE',
          severity: 'WARNING',
          title: `Lớp ${c.name} hiện chưa có học sinh`,
          description: `Lớp ${c.name} (Khối ${c.grade}) không có bất kỳ học sinh nào trong cơ sở dữ liệu.`,
          className: c.name,
          classId: c.id,
        });
      }
    });

    // 2. Kiểm tra Duplicate Reports
    const reportKeyMap = new Map<string, AttendanceReport[]>();
    reports.forEach(r => {
      const key = `${r.date}_${r.session}_${r.classId}`;
      const list = reportKeyMap.get(key) || [];
      list.push(r);
      reportKeyMap.set(key, list);
    });

    reportKeyMap.forEach((list, key) => {
      if (list.length > 1) {
        const sample = list[0];
        issues.push({
          id: `dup_${key}`,
          type: 'DUPLICATE_REPORT',
          severity: 'DANGER',
          title: `Trùng lặp báo cáo Lớp ${sample.className}`,
          description: `Phát hiện ${list.length} báo cáo trùng ngày ${sample.date} phiên ${sample.session} cho lớp ${sample.className}.`,
          date: sample.date,
          className: sample.className,
          classId: sample.classId,
        });
      }
    });

    // 3. Kiểm tra số liệu báo cáo không khớp chi tiết
    reports.forEach(r => {
      const total = r.totalStudents;
      const pres = r.presentCount;
      const abs = r.absentCount;

      if (pres + abs !== total && total > 0 && r.status === 'APPROVED') {
        issues.push({
          id: `mismatch_${r.id}`,
          type: 'MISMATCH_TOTAL',
          severity: 'DANGER',
          title: `Lệch số liệu báo cáo Lớp ${r.className}`,
          description: `Ngày ${r.date}: Có mặt (${pres}) + Vắng (${abs}) = ${pres + abs}, không khớp với Sĩ số (${total}).`,
          date: r.date,
          className: r.className,
          classId: r.classId,
        });
      }

      // Check orphan records
      (r.records || []).forEach(rec => {
        if (!studentIdSet.has(rec.studentId)) {
          issues.push({
            id: `orphan_${rec.id || rec.studentId}_${r.date}`,
            type: 'ORPHAN_RECORD',
            severity: 'INFO',
            title: `Bản ghi điểm danh của học sinh không còn trong danh sách`,
            description: `Học sinh ${rec.studentName} (mã: ${rec.studentCode || rec.studentId}) ngày ${r.date} không có trong danh mục học sinh hiện tại (có thể là học sinh cũ đã chuyển trường).`,
            date: r.date,
            className: r.className,
          });
        }
      });
    });

    // 4. Kiểm tra official daily reports thiếu snapshot
    try {
      const raw = localStorage.getItem('thcs_banbo_v2_daily_official');
      if (raw) {
        const officialReports: SchoolDailyReport[] = JSON.parse(raw);
        officialReports.forEach(off => {
          if (off.reportStatus === 'LOCKED' && off.totalStudentsSnapshot === undefined) {
            issues.push({
              id: `missing_snap_${off.id}`,
              type: 'MISSING_SNAPSHOT',
              severity: 'WARNING',
              title: `Báo cáo đã chốt ngày ${off.date} thiếu snapshot học sinh`,
              description: `Báo cáo chính thức ngày ${off.date} chưa được lưu snapshot sĩ số tại thời điểm chốt.`,
              date: off.date,
            });
          }
        });
      }
    } catch {
      // ignore
    }

    const dangerCount = issues.filter(i => i.severity === 'DANGER').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const infoCount = issues.filter(i => i.severity === 'INFO').length;

    return {
      checkedAt: new Date().toLocaleString('vi-VN'),
      totalIssuesCount: issues.length,
      dangerCount,
      warningCount,
      infoCount,
      isHealthy: dangerCount === 0 && warningCount === 0,
      issues,
    };
  }
}

export const dataHealthService = new DataHealthService();
