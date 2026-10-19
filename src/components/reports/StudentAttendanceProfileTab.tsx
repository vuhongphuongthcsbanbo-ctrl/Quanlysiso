import React, { useState, useMemo } from 'react';
import { studentAttendanceReportService } from '../../services/studentAttendanceReportService';
import { Student } from '../../types';
import { storageService } from '../../services/storageService';
import { User, Calendar, CheckCircle2, AlertTriangle, Clock, Search, History } from 'lucide-react';

interface StudentAttendanceProfileTabProps {
  initialStudentId?: string | null;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const StudentAttendanceProfileTab: React.FC<StudentAttendanceProfileTabProps> = ({
  initialStudentId,
  onSelectStudentProfile,
}) => {
  const students = storageService.getStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 50);
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      s => s.fullName.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [students, searchQuery]);

  const profile = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentAttendanceReportService.getStudentProfile(
      selectedStudentId,
      undefined,
      monthFilter !== 'ALL' ? monthFilter : undefined
    );
  }, [selectedStudentId, monthFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Student Selector Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Tra cứu hồ sơ chuyên cần học sinh
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            HỒ SƠ CHUYÊN CẦN CÁ NHÂN (Mục XXIII, XXIV)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảo toàn lịch sử đúng lớp và diện bán trú tại thời điểm báo cáo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã HS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Student Select dropdown */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 cursor-pointer max-w-[220px]"
          >
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.className} - {s.code})
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">Cả năm học 2026–2027</option>
            <option value="2026-09">Tháng 9 / 2026</option>
            <option value="2026-10">Tháng 10 / 2026</option>
            <option value="2026-11">Tháng 11 / 2026</option>
            <option value="2026-12">Tháng 12 / 2026</option>
            <option value="2027-01">Tháng 1 / 2027</option>
            <option value="2027-02">Tháng 2 / 2027</option>
            <option value="2027-03">Tháng 3 / 2027</option>
            <option value="2027-04">Tháng 4 / 2027</option>
            <option value="2027-05">Tháng 5 / 2027</option>
          </select>
        </div>
      </div>

      {!profile ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
          Vui lòng chọn một học sinh để xem hồ sơ chuyên cần.
        </div>
      ) : (
        <>
          {/* Student Profile Overview Card (Mục XXIII) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-slate-900">{profile.student.fullName}</h4>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                    {profile.student.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    profile.student.boardingType === 'BOARDING'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {profile.student.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Lớp hiện tại: <strong>{profile.student.className}</strong> (Khối {profile.student.grade}) · Năm sinh: {profile.student.dateOfBirth} · Dân tộc: {profile.student.ethnicGroup || 'Kinh'} · Bản: {profile.student.address || 'Bản Bo'}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tỉ lệ chuyên cần</div>
              <div className="text-2xl font-black text-emerald-950 mt-0.5">
                {profile.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">
                Có mặt {profile.totalPresentSessions}/{profile.totalRequiredSessions} buổi
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng buổi học</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{profile.totalRequiredSessions}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">buổi có điểm danh</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Buổi có mặt</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">{profile.totalPresentSessions}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">bao gồm cả đi muộn</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs bg-amber-50/20">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Vắng có phép</div>
              <div className="text-2xl font-black text-amber-950 mt-1">{profile.absentExcusedCount}</div>
              <div className="text-[10px] text-amber-700 mt-0.5">buổi</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
              <div className="text-[11px] font-bold text-rose-800 uppercase">Vắng không phép</div>
              <div className="text-2xl font-black text-rose-950 mt-1">{profile.absentUnexcusedCount}</div>
              <div className="text-[10px] text-rose-700 mt-0.5">buổi</div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-purple-200 shadow-xs">
              <div className="text-[11px] font-bold text-purple-800 uppercase">Đi học muộn</div>
              <div className="text-2xl font-black text-purple-950 mt-1">{profile.lateCount}</div>
              <div className="text-[10px] text-purple-700 mt-0.5">lần</div>
            </div>
          </div>

          {/* Timeline Table (Mục XXIV) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase">
                LỊCH SỬ CHUYÊN CẦN CHI TIẾT THEO NGÀY
              </h4>
              <span className="text-xs text-slate-500">
                {profile.timeline.length} bản ghi
              </span>
            </div>

            {profile.timeline.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Chưa có dữ liệu điểm danh nào trong giai đoạn này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                      <th className="p-3">Ngày</th>
                      <th className="p-3 text-center">Buổi</th>
                      <th className="p-3 text-center">Lớp tại thời điểm đó</th>
                      <th className="p-3 text-center">Diện</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3">Lí do vắng / Đi muộn</th>
                      <th className="p-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile.timeline.map((item, idx) => {
                      const isPresent = item.status === 'PRESENT';
                      const isExcused = item.status === 'ABSENT_EXCUSED';
                      const isUnexcused = item.status === 'ABSENT_UNEXCUSED' || item.status === 'FULL_DAY_ABSENCE';
                      const isLate = item.isLate;

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{item.date}</td>
                          <td className="p-3 text-center text-slate-600">Buổi sáng</td>
                          <td className="p-3 text-center font-bold text-slate-800">{item.className}</td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {item.boardingType}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : isLate
                                ? 'bg-purple-100 text-purple-800'
                                : isExcused
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.statusLabel}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">
                            {item.reason || (isLate ? 'Đi học muộn' : isPresent ? '--' : 'Chưa rõ lí do')}
                          </td>
                          <td className="p-3 text-slate-500 italic">
                            {item.note || '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
