import { DayType, SchoolCalendarDay, SchoolSettings } from '../types';
import { STORAGE_KEYS } from './storageService';
import { DEFAULT_SETTINGS } from '../config/constants';

const INITIAL_CALENDAR_DAYS: SchoolCalendarDay[] = [
  {
    date: '2026-09-02',
    dayType: 'HOLIDAY',
    title: 'Nghỉ Quốc khánh 2/9',
    isAttendanceRequired: false,
    note: 'Nghỉ lễ theo quy định nhà nước',
  },
  {
    date: '2026-09-05',
    dayType: 'SPECIAL_SCHOOL_DAY',
    title: 'Khai giảng năm học mới',
    isAttendanceRequired: true,
    note: 'Điểm danh toàn trường dịp khai giảng',
  },
  {
    date: '2026-11-20',
    dayType: 'SPECIAL_SCHOOL_DAY',
    title: 'Kỷ niệm Ngày Nhà giáo Việt Nam',
    isAttendanceRequired: true,
    note: 'Lễ mít tinh và sinh hoạt truyền thống',
  },
  {
    date: '2027-01-01',
    dayType: 'HOLIDAY',
    title: 'Tết Dương lịch',
    isAttendanceRequired: false,
    note: 'Nghỉ Tết Dương lịch',
  },
];

class SchoolCalendarService {
  private getStorageKey(): string {
    return (STORAGE_KEYS as any).SCHOOL_CALENDAR || 'thcs_banbo_v2_school_calendar';
  }

  public getCalendarDays(): SchoolCalendarDay[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(this.getStorageKey(), JSON.stringify(INITIAL_CALENDAR_DAYS));
      return INITIAL_CALENDAR_DAYS;
    } catch {
      return INITIAL_CALENDAR_DAYS;
    }
  }

  public getCalendarDay(date: string): SchoolCalendarDay | null {
    const list = this.getCalendarDays();
    return list.find(d => d.date === date) || null;
  }

  public saveCalendarDay(day: SchoolCalendarDay): boolean {
    try {
      const list = this.getCalendarDays();
      const idx = list.findIndex(d => d.date === day.date);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...day, updatedAt: new Date().toISOString() };
      } else {
        list.push({ ...day, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('thcs_banbo_calendar_updated', { detail: day }));
      return true;
    } catch {
      return false;
    }
  }

  public deleteCalendarDay(date: string): boolean {
    try {
      const list = this.getCalendarDays().filter(d => d.date !== date);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('thcs_banbo_calendar_updated', { detail: { date, deleted: true } }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logic trung tâm xác định ngày này có phải ngày học cần báo sĩ số hay không (Mục IV, LXXIII)
   * Thứ tự ưu tiên:
   * 1. Cấu hình ghi đè trong schoolCalendar (Ngày nghỉ đột xuất, Nghỉ lễ, Học bù...)
   * 2. Lịch học trong tuần theo thứ (Thứ 2 - Thứ 6; Thứ 7 nếu bật)
   * 3. Mặc định Chủ nhật không học.
   */
  public isAttendanceRequiredForDate(
    dateStr: string,
    settings?: SchoolSettings
  ): {
    required: boolean;
    reason: string;
    dayType: DayType;
    title?: string;
  } {
    // 1. Kiểm tra override trong schoolCalendar
    const override = this.getCalendarDay(dateStr);
    if (override) {
      if (!override.isAttendanceRequired) {
        return {
          required: false,
          reason: override.title || 'Ngày nghỉ đã được cấu hình trong lịch trường',
          dayType: override.dayType,
          title: override.title,
        };
      }
      return {
        required: true,
        reason: override.title || 'Ngày học đặc biệt / học bù',
        dayType: override.dayType,
        title: override.title,
      };
    }

    // 2. Kiểm tra theo ngày trong tuần (0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7)
    let dayOfWeek = 1;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      dayOfWeek = d.getDay();
    } catch {
      dayOfWeek = 1;
    }

    // Chủ nhật luôn nghỉ nếu không có override
    if (dayOfWeek === 0) {
      return {
        required: false,
        reason: 'Chủ Nhật (Ngày nghỉ cuối tuần)',
        dayType: 'NO_SCHOOL_DAY',
        title: 'Chủ Nhật',
      };
    }

    // Thứ Bảy
    if (dayOfWeek === 6) {
      const enableSat = settings?.enableSaturday || false;
      if (enableSat) {
        return {
          required: true,
          reason: 'Thứ Bảy (Lịch học trường đã bật)',
          dayType: 'SCHOOL_DAY',
          title: 'Thứ Bảy có học',
        };
      }
      return {
        required: false,
        reason: 'Thứ Bảy (Không có lịch học)',
        dayType: 'NO_SCHOOL_DAY',
        title: 'Thứ Bảy',
      };
    }

    // Thứ Hai đến Thứ Sáu
    const activeDays = settings?.schoolDaysWeekly || [1, 2, 3, 4, 5];
    if (activeDays.includes(dayOfWeek)) {
      return {
        required: true,
        reason: 'Ngày học chính khóa trong tuần',
        dayType: 'SCHOOL_DAY',
        title: 'Ngày học chính khóa',
      };
    }

    return {
      required: false,
      reason: 'Ngày không nằm trong danh mục ngày học trong tuần',
      dayType: 'NO_SCHOOL_DAY',
      title: 'Không học',
    };
  }
}

export const schoolCalendarService = new SchoolCalendarService();
