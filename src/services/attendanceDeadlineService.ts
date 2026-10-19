import {
  AttendanceReport,
  AttendanceDeadlineStatus,
  ReportStatus,
  SchoolSettings,
  SessionType,
} from '../types';
import {
  getVietnamTimeString,
  parseTimeStringToMinutes,
  calculateLateMinutes,
  calculateRemainingMinutes,
} from '../utils/vietnamTime';
import { storageService } from './storageService';

export interface ClassDeadlineEvaluation {
  classId: string;
  reportStatus: ReportStatus;
  deadlineStatus: AttendanceDeadlineStatus;
  isOverdue: boolean;
  overdueMinutes: number;
  timeRemainingMinutes: number | null;
  canSubmit: boolean;
  blockReason?: string;
  priorityRank: number; // 1 to 6
  deadlineTime: string;
  submittedAt?: string;
  isLateSubmission?: boolean;
}

export interface MorningTimelineState {
  currentStepIndex: number;
  currentStepKey: 'BEFORE_START' | 'OPEN' | 'REMINDER_1' | 'REMINDER_2' | 'DEADLINE' | 'FINALIZE_TARGET' | 'FINALIZED';
  currentStepLabel: string;
  steps: {
    key: string;
    time: string;
    label: string;
    description: string;
    isPassed: boolean;
    isCurrent: boolean;
  }[];
  isFinalized: boolean;
  isAllApproved: boolean;
  totalClasses: number;
  submittedClassesCount: number;
  approvedClassesCount: number;
  overdueClassesCount: number;
  revisionClassesCount: number;
  pendingClassesCount: number;
}

class AttendanceDeadlineService {
  /**
   * Đánh giá chi tiết trạng thái hạn nộp của 1 lớp
   */
  public evaluateClassDeadline(
    classId: string,
    date: string,
    session: SessionType = 'MORNING',
    report?: AttendanceReport | null,
    settings?: SchoolSettings,
    simulatedCurrentTime?: string
  ): ClassDeadlineEvaluation {
    const s = settings || storageService.getSettings();
    const rep = report !== undefined ? report : storageService.getReportByDateAndClass(date, classId, session);

    const currentTime = simulatedCurrentTime || getVietnamTimeString();
    const currentMin = parseTimeStringToMinutes(currentTime);

    const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
    const startTime = isAfternoon ? (s.afternoonStartTime || '13:00') : (s.morningStartTime || '06:45');
    const reminder1Time = isAfternoon ? (s.afternoonReminder1Time || '13:25') : (s.morningReminder1Time || '07:05');
    const reminder2Time = isAfternoon ? (s.afternoonReminder2Time || '13:40') : (s.morningReminder2Time || '07:15');
    const deadlineTime = isAfternoon ? (s.afternoonDeadlineTime || '13:45') : (s.morningDeadlineTime || '07:20');
    const finalizeTargetTime = isAfternoon ? (s.afternoonFinalizeTargetTime || '13:55') : (s.morningFinalizeTargetTime || '07:30');

    const startMin = parseTimeStringToMinutes(startTime);
    const r1Min = parseTimeStringToMinutes(reminder1Time);
    const r2Min = parseTimeStringToMinutes(reminder2Time);
    const deadlineMin = parseTimeStringToMinutes(deadlineTime);

    const reportStatus: ReportStatus = rep?.status || 'NOT_SUBMITTED';

    // 1. Nếu đã duyệt (APPROVED)
    if (reportStatus === 'APPROVED') {
      return {
        classId,
        reportStatus: 'APPROVED',
        deadlineStatus: 'APPROVED',
        isOverdue: false,
        overdueMinutes: 0,
        timeRemainingMinutes: null,
        canSubmit: false,
        priorityRank: 5,
        deadlineTime,
        submittedAt: rep?.submittedAt,
        isLateSubmission: rep?.isLateSubmission,
      };
    }

    // 2. Nếu đã khóa (LOCKED)
    if (reportStatus === 'LOCKED') {
      return {
        classId,
        reportStatus: 'LOCKED',
        deadlineStatus: 'LOCKED',
        isOverdue: false,
        overdueMinutes: 0,
        timeRemainingMinutes: null,
        canSubmit: false,
        priorityRank: 6,
        deadlineTime,
        submittedAt: rep?.submittedAt,
        isLateSubmission: rep?.isLateSubmission,
      };
    }

    // 3. Nếu đang chờ duyệt (PENDING_APPROVAL)
    if (reportStatus === 'PENDING_APPROVAL') {
      const isLate = !!rep?.isLateSubmission;
      return {
        classId,
        reportStatus: 'PENDING_APPROVAL',
        deadlineStatus: isLate ? 'LATE_SUBMITTED' : 'ON_TIME',
        isOverdue: false,
        overdueMinutes: rep?.lateByMinutes || 0,
        timeRemainingMinutes: null,
        canSubmit: false,
        priorityRank: 3,
        deadlineTime,
        submittedAt: rep?.submittedAt,
        isLateSubmission: isLate,
      };
    }

    // 4. Nếu bị trả lại cần chỉnh sửa (REVISION_REQUIRED)
    if (reportStatus === 'REVISION_REQUIRED') {
      let isRevisionOverdue = false;
      let revOverdueMinutes = 0;

      const revMinutes = isAfternoon
        ? (s.afternoonRevisionDeadlineMinutes ?? s.revisionDeadlineMinutes ?? 10)
        : (s.revisionDeadlineMinutes ?? 10);

      if (rep?.revisionRequestedAt && revMinutes) {
        const reqMin = rep.revisionRequestedAt.includes(' ')
          ? parseTimeStringToMinutes(rep.revisionRequestedAt.split(' ')[1])
          : parseTimeStringToMinutes(rep.revisionRequestedAt);
        const revDeadlineMin = reqMin + revMinutes;
        if (currentMin > revDeadlineMin) {
          isRevisionOverdue = true;
          revOverdueMinutes = currentMin - revDeadlineMin;
        }
      }

      return {
        classId,
        reportStatus: 'REVISION_REQUIRED',
        deadlineStatus: isRevisionOverdue ? 'OVERDUE_REVISION' : 'IN_PROGRESS',
        isOverdue: isRevisionOverdue,
        overdueMinutes: revOverdueMinutes,
        timeRemainingMinutes: isRevisionOverdue ? 0 : calculateRemainingMinutes(deadlineTime, currentTime),
        canSubmit: true,
        priorityRank: isRevisionOverdue ? 2 : 2,
        deadlineTime,
        submittedAt: rep?.submittedAt,
        isLateSubmission: rep?.isLateSubmission,
      };
    }

    // 5. Chưa nộp báo cáo (NOT_SUBMITTED)
    // Trường hợp trước giờ mở báo cáo
    if (currentMin < startMin) {
      const allowEarly = isAfternoon
        ? (s.afternoonAllowEarlySubmission ?? s.allowEarlySubmission ?? true)
        : (s.allowEarlySubmission ?? true);
      return {
        classId,
        reportStatus: 'NOT_SUBMITTED',
        deadlineStatus: 'BEFORE_START',
        isOverdue: false,
        overdueMinutes: 0,
        timeRemainingMinutes: startMin - currentMin,
        canSubmit: allowEarly,
        blockReason: allowEarly ? undefined : `Báo cáo sĩ số ${isAfternoon ? 'buổi chiều' : 'buổi sáng'} sẽ bắt đầu từ ${startTime}`,
        priorityRank: 4,
        deadlineTime,
      };
    }

    // Trường hợp quá hạn deadline
    if (currentMin > deadlineMin) {
      const lateMins = currentMin - deadlineMin;
      const allowLate = isAfternoon
        ? (s.afternoonAllowLateSubmission ?? s.allowLateSubmission ?? true)
        : (s.allowLateSubmission ?? true);
      return {
        classId,
        reportStatus: 'NOT_SUBMITTED',
        deadlineStatus: 'OVERDUE',
        isOverdue: true,
        overdueMinutes: lateMins,
        timeRemainingMinutes: 0,
        canSubmit: allowLate,
        blockReason: allowLate
          ? undefined
          : 'Thời gian báo cáo đã kết thúc. Vui lòng liên hệ Tổng phụ trách để được mở quyền bổ sung.',
        priorityRank: 1, // Ưu tiên số 1 trên Dashboard
        deadlineTime,
      };
    }

    // Trong khung giờ bình thường (giữa startMin và deadlineMin)
    let dStatus: AttendanceDeadlineStatus = 'IN_PROGRESS';
    if (currentMin >= r2Min) {
      dStatus = 'REMINDER_2_TRIGGERED';
    } else if (currentMin >= r1Min) {
      dStatus = 'REMINDER_1_TRIGGERED';
    }

    return {
      classId,
      reportStatus: 'NOT_SUBMITTED',
      deadlineStatus: dStatus,
      isOverdue: false,
      overdueMinutes: 0,
      timeRemainingMinutes: deadlineMin - currentMin,
      canSubmit: true,
      priorityRank: 4,
      deadlineTime,
    };
  }

  /**
   * Tính toán trạng thái thanh Timeline buổi sáng (Mục XLVII, XLVIII)
   */
  public getMorningTimelineState(
    date: string,
    session: SessionType = 'MORNING',
    settings?: SchoolSettings,
    simulatedCurrentTime?: string
  ): MorningTimelineState {
    const s = settings || storageService.getSettings();
    const currentTime = simulatedCurrentTime || getVietnamTimeString();
    const currentMin = parseTimeStringToMinutes(currentTime);

    const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
    const sessionLabel = isAfternoon ? 'buổi chiều' : 'buổi sáng';
    const startTime = isAfternoon ? (s.afternoonStartTime || '13:00') : (s.morningStartTime || '06:45');
    const reminder1Time = isAfternoon ? (s.afternoonReminder1Time || '13:25') : (s.morningReminder1Time || '07:05');
    const reminder2Time = isAfternoon ? (s.afternoonReminder2Time || '13:40') : (s.morningReminder2Time || '07:15');
    const deadlineTime = isAfternoon ? (s.afternoonDeadlineTime || '13:45') : (s.morningDeadlineTime || '07:20');
    const finalizeTargetTime = isAfternoon ? (s.afternoonFinalizeTargetTime || '13:55') : (s.morningFinalizeTargetTime || '07:30');

    const startMin = parseTimeStringToMinutes(startTime);
    const r1Min = parseTimeStringToMinutes(reminder1Time);
    const r2Min = parseTimeStringToMinutes(reminder2Time);
    const deadlineMin = parseTimeStringToMinutes(deadlineTime);
    const finalizeMin = parseTimeStringToMinutes(finalizeTargetTime);

    // Kiểm tra báo cáo chính thức đã chốt chưa
    const dailyReport = storageService.getDailyOfficialReport(date, session);
    const isFinalized = dailyReport?.reportStatus === 'LOCKED' || dailyReport?.reportStatus === 'OFFICIAL';

    const classes = storageService.getClasses().filter((c) => c.isActive);
    const reports = storageService.getReportsByDate(date, session);
    const reportMap = new Map<string, AttendanceReport>();
    reports.forEach((r) => reportMap.set(r.classId, r));

    let submittedCount = 0;
    let approvedCount = 0;
    let overdueCount = 0;
    let revisionCount = 0;
    let pendingCount = 0;

    classes.forEach((c) => {
      const rep = reportMap.get(c.id);
      const evalRes = this.evaluateClassDeadline(c.id, date, session, rep, s, currentTime);

      if (evalRes.reportStatus === 'APPROVED' || evalRes.reportStatus === 'LOCKED') {
        approvedCount++;
        submittedCount++;
      } else if (evalRes.reportStatus === 'PENDING_APPROVAL') {
        pendingCount++;
        submittedCount++;
      } else if (evalRes.reportStatus === 'REVISION_REQUIRED') {
        revisionCount++;
        submittedCount++;
      } else {
        if (evalRes.isOverdue) overdueCount++;
      }
    });

    const isAllApproved = approvedCount === classes.length && revisionCount === 0;

    const steps = [
      {
        key: 'OPEN',
        time: startTime,
        label: 'Mở báo cáo',
        description: `Bắt đầu cho phép GVCN gửi báo cáo sĩ số ${sessionLabel}`,
        isPassed: currentMin >= startMin,
        isCurrent: currentMin >= startMin && currentMin < r1Min && !isFinalized,
      },
      {
        key: 'REMINDER_1',
        time: reminder1Time,
        label: 'Nhắc lần 1',
        description: `Tự động nhắc các lớp chưa gửi báo cáo ${sessionLabel}`,
        isPassed: currentMin >= r1Min,
        isCurrent: currentMin >= r1Min && currentMin < r2Min && !isFinalized,
      },
      {
        key: 'REMINDER_2',
        time: reminder2Time,
        label: 'Nhắc lần 2',
        description: 'Cảnh báo mức ưu tiên cao cho lớp chưa gửi',
        isPassed: currentMin >= r2Min,
        isCurrent: currentMin >= r2Min && currentMin < deadlineMin && !isFinalized,
      },
      {
        key: 'DEADLINE',
        time: deadlineTime,
        label: 'Hạn cuối',
        description: 'Chuyển lớp chưa gửi sang trạng thái Quá hạn',
        isPassed: currentMin >= deadlineMin,
        isCurrent: currentMin >= deadlineMin && currentMin < finalizeMin && !isFinalized,
      },
      {
        key: 'FINALIZE_TARGET',
        time: finalizeTargetTime,
        label: 'Giờ chốt dự kiến',
        description: 'TPT duyệt xong và sẵn sàng chốt sổ toàn trường',
        isPassed: currentMin >= finalizeMin || isFinalized,
        isCurrent: currentMin >= finalizeMin && !isFinalized,
      },
    ];

    let currentStepKey: MorningTimelineState['currentStepKey'] = 'OPEN';
    let currentStepLabel = 'Đang nhận báo cáo';
    let currentStepIndex = 0;

    if (isFinalized) {
      currentStepKey = 'FINALIZED';
      currentStepLabel = `Đã chốt sổ sĩ số toàn trường (${sessionLabel})`;
      currentStepIndex = 5;
    } else if (currentMin < startMin) {
      currentStepKey = 'BEFORE_START';
      currentStepLabel = `Chưa đến giờ báo cáo ${sessionLabel} (Bắt đầu lúc ${startTime})`;
      currentStepIndex = 0;
    } else if (currentMin < r1Min) {
      currentStepKey = 'OPEN';
      currentStepLabel = `Đang nhận báo cáo sĩ số ${sessionLabel}`;
      currentStepIndex = 0;
    } else if (currentMin < r2Min) {
      currentStepKey = 'REMINDER_1';
      currentStepLabel = `Đang trong khung giờ nhắc lần 1 (${sessionLabel})`;
      currentStepIndex = 1;
    } else if (currentMin < deadlineMin) {
      currentStepKey = 'REMINDER_2';
      currentStepLabel = `Đang trong khung giờ nhắc lần 2 (${sessionLabel} - Sắp hết hạn)`;
      currentStepIndex = 2;
    } else if (currentMin < finalizeMin) {
      currentStepKey = 'DEADLINE';
      currentStepLabel = `Đã quá hạn cuối nộp báo cáo ${sessionLabel}`;
      currentStepIndex = 3;
    } else {
      currentStepKey = 'FINALIZE_TARGET';
      currentStepLabel = isAllApproved ? 'Đã đủ 20/20 lớp, sẵn sàng chốt sổ' : 'Đã đến giờ chốt nhưng chưa hoàn thành';
      currentStepIndex = 4;
    }

    return {
      currentStepIndex,
      currentStepKey,
      currentStepLabel,
      steps,
      isFinalized,
      isAllApproved,
      totalClasses: classes.length,
      submittedClassesCount: submittedCount,
      approvedClassesCount: approvedCount,
      overdueClassesCount: overdueCount,
      revisionClassesCount: revisionCount,
      pendingClassesCount: pendingCount,
    };
  }

  /**
   * Thống kê tốc độ báo cáo phục vụ kiểm soát quy trình (Mục XLIX, LI)
   * Thuần túy số liệu khách quan, KHÔNG xếp loại/đánh giá phẩm chất giáo viên.
   */
  public getMorningSubmissionSpeedStats(
    date: string,
    session: SessionType = 'MORNING',
    settings?: SchoolSettings
  ) {
    const s = settings || storageService.getSettings();
    const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
    const reports = storageService.getReportsByDate(date, session);
    const classes = storageService.getClasses().filter((c) => c.isActive);

    const r1Time = isAfternoon ? (s.afternoonReminder1Time || '13:25') : (s.morningReminder1Time || '07:05');
    const r2Time = isAfternoon ? (s.afternoonReminder2Time || '13:40') : (s.morningReminder2Time || '07:15');
    const deadlineTime = isAfternoon ? (s.afternoonDeadlineTime || '13:45') : (s.morningDeadlineTime || '07:20');

    const r1Min = parseTimeStringToMinutes(r1Time);
    const r2Min = parseTimeStringToMinutes(r2Time);
    const deadlineMin = parseTimeStringToMinutes(deadlineTime);

    let beforeReminder1 = 0;
    let betweenR1AndR2 = 0;
    let betweenR2AndDeadline = 0;
    let overdue = 0;
    let notSubmittedYet = 0;

    const classDetails: {
      classId: string;
      className: string;
      teacherName: string;
      deadline: string;
      submittedAt?: string;
      lateByMinutes: number;
      revisionCount: number;
      approvedAt?: string;
      speedBucket: 'BEFORE_R1' | 'AFTER_R1' | 'AFTER_R2' | 'OVERDUE' | 'NOT_SUBMITTED';
    }[] = [];

    classes.forEach((cls) => {
      const rep = reports.find((r) => r.classId === cls.id);
      if (!rep || !rep.submittedAt) {
        notSubmittedYet++;
        classDetails.push({
          classId: cls.id,
          className: cls.name,
          teacherName: cls.teacherName || 'GVCN',
          deadline: deadlineTime,
          lateByMinutes: 0,
          revisionCount: 0,
          speedBucket: 'NOT_SUBMITTED',
        });
        return;
      }

      const subTimeStr = rep.submittedAt.includes(' ')
        ? rep.submittedAt.split(' ')[1]
        : rep.submittedAt;
      const subMin = parseTimeStringToMinutes(subTimeStr);

      let bucket: 'BEFORE_R1' | 'AFTER_R1' | 'AFTER_R2' | 'OVERDUE' = 'BEFORE_R1';

      if (subMin <= r1Min) {
        beforeReminder1++;
        bucket = 'BEFORE_R1';
      } else if (subMin <= r2Min) {
        betweenR1AndR2++;
        bucket = 'AFTER_R1';
      } else if (subMin <= deadlineMin) {
        betweenR2AndDeadline++;
        bucket = 'AFTER_R2';
      } else {
        overdue++;
        bucket = 'OVERDUE';
      }

      classDetails.push({
        classId: cls.id,
        className: cls.name,
        teacherName: rep.teacherName || cls.teacherName || 'GVCN',
        deadline: deadlineTime,
        submittedAt: rep.submittedAt,
        lateByMinutes: rep.lateByMinutes || (subMin > deadlineMin ? subMin - deadlineMin : 0),
        revisionCount: rep.revisionCount || 0,
        approvedAt: rep.approvedAt,
        speedBucket: bucket,
      });
    });

    return {
      totalClasses: classes.length,
      beforeReminder1,
      betweenR1AndR2,
      betweenR2AndDeadline,
      overdue,
      notSubmittedYet,
      classDetails,
    };
  }
}

export const attendanceDeadlineService = new AttendanceDeadlineService();
