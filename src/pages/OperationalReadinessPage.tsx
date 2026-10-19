import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { securityService, ReadinessCheckResult } from '../services/securityService';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2,
  Users,
  UtensilsCrossed,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OperationalReadinessPageProps {
  onNavigate?: (page: string) => void;
}

export const OperationalReadinessPage: React.FC<OperationalReadinessPageProps> = ({ onNavigate }) => {
  const [readiness, setReadiness] = useState(() => securityService.checkOperationalReadiness());
  const [filterOnlyUnready, setFilterOnlyUnready] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Nút kiểm tra lại thực tế (Mục XCII)
  const handleRecheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setReadiness(securityService.checkOperationalReadiness());
      setIsChecking(false);
    }, 400);
  };

  const displayedClasses = filterOnlyUnready
    ? readiness.classResults.filter(c => !c.isReadyForAttendance)
    : readiness.classResults;

  // Thống kê 6 chỉ số
  const studentPassCount = readiness.classResults.filter(c => c.hasStudents).length;
  const boardingPassCount = readiness.classResults.filter(c => c.hasBoardingSet).length;
  const teacherPassCount = readiness.classResults.filter(c => c.hasHeadTeacher).length;
  const accountPassCount = readiness.classResults.filter(c => c.hasUserAccount && c.isAccountActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Kiểm Tra Hệ Thống · Trường THCS Bản Bo
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Kiểm Tra Sẵn Sàng Vận Hành (20 Lớp)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối soát toàn diện 6 tiêu chuẩn vận hành: Học sinh, Bán trú, GVCN và Tài khoản đăng nhập
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>KIỂM TRA LẠI</span>
          </button>
        </div>
      </div>

      {/* OVERALL STATUS BANNER (Mục XCI) */}
      <div
        className={`p-6 rounded-3xl border shadow-xs space-y-4 ${
          readiness.isSystemReady
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-emerald-300'
            : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-amber-300'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${
                readiness.isSystemReady
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {readiness.isSystemReady ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                KẾT QUẢ ĐỐI SOÁT VẬN HÀNH TOÀN TRƯỜNG
              </div>
              <h2
                className={`text-xl sm:text-2xl font-black uppercase mt-0.5 ${
                  readiness.isSystemReady ? 'text-emerald-900' : 'text-amber-950'
                }`}
              >
                {readiness.isSystemReady ? 'SẴN SÀNG VẬN HÀNH CHÍNH THỨC' : 'CHƯA SẴN SÀNG VẬN HÀNH'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterOnlyUnready(!filterOnlyUnready)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                filterOnlyUnready
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {filterOnlyUnready ? 'Hiển thị tất cả 20 lớp' : `Xem lớp chưa sẵn sàng (${readiness.unreadyCount})`}
            </button>
          </div>
        </div>

        {/* Global Warnings */}
        {readiness.globalWarnings.length > 0 && (
          <div className="p-3.5 bg-white/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Các vấn đề cần hoàn thiện trước khi đưa vào vận hành:</span>
            </div>
            <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-800">
              {readiness.globalWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 6 Standards Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>20 Lớp Chính Thức</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">20 / 20</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khối 6, 7, 8, 9</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dữ Liệu Học Sinh</span>
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              studentPassCount === 20 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {studentPassCount} / 20
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">lớp đã có học sinh</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Phân Công GVCN</span>
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              teacherPassCount === 20 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {teacherPassCount} / 20
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">lớp đã có GVCN</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Tài Khoản GVCN</span>
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              accountPassCount === 20 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {accountPassCount} / 20
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">tài khoản hoạt động</div>
        </div>
      </div>

      {/* DETAILED 20 CLASSES CHECK TABLE (Mục LVI) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 uppercase">
            Bảng Kiểm Tra 20 Lớp (Năm Học 2026–2027)
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {readiness.readyCount}/20 lớp đạt chuẩn vận hành
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3.5 font-bold w-14 text-center">Lớp</th>
                <th className="p-3.5 font-bold text-center">Có học sinh?</th>
                <th className="p-3.5 font-bold text-center">Định diện Bán trú?</th>
                <th className="p-3.5 font-bold">Giáo viên chủ nhiệm</th>
                <th className="p-3.5 font-bold text-center">Tài khoản GVCN?</th>
                <th className="p-3.5 font-bold text-center">Tài khoản hoạt động?</th>
                <th className="p-3.5 font-bold text-center">Kết quả</th>
                <th className="p-3.5 font-bold">Ghi chú & Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedClasses.map(cr => (
                <tr
                  key={cr.className}
                  className={`transition-colors ${
                    cr.isReadyForAttendance ? 'hover:bg-slate-50/70' : 'bg-amber-50/30 hover:bg-amber-50/60'
                  }`}
                >
                  <td className="p-3.5 text-center font-black text-sm text-blue-700 bg-blue-50/30">
                    {cr.className}
                  </td>

                  {/* 1. Có học sinh? */}
                  <td className="p-3.5 text-center">
                    {cr.hasStudents ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        ĐẠT ({cr.studentCount} HS)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px]">
                        CHƯA CÓ
                      </span>
                    )}
                  </td>

                  {/* 2. Đã xác định bán trú? */}
                  <td className="p-3.5 text-center">
                    {cr.hasBoardingSet ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        ĐẠT (100%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                        CÒN {cr.unsetBoardingCount} CHƯA RÕ
                      </span>
                    )}
                  </td>

                  {/* 3. Có GVCN? */}
                  <td className="p-3.5">
                    {cr.hasHeadTeacher ? (
                      <div className="font-extrabold text-slate-900">{cr.headTeacherName}</div>
                    ) : (
                      <div className="text-red-600 font-bold flex items-center gap-1 italic">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Chưa phân công</span>
                      </div>
                    )}
                  </td>

                  {/* 4. GVCN có tài khoản? */}
                  <td className="p-3.5 text-center">
                    {cr.hasUserAccount ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                    )}
                  </td>

                  {/* 5. Tài khoản hoạt động? */}
                  <td className="p-3.5 text-center">
                    {cr.isAccountActive ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        HOẠT ĐỘNG
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px]">
                        CHƯA KÍCH HOẠT
                      </span>
                    )}
                  </td>

                  {/* 6. Kết quả */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        cr.isReadyForAttendance
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cr.isReadyForAttendance ? 'SẴN SÀNG' : 'CHƯA SẴN SÀNG'}
                    </span>
                  </td>

                  {/* Ghi chú & Lý do */}
                  <td className="p-3.5 text-[11px]">
                    {cr.unreadyReasons.length > 0 ? (
                      <div className="text-red-700 font-medium space-y-0.5">
                        {cr.unreadyReasons.map((r, i) => (
                          <div key={i}>• {r}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Đầy đủ điều kiện báo cáo sĩ số</span>
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
