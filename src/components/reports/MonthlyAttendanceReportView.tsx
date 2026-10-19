import React, { useState, useMemo } from 'react';
import { monthlyReportService } from '../../services/monthlyReportService';
import { excelExportService } from '../../services/excelExportService';
import { SessionType } from '../../types';
import {
  FileSpreadsheet,
  AlertTriangle,
  UserX,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react';

interface MonthlyAttendanceReportViewProps {
  session: SessionType;
  canExport: boolean;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const MonthlyAttendanceReportView: React.FC<MonthlyAttendanceReportViewProps> = ({
  session = 'MORNING',
  canExport,
  onSelectStudentProfile,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(3);
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const monthData = useMemo(() => {
    return monthlyReportService.getMonthlyAttendance(
      selectedYear,
      selectedMonth,
      threshold,
      gradeFilter !== 'ALL' ? Number(gradeFilter) : undefined,
      undefined,
      session
    );
  }, [selectedYear, selectedMonth, threshold, gradeFilter, session]);

  const handleExportExcel = () => {
    setIsExporting(true);
    excelExportService.exportMonthlyReportExcel(selectedYear, selectedMonth);
    setTimeout(() => setIsExporting(false), 1000);
  };

  const comp = monthData.comparisonWithPreviousMonth;

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Báo cáo định kỳ tháng
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            BÁO CÁO CHUYÊN CẦN THÁNG {selectedMonth}/{selectedYear}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Năm học 2026–2027 · Số ngày học trong tháng: <strong className="text-slate-900">{monthData.schoolDaysCount}</strong> ngày (đã loại trừ ngày nghỉ lễ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Select Month */}
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number);
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 cursor-pointer"
          >
            <option value="2026-9">Tháng 9 / 2026</option>
            <option value="2026-10">Tháng 10 / 2026</option>
            <option value="2026-11">Tháng 11 / 2026</option>
            <option value="2026-12">Tháng 12 / 2026</option>
            <option value="2027-1">Tháng 1 / 2027</option>
            <option value="2027-2">Tháng 2 / 2027</option>
            <option value="2027-3">Tháng 3 / 2027</option>
            <option value="2027-4">Tháng 4 / 2027</option>
            <option value="2027-5">Tháng 5 / 2027</option>
          </select>

          {/* Select Grade */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 cursor-pointer"
          >
            <option value="ALL">Tất cả Khối 6–9</option>
            <option value="6">Khối 6</option>
            <option value="7">Khối 7</option>
            <option value="8">Khối 8</option>
            <option value="9">Khối 9</option>
          </select>

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
              <span>{isExporting ? 'ĐANG TẠO FILE...' : 'Xuất Excel tháng'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Mục XVIII) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Ngày học</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{monthData.schoolDaysCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ngày thực học</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Chuyên cần tháng</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{monthData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{monthData.totalPresentSessions}/{monthData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Lượt có mặt</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{monthData.totalPresentSessions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{monthData.totalAbsentSessions}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Có phép: {monthData.totalExcusedSessions} · K.Phép: {monthData.totalUnexcusedSessions}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{monthData.totalLateCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">lượt trong tháng</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">HS có phát sinh nghỉ</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{monthData.studentsWithAbsenceCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">học sinh</div>
        </div>
      </div>

      {/* Month-over-Month Comparison (Mục LXXIV) */}
      {comp && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase">So sánh với {comp.previousMonthLabel}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Lượt vắng:</span>
              <strong className="text-slate-900">{comp.currentAbsent}</strong>
              <span className="text-slate-400">vs {comp.previousAbsent}</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                comp.absentDiff < 0 ? 'bg-emerald-100 text-emerald-800' : comp.absentDiff > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {comp.absentDiff > 0 ? `+${comp.absentDiff}` : comp.absentDiff} lượt
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tỉ lệ chuyên cần:</span>
              <strong className="text-slate-900">{comp.currentRate.toFixed(1)}%</strong>
              <span className="text-slate-400">vs {comp.previousRate.toFixed(1)}%</span>
              <span className={`font-bold px-1.5 py-0.2 rounded ${
                comp.rateDiff > 0 ? 'bg-emerald-100 text-emerald-800' : comp.rateDiff < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {comp.rateDiff > 0 ? `+${comp.rateDiff}%` : `${comp.rateDiff}%`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section: HỌC SINH CÓ NHIỀU LƯỢT VẮNG (Mục XIX, XX) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Theo dõi học sinh có nhiều lượt vắng (Mục XIX)
            </div>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              DANH SÁCH HỌC SINH CÓ TỪ {threshold} LƯỢT VẮNG TRỞ LÊN
            </div>
            <div className="text-[11px] text-slate-500 italic mt-0.5">
              * Chỉ số chỉ phục vụ công tác theo dõi và phối hợp phụ huynh của nhà trường, không dùng làm kết luận kỷ luật.
            </div>
          </div>

          {/* Threshold Switcher (Mục XIX: Từ 3 lượt, từ 5 lượt, từ 10 lượt) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <span className="text-slate-500 px-2">Ngưỡng:</span>
            {[3, 5, 10].map(val => (
              <button
                key={val}
                onClick={() => setThreshold(val)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  threshold === val ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Từ {val} lượt
              </button>
            ))}
          </div>
        </div>

        {monthData.frequentAbsentStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold">Không có học sinh nào đạt ngưỡng từ {threshold} lượt vắng trở lên trong tháng này.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3 text-center">Lớp</th>
                  <th className="p-3 text-center">Khối</th>
                  <th className="p-3 text-center">Diện</th>
                  <th className="p-3 text-center">Tổng lượt vắng</th>
                  <th className="p-3 text-center">Có phép</th>
                  <th className="p-3 text-center">Không phép</th>
                  <th className="p-3 text-center">Đi muộn</th>
                  <th className="p-3">Ngày vắng gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthData.frequentAbsentStudents.map((st, idx) => (
                  <tr
                    key={st.studentId}
                    onClick={() => onSelectStudentProfile?.(st.studentId)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{st.studentName}</div>
                      {st.studentCode && (
                        <div className="text-[10px] font-mono text-slate-400">{st.studentCode}</div>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">{st.className}</td>
                    <td className="p-3 text-center text-slate-600">Khối {st.grade}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.boardingType === 'Bán trú' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {st.boardingType}
                      </span>
                    </td>
                    <td className="p-3 text-center font-black text-rose-900 text-sm">
                      {st.totalAbsent}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-800">{st.excusedCount}</td>
                    <td className="p-3 text-center font-bold text-rose-800">{st.unexcusedCount}</td>
                    <td className="p-3 text-center text-purple-700">{st.lateCount}</td>
                    <td className="p-3 text-slate-600">
                      <div>{st.lastAbsentDate}</div>
                      {st.lastReason && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-xs">{st.lastReason}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Statistics for Month */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            THỐNG KÊ CHI TIẾT 20 LỚP TRONG THÁNG
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Lớp</th>
                <th className="p-3">GVCN</th>
                <th className="p-3 text-center">Sĩ số</th>
                <th className="p-3 text-center">Số ngày</th>
                <th className="p-3 text-center">Lượt có mặt</th>
                <th className="p-3 text-center">Lượt vắng</th>
                <th className="p-3 text-center">Có phép</th>
                <th className="p-3 text-center">Không phép</th>
                <th className="p-3 text-center">Đi muộn</th>
                <th className="p-3 text-center">Tỉ lệ chuyên cần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthData.classStats.map(c => (
                <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.className}</td>
                  <td className="p-3 text-slate-700">{c.teacherName}</td>
                  <td className="p-3 text-center font-medium">{c.totalStudents}</td>
                  <td className="p-3 text-center text-slate-600">{c.schoolDaysCount}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{c.presentSessions}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{c.absentSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.excusedSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.unexcusedSessions}</td>
                  <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                  <td className="p-3 text-center font-black text-blue-900">
                    {c.attendanceRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
