import React, { useState, useMemo } from 'react';
import { teacherSubmissionService } from '../../services/teacherSubmissionService';
import { SessionType } from '../../types';
import { formatVietnameseDate, getTodayDateString } from '../../utils/formatters';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Calendar } from 'lucide-react';

interface TeacherSubmissionReportViewProps {
  currentDate: string;
  session: SessionType;
}

export const TeacherSubmissionReportView: React.FC<TeacherSubmissionReportViewProps> = ({
  currentDate = getTodayDateString(),
  session = 'MORNING',
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);

  const submissionData = useMemo(() => {
    return teacherSubmissionService.getSubmissionProgress(selectedDate, session);
  }, [selectedDate, session]);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Theo dõi tiến độ báo cáo
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            TIẾN ĐỘ BÁO CÁO SĨ SỐ 20 GVCN
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngày {formatVietnameseDate(selectedDate)} · Buổi sáng (Hạn quy định: 07:20) · Chỉ hiển thị số liệu thực tế, không xếp loại giáo viên
          </p>
        </div>

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

      {/* KPI Cards (Mục XXIX) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng số lớp</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{submissionData.totalClasses}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">lớp toàn trường</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Nộp đúng hạn</div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{submissionData.submittedOnTimeCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">lớp nộp trước 07:20</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Nộp quá hạn</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{submissionData.submittedLateCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">lớp nộp sau giờ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Chưa báo cáo</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{submissionData.unsubmittedCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">lớp chưa gửi</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase">Đã được duyệt</div>
          <div className="text-2xl font-black text-blue-950 mt-1">{submissionData.approvedCount}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">lớp hoàn thành</div>
        </div>
      </div>

      {/* 20 Classes Table (Mục XXIX, XXX) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            BẢNG THEO DÕI TIẾN ĐỘ 20 LỚP
          </h4>
          <span className="text-xs text-slate-500 italic">
            * Hệ thống phục vụ theo dõi vận hành, tuyệt đối không tạo điểm hay bảng xếp hạng thi đua giáo viên.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Lớp</th>
                <th className="p-3">Khối</th>
                <th className="p-3">GVCN</th>
                <th className="p-3 text-center">Hạn báo cáo</th>
                <th className="p-3 text-center">Thời gian gửi</th>
                <th className="p-3 text-center">Đúng hạn / Quá hạn</th>
                <th className="p-3 text-center">Số phút quá hạn</th>
                <th className="p-3 text-center">Số lần chỉnh sửa</th>
                <th className="p-3 text-center">Thời gian duyệt</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissionData.items.map(item => (
                <tr key={item.classId} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400">{item.stt}</td>
                  <td className="p-3 font-bold text-slate-900">{item.className}</td>
                  <td className="p-3 text-slate-600">Khối {item.grade}</td>
                  <td className="p-3 font-medium text-slate-800">
                    <div>{item.teacherName}</div>
                    {item.teacherPhone && (
                      <div className="text-[10px] text-slate-400">{item.teacherPhone}</div>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-600">{item.deadline}</td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">
                    {item.submittedAt}
                  </td>
                  <td className="p-3 text-center">
                    {item.isSubmitted ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isLate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.isLate ? 'Quá hạn' : 'Đúng hạn'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Chưa nộp
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-700">
                    {item.lateByMinutes > 0 ? (
                      <span className="font-bold text-amber-800">+{item.lateByMinutes} phút</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-700">
                    {item.revisionCount > 0 ? (
                      <span className="font-bold text-rose-700">{item.revisionCount} lần</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="p-3 text-center font-mono text-slate-700">
                    {item.approvedAt}
                  </td>
                  <td className="p-3 text-center font-bold">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.statusColor === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.statusColor === 'rose'
                        ? 'bg-rose-100 text-rose-800'
                        : item.statusColor === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
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
