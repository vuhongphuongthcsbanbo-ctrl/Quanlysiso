import React, { useState, useMemo } from 'react';
import { SchoolClass, Student, AttendanceReport, SessionType } from '../../types';
import { storageService } from '../../services/storageService';
import { filterApprovedReports, calculateAttendanceRate } from '../../services/reportCalculationService';
import { getTodayDateString, formatVietnameseDate } from '../../utils/formatters';
import { Building2, Calendar, User, Users, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

interface ClassAttendanceReportViewProps {
  currentDate: string;
  classes: SchoolClass[];
  canExport: boolean;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const ClassAttendanceReportView: React.FC<ClassAttendanceReportViewProps> = ({
  currentDate = getTodayDateString(),
  classes,
  canExport,
  onSelectStudentProfile,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls_6a1');
  const [periodFilter, setPeriodFilter] = useState<'MONTH' | 'ALL'>('MONTH');

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId || c.name === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const allStudents = storageService.getStudents();
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return allStudents.filter(
      s => (s.classId === selectedClass.id || s.className === selectedClass.name) && s.status === 'active'
    );
  }, [allStudents, selectedClass]);

  const boardingCount = classStudents.filter(s => s.boardingType === 'BOARDING').length;
  const nonBoardingCount = classStudents.filter(s => s.boardingType === 'NON_BOARDING').length;

  // History reports for this class
  const classReports = useMemo(() => {
    if (!selectedClass) return [];
    const allRep = filterApprovedReports(storageService.getReports());
    return allRep
      .filter(r => r.classId === selectedClass.id || r.className === selectedClass.name)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedClass]);

  // Aggregate stats
  const totalExpected = classReports.reduce((sum, r) => sum + r.totalStudents, 0);
  const totalPresent = classReports.reduce((sum, r) => sum + r.presentCount, 0);
  const totalAbsent = classReports.reduce((sum, r) => sum + r.absentCount, 0);
  const totalExcused = classReports.reduce((sum, r) => sum + (r.excusedAbsentCount ?? r.absentExcusedCount ?? 0), 0);
  const totalUnexcused = classReports.reduce((sum, r) => sum + (r.unexcusedAbsentCount ?? r.absentUnexcusedCount ?? 0), 0);
  const totalLate = classReports.reduce((sum, r) => sum + (r.lateCount || 0), 0);
  const overallRate = calculateAttendanceRate(totalExpected, totalPresent);

  return (
    <div className="space-y-4">
      {/* Top Class Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Báo cáo chuyên cần theo lớp
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            LỚP {selectedClass?.name} – KHỐI {selectedClass?.grade}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            GVCN: <strong className="text-slate-800">{selectedClass?.teacherName || 'Chưa phân công'}</strong> · Sĩ số: <strong className="text-slate-800">{classStudents.length}</strong> học sinh (Bán trú: {boardingCount}, Ngoại trú: {nonBoardingCount})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Chọn lớp:</label>
          <select
            value={selectedClass?.id}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Lớp {c.name} {c.teacherName ? `(${c.teacherName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards for Selected Class (Mục LXII) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Sĩ số lớp</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{classStudents.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">học sinh đang học</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Tỉ lệ chuyên cần</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{overallRate.toFixed(1)}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{totalPresent}/{totalExpected} lượt</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Bán trú</div>
          <div className="text-2xl font-black text-purple-950 mt-1">{boardingCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Ngoại trú</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{nonBoardingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">học sinh</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Tổng lượt vắng</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{totalAbsent}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Phép: {totalExcused} · K.Phép: {totalUnexcused}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Đi muộn</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{totalLate}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">lượt ghi nhận</div>
        </div>
      </div>

      {/* Daily Attendance History Table (Mục LXIII) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            NHẬT KÝ SĨ SỐ TỪNG NGÀY CỦA LỚP {selectedClass?.name}
          </h4>
          <span className="text-xs text-slate-500">
            {classReports.length} ngày báo cáo đã duyệt
          </span>
        </div>

        {classReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            Chưa có báo cáo đã được duyệt nào cho lớp {selectedClass?.name}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="p-3">Ngày</th>
                  <th className="p-3 text-center">Sĩ số</th>
                  <th className="p-3 text-center">Có mặt</th>
                  <th className="p-3 text-center">Vắng</th>
                  <th className="p-3 text-center">Có phép</th>
                  <th className="p-3 text-center">Không phép</th>
                  <th className="p-3 text-center">Đi muộn</th>
                  <th className="p-3 text-center">Bán trú có mặt</th>
                  <th className="p-3 text-center">Tỉ lệ</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classReports.map(r => {
                  const rate = r.totalStudents > 0 ? (r.presentCount / r.totalStudents) * 100 : 100;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{r.date}</td>
                      <td className="p-3 text-center font-medium">{r.totalStudents}</td>
                      <td className="p-3 text-center font-bold text-emerald-800">{r.presentCount}</td>
                      <td className="p-3 text-center font-bold text-rose-800">{r.absentCount}</td>
                      <td className="p-3 text-center text-slate-700">
                        {r.excusedAbsentCount ?? r.absentExcusedCount ?? 0}
                      </td>
                      <td className="p-3 text-center text-slate-700">
                        {r.unexcusedAbsentCount ?? r.absentUnexcusedCount ?? 0}
                      </td>
                      <td className="p-3 text-center text-purple-700">{r.lateCount || 0}</td>
                      <td className="p-3 text-center text-slate-700">
                        {r.boardingPresent}/{r.boardingTotal}
                      </td>
                      <td className="p-3 text-center font-extrabold text-blue-900">
                        {rate.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {r.status === 'LOCKED' ? 'Đã khóa' : 'Đã duyệt'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Students Roster Table (Mục LXIV) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            DANH SÁCH {classStudents.length} HỌC SINH LỚP {selectedClass?.name}
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3">Mã học sinh</th>
                <th className="p-3 text-center">Ngày sinh</th>
                <th className="p-3 text-center">Giới tính</th>
                <th className="p-3 text-center">Diện</th>
                <th className="p-3">Bản / Địa chỉ</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{st.fullName}</td>
                  <td className="p-3 font-mono text-slate-500">{st.code}</td>
                  <td className="p-3 text-center text-slate-600">{st.dateOfBirth}</td>
                  <td className="p-3 text-center text-slate-600">
                    {st.gender === 'female' ? 'Nữ' : 'Nam'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      st.boardingType === 'BOARDING'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {st.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{st.address || 'Bản Bo'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelectStudentProfile?.(st.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Hồ sơ chuyên cần
                    </button>
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
