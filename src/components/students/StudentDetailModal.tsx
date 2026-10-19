import React, { useState } from 'react';
import { studentAttendanceReportService } from '../../services/studentAttendanceReportService';
import { storageService } from '../../services/storageService';
import { formatVietnameseDate } from '../../utils/formatters';
import {
  X,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Home,
  History,
  FileSpreadsheet,
} from 'lucide-react';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'ATTENDANCE'>('ATTENDANCE');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');

  if (!studentId) return null;

  const profile = studentAttendanceReportService.getStudentProfile(
    studentId,
    undefined,
    periodFilter !== 'ALL' ? periodFilter : undefined
  );

  if (!profile) return null;

  const { student, totalRequiredSessions, totalPresentSessions, absentExcusedCount, absentUnexcusedCount, lateCount, earlyLeaveCount, attendanceRate, timeline } = profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
              student.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{student.fullName}</h3>
                <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {student.code}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  student.boardingType === 'BOARDING'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-200 text-slate-800'
                }`}>
                  {student.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Lớp {student.className} (Khối {student.grade}) · Dân tộc: {student.ethnicGroup || 'Kinh'} · Bản: {student.address || 'Bản Bo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch header (Mục XXIII: Tạo tab "CHUYÊN CẦN") */}
        <div className="px-4 pt-2 border-b border-slate-200 flex items-center gap-2 bg-white text-xs font-bold">
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            HỒ SƠ CHUYÊN CẦN (Mục XXIII)
          </button>
          <button
            onClick={() => setActiveTab('INFO')}
            className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'INFO'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            THÔNG TIN HỌC SINH & GIA ĐÌNH
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'ATTENDANCE' ? (
            <>
              {/* Filter by Month / Semester (Mục XXIV) */}
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-600">Lọc khoảng thời gian:</span>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="ALL">Cả năm học (2026–2027)</option>
                  <option value="2026-09">Tháng 9 / 2026</option>
                  <option value="2026-10">Tháng 10 / 2026</option>
                  <option value="2026-11">Tháng 11 / 2026</option>
                  <option value="2026-12">Tháng 12 / 2026</option>
                  <option value="2027-01">Tháng 1 / 2027</option>
                  <option value="2027-02">Tháng 2 / 2027</option>
                </select>
              </div>

              {/* Attendance KPI Cards (Mục XXIII) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">Tỷ lệ chuyên cần</div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">{attendanceRate.toFixed(1)}%</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    Có mặt {totalPresentSessions}/{totalRequiredSessions} buổi
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">Vắng có phép</div>
                  <div className="text-2xl font-black text-amber-950 mt-1">{absentExcusedCount}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">buổi</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-rose-800 uppercase">Vắng không phép</div>
                  <div className="text-2xl font-black text-rose-950 mt-1">{absentUnexcusedCount}</div>
                  <div className="text-[10px] text-rose-700 mt-0.5">buổi</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-purple-800 uppercase">Đi muộn / Về sớm</div>
                  <div className="text-2xl font-black text-purple-950 mt-1">{lateCount}</div>
                  <div className="text-[10px] text-purple-700 mt-0.5">Về sớm: {earlyLeaveCount}</div>
                </div>
              </div>

              {/* Timeline (Mục XXIV) */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>LỊCH SỬ CHUYÊN CẦN ({timeline.length} BẢN GHI)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Hiển thị lớp tại thời điểm đó</span>
                </div>

                {timeline.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    Chưa có lượt điểm danh nào được ghi nhận trong khoảng thời gian này.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto">
                    {timeline.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-slate-50 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{formatVietnameseDate(item.date)}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                              Lớp {item.className}
                            </span>
                            <span className="text-[10px] text-slate-500">Buổi sáng</span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            Lí do: <strong className="text-slate-800">{item.reason || (item.isLate ? 'Đi học muộn' : item.status === 'PRESENT' ? 'Có mặt' : 'Không rõ lí do')}</strong>
                            {item.reasonDetail && <span> - {item.reasonDetail}</span>}
                          </div>
                        </div>

                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.isLate
                              ? 'bg-purple-100 text-purple-800'
                              : item.status === 'ABSENT_EXCUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.statusLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tab 2: Thông tin chi tiết học sinh */
            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block">Họ và tên:</span>
                  <strong className="text-slate-900 text-sm">{student.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Mã học sinh:</span>
                  <strong className="text-slate-900 font-mono">{student.code}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày sinh:</span>
                  <strong className="text-slate-900">{student.dateOfBirth}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Giới tính:</span>
                  <strong className="text-slate-900">{student.gender === 'female' ? 'Nữ' : 'Nam'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dân tộc:</span>
                  <strong className="text-slate-900">{student.ethnicGroup || 'Kinh'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Diện học sinh:</span>
                  <strong className="text-slate-900">{student.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}</strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <div className="font-bold text-slate-800 uppercase mb-2">Thông tin gia đình & liên hệ</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Phụ huynh:</span>
                    <strong className="text-slate-900">{student.parentName || '--'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Số điện thoại:</span>
                    <strong className="text-slate-900">{student.parentPhone || '--'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Địa chỉ thường trú:</span>
                    <strong className="text-slate-900">{student.address || 'Xã Bản Bo, huyện Tam Đường, tỉnh Lai Châu'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
