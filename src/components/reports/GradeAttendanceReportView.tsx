import React, { useState, useMemo } from 'react';
import { dailyReportService, GradeGroupSummary } from '../../services/dailyReportService';
import { SessionType } from '../../types';
import { formatVietnameseDate, getTodayDateString } from '../../utils/formatters';
import { Building2, Calendar, CheckCircle2 } from 'lucide-react';

interface GradeAttendanceReportViewProps {
  currentDate: string;
  session: SessionType;
}

export const GradeAttendanceReportView: React.FC<GradeAttendanceReportViewProps> = ({
  currentDate = getTodayDateString(),
  session = 'MORNING',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');

  const reportData = useMemo(() => {
    return dailyReportService.getDailyAttendanceReport(selectedDate, session);
  }, [selectedDate, session]);

  const displayedGrades = useMemo(() => {
    if (selectedGrade === 'ALL') return reportData.gradeGroups;
    return reportData.gradeGroups.filter(g => g.grade === selectedGrade);
  }, [reportData.gradeGroups, selectedGrade]);

  return (
    <div className="space-y-4">
      {/* Top Banner (Mục X) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Báo cáo tổng hợp theo khối
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            TÌNH HÌNH SĨ SỐ 4 KHỐI (KHỐI 6, 7, 8, 9)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngày {formatVietnameseDate(selectedDate)} · Buổi sáng · Tổng cộng 20 lớp (mỗi khối 5 lớp A1–A5)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Grade Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-bold">
            <button
              onClick={() => setSelectedGrade('ALL')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                selectedGrade === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả 4 Khối
            </button>
            {[6, 7, 8, 9].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  selectedGrade === g ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Grade Cards & Tables (Mục X) */}
      <div className="space-y-4">
        {displayedGrades.map(g => (
          <div key={g.grade} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header of Grade Card */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                  {g.grade}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase">
                    {g.gradeLabel} (5 LỚP: {g.grade}A1 – {g.grade}A5)
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    Đã duyệt: {g.approvedClassesCount}/{g.totalClassesCount} lớp · Sĩ số: {g.totalStudents} HS
                  </div>
                </div>
              </div>

              {/* Grade Stats Pill */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Có mặt:</span>{' '}
                  <strong className="text-emerald-800 font-bold">{g.presentCount}</strong>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Vắng:</span>{' '}
                  <strong className="text-rose-800 font-bold">{g.absentCount}</strong>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Bán trú:</span>{' '}
                  <strong className="text-purple-800 font-bold">{g.boardingPresent}/{g.boardingTotal}</strong>
                </div>
                <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Tỉ lệ:</span>{' '}
                  <strong className="text-blue-900 font-extrabold">{g.attendanceRate.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Table of Classes in this Grade */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <th className="p-3 w-16">Lớp</th>
                    <th className="p-3">GVCN</th>
                    <th className="p-3 text-center">Sĩ số</th>
                    <th className="p-3 text-center">Có mặt</th>
                    <th className="p-3 text-center">Vắng</th>
                    <th className="p-3 text-center">Có phép</th>
                    <th className="p-3 text-center">Không phép</th>
                    <th className="p-3 text-center">Đi muộn</th>
                    <th className="p-3 text-center">Bán trú</th>
                    <th className="p-3 text-center">Ngoại trú</th>
                    <th className="p-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {g.classes.map(c => (
                    <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{c.className}</td>
                      <td className="p-3 text-slate-700">{c.teacherName}</td>
                      <td className="p-3 text-center font-medium">{c.totalStudents}</td>
                      <td className="p-3 text-center font-bold text-emerald-800">
                        {c.isApproved ? c.presentCount : '--'}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-800">
                        {c.isApproved ? c.absentCount : '--'}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {c.isApproved ? c.excusedAbsentCount : '--'}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {c.isApproved ? c.unexcusedAbsentCount : '--'}
                      </td>
                      <td className="p-3 text-center text-purple-700">
                        {c.isApproved ? c.lateCount : '--'}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {c.isApproved ? `${c.boardingPresent}/${c.boardingTotal}` : '--'}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {c.isApproved ? `${c.nonBoardingPresent}/${c.nonBoardingTotal}` : '--'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
