import React, { useState, useMemo } from 'react';
import { semesterReportService } from '../../services/semesterReportService';
import { SessionType } from '../../types';
import { Award, Building2, Calendar, CheckCircle2 } from 'lucide-react';

interface SemesterAttendanceReportViewProps {
  session: SessionType;
}

export const SemesterAttendanceReportView: React.FC<SemesterAttendanceReportViewProps> = ({
  session = 'MORNING',
}) => {
  const [period, setPeriod] = useState<'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR'>('SEMESTER_1');

  const reportData = useMemo(() => {
    return semesterReportService.getSemesterReport(period, session);
  }, [period, session]);

  return (
    <div className="space-y-4">
      {/* Period Selection Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Báo cáo định kỳ học kỳ & năm học
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            BÁO CÁO CHUYÊN CẦN {reportData.periodLabel.toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Giai đoạn: Từ {reportData.startDate} đến {reportData.endDate} · Số ngày đã ghi nhận: <strong className="text-slate-900">{reportData.totalDaysRecorded}</strong> ngày
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setPeriod('SEMESTER_1')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              period === 'SEMESTER_1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học kỳ I
          </button>
          <button
            onClick={() => setPeriod('SEMESTER_2')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              period === 'SEMESTER_2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học kỳ II
          </button>
          <button
            onClick={() => setPeriod('FULL_YEAR')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              period === 'FULL_YEAR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cả năm học 2026–2027
          </button>
        </div>
      </div>

      {/* KPI Cards (Mục XXI, XXII) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Tỉ lệ chuyên cần kỳ</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{reportData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{reportData.totalPresentSessions}/{reportData.totalExpectedSessions} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng lượt có mặt</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{reportData.totalPresentSessions}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lượt học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{reportData.totalAbsentSessions}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Có phép: {reportData.totalExcusedSessions} · K.Phép: {reportData.totalUnexcusedSessions}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{reportData.totalLateCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">lượt trong kỳ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Số ngày đã ghi nhận</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{reportData.totalDaysRecorded}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ngày có báo cáo đã duyệt</div>
        </div>
      </div>

      {/* Grade Level Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            TỔNG HỢP THEO KHỐI (6, 7, 8, 9)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Khối</th>
                <th className="p-3 text-center">Số lớp</th>
                <th className="p-3 text-center">Tổng HS</th>
                <th className="p-3 text-center">Lượt có mặt</th>
                <th className="p-3 text-center">Lượt vắng</th>
                <th className="p-3 text-center">Có phép</th>
                <th className="p-3 text-center">Không phép</th>
                <th className="p-3 text-center">Đi muộn</th>
                <th className="p-3 text-center">Tỉ lệ chuyên cần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.gradeStats.map(g => (
                <tr key={g.grade} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{g.gradeLabel}</td>
                  <td className="p-3 text-center text-slate-600">{g.totalClasses} lớp</td>
                  <td className="p-3 text-center font-medium">{g.totalStudents}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{g.presentSessions}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{g.absentSessions}</td>
                  <td className="p-3 text-center text-slate-700">{g.excusedSessions}</td>
                  <td className="p-3 text-center text-slate-700">{g.unexcusedSessions}</td>
                  <td className="p-3 text-center text-purple-700">{g.lateCount}</td>
                  <td className="p-3 text-center font-extrabold text-blue-900">{g.attendanceRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Level Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            TỔNG HỢP CHI TIẾT 20 LỚP TRONG {period === 'FULL_YEAR' ? 'NĂM HỌC' : 'HỌC KỲ'}
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
              {reportData.classStats.map(c => (
                <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.className}</td>
                  <td className="p-3 text-slate-700">{c.teacherName}</td>
                  <td className="p-3 text-center font-medium">{c.totalStudents}</td>
                  <td className="p-3 text-center text-slate-600">{c.schoolDaysRecorded}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{c.presentSessions}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{c.absentSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.excusedSessions}</td>
                  <td className="p-3 text-center text-slate-700">{c.unexcusedSessions}</td>
                  <td className="p-3 text-center text-purple-700">{c.lateCount}</td>
                  <td className="p-3 text-center font-black text-blue-900">{c.attendanceRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
