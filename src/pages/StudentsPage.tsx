import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { exportService } from '../services/exportService';
import { Student, SchoolClass, StudentType, StudentStatus } from '../types';
import { ETHNIC_GROUPS } from '../config/constants';
import {
  GraduationCap,
  Plus,
  Upload,
  FileSpreadsheet,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  X,
  Phone,
  CheckCircle2,
  ArrowRightLeft,
  AlertCircle,
  RotateCcw,
  Database,
  RefreshCw,
  CloudCheck,
} from 'lucide-react';
import { ConfirmDialog } from '../theme/designSystem';

interface StudentsPageProps {
  onSelectStudentProfile?: (studentId: string) => void;
  onNavigate?: (page: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onSelectStudentProfile, onNavigate }) => {
  const { isAdmin, currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const classes = storageService.getClasses();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number>(0);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  // Single Student Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    fullName: '',
    dateOfBirth: '2014-01-01',
    gender: 'male' as 'male' | 'female' | 'UNSET',
    classId: classes[0]?.id || '',
    studentType: 'day' as StudentType,
    parentName: '',
    parentPhone: '',
    ethnicGroup: 'Thái',
    address: 'Bản Bo',
    notes: '',
    status: 'active' as StudentStatus,
  });

  // Batch Add Modal
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchClassId, setBatchClassId] = useState<string>(classes[0]?.id || '');
  const [batchText, setBatchText] = useState('');

  // Delete All Modal
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Import feedback
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Lắng nghe thay đổi dữ liệu học sinh từ Supabase hoặc các màn hình khác
  useEffect(() => {
    const handleUpdate = () => {
      setStudents(storageService.getStudents());
    };
    window.addEventListener('thcs_banbo_students_changed', handleUpdate);
    window.addEventListener('thcs_banbo_reports_changed', handleUpdate);

    // Luôn đảm bảo danh sách học sinh đầy đủ nhất từ Supabase
    if (storageService.getStudents().length === 0) {
      supabaseService.pullFromSupabase().catch(() => {});
    }

    return () => {
      window.removeEventListener('thcs_banbo_students_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_reports_changed', handleUpdate);
    };
  }, []);

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    setImportNotice(null);
    setImportError(null);
    try {
      const pullRes = await supabaseService.pullFromSupabase();
      if (pullRes.success) {
        const cur = storageService.getStudents();
        setStudents(cur);
        setImportNotice(`Đã đồng bộ thành công! Hiện có ${cur.length} học sinh được lưu trữ bảo mật trên Supabase đám mây.`);
      } else {
        const pushRes = await supabaseService.pushAllToSupabase();
        const cur = storageService.getStudents();
        setStudents(cur);
        setImportNotice(pushRes.message);
      }
    } catch (e: any) {
      setImportError(`Lỗi đồng bộ Supabase: ${e?.message || 'Không thể kết nối'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (gradeFilter > 0 && s.grade !== gradeFilter) return false;
      if (classFilter !== 'all' && s.classId !== classFilter) return false;
      if (typeFilter !== 'all' && s.studentType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(term);
        const matchCode = s.code.toLowerCase().includes(term);
        const matchPhone = s.parentPhone && s.parentPhone.includes(term);
        if (!matchName && !matchCode && !matchPhone) return false;
      }
      return true;
    });
  }, [students, statusFilter, gradeFilter, classFilter, typeFilter, searchTerm]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      code: `HS${Date.now().toString().slice(-4)}`,
      fullName: '',
      dateOfBirth: '2014-01-01',
      gender: 'male',
      classId: classes[0]?.id || '',
      studentType: 'day',
      parentName: '',
      parentPhone: '',
      ethnicGroup: 'Thái',
      address: 'Bản Bo',
      notes: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setEditingStudent(stu);
    setFormData({
      code: stu.code,
      fullName: stu.fullName,
      dateOfBirth: stu.dateOfBirth,
      gender: stu.gender,
      classId: stu.classId,
      studentType: stu.studentType || (stu.boardingType === 'BOARDING' ? 'boarding' : 'day'),
      parentName: stu.parentName || '',
      parentPhone: stu.parentPhone || '',
      ethnicGroup: stu.ethnicGroup || 'Thái',
      address: stu.address || 'Bản Bo',
      notes: stu.notes || '',
      status: stu.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find(c => c.id === formData.classId);
    const bType = formData.studentType === 'boarding' ? 'BOARDING' : 'NON_BOARDING';

    const saved: Student = {
      id: editingStudent ? editingStudent.id : `stu_${Date.now()}`,
      code: formData.code.trim(),
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      classId: formData.classId,
      className: targetClass?.name || '',
      grade: targetClass?.grade || 6,
      boardingType: bType,
      studentType: formData.studentType,
      parentName: formData.parentName.trim() || undefined,
      parentPhone: formData.parentPhone.trim() || undefined,
      ethnicGroup: formData.ethnicGroup,
      address: formData.address,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    };

    if (editingStudent && editingStudent.boardingType !== bType) {
      storageService.addAuditLog(
        'Phạm Ngọc Thúy',
        `Thay đổi diện học sinh ${saved.fullName} (${saved.className}) từ ${editingStudent.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'} sang ${bType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}`,
        'student',
        'ĐỔI LOẠI BÁN TRÚ'
      );
    }

    storageService.saveStudent(saved);
    storageService.addAuditLog(
      'Quản trị viên',
      `${editingStudent ? 'Cập nhật' : 'Thêm mới'} học sinh ${saved.fullName} (Lớp ${saved.className})`,
      'student',
      editingStudent ? 'SỬA HỌC SINH' : 'THÊM HỌC SINH'
    );

    setStudents(storageService.getStudents());
    setIsModalOpen(false);
  };

  const handleDelete = (stu: Student) => {
    setDeletingStudent(stu);
  };

  const executeDeleteStudent = () => {
    if (!deletingStudent) return;
    const stu = deletingStudent;
    storageService.deleteStudent(stu.id);
    storageService.addAuditLog('Quản trị viên', `Xóa học sinh ${stu.fullName}`, 'student', 'XÓA HỌC SINH');
    setStudents(storageService.getStudents());
    setDeletingStudent(null);
  };

  const executeDeleteAllStudents = () => {
    const res = storageService.deleteAllStudents(currentUser?.name || 'Quản trị viên');
    setStudents([]);
    setIsDeleteAllModalOpen(false);
    setImportNotice(`Đã xóa sạch toàn bộ ${res.count} học sinh trong hệ thống thành công. Sĩ số các lớp đã được đặt lại về 0.`);
  };

  const handleRestoreDefaultStudents = () => {
    const res = storageService.restoreDefaultStudents(currentUser?.name || 'Quản trị viên');
    setStudents(storageService.getStudents());
    setImportNotice(`Đã khôi phục thành công toàn bộ ${res.count} học sinh danh sách gốc của 20 lớp Trường THCS Bản Bo!`);
  };

  // Batch Add handler
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find(c => c.id === batchClassId);
    if (!targetClass) return;

    const lines = batchText.split('\n').filter(l => l.trim().length > 0);
    const newStudents: Student[] = [];

    lines.forEach((line, index) => {
      // Split by tab, comma or semicolon
      const parts = line.split(/[,\t;]+/).map(p => p.trim());
      const fullName = parts[0];
      if (!fullName) return;

      const gender = (parts[1] && parts[1].toLowerCase().includes('nữ')) ? 'female' : 'male';
      const isBoarding = parts[2] && parts[2].toLowerCase().includes('bán');
      const ethnicGroup = parts[3] || 'Thái';
      const address = parts[4] || 'Bản Bo';

      newStudents.push({
        id: `stu_batch_${Date.now()}_${index}`,
        code: `HS${targetClass.grade}${String(students.length + index + 1).padStart(3, '0')}`,
        fullName,
        dateOfBirth: '2014-01-01',
        gender,
        classId: targetClass.id,
        className: targetClass.name,
        grade: targetClass.grade,
        boardingType: isBoarding ? 'BOARDING' : 'NON_BOARDING',
        studentType: isBoarding ? 'boarding' : 'day',
        ethnicGroup,
        address,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    });

    storageService.batchSaveStudents(newStudents);
    storageService.addAuditLog('Quản trị viên', `Nhập nhanh ${newStudents.length} học sinh vào lớp ${targetClass.name}`, 'student', 'NHẬP HÀNG LOẠT');
    setStudents(storageService.getStudents());
    setIsBatchOpen(false);
    setBatchText('');
    setImportNotice(`Đã thêm thành công ${newStudents.length} học sinh vào lớp ${targetClass.name}!`);
  };

  // Import Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const res = exportService.parseStudentImportFile(buffer);
      if (!res.success) {
        setImportError(res.error || 'Lỗi đọc tệp Excel/CSV');
        return;
      }

      // Convert imported rows into full Students
      const newItems: Student[] = [];
      res.data.forEach((p: any, idx: number) => {
        const clsMatch = classes.find(c => c.name.toLowerCase() === (p.className || '').toLowerCase()) || classes[0];
        const isBoarding = p.studentType === 'boarding' || p.boardingType === 'BOARDING';
        newItems.push({
          id: `stu_imp_${Date.now()}_${idx}`,
          code: p.code || `HS${Date.now().toString().slice(-4)}${idx}`,
          fullName: p.fullName || 'Học sinh',
          dateOfBirth: p.dateOfBirth || '2014-01-01',
          gender: p.gender || 'male',
          classId: clsMatch.id,
          className: clsMatch.name,
          grade: clsMatch.grade,
          boardingType: isBoarding ? 'BOARDING' : 'NON_BOARDING',
          studentType: isBoarding ? 'boarding' : 'day',
          parentName: p.parentName,
          parentPhone: p.parentPhone,
          ethnicGroup: p.ethnicGroup || 'Thái',
          address: p.address || 'Bản Bo',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      });

      storageService.batchSaveStudents(newItems);
      storageService.addAuditLog('Quản trị viên', `Import ${newItems.length} học sinh từ tệp Excel ${file.name}`, 'student', 'IMPORT EXCEL');
      setStudents(storageService.getStudents());
      setImportNotice(`Đã nhập thành công ${newItems.length} học sinh từ file ${file.name}!`);
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Quản lý hồ sơ
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>DANH SÁCH HỌC SINH TOÀN TRƯỜNG</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {students.length} học sinh ({students.filter(s => s.studentType === 'boarding').length} Bán trú, {students.filter(s => s.studentType === 'day').length} Ngoại trú)
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleSyncSupabase}
              disabled={isSyncingSupabase}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
              title="Đồng bộ danh sách học sinh với đám mây Supabase PostgreSQL"
            >
              <Database className={`w-4 h-4 text-emerald-600 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Đang đồng bộ...' : 'Đồng bộ Supabase'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Nhập danh sách từ Excel hoặc CSV"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Import Excel/CSV</span>
            </button>

            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Dán nhanh danh sách học sinh theo hàng"
            >
              <span>Nhập nhiều HS</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm 1 học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Xóa toàn bộ danh sách học sinh của tất cả các lớp"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa tất cả học sinh</span>
            </button>
          </div>
        )}
      </div>

      {/* Notice feedback */}
      {importNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importNotice}</span>
          </div>
          <button onClick={() => setImportNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{importError}</span>
          </div>
          <button onClick={() => setImportError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="col-span-2 sm:col-span-1 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tên học sinh, mã HS..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(Number(e.target.value))}
            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value={0}>Tất cả Khối</option>
            <option value={6}>Khối 6</option>
            <option value={7}>Khối 7</option>
            <option value={8}>Khối 8</option>
            <option value={9}>Khối 9</option>
          </select>
        </div>

        <div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">Tất cả Lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">Tất cả (Bán & Ngoại trú)</option>
            <option value="boarding">Chỉ Bán trú</option>
            <option value="day">Chỉ Ngoại trú</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="transferred">Chuyển trường</option>
            <option value="dropped">Nghỉ học</option>
            <option value="temporary_leave">Tạm nghỉ</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3 text-center">STT</th>
                <th className="p-3">Mã HS</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Ngày sinh</th>
                <th className="p-3">Giới tính</th>
                <th className="p-3">Lớp</th>
                <th className="p-3">Dân tộc</th>
                <th className="p-3">Loại HS</th>
                <th className="p-3">Phụ huynh & SĐT</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Cơ sở dữ liệu học sinh hiện đang trống
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Toàn bộ học sinh mẫu thử nghiệm đã được dọn sạch. Bạn hãy tải lên tệp Excel danh sách học sinh chuẩn của Trường THCS Bản Bo.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => onNavigate('import_students')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Tải lên file học sinh chuẩn (.xls / .xlsx)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer border border-slate-300"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                          <span>Thêm học sinh thủ công</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, index) => (
                  <tr key={stu.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-bold">{index + 1}</td>
                    <td className="p-3 font-mono text-slate-500">{stu.code}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <button
                        onClick={() => onSelectStudentProfile && onSelectStudentProfile(stu.id)}
                        className="hover:text-blue-600 hover:underline cursor-pointer text-left"
                      >
                        {stu.fullName}
                      </button>
                    </td>
                    <td className="p-3 text-slate-600">{stu.dateOfBirth}</td>
                    <td className="p-3 text-slate-700">
                      {stu.gender === 'female' ? 'Nữ' : 'Nam'}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{stu.className}</td>
                    <td className="p-3 text-slate-600">{stu.ethnicGroup || 'Thái'}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        stu.studentType === 'boarding'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {stu.studentType === 'boarding' ? 'Bán trú' : 'Ngoại trú'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      <div>{stu.parentName || '--'}</div>
                      {stu.parentPhone && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{stu.parentPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {stu.status === 'active' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Đang học
                        </span>
                      ) : stu.status === 'transferred' ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Chuyển trường
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Nghỉ học
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectStudentProfile && onSelectStudentProfile(stu.id)}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-semibold cursor-pointer"
                        >
                          Hồ sơ
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(stu)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Sửa học sinh"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(stu)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Student Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? `Chỉnh sửa: ${editingStudent.fullName}` : 'Thêm Học Sinh Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A..."
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Lớp học *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Diện học sinh {!isAdmin && <span className="text-[10px] text-rose-600 font-normal">(Chỉ Quản trị viên đổi)</span>}
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.studentType}
                    onChange={(e) => setFormData({ ...formData, studentType: e.target.value as any })}
                    className={`w-full p-2 rounded-lg text-slate-900 font-bold border ${
                      !isAdmin ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="boarding">Bán trú (Cố định)</option>
                    <option value="day">Ngoại trú (Cố định)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dân tộc</label>
                  <select
                    value={formData.ethnicGroup}
                    onChange={(e) => setFormData({ ...formData, ethnicGroup: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {ETHNIC_GROUPS.map(et => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Họ tên Phụ huynh</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Bố/mẹ học sinh..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">SĐT liên hệ</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="098..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Bản / Thôn cư trú</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bản Nà Bó, Bản Hợp 1..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Trạng thái học tập</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="active">Đang học</option>
                    <option value="transferred">Chuyển trường</option>
                    <option value="dropped">Nghỉ học</option>
                    <option value="temporary_leave">Tạm nghỉ</option>
                  </select>
                </div>
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
                  Lưu hồ sơ học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Add Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Nhập Nhiều Học Sinh Cùng Lúc (Dán danh sách)
              </h3>
              <button onClick={() => setIsBatchOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Chọn lớp tiếp nhận *</label>
                <select
                  value={batchClassId}
                  onChange={(e) => setBatchClassId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dán danh sách mỗi dòng 1 học sinh:
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Định dạng: <code>Họ và tên, Giới tính, Bán trú/Ngoại trú, Dân tộc, Bản</code>
                </p>
                <textarea
                  rows={8}
                  required
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={`Lò Văn Nam, Nam, Bán trú, Thái, Bản Nà Bó\nĐiêu Thị Thảo, Nữ, Bán trú, Thái, Bản Hợp 1\nNguyễn Thành Đạt, Nam, Ngoại trú, Kinh, Bản Bo`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Thêm tất cả vào lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Single Student Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingStudent)}
        title="XÓA HỌC SINH"
        message={`Thầy/Cô có chắc chắn muốn xóa học sinh ${deletingStudent?.fullName} (${deletingStudent?.code}) khỏi hệ thống?`}
        confirmLabel="XÓA HỌC SINH"
        cancelLabel="HỦY"
        variant="danger"
        onConfirm={executeDeleteStudent}
        onCancel={() => setDeletingStudent(null)}
      />

      {/* Confirm Delete ALL Students Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllModalOpen}
        title="XÁC NHẬN XÓA TẤT CẢ HỌC SINH"
        message={`CẢNH BÁO QUAN TRỌNG: Thầy/Cô có chắc chắn muốn xóa TOÀN BỘ ${students.length} học sinh của tất cả 20 lớp trong hệ thống không? Toàn bộ danh sách học sinh sẽ được xóa sạch và sĩ số các lớp sẽ đưa về 0 để nhà trường nhập danh sách mới. Hành động này KHÔNG THỂ HOÀN TÁC!`}
        confirmLabel="XÓA TẤT CẢ HỌC SINH"
        cancelLabel="HỦY BỎ"
        variant="danger"
        onConfirm={executeDeleteAllStudents}
        onCancel={() => setIsDeleteAllModalOpen(false)}
      />
    </div>
  );
};
