import { AppNotification, NotificationType, NotificationPriority, UserRole } from '../types';
import { getVietnamFullTimestamp } from '../utils/vietnamTime';

const NOTIFICATIONS_STORAGE_KEY = 'thcs_banbo_v2_notifications';

class NotificationService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === NOTIFICATIONS_STORAGE_KEY) {
          this.notifyListeners();
        }
      });
      window.addEventListener('thcs_banbo_notification_changed', () => {
        this.notifyListeners();
      });
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Lỗi listener thông báo:', err);
      }
    });
  }

  private emitChangeEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_banbo_notification_changed'));
    }
    this.notifyListeners();
  }

  public getAllNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (!raw) return [];
      const list: AppNotification[] = JSON.parse(raw);
      // Sắp xếp mới nhất lên đầu
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Lấy danh sách thông báo cho một người dùng (GVCN hoặc Quản trị viên/TPT)
   */
  public getNotificationsForUser(userId: string, role?: string): AppNotification[] {
    const all = this.getAllNotifications();
    const isAdmin = role === 'admin_tpt' || role === 'ADMIN' || role === 'principal' || role === 'BOARD_OF_MANAGEMENT';

    return all.filter((n) => {
      // Đúng người nhận cụ thể
      if (n.recipientUserId === userId) return true;
      // Thông báo gửi tới nhóm vai trò Admin/TPT
      if (isAdmin && (n.recipientRole === 'admin_tpt' || n.recipientRole === 'ADMIN' || n.recipientUserId === 'ADMIN_ALL')) {
        return true;
      }
      return false;
    });
  }

  public getUnreadCount(userId: string, role?: string): number {
    const userNotes = this.getNotificationsForUser(userId, role);
    return userNotes.filter((n) => !n.isRead).length;
  }

  /**
   * Tạo thông báo mới (Có cơ chế chống spam lặp deduplicationKey - Mục XVII, XXXIX)
   */
  public createNotification(
    data: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>
  ): AppNotification | null {
    const all = this.getAllNotifications();

    // 1. Kiểm tra deduplicationKey
    if (data.deduplicationKey) {
      const existing = all.find((n) => n.deduplicationKey === data.deduplicationKey);
      if (existing) {
        // Đã tồn tại thông báo này trước đó, không tạo lại
        return existing;
      }
    }

    const newId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = getVietnamFullTimestamp();

    const newNotification: AppNotification = {
      ...data,
      id: newId,
      isRead: false,
      createdAt,
    };

    all.unshift(newNotification);

    // Giữ tối đa 500 thông báo gần nhất để tránh quá tải dung lượng
    const trimmed = all.slice(0, 500);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmed));
    this.emitChangeEvent();

    // Thử kích hoạt Web Push / System Notification nếu được người dùng cho phép (Mục XLI, LIV)
    this.dispatchWebPushSafely(newNotification);

    return newNotification;
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  public markAsRead(notificationId: string): boolean {
    const all = this.getAllNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) return false;

    target.isRead = true;
    target.readAt = getVietnamFullTimestamp();

    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(all));
    this.emitChangeEvent();
    return true;
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng là đã đọc
   */
  public markAllAsReadForUser(userId: string, role?: string): boolean {
    const all = this.getAllNotifications();
    const isAdmin = role === 'admin_tpt' || role === 'ADMIN' || role === 'principal';
    let changed = false;
    const now = getVietnamFullTimestamp();

    all.forEach((n) => {
      const isTarget =
        n.recipientUserId === userId ||
        (isAdmin && (n.recipientRole === 'admin_tpt' || n.recipientRole === 'ADMIN' || n.recipientUserId === 'ADMIN_ALL'));

      if (isTarget && !n.isRead) {
        n.isRead = true;
        n.readAt = now;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(all));
      this.emitChangeEvent();
    }
    return true;
  }

  /**
   * Xóa thông báo (chỉ cho quản trị viên hoặc dọn dẹp)
   */
  public deleteNotification(notificationId: string): boolean {
    const all = this.getAllNotifications();
    const filtered = all.filter((n) => n.id !== notificationId);
    if (filtered.length !== all.length) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filtered));
      this.emitChangeEvent();
      return true;
    }
    return false;
  }

  /**
   * Hiển thị Web Notification tiêu chuẩn nếu đã cấp quyền (Không để lộ chi tiết học sinh ngoài màn hình - Mục LIV)
   */
  private dispatchWebPushSafely(notif: AppNotification) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
          tag: notif.deduplicationKey || notif.id,
        });
      } catch {
        // Trình duyệt có thể chặn trong ngữ cảnh nhất định, bỏ qua
      }
    }
  }

  /**
   * Yêu cầu quyền Web Push Notification
   */
  public async requestPushPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getPushPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();
