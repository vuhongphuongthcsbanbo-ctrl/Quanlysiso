import React from 'react';
import { AttendanceReport, SchoolClass, SchoolSettings, SessionType } from '../../types';
import { attendanceDeadlineService } from '../../services/attendanceDeadlineService';
import { getVietnamTimeString } from '../../utils/vietnamTime';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Send,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AttendanceReminderBannerProps {
  currentDate: string;
  session: SessionType;
  assignedClass: SchoolClass;
  report: AttendanceReport | null;
  settings: SchoolSettings;
  onNavigateToReport: () => void;
}

export const AttendanceReminderBanner: React.FC<AttendanceReminderBannerProps> = ({
  currentDate,
  session,
  assignedClass,
  report,
  settings,
  onNavigateToReport,
}) => {
  const currentTime = getVietnamTimeString();
  const evaluation = attendanceDeadlineService.evaluateClassDeadline(
    assignedClass.id,
    currentDate,
    session,
    report,
    settings,
    currentTime
  );

  const isAfternoon = session === 'AFTERNOON' || (session as string).toUpperCase() === 'AFTERNOON';
  const sessionLabel = isAfternoon ? 'buổi chiều' : 'buổi sáng';
  const startTime = isAfternoon ? (settings.afternoonStartTime || '13:00') : (settings.morningStartTime || '06:45');
  const deadlineTime = isAfternoon ? (settings.afternoonDeadlineTime || '13:45') : (settings.morningDeadlineTime || '07:20');

  // 1. Trường hợp Báo cáo đã được duyệt
  if (evaluation.reportStatus === 'APPROVED' || evaluation.reportStatus === 'LOCKED') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-emerald-950">
              BÁO CÁO ĐÃ ĐƯỢC DUYỆT ({sessionLabel.toUpperCase()})
            </h4>
            <p className="text-xs text-emerald-700">
              Sĩ số Lớp {assignedClass.name} {sessionLabel} ngày hôm nay đã được Tổng phụ trách duyệt hoàn tất.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateToReport}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer transition-colors"
        >
          XEM LẠI
        </button>
      </div>
    );
  }

  // 2. Trường hợp Đang chờ Tổng phụ trách duyệt
  if (evaluation.reportStatus === 'PENDING_APPROVAL') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-amber-950">
                ĐÃ GỬI BÁO CÁO – ĐANG CHỜ DUYỆT
              </h4>
              {evaluation.isLateSubmission && (
                <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded">
                  Gửi muộn {evaluation.overdueMinutes}p
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800">
              Đã gửi lúc {report?.submittedAt ? (report.submittedAt.includes(' ') ? report.submittedAt.split(' ')[1] : report.submittedAt) : currentTime}. Tổng phụ trách đang xem xét.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigateToReport}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer transition-colors"
        >
          XEM CHI TIẾT
        </button>
      </div>
    );
  }

  // 3. Trường hợp Yêu cầu chỉnh sửa (Mục XXI - Quan trọng nhất)
  if (evaluation.reportStatus === 'REVISION_REQUIRED') {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-3 text-rose-950 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-bounce">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-rose-950 uppercase tracking-tight">
                BÁO CÁO CẦN CHỈNH SỬA
              </h4>
              <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase">
                Khẩn cấp
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-0.5">
              Tổng phụ trách đã trả lại báo cáo Lớp {assignedClass.name}. Thầy/Cô vui lòng cập nhật lại số liệu.
            </p>
          </div>
        </div>

        {report?.revisionReason && (
          <div className="bg-white/90 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 font-medium">
            <span className="font-black block text-rose-900 mb-0.5">Nội dung yêu cầu từ Tổng phụ trách:</span>
            <span>"{report.revisionReason}"</span>
          </div>
        )}

        <button
          type="button"
          onClick={onNavigateToReport}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
        >
          <span>XEM VÀ CHỈNH SỬA NGAY</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 4. Trường hợp Chưa đến giờ báo cáo (Mục VI)
  if (evaluation.deadlineStatus === 'BEFORE_START') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Báo cáo sĩ số {sessionLabel} sẽ bắt đầu từ {startTime}
            </h4>
            <p className="text-xs text-slate-500">
              Hiện tại: {currentTime}. Còn {evaluation.timeRemainingMinutes} phút trước khi mở cổng báo cáo.
            </p>
          </div>
        </div>
        {evaluation.canSubmit && (
          <button
            type="button"
            onClick={onNavigateToReport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer transition-colors"
          >
            BÁO SỚM
          </button>
        )}
      </div>
    );
  }

  // 5. Trường hợp Quá hạn báo cáo (Mục X, LXXIX, Test 4)
  if (evaluation.deadlineStatus === 'OVERDUE') {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 space-y-3 text-red-950 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-red-950 uppercase tracking-tight">
                ĐÃ QUÁ THỜI GIAN BÁO CÁO ({sessionLabel.toUpperCase()})
              </h4>
              <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                Quá {evaluation.overdueMinutes} phút
              </span>
            </div>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Hạn báo cáo {sessionLabel} là <strong>{deadlineTime}</strong> (hiện tại: {currentTime}).
              Vui lòng hoàn thành báo cáo sĩ số Lớp {assignedClass.name} ngay!
            </p>
          </div>
        </div>

        {evaluation.canSubmit ? (
          <button
            type="button"
            onClick={onNavigateToReport}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <span>HOÀN THÀNH BÁO CÁO NGAY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-2.5 bg-red-100/80 rounded-xl text-xs font-bold text-red-900 text-center">
            Thời gian báo cáo đã kết thúc. Vui lòng liên hệ Tổng phụ trách để được mở quyền bổ sung.
          </div>
        )}
      </div>
    );
  }

  // 6. Trường hợp Đến giờ báo cáo bình thường hoặc Nhắc 1 / Nhắc 2 (Mục VII, VIII, IX)
  const isReminder2 = evaluation.deadlineStatus === 'REMINDER_2_TRIGGERED';
  const isReminder1 = evaluation.deadlineStatus === 'REMINDER_1_TRIGGERED';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border-2 shadow-md space-y-3 transition-all ${
        isReminder2
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : isReminder1
          ? 'bg-blue-50 border-blue-300 text-blue-950'
          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white ${
            isReminder2 ? 'bg-amber-600' : isReminder1 ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {isReminder2 ? (
            <AlertTriangle className="w-6 h-6" />
          ) : isReminder1 ? (
            <Clock className="w-6 h-6" />
          ) : (
            <Send className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm sm:text-base font-black tracking-tight uppercase">
              {isReminder2
                ? `NHẮC BÁO SĨ SỐ (${sessionLabel.toUpperCase()} - ƯU TIÊN CAO)`
                : isReminder1
                ? `NHẮC BÁO CÁO SĨ SỐ (${sessionLabel.toUpperCase()})`
                : `ĐÃ ĐẾN THỜI GIAN BÁO CÁO SĨ SỐ (${sessionLabel.toUpperCase()})`}
            </h4>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase text-white ${
                isReminder2 ? 'bg-amber-600' : isReminder1 ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              Còn {evaluation.timeRemainingMinutes} phút
            </span>
          </div>

          <p className="text-xs mt-1 leading-relaxed opacity-90">
            {isReminder2
              ? `Lớp ${assignedClass.name} vẫn chưa gửi báo cáo ${sessionLabel}. Hạn chót: ${deadlineTime}. Thầy/Cô vui lòng thực hiện ngay!`
              : isReminder1
              ? `Lớp ${assignedClass.name} chưa gửi báo cáo sĩ số ${sessionLabel}. Vui lòng hoàn thành trước ${deadlineTime}.`
              : `Cổng báo cáo ${sessionLabel} đã mở từ ${startTime}. Hạn chót nộp báo cáo là ${deadlineTime}.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigateToReport}
        className={`w-full py-3 px-4 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-98 cursor-pointer ${
          isReminder2
            ? 'bg-amber-600 hover:bg-amber-700'
            : isReminder1
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        <span>{isReminder2 ? 'THỰC HIỆN NGAY' : 'BÁO SĨ SỐ NGAY'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
