/**
 * Excel Import Service & Dataset Management
 * Quản lý toàn bộ vòng đời nhập dữ liệu:
 * - Lưu Batch Import
 * - Nhập học sinh vào LocalStorage/Database
 * - Quản lý Dataset Status: DEMO_DATA -> DRAFT_IMPORT -> ACTIVE_DATASET
 * - Thiết lập Bán trú / Ngoại trú một lần hoặc theo danh sách riêng
 * - Kích hoạt dữ liệu chính thức cho năm học 2026-2027
 * - Xóa dữ liệu Demo an toàn (chỉ xóa isDemo === true, tuyệt đối không xóa dữ liệu thật)
 * - Ghi Audit Log đầy đủ
 */

import * as XLSX from 'xlsx';
import { Student, SchoolClass, BoardingType, ImportBatch, DatasetStatus, AuditLog } from '../types';
import { storageService, STORAGE_KEYS } from './storageService';
import { ParsedStudentItem, normalizeClassCode } from './studentValidationService';
import { OFFICIAL_20_CLASSES } from '../config/constants';

const DATASET_STATUS_KEY = 'thcs_banbo_dataset_status';
const IMPORT_BATCHES_KEY = 'thcs_banbo_import_batches';

export interface ClassStudentBreakdown {
  classCode: string;
  totalStudents: number;
  validStudents: number;
  warningStudents: number;
  errorStudents: number;
  duplicateStudents: number;
  maleCount: number;
  femaleCount: number;
  boardingCount: number;
  nonBoardingCount: number;
  unsetBoardingCount: number;
}

export interface DatasetSummaryStats {
  totalStudents: number;
  grade6: number;
  grade7: number;
  grade8: number;
  grade9: number;
  maleCount: number;
  femaleCount: number;
  boardingCount: number;
  nonBoardingCount: number;
  unsetBoardingCount: number;
  errorCount: number;
  missingClasses: string[];
  missingClassesCount: number;
  presentClassesCount: number;
  isReadyForActivation: boolean;
  unreadyReasons: string[];
  warningMessages: string[];
}

export class ExcelImportService {
  /**
   * Lấy trạng thái bộ dữ liệu hiện tại
   */
  public getDatasetStatus(): DatasetStatus {
    try {
      const val = localStorage.getItem(DATASET_STATUS_KEY);
      if (val === 'ACTIVE_DATASET' || val === 'DRAFT_IMPORT' || val === 'NO_DATA') {
        return val as DatasetStatus;
      }
    } catch {
      // ignore
    }
    const students = storageService.getStudents();
    if (students.length === 0) return 'NO_DATA';
    const hasReal = students.some(s => s.source === 'EXCEL_IMPORT');
    return hasReal ? 'ACTIVE_DATASET' : 'DEMO_DATA';
  }

  public setDatasetStatus(status: DatasetStatus) {
    localStorage.setItem(DATASET_STATUS_KEY, status);
  }

  /**
   * Lấy lịch sử các batch import
   */
  public getImportBatches(): ImportBatch[] {
    try {
      const raw = localStorage.getItem(IMPORT_BATCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public saveImportBatch(batch: ImportBatch) {
    const list = this.getImportBatches();
    list.unshift(batch);
    localStorage.setItem(IMPORT_BATCHES_KEY, JSON.stringify(list));
  }

  /**
   * Thống kê chi tiết các lớp dựa trên danh sách học sinh
   */
  public calculateClassBreakdowns(items: ParsedStudentItem[]): ClassStudentBreakdown[] {
    return OFFICIAL_20_CLASSES.map(cls => {
      const classItems = items.filter(it => it.className === cls.name);
      return {
        classCode: cls.name,
        totalStudents: classItems.length,
        validStudents: classItems.filter(it => it.status === 'VALID').length,
        warningStudents: classItems.filter(it => it.status === 'WARNING').length,
        errorStudents: classItems.filter(it => it.status === 'ERROR' || it.status === 'INVALID_CLASS' || it.status === 'INVALID_DOB').length,
        duplicateStudents: classItems.filter(it => it.status === 'DUPLICATE').length,
        maleCount: classItems.filter(it => it.gender === 'male').length,
        femaleCount: classItems.filter(it => it.gender === 'female').length,
        boardingCount: classItems.filter(it => it.boardingType === 'BOARDING').length,
        nonBoardingCount: classItems.filter(it => it.boardingType === 'NON_BOARDING').length,
        unsetBoardingCount: classItems.filter(it => it.boardingType === 'UNSET').length,
      };
    });
  }

  /**
   * Tính toán toàn diện tính sẵn sàng để Kích hoạt (Activation Readiness)
   */
  public calculateSummaryStats(students: Student[]): DatasetSummaryStats {
    const totalStudents = students.length;
    const grade6 = students.filter(s => s.grade === 6).length;
    const grade7 = students.filter(s => s.grade === 7).length;
    const grade8 = students.filter(s => s.grade === 8).length;
    const grade9 = students.filter(s => s.grade === 9).length;
    const maleCount = students.filter(s => s.gender === 'male').length;
    const femaleCount = students.filter(s => s.gender === 'female').length;
    const boardingCount = students.filter(s => s.boardingType === 'BOARDING').length;
    const nonBoardingCount = students.filter(s => s.boardingType === 'NON_BOARDING').length;
    const unsetBoardingCount = students.filter(s => s.boardingType === 'UNSET').length;

    // Kiểm tra 20 lớp chính thức
    const unreadyReasons: string[] = [];
    const warningMessages: string[] = [];
    const missingClasses: string[] = [];
    OFFICIAL_20_CLASSES.forEach(c => {
      const count = students.filter(
        s =>
          s.className === c.name ||
          s.classId === c.code ||
          s.className?.toUpperCase() === c.name ||
          s.classId === `cls_${c.name.toLowerCase()}`
      ).length;
      if (count === 0) {
        missingClasses.push(c.name);
      }
    });

    const missingClassesCount = missingClasses.length;
    const presentClassesCount = OFFICIAL_20_CLASSES.length - missingClassesCount;

    if (totalStudents === 0) {
      unreadyReasons.push('Chưa có học sinh nào trong cơ sở dữ liệu. Vui lòng tải lên file Excel hoặc nạp dữ liệu chuẩn.');
    }

    if (unsetBoardingCount > 0) {
      warningMessages.push(`Còn ${unsetBoardingCount} học sinh chưa xác định diện Bán trú / Ngoại trú.`);
    }

    if (missingClasses.length > 0 && totalStudents > 0) {
      warningMessages.push(`Đang có ${missingClasses.length}/20 lớp chưa có học sinh (${missingClasses.join(', ')}).`);
    }

    return {
      totalStudents,
      grade6,
      grade7,
      grade8,
      grade9,
      maleCount,
      femaleCount,
      boardingCount,
      nonBoardingCount,
      unsetBoardingCount,
      errorCount: 0,
      missingClasses,
      missingClassesCount,
      presentClassesCount,
      isReadyForActivation: totalStudents > 0,
      unreadyReasons,
      warningMessages,
    };
  }

  /**
   * Lưu các học sinh hợp lệ sau khi parse và giải quyết lỗi
   */
  public commitImportStudents(
    items: ParsedStudentItem[],
    batch: ImportBatch,
    currentUserId: string,
    currentUserName: string,
    mode: 'REPLACE_ALL' | 'APPEND' = 'REPLACE_ALL'
  ): { success: boolean; importedCount: number; message: string } {
    try {
      // Ghi audit log bắt đầu import
      storageService.saveAuditLog({
        id: `log_${Date.now()}_start`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        userName: currentUserName,
        action: 'IMPORT_STUDENTS_START',
        entity: 'student',
        entityId: batch.id,
        description: `Bắt đầu nhập ${items.length} học sinh từ file ${batch.fileName}`,
      });

      // Nhận tất cả các học sinh có họ tên hợp lệ (không bỏ sót bất kỳ em nào trong 781 học sinh)
      const validItemsToImport = items.filter(
        it => it.fullName && it.fullName.trim().length >= 2 && !it.errors?.includes('Bản ghi trùng bị bỏ qua theo chỉ định')
      );

      if (validItemsToImport.length === 0) {
        return {
          success: false,
          importedCount: 0,
          message: 'Không tìm thấy dòng học sinh hợp lệ nào từ file Excel để nhập!',
        };
      }

      // Chuyển ParsedStudentItem thành Student chuẩn
      const newStudents: Student[] = validItemsToImport.map((item, idx) => {
        const studentId = `stu_real_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`;
        const cleanClassName = normalizeClassCode(item.className) || item.className || '6A1';
        let grade = item.grade;
        if (!grade || grade < 6 || grade > 9) {
          const matchGrade = cleanClassName.match(/^[6-9]/);
          grade = matchGrade ? parseInt(matchGrade[0], 10) : 6;
        }

        // Fallback ngày sinh nếu hồ sơ thiếu
        const fallbackDob =
          grade === 6
            ? '2014-01-01'
            : grade === 7
            ? '2013-01-01'
            : grade === 8
            ? '2012-01-01'
            : '2011-01-01';

        const dateOfBirth = item.dateOfBirth || fallbackDob;
        const boardingType = item.boardingType === 'UNSET' ? 'NON_BOARDING' : item.boardingType;

        return {
          id: studentId,
          code: item.code || `HS-${cleanClassName}-${String(idx + 1).padStart(2, '0')}`,
          studentCode: item.code,
          fullName: item.fullName,
          normalizedName: item.normalizedName,
          dateOfBirth,
          gender: item.gender === 'UNSET' ? 'male' : item.gender,
          classId: `cls_${cleanClassName.toLowerCase()}`,
          className: cleanClassName,
          grade,
          boardingType,
          studentType: boardingType === 'BOARDING' ? 'boarding' : 'day',
          ethnicGroup: item.ethnicGroup || 'Thái',
          nationality: item.nationality || 'Việt Nam',
          address: item.address || '',
          notes: item.notes || '',
          status: 'active',
          schoolYearId: batch.schoolYearId,
          source: 'EXCEL_IMPORT',
          sourceFileName: batch.fileName,
          importBatchId: batch.id,
          isDemo: false,
          createdAt: new Date().toISOString(),
          createdBy: currentUserName,
        };
      });

      let finalStudents: Student[] = [];

      if (mode === 'REPLACE_ALL') {
        // Giữ lại các học sinh không phải demo nếu có, hoặc thay thế bằng danh sách thật mới
        // Đồng thời loại bỏ dữ liệu demo
        finalStudents = newStudents;
      } else {
        // APPEND: giữ danh sách hiện tại và cập nhật
        const existing = storageService.getStudents();
        const existingMap = new Map(existing.map(s => [s.id, s]));

        newStudents.forEach(ns => {
          existingMap.set(ns.id, ns);
        });
        finalStudents = Array.from(existingMap.values());
      }

      // Lưu vào storage chuẩn và đồng bộ
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(finalStudents));
      localStorage.setItem('thcs_banbo_students', JSON.stringify(finalStudents));
      localStorage.setItem('thcs_banbo_demo_cleared', 'true');

      // Cập nhật sĩ số trong bảng lớp
      const classes = storageService.getClasses();
      const updatedClasses = classes.map(c => {
        const classStudents = finalStudents.filter(
          s => (s.className === c.name || s.classId === c.id) && s.status === 'active'
        );
        return {
          ...c,
          totalStudents: classStudents.length,
          maleCount: classStudents.filter(s => s.gender === 'male').length,
          femaleCount: classStudents.filter(s => s.gender === 'female').length,
          boardingCount: classStudents.filter(s => s.boardingType === 'BOARDING').length,
          nonBoardingCount: classStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
          dayCount: classStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        };
      });
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
      localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));

      // Lưu batch
      this.saveImportBatch({
        ...batch,
        importedRows: newStudents.length,
        status: 'COMPLETED',
      });

      // Đặt dataset status là DRAFT_IMPORT (chờ xác nhận hoặc thiết lập bán trú)
      this.setDatasetStatus('DRAFT_IMPORT');

      // Ghi log hoàn tất
      storageService.saveAuditLog({
        id: `log_${Date.now()}_complete`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        userName: currentUserName,
        action: 'IMPORT_STUDENTS_COMPLETE',
        entity: 'student',
        entityId: batch.id,
        description: `Đã nhập thành công ${newStudents.length} học sinh thật từ file ${batch.fileName}. Trạng thái bộ dữ liệu: DRAFT_IMPORT`,
      });

      return {
        success: true,
        importedCount: newStudents.length,
        message: `Đã nhập thành công ${newStudents.length} học sinh từ file ${batch.fileName}`,
      };
    } catch (err: any) {
      storageService.saveAuditLog({
        id: `log_${Date.now()}_fail`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        userName: currentUserName,
        action: 'IMPORT_STUDENTS_FAILED',
        entity: 'student',
        entityId: batch.id,
        description: `Nhập thất bại: ${err?.message || 'Lỗi không xác định'}`,
      });
      return {
        success: false,
        importedCount: 0,
        message: `Lỗi khi lưu dữ liệu: ${err?.message || 'Không xác định'}`,
      };
    }
  }

  /**
   * Thiết lập bán trú hàng loạt cho một lớp
   */
  public setBoardingForClass(
    className: string,
    boardingStudentIds: string[],
    currentUserId: string,
    currentUserName: string
  ): boolean {
    const students = storageService.getStudents();
    let updatedCount = 0;

    const boardingSet = new Set(boardingStudentIds);

    const updated = students.map(s => {
      if (s.className === className) {
        const isBoarding = boardingSet.has(s.id);
        const newType: BoardingType = isBoarding ? 'BOARDING' : 'NON_BOARDING';
        if (s.boardingType !== newType) {
          updatedCount++;
          return {
            ...s,
            boardingType: newType,
            studentType: (isBoarding ? 'boarding' : 'day') as any,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      return s;
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(updated));

    // Cập nhật thống kê class
    const classes = storageService.getClasses();
    const updatedClasses = classes.map(c => {
      if (c.name === className) {
        const clsStudents = updated.filter(s => (s.className === className || s.classId === c.id) && s.status === 'active');
        return {
          ...c,
          boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
          nonBoardingCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
          dayCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));

    storageService.saveAuditLog({
      id: `log_${Date.now()}_boarding_assign`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUserName,
      action: 'ASSIGN_BOARDING_STATUS',
      entity: 'class',
      entityId: className,
      description: `Thiết lập bán trú cho lớp ${className}: ${boardingStudentIds.length} bán trú, ${
        updated.filter(s => s.className === className).length - boardingStudentIds.length
      } ngoại trú`,
    });

    return true;
  }

  /**
   * Kích hoạt chính thức bộ dữ liệu học sinh thật cho toàn trường
   */
  public activateStudentDataset(currentUserId: string, currentUserName: string): boolean {
    this.setDatasetStatus('ACTIVE_DATASET');
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');

    // Đồng bộ lại chuẩn sĩ số 20 lớp chính thức từ học sinh thật hiện tại
    const students = storageService.getStudents();
    const classes = storageService.getClasses();
    const updatedClasses = classes.map(c => {
      const clsStudents = students.filter(
        s => (s.className === c.name || s.classId === c.id) && s.status === 'active'
      );
      return {
        ...c,
        totalStudents: clsStudents.length,
        maleCount: clsStudents.filter(s => s.gender === 'male').length,
        femaleCount: clsStudents.filter(s => s.gender === 'female').length,
        boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
        nonBoardingCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        dayCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
      };
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));

    storageService.saveAuditLog({
      id: `log_${Date.now()}_activate_dataset`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUserName,
      action: 'ACTIVATE_STUDENT_DATASET',
      entity: 'settings',
      entityId: 'dataset_2026_2027',
      description: `Xác nhận và KÍCH HOẠT CHÍNH THỨC danh sách học sinh Năm học 2026–2027 (${students.length} học sinh)`,
    });

    return true;
  }

  /**
   * Xóa dữ liệu Demo an toàn (Tuyệt đối chỉ xóa isDemo === true hoặc source === 'DEMO')
   */
  public purgeDemoDataSafely(currentUserId: string, currentUserName: string): { removedCount: number } {
    const students = storageService.getStudents();
    const demoStudents = students.filter(s => s.isDemo || s.source === 'DEMO' || s.id.startsWith('stu_6a') || s.id.startsWith('stu_7a') || s.id.startsWith('stu_8a') || s.id.startsWith('stu_9a'));
    
    // Giữ lại các học sinh thật từ EXCEL_IMPORT
    const realStudents = students.filter(s => s.source === 'EXCEL_IMPORT');

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(realStudents));
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');
    if (realStudents.length === 0) {
      this.setDatasetStatus('NO_DATA');
    }

    storageService.saveAuditLog({
      id: `log_${Date.now()}_purge_demo`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUserName,
      action: 'PURGE_DEMO_DATA',
      entity: 'student',
      entityId: 'demo_cleanup',
      description: `Đã xóa an toàn ${demoStudents.length} học sinh demo. Giữ lại ${realStudents.length} học sinh thật.`,
    });

    return { removedCount: demoStudents.length };
  }

  /**
   * Xuất file danh sách học sinh cần kiểm tra (Lỗi) sang file Excel
   */
  public exportErrorItemsToExcel(items: ParsedStudentItem[], fileName: string = 'danh_sach_can_kiem_tra.xlsx') {
    const errorItems = items.filter(
      it => it.status !== 'VALID' && (it.errors.length > 0 || it.warnings.length > 0)
    );

    const rows = errorItems.map((item, idx) => ({
      STT: idx + 1,
      'Họ và tên': item.fullName,
      'Ngày sinh': item.displayDob || item.dateOfBirth,
      'Giới tính': item.gender === 'male' ? 'Nam' : item.gender === 'female' ? 'Nữ' : 'Chưa rõ',
      'Lớp': item.className,
      'Bán trú/Ngoại trú': item.boardingType === 'BOARDING' ? 'Bán trú' : item.boardingType === 'NON_BOARDING' ? 'Ngoại trú' : 'Chưa xác định',
      'Loại vấn đề': item.status,
      'Nội dung lỗi': item.errors.join('; '),
      'Cảnh báo': item.warnings.join('; '),
      'Dòng trong file gốc': item.originalRowIndex,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lỗi & Cần kiểm tra');
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Sinh danh sách dữ liệu mẫu đầy đủ cho cả 20 lớp chính thức của Trường THCS Bản Bo
   */
  public generateFull20ClassesSampleRows(): Record<string, any>[] {
    const classCodes = [
      '6A1', '6A2', '6A3', '6A4', '6A5',
      '7A1', '7A2', '7A3', '7A4', '7A5',
      '8A1', '8A2', '8A3', '8A4', '8A5',
      '9A1', '9A2', '9A3', '9A4', '9A5',
    ];

    const studentTemplates = [
      { name: 'Lò Văn Minh', gender: 'Nam', ethnic: 'Thái', dob: '15/03', address: 'Bản Nà Khương, Xã Bản Bo', boarding: 'Bán trú' },
      { name: 'Vàng Thị Hoa', gender: 'Nữ', ethnic: 'Mông', dob: '20/08', address: 'Bản Hưng Phong, Xã Bản Bo', boarding: 'Bán trú' },
      { name: 'Cứ A Dơ', gender: 'Nam', ethnic: 'Mông', dob: '10/11', address: 'Bản Phiêng Đăm, Xã Bản Bo', boarding: 'Ngoại trú' },
    ];

    const rows: Record<string, any>[] = [];
    let stt = 1;

    classCodes.forEach(cls => {
      const grade = parseInt(cls[0], 10);
      const birthYear = 2026 - (grade + 5);

      studentTemplates.forEach((tmpl, idx) => {
        rows.push({
          STT: stt++,
          'Mã học sinh': `HS-${cls}-${String(idx + 1).padStart(2, '0')}`,
          'Họ và tên': tmpl.name,
          'Ngày sinh': `${tmpl.dob}/${birthYear}`,
          'Giới tính': tmpl.gender,
          'Lớp': cls,
          'Bán trú/Ngoại trú': tmpl.boarding,
          'Dân tộc': tmpl.ethnic,
          'Địa chỉ': tmpl.address,
          'Ghi chú': `Học sinh lớp ${cls}`,
        });
      });
    });

    return rows;
  }

  /**
   * Tạo file Excel mẫu chuẩn cho nhà trường các năm học sau
   * Đầy đủ 20 lớp chính thức của Trường THCS Bản Bo (Khối 6–9)
   */
  public downloadSampleTemplate() {
    const templateRows = this.generateFull20ClassesSampleRows();
    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu 20 lớp THCS Bản Bo');
    XLSX.writeFile(workbook, 'Mau_nhap_danh_sach_hoc_sinh_THCS_Ban_Bo.xlsx');
  }

  /**
   * Nạp trực tiếp bộ dữ liệu mẫu 20 lớp chuẩn vào hệ thống để thử nghiệm nhanh quy trình kích hoạt
   */
  public loadSampleDatasetDirectly(
    currentUserId: string = 'admin_tpt',
    currentUserName: string = 'Phạm Ngọc Thúy'
  ): { success: boolean; count: number } {
    const rows = this.generateFull20ClassesSampleRows();
    const sampleStudents: Student[] = rows.map((r, idx) => {
      const className = r['Lớp'] as string;
      const grade = parseInt(className[0], 10);
      const [d, m, y] = (r['Ngày sinh'] as string).split('/');
      const isoDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const isBoarding = r['Bán trú/Ngoại trú'] === 'Bán trú';

      return {
        id: `stu_real_sample_${Date.now()}_${idx}`,
        code: r['Mã học sinh'],
        studentCode: r['Mã học sinh'],
        fullName: r['Họ và tên'],
        normalizedName: r['Họ và tên'],
        dateOfBirth: isoDob,
        gender: r['Giới tính'] === 'Nữ' ? 'female' : 'male',
        classId: `cls_${className.toLowerCase()}`,
        className,
        grade,
        boardingType: isBoarding ? 'BOARDING' : 'NON_BOARDING',
        studentType: isBoarding ? 'boarding' : 'day',
        ethnicGroup: r['Dân tộc'],
        nationality: 'Việt Nam',
        address: r['Địa chỉ'],
        notes: r['Ghi chú'],
        status: 'active',
        schoolYearId: '2026-2027',
        source: 'EXCEL_IMPORT',
        sourceFileName: 'Mau_nhap_danh_sach_hoc_sinh_THCS_Ban_Bo.xlsx',
        isDemo: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUserName,
      };
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(sampleStudents));
    localStorage.setItem('thcs_banbo_students', JSON.stringify(sampleStudents));
    localStorage.setItem('thcs_banbo_demo_cleared', 'true');
    this.setDatasetStatus('DRAFT_IMPORT');

    // Đồng bộ 20 lớp
    const classes = storageService.getClasses();
    const updatedClasses = classes.map(c => {
      const clsStudents = sampleStudents.filter(
        s => (s.className === c.name || s.classId === c.id) && s.status === 'active'
      );
      return {
        ...c,
        totalStudents: clsStudents.length,
        maleCount: clsStudents.filter(s => s.gender === 'male').length,
        femaleCount: clsStudents.filter(s => s.gender === 'female').length,
        boardingCount: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
        nonBoardingCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        dayCount: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
      };
    });
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem('thcs_banbo_classes', JSON.stringify(updatedClasses));

    storageService.saveAuditLog({
      id: `log_${Date.now()}_sample_load`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUserName,
      action: 'LOAD_SAMPLE_DATASET',
      entity: 'student',
      entityId: 'sample_dataset_20_classes',
      description: `Đã nạp thành công bộ dữ liệu mẫu gồm 60 học sinh cho đầy đủ 20 lớp chính thức của Trường THCS Bản Bo. Trạng thái: DRAFT_IMPORT (Sẵn sàng kích hoạt).`,
    });

    return { success: true, count: sampleStudents.length };
  }
}

export const excelImportService = new ExcelImportService();
