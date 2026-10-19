import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { PageId } from '../components/common/Sidebar';
import { Student } from '../types';
import {
  Building2,
  Users,
  UtensilsCrossed,
  Search,
  GraduationCap,
  ArrowLeft,
  Phone,
  ShieldAlert,
} from 'lucide-react';

interface TeacherClassPageProps {
  onNavigateHome: () => void;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const TeacherClassPage: React.FC<TeacherClassPageProps> = ({
  onNavigateHome,
  onSelectStudentProfile,
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'boarding' | 'non_boarding'>('all');

  const assignedClass = useMemo(() => {
    if (!currentUser?.assignedClassId) return null;
    return storageService.getClassById(currentUser.assignedClassId) || null;
  }, [currentUser]);

  const students: Student[] = useMemo(() => {
    if (!assignedClass) return [];
    return storageService.getStudentsByClass(assignedClass.id).filter(s => s.status === 'active' || !s.status);
  }, [assignedClass]);

  if (!assignedClass) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Bạn chưa được phân công lớp chủ nhiệm</h2>
      </div>
    );
  }

  const maleCount = students.filter(s => s.gender === 'male').length;
  const femaleCount = students.filter(s => s.gender === 'female').length;
  const boardingCount = students.filter(s => s.boardingType === 'BOARDING').length;
  const nonBoardingCount = students.filter(s => s.boardingType === 'NON_BOARDING').length;

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filterType === 'boarding' && s.boardingType !== 'BOARDING') return false;
      if (filterType === 'non_boarding' && s.boardingType !== 'NON_BOARDING') return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(term);
        const matchCode = s.code.toLowerCase().includes(term);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [students, filterType, searchTerm]);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={onNavigateHome}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-black text-slate-900 uppercase">
            LỚP {assignedClass.name} – TRƯỜNG THCS BẢN BO
          </h1>
          <div className="text-xs text-slate-500">
            GVCN: <strong>{currentUser?.name}</strong> · Phòng: <strong>{assignedClass.room || 'Phòng học bộ môn'}</strong>
          </div>
        </div>
      </div>

      {/* Class Metrics */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="text-xs font-bold text-slate-700 uppercase">
          TỔNG QUAN SĨ SỐ LỚP
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-xl">
            <div className="text-[10px] text-slate-500">Sĩ số</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{students.length}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded-xl">
            <div className="text-[10px] text-blue-700">Nam/Nữ</div>
            <div className="text-sm font-bold text-blue-900 mt-0.5">{maleCount}/{femaleCount}</div>
          </div>
          <div className="bg-amber-50 p-2 rounded-xl">
            <div className="text-[10px] text-amber-700">Bán trú</div>
            <div className="text-lg font-black text-amber-800 mt-0.5">{boardingCount}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <div className="text-[10px] text-slate-600">Ngoại trú</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{nonBoardingCount}</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 italic text-center pt-1">
          * Diện Bán trú/Ngoại trú do Quản trị viên/Tổng Phụ trách thiết lập cố định theo hồ sơ.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên hoặc mã học sinh..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex gap-1.5 text-xs">
          {[
            { key: 'all', label: `Tất cả (${students.length})` },
            { key: 'boarding', label: `Bán trú (${boardingCount})` },
            { key: 'non_boarding', label: `Ngoại trú (${nonBoardingCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filterType === f.key
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase">
          Danh sách học sinh ({filtered.length}):
        </div>

        {filtered.map((stu, idx) => (
          <div
            key={stu.id}
            onClick={() => onSelectStudentProfile?.(stu.id)}
            className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 w-5 text-center font-mono">
                {idx + 1}
              </span>
              <div>
                <div className="text-xs font-black text-slate-900">{stu.fullName}</div>
                <div className="text-[10px] text-slate-500">
                  Mã: {stu.code} · {stu.gender === 'male' ? 'Nam' : 'Nữ'} · Dân tộc: {stu.ethnicGroup || 'Thái'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                stu.boardingType === 'BOARDING'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {stu.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
