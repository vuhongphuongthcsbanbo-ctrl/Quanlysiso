import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { storageService } from '../services/storageService';
import { permissionService } from '../services/permissionService';

interface AuthContextType {
  currentUser: User | null;
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; message: string; isFirstLogin?: boolean }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  dismissFirstTimeModal: () => void;
  isAdmin: boolean;
  isPrincipal: boolean;
  isBoardOfManagement: boolean;
  isTeacher: boolean;
  isHeadTeacher: boolean;
  isViewer: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canEditAttendance: (classId?: string) => boolean;
  canManageClasses: boolean;
  canLockReports: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = async (
    usernameOrEmail: string,
    _password?: string
  ): Promise<{ success: boolean; message: string; isFirstLogin?: boolean }> => {
    const users = storageService.getUsers();
    const cleanInput = usernameOrEmail.trim().toLowerCase();

    const user = users.find(u => {
      const uUser = (u.username || '').toLowerCase().trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();
      const uFullName = (u.fullName || '').toLowerCase().trim();
      const uClass = (u.assignedClassName || '').toLowerCase().trim();
      const uId = (u.id || '').toLowerCase().trim();
      return (
        uUser === cleanInput ||
        uEmail === cleanInput ||
        uName === cleanInput ||
        uFullName === cleanInput ||
        uClass === cleanInput ||
        `lớp ${uClass}` === cleanInput ||
        `gvcn ${uClass}` === cleanInput ||
        uId === cleanInput
      );
    });

    if (!user) {
      return { success: false, message: 'Tên giáo viên, email hoặc lớp không tồn tại trong hệ thống.' };
    }

    // Kiểm tra khóa tài khoản / kích hoạt
    if (!user.isActive || user.accountStatus === 'NOT_CREATED' || user.accountStatus === 'INVITED') {
      return {
        success: false,
        message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên để kích hoạt tài khoản.',
      };
    }

    if (user.accountStatus === 'LOCKED' || user.accountStatus === 'DISABLED') {
      return {
        success: false,
        message: 'Tài khoản hiện đang bị khóa. Vui lòng liên hệ quản trị viên.',
      };
    }

    // Kiểm tra mật khẩu (nếu tài khoản đã được thiết lập mật khẩu riêng)
    if (user.password && _password && _password !== '••••••••' && user.password !== _password) {
      return {
        success: false,
        message: 'Mật khẩu đăng nhập không chính xác. Vui lòng kiểm tra lại.',
      };
    }

    // Ghi nhận lần đăng nhập cuối
    const nowStr = new Date().toISOString();
    const isFirst = !!user.isFirstLogin;
    user.lastLoginAt = nowStr;
    user.updatedAt = nowStr;
    storageService.saveUser(user);

    storageService.setCurrentUser(user);
    setCurrentUser(user);

    storageService.saveAuditLog({
      id: `log_login_${Date.now()}`,
      timestamp: nowStr,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
      targetUserId: user.id,
      description: `Đăng nhập vào hệ thống (${user.title})`,
      performedBy: user.name,
      performedAt: nowStr,
    });

    return { success: true, message: 'Đăng nhập thành công!', isFirstLogin: isFirst };
  };

  const logout = () => {
    if (currentUser) {
      storageService.saveAuditLog({
        id: `log_logout_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'LOGOUT',
        entity: 'user',
        entityId: currentUser.id,
        description: 'Đăng xuất khỏi hệ thống',
        performedBy: currentUser.name,
        performedAt: new Date().toISOString(),
      });
    }
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const users = storageService.getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      target.lastLoginAt = new Date().toISOString();
      storageService.saveUser(target);
      storageService.setCurrentUser(target);
      setCurrentUser(target);
      storageService.saveAuditLog({
        id: `log_switch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: target.id,
        userName: target.name,
        userRole: target.role,
        action: 'SWITCH_USER',
        entity: 'user',
        entityId: target.id,
        description: `Chuyển sang tài khoản ${target.name} (${target.title})`,
        performedBy: target.name,
        performedAt: new Date().toISOString(),
      });
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    storageService.saveUser(updated);
    storageService.setCurrentUser(updated);
    setCurrentUser(updated);
  };

  const dismissFirstTimeModal = () => {
    if (!currentUser) return;
    updateCurrentUser({ isFirstLogin: false });
  };

  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || currentUser?.role === 'admin_tpt';
  const isPrincipal = roleUpper === 'BOARD_OF_MANAGEMENT' || currentUser?.role === 'principal';
  const isBoardOfManagement = isPrincipal;
  const isTeacher = roleUpper === 'HEAD_TEACHER' || currentUser?.role === 'teacher_gvcn';
  const isHeadTeacher = isTeacher;
  const isViewer = roleUpper === 'VIEWER' || currentUser?.role === 'viewer';

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissionService.hasPermission(currentUser, permission);
  };

  const canEditAttendance = (classId?: string) => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (isTeacher && classId) {
      const cleanTarget = classId.trim().toUpperCase();
      const cleanUserClass = (currentUser.assignedClassName || currentUser.assignedClassId || '').toUpperCase();
      if (cleanUserClass && (cleanUserClass === cleanTarget || `CLS_${cleanTarget.toLowerCase()}` === currentUser.assignedClassId)) {
        return true;
      }
      // Kiểm tra thay thế tạm thời
      if (currentUser.temporaryAssignments) {
        const today = new Date().toISOString().split('T')[0];
        return currentUser.temporaryAssignments.some(
          ta =>
            (ta.className.toUpperCase() === cleanTarget || ta.classId === classId) &&
            today >= ta.temporaryFrom &&
            today <= ta.temporaryUntil
        );
      }
    }
    return false;
  };

  const canManageClasses = isAdmin;
  const canLockReports = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchUser,
        updateCurrentUser,
        dismissFirstTimeModal,
        isAdmin,
        isPrincipal,
        isBoardOfManagement,
        isTeacher,
        isHeadTeacher,
        isViewer,
        hasPermission,
        canEditAttendance,
        canManageClasses,
        canLockReports,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
