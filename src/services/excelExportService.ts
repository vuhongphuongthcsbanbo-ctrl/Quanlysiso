import * as XLSX from 'xlsx';
import { SessionType, normalizeSession, getSessionDisplayName, AttendanceRecord } from '../types';
import { storageService } from './storageService';
import { dailyReportService } from './dailyReportService';
import { monthlyReportService } from './monthlyReportService';
import { teacherSubmissionService } from './teacherSubmissionService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';

class ExcelExportService {
  /**
   * Helper to set column widths on a sheet
   */
  private setColWidths(ws: XLSX.WorkSheet, colWidths: number[]) {
    ws['!cols'] = colWidths.map(w => ({ wch: w }));
  }

  /**
   * Helper to write workbook to file
   */
  private saveWorkbook(wb: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(wb, filename);
  }

  /**
   * Export Daily Report with 6 SHEETS (Mục XXXVI - XLIII)
   * Sheet 1: TONG_HOP
   * Sheet 2: CHI_TIET_20_LOP
   * Sheet 3: HOC_SINH_VANG
   * Sheet 4: BAN_TRU
   * Sheet 5: NGOAI_TRU
   * Sheet 6: TIEN_DO_BAO_CAO
   */
  public exportDailyReportExcel(
    date: string = getTodayDateString(),
    session: SessionType = 'MORNING',
    userId: string = 'curr',
    userName: string = 'Phạm Ngọc Thúy'
  ): boolean {
    try {
      const normSession = normalizeSession(session);
      const sessionLabel = getSessionDisplayName(normSession);
      const rep = dailyReportService.getDailyAttendanceReport(date, normSession);
      const submissionData = teacherSubmissionService.getSubmissionProgress(date, normSession);
      const settings = storageService.getSettings();

      const wb = XLSX.utils.book_new();
      const isOfficial = rep.isOfficial;

      // -----------------------------------------------------------------
      // SHEET 1: TONG_HOP (Mục XXXVII)
      // -----------------------------------------------------------------
      const summaryData = [
        [settings.schoolName.toUpperCase(), '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
        [`ĐƠN VỊ: ${settings.commune.toUpperCase()}, ${settings.province.toUpperCase()}`, '', '', 'Độc lập - Tự do - Hạnh phúc'],
        [],
        [
          isOfficial
            ? `BÁO CÁO SĨ SỐ HỌC SINH TOÀN TRƯỜNG – ${sessionLabel.toUpperCase()}`
            : `BÁO CÁO SĨ SỐ HỌC SINH SƠ BỘ (${rep.approvedClasses}/${rep.totalClasses} LỚP ĐÃ DUYỆT) – ${sessionLabel.toUpperCase()}`
        ],
        [`Ngày: ${formatVietnameseDate(date)} (Năm học: ${rep.schoolYearId})`],
        [`Trạng thái: ${isOfficial ? 'BÁO CÁO CHÍNH THỨC' : 'BÁO CÁO SƠ BỘ'} | Phiên bản: v${rep.reportVersion}`],
        [],
        ['CHỈ SỐ THỐNG KÊ', 'SỐ LƯỢNG / TỈ LỆ', 'ĐƠN VỊ TÍNH', 'GHI CHÚ'],
        ['Tổng số lớp học', rep.totalClasses, 'Lớp', '20 lớp từ Khối 6 đến Khối 9'],
        ['Số lớp đã gửi báo cáo', rep.submittedClasses, 'Lớp', `Đạt ${Math.round((rep.submittedClasses / rep.totalClasses) * 100)}%`],
        ['Số lớp đã được duyệt', rep.approvedClasses, 'Lớp', `Đạt ${Math.round((rep.approvedClasses / rep.totalClasses) * 100)}%`],
        ['Số lớp chưa báo cáo', rep.unsubmittedClassesCount, 'Lớp', rep.unapprovedClasses.length > 0 ? `Còn: ${rep.unapprovedClasses.join(', ')}` : 'Đã đủ 100%'],
        [],
        ['Tổng số học sinh toàn trường', rep.totalStudentsRoster, 'Học sinh', 'Theo danh sách chính thức'],
        ['Số học sinh được xác nhận từ các lớp duyệt', rep.confirmedStudents, 'Học sinh', 'Chỉ tính các lớp đã APPROVED/LOCKED'],
        ['Số học sinh CÓ MẶT', rep.presentCount, 'Học sinh', `Tỉ lệ: ${rep.attendanceRate}%`],
        ['Số học sinh VẮNG', rep.absentCount, 'Học sinh', ''],
        ['  - Vắng có phép', rep.excusedAbsentCount, 'Học sinh', 'Có đơn/tin nhắn xin phép'],
        ['  - Vắng không phép', rep.unexcusedAbsentCount, 'Học sinh', 'Không rõ lí do'],
        ['Số học sinh ĐI HỌC MUỘN', rep.lateCount, 'Học sinh', 'Vẫn được tính có mặt buổi sáng'],
        ['Số học sinh VỀ SỚM', rep.earlyLeaveCount, 'Học sinh', 'Vẫn được tính có mặt buổi sáng'],
        [],
        ['HỌC SINH BÁN TRÚ THEO DANH SÁCH', rep.boardingTotalRoster, 'Học sinh', ''],
        ['Bán trú có mặt', rep.boardingPresent, 'Học sinh', `Tỉ lệ có mặt: ${rep.boardingRate}%`],
        ['Bán trú vắng', rep.boardingAbsent, 'Học sinh', ''],
        [],
        ['HỌC SINH NGOẠI TRÚ THEO DANH SÁCH', rep.nonBoardingTotalRoster, 'Học sinh', ''],
        ['Ngoại trú có mặt', rep.nonBoardingPresent, 'Học sinh', `Tỉ lệ có mặt: ${rep.nonBoardingRate}%`],
        ['Ngoại trú vắng', rep.nonBoardingAbsent, 'Học sinh', ''],
        [],
        ['THÔNG TIN CHỐT BÁO CÁO'],
        ['Người lập / duyệt:', rep.finalizedBy || settings.adminName],
        ['Chức danh:', rep.finalizedByTitle || settings.adminTitle],
        ['Thời gian ghi nhận:', rep.finalizedAt || new Date().toLocaleString('vi-VN')],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      this.setColWidths(wsSummary, [35, 20, 15, 45]);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'TONG_HOP');

      // -----------------------------------------------------------------
      // SHEET 2: CHI_TIET_20_LOP (Mục XXXVIII)
      // -----------------------------------------------------------------
      const detailHeaders = [
        'STT',
        'Khối',
        'Lớp',
        'GVCN',
        'Sĩ số',
        'Có mặt',
        'Vắng',
        'Có phép',
        'Không phép',
        'Đi muộn',
        'Bán trú tổng',
        'Bán trú có mặt',
        'Bán trú vắng',
        'Ngoại trú tổng',
        'Ngoại trú có mặt',
        'Ngoại trú vắng',
        'Trạng thái',
        'Thời gian gửi',
        'Thời gian duyệt',
      ];

      const detailRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BẢNG CHI TIẾT SĨ SỐ 20 LỚP – NGÀY ${formatVietnameseDate(date)}`],
        [],
        detailHeaders,
      ];

      rep.classRows.forEach(c => {
        detailRows.push([
          c.stt,
          `Khối ${c.grade}`,
          c.className,
          c.teacherName,
          c.totalStudents,
          c.presentCount,
          c.absentCount,
          c.excusedAbsentCount,
          c.unexcusedAbsentCount,
          c.lateCount,
          c.boardingTotal,
          c.boardingPresent,
          c.boardingAbsent,
          c.nonBoardingTotal,
          c.nonBoardingPresent,
          c.nonBoardingAbsent,
          c.statusText,
          c.submittedAt || '--',
          c.approvedAt || '--',
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
      this.setColWidths(wsDetail, [6, 10, 8, 20, 8, 8, 8, 8, 10, 8, 12, 14, 12, 12, 14, 12, 15, 15, 15]);
      wsDetail['!views'] = [{ state: 'frozen', ySplit: 4 }];
      wsDetail['!autofilter'] = { ref: `A4:S${detailRows.length}` };
      XLSX.utils.book_append_sheet(wb, wsDetail, 'CHI_TIET_20_LOP');

      // -----------------------------------------------------------------
      // SHEET 3: HOC_SINH_VANG (Mục XXXIX)
      // -----------------------------------------------------------------
      const absentHeaders = [
        'STT',
        'Họ và tên',
        'Mã học sinh',
        'Lớp',
        'Khối',
        'Diện học sinh',
        'Loại vắng',
        'Lí do vắng',
        'Ngày',
        'Buổi',
        'Ghi chú',
      ];

      const absentRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`DANH SÁCH HỌC SINH VẮNG NGÀY ${formatVietnameseDate(date)}`],
        [],
        absentHeaders,
      ];

      if (rep.absentRecords.length === 0) {
        absentRows.push(['', 'Không có học sinh vắng trong các lớp đã duyệt', '', '', '', '', '', '', '', '', '']);
      } else {
        rep.absentRecords.forEach((rec, idx) => {
          const st = String(rec.status).toUpperCase();
          const absenceTypeLabel =
            st === 'ABSENT_EXCUSED' || (st === 'OTHER' && rec.absenceType === 'excused')
              ? 'Có phép'
              : 'Không phép';

          absentRows.push([
            idx + 1,
            rec.studentName,
            rec.studentCode || '',
            rec.className,
            `Khối ${rec.grade}`,
            rec.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú',
            absenceTypeLabel,
            rec.reason || 'Chưa rõ',
            rec.date,
            getSessionDisplayName(rec.session),
            rec.note || '',
          ]);
        });
      }

      const wsAbsent = XLSX.utils.aoa_to_sheet(absentRows);
      this.setColWidths(wsAbsent, [6, 22, 12, 8, 8, 12, 12, 22, 12, 12, 25]);
      wsAbsent['!views'] = [{ state: 'frozen', ySplit: 4 }];
      wsAbsent['!autofilter'] = { ref: `A4:K${absentRows.length}` };
      XLSX.utils.book_append_sheet(wb, wsAbsent, 'HOC_SINH_VANG');

      // -----------------------------------------------------------------
      // SHEET 4: BAN_TRU (Mục XL)
      // -----------------------------------------------------------------
      const boardingHeaders = ['STT', 'Lớp', 'Khối', 'GVCN', 'Số bán trú theo DS', 'Có mặt', 'Vắng', 'Tỉ lệ có mặt (%)'];
      const boardingRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BÁO CÁO HỌC SINH BÁN TRÚ NGÀY ${formatVietnameseDate(date)}`],
        [],
        boardingHeaders,
      ];

      rep.classRows.forEach(c => {
        const rate =
          c.boardingTotal > 0 && typeof c.boardingPresent === 'number'
            ? `${Math.round((c.boardingPresent / c.boardingTotal) * 100)}%`
            : typeof c.boardingPresent === 'number'
            ? '100%'
            : '--';

        boardingRows.push([
          c.stt,
          c.className,
          `Khối ${c.grade}`,
          c.teacherName,
          c.boardingTotal,
          c.boardingPresent,
          c.boardingAbsent,
          rate,
        ]);
      });

      const wsBoarding = XLSX.utils.aoa_to_sheet(boardingRows);
      this.setColWidths(wsBoarding, [6, 8, 10, 20, 20, 12, 12, 15]);
      wsBoarding['!views'] = [{ state: 'frozen', ySplit: 4 }];
      XLSX.utils.book_append_sheet(wb, wsBoarding, 'BAN_TRU');

      // -----------------------------------------------------------------
      // SHEET 5: NGOAI_TRU (Mục XLI)
      // -----------------------------------------------------------------
      const dayHeaders = ['STT', 'Lớp', 'Khối', 'GVCN', 'Số ngoại trú theo DS', 'Có mặt', 'Vắng', 'Tỉ lệ có mặt (%)'];
      const dayRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BÁO CÁO HỌC SINH NGOẠI TRÚ NGÀY ${formatVietnameseDate(date)}`],
        [],
        dayHeaders,
      ];

      rep.classRows.forEach(c => {
        const rate =
          c.nonBoardingTotal > 0 && typeof c.nonBoardingPresent === 'number'
            ? `${Math.round((c.nonBoardingPresent / c.nonBoardingTotal) * 100)}%`
            : typeof c.nonBoardingPresent === 'number'
            ? '100%'
            : '--';

        dayRows.push([
          c.stt,
          c.className,
          `Khối ${c.grade}`,
          c.teacherName,
          c.nonBoardingTotal,
          c.nonBoardingPresent,
          c.nonBoardingAbsent,
          rate,
        ]);
      });

      const wsDay = XLSX.utils.aoa_to_sheet(dayRows);
      this.setColWidths(wsDay, [6, 8, 10, 20, 20, 12, 12, 15]);
      wsDay['!views'] = [{ state: 'frozen', ySplit: 4 }];
      XLSX.utils.book_append_sheet(wb, wsDay, 'NGOAI_TRU');

      // -----------------------------------------------------------------
      // SHEET 6: TIEN_DO_BAO_CAO (Mục XLII)
      // -----------------------------------------------------------------
      const progressHeaders = [
        'STT',
        'Lớp',
        'Khối',
        'GVCN',
        'Số điện thoại',
        'Hạn chót',
        'Thời gian gửi',
        'Đúng hạn / Trễ',
        'Số phút trễ',
        'Số lần chỉnh sửa',
        'Thời gian duyệt',
        'Trạng thái',
      ];

      const progressRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`TIẾN ĐỘ BÁO CÁO SĨ SỐ GVCN NGÀY ${formatVietnameseDate(date)}`],
        [],
        progressHeaders,
      ];

      submissionData.items.forEach(item => {
        progressRows.push([
          item.stt,
          item.className,
          `Khối ${item.grade}`,
          item.teacherName,
          item.teacherPhone || '',
          item.deadline,
          item.submittedAt,
          item.isSubmitted ? (item.isLate ? 'Nộp muộn' : 'Đúng hạn') : 'Chưa nộp',
          item.lateByMinutes > 0 ? item.lateByMinutes : 0,
          item.revisionCount,
          item.approvedAt,
          item.status,
        ]);
      });

      const wsProgress = XLSX.utils.aoa_to_sheet(progressRows);
      this.setColWidths(wsProgress, [6, 8, 10, 20, 14, 10, 14, 14, 12, 14, 14, 16]);
      wsProgress['!views'] = [{ state: 'frozen', ySplit: 4 }];
      XLSX.utils.book_append_sheet(wb, wsProgress, 'TIEN_DO_BAO_CAO');

      // Filename format (Mục XXXVI, LVI)
      const prefix = isOfficial ? 'Bao_cao_si_so_THCS_Ban_Bo' : 'Bao_cao_si_so_SO_BO_THCS_Ban_Bo';
      const fileName = `${prefix}_${date}.xlsx`;

      this.saveWorkbook(wb, fileName);

      // Audit Log (Mục LXXXIX)
      storageService.addAuditLog(
        userName,
        `Xuất file Excel báo cáo ngày ${date} (${isOfficial ? 'Chính thức' : 'Sơ bộ'}, 6 sheets)`,
        'report',
        'EXPORT_SCHOOL_REPORT'
      );

      return true;
    } catch (err) {
      console.error('Excel Export Error:', err);
      return false;
    }
  }

  /**
   * Export Monthly Excel Report with 5 SHEETS (Mục XLIV)
   * Sheet 1: TONG_HOP_THANG
   * Sheet 2: THEO_LOP
   * Sheet 3: HOC_SINH_VANG
   * Sheet 4: BAN_TRU
   * Sheet 5: NGOAI_TRU
   */
  public exportMonthlyReportExcel(
    year: number,
    month: number,
    userName: string = 'Phạm Ngọc Thúy'
  ): boolean {
    try {
      const settings = storageService.getSettings();
      const monthData = monthlyReportService.getMonthlyAttendance(year, month);
      const wb = XLSX.utils.book_new();

      // Sheet 1: TONG_HOP_THANG
      const summaryRows = [
        [settings.schoolName.toUpperCase()],
        [`BÁO CÁO CHUYÊN CẦN THÁNG ${month}/${year}`],
        [],
        ['CHỈ SỐ', 'SỐ LIỆU', 'GHI CHÚ'],
        ['Số ngày học trong tháng', monthData.schoolDaysCount, 'Không tính ngày nghỉ/lễ'],
        ['Tổng lượt dự kiến có mặt', monthData.totalExpectedSessions, 'Lượt học sinh'],
        ['Tổng lượt thực tế có mặt', monthData.totalPresentSessions, 'Lượt học sinh'],
        ['Tổng lượt vắng', monthData.totalAbsentSessions, 'Lượt học sinh'],
        ['  - Vắng có phép', monthData.totalExcusedSessions, 'Lượt học sinh'],
        ['  - Vắng không phép', monthData.totalUnexcusedSessions, 'Lượt học sinh'],
        ['Tổng lượt đi học muộn', monthData.totalLateCount, 'Lượt'],
        ['Tỉ lệ chuyên cần toàn trường', `${monthData.attendanceRate}%`, ''],
        ['Số học sinh có phát sinh nghỉ', monthData.studentsWithAbsenceCount, 'Học sinh'],
      ];
      const wsSum = XLSX.utils.aoa_to_sheet(summaryRows);
      this.setColWidths(wsSum, [30, 18, 30]);
      XLSX.utils.book_append_sheet(wb, wsSum, 'TONG_HOP_THANG');

      // Sheet 2: THEO_LOP
      const classHeaders = [
        'Lớp',
        'Khối',
        'GVCN',
        'Sĩ số',
        'Số ngày ghi nhận',
        'Lượt dự kiến',
        'Lượt có mặt',
        'Lượt vắng',
        'Có phép',
        'Không phép',
        'Đi muộn',
        'Tỉ lệ chuyên cần (%)',
      ];
      const classRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`THỐNG KÊ CHUYÊN CẦN 20 LỚP THÁNG ${month}/${year}`],
        [],
        classHeaders,
      ];
      monthData.classStats.forEach(c => {
        classRows.push([
          c.className,
          `Khối ${c.grade}`,
          c.teacherName,
          c.totalStudents,
          c.schoolDaysCount,
          c.expectedSessions,
          c.presentSessions,
          c.absentSessions,
          c.excusedSessions,
          c.unexcusedSessions,
          c.lateCount,
          `${c.attendanceRate}%`,
        ]);
      });
      const wsClasses = XLSX.utils.aoa_to_sheet(classRows);
      this.setColWidths(wsClasses, [8, 10, 20, 8, 16, 14, 14, 12, 10, 12, 10, 18]);
      wsClasses['!views'] = [{ state: 'frozen', ySplit: 4 }];
      XLSX.utils.book_append_sheet(wb, wsClasses, 'THEO_LOP');

      // Sheet 3: HOC_SINH_VANG
      const absentHeaders = [
        'STT',
        'Họ và tên',
        'Mã học sinh',
        'Lớp',
        'Diện học sinh',
        'Tổng lượt vắng',
        'Có phép',
        'Không phép',
        'Đi muộn',
        'Ngày vắng gần nhất',
        'Lí do gần nhất',
      ];
      const absentRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`DANH SÁCH HỌC SINH CÓ PHÁT SINH VẮNG THÁNG ${month}/${year}`],
        [],
        absentHeaders,
      ];
      monthData.frequentAbsentStudents.forEach((st, idx) => {
        absentRows.push([
          idx + 1,
          st.studentName,
          st.studentCode,
          st.className,
          st.boardingType,
          st.totalAbsent,
          st.excusedCount,
          st.unexcusedCount,
          st.lateCount,
          st.lastAbsentDate,
          st.lastReason || '',
        ]);
      });
      const wsAbsent = XLSX.utils.aoa_to_sheet(absentRows);
      this.setColWidths(wsAbsent, [6, 22, 12, 8, 12, 14, 10, 12, 10, 16, 22]);
      wsAbsent['!views'] = [{ state: 'frozen', ySplit: 4 }];
      XLSX.utils.book_append_sheet(wb, wsAbsent, 'HOC_SINH_VANG');

      // Sheet 4: BAN_TRU
      const boardingHeaders = ['Lớp', 'Khối', 'GVCN', 'Lượt bán trú dự kiến', 'Lượt có mặt', 'Lượt vắng', 'Tỉ lệ (%)'];
      const boardingRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BÁO CÁO BÁN TRÚ THÁNG ${month}/${year}`],
        [],
        boardingHeaders,
      ];
      monthData.classStats.forEach(c => {
        const rate = c.boardingExpected > 0 ? `${Math.round((c.boardingPresent / c.boardingExpected) * 100)}%` : '100%';
        boardingRows.push([c.className, `Khối ${c.grade}`, c.teacherName, c.boardingExpected, c.boardingPresent, c.boardingAbsent, rate]);
      });
      const wsBoarding = XLSX.utils.aoa_to_sheet(boardingRows);
      this.setColWidths(wsBoarding, [8, 10, 20, 18, 14, 12, 12]);
      XLSX.utils.book_append_sheet(wb, wsBoarding, 'BAN_TRU');

      // Sheet 5: NGOAI_TRU
      const dayHeaders = ['Lớp', 'Khối', 'GVCN', 'Sĩ số ngoại trú', 'Lượt dự kiến', 'Lượt có mặt', 'Lượt vắng', 'Tỉ lệ (%)'];
      const dayRows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BÁO CÁO NGOẠI TRÚ THÁNG ${month}/${year}`],
        [],
        dayHeaders,
      ];
      monthData.classStats.forEach(c => {
        const nbExp = c.expectedSessions - c.boardingExpected;
        const nbPres = c.presentSessions - c.boardingPresent;
        const nbAbs = c.absentSessions - c.boardingAbsent;
        const rate = nbExp > 0 ? `${Math.round((nbPres / nbExp) * 100)}%` : '100%';
        dayRows.push([c.className, `Khối ${c.grade}`, c.teacherName, c.totalStudents - (c.boardingExpected > 0 ? Math.round(c.boardingExpected / c.schoolDaysCount) : 0), nbExp, nbPres, nbAbs, rate]);
      });
      const wsDay = XLSX.utils.aoa_to_sheet(dayRows);
      this.setColWidths(wsDay, [8, 10, 20, 16, 14, 14, 12, 12]);
      XLSX.utils.book_append_sheet(wb, wsDay, 'NGOAI_TRU');

      const fileName = `Bao_cao_chuyen_can_THCS_Ban_Bo_${year}-${String(month).padStart(2, '0')}.xlsx`;
      this.saveWorkbook(wb, fileName);

      storageService.addAuditLog(userName, `Xuất file Excel báo cáo chuyên cần Tháng ${month}/${year} (5 sheets)`, 'report', 'EXPORT_SCHOOL_REPORT');
      return true;
    } catch (err) {
      console.error('Monthly Excel export error:', err);
      return false;
    }
  }

  /**
   * Export Absent Students List (Mục LXXII)
   * File: Danh_sach_hoc_sinh_vang_YYYY-MM-DD.xlsx
   */
  public exportAbsentStudentsExcel(
    date: string = getTodayDateString(),
    absentRecords: AttendanceRecord[],
    userName: string = 'Phạm Ngọc Thúy'
  ): boolean {
    try {
      const settings = storageService.getSettings();
      const wb = XLSX.utils.book_new();

      const headers = [
        'STT',
        'Họ và tên',
        'Mã học sinh',
        'Lớp',
        'Khối',
        'Diện học sinh',
        'Phân loại vắng',
        'Lí do vắng',
        'Ngày',
        'Buổi',
        'Ghi chú',
      ];

      const rows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`DANH SÁCH HỌC SINH VẮNG NGÀY ${formatVietnameseDate(date)}`],
        [],
        headers,
      ];

      absentRecords.forEach((rec, idx) => {
        const st = String(rec.status).toUpperCase();
        const typeLabel =
          st === 'ABSENT_EXCUSED' || (st === 'OTHER' && rec.absenceType === 'excused')
            ? 'Có phép'
            : 'Không phép';

        rows.push([
          idx + 1,
          rec.studentName,
          rec.studentCode || '',
          rec.className,
          `Khối ${rec.grade}`,
          rec.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú',
          typeLabel,
          rec.reason || 'Chưa rõ',
          rec.date,
          getSessionDisplayName(rec.session),
          rec.note || '',
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      this.setColWidths(ws, [6, 22, 12, 8, 8, 12, 14, 24, 12, 12, 25]);
      ws['!views'] = [{ state: 'frozen', ySplit: 4 }];
      ws['!autofilter'] = { ref: `A4:K${rows.length}` };

      XLSX.utils.book_append_sheet(wb, ws, 'HOC_SINH_VANG');
      const fileName = `Danh_sach_hoc_sinh_vang_${date}.xlsx`;
      this.saveWorkbook(wb, fileName);

      storageService.addAuditLog(userName, `Xuất file Excel danh sách học sinh vắng ngày ${date}`, 'report', 'EXPORT_ABSENT_STUDENTS');
      return true;
    } catch (err) {
      console.error('Absent Excel export error:', err);
      return false;
    }
  }
}

export const excelExportService = new ExcelExportService();
