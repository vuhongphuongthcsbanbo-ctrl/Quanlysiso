import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { permissionService, PERMISSION_LABELS } from '../services/permissionService';
import { storageService } from '../services/storageService';
import { UserPermissions, UserRole } from '../types';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  Sparkles,
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';

export const RolePermissionPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [rolePerms, setRolePerms] = useState<Record<string, UserPermissions>>(() =>
    permissionService.getCustomRolePermissions()
  );
  const [selectedRole, setSelectedRole] = useState<string>('HEAD_TEACHER');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const permissionKeys = Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>;

  const handleTogglePerm = (role: string, permKey: keyof UserPermissions) => {
    if (!isAdmin) return;
    if (role === 'ADMIN' || role === 'admin_tpt') return; // Không thể thu hồi quyền ADMIN

    const current = { ...rolePerms[role] };
    current[permKey] = !current[permKey];

    const updated = { ...rolePerms, [role]: current };
    setRolePerms(updated);
  };

  const handleSave = () => {
    Object.keys(rolePerms).forEach(r => {
      permissionService.saveRolePermissions(r, rolePerms[r]);
    });

    storageService.saveAuditLog({
      id: `log_perm_save_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'admin_tpt',
      userName: currentUser?.name || 'Phạm Ngọc Thúy',
      action: 'CHANGE_PERMISSIONS',
      entity: 'permission',
      entityId: 'role_permissions_config',
      description: `Cập nhật ma trận phân quyền hệ thống Trường THCS Bản Bo`,
      performedBy: currentUser?.name || 'Phạm Ngọc Thúy',
      performedAt: new Date().toISOString(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const roles = [
    { id: 'HEAD_TEACHER', title: 'Giáo viên chủ nhiệm (HEAD_TEACHER)', desc: 'Chỉ xem và báo cáo sĩ số cho lớp mình chủ nhiệm' },
    { id: 'BOARD_OF_MANAGEMENT', title: 'Ban Giám hiệu (BOARD_OF_MANAGEMENT)', desc: 'Xem Dashboard toàn trường, thống kê và xuất báo cáo' },
    { id: 'ADMIN', title: 'Quản trị viên (ADMIN / TPT)', desc: 'Toàn quyền cấu hình, tài khoản, phân công và chốt số liệu' },
    { id: 'VIEWER', title: 'Tài khoản chỉ xem (VIEWER)', desc: 'Chỉ xem báo cáo khi được cấp quyền' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              An Toàn & Bảo Mật · Trường THCS Bản Bo
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Cài Đặt & Ma Trận Phân Quyền (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nguyên tắc Least Privilege (Quyền hạn tối thiểu): đảm bảo mỗi vai trò chỉ có đúng thẩm quyền cần thiết
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cấu Hình Quyền</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công cấu hình phân quyền hệ thống!</span>
        </div>
      )}

      {/* Principle Banner (Mục XC) */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Nguyên tắc Bảo mật của Trường THCS Bản Bo:</div>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-800 text-[11px]">
            <li>
              <strong>GVCN:</strong> Tuyệt đối không được xem danh sách chi tiết lớp khác, không được duyệt hoặc chốt
              sĩ số toàn trường, không được tự thay đổi vai trò hay lớp chủ nhiệm.
            </li>
            <li>
              <strong>Ban Giám hiệu:</strong> Mặc định có quyền xem toàn diện Dashboard và báo cáo, không sửa dữ liệu
              học sinh trừ khi được ủy quyền.
            </li>
            <li>
              <strong>ADMIN:</strong> Quản trị viên chịu trách nhiệm kiểm duyệt và vận hành toàn hệ thống.
            </li>
          </ul>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedRole(r.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              selectedRole === r.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 uppercase">
              Danh Sách Quyền Chức Năng Cho:{' '}
              <span className="text-blue-600">{roles.find(r => r.id === selectedRole)?.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {roles.find(r => r.id === selectedRole)?.desc}
            </p>
          </div>
          {selectedRole === 'ADMIN' && (
            <span className="text-[11px] font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg">
              ADMIN luôn có toàn quyền
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {permissionKeys.map(pKey => {
            const labelInfo = PERMISSION_LABELS[pKey];
            const currentPerms = rolePerms[selectedRole] || permissionService.getDefaultPermissions(selectedRole as UserRole);
            const isAllowed = !!currentPerms[pKey];
            const isLockedAdmin = selectedRole === 'ADMIN';

            return (
              <div
                key={pKey}
                onClick={() => !isLockedAdmin && handleTogglePerm(selectedRole, pKey)}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  !isLockedAdmin ? 'hover:bg-slate-50 cursor-pointer' : ''
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span>{labelInfo.title}</span>
                    <code className="text-[10px] text-slate-400 font-mono font-normal">({pKey})</code>
                  </div>
                  <div className="text-[11px] text-slate-500">{labelInfo.description}</div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                      isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isAllowed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>CHO PHÉP</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>KHÔNG ĐƯỢC PHÉP</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
