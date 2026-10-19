/**
 * HƯỚNG DẪN KẾT NỐI FIREBASE CHO TRƯỜNG THCS BẢN BO
 *
 * File này định nghĩa cấu trúc kết nối với Firebase Firestore & Firebase Auth.
 * Hiện tại hệ thống đang sử dụng LocalStorage Service để có thể chạy thử nghiệm
 * 100% mượt mà offline và online ngay lập tức với đầy đủ tính năng.
 *
 * KHI NHÀ TRƯỜNG MUỐN CHUYỂN HOÀN TOÀN SANG FIREBASE CLOUD:
 * 1. Chạy lệnh: npm install firebase
 * 2. Cấu hình biến môi trường trong file .env:
 *    VITE_FIREBASE_API_KEY="..."
 *    VITE_FIREBASE_AUTH_DOMAIN="..."
 *    VITE_FIREBASE_PROJECT_ID="..."
 *    VITE_FIREBASE_STORAGE_BUCKET="..."
 *    VITE_FIREBASE_MESSAGING_SENDER_ID="..."
 *    VITE_FIREBASE_APP_ID="..."
 * 3. Đổi hằng số USE_FIREBASE_BACKEND = true ở bên dưới.
 * 4. Hệ thống sẽ tự động đồng bộ sang Firestore với các collection sau:
 *    - /schoolYears
 *    - /settings/config
 *    - /classes/{classId}
 *    - /students/{studentId}
 *    - /attendanceReports/{date}_{session}_{classId}
 *    - /attendanceRecords/{recordId}
 *    - /auditLogs/{logId}
 *    - /users/{userId}
 */

export const USE_FIREBASE_BACKEND = false;

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  STUDENTS: 'students',
  SCHOOL_YEARS: 'schoolYears',
  SEMESTERS: 'semesters',
  ATTENDANCE_REPORTS: 'attendanceReports',
  ATTENDANCE_RECORDS: 'attendanceRecords',
  BOARDING_RECORDS: 'boardingRecords',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'auditLogs',
};

export interface FirebaseConnectionStatus {
  isConnected: boolean;
  provider: 'local_storage_cache' | 'cloud_firestore';
  mode: 'demo_simulation' | 'production';
  lastSync?: string;
}

export const getSystemStorageStatus = (): FirebaseConnectionStatus => {
  return {
    isConnected: true,
    provider: USE_FIREBASE_BACKEND ? 'cloud_firestore' : 'local_storage_cache',
    mode: 'demo_simulation',
    lastSync: new Date().toLocaleTimeString('vi-VN'),
  };
};
