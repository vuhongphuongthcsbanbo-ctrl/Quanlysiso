import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storageService';
import { Student, SchoolClass, User } from '../../types';
import { Search, X, User as UserIcon, Building2, Briefcase, ChevronRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (student: Student) => void;
  onSelectClass?: (cls: SchoolClass) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const students = useMemo(() => storageService.getStudents(), [isOpen]);
  const classes = useMemo(() => storageService.getClasses(), [isOpen]);
  const users = useMemo(() => storageService.getUsers(), [isOpen]);

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || term.length < 2) {
      return { students: [], classes: [], teachers: [] };
    }

    const filteredStudents = students
      .filter(
        s =>
          s.fullName.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.className.toLowerCase().includes(term) ||
          (s.parentPhone && s.parentPhone.includes(term))
      )
      .slice(0, 10);

    const filteredClasses = classes
      .filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          (c.teacherName && c.teacherName.toLowerCase().includes(term))
      )
      .slice(0, 5);

    const filteredTeachers = users
      .filter(
        u =>
          u.name.toLowerCase().includes(term) ||
          (u.assignedClassName && u.assignedClassName.toLowerCase().includes(term)) ||
          (u.phone && u.phone.includes(term))
      )
      .slice(0, 5);

    return {
      students: filteredStudents,
      classes: filteredClasses,
      teachers: filteredTeachers,
    };
  }, [searchTerm, students, classes, users]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden mt-10">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã HS, lớp, giáo viên, SĐT..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
          >
            Đóng [ESC]
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-slate-100">
          {searchTerm.length < 2 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nhập ít nhất 2 ký tự để tìm kiếm toàn hệ thống (Học sinh, Lớp, Giáo viên)
            </div>
          )}

          {searchTerm.length >= 2 &&
            results.students.length === 0 &&
            results.classes.length === 0 &&
            results.teachers.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">
                Không tìm thấy kết quả nào khớp với &quot;{searchTerm}&quot;
              </div>
            )}

          {/* Classes */}
          {results.classes.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Lớp học ({results.classes.length})
              </div>
              <div className="space-y-1">
                {results.classes.map(cls => (
                  <div
                    key={cls.id}
                    onClick={() => {
                      if (onSelectClass) onSelectClass(cls);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Lớp {cls.name} (Khối {cls.grade})
                        </div>
                        <div className="text-xs text-slate-500">
                          GVCN: {cls.teacherName || 'Chưa phân công'} · Sĩ số: {cls.totalStudents || 0} HS (Bán trú: {cls.boardingCount || 0})
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Students */}
          {results.students.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Học sinh ({results.students.length})
              </div>
              <div className="space-y-1">
                {results.students.map(stu => (
                  <div
                    key={stu.id}
                    onClick={() => {
                      if (onSelectStudent) onSelectStudent(stu);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        stu.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{stu.fullName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {stu.code}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            stu.studentType === 'boarding'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {stu.studentType === 'boarding' ? 'Bán trú' : 'Ngoại trú'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Lớp {stu.className} · Dân tộc: {stu.ethnicGroup || 'Kinh'} · Bản: {stu.address || 'Bản Bo'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teachers */}
          {results.teachers.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Giáo viên & Cán bộ ({results.teachers.length})
              </div>
              <div className="space-y-1">
                {results.teachers.map(tch => (
                  <div
                    key={tch.id}
                    className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{tch.name}</div>
                        <div className="text-xs text-slate-500">
                          {tch.title} {tch.assignedClassName ? `(Lớp ${tch.assignedClassName})` : ''} · SĐT: {tch.phone || '--'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
