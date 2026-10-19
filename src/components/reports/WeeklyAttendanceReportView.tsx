import React, { useState, useMemo } from 'react';
import { weeklyReportService } from '../../services/weeklyReportService';
import { SessionType } from '../../types';
import { getTodayDateString } from '../../utils/formatters';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface WeeklyAttendanceReportViewProps {
  currentDate: string;
  session: SessionType;
}

export const WeeklyAttendanceReportView: React.FC<WeeklyAttendanceReportViewProps> = ({
  currentDate = getTodayDateString(),
  session = 'MORNING',
}) => {
  const initialRange = useMemo(() => weeklyReportService.getWeekRange(currentDate), [currentDate]);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const weeklyData = useMemo(() => {
    return weeklyReportService.getWeeklyAttendance(startDate, endDate, session);
  }, [startDate, endDate, session]);

  const handlePrevWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const range = weeklyReportService.getWeekRange(`${y}-${m}-${day}`);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleNextWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const range = weeklyReportService.getWeekRange(`${y}-${m}-${day}`);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleCurrentWeek = () => {
    const range = weeklyReportService.getWeekRange(getTodayDateString());
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div className="space-y-4">
      {/* Date Range Navigation Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Báo cáo chuyên cần theo tuần
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            THỐNG KÊ CHUYÊN CẦN TUẦN HỌC
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Từ {startDate} đến {endDate} · Số ngày học thực tế: <strong className="text-slate-900">{weeklyData.schoolDaysCount}</strong> ngày
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handlePrevWeek}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tuần trước</span>
          </button>

          <button
            onClick={handleCurrentWeek}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold cursor-pointer"
          >
            Tuần này
          </button>

          <button
            onClick={handleNextWeek}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            title="Tuần sau"
          >
            <span className="hidden sm:inline">Tuần sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards (Mục XIV) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Số ngày học</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{weeklyData.schoolDaysCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Loại trừ ngày nghỉ/lễ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Tỉ lệ chuyên cần</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{weeklyData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{weeklyData.totalPresentSessions}/{weeklyData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Lượt có mặt</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{weeklyData.totalPresentSessions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{weeklyData.totalAbsentSessions}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Có phép: {weeklyData.totalExcusedSessions} · K.Phép: {weeklyData.totalUnexcusedSessions}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{weeklyData.totalLateCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">lượt đi muộn</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Về sớm</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{weeklyData.totalEarlyLeaveCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">lượt về sớm</div>
        </div>
      </div>

      {/* Daily Breakdown inside Week */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Diễn biến từng ngày trong tuần
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {weeklyData.daysBreakdown.map(day => (
            <div
              key={day.date}
              className={`p-3 rounded-xl border ${
                day.isSchoolDay
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-100/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="font-bold text-slate-900">{day.dayName}</div>
              <div className="text-[10px] text-slate-500">{day.date}</div>
              {day.isSchoolDay ? (
                <div className="mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Có mặt:</span>
                    <span className="font-bold text-emerald-800">{day.presentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vắng:</span>
                    <span className="font-bold text-rose-800">{day.absentCount}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Tỉ lệ:</span>
                    <span className="font-bold text-blue-900">{day.attendanceRate.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic mt-2">Ngày nghỉ / không học</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Class Statistics Table for the Week (Mục XV) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            THỐNG KÊ THEO 20 LỚP TRONG TUẦN
          </h4>
          <span className="text-xs text-slate-500">
            Công thức: Lượt có mặt / Tổng lượt dự kiến × 100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Lớp</th>
                <th className="p-3">GVCN</th>
                <th className="p-3 text-center">Sĩ số BQ</th>
                <th className="p-3 text-center">Số ngày học</th>
                <th className="p-3 text-center">Lượt có mặt</th>
                <th className="p-3 text-center">Lượt vắng</th>
                <th className="p-3 text-center">Có phép</th>
                <th className="p-3 text-center">Không phép</th>
                <th className="p-3 text-center">Đi muộn</th>
                <th className="p-3 text-center">Tỉ lệ chuyên cần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weeklyData.classStats.map(c => (
                <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.className}</td>
                  <td className="p-3 text-slate-700">{c.teacherName}</td>
                  <td className="p-3 text-center font-medium text-slate-800">{c.averageStudentCount}</td>
                  <td className="p-3 text-center text-slate-600">{c.schoolDaysCount}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{c.presentSessions}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{c.absentSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.excusedSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.unexcusedSessions}</td>
                  <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                  <td className="p-3 text-center font-extrabold text-blue-900">
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
