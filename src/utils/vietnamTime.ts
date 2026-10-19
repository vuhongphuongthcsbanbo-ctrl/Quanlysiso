/**
 * Tiện ích thời gian chuẩn Việt Nam (Múi giờ Asia/Ho_Chi_Minh - UTC+7)
 * Đảm bảo mọi tính toán giờ báo cáo, nhắc nhở, quá hạn và chốt sổ
 * không bị ảnh hưởng bởi múi giờ của máy khách (client phone/PC).
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Lấy đối tượng Date hiện tại theo múi giờ Việt Nam
 */
export function getVietnamNow(): Date {
  const now = new Date();
  // Chuyển đổi sang chuỗi thời gian tại múi giờ Việt Nam rồi parse lại
  const vnDateStr = now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE });
  return new Date(vnDateStr);
}

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo giờ Việt Nam
 */
export function getVietnamDateString(date?: Date): string {
  const d = date || getVietnamNow();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Trả về chuỗi giờ phút HH:mm theo giờ Việt Nam
 */
export function getVietnamTimeString(date?: Date): string {
  const d = date || getVietnamNow();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Trả về chuỗi thời gian đầy đủ YYYY-MM-DD HH:mm:ss theo giờ Việt Nam
 */
export function getVietnamFullTimestamp(date?: Date): string {
  const d = date || getVietnamNow();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Chuyển chuỗi 'HH:mm' thành số phút tính từ 00:00
 */
export function parseTimeStringToMinutes(timeStr?: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Chuyển số phút thành định dạng 'HH:mm'
 */
export function formatMinutesToTimeString(minutes: number): string {
  const clamped = Math.max(0, minutes % (24 * 60));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * So sánh 2 mốc giờ 'HH:mm'
 * Trả về:
 * < 0 nếu timeA < timeB
 * 0 nếu timeA == timeB
 * > 0 nếu timeA > timeB
 */
export function compareTimeStrings(timeA?: string, timeB?: string): number {
  const minA = parseTimeStringToMinutes(timeA);
  const minB = parseTimeStringToMinutes(timeB);
  return minA - minB;
}

/**
 * Tính số phút quá hạn (nếu currentTime > deadlineTime)
 * Nếu nộp trước hoặc đúng hạn, trả về 0.
 */
export function calculateLateMinutes(deadlineTime: string, submittedTimeOrCurrentTime?: string): number {
  const deadlineMin = parseTimeStringToMinutes(deadlineTime);
  const targetMin = submittedTimeOrCurrentTime
    ? (submittedTimeOrCurrentTime.includes(' ')
        ? parseTimeStringToMinutes(submittedTimeOrCurrentTime.split(' ')[1])
        : parseTimeStringToMinutes(submittedTimeOrCurrentTime))
    : parseTimeStringToMinutes(getVietnamTimeString());
  
  if (targetMin > deadlineMin) {
    return targetMin - deadlineMin;
  }
  return 0;
}

/**
 * Tính số phút còn lại trước một mốc giờ
 * Nếu đã qua mốc giờ, trả về 0.
 */
export function calculateRemainingMinutes(targetTime: string, currentTime?: string): number {
  const targetMin = parseTimeStringToMinutes(targetTime);
  const currentMin = currentTime
    ? parseTimeStringToMinutes(currentTime)
    : parseTimeStringToMinutes(getVietnamTimeString());
  
  if (targetMin > currentMin) {
    return targetMin - currentMin;
  }
  return 0;
}
