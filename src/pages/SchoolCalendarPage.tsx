import React, { useState, useEffect } from 'react';
import { schoolCalendarService } from '../services/schoolCalendarService';
import { storageService } from '../services/storageService';
import { DayType, SchoolCalendarDay, SchoolSettings } from '../types';
import { formatVietnameseDate } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Sun,
  ShieldCheck,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../theme/designSystem';

export const SchoolCalendarPage: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings>(() => storageService.getSettings());
  const [calendarDays, setCalendarDays] = useState<SchoolCalendarDay[]>(() =>
    schoolCalendarService.getCalendarDays()
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form thêm ngày đặc biệt
  const [newDate, setNewDate] = useState('');
  const [newDayType, setNewDayType] = useState<DayType>('NO_SCHOOL_DAY');
  const [newTitle, setNewTitle] = useState('');
  const [newAttendanceRequired, setNewAttendanceRequired] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  const loadDays = () => {
    setCalendarDays(schoolCalendarService.getCalendarDays());
  };

  useEffect(() => {
    loadDays();
    const handleUpdated = () => loadDays();
    window.addEventListener('thcs_banbo_calendar_updated', handleUpdated);
    return () => window.removeEventListener('thcs_banbo_calendar_updated', handleUpdated);
  }, []);

  const handleToggleSaturday = () => {
    const updated: SchoolSettings = {
      ...settings,
      enableSaturday: !settings.enableSaturday,
    };
    setSettings(updated);
    storageService.saveSettings(updated);
    storageService.addAuditLog(
      'Quản trị viên',
      `Thay đổi lịch học Thứ Bảy: ${!settings.enableSaturday ? 'Bật học Thứ Bảy' : 'Tắt học Thứ Bảy'}`,
      'settings',
      'CẬP NHẬT LỊCH HỌC'
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddCalendarDay = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newDate || !newTitle.trim()) {
      setFormError('Vui lòng chọn ngày và nhập tên sự kiện / tiêu đề.');
      return;
    }

    const newDay: SchoolCalendarDay = {
      date: newDate,
      dayType: newDayType,
      title: newTitle.trim(),
      isAttendanceRequired: newAttendanceRequired,
      note: newNote.trim() || undefined,
    };

    const ok = schoolCalendarService.saveCalendarDay(newDay);
    if (ok) {
      storageService.addAuditLog(
        'Quản trị viên',
        `Thêm lịch đặc biệt ngày ${newDate}: "${newTitle}" (${newAttendanceRequired ? 'Có điểm danh' : 'Không điểm danh'})`,
        'settings',
        'CẬP NHẬT LỊCH'
      );
      // Reset form
      setNewDate('');
      setNewTitle('');
      setNewNote('');
      setNewDayType('NO_SCHOOL_DAY');
      setNewAttendanceRequired(false);
      setFormError(null);
      loadDays();
    }
  };

  const handleDeleteCalendarDay = (date: string) => {
    setDeletingDate(date);
  };

  const executeDeleteCalendarDay = () => {
    if (!deletingDate) return;
    const date = deletingDate;
    schoolCalendarService.deleteCalendarDay(date);
    storageService.addAuditLog(
      'Quản trị viên',
      `Xóa cấu hình ngày đặc biệt ${date}`,
      'settings',
      'XÓA LỊCH ĐẶC BIỆT'
    );
    setDeletingDate(null);
    loadDays();
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
              Cấu hình ngày học
            </span>
            <span className="text-xs text-slate-500">Mục IV, LXXI, LXXII</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            LỊCH HOẠT ĐỘNG & BÁO SĨ SỐ TRƯỜNG
          </h2>
          <p className="text-xs text-slate-500">
            Trường THCS Bản Bo · Không gửi nhắc báo cáo vào ngày nghỉ lễ, ngày nghỉ đột xuất
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt lịch!</span>
          </div>
        )}
      </div>

      {/* ==================================================
          CẤU HÌNH THEO NGÀY TRONG TUẦN (Mục IV)
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>LỊCH HỌC CHÍNH KHÓA THEO THỨ TRONG TUẦN</span>
          </h3>
          <p className="text-xs text-slate-500">
            Hệ thống tự động kích hoạt tiến trình điểm danh cho các ngày học được bật
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'].map((day) => (
            <div
              key={day}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center"
            >
              <div className="text-xs font-bold text-emerald-950">{day}</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">Học chính khóa</div>
            </div>
          ))}

          {/* Thứ Bảy có toggle */}
          <div
            className={`p-3 border rounded-xl text-center transition-all ${
              settings.enableSaturday
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-bold text-slate-900">Thứ Bảy</div>
            <button
              type="button"
              onClick={handleToggleSaturday}
              className={`mt-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                settings.enableSaturday
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {settings.enableSaturday ? 'Đang bật có học' : 'Nghỉ (Mặc định)'}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          THÊM NGÀY NGHỈ / HỌC BÙ ĐẶC BIỆT
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>THÊM NGÀY NGHỈ LỄ, NGHỈ ĐỘT XUẤT HOẶC HỌC BÙ</span>
          </h3>
          <p className="text-xs text-slate-500">
            Ví dụ: Ngày nghỉ rét đậm vùng cao Bản Bo (NO_SCHOOL_DAY) hoặc Thứ Bảy học bù (SPECIAL_SCHOOL_DAY)
          </p>
        </div>

        <form onSubmit={handleAddCalendarDay} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Chọn ngày:</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Loại ngày:</label>
            <select
              value={newDayType}
              onChange={(e) => {
                const val = e.target.value as DayType;
                setNewDayType(val);
                if (val === 'HOLIDAY' || val === 'NO_SCHOOL_DAY') {
                  setNewAttendanceRequired(false);
                } else if (val === 'SPECIAL_SCHOOL_DAY' || val === 'SCHOOL_DAY') {
                  setNewAttendanceRequired(true);
                }
              }}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold"
            >
              <option value="NO_SCHOOL_DAY">NO_SCHOOL_DAY (Ngày nghỉ đột xuất)</option>
              <option value="HOLIDAY">HOLIDAY (Nghỉ lễ tết)</option>
              <option value="SPECIAL_SCHOOL_DAY">SPECIAL_SCHOOL_DAY (Học bù / Sự kiện đặc biệt)</option>
              <option value="SCHOOL_DAY">SCHOOL_DAY (Ngày học bình thường)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề / Lý do:</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Nghỉ bão lụt đột xuất / Học bù Thứ Bảy..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>LƯU NGÀY</span>
            </button>
          </div>

          <div className="sm:col-span-12 flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={newAttendanceRequired}
                onChange={(e) => setNewAttendanceRequired(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <span>Yêu cầu báo cáo sĩ số trong ngày này (isAttendanceRequired = true)</span>
            </label>
          </div>

          {formError && (
            <div className="sm:col-span-12 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </form>
      </div>

      {/* ==================================================
          DANH SÁCH CÁC NGÀY ĐẶC BIỆT ĐÃ CẤU HÌNH
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
          DANH SÁCH NGÀY ĐẶC BIỆT ĐÃ CẤU HÌNH ({calendarDays.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="p-3">Ngày</th>
                <th className="p-3">Tiêu đề / Lý do</th>
                <th className="p-3">Loại ngày</th>
                <th className="p-3">Điểm danh?</th>
                <th className="p-3">Ghi chú</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calendarDays.map((day) => (
                <tr key={day.date} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                    {day.date}
                    <div className="text-[10px] text-slate-400 font-normal">
                      {formatVietnameseDate(day.date)}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{day.title}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        day.dayType === 'HOLIDAY'
                          ? 'bg-rose-100 text-rose-800'
                          : day.dayType === 'NO_SCHOOL_DAY'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {day.dayType}
                    </span>
                  </td>
                  <td className="p-3">
                    {day.isAttendanceRequired ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Có</span>
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Không</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{day.note || '-'}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteCalendarDay(day.date)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa ngày này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Calendar Day */}
      <ConfirmDialog
        isOpen={Boolean(deletingDate)}
        title="XÓA LỊCH ĐẶC BIỆT"
        message={`Thầy/Cô có chắc chắn muốn xóa cấu hình đặc biệt cho ngày ${deletingDate}? Hệ thống sẽ hoàn nguyên về lịch học chuẩn.`}
        confirmLabel="XÓA NGÀY"
        cancelLabel="HỦY"
        variant="danger"
        onConfirm={executeDeleteCalendarDay}
        onCancel={() => setDeletingDate(null)}
      />
    </div>
  );
};
