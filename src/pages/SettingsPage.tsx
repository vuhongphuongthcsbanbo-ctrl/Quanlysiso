import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { SchoolSettings } from '../types';
import { getSystemStorageStatus } from '../services/firebaseAdapter';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Upload,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  UtensilsCrossed,
  Shield,
  Sun,
  Sunset,
  Bell,
  Smartphone,
  History,
  ListFilter,
  AlertCircle,
} from 'lucide-react';
import { YearSetupWizardModal } from '../components/common/YearSetupWizardModal';
import { notificationService } from '../services/notificationService';
import { reminderService } from '../services/reminderService';
import { ConfirmDialog } from '../theme/designSystem';
import { SupabaseConnectCard } from '../components/admin/SupabaseConnectCard';

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SchoolSettings>(() => storageService.getSettings());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>(() => notificationService.getPushPermissionStatus());
  const [reminderLogs, setReminderLogs] = useState(() => reminderService.getReminderLogs());
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => storageService.getLastBackupDate());
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleClearDemoReports = () => {
    setIsConfirmClearOpen(true);
  };

  const executeClearDemoReports = () => {
    storageService.clearDemoReports();
    window.location.reload();
  };

  const firebaseStatus = getSystemStorageStatus();

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    storageService.addAuditLog('Quản trị viên', 'Cập nhật cấu hình hệ thống nhà trường', 'settings', 'CẬP NHẬT CẤU HÌNH');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_HeThong_THCSBanBo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    storageService.addAuditLog('Quản trị viên', 'Tải về tệp sao lưu toàn bộ cơ sở dữ liệu', 'settings', 'SAO LƯU DỮ LIỆU');
    setLastBackupDate(new Date().toISOString());
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = storageService.importFullBackup(content);
      if (res.success) {
        setBackupMessage('Khôi phục dữ liệu từ tệp sao lưu thành công! Đang làm mới hệ thống...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportError(res.message || 'Tệp sao lưu không hợp lệ hoặc bị lỗi định dạng.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDemoData = () => {
    setIsConfirmResetOpen(true);
  };

  const executeResetDemoData = () => {
    storageService.resetToDemoData();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Cấu hình hệ thống
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>CÀI ĐẶT NHÀ TRƯỜNG & SAO LƯU DỮ LIỆU</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trường THCS Bản Bo, Xã Bản Bo, Tỉnh Lai Châu
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt thành công!</span>
          </div>
        )}
      </div>

      {backupMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{backupMessage}</span>
        </div>
      )}

      {importError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5 text-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Thông tin đơn vị & Ban quản lý</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tên trường *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Địa chỉ trường</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.schoolAddress}
                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tổng Phụ trách Đội (Quản trị)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.adminName}
                onChange={(e) => setSettings({ ...settings, adminName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hiệu trưởng</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.principalName}
                onChange={(e) => setSettings({ ...settings, principalName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Năm học hiện hành</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.schoolYear}
                onChange={(e) => setSettings({ ...settings, schoolYear: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Học kỳ hiện tại</label>
              <select
                disabled={!isAdmin}
                value={settings.semester}
                onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
              >
                <option value="Học kỳ I">Học kỳ I</option>
                <option value="Học kỳ II">Học kỳ II</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operating Switches */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Chế độ báo cáo & Bán trú</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={settings.enableAfternoonSession}
                onChange={(e) => setSettings({ ...settings, enableAfternoonSession: e.target.checked })}
                className="mt-0.5 rounded text-blue-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Báo cáo cả Buổi Sáng và Buổi Chiều</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Mỗi GVCN báo cáo riêng 2 buổi sáng & chiều độc lập
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={settings.enableBoarding}
                onChange={(e) => setSettings({ ...settings, enableBoarding: e.target.checked })}
                className="mt-0.5 rounded text-amber-600"
              />
              <div>
                <span className="font-bold text-slate-900 block">Kích hoạt Quản lý Bán trú & Suất ăn</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Tự động tính số học sinh bán trú có mặt và số suất ăn trưa hằng ngày
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* CẤU HÌNH THỜI GIAN BÁO SĨ SỐ (Mục III) */}
        <div className="space-y-4 pt-2">
          <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase">
                    THỜI GIAN BÁO SĨ SỐ BUỔI SÁNG (MỤC III)
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Cấu hình mốc giờ mở, các đợt nhắc nhở, hạn cuối và giờ chốt sĩ số 20 lớp
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
                Múi giờ: Asia/Ho_Chi_Minh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">1. Bắt đầu nhận báo cáo</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.morningStartTime || '06:45'}
                  onChange={(e) => setSettings({ ...settings, morningStartTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 06:45</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">2. Giờ nhắc lần 1</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.morningReminder1Time || '07:05'}
                  onChange={(e) => setSettings({ ...settings, morningReminder1Time: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-blue-900"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 07:05</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">3. Giờ nhắc lần 2</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.morningReminder2Time || '07:15'}
                  onChange={(e) => setSettings({ ...settings, morningReminder2Time: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-amber-900"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 07:15</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">4. Hạn cuối báo cáo</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.morningDeadlineTime || '07:20'}
                  onChange={(e) => setSettings({ ...settings, morningDeadlineTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-rose-300 rounded-lg text-rose-900 font-black"
                />
                <span className="text-[10px] text-rose-600 font-medium">Hạn chót: 07:20</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">5. Dự kiến chốt sĩ số</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.morningFinalizeTargetTime || '07:30'}
                  onChange={(e) => setSettings({ ...settings, morningFinalizeTargetTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 07:30</span>
              </div>
            </div>

            {/* Quyền nộp sớm / nộp muộn & Hạn sửa riêng (Mục VI, XII, LXXX) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200/60">
              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.allowEarlySubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, allowEarlySubmission: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cho phép nộp sớm</span>
                  <span className="text-[10px] text-slate-500 block">Nộp trước {settings.morningStartTime || '06:45'}</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.allowLateSubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, allowLateSubmission: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cho phép nộp muộn</span>
                  <span className="text-[10px] text-slate-500 block">Ghi nhận số phút sau {settings.morningDeadlineTime || '07:20'}</span>
                </div>
              </label>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Hạn sửa báo cáo (phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  disabled={!isAdmin}
                  value={settings.revisionDeadlineMinutes || 10}
                  onChange={(e) =>
                    setSettings({ ...settings, revisionDeadlineMinutes: Number(e.target.value) || 10 })
                  }
                  className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Khóa sổ tự động
                </label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.autoLockTime || '11:30'}
                  onChange={(e) => setSettings({ ...settings, autoLockTime: e.target.value })}
                  className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* CẤU HÌNH THỜI GIAN BÁO SĨ SỐ BUỔI CHIỀU (MỤC XXVI) */}
          <div className="bg-indigo-50/60 rounded-2xl border border-indigo-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Sunset className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-indigo-950 uppercase">
                    THỜI GIAN BÁO SĨ SỐ BUỔI CHIỀU (MỤC XXVI)
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    Cấu hình mốc giờ mở, các đợt nhắc nhở, hạn cuối và giờ chốt sĩ số buổi chiều (giống như buổi sáng)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-indigo-200 text-indigo-950 px-2 py-0.5 rounded-full">
                Múi giờ: Asia/Ho_Chi_Minh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">1. Bắt đầu nhận báo cáo</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonStartTime || '13:00'}
                  onChange={(e) => setSettings({ ...settings, afternoonStartTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 13:00</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">2. Giờ nhắc lần 1</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonReminder1Time || '13:25'}
                  onChange={(e) => setSettings({ ...settings, afternoonReminder1Time: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-blue-900"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 13:25</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">3. Giờ nhắc lần 2</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonReminder2Time || '13:40'}
                  onChange={(e) => setSettings({ ...settings, afternoonReminder2Time: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-amber-900"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 13:40</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">4. Hạn cuối báo cáo</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonDeadlineTime || '13:45'}
                  onChange={(e) => setSettings({ ...settings, afternoonDeadlineTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-rose-300 rounded-lg text-rose-900 font-black"
                />
                <span className="text-[10px] text-rose-600 font-medium">Hạn chót: 13:45</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">5. Dự kiến chốt sĩ số</label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonFinalizeTargetTime || '13:55'}
                  onChange={(e) => setSettings({ ...settings, afternoonFinalizeTargetTime: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Mặc định: 13:55</span>
              </div>
            </div>

            {/* Quyền nộp sớm / nộp muộn & Hạn sửa riêng cho Buổi Chiều (Mục VI, XII, LXXX) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-200/60">
              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.afternoonAllowEarlySubmission ?? settings.allowEarlySubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, afternoonAllowEarlySubmission: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cho phép nộp sớm</span>
                  <span className="text-[10px] text-slate-500 block">Nộp trước {settings.afternoonStartTime || '13:00'}</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.afternoonAllowLateSubmission ?? settings.allowLateSubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, afternoonAllowLateSubmission: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Cho phép nộp muộn</span>
                  <span className="text-[10px] text-slate-500 block">Ghi nhận số phút sau {settings.afternoonDeadlineTime || '13:45'}</span>
                </div>
              </label>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Hạn sửa báo cáo (phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  disabled={!isAdmin}
                  value={settings.afternoonRevisionDeadlineMinutes ?? settings.revisionDeadlineMinutes ?? 10}
                  onChange={(e) =>
                    setSettings({ ...settings, afternoonRevisionDeadlineMinutes: Number(e.target.value) || 10 })
                  }
                  className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Khóa sổ tự động
                </label>
                <input
                  type="time"
                  disabled={!isAdmin}
                  value={settings.afternoonAutoLockTime || '17:30'}
                  onChange={(e) => setSettings({ ...settings, afternoonAutoLockTime: e.target.value })}
                  className="w-full mt-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* CÀI ĐẶT THÔNG BÁO & PUSH (Mục XLV) */}
          <div className="bg-blue-50/60 rounded-2xl border border-blue-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-blue-950 uppercase">
                    CÀI ĐẶT THÔNG BÁO & CẢNH BÁO TỰ ĐỘNG (MỤC XLV)
                  </h4>
                  <p className="text-[11px] text-blue-800">
                    Bật/tắt các loại nhắc nhở, cảnh báo quá hạn cho cả buổi sáng và buổi chiều
                  </p>
                </div>
              </div>

              {/* Web Push Permission Button */}
              <button
                type="button"
                onClick={async () => {
                  const perm = await notificationService.requestPushPermission();
                  setPushStatus(perm);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {pushStatus === 'granted'
                    ? 'ĐÃ BẬT THÔNG BÁO THIẾT BỊ'
                    : 'BẬT THÔNG BÁO TRÊN THIẾT BỊ NÀY'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.enableReminder1 ?? true}
                  onChange={(e) => setSettings({ ...settings, enableReminder1: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Bật nhắc lần 1 (S: {settings.morningReminder1Time || '07:05'} | C: {settings.afternoonReminder1Time || '13:25'})
                  </span>
                  <span className="text-[10px] text-slate-500 block">Chỉ nhắc các lớp chưa gửi</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.enableReminder2 ?? true}
                  onChange={(e) => setSettings({ ...settings, enableReminder2: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Bật nhắc lần 2 (S: {settings.morningReminder2Time || '07:15'} | C: {settings.afternoonReminder2Time || '13:40'})
                  </span>
                  <span className="text-[10px] text-slate-500 block">Ưu tiên cao, nhắc sát giờ hạn chót</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.enableOverdueAlert ?? true}
                  onChange={(e) => setSettings({ ...settings, enableOverdueAlert: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Bật cảnh báo quá hạn (S: {settings.morningDeadlineTime || '07:20'} | C: {settings.afternoonDeadlineTime || '13:45'})
                  </span>
                  <span className="text-[10px] text-slate-500 block">Cảnh báo GVCN & đưa lên TPT</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.notifyAdminOnSubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, notifyAdminOnSubmission: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Thông báo khi GVCN gửi báo cáo</span>
                  <span className="text-[10px] text-slate-500 block">Báo TPT biết ngay khi lớp nộp</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.notifyAdminOnResubmission ?? true}
                  onChange={(e) => setSettings({ ...settings, notifyAdminOnResubmission: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Thông báo khi gửi lại sau sửa</span>
                  <span className="text-[10px] text-slate-500 block">Báo TPT khi lớp sửa xong</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={settings.notifyAdminBeforeFinalize ?? true}
                  onChange={(e) => setSettings({ ...settings, notifyAdminBeforeFinalize: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Cảnh báo trước giờ chốt sổ</span>
                  <span className="text-[10px] text-slate-500 block">10 phút trước giờ chốt sổ dự kiến</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt Hệ Thống</span>
            </button>
          </div>
        )}
      </form>

      {/* Supabase Cloud Database Integration */}
      <SupabaseConnectCard />

      {/* Backup and Restore Section (Section XXXIX) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Sao lưu và Khôi phục dữ liệu (Bảo toàn số liệu)</span>
          </h3>

          <p className="text-slate-600 leading-relaxed">
            Dữ liệu sĩ số học sinh, danh sách lớp, hồ sơ bán trú và nhật ký kiểm toán được lưu trữ an toàn. Quản trị viên có thể xuất tệp sao lưu JSON để lưu trữ định kỳ hoặc tải lại khi cần khôi phục.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Tệp Sao Lưu (.JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Khôi Phục Từ Tệp Sao Lưu</span>
            </button>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Thiết Lập Năm Học 2026–2027</span>
            </button>

            <button
              onClick={handleClearDemoReports}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              title="Xóa các báo cáo thử nghiệm để đưa vào sử dụng thật"
            >
              <RefreshCw className="w-4 h-4 text-rose-700" />
              <span>Xóa Dữ Liệu Báo Cáo Demo</span>
            </button>

            <button
              onClick={handleResetDemoData}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu 20 lớp chuẩn để kiểm thử"
            >
              <RefreshCw className="w-4 h-4 text-amber-700" />
              <span>Khôi Phục Dữ Liệu Kiểm Thử</span>
            </button>
          </div>

          {lastBackupDate && (
            <div className="text-[11px] text-slate-400 italic">
              Thời điểm sao lưu gần nhất: {new Date(lastBackupDate).toLocaleString('vi-VN')}
            </div>
          )}
        </div>
      )}

      {/* LỊCH SỬ NHẮC BÁO CÁO (Mục XXXVI, LIII) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <span>NHẬT KÝ & LỊCH SỬ NHẮC BÁO SĨ SỐ (MỤC XXXVI, LIII)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Tổng cộng: {reminderLogs.length} lượt nhắc
          </span>
        </div>

        {reminderLogs.length === 0 ? (
          <p className="text-slate-400 italic text-center py-4">Chưa có lượt nhắc nhở nào được phát.</p>
        ) : (
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-bold uppercase text-slate-600">
                <tr>
                  <th className="p-2">Thời gian</th>
                  <th className="p-2">Lớp</th>
                  <th className="p-2">GVCN</th>
                  <th className="p-2">Loại nhắc</th>
                  <th className="p-2">Kênh</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2">Nội dung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminderLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2 whitespace-nowrap text-slate-500 font-mono">{log.sentAt}</td>
                    <td className="p-2 font-bold text-slate-900">{log.className}</td>
                    <td className="p-2 text-slate-700">{log.teacherName}</td>
                    <td className="p-2">
                      <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                        {log.reminderType}
                      </span>
                    </td>
                    <td className="p-2 text-slate-500">{log.deliveryChannel || 'IN_APP'}</td>
                    <td className="p-2">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-600 max-w-xs truncate">{log.messageSummary || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Firebase Cloud Firestore Architecture Info (Section XXVIII) */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span>Trạng thái Lưu trữ & Kết nối Cloud Firestore</span>
          </div>
          <span className="bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
            LOCAL STORAGE ENGINE (READY FOR FIREBASE)
          </span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed">
          Hệ thống được thiết kế theo kiến trúc chuẩn Firestore Collections (<code className="text-amber-300">/users</code>, <code className="text-amber-300">/classes</code>, <code className="text-amber-300">/students</code>, <code className="text-amber-300">/attendanceReports</code>, <code className="text-amber-300">/auditLogs</code>). Khi nhà trường cấu hình Firebase Project ID trong môi trường thực tế, chỉ cần bật cờ <code className="text-emerald-400">USE_FIREBASE_BACKEND = true</code> trong file <code className="text-blue-300">src/services/firebaseAdapter.ts</code> để kết nối tức thì.
        </p>
      </div>

      <YearSetupWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Confirm Clear Demo Reports */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="XÓA DỮ LIỆU ĐIỂM DANH THỬ NGHIỆM"
        message="Thầy/Cô có chắc chắn muốn xóa toàn bộ dữ liệu báo cáo sĩ số thử nghiệm để sẵn sàng đưa hệ thống vào sử dụng thật? Danh sách 20 lớp và học sinh vẫn được giữ nguyên vẹn."
        confirmLabel="XÁC NHẬN XÓA"
        cancelLabel="HỦY"
        variant="danger"
        onConfirm={executeClearDemoReports}
        onCancel={() => setIsConfirmClearOpen(false)}
      />

      {/* Confirm Reset All Data to Demo */}
      <ConfirmDialog
        isOpen={isConfirmResetOpen}
        title="KHÔI PHỤC DỮ LIỆU MẪU BAN ĐẦU"
        message="Thầy/Cô chắc chắn muốn khôi phục lại dữ liệu mẫu ban đầu của Trường THCS Bản Bo? Tất cả dữ liệu hiện tại sẽ được thay thế bằng dữ liệu chuẩn 20 lớp (Khối 6-9) và các tài khoản mẫu."
        confirmLabel="KHÔI PHỤC"
        cancelLabel="HỦY"
        variant="warning"
        onConfirm={executeResetDemoData}
        onCancel={() => setIsConfirmResetOpen(false)}
      />
    </div>
  );
};
