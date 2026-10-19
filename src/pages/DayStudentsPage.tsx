import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { attendanceService } from '../services/attendanceService';
import { exportService } from '../services/exportService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';
import {
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  UserX,
} from 'lucide-react';

interface DayStudentsPageProps {
  currentDate: string;
  onSelectStudentProfile?: (studentId: string) => void;
}

export const DayStudentsPage: React.FC<DayStudentsPageProps> = ({
  currentDate,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const stats = attendanceService.getDashboardStats(currentDate);
  const { grades } = attendanceService.getGradeSummaries(currentDate);
  const classes = storageService.getClasses().filter(c => c.isActive);
  const students = storageService.getStudents().filter(s => s.status === 'active' && s.boardingType === 'NON_BOARDING');

  // Absent day students (Section AF)
  const absentDayStudents = useMemo(() => {
    return attendanceService.getAbsentStudents(currentDate, {
      boardingType: 'NON_BOARDING',
      includePending: true,
    });
  }, [currentDate]);

  // Filtered roster
  const filteredStudents = useMemo(() => {
    return students.filter(stu => {
      if (selectedGrade > 0 && stu.grade !== selectedGrade) return false;
      if (selectedClassId !== 'all' && stu.classId !== selectedClassId) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!stu.fullName.toLowerCase().includes(term) && !stu.code.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [students, selectedGrade, selectedClassId, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Quản lý chuyên đề
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>NGOẠI TRÚ HÔM NAY</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách cố định theo hồ sơ học sinh đầu năm · Ngày {formatVietnameseDate(currentDate)}
          </p>
        </div>

        <button
          onClick={() => exportService.exportDailyReportExcel(currentDate)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất DS Ngoại Trú Excel</span>
        </button>
      </div>

      {/* SECTION AF: TỔNG QUAN NGOẠI TRÚ HÔM NAY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Tổng ngoại trú theo DS</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.nonBoardingTotalRoster}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã xác nhận: {stats.nonBoardingConfirmedTotal}</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
            <span>Ngoại trú có mặt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{stats.nonBoardingPresent}</div>
          <div className="text-[11px] text-emerald-800 mt-0.5">Đang học tại trường</div>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-bold text-rose-800 uppercase flex items-center justify-between">
            <span>Ngoại trú vắng</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1">{stats.nonBoardingAbsent}</div>
          <div className="text-[11px] text-rose-800 mt-0.5">Nghỉ học hôm nay</div>
        </div>
      </div>

      {/* SECTION AF: THỐNG KÊ NGOẠI TRÚ THEO KHỐI */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="text-xs font-black text-slate-700 uppercase tracking-wider">
          Thống kê ngoại trú theo từng khối
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {grades.map(g => (
            <div key={g.grade} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-black text-slate-900 text-sm">{g.gradeLabel}</div>
              <div>Tổng ngoại trú: <strong>{g.nonBoardingTotal} HS</strong></div>
              <div className="text-emerald-700">Có mặt: <strong>{g.nonBoardingPresent}</strong></div>
              <div className="text-rose-700">Vắng: <strong>{g.nonBoardingAbsent}</strong></div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION AF: DANH SÁCH HỌC SINH NGOẠI TRÚ VẮNG */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-600" />
            <span>DANH SÁCH HỌC SINH NGOẠI TRÚ VẮNG ({absentDayStudents.length})</span>
          </div>
        </div>

        {absentDayStudents.length === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
            Hôm nay 100% học sinh ngoại trú (của các lớp đã báo cáo) có mặt đầy đủ!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">STT</th>
                  <th className="p-2.5">Mã HS</th>
                  <th className="p-2.5">Họ và tên</th>
                  <th className="p-2.5">Lớp</th>
                  <th className="p-2.5">Tình trạng</th>
                  <th className="p-2.5">Lí do</th>
                  <th className="p-2.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absentDayStudents.map((rec, i) => (
                  <tr key={rec.studentId} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400 font-bold">{i + 1}</td>
                    <td className="p-2.5 font-mono text-slate-500">{rec.studentCode}</td>
                    <td className="p-2.5 font-bold text-slate-900">{rec.studentName}</td>
                    <td className="p-2.5 font-semibold text-blue-900">{rec.className}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        {rec.status === 'ABSENT_EXCUSED' ? 'Vắng có phép' : 'Vắng k.phép'}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium text-slate-700">{rec.reason || 'Không rõ'}</td>
                    <td className="p-2.5 text-slate-500 italic">{rec.reasonDetail || rec.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ROSTER TABLE (Học sinh ngoại trú cố định) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Danh sách học sinh ngoại trú toàn trường ({filteredStudents.length} học sinh)
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold cursor-pointer"
            >
              <option value="all">Tất cả 20 lớp</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-2.5">STT</th>
                <th className="p-2.5">Mã HS</th>
                <th className="p-2.5">Họ và tên</th>
                <th className="p-2.5">Lớp</th>
                <th className="p-2.5">Giới tính</th>
                <th className="p-2.5">Dân tộc</th>
                <th className="p-2.5">Bản/Thôn</th>
                <th className="p-2.5">Phụ huynh</th>
                <th className="p-2.5">SĐT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu, i) => (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-slate-400 font-semibold">{i + 1}</td>
                  <td className="p-2.5 font-mono text-slate-500">{stu.code}</td>
                  <td className="p-2.5 font-black text-slate-900">{stu.fullName}</td>
                  <td className="p-2.5 font-bold text-blue-900">{stu.className}</td>
                  <td className="p-2.5">{stu.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                  <td className="p-2.5">{stu.ethnicGroup || 'Thái'}</td>
                  <td className="p-2.5">{stu.address || 'Bản Bo'}</td>
                  <td className="p-2.5">{stu.parentName || '--'}</td>
                  <td className="p-2.5 text-slate-500 font-mono">{stu.parentPhone || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
