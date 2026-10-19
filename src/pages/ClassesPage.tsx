import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { exportService } from '../services/exportService';
import { SchoolClass } from '../types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Users,
  Home,
  CheckCircle2,
  Phone,
  X,
  AlertCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../theme/designSystem';

interface ClassesPageProps {
  onSelectClassDetails?: (classId: string) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ onSelectClassDetails }) => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>(() => storageService.getClasses());
  const teachers = storageService.getUsers().filter(u => u.role === 'teacher_gvcn');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    grade: 6,
    teacherId: '',
    room: '',
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      code: '',
      name: '',
      grade: 6,
      teacherId: '',
      room: '',
      isActive: true,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setFormData({
      code: cls.code,
      name: cls.name,
      grade: cls.grade,
      teacherId: cls.teacherId || '',
      room: cls.room || '',
      isActive: cls.isActive,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Vui lòng nhập tên lớp.');
      return;
    }

    const assignedTeacher = teachers.find(t => t.id === formData.teacherId);

    const newClass: SchoolClass = {
      id: editingClass ? editingClass.id : `cls_${formData.name.toLowerCase().replace(/\s+/g, '')}`,
      code: formData.code.trim() || formData.name.toUpperCase(),
      name: formData.name.toUpperCase(),
      grade: Number(formData.grade),
      teacherId: formData.teacherId || undefined,
      teacherName: assignedTeacher?.name,
      teacherPhone: assignedTeacher?.phone,
      room: formData.room,
      isActive: formData.isActive,
    };

    storageService.saveClass(newClass);
    storageService.addAuditLog(
      'Quản trị viên',
      `${editingClass ? 'Cập nhật' : 'Thêm mới'} lớp ${newClass.name} (Khối ${newClass.grade})`,
      'class',
      editingClass ? 'SỬA LỚP' : 'TẠO LỚP'
    );

    setClasses(storageService.getClasses());
    setIsModalOpen(false);
  };

  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (cls: SchoolClass) => {
    setDeleteError(null);
    setDeletingClass(cls);
  };

  const executeDeleteClass = () => {
    if (!deletingClass) return;
    const cls = deletingClass;
    const success = storageService.deleteClass(cls.id);
    if (!success) {
      setDeleteError(`Không thể xóa lớp ${cls.name} vì lớp đang có học sinh. Vui lòng chuyển hết học sinh sang lớp khác trước.`);
      setDeletingClass(null);
    } else {
      storageService.addAuditLog('Quản trị viên', `Xóa lớp ${cls.name}`, 'class', 'XÓA LỚP');
      setClasses(storageService.getClasses());
      setDeletingClass(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Cơ cấu tổ chức trường học
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>QUẢN LÝ DANH SÁCH LỚP HỌC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: {classes.length} lớp học đang hoạt động trong năm học
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm lớp mới</span>
          </button>
        )}
      </div>

      {deleteError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-rose-600 hover:text-rose-900 text-xs font-bold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {classes.map(cls => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                    {cls.name}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Lớp {cls.name}</h3>
                    <div className="text-[11px] text-slate-500 font-medium">Khối {cls.grade} · {cls.room || 'Phòng học'}</div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Sửa lớp"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Xóa lớp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* GVCN */}
              <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Giáo viên chủ nhiệm</div>
                <div className="font-bold text-slate-800 mt-0.5">{cls.teacherName || 'Chưa phân công'}</div>
                {cls.teacherPhone && (
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5 text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{cls.teacherPhone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Tổng sĩ số</div>
                  <div className="text-lg font-black text-slate-900">{cls.totalStudents || 0}</div>
                  <div className="text-[10px] text-slate-500">Nam: {cls.maleCount || 0} · Nữ: {cls.femaleCount || 0}</div>
                </div>

                <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <div className="text-[10px] text-amber-800 font-semibold uppercase">Bán trú / Ngoại trú</div>
                  <div className="text-lg font-black text-amber-950">{cls.boardingCount || 0} BT</div>
                  <div className="text-[10px] text-amber-800">Ngoại trú: {cls.dayCount || 0}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => exportService.exportClassStudentsExcel(cls.id)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                title="Xuất danh sách lớp ra Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>

              {onSelectClassDetails && (
                <button
                  onClick={() => onSelectClassDetails(cls.id)}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Xem học sinh
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Thêm Lớp Học Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tên lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 6A1, 7A3, 8B..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-bold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Khối *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phòng học</label>
                  <input
                    type="text"
                    placeholder="Phòng 101..."
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Giáo viên chủ nhiệm</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.phone || 'Chưa có SĐT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Class Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingClass)}
        title="XÓA LỚP HỌC"
        message={`Thầy/Cô có chắc chắn muốn xóa lớp ${deletingClass?.name}? Thao tác này chỉ xóa được nếu lớp không có học sinh.`}
        confirmLabel="XÓA LỚP"
        cancelLabel="HỦY"
        variant="danger"
        onConfirm={executeDeleteClass}
        onCancel={() => setDeletingClass(null)}
      />
    </div>
  );
};
