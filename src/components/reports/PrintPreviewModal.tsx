import React, { useRef, useState } from 'react';
import { DailyClassRow, GradeGroupSummary } from '../../services/dailyReportService';
import { AttendanceRecord, SessionType, getSessionDisplayName } from '../../types';
import { formatVietnameseDate } from '../../utils/formatters';
import { pdfExportService, SignatureConfig, DEFAULT_SIGNATURE_CONFIG } from '../../services/pdfExportService';
import { printService } from '../../services/printService';
import {
  Printer,
  FileDown,
  X,
  Settings,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  session: SessionType;
  schoolName: string;
  schoolAddress: string;
  isOfficial: boolean;
  reportVersion: number;
  finalizedAt?: string;
  finalizedBy?: string;
  finalizedByTitle?: string;
  totalClasses: number;
  approvedClasses: number;
  totalStudentsRoster: number;
  confirmedStudents: number;
  presentCount: number;
  absentCount: number;
  excusedAbsentCount: number;
  unexcusedAbsentCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  boardingTotalRoster: number;
  boardingPresent: number;
  boardingAbsent: number;
  nonBoardingTotalRoster: number;
  nonBoardingPresent: number;
  nonBoardingAbsent: number;
  attendanceRate: number;
  classRows: DailyClassRow[];
  gradeGroups: GradeGroupSummary[];
  absentRecords: AttendanceRecord[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  date,
  session,
  schoolName,
  schoolAddress,
  isOfficial,
  reportVersion,
  finalizedAt,
  finalizedBy,
  finalizedByTitle,
  totalClasses,
  approvedClasses,
  totalStudentsRoster,
  confirmedStudents,
  presentCount,
  absentCount,
  excusedAbsentCount,
  unexcusedAbsentCount,
  lateCount,
  earlyLeaveCount,
  boardingTotalRoster,
  boardingPresent,
  boardingAbsent,
  nonBoardingTotalRoster,
  nonBoardingPresent,
  nonBoardingAbsent,
  attendanceRate,
  classRows,
  gradeGroups,
  absentRecords,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [signatureConfig, setSignatureConfig] = useState<SignatureConfig>(DEFAULT_SIGNATURE_CONFIG);

  if (!isOpen) return null;

  const sessionLabel = getSessionDisplayName(session);

  const handlePrint = () => {
    printService.triggerPrint(`Bao_cao_si_so_${date}`, finalizedBy || 'Phạm Ngọc Thúy');
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExportingPdf(true);
    setExportError(null);

    const prefix = isOfficial ? 'Bao_cao_si_so_THCS_Ban_Bo' : 'Bao_cao_si_so_SO_BO_THCS_Ban_Bo';
    const filename = `${prefix}_${date}.pdf`;

    try {
      const ok = await pdfExportService.exportElementToPdf(
        printAreaRef.current,
        filename,
        'portrait',
        finalizedBy || 'Phạm Ngọc Thúy'
      );
      if (!ok) {
        setExportError('Không thể tạo file báo cáo. Vui lòng thử lại.');
      }
    } catch {
      setExportError('Không thể tạo file báo cáo. Vui lòng thử lại.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Top bar controls */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-600 px-2 py-0.5 rounded text-white uppercase">
              Xem trước bản in A4
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Ngày {date} · {sessionLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Cấu hình chữ ký"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cấu hình chữ ký</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In A4</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                isExportingPdf
                  ? 'bg-rose-400 text-white cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isExportingPdf ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>ĐANG TẠO FILE...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Xuất PDF thật</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Drawer */}
        {showConfig && (
          <div className="bg-amber-50 p-3 sm:p-4 border-b border-amber-200 text-xs flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2">
            <label className="flex items-center gap-1.5 font-bold text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={signatureConfig.showSignatureSection}
                onChange={(e) =>
                  setSignatureConfig({ ...signatureConfig, showSignatureSection: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Hiển thị vùng chữ ký cuối trang</span>
            </label>

            {signatureConfig.showSignatureSection && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600">Người lập:</span>
                  <input
                    type="text"
                    value={signatureConfig.preparerName}
                    onChange={(e) =>
                      setSignatureConfig({ ...signatureConfig, preparerName: e.target.value })
                    }
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-600">Tổng Phụ trách:</span>
                  <input
                    type="text"
                    value={signatureConfig.adminName}
                    onChange={(e) =>
                      setSignatureConfig({ ...signatureConfig, adminName: e.target.value })
                    }
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-600">BGH/Hiệu trưởng:</span>
                  <input
                    type="text"
                    value={signatureConfig.principalName}
                    onChange={(e) =>
                      setSignatureConfig({ ...signatureConfig, principalName: e.target.value })
                    }
                    className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error banner if export fails */}
        {exportError && (
          <div className="bg-rose-50 border-b border-rose-200 p-2 text-rose-700 text-xs font-bold text-center">
            {exportError}
          </div>
        )}

        {/* Scrollable preview body */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-200/80">
          {/* Printable A4 Paper representation */}
          <div
            ref={printAreaRef}
            className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-lg text-slate-900 border border-slate-300 font-sans print-container text-[12px] leading-relaxed"
          >
            {/* Header section (Mục XLVII) */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div>
                <div className="text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
                  {schoolName}
                </div>
                <div className="text-[11px] text-slate-600">
                  {schoolAddress} · Phòng GD&ĐT Tam Đường
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-slate-900">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] italic text-slate-700">
                  Độc lập - Tự do - Hạnh phúc
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4">
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-wider">
                {isOfficial
                  ? `BÁO CÁO SĨ SỐ HỌC SINH ${sessionLabel.toUpperCase()}`
                  : `BÁO CÁO SĨ SỐ HỌC SINH SƠ BỘ (${approvedClasses}/${totalClasses} LỚP ĐÃ DUYỆT)`}
              </h1>
              <div className="text-[12px] italic text-slate-700 mt-0.5">
                Ngày {formatVietnameseDate(date)} · Năm học 2026–2027
              </div>
              <div className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border border-slate-400 uppercase">
                {isOfficial ? 'BÁO CÁO CHÍNH THỨC' : 'BÁO CÁO SƠ BỘ'} · Phiên bản v{reportVersion}
              </div>
            </div>

            {/* PHẦN I: TỔNG HỢP TOÀN TRƯỜNG (Mục XLVIII) */}
            <div className="mb-4">
              <div className="font-extrabold text-[12px] uppercase text-slate-950 mb-1 border-b border-slate-300 pb-0.5">
                I. TỔNG HỢP TOÀN TRƯỜNG
              </div>
              <table className="w-full text-[11px] border-collapse border border-slate-400">
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 p-1.5 font-bold w-1/4">Tổng số lớp:</td>
                    <td className="border border-slate-400 p-1.5 w-1/4">{totalClasses} lớp</td>
                    <td className="border border-slate-400 p-1.5 font-bold w-1/4">Lớp đã duyệt:</td>
                    <td className="border border-slate-400 p-1.5 w-1/4">
                      {approvedClasses}/{totalClasses} lớp
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-bold">Tổng HS theo DS:</td>
                    <td className="border border-slate-400 p-1.5 font-black">{totalStudentsRoster} HS</td>
                    <td className="border border-slate-400 p-1.5 font-bold">HS đã xác nhận:</td>
                    <td className="border border-slate-400 p-1.5 font-black">{confirmedStudents} HS</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-400 p-1.5 font-bold">Có mặt:</td>
                    <td className="border border-slate-400 p-1.5 font-black text-emerald-900">
                      {presentCount} HS ({attendanceRate.toFixed(1)}%)
                    </td>
                    <td className="border border-slate-400 p-1.5 font-bold">Vắng:</td>
                    <td className="border border-slate-400 p-1.5 font-black text-rose-900">
                      {absentCount} HS (Có phép: {excusedAbsentCount}, Không phép: {unexcusedAbsentCount})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5 font-bold">Đi muộn / Về sớm:</td>
                    <td className="border border-slate-400 p-1.5">
                      Đi muộn: {lateCount} · Về sớm: {earlyLeaveCount}
                    </td>
                    <td className="border border-slate-400 p-1.5 font-bold">Bán trú / Ngoại trú:</td>
                    <td className="border border-slate-400 p-1.5">
                      Bán trú: {boardingPresent}/{boardingTotalRoster} có mặt · Ngoại trú: {nonBoardingPresent}/{nonBoardingTotalRoster}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PHẦN II: THEO KHỐI (Mục XLVIII) */}
            <div className="mb-4">
              <div className="font-extrabold text-[12px] uppercase text-slate-950 mb-1 border-b border-slate-300 pb-0.5">
                II. TỔNG HỢP THEO KHỐI
              </div>
              <table className="w-full text-[11px] border-collapse border border-slate-400 text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-1">Khối</th>
                    <th className="border border-slate-400 p-1">Số lớp</th>
                    <th className="border border-slate-400 p-1">Tổng HS</th>
                    <th className="border border-slate-400 p-1">Có mặt</th>
                    <th className="border border-slate-400 p-1">Vắng</th>
                    <th className="border border-slate-400 p-1">Bán trú</th>
                    <th className="border border-slate-400 p-1">Ngoại trú</th>
                    <th className="border border-slate-400 p-1">Tỉ lệ (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeGroups.map(g => (
                    <tr key={g.grade}>
                      <td className="border border-slate-400 p-1 font-bold">{g.gradeLabel}</td>
                      <td className="border border-slate-400 p-1">{g.totalClassesCount}</td>
                      <td className="border border-slate-400 p-1">{g.totalStudents}</td>
                      <td className="border border-slate-400 p-1 font-bold text-emerald-900">{g.presentCount}</td>
                      <td className="border border-slate-400 p-1 font-bold text-rose-900">{g.absentCount}</td>
                      <td className="border border-slate-400 p-1">{g.boardingPresent}/{g.boardingTotal}</td>
                      <td className="border border-slate-400 p-1">{g.nonBoardingPresent}/{g.nonBoardingTotal}</td>
                      <td className="border border-slate-400 p-1 font-bold">{g.attendanceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PHẦN III: CHI TIẾT 20 LỚP (Mục XLVIII) */}
            <div className="mb-4">
              <div className="font-extrabold text-[12px] uppercase text-slate-950 mb-1 border-b border-slate-300 pb-0.5">
                III. CHI TIẾT SĨ SỐ 20 LỚP
              </div>
              <table className="w-full text-[10px] border-collapse border border-slate-400 text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-0.5 w-6">STT</th>
                    <th className="border border-slate-400 p-0.5">Lớp</th>
                    <th className="border border-slate-400 p-0.5 text-left pl-1">GVCN</th>
                    <th className="border border-slate-400 p-0.5">Sĩ số</th>
                    <th className="border border-slate-400 p-0.5">Có mặt</th>
                    <th className="border border-slate-400 p-0.5">Vắng</th>
                    <th className="border border-slate-400 p-0.5">Phép</th>
                    <th className="border border-slate-400 p-0.5">K.Phép</th>
                    <th className="border border-slate-400 p-0.5">BT có mặt</th>
                    <th className="border border-slate-400 p-0.5">NT có mặt</th>
                    <th className="border border-slate-400 p-0.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {classRows.map(c => (
                    <tr key={c.classId} className={c.stt % 2 === 0 ? 'bg-slate-50' : ''}>
                      <td className="border border-slate-400 p-0.5">{c.stt}</td>
                      <td className="border border-slate-400 p-0.5 font-bold">{c.className}</td>
                      <td className="border border-slate-400 p-0.5 text-left pl-1">{c.teacherName}</td>
                      <td className="border border-slate-400 p-0.5">{c.totalStudents}</td>
                      <td className="border border-slate-400 p-0.5 font-bold text-emerald-900">{c.presentCount}</td>
                      <td className="border border-slate-400 p-0.5 font-bold text-rose-900">{c.absentCount}</td>
                      <td className="border border-slate-400 p-0.5">{c.excusedAbsentCount}</td>
                      <td className="border border-slate-400 p-0.5">{c.unexcusedAbsentCount}</td>
                      <td className="border border-slate-400 p-0.5">{c.boardingPresent}/{c.boardingTotal}</td>
                      <td className="border border-slate-400 p-0.5">{c.nonBoardingPresent}/{c.nonBoardingTotal}</td>
                      <td className="border border-slate-400 p-0.5 text-[9px] font-bold">{c.statusText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PHẦN IV: DANH SÁCH HỌC SINH VẮNG (Mục XLVIII) */}
            <div className="mb-4">
              <div className="font-extrabold text-[12px] uppercase text-slate-950 mb-1 border-b border-slate-300 pb-0.5">
                IV. DANH SÁCH HỌC SINH VẮNG
              </div>
              {absentRecords.length === 0 ? (
                <div className="text-[11px] italic text-slate-500 py-1">
                  Không có học sinh vắng trong các lớp đã được phê duyệt.
                </div>
              ) : (
                <table className="w-full text-[10px] border-collapse border border-slate-400 text-left">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <th className="border border-slate-400 p-1 w-6">STT</th>
                      <th className="border border-slate-400 p-1">Họ và tên</th>
                      <th className="border border-slate-400 p-1 w-10">Lớp</th>
                      <th className="border border-slate-400 p-1 w-16">Diện</th>
                      <th className="border border-slate-400 p-1 w-20">Loại vắng</th>
                      <th className="border border-slate-400 p-1">Lí do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentRecords.map((r, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-400 p-1 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-1 font-bold">{r.studentName}</td>
                        <td className="border border-slate-400 p-1 text-center">{r.className}</td>
                        <td className="border border-slate-400 p-1 text-center">
                          {r.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}
                        </td>
                        <td className="border border-slate-400 p-1 text-center font-bold">
                          {r.status === 'ABSENT_EXCUSED' || r.absenceType === 'excused' ? 'Có phép' : 'Không phép'}
                        </td>
                        <td className="border border-slate-400 p-1">{r.reason || 'Chưa rõ'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* PHẦN V: THÔNG TIN CHỐT & CHỮ KÝ (Mục XLIX, L, LI) */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] italic text-slate-600 mb-6">
                <div>Thời gian ghi nhận: {finalizedAt || new Date().toLocaleString('vi-VN')}</div>
                <div>Bản Bo, ngày {formatVietnameseDate(date)}</div>
              </div>

              {signatureConfig.showSignatureSection && (
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2">
                  <div>
                    <div className="font-bold uppercase">{signatureConfig.preparerTitle}</div>
                    <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-extrabold text-slate-900">{signatureConfig.preparerName}</div>
                  </div>

                  <div>
                    <div className="font-bold uppercase">{signatureConfig.adminTitle}</div>
                    <div className="text-[10px] text-slate-500">(Ký và xác nhận)</div>
                    <div className="h-16"></div>
                    <div className="font-extrabold text-slate-900">{signatureConfig.adminName}</div>
                  </div>

                  <div>
                    <div className="font-bold uppercase">{signatureConfig.principalTitle}</div>
                    <div className="text-[10px] text-slate-500">(Ký và đóng dấu)</div>
                    <div className="h-16"></div>
                    <div className="font-extrabold text-slate-900">{signatureConfig.principalName}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
