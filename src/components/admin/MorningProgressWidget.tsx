import React, { useState } from 'react';
import {
  AttendanceReport,
  SchoolClass,
  SessionType,
  SchoolSettings,
} from '../../types';
import { attendanceDeadlineService, ClassDeadlineEvaluation } from '../../services/attendanceDeadlineService';
import { ManualReminderDialog } from './ManualReminderDialog';
import { getVietnamTimeString } from '../../utils/vietnamTime';
import {
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckCircle2,
  Bell,
  Eye,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface MorningProgressWidgetProps {
  currentDate: string;
  session: SessionType;
  classes: SchoolClass[];
  reports: AttendanceReport[];
  settings: SchoolSettings;
  onReviewReport: (classId: string) => void;
  onNavigateToProgressPage: () => void;
}

export const MorningProgressWidget: React.FC<MorningProgressWidgetProps> = ({
  currentDate,
  session,
  classes,
  reports,
  settings,
  onReviewReport,
  onNavigateToProgressPage,
}) => {
  const [reminderTargetClass, setReminderTargetClass] = useState<SchoolClass | null>(null);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);

  const reportMap = new Map<string, AttendanceReport>();
  reports.forEach((r) => reportMap.set(r.classId, r));

  const currentTime = getVietnamTimeString();

  // Đánh giá tất cả các lớp
  const evaluations: {
    cls: SchoolClass;
    report: AttendanceReport | null;
    eval: ClassDeadlineEvaluation;
  }[] = classes.map((cls) => {
    const rep = reportMap.get(cls.id) || null;
    const ev = attendanceDeadlineService.evaluateClassDeadline(
      cls.id,
      currentDate,
      session,
      rep,
      settings,
      currentTime
    );
    return { cls, report: rep, eval: ev };
  });

  // Phân nhóm
  const overdueClasses = evaluations.filter((e) => e.eval.deadlineStatus === 'OVERDUE');
  const revisionClasses = evaluations.filter(
    (e) => e.eval.reportStatus === 'REVISION_REQUIRED' || e.eval.deadlineStatus === 'OVERDUE_REVISION'
  );
  const pendingClasses = evaluations.filter((e) => e.eval.reportStatus === 'PENDING_APPROVAL');
  const approvedClasses = evaluations.filter(
    (e) => e.eval.reportStatus === 'APPROVED' || e.eval.reportStatus === 'LOCKED'
  );
  const unsubmittedClasses = evaluations.filter((e) => e.eval.reportStatus === 'NOT_SUBMITTED');

  // Sắp xếp các lớp cần xử lý ngay theo thứ tự ưu tiên (Mục XIV)
  // 1. Quá hạn chưa báo
  // 2. Cần chỉnh sửa quá hạn
  // 3. Chờ duyệt
  const urgentQueue = [...evaluations]
    .filter((e) => e.eval.priorityRank <= 3)
    .sort((a, b) => a.eval.priorityRank - b.eval.priorityRank);

  const totalClasses = classes.length;
  const isAllApproved = approvedClasses.length === totalClasses && revisionClasses.length === 0;
  const isAllSubmitted = unsubmittedClasses.length === 0;

  // Danh sách ID các lớp chưa báo cáo để gửi bulk reminder
  const unsubmittedClassIds = unsubmittedClasses.map((e) => e.cls.id);

  return (
    <div className="space-y-4">
      {/* ==================================================
          KHU VỰC ĐẦU TRANG: CẦN XỬ LÝ NGAY (Mục XIII, XIV)
      ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Widget */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black shadow-xs">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  THEO DÕI BÁO CÁO SĨ SỐ {session === 'AFTERNOON' ? 'BUỔI CHIỀU' : 'BUỔI SÁNG'}
                </h3>
                <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                  Giờ hệ thống: {currentTime}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hạn chót: {session === 'AFTERNOON' ? (settings.afternoonDeadlineTime || '13:45') : (settings.morningDeadlineTime || '07:20')} · Giờ chốt dự kiến: {session === 'AFTERNOON' ? (settings.afternoonFinalizeTargetTime || '13:55') : (settings.morningFinalizeTargetTime || '07:30')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unsubmittedClassIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkReminderOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
                title="Gửi nhắc nhở hàng loạt tới tất cả các lớp chưa gửi"
              >
                <Bell className="w-4 h-4 text-amber-900" />
                <span>NHẮC CÁC LỚP CHƯA BÁO ({unsubmittedClassIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToProgressPage}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>TIẾN ĐỘ CHI TIẾT</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Blocks (Mục XIII, LXIV) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 border-b border-slate-100">
          {/* 1. Quá hạn chưa báo */}
          <div className={`p-4 transition-colors ${overdueClasses.length > 0 ? 'bg-rose-50/50' : 'bg-white'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span className="uppercase text-[11px] text-rose-700">Quá hạn chưa báo</span>
              <AlertCircle className={`w-4 h-4 ${overdueClasses.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${overdueClasses.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {overdueClasses.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">lớp</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {overdueClasses.length > 0 ? 'Cần Tổng phụ trách đôn đốc' : 'Không có lớp quá hạn'}
            </p>
          </div>

          {/* 2. Cần chỉnh sửa */}
          <div className={`p-4 transition-colors ${revisionClasses.length > 0 ? 'bg-pink-50/50' : 'bg-white'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span className="uppercase text-[11px] text-pink-700">Cần chỉnh sửa</span>
              <RotateCcw className={`w-4 h-4 ${revisionClasses.length > 0 ? 'text-pink-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${revisionClasses.length > 0 ? 'text-pink-600' : 'text-slate-800'}`}>
                {revisionClasses.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">lớp</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {revisionClasses.length > 0 ? 'Đang chờ GVCN sửa lại' : 'Không có yêu cầu sửa'}
            </p>
          </div>

          {/* 3. Chờ duyệt */}
          <div className={`p-4 transition-colors ${pendingClasses.length > 0 ? 'bg-amber-50/50' : 'bg-white'}`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span className="uppercase text-[11px] text-amber-800">Chờ duyệt</span>
              <Clock className={`w-4 h-4 ${pendingClasses.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black ${pendingClasses.length > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {pendingClasses.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">lớp</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {pendingClasses.length > 0 ? 'Sẵn sàng để TPT phê duyệt' : 'Đã duyệt hết các lớp gửi'}
            </p>
          </div>

          {/* 4. Đã duyệt / hoàn thành */}
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span className="uppercase text-[11px] text-emerald-700">Đã duyệt hoàn tất</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {approvedClasses.length}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/{totalClasses} lớp</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAllApproved ? 'Đủ 20/20 lớp - Sẵn sàng chốt' : `Còn ${totalClasses - approvedClasses.length} lớp chưa duyệt`}
            </p>
          </div>
        </div>

        {/* ==================================================
            CẢNH BÁO TÌNH HUỐNG NGHIỆP VỤ (Mục XXX, XXXI, LXV)
        ================================================== */}
        {/* Tình huống 1: 20/20 lớp đã gửi nhưng còn báo cáo chờ duyệt (Mục XXXI) */}
        {isAllSubmitted && pendingClasses.length > 0 && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>20/20 lớp đã gửi báo cáo</strong> nhưng còn{' '}
                <strong>{pendingClasses.length} báo cáo đang chờ duyệt</strong>. Vui lòng kiểm tra và duyệt để đủ điều kiện chốt sổ.
              </span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded">
              CHƯA CHỐT ĐƯỢC
            </span>
          </div>
        )}

        {/* Tình huống 2: Hoàn thành 20/20 lớp (Mục LXV) */}
        {isAllApproved && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>ĐÃ HOÀN THÀNH BÁO CÁO 20/20 LỚP.</strong> Tất cả sĩ số đã được xác nhận chuẩn xác. Tổng phụ trách có thể chốt sổ sĩ số toàn trường.
              </span>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg shadow-2xs">
              ĐỦ ĐIỀU KIỆN CHỐT
            </span>
          </div>
        )}

        {/* ==================================================
            DANH SÁCH LỚP CẦN XỬ LÝ THEO ƯU TIÊN (Mục XIV, XV)
        ================================================== */}
        {urgentQueue.length > 0 ? (
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>DANH SÁCH CẦN XỬ LÝ THEO THỨ TỰ ƯU TIÊN ({urgentQueue.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">Ưu tiên: Quá hạn → Cần sửa → Chờ duyệt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentQueue.map(({ cls, report, eval: ev }) => {
                const isOverdue = ev.deadlineStatus === 'OVERDUE';
                const isRevision = ev.reportStatus === 'REVISION_REQUIRED';
                const isPending = ev.reportStatus === 'PENDING_APPROVAL';

                return (
                  <div
                    key={cls.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isOverdue
                        ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                        : isRevision
                        ? 'bg-pink-50/70 border-pink-200 shadow-2xs'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            Lớp {cls.name}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase">
                              Quá hạn {ev.overdueMinutes}p
                            </span>
                          )}
                          {isRevision && (
                            <span className="text-[10px] font-black bg-pink-600 text-white px-1.5 py-0.2 rounded uppercase">
                              Cần sửa
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-black bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded uppercase">
                              Chờ duyệt
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          GVCN: <strong>{cls.teacherName || 'Chưa phân công'}</strong>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500">
                        <div>Hạn: {ev.deadlineTime}</div>
                        {ev.submittedAt && (
                          <div className="text-blue-700 font-semibold">
                            Gửi lúc: {ev.submittedAt.includes(' ') ? ev.submittedAt.split(' ')[1] : ev.submittedAt}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lý do cần sửa nếu có */}
                    {isRevision && report?.revisionReason && (
                      <div className="text-[11px] text-pink-900 bg-pink-100/80 p-2 rounded-lg mb-2.5 italic">
                        Lý do yêu cầu sửa: {report.revisionReason}
                      </div>
                    )}

                    {/* Footer hành động */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-[11px] text-slate-500">
                        {isOverdue
                          ? 'Chưa có dữ liệu xác nhận'
                          : isPending
                          ? `Có mặt: ${report?.presentCount}/${report?.totalStudents}`
                          : 'Đang chờ gửi lại'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Nút gửi nhắc thủ công */}
                        {(isOverdue || ev.reportStatus === 'NOT_SUBMITTED') && (
                          <button
                            type="button"
                            onClick={() => setReminderTargetClass(cls)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            title="Gửi thông báo nhắc GVCN này"
                          >
                            <Send className="w-3 h-3 text-amber-900" />
                            <span>GỬI NHẮC</span>
                          </button>
                        )}

                        {/* Nút Xem / Duyệt */}
                        <button
                          type="button"
                          onClick={() => onReviewReport(cls.id)}
                          className={`px-3 py-1 font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                            isPending
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? 'DUYỆT' : 'XEM'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/50 text-center text-xs text-emerald-800 font-semibold">
            Không có lớp nào cần xử lý khẩn cấp lúc này. Toàn bộ tiến độ đang được kiểm soát tốt.
          </div>
        )}
      </div>

      {/* Modal gửi nhắc nhở đơn lẻ hoặc hàng loạt */}
      {reminderTargetClass && (
        <ManualReminderDialog
          isOpen={true}
          onClose={() => setReminderTargetClass(null)}
          date={currentDate}
          session={session}
          targetClass={reminderTargetClass}
        />
      )}

      {isBulkReminderOpen && (
        <ManualReminderDialog
          isOpen={true}
          onClose={() => setIsBulkReminderOpen(false)}
          date={currentDate}
          session={session}
          targetClassIds={unsubmittedClassIds}
        />
      )}
    </div>
  );
};
