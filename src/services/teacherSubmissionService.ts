import { SchoolClass, AttendanceReport, SessionType, normalizeSession } from '../types';
import { storageService } from './storageService';
import { getTodayDateString } from '../utils/formatters';

export interface TeacherSubmissionProgressItem {
  stt: number;
  classId: string;
  className: string;
  grade: number;
  teacherName: string;
  teacherPhone?: string;
  deadline: string;
  submittedAt: string;
  isSubmitted: boolean;
  isLate: boolean;
  lateByMinutes: number;
  revisionCount: number;
  approvedAt: string;
  status: string;
  statusColor: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
}

export interface TeacherSubmissionSummary {
  date: string;
  session: SessionType;
  totalClasses: number;
  submittedOnTimeCount: number;
  submittedLateCount: number;
  unsubmittedCount: number;
  revisionRequiredCount: number;
  approvedCount: number;
  items: TeacherSubmissionProgressItem[];
}

class TeacherSubmissionService {
  /**
   * Get Teacher Submission Progress for a date and session
   * STRICT NOTE (Mục XXX): KHÔNG XẾP HẠNG GVCN, không tạo điểm số, chỉ hiển thị thông tin thực tế.
   */
  public getSubmissionProgress(
    date: string = getTodayDateString(),
    session: SessionType = 'MORNING'
  ): TeacherSubmissionSummary {
    const normSession = normalizeSession(session);
    const settings = storageService.getSettings();
    const defaultDeadline = normSession === 'MORNING'
      ? (settings.morningDeadlineTime || '07:20')
      : (settings.afternoonDeadlineTime || '13:45');

    const classes = storageService.getClasses().filter(c => c.isActive);
    const reports = storageService.getReportsByDate(date, normSession);
    const reportMap = new Map<string, AttendanceReport>();
    reports.forEach(r => reportMap.set(r.classId, r));

    let onTimeCount = 0;
    let lateCount = 0;
    let unsubmittedCount = 0;
    let revisionCount = 0;
    let approvedCount = 0;

    const items: TeacherSubmissionProgressItem[] = classes.map((cls, idx) => {
      const rep = reportMap.get(cls.id);
      const isSubmitted = !!rep && rep.status !== 'NOT_SUBMITTED' && (rep.status as string) !== 'not_reported';
      const deadline = rep?.deadlineAt ? rep.deadlineAt.split(' ')[1] || defaultDeadline : defaultDeadline;

      let submittedAt = '--';
      let isLate = false;
      let lateByMinutes = 0;
      let revisionNumber = rep?.revisionCount || 0;
      let approvedAt = '--';
      let status = 'Chưa báo cáo';
      let statusColor: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue' = 'slate';

      if (!isSubmitted) {
        unsubmittedCount++;
        status = 'Chưa báo cáo';
        statusColor = 'slate';
      } else if (rep) {
        submittedAt = rep.submittedAt ? rep.submittedAt.split(' ')[1] || rep.submittedAt : '--';
        isLate = !!rep.isLateSubmission || (rep.lateByMinutes !== undefined && rep.lateByMinutes > 0);
        lateByMinutes = rep.lateByMinutes || 0;

        if (isLate) {
          lateCount++;
        } else {
          onTimeCount++;
        }

        if (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked') {
          approvedCount++;
          approvedAt = rep.approvedAt ? rep.approvedAt.split(' ')[1] || rep.approvedAt : '--';
          status = rep.status === 'LOCKED' || (rep.status as string) === 'locked' ? 'Đã khóa' : 'Đã duyệt';
          statusColor = 'emerald';
        } else if (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision') {
          revisionCount++;
          status = 'Yêu cầu chỉnh sửa';
          statusColor = 'rose';
        } else if (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted') {
          status = 'Chờ duyệt';
          statusColor = 'amber';
        }
      }

      return {
        stt: idx + 1,
        classId: cls.id,
        className: cls.name,
        grade: cls.grade,
        teacherName: rep?.teacherName || cls.teacherName || 'Chưa phân công',
        teacherPhone: cls.teacherPhone,
        deadline,
        submittedAt,
        isSubmitted,
        isLate,
        lateByMinutes,
        revisionCount: revisionNumber,
        approvedAt,
        status,
        statusColor,
      };
    });

    return {
      date,
      session: normSession,
      totalClasses: classes.length,
      submittedOnTimeCount: onTimeCount,
      submittedLateCount: lateCount,
      unsubmittedCount,
      revisionRequiredCount: revisionCount,
      approvedCount,
      items,
    };
  }
}

export const teacherSubmissionService = new TeacherSubmissionService();
