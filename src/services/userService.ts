import { User, UserRole, AccountStatus } from '../types';
import { storageService } from './storageService';
import { teacherService } from './teacherService';
import { permissionService } from './permissionService';
import { supabase } from './supabaseService';

export class UserService {
  public getUsers(): User[] {
    return storageService.getUsers();
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === clean);
  }

  /**
   * Tạo tài khoản đăng nhập cho một giáo viên
   * Không lưu mật khẩu thô trong cơ sở dữ liệu.
   * Tạo liên kết kích hoạt / thiết lập mật khẩu an toàn.
   */
  public async createUserAccount(
    teacherId: string,
    performedById: string,
    performedByName: string
  ): Promise<{ success: boolean; user?: User; resetLink?: string; message: string }> {
    const teacher = teacherService.getTeacherById(teacherId);
    if (!teacher) {
      return { success: false, message: 'Không tìm thấy hồ sơ giáo viên.' };
    }

    const cleanEmail = teacher.email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Giáo viên này chưa có email. Vui lòng bổ sung email trong hồ sơ trước.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: `Email "${cleanEmail}" không đúng định dạng hợp lệ.` };
    }

    const existingUsers = this.getUsers();
    if (existingUsers.some(u => u.email.toLowerCase() === cleanEmail || u.teacherId === teacher.id)) {
      return { success: false, message: `Tài khoản với email ${cleanEmail} đã tồn tại trong hệ thống.` };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const authUid = `auth_${userId}`;
    const username = cleanEmail.split('@')[0];

    const defaultPerms = permissionService.getDefaultPermissions(teacher.role);
    const isPrincipal = teacher.role === 'BOARD_OF_MANAGEMENT' || teacher.id === 'tch_bgh' || (teacher.fullName || '').includes('Hoàng Xuân Nhật');
    const assignedRole = isPrincipal ? 'principal' : (teacher.role === 'ADMIN' ? 'admin_tpt' : (teacher.role === 'BOARD_OF_MANAGEMENT' ? 'principal' : 'teacher_gvcn'));
    const assignedTitle = isPrincipal ? 'Hiệu trưởng' : (teacher.assignedClassName ? `GVCN Lớp ${teacher.assignedClassName}` : (teacher.role === 'ADMIN' ? 'Tổng Phụ trách Đội' : 'Giáo viên'));

    const newUser: User = {
      id: isPrincipal ? 'user_bgh' : userId,
      authUid,
      teacherId: teacher.id,
      username: isPrincipal ? 'hoangxuannhat' : username,
      name: teacher.fullName,
      fullName: teacher.fullName,
      email: cleanEmail,
      phone: teacher.phone,
      role: assignedRole,
      permissions: defaultPerms,
      assignedClassId: isPrincipal ? undefined : teacher.assignedClassId,
      assignedClassName: isPrincipal ? undefined : teacher.assignedClassName,
      title: assignedTitle,
      accountStatus: 'ACTIVE',
      employmentStatus: teacher.employmentStatus,
      schoolYearId: '2026-2027',
      isActive: true,
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    storageService.saveUser(newUser);

    // Cập nhật trạng thái tài khoản trong hồ sơ giáo viên
    teacher.accountStatus = 'ACTIVE';
    teacher.authUid = authUid;
    teacher.updatedAt = new Date().toISOString();
    teacherService.updateTeacher(teacher.id, { accountStatus: 'ACTIVE', authUid }, performedById, performedByName);

    // Tạo link thiết lập mật khẩu bảo mật (Không hiện mật khẩu thô)
    const resetToken = Math.random().toString(36).substring(2, 12);
    const resetLink = `https://thcsbanbo.edu.vn/set-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    storageService.saveAuditLog({
      id: `log_usr_create_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CREATE_USER_ACCOUNT',
      entity: 'user',
      entityId: userId,
      targetUserId: userId,
      targetTeacherId: teacher.id,
      description: `Tạo tài khoản đăng nhập cho giáo viên ${teacher.fullName} (${cleanEmail}), vai trò: ${teacher.role}, lớp: ${teacher.assignedClassName || 'Không'}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      newValue: JSON.stringify({ userId, email: cleanEmail, role: teacher.role }),
    });

    return {
      success: true,
      user: newUser,
      resetLink,
      message: `Đã tạo tài khoản cho thầy/cô ${teacher.fullName}! Email: ${cleanEmail}.`,
    };
  }

  /**
   * Tạo tài khoản GVCN hàng loạt cho 20 lớp chính thức
   */
  public async bulkCreateTeacherAccounts(
    teacherIds: string[],
    performedById: string,
    performedByName: string
  ): Promise<{
    total: number;
    successCount: number;
    alreadyExistsCount: number;
    missingEmailCount: number;
    errorCount: number;
    details: Array<{
      teacherName: string;
      email: string;
      className?: string;
      status: 'SUCCESS' | 'ALREADY_EXISTS' | 'MISSING_EMAIL' | 'ERROR';
      message: string;
    }>;
  }> {
    const teachers = teacherService.getTeachers();
    const existingUsers = this.getUsers();
    const existingEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase()));
    const existingTeacherIdSet = new Set(existingUsers.map(u => u.teacherId).filter(Boolean));

    let successCount = 0;
    let alreadyExistsCount = 0;
    let missingEmailCount = 0;
    let errorCount = 0;
    const details: any[] = [];

    for (const tId of teacherIds) {
      const teacher = teachers.find(t => t.id === tId);
      if (!teacher) continue;

      // Bỏ qua tài khoản Ban Giám hiệu vì BGH không phải là GVCN cần tạo tài khoản giáo viên
      if (teacher.id === 'tch_bgh' || teacher.role === 'BOARD_OF_MANAGEMENT' || (teacher.fullName || '').includes('Hoàng Xuân Nhật')) {
        continue;
      }

      const cleanEmail = teacher.email.trim().toLowerCase();

      // Kiểm tra email
      if (!cleanEmail) {
        missingEmailCount++;
        details.push({
          teacherName: teacher.fullName,
          email: '',
          className: teacher.assignedClassName,
          status: 'MISSING_EMAIL',
          message: 'Chưa có email trong hồ sơ giáo viên',
        });
        continue;
      }

      // Kiểm tra đã có tài khoản chưa
      if (existingEmailSet.has(cleanEmail) || (teacher.id && existingTeacherIdSet.has(teacher.id))) {
        alreadyExistsCount++;
        details.push({
          teacherName: teacher.fullName,
          email: cleanEmail,
          className: teacher.assignedClassName,
          status: 'ALREADY_EXISTS',
          message: 'Đã có tài khoản đang hoạt động',
        });
        continue;
      }

      // Tạo tài khoản an toàn
      try {
        const res = await this.createUserAccount(teacher.id, performedById, performedByName);
        if (res.success) {
          successCount++;
          existingEmailSet.add(cleanEmail);
          existingTeacherIdSet.add(teacher.id);
          details.push({
            teacherName: teacher.fullName,
            email: cleanEmail,
            className: teacher.assignedClassName,
            status: 'SUCCESS',
            message: 'Đã tạo tài khoản thành công',
          });
        } else {
          errorCount++;
          details.push({
            teacherName: teacher.fullName,
            email: cleanEmail,
            className: teacher.assignedClassName,
            status: 'ERROR',
            message: res.message,
          });
        }
      } catch (err: any) {
        errorCount++;
        details.push({
          teacherName: teacher.fullName,
          email: cleanEmail,
          className: teacher.assignedClassName,
          status: 'ERROR',
          message: err?.message || 'Lỗi không xác định',
        });
      }
    }

    storageService.syncClassesWithAssignedTeachers();
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));

    storageService.saveAuditLog({
      id: `log_bulk_create_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CREATE_USER_ACCOUNT',
      entity: 'user',
      entityId: 'bulk_create_accounts',
      description: `Tạo tài khoản GVCN hàng loạt: Tổng ${teacherIds.length}, thành công ${successCount}, đã có ${alreadyExistsCount}, thiếu email ${missingEmailCount}, lỗi ${errorCount}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      total: teacherIds.length,
      successCount,
      alreadyExistsCount,
      missingEmailCount,
      errorCount,
      details,
    };
  }

  /**
   * Khóa tài khoản (Bắt buộc nhập lý do & không cho tự khóa nếu là ADMIN cuối cùng)
   */
  public lockUserAccount(
    userId: string,
    reason: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    if (!reason || reason.trim().length < 3) {
      return { success: false, message: 'Bắt buộc nhập lý do khóa tài khoản để lưu nhật ký kiểm toán.' };
    }

    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'Không tìm thấy tài khoản.' };

    // Bảo vệ: ADMIN không được tự khóa chính mình
    if (userId === performedById) {
      return { success: false, message: 'Bạn không thể tự khóa tài khoản quản trị của chính mình.' };
    }

    // Bảo vệ: Không được khóa ADMIN duy nhất của hệ thống
    const activeAdmins = users.filter(u => (u.role === 'ADMIN' || u.role === 'admin_tpt') && u.isActive && u.accountStatus !== 'LOCKED');
    if ((target.role === 'ADMIN' || target.role === 'admin_tpt') && activeAdmins.length <= 1) {
      return { success: false, message: 'Không thể khóa tài khoản ADMIN này vì hệ thống phải luôn có ít nhất một tài khoản Quản trị hoạt động.' };
    }

    target.isActive = false;
    target.accountStatus = 'LOCKED';
    target.updatedAt = new Date().toISOString();
    storageService.saveUser(target);

    // Đồng bộ sang teacher nếu có
    if (target.teacherId) {
      teacherService.updateTeacher(target.teacherId, { accountStatus: 'LOCKED' }, performedById, performedByName);
    }

    storageService.saveAuditLog({
      id: `log_usr_lock_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'LOCK_USER_ACCOUNT',
      entity: 'user',
      entityId: userId,
      targetUserId: userId,
      targetTeacherId: target.teacherId,
      description: `Khóa tài khoản ${target.name} (${target.email}). Lý do: ${reason}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      reason,
      oldValue: 'ACTIVE',
      newValue: 'LOCKED',
    });

    return { success: true, message: `Đã khóa tài khoản của ${target.name}. Người dùng này sẽ không thể đăng nhập.` };
  }

  /**
   * Mở khóa tài khoản
   */
  public unlockUserAccount(
    userId: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'Không tìm thấy tài khoản.' };

    target.isActive = true;
    target.accountStatus = 'ACTIVE';
    target.updatedAt = new Date().toISOString();
    storageService.saveUser(target);

    if (target.teacherId) {
      teacherService.updateTeacher(target.teacherId, { accountStatus: 'ACTIVE' }, performedById, performedByName);
    }

    storageService.saveAuditLog({
      id: `log_usr_unlock_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'UNLOCK_USER_ACCOUNT',
      entity: 'user',
      entityId: userId,
      targetUserId: userId,
      targetTeacherId: target.teacherId,
      description: `Mở khóa tài khoản ${target.name} (${target.email})`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      oldValue: 'LOCKED',
      newValue: 'ACTIVE',
    });

    return { success: true, message: `Đã mở khóa tài khoản của ${target.name}.` };
  }

  /**
   * Gửi liên kết đặt lại mật khẩu an toàn tới email giáo viên (Tuyệt đối không hiện mật khẩu)
   */
  public sendPasswordReset(
    email: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; resetLink?: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const target = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!target) {
      return { success: false, message: 'Email này chưa được đăng ký tài khoản trong hệ thống.' };
    }

    const resetToken = Math.random().toString(36).substring(2, 14);
    const resetLink = `https://thcsbanbo.edu.vn/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    storageService.saveAuditLog({
      id: `log_pwd_reset_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'SEND_PASSWORD_RESET',
      entity: 'user',
      entityId: target.id,
      targetUserId: target.id,
      description: `Gửi liên kết đặt lại mật khẩu tới email ${cleanEmail} của người dùng ${target.name}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      success: true,
      resetLink,
      message: `Đã tạo liên kết đặt lại mật khẩu an toàn cho ${target.name} (${cleanEmail}).`,
    };
  }

  /**
   * Đổi vai trò tài khoản (Chỉ ADMIN)
   */
  public changeUserRole(
    userId: string,
    newRole: UserRole,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'Không tìm thấy tài khoản.' };

    // Không cho hạ role ADMIN duy nhất
    if ((target.role === 'ADMIN' || target.role === 'admin_tpt') && newRole !== 'ADMIN' && newRole !== 'admin_tpt') {
      const activeAdmins = users.filter(u => (u.role === 'ADMIN' || u.role === 'admin_tpt') && u.isActive);
      if (activeAdmins.length <= 1) {
        return { success: false, message: 'Hệ thống phải luôn có ít nhất một tài khoản ADMIN hoạt động.' };
      }
    }

    const oldRole = target.role;
    target.role = newRole;
    target.permissions = permissionService.getDefaultPermissions(newRole);
    target.updatedAt = new Date().toISOString();
    storageService.saveUser(target);

    // Đồng bộ teacher
    if (target.teacherId) {
      teacherService.updateTeacher(target.teacherId, { role: newRole }, performedById, performedByName);
    }

    storageService.saveAuditLog({
      id: `log_role_chg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CHANGE_USER_ROLE',
      entity: 'user',
      entityId: userId,
      targetUserId: userId,
      description: `Thay đổi vai trò người dùng ${target.name}: từ ${oldRole} sang ${newRole}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      oldValue: oldRole,
      newValue: newRole,
    });

    return { success: true, message: `Đã cập nhật vai trò của ${target.name} thành ${newRole}.` };
  }

  /**
   * Kích hoạt tài khoản cho giáo viên
   * Nếu giáo viên chưa có User thì tự động khởi tạo User và kích hoạt.
   * Nếu tài khoản đang khóa hoặc chờ kích hoạt thì chuyển sang ACTIVE.
   */
  public async activateTeacherAccount(
    teacherOrUserId: string,
    performedById: string,
    performedByName: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers();
    const teachers = teacherService.getTeachers();

    let user = users.find(
      u =>
        u.id === teacherOrUserId ||
        u.teacherId === teacherOrUserId ||
        (u.email && u.email.toLowerCase() === teacherOrUserId.toLowerCase())
    );
    const teacher = teachers.find(
      t =>
        t.id === teacherOrUserId ||
        (user && (t.id === user.teacherId || (t.email && t.email.toLowerCase() === user.email.toLowerCase())))
    );

    if (!user && teacher) {
      const res = await this.createUserAccount(teacher.id, performedById, performedByName);
      if (res.success && res.user) {
        return {
          success: true,
          message: `Đã kích hoạt tài khoản thành công cho thầy/cô ${teacher.fullName}!`,
          user: res.user,
        };
      }
      return { success: false, message: res.message || 'Không thể kích hoạt tài khoản giáo viên.' };
    }

    if (!user) {
      return { success: false, message: 'Không tìm thấy hồ sơ giáo viên hoặc tài khoản cần kích hoạt.' };
    }

    user.isActive = true;
    user.accountStatus = 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    storageService.saveUser(user);

    if (teacher) {
      teacher.accountStatus = 'ACTIVE';
      teacher.updatedAt = new Date().toISOString();
      teacherService.updateTeacher(teacher.id, { accountStatus: 'ACTIVE' }, performedById, performedByName);
    } else if (user.teacherId) {
      teacherService.updateTeacher(user.teacherId, { accountStatus: 'ACTIVE' }, performedById, performedByName);
    }

    storageService.saveAuditLog({
      id: `log_usr_activate_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'ACTIVATE_USER_ACCOUNT',
      entity: 'user',
      entityId: user.id,
      targetUserId: user.id,
      targetTeacherId: user.teacherId,
      description: `Kích hoạt tài khoản người dùng ${user.name} (${user.email})`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      oldValue: 'INACTIVE',
      newValue: 'ACTIVE',
    });

    return {
      success: true,
      message: `Đã kích hoạt tài khoản thành công cho thầy/cô ${user.name}! Thầy/cô có thể đăng nhập ngay vào hệ thống.`,
      user,
    };
  }

  /**
   * Đặt mật khẩu mới cho giáo viên / người dùng
   * Hỗ trợ lưu trữ mật khẩu, đồng bộ kích hoạt tài khoản và tạo biên bản bàn giao mật khẩu.
   */
  public async setPasswordForTeacher(
    teacherOrUserId: string,
    newPassword: string,
    requireChangeOnFirstLogin: boolean = true,
    performedById: string,
    performedByName: string
  ): Promise<{
    success: boolean;
    message: string;
    credentials?: {
      name: string;
      username: string;
      email: string;
      className?: string;
      password: string;
      requireChangeOnFirstLogin: boolean;
    };
    user?: User;
  }> {
    const trimmedPassword = (newPassword || '').trim();
    if (!trimmedPassword || trimmedPassword.length < 4) {
      return { success: false, message: 'Mật khẩu phải có độ dài tối thiểu 4 ký tự.' };
    }

    const users = this.getUsers();
    const teachers = teacherService.getTeachers();

    let user = users.find(
      u =>
        u.id === teacherOrUserId ||
        u.teacherId === teacherOrUserId ||
        (u.email && u.email.toLowerCase() === teacherOrUserId.toLowerCase())
    );
    const teacher = teachers.find(
      t =>
        t.id === teacherOrUserId ||
        (user && (t.id === user.teacherId || (t.email && t.email.toLowerCase() === user.email.toLowerCase())))
    );

    // Nếu giáo viên chưa có bản ghi User thì tạo trước
    if (!user && teacher) {
      const createRes = await this.createUserAccount(teacher.id, performedById, performedByName);
      if (!createRes.success || !createRes.user) {
        return { success: false, message: `Không thể tạo tài khoản cho giáo viên: ${createRes.message}` };
      }
      user = createRes.user;
    }

    if (!user) {
      return { success: false, message: 'Không tìm thấy tài khoản người dùng hoặc hồ sơ giáo viên.' };
    }

    user.password = trimmedPassword;
    user.passwordUpdatedAt = new Date().toISOString();
    user.isFirstLogin = requireChangeOnFirstLogin;
    user.isActive = true;
    user.accountStatus = 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    storageService.saveUser(user);

    if (teacher) {
      teacher.accountStatus = 'ACTIVE';
      teacher.updatedAt = new Date().toISOString();
      teacherService.updateTeacher(teacher.id, { accountStatus: 'ACTIVE' }, performedById, performedByName);
    } else if (user.teacherId) {
      teacherService.updateTeacher(user.teacherId, { accountStatus: 'ACTIVE' }, performedById, performedByName);
    }

    storageService.saveAuditLog({
      id: `log_usr_pwd_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'SET_USER_PASSWORD',
      entity: 'user',
      entityId: user.id,
      targetUserId: user.id,
      targetTeacherId: user.teacherId,
      description: `Quản trị viên đặt mật khẩu mới cho tài khoản ${user.name} (${user.email}), yêu cầu đổi mật khẩu lần đầu: ${
        requireChangeOnFirstLogin ? 'Có' : 'Không'
      }`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Đã đặt mật khẩu thành công cho thầy/cô ${user.name}!`,
      credentials: {
        name: user.name,
        username: user.username,
        email: user.email,
        className: user.assignedClassName,
        password: trimmedPassword,
        requireChangeOnFirstLogin,
      },
      user,
    };
  }

  /**
   * Tạo mật khẩu gợi ý mạnh mẽ nhưng dễ nhớ cho giáo viên trường Bản Bo
   */
  public generateSuggestedPassword(prefix = 'BanBo'): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}@2026!${rand}`;
  }

  /**
   * Kích hoạt tất cả tài khoản giáo viên và người dùng chưa được kích hoạt
   */
  public async activateAllPendingAccounts(
    performedById: string,
    performedByName: string
  ): Promise<{ success: boolean; activatedCount: number; message: string }> {
    const teachers = teacherService.getTeachers();
    let count = 0;

    // 1. Kích hoạt toàn bộ giáo viên
    for (const tch of teachers) {
      if (tch.accountStatus !== 'ACTIVE') {
        const res = await this.activateTeacherAccount(tch.id, performedById, performedByName);
        if (res.success) count++;
      }
    }

    // 2. Kích hoạt toàn bộ user
    const users = this.getUsers();
    let userChanged = false;
    users.forEach(u => {
      if (!u.isActive || u.accountStatus !== 'ACTIVE') {
        u.isActive = true;
        u.accountStatus = 'ACTIVE';
        u.updatedAt = new Date().toISOString();
        storageService.saveUser(u);
        count++;
        userChanged = true;
      }
    });

    storageService.syncClassesWithAssignedTeachers();
    window.dispatchEvent(new CustomEvent('thcs_banbo_reports_changed'));
    window.dispatchEvent(new CustomEvent('thcs_banbo_classes_changed'));

    storageService.saveAuditLog({
      id: `log_bulk_activate_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'ACTIVATE_ALL_ACCOUNTS',
      entity: 'user',
      entityId: 'all_users',
      description: `Kích hoạt tất cả tài khoản chưa kích hoạt trong hệ thống (${count} tài khoản được kích hoạt)`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      success: true,
      activatedCount: count,
      message: `Đã kích hoạt thành công tất cả tài khoản! Toàn bộ giáo viên và người dùng hiện đã ở trạng thái HOẠT ĐỘNG.`,
    };
  }

  /**
   * Sửa tên đăng nhập (Username) cho tài khoản người dùng
   */
  public updateUsername(
    userId: string,
    newUsername: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string; user?: User } {
    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Tên đăng nhập mới phải có ít nhất 3 ký tự.' };
    }
    if (/\s/.test(cleanUsername)) {
      return { success: false, message: 'Tên đăng nhập không được chứa khoảng cách (dấu cách).' };
    }

    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Không tìm thấy tài khoản người dùng.' };
    }

    // Kiểm tra xem tên đăng nhập mới có bị trùng với tài khoản khác không
    const duplicate = users.find(u => u.id !== userId && (u.username || '').toLowerCase() === cleanUsername);
    if (duplicate) {
      return {
        success: false,
        message: `Tên đăng nhập "${cleanUsername}" đã được tài khoản "${duplicate.name}" sử dụng. Vui lòng chọn tên khác.`,
      };
    }

    const oldUsername = targetUser.username;
    targetUser.username = cleanUsername;
    targetUser.updatedAt = new Date().toISOString();

    storageService.saveUser(targetUser);

    // Nếu người thực hiện sửa tài khoản của chính mình thì cập nhật phiên đăng nhập
    const currentAuth = storageService.getCurrentUser();
    if (currentAuth && currentAuth.id === targetUser.id) {
      storageService.setCurrentUser(targetUser);
    }

    // Đồng bộ lên Supabase nếu có kết nối
    try {
      supabase.from('users').update({
        username: cleanUsername,
        raw_data: targetUser,
        updated_at: new Date().toISOString(),
      }).eq('id', targetUser.id).then(() => {});
    } catch {
      // ignore
    }

    // Ghi nhật ký kiểm toán
    storageService.saveAuditLog({
      id: `log_change_username_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      userRole: 'admin_tpt',
      action: 'UPDATE_USERNAME',
      entity: 'user',
      entityId: targetUser.id,
      targetUserId: targetUser.id,
      description: `Đổi tên đăng nhập tài khoản ${targetUser.name} từ "${oldUsername}" thành "${cleanUsername}"`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Đã đổi tên đăng nhập cho ${targetUser.name} thành "${cleanUsername}" thành công!`,
      user: targetUser,
    };
  }
}

export const userService = new UserService();
