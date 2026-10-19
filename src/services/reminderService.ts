import { ReminderLog, ReminderType, SessionType, SchoolClass, AttendanceReport } from '../types';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import { getVietnamFullTimestamp, getVietnamTimeString } from '../utils/vietnamTime';

const REMINDER_LOGS_STORAGE_KEY = 'thcs_banbo_v2_reminder_logs';

class ReminderService {
  public getReminderLogs(date?: string): ReminderLog[] {
    try {
      const raw = localStorage.getItem(REMINDER_LOGS_STORAGE_KEY);
      if (!raw) return [];
      const list: ReminderLog[] = JSON.parse(raw);
      if (date) {
        return list.filter((l) => l.date === date);
      }
      return list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } catch {
      return [];
    }
  }

  public hasReminderBeenSent(deduplicationKey: string): boolean {
    const logs = this.getReminderLogs();
    return logs.some((l) => l.deduplicationKey === deduplicationKey && l.status === 'SENT');
  }

  public recordReminderLog(
    logData: Omit<ReminderLog, 'id' | 'sentAt'>
  ): ReminderLog {
    const logs = this.getReminderLogs();
    const newLog: ReminderLog = {
      ...logData,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sentAt: getVietnamFullTimestamp(),
    };
    logs.unshift(newLog);
    // Lưu tối đa 1000 bản ghi
    localStorage.setItem(REMINDER_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 1000)));
    return newLog;
  }

  /**
   * Tổng phụ trách gửi nhắc nhở thủ công cho 1 lớp (Mục XVI)
   */
  public sendManualReminder(
    classId: string,
    date: string,
    session: SessionType = 'MORNING',
    customMessage?: string,
    senderName: string = 'Tổng Phụ trách'
  ): { success: boolean; message: string; notificationId?: string } {
    const cls = storageService.getClassById(classId);
    if (!cls) {
      return { success: false, message: 'Không tìm thấy lớp học' };
    }

    // Kiểm tra realtime: nếu lớp đã gửi báo cáo thì từ chối gửi nhắc (Mục XXXV)
    const currentReport = storageService.getReportByDateAndClass(date, classId, session);
    if (currentReport && currentReport.status !== 'NOT_SUBMITTED') {
      return {
        success: false,
        message: `Lớp ${cls.name} vừa mới gửi báo cáo sĩ số (${currentReport.status}). Đã tự động hủy gửi nhắc nhở!`,
      };
    }

    // Tìm tài khoản giáo viên chủ nhiệm
    const users = storageService.getUsers();
    const teacherUser = users.find(
      (u) => u.assignedClassId === classId || (u.assignedClassName && u.assignedClassName === cls.name)
    );

    const recipientUserId = teacherUser?.id || cls.teacherId || 'gvcn';
    const settings = storageService.getSettings();
    const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
    const deadlineStr = isAfternoon ? (settings.afternoonDeadlineTime || '13:45') : (settings.morningDeadlineTime || '07:20');
    const sessionStr = isAfternoon ? 'buổi chiều' : 'buổi sáng';

    const defaultMsg = `Vui lòng hoàn thành báo cáo sĩ số Lớp ${cls.name} ${sessionStr} hôm nay trước ${deadlineStr}.`;
    const messageText = customMessage && customMessage.trim() ? customMessage.trim() : defaultMsg;

    const deduplicationKey = `${date}_${classId}_${session}_MANUAL_${Date.now()}`;

    const notif = notificationService.createNotification({
      recipientUserId,
      recipientRole: 'teacher_gvcn',
      type: 'ATTENDANCE_REMINDER',
      priority: 'HIGH',
      title: `NHẮC BÁO SĨ SỐ LỚP ${cls.name}`,
      message: messageText,
      classId: cls.id,
      className: cls.name,
      date,
      session,
      actionUrl: 'attendance_report',
      deduplicationKey,
      createdBy: senderName,
      source: 'ADMIN_MANUAL',
      metadata: {
        deadlineTime: deadlineStr,
        teacherName: teacherUser?.name || cls.teacherName || 'GVCN',
      },
    });

    if (notif) {
      this.recordReminderLog({
        date,
        session,
        classId: cls.id,
        className: cls.name,
        teacherId: recipientUserId,
        teacherName: teacherUser?.name || cls.teacherName || 'GVCN',
        reminderType: 'MANUAL_REMINDER',
        scheduledAt: getVietnamTimeString(),
        status: 'SENT',
        notificationId: notif.id,
        deduplicationKey,
        createdBy: senderName,
        deliveryChannel: 'IN_APP',
        messageSummary: messageText,
      });

      storageService.addAuditLog(
        senderName,
        `Gửi thông báo nhắc báo sĩ số tới GVCN Lớp ${cls.name}: "${messageText}"`,
        'attendance',
        'GỬI NHẮC THỦ CÔNG'
      );

      return { success: true, message: `Đã gửi nhắc tới GVCN Lớp ${cls.name}`, notificationId: notif.id };
    }

    return { success: false, message: 'Không thể tạo thông báo' };
  }

  /**
   * Tổng phụ trách gửi nhắc hàng loạt các lớp chưa báo cáo (Mục XXXIV, XXXV)
   * Có revalidation kiểm tra realtime trước khi gửi!
   */
  public sendBulkManualReminder(
    classIds: string[],
    date: string,
    session: SessionType = 'MORNING',
    customMessage?: string,
    senderName: string = 'Tổng Phụ trách'
  ): {
    totalRequested: number;
    sentCount: number;
    skippedCount: number;
    skippedClasses: string[];
    sentClasses: string[];
  } {
    const skippedClasses: string[] = [];
    const sentClasses: string[] = [];

    classIds.forEach((cId) => {
      // Re-validate realtime
      const report = storageService.getReportByDateAndClass(date, cId, session);
      const cls = storageService.getClassById(cId);
      const className = cls?.name || cId;

      if (report && report.status !== 'NOT_SUBMITTED') {
        skippedClasses.push(className);
        return;
      }

      const res = this.sendManualReminder(cId, date, session, customMessage, senderName);
      if (res.success) {
        sentClasses.push(className);
      } else {
        skippedClasses.push(className);
      }
    });

    return {
      totalRequested: classIds.length,
      sentCount: sentClasses.length,
      skippedCount: skippedClasses.length,
      skippedClasses,
      sentClasses,
    };
  }
}

export const reminderService = new ReminderService();
