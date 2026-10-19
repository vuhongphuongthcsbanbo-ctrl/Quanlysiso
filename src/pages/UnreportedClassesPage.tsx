import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { attendanceService } from '../services/attendanceService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';
import { SessionType, normalizeSession, getSessionDisplayName } from '../types';
import {
  AlertCircle,
  Phone,
  Send,
  Building2,
  Filter,
  CheckCircle2,
  Sun,
  Sunset,
  CalendarRange,
  Users,
  Clock,
} from 'lucide-react';

interface UnreportedClassesPageProps {
  currentDate: string;
  onNavigateToClassReport?: (classId: string, session?: SessionType) => void;
}

export type UnreportedSessionFilter = 'MORNING' | 'AFTERNOON' | 'BOTH';

export const UnreportedClassesPage: React.FC<UnreportedClassesPageProps> = ({
  currentDate,
  onNavigateToClassReport,
}) => {
  const currentHour = new Date().getHours();
  const [sessionFilter, setSessionFilter] = useState<UnreportedSessionFilter>(() => (currentHour >= 12 ? 'AFTERNOON' : 'MORNING'));
  const [gradeFilter, setGradeFilter] = useState<number>(0);

  const classes = useMemo(() => {
    return storageService.getClasses().filter(c => c.isActive);
  }, []);

  const morningReports = useMemo(() => {
    return storageService.getReportsByDate(currentDate, 'MORNING');
  }, [currentDate]);

  const afternoonReports = useMemo(() => {
    return storageService.getReportsByDate(currentDate, 'AFTERNOON');
  }, [currentDate]);

  const morningReportMap = useMemo(() => {
    const map = new Map<string, any>();
    morningReports.forEach(r => map.set(r.classId, r));
    return map;
  }, [morningReports]);

  const afternoonReportMap = useMemo(() => {
    const map = new Map<string, any>();
    afternoonReports.forEach(r => map.set(r.classId, r));
    return map;
  }, [afternoonReports]);

  // Determine unreported classes
  const unreportedList = useMemo(() => {
    return classes
      .map(cls => {
        const mRep = morningReportMap.get(cls.id);
        const aRep = afternoonReportMap.get(cls.id);

        const morningSubmitted = mRep && mRep.status !== 'NOT_SUBMITTED' && (mRep.status as string) !== 'not_reported';
        const afternoonSubmitted = aRep && aRep.status !== 'NOT_SUBMITTED' && (aRep.status as string) !== 'not_reported';

        const isMorningUnreported = !morningSubmitted;
        const isAfternoonUnreported = !afternoonSubmitted;

        let isMatch = false;
        if (sessionFilter === 'MORNING') {
          isMatch = isMorningUnreported;
        } else if (sessionFilter === 'AFTERNOON') {
          isMatch = isAfternoonUnreported;
        } else {
          // BOTH: either morning or afternoon unreported
          isMatch = isMorningUnreported || isAfternoonUnreported;
        }

        if (gradeFilter > 0 && cls.grade !== gradeFilter) {
          isMatch = false;
        }

        return {
          cls,
          mRep,
          aRep,
          isMorningUnreported,
          isAfternoonUnreported,
          isMatch,
        };
      })
      .filter(item => item.isMatch);
  }, [classes, morningReportMap, afternoonReportMap, sessionFilter, gradeFilter]);

  // Statistics counters
  const totalClassesCount = classes.length;
  const morningUnreportedCount = classes.filter(c => {
    const r = morningReportMap.get(c.id);
    return !r || r.status === 'NOT_SUBMITTED' || (r.status as string) === 'not_reported';
  }).length;

  const afternoonUnreportedCount = classes.filter(c => {
    const r = afternoonReportMap.get(c.id);
    return !r || r.status === 'NOT_SUBMITTED' || (r.status as string) === 'not_reported';
  }).length;

  const bothUnreportedCount = classes.filter(c => {
    const mr = morningReportMap.get(c.id);
    const ar = afternoonReportMap.get(c.id);
    const mUn = !mr || mr.status === 'NOT_SUBMITTED' || (mr.status as string) === 'not_reported';
    const aUn = !ar || ar.status === 'NOT_SUBMITTED' || (ar.status as string) === 'not_reported';
    return mUn && aUn;
  }).length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Đôn đốc & Theo dõi điểm danh 2 buổi
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <span>LỚP CHƯA BÁO CÁO SĨ SỐ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngày {formatVietnameseDate(currentDate)} · Trường THCS Bản Bo (20 lớp học 2 buổi)
          </p>
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-2xl shrink-0">
          {[0, 6, 7, 8, 9].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                gradeFilter === g
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g === 0 ? 'Tất cả khối' : `Khối ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Bộ lọc Buổi (Sáng / Chiều / Cả hai buổi) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">LỌC THEO BUỔI HỌC:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BUỔI SÁNG */}
          <button
            type="button"
            onClick={() => setSessionFilter('MORNING')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
              sessionFilter === 'MORNING'
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/40'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>BUỔI SÁNG CHƯA BÁO</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              sessionFilter === 'MORNING' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {morningUnreportedCount}/{totalClassesCount}
            </span>
          </button>

          {/* BUỔI CHIỀU */}
          <button
            type="button"
            onClick={() => setSessionFilter('AFTERNOON')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
              sessionFilter === 'AFTERNOON'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
            <span>BUỔI CHIỀU CHƯA BÁO</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              sessionFilter === 'AFTERNOON' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {afternoonUnreportedCount}/{totalClassesCount}
            </span>
          </button>

          {/* CHƯA BÁO CẢ HAI BUỔI HOẶC BẤT KỲ */}
          <button
            type="button"
            onClick={() => setSessionFilter('BOTH')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
              sessionFilter === 'BOTH'
                ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-500/40'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>CHƯA BÁO ĐỦ 2 BUỔI</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              sessionFilter === 'BOTH' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {bothUnreportedCount} lớp chưa báo cả 2
            </span>
          </button>
        </div>
      </div>

      {/* Nội dung kết quả */}
      {unreportedList.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-emerald-950">
            {sessionFilter === 'MORNING'
              ? 'TẤT CẢ 20 LỚP ĐÃ GỬI BÁO CÁO BUỔI SÁNG!'
              : sessionFilter === 'AFTERNOON'
              ? 'TẤT CẢ 20 LỚP ĐÃ GỬI BÁO CÁO BUỔI CHIỀU!'
              : 'TẤT CẢ 20 LỚP ĐÃ BÁO CÁO ĐẦY ĐỦ!'}
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Không còn lớp nào chưa báo cáo trong phạm vi bộ lọc đã chọn. Tiến độ sĩ số Trường THCS Bản Bo đảm bảo 100%.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {unreportedList.map(({ cls, isMorningUnreported, isAfternoonUnreported, mRep, aRep }) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs space-y-3 hover:border-rose-300 transition-all"
            >
              {/* Header card lớp */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-black text-slate-900">{cls.name}</div>
                  <div className="text-xs text-slate-500">Khối {cls.grade} · Sĩ số: {cls.totalStudents} HS</div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {isMorningUnreported && isAfternoonUnreported ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      CHƯA BÁO CẢ 2 BUỔI
                    </span>
                  ) : isMorningUnreported ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-600" />
                      CHƯA BÁO SÁNG
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <Sunset className="w-3 h-3 text-blue-600" />
                      CHƯA BÁO CHIỀU
                    </span>
                  )}
                </div>
              </div>

              {/* Tình trạng cụ thể từng buổi */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Buổi sáng */}
                <div className={`p-2 rounded-xl border ${
                  isMorningUnreported
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-600">
                    <Sun className="w-3 h-3 text-amber-600" />
                    Buổi sáng
                  </div>
                  <div className="font-black mt-0.5">
                    {isMorningUnreported ? 'Chưa báo' : 'Đã nộp số liệu'}
                  </div>
                </div>

                {/* Buổi chiều */}
                <div className={`p-2 rounded-xl border ${
                  isAfternoonUnreported
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="text-[10px] font-bold uppercase flex items-center gap-1 text-slate-600">
                    <Sunset className="w-3 h-3 text-blue-600" />
                    Buổi chiều
                  </div>
                  <div className="font-black mt-0.5">
                    {isAfternoonUnreported ? 'Chưa báo' : 'Đã nộp số liệu'}
                  </div>
                </div>
              </div>

              {/* Thông tin GVCN */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-500">Giáo viên chủ nhiệm:</div>
                <div className="font-black text-slate-900 text-sm">{cls.teacherName || 'Chưa phân công'}</div>
                <div className="flex items-center gap-1.5 text-blue-700 font-bold pt-1">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${cls.teacherPhone}`} className="hover:underline">
                    {cls.teacherPhone || 'Chưa có SĐT'}
                  </a>
                </div>
              </div>

              {/* Footer hành động */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 italic">
                  BT: {cls.boardingCount} · NT: {cls.nonBoardingCount || cls.dayCount}
                </span>

                {onNavigateToClassReport && (
                  <div className="flex items-center gap-1.5">
                    {isMorningUnreported && (
                      <button
                        type="button"
                        onClick={() => onNavigateToClassReport(cls.id, 'MORNING')}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        title="Báo cáo hộ buổi sáng"
                      >
                        Báo Sáng
                      </button>
                    )}
                    {isAfternoonUnreported && (
                      <button
                        type="button"
                        onClick={() => onNavigateToClassReport(cls.id, 'AFTERNOON')}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        title="Báo cáo hộ buổi chiều"
                      >
                        Báo Chiều
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
