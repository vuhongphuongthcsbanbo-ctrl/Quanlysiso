import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { SchoolClass } from '../../types';

export interface FilterState {
  date: string;
  startDate: string;
  endDate: string;
  month: number;
  year: number;
  semester: 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
  grade: string; // 'ALL', '6', '7', '8', '9'
  classId: string; // 'ALL' or class ID
  boardingType: string; // 'ALL', 'BOARDING', 'NON_BOARDING'
  absenceType: string; // 'ALL', 'EXCUSED', 'UNEXCUSED'
  statusFilter: string; // 'ALL', 'APPROVED', 'LOCKED', 'PENDING'
  searchQuery: string;
}

interface ReportFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onApply?: () => void;
  onReset: () => void;
  classes: SchoolClass[];
  showDate?: boolean;
  showDateRange?: boolean;
  showMonth?: boolean;
  showSemester?: boolean;
  showGradeClass?: boolean;
  showBoarding?: boolean;
  showAbsenceType?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  filters,
  onChange,
  onApply,
  onReset,
  classes,
  showDate = true,
  showDateRange = false,
  showMonth = false,
  showSemester = false,
  showGradeClass = true,
  showBoarding = true,
  showAbsenceType = false,
  showStatus = false,
  showSearch = false,
  searchPlaceholder = 'Tìm học sinh...',
}) => {
  const filteredClasses = filters.grade !== 'ALL'
    ? classes.filter(c => String(c.grade) === filters.grade)
    : classes;

  const update = (key: keyof FilterState, val: any) => {
    onChange({ ...filters, [key]: val });
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs print:hidden space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Bộ lọc báo cáo & thống kê
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>XÓA BỘ LỌC</span>
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              ÁP DỤNG
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {/* Date */}
        {showDate && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày báo cáo</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        )}

        {/* Date Range: From */}
        {showDateRange && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        )}

        {/* Date Range: To */}
        {showDateRange && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        )}

        {/* Month */}
        {showMonth && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tháng (Năm học 2026–2027)</label>
            <select
              value={filters.month}
              onChange={(e) => update('month', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value={9}>Tháng 9 / 2026</option>
              <option value={10}>Tháng 10 / 2026</option>
              <option value={11}>Tháng 11 / 2026</option>
              <option value={12}>Tháng 12 / 2026</option>
              <option value={1}>Tháng 1 / 2027</option>
              <option value={2}>Tháng 2 / 2027</option>
              <option value={3}>Tháng 3 / 2027</option>
              <option value={4}>Tháng 4 / 2027</option>
              <option value={5}>Tháng 5 / 2027</option>
            </select>
          </div>
        )}

        {/* Semester */}
        {showSemester && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Học kỳ / Năm học</label>
            <select
              value={filters.semester}
              onChange={(e) => update('semester', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="SEMESTER_1">Học kỳ I (09/2026 – 01/2027)</option>
              <option value="SEMESTER_2">Học kỳ II (01/2027 – 05/2027)</option>
              <option value="FULL_YEAR">Cả năm học (2026–2027)</option>
            </select>
          </div>
        )}

        {/* Grade */}
        {showGradeClass && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Khối học</label>
            <select
              value={filters.grade}
              onChange={(e) => {
                const g = e.target.value;
                onChange({ ...filters, grade: g, classId: 'ALL' });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Tất cả các khối</option>
              <option value="6">Khối 6 (6A1–6A5)</option>
              <option value="7">Khối 7 (7A1–7A5)</option>
              <option value="8">Khối 8 (8A1–8A5)</option>
              <option value="9">Khối 9 (9A1–9A5)</option>
            </select>
          </div>
        )}

        {/* Class */}
        {showGradeClass && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Lớp học</label>
            <select
              value={filters.classId}
              onChange={(e) => update('classId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Tất cả các lớp</option>
              {filteredClasses.map(c => (
                <option key={c.id} value={c.name}>
                  Lớp {c.name} {c.teacherName ? `(${c.teacherName})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Boarding / Day */}
        {showBoarding && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Bán trú / Ngoại trú</label>
            <select
              value={filters.boardingType}
              onChange={(e) => update('boardingType', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Tất cả đối tượng</option>
              <option value="BOARDING">Học sinh Bán trú</option>
              <option value="NON_BOARDING">Học sinh Ngoại trú</option>
            </select>
          </div>
        )}

        {/* Absence Type */}
        {showAbsenceType && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Phân loại vắng</label>
            <select
              value={filters.absenceType}
              onChange={(e) => update('absenceType', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Có phép & Không phép</option>
              <option value="EXCUSED">Chỉ vắng có phép</option>
              <option value="UNEXCUSED">Chỉ vắng không phép</option>
            </select>
          </div>
        )}

        {/* Status */}
        {showStatus && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Trạng thái báo cáo</label>
            <select
              value={filters.statusFilter}
              onChange={(e) => update('statusFilter', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã duyệt / Đã khóa</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REVISION">Cần chỉnh sửa</option>
              <option value="NOT_SUBMITTED">Chưa gửi báo cáo</option>
            </select>
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={filters.searchQuery}
                onChange={(e) => update('searchQuery', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
