import React, { useState, useMemo, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { attendanceService } from '../services/attendanceService';
import { exportService } from '../services/exportService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';
import {
  UserX,
  Search,
  Calendar,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Phone,
} from 'lucide-react';

interface AbsentStudentsPageProps {
  currentDate: string;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const AbsentStudentsPage: React.FC<AbsentStudentsPageProps> = ({
  currentDate,
}) => {
  // Filters (Section AD)
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [boardingTypeFilter, setBoardingTypeFilter] = useState<'all' | 'BOARDING' | 'NON_BOARDING'>('all');
  const [excusedFilter, setExcusedFilter] = useState<'all' | 'excused' | 'unexcused'>('all');

  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick(v => v + 1);
    window.addEventListener('thcs_banbo_students_changed', handleUpdate);
    window.addEventListener('thcs_banbo_classes_changed', handleUpdate);
    window.addEventListener('thcs_banbo_reports_changed', handleUpdate);
    return () => {
      window.removeEventListener('thcs_banbo_students_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_classes_changed', handleUpdate);
      window.removeEventListener('thcs_banbo_reports_changed', handleUpdate);
    };
  }, []);

  const classes = useMemo(() => storageService.getClasses(), [refreshTick]);

  // Load absents matching all filters
  const absentRecords = useMemo(() => {
    return attendanceService.getAbsentStudents(selectedDate, {
      grade: selectedGrade > 0 ? selectedGrade : undefined,
      classId: selectedClassId,
      boardingType: boardingTypeFilter,
      excused: excusedFilter,
      searchTerm: searchTerm.trim() || undefined,
      includePending: true,
    });
  }, [selectedDate, selectedGrade, selectedClassId, boardingTypeFilter, excusedFilter, searchTerm, refreshTick]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Tra cứu chuyên cần
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <UserX className="w-6 h-6 text-rose-600" />
            <span>TÌM KIẾM HỌC SINH VẮNG</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bộ lọc đa tiêu chí dành cho Tổng phụ trách & Ban Giám hiệu theo dõi sát sao
          </p>
        </div>

        <button
          onClick={() => exportService.exportDailyReportExcel(selectedDate)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* SECTION AD: MULTI-FILTER SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Bộ lọc tìm kiếm học sinh vắng
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Tên học sinh */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500"
            />
          </div>

          {/* 2. Ngày */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            />
          </div>

          {/* 3. Khối */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold cursor-pointer"
          >
            <option value={0}>Tất cả các khối</option>
            <option value={6}>Khối 6 (5 lớp)</option>
            <option value={7}>Khối 7 (5 lớp)</option>
            <option value={8}>Khối 8 (5 lớp)</option>
            <option value={9}>Khối 9 (5 lớp)</option>
          </select>

          {/* 4. Lớp */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold cursor-pointer"
          >
            <option value="all">Tất cả 20 lớp</option>
            {classes
              .filter(c => selectedGrade === 0 || c.grade === selectedGrade)
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          {/* 5. Bán trú / Ngoại trú */}
          <select
            value={boardingTypeFilter}
            onChange={(e) => setBoardingTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold cursor-pointer"
          >
            <option value="all">Tất cả diện học sinh</option>
            <option value="BOARDING">Học sinh Bán trú</option>
            <option value="NON_BOARDING">Học sinh Ngoại trú</option>
          </select>

          {/* 6. Có phép / Không phép */}
          <select
            value={excusedFilter}
            onChange={(e) => setExcusedFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold cursor-pointer"
          >
            <option value="all">Tất cả (Có phép & K.phép)</option>
            <option value="excused">Vắng có phép</option>
            <option value="unexcused">Vắng không phép</option>
          </select>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Kết quả tìm kiếm ({absentRecords.length} học sinh)
          </div>
          <div className="text-xs text-slate-500">
            Ngày {formatVietnameseDate(selectedDate)}
          </div>
        </div>

        {absentRecords.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-700 text-sm">
              Không tìm thấy học sinh vắng nào phù hợp với bộ lọc
            </div>
            <div className="text-xs text-slate-400">
              Thầy/cô thử mở rộng bộ lọc hoặc chọn ngày khác.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-extrabold uppercase text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">STT</th>
                  <th className="p-3">Mã HS</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Lớp</th>
                  <th className="p-3">Khối</th>
                  <th className="p-3">Diện HS</th>
                  <th className="p-3">Tình trạng</th>
                  <th className="p-3">Lí do</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absentRecords.map((rec, i) => {
                  const sUpper = (rec.status as string).toUpperCase();
                  const isBoarding = rec.boardingType === 'BOARDING' || rec.studentType === 'boarding';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="p-3 font-mono text-slate-500">{rec.studentCode}</td>
                      <td className="p-3 font-black text-slate-900">{rec.studentName}</td>
                      <td className="p-3 font-bold text-blue-900">{rec.className}</td>
                      <td className="p-3 text-slate-600">Khối {rec.grade}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isBoarding ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                        }`}>
                          {isBoarding ? 'Bán trú' : 'Ngoại trú'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          sUpper === 'ABSENT_EXCUSED'
                            ? 'bg-amber-100 text-amber-900'
                            : sUpper === 'ABSENT_UNEXCUSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {sUpper === 'ABSENT_EXCUSED' ? 'Vắng có phép' : sUpper === 'ABSENT_UNEXCUSED' ? 'Vắng không phép' : 'Đi muộn'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {rec.reason || 'Không rõ'}
                      </td>
                      <td className="p-3 text-slate-500 italic">
                        {rec.reasonDetail || rec.note || '--'}
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
