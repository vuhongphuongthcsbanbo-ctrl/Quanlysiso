/**
 * Excel Parser Service
 * Đọc file .xls và .xlsx bằng thư viện SheetJS (xlsx).
 * Hỗ trợ nhận diện thông minh cấu trúc:
 * 1. File có cột Lớp
 * 2. File có tên lớp nằm ở hàng tiêu đề (ví dụ "LỚP 6A1")
 * 3. File có nhiều sheet, mỗi sheet là 1 lớp (hoặc 1 sheet tổng)
 * 4. Header linh hoạt (Họ và tên, Họ tên, Ngày sinh, Giới tính,...)
 */

import * as XLSX from 'xlsx';
import {
  ParsedStudentItem,
  RawStudentRow,
  normalizeStudentName,
  normalizeClassCode,
  parseDateOfBirth,
  parseGender,
  parseBoardingType,
  isNonStudentRow,
  validateStudentItem,
  removeVietnameseAccents,
  OFFICIAL_CLASS_NAMES,
} from './studentValidationService';

export interface ColumnMapping {
  stt?: string;
  code?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  className?: string;
  boardingType?: string;
  ethnicGroup?: string;
  nationality?: string;
  address?: string;
  notes?: string;
}

export interface WorkbookAnalysis {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheetName: string;
  totalRowsFound: number;
  headers: string[];
  suggestedMapping: ColumnMapping;
  detectedClasses: string[];
  hasAll20Classes: boolean;
  missingClasses: string[];
  invalidClasses: string[];
  hasBoardingColumn: boolean;
  sampleRows: Record<string, any>[];
  rawJsonData: Record<string, any>[];
}

/**
 * Đọc File (.xls hoặc .xlsx) và trả về XLSX.WorkBook
 */
export async function readExcelFile(file: File): Promise<XLSX.WorkBook> {
  const arrayBuffer = await file.arrayBuffer();
  // xlsx thư viện hỗ trợ cả .xls (BIFF8) và .xlsx (OOXML)
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: true,
  });
  return workbook;
}

/**
 * Gợi ý ánh xạ cột thông minh dựa trên tên cột trong file Excel
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    fullName: '',
  };

  const findHeader = (patterns: string[]): string | undefined => {
    return headers.find(h => {
      const norm = removeVietnameseAccents(h);
      return patterns.some(p => norm === p || norm.includes(p));
    });
  };

  // Họ tên
  mapping.fullName =
    findHeader(['ho va ten', 'ho ten', 'ho va ten hoc sinh', 'ten hoc sinh', 'fullname', 'ho ten hs']) ||
    headers.find(h => removeVietnameseAccents(h).includes('ten')) ||
    '';

  // Ngày sinh
  mapping.dateOfBirth = findHeader([
    'ngay sinh',
    'ngay thang nam sinh',
    'nam sinh',
    'dob',
    'ngaysinh',
    'ngay_sinh',
  ]);

  // Giới tính
  mapping.gender = findHeader(['gioi tinh', 'phai', 'nam/nu', 'gender', 'gioitinh']);

  // Lớp
  mapping.className = findHeader(['lop', 'ten lop', 'ma lop', 'lop hoc', 'class', 'classroom']);

  // Bán trú
  mapping.boardingType = findHeader([
    'ban tru',
    'dien ban tru',
    'che do',
    'ban tru/ngoai tru',
    'noi tru',
    'boarding',
  ]);

  // Dân tộc
  mapping.ethnicGroup = findHeader(['dan toc', 'thanh phan dan toc', 'ethnicity']);

  // Quốc tịch
  mapping.nationality = findHeader(['quoc tich', 'nationality']);

  // Địa chỉ
  mapping.address = findHeader(['dia chi', 'noi o', 'ho khau', 'thon', 'ban', 'xa', 'address']);

  // STT / Mã
  mapping.stt = findHeader(['stt', 'so thu tu']);
  mapping.code = findHeader(['ma hoc sinh', 'ma hs', 'so the', 'code', 'student code']);

  // Ghi chú
  mapping.notes = findHeader(['ghi chu', 'notes', 'chu thich']);

  return mapping;
}

/**
 * Phân tích workbook và trích xuất thông tin cấu trúc
 */
export function analyzeWorkbook(workbook: XLSX.WorkBook, file: File, selectedSheet?: string): WorkbookAnalysis {
  const sheetNames = workbook.SheetNames;
  const activeSheetName = selectedSheet && sheetNames.includes(selectedSheet) ? selectedSheet : sheetNames[0];
  const worksheet = workbook.Sheets[activeSheetName];

  // Chuyển sheet sang dạng JSON mảng các đối tượng
  // defval: '' để giữ các cột trống
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // Dạng mảng 2 chiều để dễ tìm dòng header thực sự
    defval: '',
    blankrows: false,
  });

  // Tìm dòng chứa Header
  let headerRowIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i] as any[];
    if (Array.isArray(row)) {
      const rowStr = row.map(cell => removeVietnameseAccents(String(cell || '')));
      // Nếu dòng có chứa 'ho ten' hoặc 'ho va ten' hoặc 'ten'
      if (rowStr.some(cell => cell.includes('ho ten') || cell.includes('ho va ten') || cell === 'ten')) {
        headerRowIndex = i;
        headers = row.map(cell => String(cell || '').trim()).filter(Boolean);
        break;
      }
    }
  }

  // Nếu không phát hiện theo từ khóa họ tên, lấy dòng đầu tiên có ít nhất 3 cột có chữ
  if (headers.length === 0 && rawData.length > 0) {
    for (let i = 0; i < Math.min(rawData.length, 5); i++) {
      const row = rawData[i] as any[];
      if (Array.isArray(row) && row.filter(c => String(c).trim()).length >= 3) {
        headerRowIndex = i;
        headers = row.map(cell => String(cell || '').trim()).filter(Boolean);
        break;
      }
    }
  }

  // Chuyển lại thành danh sách object dựa trên headerRowIndex
  const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    range: headerRowIndex,
    defval: '',
    blankrows: false,
  });

  const suggestedMapping = suggestColumnMapping(headers);

  // Phát hiện các lớp trong file
  const detectedClassesSet = new Set<string>();

  // 1. Kiểm tra nếu các Sheet là tên lớp (Kiểu 4: mỗi sheet là 1 lớp)
  sheetNames.forEach(name => {
    const norm = normalizeClassCode(name);
    if (OFFICIAL_CLASS_NAMES.includes(norm)) {
      detectedClassesSet.add(norm);
    }
  });

  // 2. Kiểm tra nếu có cột Lớp
  if (suggestedMapping.className) {
    jsonData.forEach(row => {
      const rawClass = row[suggestedMapping.className!];
      if (rawClass) {
        const norm = normalizeClassCode(String(rawClass));
        if (norm) {
          detectedClassesSet.add(norm);
        }
      }
    });
  }

  // 3. Nếu chưa thấy lớp trong cột, quét trong các hàng tiêu đề phân tách (Kiểu 2)
  if (detectedClassesSet.size === 0) {
    rawData.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(cell => {
          const str = String(cell || '').toUpperCase();
          const match = str.match(/LỚP\s*([6-9]A[1-5])/i) || str.match(/\b([6-9]A[1-5])\b/);
          if (match && match[1]) {
            detectedClassesSet.add(match[1].toUpperCase());
          }
        });
      }
    });
  }

  const detectedClasses = Array.from(detectedClassesSet).sort();
  const validDetected = detectedClasses.filter(c => OFFICIAL_CLASS_NAMES.includes(c));
  const invalidClasses = detectedClasses.filter(c => !OFFICIAL_CLASS_NAMES.includes(c));
  const missingClasses = OFFICIAL_CLASS_NAMES.filter(c => !detectedClasses.includes(c));
  const hasAll20Classes = missingClasses.length === 0;

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames,
    activeSheetName,
    totalRowsFound: jsonData.length,
    headers,
    suggestedMapping,
    detectedClasses,
    hasAll20Classes,
    missingClasses,
    invalidClasses,
    hasBoardingColumn: !!suggestedMapping.boardingType,
    sampleRows: jsonData.slice(0, 5),
    rawJsonData: jsonData,
  };
}

/**
 * Trích xuất danh sách học sinh dựa trên cấu trúc Workbook và Cột ánh xạ
 */
export function extractStudentsFromWorkbook(
  workbook: XLSX.WorkBook,
  mapping: ColumnMapping,
  schoolYearId: string = '2026-2027',
  activeSheetName?: string
): ParsedStudentItem[] {
  const result: ParsedStudentItem[] = [];

  // Kiểm tra trường hợp đặc biệt: mỗi sheet là 1 lớp
  const isSheetPerClass = workbook.SheetNames.some(s => OFFICIAL_CLASS_NAMES.includes(normalizeClassCode(s)));

  const sheetsToProcess = isSheetPerClass
    ? workbook.SheetNames.filter(s => OFFICIAL_CLASS_NAMES.includes(normalizeClassCode(s)))
    : [activeSheetName || workbook.SheetNames[0]];

  let currentContextClass = '';

  sheetsToProcess.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    if (isSheetPerClass) {
      currentContextClass = normalizeClassCode(sheetName);
    }

    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    // Tìm header row
    let headerRowIndex = 0;
    let headers: string[] = [];

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => removeVietnameseAccents(String(cell || '')));
        if (rowStr.some(cell => cell.includes('ho ten') || cell.includes('ho va ten') || cell === 'ten')) {
          headerRowIndex = i;
          headers = row.map(cell => String(cell || '').trim());
          break;
        }
      }
    }

    const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
      range: headerRowIndex,
      defval: '',
      blankrows: false,
    });

    jsonData.forEach((row, index) => {
      // 1. Kiểm tra dòng trống hoàn toàn
      const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
      if (values.length === 0) return;

      const rawFullName = row[mapping.fullName] || '';
      const fullName = normalizeStudentName(String(rawFullName));

      // 2. Bỏ qua nếu là dòng tiêu đề lặp, tổng cộng hoặc không phải học sinh
      if (!fullName || isNonStudentRow(fullName)) {
        // Kiểm tra xem dòng này có chứa thông báo chuyển lớp không (Kiểu 2: Tên lớp là tiêu đề)
        const rowContent = Object.values(row).join(' ').toUpperCase();
        const classMatch = rowContent.match(/LỚP\s*([6-9]A[1-5])/i) || rowContent.match(/\b([6-9]A[1-5])\b/);
        if (classMatch && classMatch[1]) {
          currentContextClass = classMatch[1].toUpperCase();
        }
        return;
      }

      // Xác định lớp
      let className = '';
      if (mapping.className && row[mapping.className]) {
        className = normalizeClassCode(String(row[mapping.className]));
      } else if (currentContextClass) {
        className = currentContextClass;
      }

      // Tính grade
      let grade = 0;
      if (className.startsWith('6')) grade = 6;
      else if (className.startsWith('7')) grade = 7;
      else if (className.startsWith('8')) grade = 8;
      else if (className.startsWith('9')) grade = 9;

      // Xử lý ngày sinh
      const rawDob = mapping.dateOfBirth ? row[mapping.dateOfBirth] : '';
      const dobResult = parseDateOfBirth(rawDob);

      // Xử lý giới tính
      const rawGender = mapping.gender ? row[mapping.gender] : '';
      const gender = parseGender(rawGender);

      // Xử lý bán trú
      const rawBoarding = mapping.boardingType ? row[mapping.boardingType] : '';
      const boardingType = parseBoardingType(rawBoarding);

      // Dân tộc
      const ethnicGroup = mapping.ethnicGroup ? String(row[mapping.ethnicGroup] || '').trim() : '';

      // Quốc tịch
      const nationality = mapping.nationality ? String(row[mapping.nationality] || '').trim() : 'Việt Nam';

      // Địa chỉ
      const address = mapping.address ? String(row[mapping.address] || '').trim() : '';

      // STT / Mã học sinh
      const rawCode = mapping.code ? String(row[mapping.code] || '').trim() : '';
      const stt = mapping.stt ? row[mapping.stt] : index + 1;
      const code = rawCode || `HS-${className}-${String(stt).padStart(2, '0')}`;

      // Ghi chú
      const notes = mapping.notes ? String(row[mapping.notes] || '').trim() : '';

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const itemBase = {
        tempId,
        originalRowIndex: index + headerRowIndex + 2, // Đánh số dòng theo Excel (1-indexed + header)
        originalData: row,
        fullName,
        normalizedName: removeVietnameseAccents(fullName),
        code,
        dateOfBirth: dobResult.iso,
        displayDob: dobResult.display || String(rawDob),
        gender,
        classId: className ? `cls_${className.toLowerCase()}` : '',
        className,
        grade,
        boardingType,
        ethnicGroup: ethnicGroup || 'Thái',
        nationality: nationality || 'Việt Nam',
        address,
        notes,
      };

      const val = validateStudentItem(itemBase, schoolYearId);

      result.push({
        ...itemBase,
        status: val.status,
        errors: val.errors,
        warnings: val.warnings,
        duplicateKey: val.duplicateKey,
      });
    });
  });

  return result;
}
