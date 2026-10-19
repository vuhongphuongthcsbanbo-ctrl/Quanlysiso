import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { attendanceDeadlineService } from '../services/attendanceDeadlineService';
import { scheduledAttendanceService } from '../services/scheduledAttendanceService';
import { SessionType } from '../types';
import { getVietnamTimeString, formatVietnameseDate } from '../utils/formatters';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Play,
  RotateCw,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  Filter,
  Check,
  Zap,
} from 'lucide-react';

interface MorningProgressPageProps {
  currentDate: string;
}

export const MorningProgressPage: React.FC<MorningProgressPageProps> = ({ currentDate }) => {
  const settings = storageService.getSettings();
  const [session, setSession] = useState<SessionType>('MORNING');
  const [simulatedTime, setSimulatedTime] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');

  // Load state
  const timelineState = attendanceDeadlineService.getMorningTimelineState(
    currentDate,
    session,
    settings,
    simulatedTime || undefined
  );

  const speedStats = attendanceDeadlineService.getMorningSubmissionSpeedStats(
    currentDate,
    session,
    settings
  );

  const handleRunManualScheduleCheck = (customTime?: string) => {
    const timeToTest = customTime || simulatedTime || undefined;
    const res = scheduledAttendanceService.checkMorningAttendanceReminders({
      date: currentDate,
      session,
      simulatedCurrentTime: timeToTest,
      forceRun: true,
    });

    let msg = `[${res.currentTime}] Đã chạy kiểm tra hệ thống. Nhắc nhở gửi: ${res.remindersSentCount}, Cảnh báo quá hạn: ${res.overdueAlertsSentCount}.`;
    if (res.skippedReason) {
      msg += ` Ghi chú: ${res.skippedReason}`;
    }
    setSimulationResult(msg);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
              {session === 'AFTERNOON' ? 'Quy trình buổi chiều' : 'Quy trình buổi sáng'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {formatVietnameseDate(currentDate)}
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            TIẾN ĐỘ BÁO SĨ SỐ {session === 'AFTERNOON' ? 'BUỔI CHIỀU' : 'BUỔI SÁNG'}
          </h2>
          <p className="text-xs text-slate-500">
            Trường THCS Bản Bo · Theo dõi thời gian thực quá trình báo cáo và duyệt sĩ số 20 lớp ({session === 'AFTERNOON' ? 'Hạn chót: ' + (settings.afternoonDeadlineTime || '13:45') : 'Hạn chót: ' + (settings.morningDeadlineTime || '07:20')})
          </p>
        </div>

        {/* Action controls & Session Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSession('MORNING');
                setSimulationResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                session === 'MORNING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BUỔI SÁNG
            </button>
            <button
              type="button"
              onClick={() => {
                setSession('AFTERNOON');
                setSimulationResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                session === 'AFTERNOON'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BUỔI CHIỀU
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleRunManualScheduleCheck()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
          >
            <Play className="w-3.5 h-3.5" />
            <span>KIỂM TRA HỆ THỐNG ({session === 'AFTERNOON' ? 'CHIỀU' : 'SÁNG'})</span>
          </button>
        </div>
      </div>

      {/* ==================================================
          MỤC XLVIII: TIMELINE THỜI GIAN BUỔI SÁNG
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>TIMELINE TIẾN ĐỘ {session === 'AFTERNOON' ? 'BUỔI CHIỀU' : 'BUỔI SÁNG'} THEO MỐC THỜI GIAN</span>
            </h3>
            <p className="text-xs text-slate-500">
              Hiện tại đang ở giai đoạn:{' '}
              <strong className="text-blue-900">{timelineState.currentStepLabel}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Giờ hiện tại:</span>
            <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              {simulatedTime || 'Đang dùng giờ thật'}
            </span>
          </div>
        </div>

        {/* Interactive Steps Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {timelineState.steps.map((st, idx) => (
            <div
              key={st.key}
              className={`p-3.5 rounded-xl border relative transition-all ${
                st.isCurrent
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100 scale-102 z-10'
                  : st.isPassed
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    st.isCurrent
                      ? 'bg-white text-blue-900'
                      : st.isPassed
                      ? 'bg-emerald-200 text-emerald-900 font-bold'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {st.time}
                </span>

                {st.isCurrent ? (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                    HIỆN TẠI
                  </span>
                ) : st.isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] text-slate-400">Chưa đến</span>
                )}
              </div>

              <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{st.label}</h4>
              <p
                className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                  st.isCurrent ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                {st.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================
          BỘ CÔNG CỤ THỬ NGHIỆM GIẢ LẬP MỐC GIỜ (DÀNH CHO KIỂM THỬ)
      ================================================== */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-950">
          <Zap className="w-5 h-5 text-amber-600 shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
            BỘ THỬ NGHIỆM GIẢ LẬP CÁC TÌNH HUỐNG THỜI GIAN (TEST RUNNER)
          </h4>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          Cho phép Tổng phụ trách hoặc Kỹ thuật viên thử nghiệm hệ thống tại bất kỳ mốc giờ nào trong ngày để kiểm tra các kịch bản nhắc nhở, cảnh báo quá hạn và chốt sổ mà không cần đợi đến sáng mai.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {session === 'MORNING' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('06:40');
                  handleRunManualScheduleCheck('06:40');
                }}
                className="px-3 py-1.5 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                06:40 (Trước mở 06:45)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('07:06');
                  handleRunManualScheduleCheck('07:06');
                }}
                className="px-3 py-1.5 bg-blue-100 text-blue-900 hover:bg-blue-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                07:06 (Đến Nhắc lần 1)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('07:16');
                  handleRunManualScheduleCheck('07:16');
                }}
                className="px-3 py-1.5 bg-amber-200 text-amber-950 hover:bg-amber-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                07:16 (Đến Nhắc lần 2)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('07:25');
                  handleRunManualScheduleCheck('07:25');
                }}
                className="px-3 py-1.5 bg-rose-100 text-rose-900 hover:bg-rose-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                07:25 (Quá hạn 07:20)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('12:50');
                  handleRunManualScheduleCheck('12:50');
                }}
                className="px-3 py-1.5 bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                12:50 (Trước mở 13:00)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('13:26');
                  handleRunManualScheduleCheck('13:26');
                }}
                className="px-3 py-1.5 bg-indigo-100 text-indigo-900 hover:bg-indigo-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                13:26 (Đến Nhắc lần 1 Chiều)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('13:41');
                  handleRunManualScheduleCheck('13:41');
                }}
                className="px-3 py-1.5 bg-amber-200 text-amber-950 hover:bg-amber-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                13:41 (Đến Nhắc lần 2 Chiều)
              </button>

              <button
                type="button"
                onClick={() => {
                  setSimulatedTime('13:50');
                  handleRunManualScheduleCheck('13:50');
                }}
                className="px-3 py-1.5 bg-rose-100 text-rose-900 hover:bg-rose-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                13:50 (Quá hạn Chiều 13:45)
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2 py-0.5">
            <span className="text-[11px] font-bold text-slate-600">Giờ tùy chọn:</span>
            <input
              type="time"
              value={simulatedTime}
              onChange={(e) => {
                setSimulatedTime(e.target.value);
                if (e.target.value) {
                  handleRunManualScheduleCheck(e.target.value);
                }
              }}
              className="text-xs font-bold text-slate-900 bg-transparent outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSimulatedTime('');
              setSimulationResult(null);
            }}
            className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
          >
            Xóa giả lập (Dùng giờ thật)
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-800">
            {simulationResult}
          </div>
        )}
      </div>

      {/* ==================================================
          MỤC XLIX: THỐNG KÊ TỐC ĐỘ BÁO CÁO (KHÔNG XẾP LOẠI GIÁO VIÊN)
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>THỐNG KÊ TỐC ĐỘ BÁO CÁO CỦA 20 LỚP (MỤC XLIX)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Dữ liệu thống kê thuần túy hỗ trợ công tác quản lý quy trình nhà trường. Tuyệt đối không xếp hạng hoặc đánh giá giáo viên.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Gửi trước Nhắc 1</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {speedStats.beforeReminder1} <span className="text-xs text-slate-500 font-medium">lớp</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Trước {settings.morningReminder1Time || '07:05'}</div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="text-[11px] font-bold text-blue-800 uppercase">Gửi sau Nhắc 1</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {speedStats.betweenR1AndR2} <span className="text-xs text-slate-500 font-medium">lớp</span>
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">Từ 07:05 đến 07:15</div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-[11px] font-bold text-amber-900 uppercase">Gửi sau Nhắc 2</div>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {speedStats.betweenR2AndDeadline} <span className="text-xs text-slate-500 font-medium">lớp</span>
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">Từ 07:15 đến 07:20</div>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="text-[11px] font-bold text-rose-800 uppercase">Gửi quá hạn</div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {speedStats.overdue} <span className="text-xs text-slate-500 font-medium">lớp</span>
            </div>
            <div className="text-[10px] text-rose-600 mt-0.5">Sau {settings.morningDeadlineTime || '07:20'}</div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MỤC L: BÁO CÁO TÌNH HÌNH NỘP SĨ SỐ (THEO NGÀY, TUẦN, THÁNG)
      ================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>BÁO CÁO TÌNH HÌNH NỘP SĨ SỐ 20 LỚP (MỤC L, LII)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chi tiết thời gian gửi, số phút quá hạn, số lần chỉnh sửa của từng lớp
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setReportPeriod('DAY')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                reportPeriod === 'DAY' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setReportPeriod('WEEK')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                reportPeriod === 'WEEK' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => setReportPeriod('MONTH')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${
                reportPeriod === 'MONTH' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="p-3">Lớp</th>
                <th className="p-3">GVCN</th>
                <th className="p-3">Hạn nộp</th>
                <th className="p-3">Thời gian nộp</th>
                <th className="p-3">Quá hạn</th>
                <th className="p-3">Yêu cầu sửa</th>
                <th className="p-3">Thời gian duyệt</th>
                <th className="p-3">Tốc độ ghi nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {speedStats.classDetails.map((cd) => (
                <tr key={cd.classId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{cd.className}</td>
                  <td className="p-3 text-slate-700">{cd.teacherName}</td>
                  <td className="p-3 text-slate-500">{cd.deadline}</td>
                  <td className="p-3">
                    {cd.submittedAt ? (
                      <span className="font-semibold text-blue-900">
                        {cd.submittedAt.includes(' ') ? cd.submittedAt.split(' ')[1] : cd.submittedAt}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa nộp</span>
                    )}
                  </td>
                  <td className="p-3">
                    {cd.lateByMinutes > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        +{cd.lateByMinutes} phút
                      </span>
                    ) : cd.submittedAt ? (
                      <span className="text-emerald-700 font-medium">Đúng hạn</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {cd.revisionCount > 0 ? (
                      <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded">
                        {cd.revisionCount} lần
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">
                    {cd.approvedAt ? (
                      <span className="text-emerald-700 font-semibold">
                        {cd.approvedAt.includes(' ') ? cd.approvedAt.split(' ')[1] : cd.approvedAt}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa duyệt</span>
                    )}
                  </td>
                  <td className="p-3">
                    {cd.speedBucket === 'BEFORE_R1' && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Trước Nhắc 1
                      </span>
                    )}
                    {cd.speedBucket === 'AFTER_R1' && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Sau Nhắc 1
                      </span>
                    )}
                    {cd.speedBucket === 'AFTER_R2' && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        Sau Nhắc 2
                      </span>
                    )}
                    {cd.speedBucket === 'OVERDUE' && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        Quá hạn
                      </span>
                    )}
                    {cd.speedBucket === 'NOT_SUBMITTED' && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        Chưa nộp
                      </span>
                    )}
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
