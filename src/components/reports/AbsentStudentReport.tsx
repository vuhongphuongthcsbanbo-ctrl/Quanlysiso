import React, { useState, useMemo } from 'react';
import { AttendanceRecord, SchoolClass, SessionType } from '../../types';
import { formatVietnameseDate } from '../../utils/formatters';
import { excelExportService } from '../../services/excelExportService';
import { Search, FileSpreadsheet, UserX, AlertCircle, UtensilsCrossed, Calendar } from 'lucide-react';

interface AbsentStudentReportProps {
  date: string;
  session: SessionType;
  absentRecords: AttendanceRecord[];
  classes: SchoolClass[];
  canExport: boolean;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const AbsentStudentReport: React.FC<AbsentStudentReportProps> = ({
  date,
  session,
  absentRecords,
  classes,
  canExport,
  onSelectStudentProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [absenceFilter, setAbsenceFilter] = useState<'ALL' | 'EXCUSED' | 'UNEXCUSED'>('ALL');
  const [boardingFilter, setBoardingFilter] = useState<'ALL' | 'BOARDING' | 'NON_BOARDING'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // Filter absent students (Mục LXX, LXXI)
  const filtered = useMemo(() => {
    return absentRecords.filter(r => {
      // Search by name or class or student code
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesClass = r.className.toLowerCase().includes(q);
        const matchesCode = (r.studentCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesClass && !matchesCode) return false;
      }

      // Absence type filter
      const st = String(r.status).toUpperCase();
      const isExcused = st === 'ABSENT_EXCUSED' || (st === 'OTHER' && r.absenceType === 'excused');
      const isUnexcused = st === 'ABSENT_UNEXCUSED' || st === 'FULL_DAY_ABSENCE' || (st === 'OTHER' && r.absenceType === 'unexcused');

      if (absenceFilter === 'EXCUSED' && !isExcused) return false;
      if (absenceFilter === 'UNEXCUSED' && !isUnexcused) return false;

      // Boarding filter
      if (boardingFilter === 'BOARDING' && r.boardingType !== 'BOARDING') return false;
      if (boardingFilter === 'NON_BOARDING' && r.boardingType !== 'NON_BOARDING') return false;

      // Grade filter
      if (gradeFilter !== 'ALL' && String(r.grade) !== gradeFilter) return false;

      return true;
    });
  }, [absentRecords, searchQuery, absenceFilter, boardingFilter, gradeFilter]);

  const handleExportExcel = () => {
    setIsExporting(true);
    excelExportService.exportAbsentStudentsExcel(date, filtered);
    setTimeout(() => setIsExporting(false), 800);
  };

  const excusedCount = absentRecords.filter(
    r => String(r.status).toUpperCase() === 'ABSENT_EXCUSED' || r.absenceType === 'excused'
  ).length;
  const unexcusedCount = absentRecords.filter(
    r => String(r.status).toUpperCase() === 'ABSENT_UNEXCUSED' || r.absenceType === 'unexcused'
  ).length;
  const boardingAbsentCount = absentRecords.filter(r => r.boardingType === 'BOARDING').length;

  return (
    <div className="space-y-4">
      {/* Header and KPI summary for absent students */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Theo dõi học sinh vắng trong ngày
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            DANH SÁCH HỌC SINH VẮNG NGÀY {formatVietnameseDate(date).toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <strong className="text-slate-800">{absentRecords.length}</strong> học sinh vắng (Có phép: <strong className="text-amber-700">{excusedCount}</strong>, Không phép: <strong className="text-rose-700">{unexcusedCount}</strong>, Bán trú vắng: <strong className="text-purple-700">{boardingAbsentCount}</strong>)
          </p>
        </div>

        {canExport && (
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
              isExporting
                ? 'bg-emerald-400 text-white cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting ? 'ĐANG TẠO FILE...' : 'Xuất Excel danh sách vắng'}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar (Mục LXX, LXXI) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Search input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm học sinh theo tên, lớp, mã HS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Absence type pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setAbsenceFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              absenceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({absentRecords.length})
          </button>
          <button
            onClick={() => setAbsenceFilter('EXCUSED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              absenceFilter === 'EXCUSED' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Có phép ({excusedCount})
          </button>
          <button
            onClick={() => setAbsenceFilter('UNEXCUSED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              absenceFilter === 'UNEXCUSED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Không phép ({unexcusedCount})
          </button>
        </div>

        {/* Boarding filter select */}
        <select
          value={boardingFilter}
          onChange={(e) => setBoardingFilter(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700"
        >
          <option value="ALL">Bán trú & Ngoại trú</option>
          <option value="BOARDING">Chỉ học sinh Bán trú</option>
          <option value="NON_BOARDING">Chỉ học sinh Ngoại trú</option>
        </select>

        {/* Grade filter select */}
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700"
        >
          <option value="ALL">Tất cả Khối 6–9</option>
          <option value="6">Khối 6</option>
          <option value="7">Khối 7</option>
          <option value="8">Khối 8</option>
          <option value="9">Khối 9</option>
        </select>
      </div>

      {/* Absent Students Table (Mục XI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">
              {absentRecords.length === 0
                ? 'Không có học sinh vắng trong các lớp đã được duyệt hôm nay.'
                : 'Không tìm thấy học sinh phù hợp với bộ lọc.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3 text-center">Lớp</th>
                  <th className="p-3 text-center">Khối</th>
                  <th className="p-3 text-center">Diện</th>
                  <th className="p-3 text-center">Loại vắng</th>
                  <th className="p-3">Lí do</th>
                  <th className="p-3 text-center">Buổi</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, idx) => {
                  const st = String(r.status).toUpperCase();
                  const isExcused = st === 'ABSENT_EXCUSED' || (st === 'OTHER' && r.absenceType === 'excused');
                  const isBoarding = r.boardingType === 'BOARDING';

                  return (
                    <tr
                      key={r.id || `${r.studentId}_${idx}`}
                      onClick={() => onSelectStudentProfile?.(r.studentId)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div>{r.studentName}</div>
                        {r.studentCode && (
                          <div className="text-[10px] font-mono text-slate-400">{r.studentCode}</div>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{r.className}</td>
                      <td className="p-3 text-center text-slate-600">Khối {r.grade}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBoarding
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isBoarding ? 'Bán trú' : 'Ngoại trú'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isExcused
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isExcused ? 'Có phép' : 'Không phép'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700 max-w-xs truncate">
                        {r.reason || 'Chưa ghi rõ'}
                      </td>
                      <td className="p-3 text-center text-slate-600">Buổi sáng</td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate">
                        {r.note || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
