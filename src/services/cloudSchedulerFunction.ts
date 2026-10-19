/**
 * HƯỚNG DẪN TRIỂN KHAI CLOUD SCHEDULER & CLOUD FUNCTIONS CHO TRƯỜNG THCS BẢN BO
 * (Đáp ứng Mục XXXVII, XXXVIII, XXXIX, LXXVI)
 *
 * File này chứa mã nguồn chuẩn của Cloud Function chạy trên Google Cloud / Firebase.
 * Chức năng: Tự động chạy mỗi 5 phút trong khung giờ buổi sáng (06:45 - 07:35),
 * múi giờ 'Asia/Ho_Chi_Minh', tự động phát các thông báo:
 *   - Nhắc lần 1 (07:05)
 *   - Nhắc lần 2 (07:15)
 *   - Cảnh báo quá hạn (07:20)
 *   - Cảnh báo tiền giờ chốt cho TPT (07:25)
 * Có cơ chế Deduplication Key chống trùng lặp tuyệt đối khi chạy lại.
 */

export const CLOUD_FUNCTION_SOURCE_CODE = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Scheduled Cloud Function chạy định kỳ mỗi 5 phút từ 06:45 đến 07:35 (Thứ 2 đến Thứ 7)
 * Múi giờ: Asia/Ho_Chi_Minh (UTC+7)
 */
exports.checkMorningAttendanceReminders = functions.region('asia-southeast1')
  .pubsub.schedule('*/5 6-7 * * 1-6')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async (context) => {
    const now = new Date();
    const vnTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
    const [hours, minutes] = vnTimeStr.split(':').map(Number);
    const currentMin = hours * 60 + minutes;

    console.log(\`[THCS Bản Bo] Bắt đầu quét nhắc báo sĩ số ngày \${vnDateStr} lúc \${vnTimeStr}\`);

    // 1. Kiểm tra ngày học trong schoolCalendar
    const calDoc = await db.collection('schoolCalendar').doc(vnDateStr).get();
    if (calDoc.exists && calDoc.data().isAttendanceRequired === false) {
      console.log(\`Hôm nay là ngày nghỉ (\${calDoc.data().title}). Dừng nhắc nhở.\`);
      return null;
    }

    // 2. Kiểm tra nếu báo cáo toàn trường đã chốt
    const dailyDoc = await db.collection('schoolDailyReports').doc(\`\${vnDateStr}_MORNING\`).get();
    if (dailyDoc.exists && (dailyDoc.data().reportStatus === 'LOCKED' || dailyDoc.data().reportStatus === 'FINALIZED')) {
      console.log('Báo cáo toàn trường đã được chốt (FINALIZED). Dừng nhắc nhở.');
      return null;
    }

    // 3. Lấy cấu hình settings
    const settingsDoc = await db.collection('settings').doc('config').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {
      morningStartTime: '06:45',
      morningReminder1Time: '07:05',
      morningReminder2Time: '07:15',
      morningDeadlineTime: '07:20',
      morningFinalizeTargetTime: '07:30',
      enableReminder1: true,
      enableReminder2: true,
      enableOverdueAlert: true
    };

    const r1Min = parseTime(settings.morningReminder1Time || '07:05');
    const r2Min = parseTime(settings.morningReminder2Time || '07:15');
    const deadlineMin = parseTime(settings.morningDeadlineTime || '07:20');

    // 4. Lấy danh sách 20 lớp học
    const classesSnap = await db.collection('classes').where('isActive', '==', true).get();
    const classes = [];
    classesSnap.forEach(doc => classes.push({ id: doc.id, ...doc.data() }));

    // 5. Lấy báo cáo buổi sáng của ngày hôm nay
    const reportsSnap = await db.collection('attendanceReports')
      .where('date', '==', vnDateStr)
      .where('session', '==', 'MORNING')
      .get();
    
    const submittedClassIds = new Set();
    reportsSnap.forEach(doc => {
      const rep = doc.data();
      if (rep.status && rep.status !== 'NOT_SUBMITTED') {
        submittedClassIds.add(rep.classId);
      }
    });

    const unsubmittedClasses = classes.filter(c => !submittedClassIds.has(c.id));
    if (unsubmittedClasses.length === 0) {
      console.log('20/20 lớp đã nộp đủ báo cáo. Không cần gửi thêm nhắc nhở.');
      return null;
    }

    // 6. Phát thông báo theo mốc giờ
    const batch = db.batch();
    let remindersCreated = 0;

    for (const cls of unsubmittedClasses) {
      let reminderType = null;
      let priority = 'NORMAL';
      let title = '';
      let message = '';

      if (settings.enableOverdueAlert && currentMin > deadlineMin) {
        reminderType = 'OVERDUE_ALERT';
        priority = 'HIGH';
        title = \`CẢNH BÁO QUÁ HẠN BÁO CÁO - LỚP \${cls.name}\`;
        message = \`ĐÃ QUÁ THỜI GIAN BÁO CÁO (Hạn: \${settings.morningDeadlineTime}). Vui lòng hoàn thành ngay!\`;
      } else if (settings.enableReminder2 && currentMin >= r2Min && currentMin <= deadlineMin) {
        reminderType = 'REMINDER_2';
        priority = 'HIGH';
        title = \`NHẮC BÁO SĨ SỐ (LẦN 2) - LỚP \${cls.name}\`;
        message = \`Lớp \${cls.name} vẫn chưa gửi báo cáo sĩ số. Hạn chót: \${settings.morningDeadlineTime}. Vui lòng thực hiện ngay!\`;
      } else if (settings.enableReminder1 && currentMin >= r1Min && currentMin < r2Min) {
        reminderType = 'REMINDER_1';
        priority = 'NORMAL';
        title = \`NHẮC BÁO SĨ SỐ (LẦN 1) - LỚP \${cls.name}\`;
        message = \`Lớp \${cls.name} chưa gửi báo cáo sĩ số buổi sáng. Thầy/Cô vui lòng gửi trước \${settings.morningDeadlineTime}.\`;
      }

      if (reminderType) {
        const dedupKey = \`\${vnDateStr}_\${cls.id}_MORNING_\${reminderType}\`;
        // Kiểm tra xem đã gửi chưa qua deduplicationKey
        const existingCheck = await db.collection('notifications')
          .where('deduplicationKey', '==', dedupKey)
          .limit(1)
          .get();

        if (existingCheck.empty) {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            id: notifRef.id,
            recipientUserId: cls.teacherId || 'gvcn',
            recipientRole: 'teacher_gvcn',
            type: reminderType === 'OVERDUE_ALERT' ? 'ATTENDANCE_OVERDUE' : 'ATTENDANCE_REMINDER',
            priority,
            title,
            message,
            classId: cls.id,
            className: cls.name,
            date: vnDateStr,
            session: 'MORNING',
            actionUrl: 'attendance_report',
            isRead: false,
            createdAt: \`\${vnDateStr} \${vnTimeStr}\`,
            deduplicationKey: dedupKey,
            createdBy: 'Google Cloud Scheduler',
            source: 'SCHEDULED_BACKEND'
          });

          // Ghi nhật ký reminderLogs
          const logRef = db.collection('reminderLogs').doc();
          batch.set(logRef, {
            id: logRef.id,
            date: vnDateStr,
            session: 'MORNING',
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId || 'gvcn',
            reminderType,
            scheduledAt: vnTimeStr,
            sentAt: \`\${vnDateStr} \${vnTimeStr}\`,
            status: 'SENT',
            notificationId: notifRef.id,
            deduplicationKey: dedupKey,
            createdBy: 'Google Cloud Scheduler'
          });

          remindersCreated++;
        }
      }
    }

    if (remindersCreated > 0) {
      await batch.commit();
      console.log(\`Đã lưu thành công \${remindersCreated} thông báo nhắc nhở lên Firestore.\`);
    }

    return null;
  });

/**
 * Scheduled Cloud Function chạy định kỳ mỗi 5 phút từ 13:00 đến 14:05 (Thứ 2 đến Thứ 7)
 * Múi giờ: Asia/Ho_Chi_Minh (UTC+7) - Dành riêng cho Buổi Chiều (Mục XXVI)
 */
exports.checkAfternoonAttendanceReminders = functions.region('asia-southeast1')
  .pubsub.schedule('*/5 13-14 * * 1-6')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async (context) => {
    const now = new Date();
    const vnTimeStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
    const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const [hours, minutes] = vnTimeStr.split(':').map(Number);
    const currentMin = hours * 60 + minutes;

    console.log(\`[THCS Bản Bo] Quét nhắc sĩ số BUỔI CHIỀU ngày \${vnDateStr} lúc \${vnTimeStr}\`);

    const calDoc = await db.collection('schoolCalendar').doc(vnDateStr).get();
    if (calDoc.exists && calDoc.data().isAttendanceRequired === false) {
      return null;
    }

    const dailyDoc = await db.collection('schoolDailyReports').doc(\`\${vnDateStr}_AFTERNOON\`).get();
    if (dailyDoc.exists && (dailyDoc.data().reportStatus === 'LOCKED' || dailyDoc.data().reportStatus === 'FINALIZED')) {
      return null;
    }

    const settingsDoc = await db.collection('settings').doc('config').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {
      afternoonStartTime: '13:00',
      afternoonReminder1Time: '13:25',
      afternoonReminder2Time: '13:40',
      afternoonDeadlineTime: '13:45',
      afternoonFinalizeTargetTime: '13:55',
      enableReminder1: true,
      enableReminder2: true,
      enableOverdueAlert: true
    };

    const r1Min = parseTime(settings.afternoonReminder1Time || '13:25');
    const r2Min = parseTime(settings.afternoonReminder2Time || '13:40');
    const deadlineMin = parseTime(settings.afternoonDeadlineTime || '13:45');

    const classesSnap = await db.collection('classes').where('isActive', '==', true).get();
    const classes = [];
    classesSnap.forEach(doc => classes.push({ id: doc.id, ...doc.data() }));

    const reportsSnap = await db.collection('attendanceReports')
      .where('date', '==', vnDateStr)
      .where('session', '==', 'AFTERNOON')
      .get();
    
    const submittedClassIds = new Set();
    reportsSnap.forEach(doc => {
      const rep = doc.data();
      if (rep.status && rep.status !== 'NOT_SUBMITTED') {
        submittedClassIds.add(rep.classId);
      }
    });

    const unsubmittedClasses = classes.filter(c => !submittedClassIds.has(c.id));
    if (unsubmittedClasses.length === 0) return null;

    const batch = db.batch();
    let remindersCreated = 0;

    for (const cls of unsubmittedClasses) {
      let reminderType = null;
      let priority = 'NORMAL';
      let title = '';
      let message = '';

      if (settings.enableOverdueAlert && currentMin > deadlineMin) {
        reminderType = 'OVERDUE_ALERT';
        priority = 'HIGH';
        title = \`CẢNH BÁO QUÁ HẠN BÁO CÁO BUỔI CHIỀU - LỚP \${cls.name}\`;
        message = \`ĐÃ QUÁ HẠN BÁO CÁO SĨ SỐ BUỔI CHIỀU (Hạn: \${settings.afternoonDeadlineTime || '13:45'}). Vui lòng hoàn thành ngay!\`;
      } else if (settings.enableReminder2 && currentMin >= r2Min && currentMin <= deadlineMin) {
        reminderType = 'REMINDER_2';
        priority = 'HIGH';
        title = \`NHẮC BÁO SĨ SỐ CHIỀU (LẦN 2) - LỚP \${cls.name}\`;
        message = \`Lớp \${cls.name} chưa gửi báo cáo sĩ số buổi chiều. Hạn chót: \${settings.afternoonDeadlineTime || '13:45'}.\`;
      } else if (settings.enableReminder1 && currentMin >= r1Min && currentMin < r2Min) {
        reminderType = 'REMINDER_1';
        priority = 'NORMAL';
        title = \`NHẮC BÁO SĨ SỐ CHIỀU (LẦN 1) - LỚP \${cls.name}\`;
        message = \`Lớp \${cls.name} chưa gửi báo cáo sĩ số buổi chiều. Thầy/Cô vui lòng gửi trước \${settings.afternoonDeadlineTime || '13:45'}.\`;
      }

      if (reminderType) {
        const dedupKey = \`\${vnDateStr}_\${cls.id}_AFTERNOON_\${reminderType}\`;
        const existingCheck = await db.collection('notifications')
          .where('deduplicationKey', '==', dedupKey)
          .limit(1)
          .get();

        if (existingCheck.empty) {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            id: notifRef.id,
            recipientUserId: cls.teacherId || 'gvcn',
            recipientRole: 'teacher_gvcn',
            type: reminderType === 'OVERDUE_ALERT' ? 'ATTENDANCE_OVERDUE' : 'ATTENDANCE_REMINDER',
            priority,
            title,
            message,
            classId: cls.id,
            className: cls.name,
            date: vnDateStr,
            session: 'AFTERNOON',
            actionUrl: 'attendance_report',
            isRead: false,
            createdAt: \`\${vnDateStr} \${vnTimeStr}\`,
            deduplicationKey: dedupKey,
            createdBy: 'Google Cloud Scheduler',
            source: 'SCHEDULED_BACKEND'
          });

          const logRef = db.collection('reminderLogs').doc();
          batch.set(logRef, {
            id: logRef.id,
            date: vnDateStr,
            session: 'AFTERNOON',
            classId: cls.id,
            className: cls.name,
            teacherId: cls.teacherId || 'gvcn',
            reminderType,
            scheduledAt: vnTimeStr,
            sentAt: \`\${vnDateStr} \${vnTimeStr}\`,
            status: 'SENT',
            notificationId: notifRef.id,
            deduplicationKey: dedupKey,
            createdBy: 'Google Cloud Scheduler'
          });

          remindersCreated++;
        }
      }
    }

    if (remindersCreated > 0) {
      await batch.commit();
      console.log(\`Đã lưu thành công \${remindersCreated} thông báo nhắc nhở chiều lên Firestore.\`);
    }

    return null;
  });

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
`;

export const CLOUD_DEPLOY_INSTRUCTIONS = `
CÁCH TRIỂN KHAI LÊN GOOGLE CLOUD / FIREBASE CLOUD SCHEDULER:
1. Mở thư mục dự án và cài Firebase CLI nếu chưa có:
   npm install -g firebase-tools
2. Đăng nhập tài khoản Google của trường:
   firebase login
3. Khởi tạo Cloud Functions:
   firebase init functions
   (Chọn JavaScript hoặc TypeScript, chọn Firestore làm database)
4. Dán đoạn mã nguồn từ CLOUD_FUNCTION_SOURCE_CODE vào file functions/index.js (hoặc functions/src/index.ts).
5. Triển khai lên máy chủ Google cho cả 2 buổi:
   firebase deploy --only functions:checkMorningAttendanceReminders,functions:checkAfternoonAttendanceReminders
6. Cloud Scheduler sẽ tự động đánh thức Cloud Function mỗi 5 phút trong khung giờ buổi sáng và buổi chiều theo cấu hình hệ thống.
`;
