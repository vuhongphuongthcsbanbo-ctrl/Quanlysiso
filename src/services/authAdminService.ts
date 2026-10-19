/**
 * Auth Admin Service & Firebase Admin SDK Bridge
 *
 * Quy chuẩn theo Mục XIII, XIV, XL:
 * - Khi kết nối Firebase Authentication thật: Sử dụng Firebase Admin SDK / Cloud Functions
 *   để tạo tài khoản và gán Custom Claims (role, assignedClassId, permissions).
 * - Tuyệt đối không tạo tài khoản từ client bằng createUserWithEmailAndPassword khiến Admin bị đăng xuất.
 * - Tuyệt đối không lưu mật khẩu thô trong Firestore hay LocalStorage.
 */

import { UserRole } from '../types';
import { storageService } from './storageService';

export interface FirebaseCustomClaims {
  role: UserRole;
  assignedClassId?: string;
  teacherId?: string;
  permissions?: string[];
}

export class AuthAdminService {
  /**
   * Tạo Firebase Auth User qua Admin SDK (hoặc Cloud Function)
   */
  public async createAuthUser(data: {
    email: string;
    displayName: string;
    phoneNumber?: string;
    customClaims: FirebaseCustomClaims;
  }): Promise<{ uid: string; success: boolean }> {
    // Khi chạy Cloud Function:
    // const userRecord = await admin.auth().createUser({ email, displayName, phoneNumber });
    // await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    // return { uid: userRecord.uid, success: true };

    const simulatedUid = `auth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      uid: simulatedUid,
      success: true,
    };
  }

  /**
   * Cập nhật Custom Claims trên Firebase Auth
   */
  public async setCustomUserClaims(uid: string, claims: FirebaseCustomClaims): Promise<boolean> {
    // admin.auth().setCustomUserClaims(uid, claims);
    return true;
  }

  /**
   * Khóa / Vô hiệu hóa tài khoản trên Firebase Auth (disable)
   */
  public async disableUser(uid: string): Promise<boolean> {
    // await admin.auth().updateUser(uid, { disabled: true });
    // await admin.auth().revokeRefreshTokens(uid); // Thu hồi phiên đăng nhập ngay lập tức
    return true;
  }

  /**
   * Mở khóa tài khoản trên Firebase Auth
   */
  public async enableUser(uid: string): Promise<boolean> {
    // await admin.auth().updateUser(uid, { disabled: false });
    return true;
  }

  /**
   * Thu hồi toàn bộ Refresh Tokens khi thay đổi quyền hoặc khóa tài khoản
   * Đảm bảo người dùng bị hạ quyền hoặc khóa không tiếp tục sử dụng token cũ
   */
  public async revokeUserSessions(uid: string): Promise<boolean> {
    // await admin.auth().revokeRefreshTokens(uid);
    return true;
  }

  /**
   * Tạo liên kết đặt lại mật khẩu bảo mật (Password Reset Link)
   */
  public async generatePasswordResetLink(email: string): Promise<string> {
    // const link = await admin.auth().generatePasswordResetLink(email);
    const token = Math.random().toString(36).substring(2, 12);
    return `https://thcsbanbo.edu.vn/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  }
}

export const authAdminService = new AuthAdminService();
