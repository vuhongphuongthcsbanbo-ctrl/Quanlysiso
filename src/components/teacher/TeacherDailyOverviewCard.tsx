import React, { useMemo } from 'react';
import { SchoolClass, AttendanceReport, SessionType } from '../../types';
import { SessionStatusBadge } from '../common/SessionStatusBadge';
import {
  Sun,
  Sunset,
  CalendarRange,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  UserCheck,
  UserX,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface TeacherDailyOverviewCardProps {
  currentClass: SchoolClass;
  currentDate: string;
  morningReport: AttendanceReport | null;
  afternoonReport: AttendanceReport | null;
  totalStudents: number;
  boardingTotal: number;
  nonBoardingTotal: number;
  onSelectSession: (session: SessionType) => void;
}

export const TeacherDailyOverviewCard: React.FC<TeacherDailyOverviewCardProps> = ({
  currentClass,
  currentDate,
  morningReport,
  afternoonReport,
  totalStudents,
  boardingTotal,
  nonBoardingTotal,
  onSelectSession,
}) => {
  // Aggregate absent students across morning and afternoon
  const combinedAbsentStudents = useMemo(() => {
    const studentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        studentCode?: string;
        boardingType?: string;
        morningAbsent: boolean;
        morningReason?: string;
        morningStatus?: string;
        afternoonAbsent: boolean;
        afternoonReason?: string;
        afternoonStatus?: string;
      }
    >();

    // Process Morning
    if (morningReport?.records) {
      morningReport.records.forEach((r) => {
        const s = String(r.status).toUpperCase();
        const isAbsentOrChanged = s === 'ABSENT_EXCUSED' || s === 'ABSENT_UNEXCUSED' || s === 'LATE' || s === 'EARLY_LEAVE';
        if (isAbsentOrChanged) {
          studentMap.set(r.studentId, {
            studentId: r.studentId,
            studentName: r.studentName,
            studentCode: r.studentCode,
            boardingType: r.boardingType,
            morningAbsent: true,
            morningReason: r.reason || (s === 'ABSENT_EXCUSED' ? 'Có phép' : s === 'ABSENT_UNEXCUSED' ? 'Không phép' : 'Đi muộn'),
            morningStatus: s,
            afternoonAbsent: false,
          });
        }
      });
    }

    // Process Afternoon
    if (afternoonReport?.records) {
      afternoonReport.records.forEach((r) => {
        const s = String(r.status).toUpperCase();
        const isAbsentOrChanged = s === 'ABSENT_EXCUSED' || s === 'ABSENT_UNEXCUSED' || s === 'LATE' || s === 'EARLY_LEAVE';
        if (isAbsentOrChanged) {
          const existing = studentMap.get(r.studentId);
          if (existing) {
            existing.afternoonAbsent = true;
            existing.afternoonReason = r.reason || (s === 'ABSENT_EXCUSED' ? 'Có phép' : s === 'ABSENT_UNEXCUSED' ? 'Không phép' : 'Đi muộn');
            existing.afternoonStatus = s;
          } else {
            studentMap.set(r.studentId, {
              studentId: r.studentId,
              studentName: r.studentName,
              studentCode: r.studentCode,
              boardingType: r.boardingType,
              morningAbsent: false,
              afternoonAbsent: true,
              afternoonReason: r.reason || (s === 'ABSENT_EXCUSED' ? 'Có phép' : s === 'ABSENT_UNEXCUSED' ? 'Không phép' : 'Đi muộn'),
              afternoonStatus: s,
            });
          }
        }
      });
    }

    return Array.from(studentMap.values());
  }, [morningReport, afternoonReport]);

  const hasAnyReport = Boolean(morningReport || afternoonReport);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* 1. Header Tổng quan cả ngày */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                TỔNG QUAN CẢ NGÀY · LỚP {currentClass.name}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                BÁO CÁO TOÀN DIỆN BUỔI SÁNG & BUỔI CHIỀU
              </h3>
            </div>
          </div>
          <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-lg text-slate-300 font-mono hidden sm:inline-block">
            2 buổi độc lập
          </span>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {/* 2. So sánh 2 buổi Sáng & Chiều (2 Cột trực quan) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CỘT BUỔI SÁNG */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 uppercase">BUỔI SÁNG</div>
                  <div className="text-[10px] text-slate-500">Trước 07:45</div>
                </div>
              </div>
              <SessionStatusBadge status={morningReport?.status} size="sm" />
            </div>

            {morningReport ? (
              <div className="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-xl border border-amber-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold">Có mặt</span>
                  <div className="font-black text-emerald-800 text-sm mt-0.5">{morningReport.presentCount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold">Vắng</span>
                  <div className="font-black text-rose-800 text-sm mt-0.5">{morningReport.absentCount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 font-bold">Ăn bán trú</span>
                  <div className="font-black text-amber-800 text-sm mt-0.5">{morningReport.boardingPresent}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-center text-xs text-amber-800 italic">
                Chưa có báo cáo sĩ số buổi sáng
              </div>
            )}

            <button
              type="button"
              onClick={() => onSelectSession('MORNING')}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>{morningReport ? 'XEM / SỬA BÁO CÁO SÁNG' : 'BÁO SĨ SỐ BUỔI SÁNG'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>

          {/* CỘT BUỔI CHIỀU */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sunset className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 uppercase">BUỔI CHIỀU</div>
                  <div className="text-[10px] text-slate-500">Trước 13:45</div>
                </div>
              </div>
              <SessionStatusBadge status={afternoonReport?.status} size="sm" />
            </div>

            {afternoonReport ? (
              <div className="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-xl border border-blue-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold">Có mặt</span>
                  <div className="font-black text-emerald-800 text-sm mt-0.5">{afternoonReport.presentCount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 font-bold">Vắng</span>
                  <div className="font-black text-rose-800 text-sm mt-0.5">{afternoonReport.absentCount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-blue-700 font-bold">Ngoại trú</span>
                  <div className="font-black text-blue-800 text-sm mt-0.5">{afternoonReport.nonBoardingPresent}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-center text-xs text-blue-800 italic">
                Chưa có báo cáo sĩ số buổi chiều
              </div>
            )}

            <button
              type="button"
              onClick={() => onSelectSession('AFTERNOON')}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>{afternoonReport ? 'XEM / SỬA BÁO CÁO CHIỀU' : 'BÁO SĨ SỐ BUỔI CHIỀU'}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>

        {/* 3. Tóm tắt suất ăn bán trú buổi trưa */}
        <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-300">
                SUẤT ĂN BÁN TRÚ HÔM NAY (CHỐT BUỔI SÁNG)
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                {morningReport
                  ? `Nhà bếp chuẩn bị: ${morningReport.boardingPresent} suất ăn trưa`
                  : `Tổng hồ sơ bán trú: ${boardingTotal} học sinh (chờ chốt sĩ số sáng)`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-amber-300 font-mono">
              {morningReport ? morningReport.boardingPresent : boardingTotal}
            </span>
            <span className="text-[10px] text-slate-400 block">suất</span>
          </div>
        </div>

        {/* 4. Tổng hợp danh sách học sinh vắng trong ngày */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase">
              <UserX className="w-4 h-4 text-rose-600" />
              <span>HỌC SINH NGHỈ / THAY ĐỔI TRONG NGÀY ({combinedAbsentStudents.length})</span>
            </div>
            {combinedAbsentStudents.length > 0 && (
              <span className="text-[10px] text-slate-500">Đối chiếu 2 buổi</span>
            )}
          </div>

          {!hasAnyReport ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
              Chưa có dữ liệu báo cáo sĩ số hôm nay để tổng hợp danh sách vắng.
            </div>
          ) : combinedAbsentStudents.length === 0 ? (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-xs text-emerald-900 flex items-center justify-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cả lớp đi học đầy đủ cả 2 buổi, không có học sinh nghỉ học! 🎉</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {combinedAbsentStudents.map((st) => {
                const isBoth = st.morningAbsent && st.afternoonAbsent;
                return (
                  <div key={st.studentId} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <span>{st.studentName}</span>
                        {st.studentCode && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            ({st.studentCode})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          st.boardingType === 'BOARDING'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {st.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                        </span>
                        {st.morningAbsent && (
                          <span>Sáng: <em>{st.morningReason}</em></span>
                        )}
                        {isBoth && <span>·</span>}
                        {st.afternoonAbsent && (
                          <span>Chiều: <em>{st.afternoonReason}</em></span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isBoth ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          VẮNG CẢ NGÀY
                        </span>
                      ) : st.morningAbsent ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          VẮNG BUỔI SÁNG
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                          VẮNG BUỔI CHIỀU
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Nhắc nhở quy định */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <strong>Quy định THCS Bản Bo:</strong> Báo cáo sĩ số buổi sáng hoàn thành trước <strong>07:45</strong>, buổi chiều trước <strong>13:45</strong>. Tổng phụ trách đội sẽ kiểm tra và phê duyệt độc lập từng buổi.
          </div>
        </div>
      </div>
    </div>
  );
};
