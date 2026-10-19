import { SessionType, SchoolSettings } from '../types';
import { storageService } from './storageService';
import { schoolCalendarService } from './schoolCalendarService';
import { notificationService } from './notificationService';
import { reminderService } from './reminderService';
import { attendanceDeadlineService } from './attendanceDeadlineService';
import {
  getVietnamTimeString,
  getVietnamDateString,
  parseTimeStringToMinutes,
  getVietnamFullTimestamp,
} from '../utils/vietnamTime';

export interface ScheduledRunResult {
  executedAt: string;
  date: string;
  session: SessionType;
  currentTime: string;
  isSchoolDay: boolean;
  schoolDayReason: string;
  isFinalized: boolean;
  isAllApproved: boolean;
  remindersSentCount: number;
  overdueAlertsSentCount: number;
  logsCreated: string[];
  skippedReason?: string;
}

class ScheduledAttendanceService {
  /**
   * Kiểm tra và thực thi các nghiệp vụ nhắc báo sĩ số buổi sáng (Idempotent - Mục XXXVII, XXXVIII, XXXIX, LXXVI)
   * Có thể nhận date/currentTime giả lập để phục vụ kiểm thử nhanh mọi tình huống (Test 1 - Test 14).
   */
  public checkMorningAttendanceReminders(options?: {
    date?: string;
    session?: SessionType;
    simulatedCurrentTime?: string;
    forceRun?: boolean;
  }): ScheduledRunResult {
    const session: SessionType = options?.session || 'MORNING';
    const date = options?.date || getVietnamDateString();
    const currentTime = options?.simulatedCurrentTime || getVietnamTimeString();
    const currentMin = parseTimeStringToMinutes(currentTime);

    const settings = storageService.getSettings();

    // 1. Kiểm tra hôm nay có phải ngày học cần điểm danh không (Mục IV, LXXI, Test 8, Test 9)
    const calendarCheck = schoolCalendarService.isAttendanceRequiredForDate(date, settings);
    if (!calendarCheck.required && !options?.forceRun) {
      return {
        executedAt: getVietnamFullTimestamp(),
        date,
        session,
        currentTime,
        isSchoolDay: false,
        schoolDayReason: calendarCheck.reason,
        isFinalized: false,
        isAllApproved: false,
        remindersSentCount: 0,
        overdueAlertsSentCount: 0,
        logsCreated: [],
        skippedReason: `Hôm nay không phải ngày học: ${calendarCheck.reason}. Không gửi nhắc nhở.`,
      };
    }

    // 2. Kiểm tra nếu báo cáo toàn trường ngày hôm nay đã chốt (Mục LXVI, Test 11)
    const dailyReport = storageService.getDailyOfficialReport(date, session);
    const isFinalized = dailyReport?.reportStatus === 'LOCKED' || dailyReport?.reportStatus === 'OFFICIAL';
    if (isFinalized) {
      return {
        executedAt: getVietnamFullTimestamp(),
        date,
        session,
        currentTime,
        isSchoolDay: true,
        schoolDayReason: calendarCheck.reason,
        isFinalized: true,
        isAllApproved: true,
        remindersSentCount: 0,
        overdueAlertsSentCount: 0,
        logsCreated: [],
        skippedReason: 'Báo cáo sĩ số toàn trường đã được chốt (FINALIZED). Dừng toàn bộ nhắc nhở.',
      };
    }

    // 3. Lấy 20 lớp và báo cáo hiện tại
    const classes = storageService.getClasses().filter((c) => c.isActive);
    const reports = storageService.getReportsByDate(date, session);
    const reportMap = new Map<string, any>();
    reports.forEach((r) => reportMap.set(r.classId, r));

    // 4. Kiểm tra xem 20/20 lớp đã được duyệt hết chưa (Mục LXV, Test 10)
    const allApproved = classes.every((c) => {
      const rep = reportMap.get(c.id);
      return rep && (rep.status === 'APPROVED' || rep.status === 'LOCKED');
    });

    if (allApproved) {
      return {
        executedAt: getVietnamFullTimestamp(),
        date,
        session,
        currentTime,
        isSchoolDay: true,
        schoolDayReason: calendarCheck.reason,
        isFinalized: false,
        isAllApproved: true,
        remindersSentCount: 0,
        overdueAlertsSentCount: 0,
        logsCreated: [],
        skippedReason: 'Tất cả 20/20 lớp đã gửi và được duyệt hoàn tất. Không gửi thêm nhắc nhở.',
      };
    }

    // Các mốc thời gian cấu hình
    const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
    const sessionLabel = isAfternoon ? 'buổi chiều' : 'buổi sáng';
    const startTime = isAfternoon ? (settings.afternoonStartTime || '13:00') : (settings.morningStartTime || '06:45');
    const reminder1Time = isAfternoon ? (settings.afternoonReminder1Time || '13:25') : (settings.morningReminder1Time || '07:05');
    const reminder2Time = isAfternoon ? (settings.afternoonReminder2Time || '13:40') : (settings.morningReminder2Time || '07:15');
    const deadlineTime = isAfternoon ? (settings.afternoonDeadlineTime || '13:45') : (settings.morningDeadlineTime || '07:20');
    const finalizeTargetTime = isAfternoon ? (settings.afternoonFinalizeTargetTime || '13:55') : (settings.morningFinalizeTargetTime || '07:30');

    const startMin = parseTimeStringToMinutes(startTime);
    const r1Min = parseTimeStringToMinutes(reminder1Time);
    const r2Min = parseTimeStringToMinutes(reminder2Time);
    const deadlineMin = parseTimeStringToMinutes(deadlineTime);
    const finalizeMin = parseTimeStringToMinutes(finalizeTargetTime);

    // Test 1: Nếu chưa đến giờ nhắc lần 1, không gửi nhắc sớm
    if (currentMin < r1Min && !options?.forceRun) {
      return {
        executedAt: getVietnamFullTimestamp(),
        date,
        session,
        currentTime,
        isSchoolDay: true,
        schoolDayReason: calendarCheck.reason,
        isFinalized: false,
        isAllApproved: false,
        remindersSentCount: 0,
        overdueAlertsSentCount: 0,
        logsCreated: [],
        skippedReason: `Hiện tại (${currentTime}) chưa đến giờ nhắc lần 1 ${sessionLabel} (${reminder1Time}).`,
      };
    }

    const allUsers = storageService.getUsers();
    let remindersSentCount = 0;
    let overdueAlertsSentCount = 0;
    const logsCreated: string[] = [];

    // Duyệt từng lớp để kiểm tra điều kiện phát thông báo
    classes.forEach((cls) => {
      const rep = reportMap.get(cls.id);
      const repStatus = rep?.status || 'NOT_SUBMITTED';

      // Tìm GVCN của lớp
      const teacherUser = allUsers.find(
        (u) => u.assignedClassId === cls.id || (u.assignedClassName && u.assignedClassName === cls.name)
      );
      const recipientUserId = teacherUser?.id || cls.teacherId || 'gvcn';
      const teacherName = teacherUser?.name || cls.teacherName || 'GVCN';

      // A. KIỂM TRA NHẮC LẦN 1 (Mục VIII, Test 2):
      // Điều kiện: enableReminder1 == true, currentMin >= r1Min, lớp NOT_SUBMITTED
      if (
        (settings.enableReminder1 ?? true) &&
        currentMin >= r1Min &&
        currentMin < r2Min &&
        repStatus === 'NOT_SUBMITTED'
      ) {
        const dedupKey = `${date}_${cls.id}_${session}_REMINDER_1`;
        if (!reminderService.hasReminderBeenSent(dedupKey)) {
          const notif = notificationService.createNotification({
            recipientUserId,
            recipientRole: 'teacher_gvcn',
            type: 'ATTENDANCE_REMINDER',
            priority: 'NORMAL',
            title: `NHẮC BÁO SĨ SỐ (LẦN 1) - LỚP ${cls.name}`,
            message: `Lớp ${cls.name} chưa gửi báo cáo sĩ số ${sessionLabel}. Thầy/Cô vui lòng hoàn thành trước ${deadlineTime}.`,
            classId: cls.id,
            className: cls.name,
            date,
            session,
            actionUrl: 'attendance_report',
            deduplicationKey: dedupKey,
            createdBy: 'Hệ thống tự động',
            source: 'SCHEDULED_BACKEND',
            metadata: {
              deadlineTime,
              reminderLevel: 1,
              teacherName,
            },
          });

          if (notif) {
            reminderService.recordReminderLog({
              date,
              session,
              classId: cls.id,
              className: cls.name,
              teacherId: recipientUserId,
              teacherName,
              reminderType: 'REMINDER_1',
              scheduledAt: reminder1Time,
              status: 'SENT',
              notificationId: notif.id,
              deduplicationKey: dedupKey,
              createdBy: 'Hệ thống tự động',
              deliveryChannel: 'IN_APP',
              messageSummary: `Nhắc lần 1 (${sessionLabel}) gửi tới GVCN Lớp ${cls.name}`,
            });
            remindersSentCount++;
            logsCreated.push(`Đã gửi Nhắc lần 1 (${sessionLabel}) tới Lớp ${cls.name}`);
          }
        }
      }

      // B. KIỂM TRA NHẮC LẦN 2 (Mục IX, Test 3):
      // Điều kiện: enableReminder2 == true, currentMin >= r2Min && currentMin <= deadlineMin, lớp vẫn NOT_SUBMITTED
      if (
        (settings.enableReminder2 ?? true) &&
        currentMin >= r2Min &&
        currentMin <= deadlineMin &&
        repStatus === 'NOT_SUBMITTED'
      ) {
        const dedupKey = `${date}_${cls.id}_${session}_REMINDER_2`;
        if (!reminderService.hasReminderBeenSent(dedupKey)) {
          const notif = notificationService.createNotification({
            recipientUserId,
            recipientRole: 'teacher_gvcn',
            type: 'ATTENDANCE_REMINDER',
            priority: 'HIGH',
            title: `NHẮC BÁO SĨ SỐ (LẦN 2) - LỚP ${cls.name}`,
            message: `Lớp ${cls.name} vẫn chưa gửi báo cáo sĩ số ${sessionLabel}. Hạn chót báo cáo là ${deadlineTime}. Vui lòng thực hiện ngay!`,
            classId: cls.id,
            className: cls.name,
            date,
            session,
            actionUrl: 'attendance_report',
            deduplicationKey: dedupKey,
            createdBy: 'Hệ thống tự động',
            source: 'SCHEDULED_BACKEND',
            metadata: {
              deadlineTime,
              reminderLevel: 2,
              teacherName,
            },
          });

          if (notif) {
            reminderService.recordReminderLog({
              date,
              session,
              classId: cls.id,
              className: cls.name,
              teacherId: recipientUserId,
              teacherName,
              reminderType: 'REMINDER_2',
              scheduledAt: reminder2Time,
              status: 'SENT',
              notificationId: notif.id,
              deduplicationKey: dedupKey,
              createdBy: 'Hệ thống tự động',
              deliveryChannel: 'IN_APP',
              messageSummary: `Nhắc lần 2 (Ưu tiên cao) gửi tới GVCN Lớp ${cls.name}`,
            });
            remindersSentCount++;
            logsCreated.push(`Đã gửi Nhắc lần 2 tới Lớp ${cls.name}`);
          }
        }
      }

      // C. KIỂM TRA CẢNH BÁO QUÁ HẠN (Mục X, XI, Test 4):
      // Điều kiện: enableOverdueAlert == true, currentMin > deadlineMin, lớp vẫn NOT_SUBMITTED
      // TUYỆT ĐỐI KHÔNG TỰ TẠO BÁO CÁO KHI QUÁ HẠN (Mục XI)
      if (
        (settings.enableOverdueAlert ?? true) &&
        currentMin > deadlineMin &&
        repStatus === 'NOT_SUBMITTED'
      ) {
        const dedupKey = `${date}_${cls.id}_${session}_OVERDUE_ALERT`;
        if (!reminderService.hasReminderBeenSent(dedupKey)) {
          const lateMins = currentMin - deadlineMin;
          const notif = notificationService.createNotification({
            recipientUserId,
            recipientRole: 'teacher_gvcn',
            type: 'ATTENDANCE_OVERDUE',
            priority: 'HIGH',
            title: `CẢNH BÁO QUÁ HẠN BÁO CÁO - LỚP ${cls.name}`,
            message: `ĐÃ QUÁ THỜI GIAN BÁO CÁO ${sessionLabel.toUpperCase()} (Hạn: ${deadlineTime}). Lớp ${cls.name} đã quá hạn ${lateMins} phút. Vui lòng hoàn thành báo cáo ngay.`,
            classId: cls.id,
            className: cls.name,
            date,
            session,
            actionUrl: 'attendance_report',
            deduplicationKey: dedupKey,
            createdBy: 'Hệ thống tự động',
            source: 'SCHEDULED_BACKEND',
            metadata: {
              deadlineTime,
              lateByMinutes: lateMins,
              teacherName,
            },
          });

          if (notif) {
            reminderService.recordReminderLog({
              date,
              session,
              classId: cls.id,
              className: cls.name,
              teacherId: recipientUserId,
              teacherName,
              reminderType: 'OVERDUE_ALERT',
              scheduledAt: deadlineTime,
              status: 'SENT',
              notificationId: notif.id,
              deduplicationKey: dedupKey,
              createdBy: 'Hệ thống tự động',
              deliveryChannel: 'IN_APP',
              messageSummary: `Cảnh báo quá hạn gửi tới GVCN Lớp ${cls.name}`,
            });
            overdueAlertsSentCount++;
            logsCreated.push(`Đã ghi nhận Quá hạn đối với Lớp ${cls.name}`);
          }
        }
      }

      // D. KIỂM TRA QUÁ HẠN CHỈNH SỬA (Mục XXXII, XXXIII):
      // Nếu lớp ở trạng thái REVISION_REQUIRED mà đã qua thời gian chỉnh sửa (revisionDeadlineMinutes)
      if (repStatus === 'REVISION_REQUIRED' && rep?.revisionRequestedAt && settings.revisionDeadlineMinutes) {
        const reqMin = rep.revisionRequestedAt.includes(' ')
          ? parseTimeStringToMinutes(rep.revisionRequestedAt.split(' ')[1])
          : parseTimeStringToMinutes(rep.revisionRequestedAt);
        const revLimitMin = reqMin + settings.revisionDeadlineMinutes;

        if (currentMin > revLimitMin) {
          const revDedupKey = `${date}_${cls.id}_${session}_REV_OVERDUE_${rep.revisionCount || 1}`;
          if (!reminderService.hasReminderBeenSent(revDedupKey)) {
            const notif = notificationService.createNotification({
              recipientUserId,
              recipientRole: 'teacher_gvcn',
              type: 'ATTENDANCE_OVERDUE',
              priority: 'URGENT',
              title: `QUÁ HẠN GỬI LẠI BÁO CÁO - LỚP ${cls.name}`,
              message: `Báo cáo Lớp ${cls.name} được yêu cầu chỉnh sửa lúc ${rep.revisionRequestedAt} đã quá hạn gửi lại (${settings.revisionDeadlineMinutes} phút). Vui lòng gửi lại ngay.`,
              classId: cls.id,
              className: cls.name,
              date,
              session,
              actionUrl: 'attendance_report',
              deduplicationKey: revDedupKey,
              createdBy: 'Hệ thống tự động',
              source: 'SCHEDULED_BACKEND',
              metadata: {
                revisionReason: rep.revisionReason,
                teacherName,
              },
            });

            if (notif) {
              reminderService.recordReminderLog({
                date,
                session,
                classId: cls.id,
                className: cls.name,
                teacherId: recipientUserId,
                teacherName,
                reminderType: 'REVISION_REMINDER',
                scheduledAt: currentTime,
                status: 'SENT',
                notificationId: notif.id,
                deduplicationKey: revDedupKey,
                createdBy: 'Hệ thống tự động',
                deliveryChannel: 'IN_APP',
                messageSummary: `Cảnh báo quá hạn chỉnh sửa Lớp ${cls.name}`,
              });
              remindersSentCount++;
            }
          }
        }
      }
    });

    // E. CẢNH BÁO TRƯỚC GIỜ CHỐT CHO ADMIN (Mục XXX):
    // 10 phút trước giờ finalizeTargetTime, nếu còn lớp chưa xong và setting bật
    const preFinalizeWindowMin = finalizeMin - 10;
    if (
      (settings.notifyAdminBeforeFinalize ?? true) &&
      currentMin >= preFinalizeWindowMin &&
      currentMin < finalizeMin
    ) {
      const uncompletedClasses = classes.filter((c) => {
        const rep = reportMap.get(c.id);
        return !rep || rep.status !== 'APPROVED';
      });

      if (uncompletedClasses.length > 0) {
        const adminDedupKey = `${date}_${session}_PRE_FINALIZE_ALERT`;
        if (!reminderService.hasReminderBeenSent(adminDedupKey)) {
          const uncompletedNames = uncompletedClasses.map((c) => c.name).join(', ');
          const notif = notificationService.createNotification({
            recipientUserId: 'ADMIN_ALL',
            recipientRole: 'admin_tpt',
            type: 'SYSTEM_NOTICE',
            priority: 'HIGH',
            title: `CÒN ${uncompletedClasses.length} LỚP CHƯA HOÀN THÀNH TRƯỚC GIỜ CHỐT`,
            message: `Còn 10 phút đến giờ chốt dự kiến (${finalizeTargetTime}). Các lớp chưa hoàn tất: ${uncompletedNames}.`,
            date,
            session,
            actionUrl: 'dashboard',
            deduplicationKey: adminDedupKey,
            createdBy: 'Hệ thống tự động',
            source: 'SCHEDULED_BACKEND',
            metadata: {
              uncompletedCount: uncompletedClasses.length,
              classes: uncompletedNames,
            },
          });

          if (notif) {
            reminderService.recordReminderLog({
              date,
              session,
              classId: 'ALL_UNCOMPLETED',
              className: 'Toàn trường',
              teacherId: 'ADMIN_ALL',
              teacherName: 'Tổng Phụ trách',
              reminderType: 'PRE_FINALIZE_ALERT',
              scheduledAt: currentTime,
              status: 'SENT',
              notificationId: notif.id,
              deduplicationKey: adminDedupKey,
              createdBy: 'Hệ thống tự động',
              deliveryChannel: 'IN_APP',
              messageSummary: `Cảnh báo trước giờ chốt: còn ${uncompletedClasses.length} lớp`,
            });
            logsCreated.push(`Đã gửi cảnh báo tiền giờ chốt tới TPT: còn ${uncompletedClasses.length} lớp`);
          }
        }
      }
    }

    return {
      executedAt: getVietnamFullTimestamp(),
      date,
      session,
      currentTime,
      isSchoolDay: true,
      schoolDayReason: calendarCheck.reason,
      isFinalized: false,
      isAllApproved: false,
      remindersSentCount,
      overdueAlertsSentCount,
      logsCreated,
    };
  }

  /**
   * Kiểm tra và thực thi các nghiệp vụ nhắc báo sĩ số buổi chiều (Mục XXVI, XXXVII)
   */
  public checkAfternoonAttendanceReminders(options?: {
    date?: string;
    simulatedCurrentTime?: string;
    forceRun?: boolean;
  }): ScheduledRunResult {
    return this.checkMorningAttendanceReminders({
      ...options,
      session: 'AFTERNOON',
    });
  }
}

export const scheduledAttendanceService = new ScheduledAttendanceService();
