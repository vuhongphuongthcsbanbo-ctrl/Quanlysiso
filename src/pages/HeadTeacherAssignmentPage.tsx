import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { teacherService } from '../services/teacherService';
import { teacherAssignmentService } from '../services/teacherAssignmentService';
import { SchoolClass, Teacher, TeacherAssignment } from '../types';
import {
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Calendar,
  History,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export const HeadTeacherAssignmentPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>(() => storageService.getClasses());
  const [teachers, setTeachers] = useState<Teacher[]>(() => teacherService.getTeachers());

  const [assignments, setAssignments] = useState<TeacherAssignment[]>(() =>
    teacherAssignmentService.getAssignments()
  );
  const [activeTab, setActiveTab] = useState<'classes' | 'history' | 'temporary'>('classes');

  // Modal State for Assign/Change
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [selectedNewTeacherId, setSelectedNewTeacherId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [changeReason, setChangeReason] = useState('');
  const [isChangingExisting, setIsChangingExisting] = useState(false);

  // Modal State for Temporary Substitute
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  const [tempClass, setTempClass] = useState<SchoolClass | null>(null);
  const [tempTeacherId, setTempTeacherId] = useState('');
  const [tempFromDate, setTempFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [tempToDate, setTempToDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [tempReason, setTempReason] = useState('');

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const refreshData = () => {
    setClasses(storageService.getClasses());
    setTeachers(teacherService.getTeachers());
    setAssignments(teacherAssignmentService.getAssignments());
  };

  const handleClearDemoGvcn = () => {
    storageService.clearAllDemoHeadTeachersData();
    refreshData();
    showNotify('success', 'Đã xóa toàn bộ dữ liệu giáo viên chủ nhiệm demo thành công!');
  };

  // Tính thống kê 20 lớp (Mục XXVII)
  const totalClasses = classes.length;
  const assignedCount = classes.filter(c => c.teacherName && c.teacherName !== 'Chưa phân công').length;
  const unassignedCount = totalClasses - assignedCount;

  // Active Teachers available for assignment
  const activeTeachers = teachers.filter(t => t.employmentStatus === 'ACTIVE');

  // Mở modal Gán / Thay GVCN
  const handleOpenAssignModal = (cls: SchoolClass) => {
    setSelectedClass(cls);
    const hasExisting = !!cls.teacherId && cls.teacherName !== 'Chưa phân công';
    setIsChangingExisting(hasExisting);
    setSelectedNewTeacherId('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setChangeReason(hasExisting ? '' : 'Phân công giáo viên chủ nhiệm đầu năm học');
    setIsAssignModalOpen(true);
  };

  // Xác nhận phân công hoặc thay GVCN
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedNewTeacherId) return;

    if (isChangingExisting) {
      // Thay đổi GVCN
      const res = teacherAssignmentService.changeHeadTeacher(
        selectedClass.id,
        selectedNewTeacherId,
        effectiveDate,
        changeReason,
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      if (res.success) {
        showNotify('success', res.message);
        setIsAssignModalOpen(false);
        refreshData();
      } else {
        showNotify('error', res.message);
      }
    } else {
      // Phân công mới
      const res = teacherAssignmentService.assignHeadTeacher(
        selectedClass.id,
        selectedNewTeacherId,
        effectiveDate,
        changeReason,
        currentUser?.id || 'admin_tpt',
        currentUser?.name || 'Phạm Ngọc Thúy'
      );
      if (res.success) {
        showNotify('success', res.message);
        setIsAssignModalOpen(false);
        refreshData();
      } else {
        showNotify('error', res.message);
      }
    }
  };

  // Mở modal phân công tạm thời
  const handleOpenTempModal = (cls: SchoolClass) => {
    setTempClass(cls);
    setTempTeacherId('');
    setTempFromDate(new Date().toISOString().split('T')[0]);
    setTempToDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setTempReason('');
    setIsTempModalOpen(true);
  };

  const handleConfirmTempAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClass || !tempTeacherId) return;

    const res = teacherAssignmentService.addTemporaryTeacher(
      tempClass.id,
      tempTeacherId,
      tempFromDate,
      tempToDate,
      tempReason,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    if (res.success) {
      showNotify('success', res.message);
      setIsTempModalOpen(false);
      refreshData();
    } else {
      showNotify('error', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Trường THCS Bản Bo · Năm học 2026–2027
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Phân Công Giáo Viên Chủ Nhiệm (20 Lớp)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý phân công GVCN chính thức, lịch sử phân công và thay thế tạm thời cho Khối 6, 7, 8, 9
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeTab === 'classes' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              20 Lớp Chính Thức
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activeTab === 'history' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Lịch Sử Phân Công
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleClearDemoGvcn}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xóa toàn bộ dữ liệu giáo viên chủ nhiệm demo"
            >
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa GVCN Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* CẢNH BÁO NỔI BẬT NẾU CÒN LỚP CHƯA CÓ GVCN (Mục XXVII) */}
      {unassignedCount > 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 text-amber-800 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm">
                Còn {unassignedCount} lớp chưa được phân công GVCN chính thức!
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Các lớp thiếu GVCN sẽ không thể thực hiện báo cáo sĩ số bằng tài khoản giáo viên. Vui lòng gán
                GVCN cho các lớp bên dưới.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-bold">
            100% (20/20 lớp) đã được phân công đầy đủ Giáo viên Chủ nhiệm chính thức cho năm học 2026–2027.
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Lớp</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalClasses}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khối 6, 7, 8, 9</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Đã Có GVCN</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{assignedCount} / 20</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">lớp đã phân công</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Chưa Có GVCN</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{unassignedCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">cần phân công</div>
        </div>
      </div>

      {/* TAB 1: 20 LỚP CHÍNH THỨC */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 uppercase">
              Danh Sách Phân Công 20 Lớp (Năm Học 2026–2027)
            </h3>
            <span className="text-xs text-slate-500">Mỗi lớp có đúng 01 GVCN chính thức</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold w-16 text-center">Lớp</th>
                  <th className="p-3.5 font-bold w-16 text-center">Khối</th>
                  <th className="p-3.5 font-bold">Giáo viên chủ nhiệm hiện tại</th>
                  <th className="p-3.5 font-bold">Số điện thoại</th>
                  <th className="p-3.5 font-bold">Phòng học</th>
                  <th className="p-3.5 font-bold text-center">Trạng thái</th>
                  {isAdmin && <th className="p-3.5 font-bold text-center w-48">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map(cls => {
                  const hasTeacher = cls.teacherName && cls.teacherName !== 'Chưa phân công';
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-center font-black text-sm text-blue-700 bg-blue-50/30">
                        {cls.name}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-600">Khối {cls.grade}</td>
                      <td className="p-3.5">
                        {hasTeacher ? (
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span>{cls.teacherName}</span>
                          </div>
                        ) : (
                          <div className="text-amber-600 font-bold flex items-center gap-1.5 italic">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Chưa phân công GVCN</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{cls.teacherPhone || 'Chưa có'}</td>
                      <td className="p-3.5 text-slate-500">{cls.room || 'Phòng học chính'}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            hasTeacher ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {hasTeacher ? 'ĐÃ PHÂN CÔNG' : 'CHƯA CÓ GVCN'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(cls)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                hasTeacher
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              }`}
                            >
                              {hasTeacher ? 'Thay GVCN' : 'Gán GVCN'}
                            </button>

                            {hasTeacher && (
                              <button
                                type="button"
                                onClick={() => handleOpenTempModal(cls)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer"
                                title="Phân công giáo viên thay thế tạm thời (nghỉ ốm, tập huấn...)"
                              >
                                Tạm thời
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ PHÂN CÔNG (Mục XXV & XXVI) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase">
                Nhật Ký & Lịch Sử Phân Công GVCN
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lưu vết snapshot đầy đủ, không ghi đè âm thầm, bảo toàn báo cáo lịch sử
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
              Tổng {assignments.length} bản ghi
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Chưa có bản ghi phân công nào.</div>
            ) : (
              assignments
                .slice()
                .reverse()
                .map(asg => (
                  <div key={asg.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-xs">
                          Lớp {asg.className}
                        </span>
                        <span className="font-extrabold text-slate-900">{asg.teacherName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            asg.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : asg.status === 'TEMPORARY'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {asg.status === 'ACTIVE'
                            ? 'ĐANG HIỆU LỰC'
                            : asg.status === 'TEMPORARY'
                            ? 'THAY THẾ TẠM THỜI'
                            : 'ĐÃ KẾT THÚC'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Lý do: <strong>{asg.reason}</strong> · Người thực hiện: {asg.createdBy}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-medium">
                      <div>Từ: {asg.startDate}</div>
                      {asg.endDate && <div>Đến: {asg.endDate}</div>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG / THAY ĐỔI GVCN */}
      {isAssignModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {isChangingExisting
                    ? `Thay Đổi Giáo Viên Chủ Nhiệm · Lớp ${selectedClass.name}`
                    : `Phân Công GVCN Chính Thức · Lớp ${selectedClass.name}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Năm học 2026–2027 · Trường THCS Bản Bo</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-5 space-y-4">
              {isChangingExisting && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>GVCN hiện tại của lớp {selectedClass.name}:</span>
                  </div>
                  <div className="text-amber-800 font-extrabold text-sm pl-5">
                    {selectedClass.teacherName} ({selectedClass.teacherPhone || 'Chưa có SĐT'})
                  </div>
                  <p className="text-[11px] text-amber-700 pl-5">
                    Việc thay đổi GVCN sẽ tự động lưu vào lịch sử phân công và chuyển quyền báo cáo sĩ số cho GVCN mới
                    kể từ ngày hiệu lực.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chọn Giáo Viên Chủ Nhiệm Mới <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedNewTeacherId}
                  onChange={e => setSelectedNewTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold text-slate-800"
                >
                  <option value="">-- Chọn giáo viên đang công tác --</option>
                  {activeTeachers.map(t => {
                    const isAlreadyAssigned = !!t.assignedClassName && t.assignedClassName !== selectedClass.name;
                    return (
                      <option key={t.id} value={t.id} disabled={isAlreadyAssigned}>
                        {t.fullName} ({t.teacherCode}){' '}
                        {isAlreadyAssigned ? `[Đang CN Lớp ${t.assignedClassName}]` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mỗi giáo viên chỉ được phép chủ nhiệm một lớp theo quy định.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ngày có hiệu lực <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do phân công / thay đổi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={changeReason}
                  onChange={e => setChangeReason(e.target.value)}
                  placeholder="Ví dụ: Quyết định điều chuyển phân công đầu năm..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  XÁC NHẬN PHÂN CÔNG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG TẠM THỜI (Mục LII & LIII) */}
      {isTempModalOpen && tempClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-slate-900 text-base">
              Phân Công Giáo Viên Thay Thế Tạm Thời · Lớp {tempClass.name}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dùng cho trường hợp GVCN chính ({tempClass.teacherName}) nghỉ ốm, công tác, tập huấn. Giáo viên được
              phân công tạm thời sẽ có quyền báo cáo sĩ số cho lớp trong khoảng thời gian quy định mà không làm mất GVCN chính.
            </p>

            <form onSubmit={handleConfirmTempAssignment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Giáo viên báo cáo thay thế <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={tempTeacherId}
                  onChange={e => setTempTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden font-semibold"
                >
                  <option value="">-- Chọn giáo viên thay thế --</option>
                  {activeTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.teacherCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Từ ngày</label>
                  <input
                    type="date"
                    required
                    value={tempFromDate}
                    onChange={e => setTempFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Đến ngày</label>
                  <input
                    type="date"
                    required
                    value={tempToDate}
                    onChange={e => setTempToDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do thay thế tạm thời <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tempReason}
                  onChange={e => setTempReason(e.target.value)}
                  placeholder="Ví dụ: GVCN nghỉ thai sản 1 tuần, đi tập huấn..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTempModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Xác nhận thay thế tạm thời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
