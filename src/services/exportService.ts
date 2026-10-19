import * as XLSX from 'xlsx';
import { SchoolClass, Student, AttendanceReport, AttendanceRecord, SessionType, normalizeSession, getSessionDisplayName } from '../types';
import { storageService } from './storageService';
import { attendanceService } from './attendanceService';
import { formatVietnameseDate, getTodayDateString } from '../utils/formatters';

class ExportService {
  private saveWorkbook(wb: XLSX.WorkBook, fileName: string) {
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  /**
   * Section T: Generate Quick Report Text for Zalo / Ban Giám hiệu
   */
  public generateQuickReportText(date: string = getTodayDateString(), session: SessionType = 'MORNING'): string {
    const normSession = normalizeSession(session);
    const sessionLabel = getSessionDisplayName(normSession);
    const settings = storageService.getSettings();
    const stats = attendanceService.getDashboardStats(date, normSession);
    const absentList = attendanceService.getAbsentStudents(date, { includePending: false, session: normSession });

    const absentSummary = absentList.length > 0
      ? absentList
          .map(a => `${a.studentName} (${a.className} - ${a.boardingType === 'BOARDING' ? 'BT' : 'NT'}${a.reason ? ': ' + a.reason : ''})`)
          .join('; ')
      : 'Không có học sinh vắng';

    return `TRƯỜNG THCS BẢN BO
SĨ SỐ ${sessionLabel.toUpperCase()} NGÀY ${formatVietnameseDate(date).toUpperCase()}
------------------------------------
- Tổng số HS toàn trường: ${stats.totalStudentsRoster}
- Đã xác nhận: ${stats.confirmedStudents} HS
- Có mặt: ${stats.presentCount}
- Vắng: ${stats.absentCount}
  + Có phép: ${stats.absentExcusedCount}
  + Không phép: ${stats.absentUnexcusedCount}
  + Đi muộn: ${stats.lateCount}
- Bán trú theo DS: ${stats.boardingTotalRoster}
  + Bán trú có mặt: ${stats.boardingPresent}
  + Bán trú vắng: ${stats.boardingAbsent}
- Ngoại trú theo DS: ${stats.nonBoardingTotalRoster}
  + Ngoại trú có mặt: ${stats.nonBoardingPresent}
  + Ngoại trú vắng: ${stats.nonBoardingAbsent}
- Tiến độ báo cáo: ${stats.submittedClassesCount}/${stats.totalClasses} lớp đã gửi
- Tiến độ duyệt: ${stats.approvedClassesCount}/${stats.totalClasses} lớp đã duyệt
------------------------------------
* Danh sách HS vắng: ${absentSummary}
------------------------------------
Người lập: ${settings.adminName} - ${settings.adminTitle}`;
  }

  /**
   * Section U: Export Excel Daily School Attendance with 5 SHEETS
   * Sheet 1: Tổng hợp toàn trường
   * Sheet 2: Chi tiết 20 lớp
   * Sheet 3: Danh sách học sinh vắng
   * Sheet 4: Bán trú
   * Sheet 5: Ngoại trú
   */
  /**
   * Section U & XXXVIII: Export Excel Daily School Attendance
   * Hỗ trợ đầy đủ các Sheet:
   * - TONG_HOP
   * - BUOI_SANG
   * - BUOI_CHIEU
   * - HOC_SINH_VANG_SANG
   * - HOC_SINH_VANG_CHIEU
   * - BAN_TRU
   * - NGOAI_TRU
   */
  public exportDailyReportExcel(date: string = getTodayDateString(), session: SessionType | 'FULL_DAY' = 'MORNING') {
    const isFullDay = session === 'FULL_DAY' || session === 'full_day';
    const normSession = isFullDay ? 'FULL_DAY' : normalizeSession(session);
    const sessionLabel = isFullDay ? 'CẢ NGÀY' : getSessionDisplayName(normSession as SessionType);
    const settings = storageService.getSettings();

    const classes = storageService.getClasses();
    const allStudents = storageService.getStudents().filter(s => s.status === 'active');
    const boardingStudents = allStudents.filter(s => s.boardingType === 'BOARDING');
    const nonBoardingStudents = allStudents.filter(s => s.boardingType === 'NON_BOARDING');

    const morningReports = storageService.getReportsByDate(date, 'MORNING');
    const afternoonReports = storageService.getReportsByDate(date, 'AFTERNOON');

    const morningStats = attendanceService.getDashboardStats(date, 'MORNING');
    const afternoonStats = attendanceService.getDashboardStats(date, 'AFTERNOON');

    const morningAbsentStudents = attendanceService.getAbsentStudents(date, { includePending: true, session: 'MORNING' });
    const afternoonAbsentStudents = attendanceService.getAbsentStudents(date, { includePending: true, session: 'AFTERNOON' });

    const wb = XLSX.utils.book_new();

    // Helper tạo danh sách 20 lớp cho 1 phiên
    const generateClassRows = (sessionReports: AttendanceReport[], sessionTitle: string) => {
      const rows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`BẢNG CHI TIẾT SĨ SỐ 20 LỚP – ${sessionTitle.toUpperCase()}`],
        [`Ngày: ${formatVietnameseDate(date)}`],
        [],
        [
          'STT',
          'Lớp',
          'Khối',
          'GVCN',
          'Sĩ số',
          'Có mặt',
          'Vắng',
          'Có phép',
          'Không phép',
          'Đi muộn',
          'Bán trú theo DS',
          'Bán trú có mặt',
          'Bán trú vắng',
          'Ngoại trú theo DS',
          'Ngoại trú có mặt',
          'Ngoại trú vắng',
          'Trạng thái',
          'Thời gian gửi',
          'Thời gian duyệt',
        ],
      ];

      classes.forEach((cls, idx) => {
        const rep = sessionReports.find(r => r.classId === cls.id);
        const isApproved = rep && (rep.status === 'APPROVED' || rep.status === 'LOCKED' || (rep.status as string) === 'locked');
        const isPending = rep && (rep.status === 'PENDING_APPROVAL' || (rep.status as string) === 'submitted');
        const isRevision = rep && (rep.status === 'REVISION_REQUIRED' || (rep.status as string) === 'needs_revision');

        let statusLabel = 'CHƯA BÁO CÁO';
        if (rep?.status === 'APPROVED') statusLabel = 'ĐÃ DUYỆT';
        else if (rep?.status === 'LOCKED' || (rep?.status as string) === 'locked') statusLabel = 'ĐÃ KHÓA';
        else if (isPending) statusLabel = 'CHỜ DUYỆT';
        else if (isRevision) statusLabel = 'CẦN CHỈNH SỬA';

        if (rep) {
          rows.push([
            idx + 1,
            cls.name,
            `Khối ${cls.grade}`,
            cls.teacherName || '',
            rep.totalStudents,
            isApproved ? rep.presentCount : 'Chờ duyệt',
            isApproved ? rep.absentCount : 'Chờ duyệt',
            isApproved ? (rep.excusedAbsentCount ?? rep.absentExcusedCount ?? 0) : '--',
            isApproved ? (rep.unexcusedAbsentCount ?? rep.absentUnexcusedCount ?? 0) : '--',
            isApproved ? rep.lateCount : '--',
            rep.boardingTotal,
            isApproved ? rep.boardingPresent : 'Chờ duyệt',
            isApproved ? rep.boardingAbsent : 'Chờ duyệt',
            rep.nonBoardingTotal ?? rep.dayTotal ?? 0,
            isApproved ? (rep.nonBoardingPresent ?? rep.dayPresent ?? 0) : 'Chờ duyệt',
            isApproved ? (rep.nonBoardingAbsent ?? rep.dayAbsent ?? 0) : 'Chờ duyệt',
            statusLabel,
            rep.submittedAt || '--',
            rep.approvedAt || '--',
          ]);
        } else {
          rows.push([
            idx + 1,
            cls.name,
            `Khối ${cls.grade}`,
            cls.teacherName || '',
            cls.totalStudents || 0,
            'Chưa có DL',
            'Chưa có DL',
            '--',
            '--',
            '--',
            cls.boardingCount || 0,
            '--',
            '--',
            cls.nonBoardingCount || 0,
            '--',
            '--',
            'CHƯA BÁO CÁO',
            '--',
            '--',
          ]);
        }
      });
      return rows;
    };

    // Helper tạo danh sách học sinh vắng
    const generateAbsentRows = (absents: AttendanceRecord[], sessionTitle: string) => {
      const rows: any[] = [
        [settings.schoolName.toUpperCase()],
        [`DANH SÁCH HỌC SINH VẮNG / ĐI MUỘN – ${sessionTitle.toUpperCase()}`],
        [`Ngày: ${formatVietnameseDate(date)}`],
        [],
        ['STT', 'Mã HS', 'Họ và tên', 'Lớp', 'Khối', 'Bán trú/Ngoại trú', 'Tình trạng', 'Có phép/Không phép', 'Lí do', 'Ghi chú / Chi tiết'],
      ];

      absents.forEach((rec, idx) => {
        const bLabel = rec.boardingType === 'BOARDING' || rec.studentType === 'boarding' ? 'Bán trú' : 'Ngoại trú';
        const statusUpper = (rec.status as string).toUpperCase();
        let statusStr = 'Vắng';
        let excusedStr = '--';

        if (statusUpper === 'ABSENT_EXCUSED') {
          statusStr = 'Vắng có phép';
          excusedStr = 'Có phép';
        } else if (statusUpper === 'ABSENT_UNEXCUSED') {
          statusStr = 'Vắng không phép';
          excusedStr = 'Không phép';
        } else if (statusUpper === 'LATE') {
          statusStr = 'Đi muộn';
        } else if (statusUpper === 'EARLY_LEAVE') {
          statusStr = 'Về sớm';
        }

        rows.push([
          idx + 1,
          rec.studentCode,
          rec.studentName,
          rec.className,
          `Khối ${rec.grade}`,
          bLabel,
          statusStr,
          excusedStr,
          rec.reason || 'Không rõ lí do',
          rec.reasonDetail || rec.note || '',
        ]);
      });
      return rows;
    };

    // ==========================================
    // SHEET: TONG_HOP
    // ==========================================
    const totalTurnsConfirmed = morningStats.confirmedStudents + afternoonStats.confirmedStudents;
    const totalTurnsPresent = morningStats.presentCount + afternoonStats.presentCount;
    const totalTurnsAbsent = morningStats.absentCount + afternoonStats.absentCount;

    const sheet1Rows: any[] = [
      [settings.schoolName.toUpperCase()],
      [`Địa chỉ: ${settings.schoolAddress}`],
      [`BÁO CÁO SĨ SỐ HỌC SINH ${sessionLabel.toUpperCase()}`],
      [`Ngày báo cáo: ${formatVietnameseDate(date)}`],
      [],
      ['I. THÔNG SỐ DANH SÁCH TOÀN TRƯỜNG'],
      ['Tổng số lớp', classes.length],
      ['Tổng số học sinh danh sách', allStudents.length],
      ['Tổng số học sinh bán trú (cố định)', boardingStudents.length],
      ['Tổng số học sinh ngoại trú (cố định)', nonBoardingStudents.length],
      [],
    ];

    if (isFullDay) {
      sheet1Rows.push(
        ['II. THỐNG KÊ LƯỢT HỌC CẢ NGÀY (SÁNG + CHIỀU)'],
        ['Tổng lượt học sinh dự kiến (2 buổi)', allStudents.length * 2],
        ['Tổng lượt học sinh đã xác nhận', totalTurnsConfirmed],
        ['Tổng lượt học sinh có mặt', totalTurnsPresent],
        ['Tổng lượt học sinh vắng', totalTurnsAbsent],
        [],
        ['III. TIẾN ĐỘ BUỔI SÁNG'],
        ['Số lớp đã gửi', `${morningStats.submittedClassesCount}/${morningStats.totalClasses}`],
        ['Số lớp đã duyệt', `${morningStats.approvedClassesCount}/${morningStats.totalClasses}`],
        ['Có mặt buổi sáng', morningStats.presentCount],
        ['Vắng buổi sáng', morningStats.absentCount],
        [],
        ['IV. TIẾN ĐỘ BUỔI CHIỀU'],
        ['Số lớp đã gửi', `${afternoonStats.submittedClassesCount}/${afternoonStats.totalClasses}`],
        ['Số lớp đã duyệt', `${afternoonStats.approvedClassesCount}/${afternoonStats.totalClasses}`],
        ['Có mặt buổi chiều', afternoonStats.presentCount],
        ['Vắng buổi chiều', afternoonStats.absentCount],
        []
      );
    } else {
      const curStats = normSession === 'AFTERNOON' ? afternoonStats : morningStats;
      sheet1Rows.push(
        [`II. THỐNG KÊ SĨ SỐ ${sessionLabel.toUpperCase()}`],
        ['Số lớp đã báo cáo', `${curStats.submittedClassesCount}/${curStats.totalClasses}`],
        ['Số lớp đã duyệt', `${curStats.approvedClassesCount}/${curStats.totalClasses}`],
        ['Số học sinh đã xác nhận', curStats.confirmedStudents],
        ['Có mặt', curStats.presentCount],
        ['Vắng', curStats.absentCount],
        [' - Vắng có phép', curStats.absentExcusedCount],
        [' - Vắng không phép', curStats.absentUnexcusedCount],
        ['Đi muộn', curStats.lateCount],
        [],
        ['III. BÁN TRÚ'],
        ['Bán trú đã xác nhận', curStats.boardingConfirmedTotal],
        ['Bán trú có mặt', curStats.boardingPresent],
        ['Bán trú vắng', curStats.boardingAbsent],
        ['Suất ăn bán trú dự kiến', curStats.boardingMealsExpected],
        [],
        ['IV. NGOẠI TRÚ'],
        ['Ngoại trú đã xác nhận', curStats.nonBoardingConfirmedTotal],
        ['Ngoại trú có mặt', curStats.nonBoardingPresent],
        ['Ngoại trú vắng', curStats.nonBoardingAbsent],
        []
      );
    }

    sheet1Rows.push(
      ['V. THÔNG TIN PHÊ DUYỆT & CHỐT BÁO CÁO'],
      ['Người lập / Người chốt:', settings.adminName],
      ['Chức vụ:', settings.adminTitle],
      ['Thời gian xuất:', new Date().toLocaleString('vi-VN')]
    );

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    XLSX.utils.book_append_sheet(wb, ws1, 'TONG_HOP');

    // Thêm các Sheet theo phiên
    if (isFullDay || normSession === 'MORNING') {
      const wsMorning = XLSX.utils.aoa_to_sheet(generateClassRows(morningReports, 'BUỔI SÁNG'));
      XLSX.utils.book_append_sheet(wb, wsMorning, 'BUOI_SANG');

      const wsAbsentMorning = XLSX.utils.aoa_to_sheet(generateAbsentRows(morningAbsentStudents, 'BUỔI SÁNG'));
      XLSX.utils.book_append_sheet(wb, wsAbsentMorning, 'HOC_SINH_VANG_SANG');
    }

    if (isFullDay || normSession === 'AFTERNOON') {
      const wsAfternoon = XLSX.utils.aoa_to_sheet(generateClassRows(afternoonReports, 'BUỔI CHIỀU'));
      XLSX.utils.book_append_sheet(wb, wsAfternoon, 'BUOI_CHIEU');

      const wsAbsentAfternoon = XLSX.utils.aoa_to_sheet(generateAbsentRows(afternoonAbsentStudents, 'BUỔI CHIỀU'));
      XLSX.utils.book_append_sheet(wb, wsAbsentAfternoon, 'HOC_SINH_VANG_CHIEU');
    }

    // SHEET: BAN_TRU
    const sheetBtRows: any[] = [
      [settings.schoolName.toUpperCase()],
      ['DANH SÁCH HỌC SINH BÁN TRÚ CỐ ĐỊNH'],
      [`Tổng số học sinh bán trú toàn trường: ${boardingStudents.length} học sinh`],
      [],
      ['STT', 'Mã HS', 'Họ và tên', 'Lớp', 'Khối', 'Giới tính', 'Dân tộc', 'Bản/Thôn', 'Họ tên Phụ huynh', 'SĐT Phụ huynh'],
    ];
    boardingStudents.forEach((stu, idx) => {
      sheetBtRows.push([
        idx + 1,
        stu.code,
        stu.fullName,
        stu.className,
        `Khối ${stu.grade}`,
        stu.gender === 'male' ? 'Nam' : 'Nữ',
        stu.ethnicGroup || '',
        stu.address || '',
        stu.parentName || '',
        stu.parentPhone || '',
      ]);
    });
    const wsBt = XLSX.utils.aoa_to_sheet(sheetBtRows);
    XLSX.utils.book_append_sheet(wb, wsBt, 'BAN_TRU');

    // SHEET: NGOAI_TRU
    const sheetNtRows: any[] = [
      [settings.schoolName.toUpperCase()],
      ['DANH SÁCH HỌC SINH NGOẠI TRÚ CỐ ĐỊNH'],
      [`Tổng số học sinh ngoại trú toàn trường: ${nonBoardingStudents.length} học sinh`],
      [],
      ['STT', 'Mã HS', 'Họ và tên', 'Lớp', 'Khối', 'Giới tính', 'Dân tộc', 'Bản/Thôn', 'Họ tên Phụ huynh', 'SĐT Phụ huynh'],
    ];
    nonBoardingStudents.forEach((stu, idx) => {
      sheetNtRows.push([
        idx + 1,
        stu.code,
        stu.fullName,
        stu.className,
        `Khối ${stu.grade}`,
        stu.gender === 'male' ? 'Nam' : 'Nữ',
        stu.ethnicGroup || '',
        stu.address || '',
        stu.parentName || '',
        stu.parentPhone || '',
      ]);
    });
    const wsNt = XLSX.utils.aoa_to_sheet(sheetNtRows);
    XLSX.utils.book_append_sheet(wb, wsNt, 'NGOAI_TRU');

    const fileSuffix = isFullDay ? 'CA_NGAY' : normSession === 'AFTERNOON' ? 'BUOI_CHIEU' : 'BUOI_SANG';
    this.saveWorkbook(wb, `BaoCao_SiSo_THCSBanBo_${date}_${fileSuffix}`);
  }

  /**
   * Export Class Student Roster
   */
  public exportClassStudentsExcel(classId: string) {
    const classes = storageService.getClasses();
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return;

    const students = storageService.getStudentsByClass(classId);
    const settings = storageService.getSettings();

    const rows: any[] = [
      [settings.schoolName.toUpperCase()],
      [`DANH SÁCH HỌC SINH LỚP ${targetClass.name} - NĂM HỌC ${settings.schoolYear}`],
      [`Giáo viên chủ nhiệm: ${targetClass.teacherName || 'Chưa phân công'} | SĐT: ${targetClass.teacherPhone || ''}`],
      [`Tổng sĩ số: ${students.length} | Bán trú: ${targetClass.boardingCount} | Ngoại trú: ${targetClass.nonBoardingCount || targetClass.dayCount}`],
      [],
      ['STT', 'Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Dân tộc', 'Diện HS', 'Bản/Thôn', 'Họ tên Phụ huynh', 'SĐT Phụ huynh'],
    ];

    students.forEach((stu, idx) => {
      rows.push([
        idx + 1,
        stu.code,
        stu.fullName,
        stu.dateOfBirth,
        stu.gender === 'male' ? 'Nam' : 'Nữ',
        stu.ethnicGroup || '',
        stu.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú',
        stu.address || '',
        stu.parentName || '',
        stu.parentPhone || '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Lop_${targetClass.name}`);
    this.saveWorkbook(wb, `DanhSach_Lop_${targetClass.name}_THCSBanBo`);
  }

  /**
   * Section AG: Parse Student Import File (Excel / CSV)
   */
  public parseStudentImportFile(data: ArrayBuffer | string): { success: boolean; data: any[]; error?: string } {
    try {
      const wb = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' });
      const firstSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonRows.length < 2) {
        return { success: false, data: [], error: 'Tệp không có dữ liệu học sinh' };
      }

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonRows.length); i++) {
        const rowStr = (jsonRows[i] || []).join(' ').toLowerCase();
        if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('name')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) headerRowIndex = 0;

      const headers = (jsonRows[headerRowIndex] || []).map((h: any) => String(h || '').trim().toLowerCase());
      const students: any[] = [];

      for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
        const row = jsonRows[i];
        if (!row || row.length === 0) continue;

        let fullName = '';
        let code = '';
        let dob = '';
        let gender = 'male';
        let studentType = 'day';
        let className = '';
        let parentName = '';
        let parentPhone = '';
        let ethnicGroup = '';
        let address = '';

        headers.forEach((h: string, colIdx: number) => {
          const val = String(row[colIdx] || '').trim();
          if (h.includes('họ và tên') || h.includes('họ tên') || h === 'tên') fullName = val;
          if (h.includes('mã')) code = val;
          if (h.includes('ngày sinh')) dob = val;
          if (h.includes('giới tính')) gender = val.toLowerCase().includes('nữ') ? 'female' : 'male';
          if (h.includes('loại') || h.includes('bán trú') || h.includes('diện')) {
            studentType = val.toLowerCase().includes('bán') ? 'boarding' : 'day';
          }
          if (h.includes('lớp')) className = val.toUpperCase();
          if (h.includes('phụ huynh') || h.includes('bố') || h.includes('mẹ')) parentName = val;
          if (h.includes('sđt') || h.includes('điện thoại')) parentPhone = val;
          if (h.includes('dân tộc')) ethnicGroup = val;
          if (h.includes('bản') || h.includes('thôn') || h.includes('địa chỉ')) address = val;
        });

        if (fullName) {
          students.push({
            fullName,
            code: code || `HS${Date.now().toString().slice(-4)}${i}`,
            dateOfBirth: dob || '2014-01-01',
            gender,
            studentType,
            boardingType: studentType === 'boarding' ? 'BOARDING' : 'NON_BOARDING',
            className,
            parentName,
            parentPhone,
            ethnicGroup,
            address,
            status: 'active',
          });
        }
      }

      return { success: true, data: students };
    } catch (err) {
      return { success: false, data: [], error: (err as Error).message };
    }
  }
}

export const exportService = new ExportService();
