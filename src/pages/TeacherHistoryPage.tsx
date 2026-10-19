import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { formatFullVietnameseDate } from '../utils/formatters';
import { AttendanceReport } from '../types';
import {
  History,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  ChevronRight,
  Eye,
  UtensilsCrossed,
  Users,
} from 'lucide-react';

interface TeacherHistoryPageProps {
  onNavigateHome: () => void;
}

export const TeacherHistoryPage: React.FC<TeacherHistoryPageProps> = ({
  onNavigateHome,
}) => {
  const { currentUser } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [viewingReport, setViewingReport] = useState<AttendanceReport | null>(null);

  const assignedClass = useMemo(() => {
    if (!currentUser?.assignedClassId) return null;
    return storageService.getClassById(currentUser.assignedClassId) || null;
  }, [currentUser]);

  const reports: AttendanceReport[] = useMemo(() => {
    if (!assignedClass) return [];
    const all = storageService.getReports().filter(r => r.classId === assignedClass.id);
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }, [assignedClass]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ĐÃ DUYỆT</span>;
      case 'LOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">ĐÃ KHÓA</span>;
      case 'PENDING_APPROVAL':
      case 'submitted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">CHỜ DUYỆT</span>;
      case 'REVISION_REQUIRED':
      case 'needs_revision':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">CẦN SỬA</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">CHƯA BÁO CÁO</span>;
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={onNavigateHome}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-black text-slate-900 uppercase">
            LỊCH SỬ BÁO CÁO SĨ SỐ
          </h1>
          <div className="text-xs text-slate-500">
            Lớp <strong>{assignedClass?.name}</strong> · GVCN: <strong>{currentUser?.name}</strong>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-2.5">
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
            Chưa có lịch sử báo cáo nào được ghi nhận cho lớp này.
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              onClick={() => setViewingReport(rep)}
              className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{formatFullVietnameseDate(rep.date)}</span>
                </div>
                {getStatusBadge(rep.status)}
              </div>

              <div className="grid grid-cols-4 gap-1 bg-slate-50 p-2 rounded-lg text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Sĩ số</div>
                  <div className="font-bold text-slate-900">{rep.totalStudents}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700">Có mặt</div>
                  <div className="font-bold text-emerald-800">{rep.presentCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-rose-700">Vắng</div>
                  <div className="font-bold text-rose-800">{rep.absentCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-700">BT có mặt</div>
                  <div className="font-bold text-amber-900">{rep.boardingPresent}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                <span>Gửi lúc: {rep.submittedAt || '--'}</span>
                {rep.revisionCount ? (
                  <span className="text-rose-600 font-bold">Số lần sửa: {rep.revisionCount}</span>
                ) : null}
                <span className="text-blue-600 font-bold flex items-center gap-0.5">
                  Chi tiết <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal (Mục XXXVIII) */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  CHI TIẾT BÁO CÁO LỚP {viewingReport.className}
                </h3>
                <div className="text-[11px] text-slate-500">
                  Ngày {formatFullVietnameseDate(viewingReport.date)}
                </div>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div>Trạng thái: {getStatusBadge(viewingReport.status)}</div>
              <div>Thời gian gửi: <strong>{viewingReport.submittedAt || '--'}</strong></div>
              <div>Thời gian duyệt: <strong>{viewingReport.approvedAt || 'Chưa duyệt'}</strong></div>
              {viewingReport.revisionCount ? (
                <div>Số lần chỉnh sửa: <strong>{viewingReport.revisionCount}</strong></div>
              ) : null}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-700">Tổng kết:</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>Có mặt: <strong>{viewingReport.presentCount}/{viewingReport.totalStudents}</strong></div>
                <div>Vắng: <strong>{viewingReport.absentCount}</strong> (CP: {viewingReport.excusedAbsentCount || 0}, KP: {viewingReport.unexcusedAbsentCount || 0})</div>
                <div>Bán trú có mặt: <strong>{viewingReport.boardingPresent}/{viewingReport.boardingTotal}</strong></div>
                <div>Ngoại trú có mặt: <strong>{viewingReport.nonBoardingPresent}/{viewingReport.nonBoardingTotal}</strong></div>
              </div>
            </div>

            {/* Absent Students List */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-700 uppercase text-[11px]">Học sinh vắng / đi muộn:</div>
              {viewingReport.records.filter(r => (r.status as string).toUpperCase() !== 'PRESENT').length === 0 ? (
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px] font-bold">
                  Lớp đủ sĩ số, không có học sinh vắng.
                </div>
              ) : (
                viewingReport.records
                  .filter(r => (r.status as string).toUpperCase() !== 'PRESENT')
                  .map(s => (
                    <div key={s.studentId} className="bg-rose-50 p-2 rounded-lg border border-rose-200 text-[11px]">
                      <div className="font-bold text-slate-900">{s.studentName} ({s.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'})</div>
                      <div className="text-rose-800">
                        {s.status === 'ABSENT_EXCUSED' ? 'Vắng có phép' : s.status === 'ABSENT_UNEXCUSED' ? 'Vắng không phép' : 'Đi muộn'}
                        {s.reason ? ` - ${s.reason}` : ''}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
