import React, { useState, useMemo } from 'react';
import { boardingReportService } from '../../services/boardingReportService';
import { SessionType } from '../../types';
import { formatVietnameseDate, getTodayDateString } from '../../utils/formatters';
import { UtensilsCrossed, Users, UserX, Calendar } from 'lucide-react';

interface BoardingReportViewProps {
  currentDate: string;
  session: SessionType;
  defaultType?: 'BOARDING' | 'NON_BOARDING';
  onSelectStudentProfile?: (studentId: string) => void;
}

export const BoardingReportView: React.FC<BoardingReportViewProps> = ({
  currentDate = getTodayDateString(),
  session = 'MORNING',
  defaultType = 'BOARDING',
  onSelectStudentProfile,
}) => {
  const [reportType, setReportType] = useState<'BOARDING' | 'NON_BOARDING'>(defaultType);
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  const reportData = useMemo(() => {
    return boardingReportService.getDailyReport(selectedDate, reportType, session);
  }, [selectedDate, reportType, session]);

  const isBoarding = reportType === 'BOARDING';
  const label = isBoarding ? 'HỌC SINH BÁN TRÚ' : 'HỌC SINH NGOẠI TRÚ';

  return (
    <div className="space-y-4">
      {/* Top Bar with Type Switching */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block ${
            isBoarding ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'
          }`}>
            {isBoarding ? 'Quản lý bán trú Trường THCS Bản Bo' : 'Quản lý ngoại trú Trường THCS Bản Bo'}
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            BÁO CÁO {label} NGÀY {formatVietnameseDate(selectedDate).toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <strong className="text-slate-800">{reportData.totalRoster}</strong> học sinh theo danh sách (Đã duyệt: {reportData.confirmedTotal} HS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch Type */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setReportType('BOARDING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                isBoarding ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Bán trú</span>
            </button>
            <button
              onClick={() => setReportType('NON_BOARDING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                !isBoarding ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ngoại trú</span>
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold">
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

      {/* KPI Cards (Mục VII, VIII, XXV) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">
            Tổng số theo DS
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{reportData.totalRoster}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">học sinh {isBoarding ? 'bán trú' : 'ngoại trú'}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Có mặt hôm nay</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{reportData.presentCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Tỉ lệ có mặt: {reportData.attendanceRate.toFixed(1)}%</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Vắng hôm nay</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{reportData.absentCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">học sinh vắng</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase">Tỉ lệ có mặt</div>
          <div className="text-2xl font-black text-blue-950 mt-1">{reportData.attendanceRate.toFixed(1)}%</div>
          <div className="text-[10px] text-blue-700 mt-0.5">{reportData.presentCount}/{reportData.confirmedTotal} HS xác nhận</div>
        </div>
      </div>

      {/* Grouped by Grade (Mục XXV, XXVI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            TỔNG HỢP {label} THEO KHỐI (6, 7, 8, 9)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Khối</th>
                <th className="p-3 text-center">Tổng theo DS</th>
                <th className="p-3 text-center">Có mặt</th>
                <th className="p-3 text-center">Vắng</th>
                <th className="p-3 text-center">Tỉ lệ có mặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.gradeSummaries.map(g => (
                <tr key={g.grade} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{g.gradeLabel}</td>
                  <td className="p-3 text-center font-medium">{g.totalBoarding}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">{g.presentCount}</td>
                  <td className="p-3 text-center font-bold text-rose-800">{g.absentCount}</td>
                  <td className="p-3 text-center font-extrabold text-blue-900">{g.attendanceRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 20 Classes Breakdown (Mục XXVI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            CHI TIẾT 20 LỚP – {label}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3">Lớp</th>
                <th className="p-3">Khối</th>
                <th className="p-3 text-center">Theo DS</th>
                <th className="p-3 text-center">Có mặt</th>
                <th className="p-3 text-center">Vắng</th>
                <th className="p-3 text-center">Tỉ lệ có mặt</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.classRows.map(c => (
                <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.className}</td>
                  <td className="p-3 text-slate-600">Khối {c.grade}</td>
                  <td className="p-3 text-center font-medium">{c.totalBoarding}</td>
                  <td className="p-3 text-center font-bold text-emerald-800">
                    {c.isApproved ? c.presentCount : '--'}
                  </td>
                  <td className="p-3 text-center font-bold text-rose-800">
                    {c.isApproved ? c.absentCount : '--'}
                  </td>
                  <td className="p-3 text-center font-bold text-blue-900">
                    {c.isApproved ? `${c.attendanceRate.toFixed(1)}%` : '--'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absent list for this boarding/non-boarding group */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            DANH SÁCH HỌC SINH {isBoarding ? 'BÁN TRÚ' : 'NGOẠI TRÚ'} VẮNG HÔM NAY ({reportData.absentStudents.length} HS)
          </h4>
        </div>
        {reportData.absentStudents.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs italic">
            Không có học sinh {isBoarding ? 'bán trú' : 'ngoại trú'} nào vắng trong các lớp đã duyệt hôm nay.
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
                  <th className="p-3 text-center">Phân loại</th>
                  <th className="p-3">Lí do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.absentStudents.map((r, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectStudentProfile?.(r.studentId)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{r.studentName}</td>
                    <td className="p-3 text-center font-bold text-slate-800">{r.className}</td>
                    <td className="p-3 text-center text-slate-600">Khối {r.grade}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'ABSENT_EXCUSED' || r.absenceType === 'excused'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status === 'ABSENT_EXCUSED' || r.absenceType === 'excused' ? 'Có phép' : 'Không phép'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{r.reason || 'Chưa rõ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
