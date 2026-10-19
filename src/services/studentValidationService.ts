/**
 * Student Validation & Normalization Service
 * Tuân thủ tuyệt đối nguyên tắc nghiệp vụ Trường THCS Bản Bo:
 * - Không tự ý đoán tên, giới tính, ngày sinh, hay diện bán trú.
 * - Chuẩn hóa khoảng trắng nhưng giữ nguyên dấu tiếng Việt và chính tả.
 * - Phân loại tình trạng bản ghi: VALID, WARNING, ERROR, DUPLICATE.
 */

import { BoardingType, Student } from '../types';
import { OFFICIAL_20_CLASSES } from '../config/constants';

export type ValidationStatus =
  | 'VALID'
  | 'WARNING'
  | 'ERROR'
  | 'DUPLICATE'
  | 'INVALID_CLASS'
  | 'INVALID_DOB'
  | 'UNSET_BOARDING';

export interface RawStudentRow {
  stt?: string | number;
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
  [key: string]: any;
}

export interface ParsedStudentItem {
  tempId: string;
  originalRowIndex: number;
  originalData: Record<string, any>;
  
  fullName: string;
  normalizedName: string;
  code: string;
  dateOfBirth: string; // YYYY-MM-DD hoặc chuỗi gốc nếu lỗi
  displayDob: string; // dd/mm/yyyy
  gender: 'male' | 'female' | 'UNSET';
  classId: string;
  className: string;
  grade: number;
  boardingType: BoardingType;
  ethnicGroup: string;
  nationality: string;
  address: string;
  notes: string;
  
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
  duplicateKey: string;
  isModifiedByUser?: boolean;
}

export const OFFICIAL_CLASS_NAMES = OFFICIAL_20_CLASSES.map(c => c.name);

/**
 * Loại bỏ dấu tiếng Việt để tạo normalizedName dùng đối soát so sánh,
 * TUYỆT ĐỐI KHÔNG DÙNG ĐỂ HIỂN THỊ TRÊN GIAO DIỆN.
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Chuẩn hóa họ tên:
 * - Loại bỏ khoảng trắng thừa đầu/cuối
 * - Thu gọn nhiều khoảng trắng liên tiếp về 1 khoảng trắng
 * - KHÔNG sửa chính tả, KHÔNG bỏ dấu tiếng Việt.
 */
export function normalizeStudentName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Chuẩn hóa mã lớp:
 * - "6a1", " 6A1 ", "Lớp 6A1", "lop 6a1", "LỚP: 6A1", "6A 1", "6.1", "6/1" -> "6A1"
 */
export function normalizeClassCode(code: string | undefined): string {
  if (!code) return '';
  const str = code.toString().trim();
  // Loại bỏ các tiền tố thông dụng trong file Excel trường học: Lớp, LOP, Khối, KHOI, Class...
  const stripped = str.replace(/^(lớp|lop|khối|khoi|class)\s*[:.-]?\s*/i, '').trim();
  const noSpace = stripped.toUpperCase().replace(/\s+/g, '');

  if (OFFICIAL_CLASS_NAMES.includes(noSpace)) {
    return noSpace;
  }

  // Quét tìm định dạng chuẩn [6-9]A[1-5] trong chuỗi (ví dụ: "LỚP 6A1", "KHỐI 6 - 6A1")
  const match = str.match(/(?:LỚP|LOP|KHỐI|KHOI)?\s*([6-9])\s*([A-Za-z])\s*([1-5])/i);
  if (match) {
    const candidate = `${match[1]}A${match[3]}`.toUpperCase();
    if (OFFICIAL_CLASS_NAMES.includes(candidate)) {
      return candidate;
    }
  }

  // Quét tìm định dạng số chấm / gạch chéo: 6.1, 6/1, 6-1, 6 1 -> 6A1
  const numMatch = str.match(/([6-9])\s*[./\-\s]\s*([1-5])/);
  if (numMatch) {
    const candidate = `${numMatch[1]}A${numMatch[2]}`.toUpperCase();
    if (OFFICIAL_CLASS_NAMES.includes(candidate)) {
      return candidate;
    }
  }

  return noSpace;
}

/**
 * Xử lý ngày sinh đa định dạng:
 * - dd/mm/yyyy, d/m/yyyy, yyyy-mm-dd
 * - Excel date serial number (e.g. 41530)
 * - Date object
 * Trả về { iso: 'YYYY-MM-DD', display: 'dd/mm/yyyy', isValid: boolean }
 */
export function parseDateOfBirth(val: any): { iso: string; display: string; isValid: boolean; raw: string } {
  if (val === null || val === undefined || val === '') {
    return { iso: '', display: '', isValid: false, raw: '' };
  }

  // Trường hợp là Excel serial number (số)
  if (typeof val === 'number') {
    try {
      // Excel epoch bắt đầu từ 1899-12-30
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        // Kiểm tra năm hợp lý cho THCS (thường 2005 - 2020)
        if (y >= 1990 && y <= 2025) {
          return {
            iso: `${y}-${m}-${d}`,
            display: `${d}/${m}/${y}`,
            isValid: true,
            raw: String(val),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  const rawStr = String(val).trim();
  // Loại bỏ khoảng trắng thừa giữa ngày/tháng/năm: ví dụ "15 / 08 / 2012" -> "15/08/2012"
  const str = rawStr.replace(/\s+/g, '');

  // Trường hợp Date instance
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return {
      iso: `${y}-${m}-${d}`,
      display: `${d}/${m}/${y}`,
      isValid: true,
      raw: rawStr,
    };
  }

  // ISO timestamp (ví dụ 2012-08-15T00:00:00.000Z)
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const isoPart = str.split('T')[0];
    const [y, m, d] = isoPart.split('-');
    return {
      iso: isoPart,
      display: `${d}/${m}/${y}`,
      isValid: true,
      raw: rawStr,
    };
  }

  // Regex dd/mm/yyyy hoặc dd-mm-yyyy hoặc dd.mm.yyyy hoặc d/m/yyyy hoặc d/m/yy
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const padDay = String(day).padStart(2, '0');
      const padMonth = String(month).padStart(2, '0');
      return {
        iso: `${year}-${padMonth}-${padDay}`,
        display: `${padDay}/${padMonth}/${year}`,
        isValid: true,
        raw: rawStr,
      };
    }
    return { iso: '', display: rawStr, isValid: false, raw: rawStr };
  }

  // Regex yyyy-mm-dd hoặc yyyy/mm/dd
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const padDay = String(day).padStart(2, '0');
      const padMonth = String(month).padStart(2, '0');
      return {
        iso: `${year}-${padMonth}-${padDay}`,
        display: `${padDay}/${padMonth}/${year}`,
        isValid: true,
        raw: rawStr,
      };
    }
    return { iso: '', display: rawStr, isValid: false, raw: rawStr };
  }

  // Nếu chỉ có năm (ví dụ 2014)
  if (/^\d{4}$/.test(str)) {
    const year = parseInt(str, 10);
    if (year >= 1990 && year <= 2025) {
      return {
        iso: `${year}-01-01`,
        display: `01/01/${year}`,
        isValid: true,
        raw: rawStr,
      };
    }
  }

  return { iso: '', display: str, isValid: false, raw: str };
}

/**
 * Xử lý giới tính:
 * Tuyệt đối không tự suy đoán từ họ tên!
 */
export function parseGender(val: any): 'male' | 'female' | 'UNSET' {
  if (!val) return 'UNSET';
  const clean = String(val).trim().toLowerCase();
  if (clean === 'nam' || clean === 'm' || clean === 'male' || clean === 'trai' || clean === '1') {
    return 'male';
  }
  if (clean === 'nữ' || clean === 'nu' || clean === 'f' || clean === 'female' || clean === 'gái' || clean === '0' || clean === '2') {
    return 'female';
  }
  return 'UNSET';
}

/**
 * Xử lý diện bán trú:
 * BOARDING = Bán trú, NON_BOARDING = Ngoại trú, UNSET = Chưa xác định.
 * Tuyệt đối không tự đoán!
 */
export function parseBoardingType(val: any): BoardingType {
  if (!val) return 'UNSET';
  const clean = removeVietnameseAccents(String(val));
  if (clean.includes('ban tru') || clean === 'bt' || clean === 'co' || clean === 'x' || clean === 'yes' || clean === 'true') {
    return 'BOARDING';
  }
  if (clean.includes('ngoai tru') || clean === 'nt' || clean === 'khong' || clean === 'no' || clean === 'false') {
    return 'NON_BOARDING';
  }
  return 'UNSET';
}

/**
 * Kiểm tra xem một dòng có phải là dòng tiêu đề phụ/tổng cộng hay rác:
 */
export function isNonStudentRow(fullName: string): boolean {
  if (!fullName) return true;
  const normalized = removeVietnameseAccents(fullName);
  const skipKeywords = [
    'danh sach hoc sinh',
    'tong cong',
    'tong so',
    'thcs ban bo',
    'truong thcs',
    'nam hoc',
    'giao vien chu nhiem',
    'nguoi lap bieu',
    'hieu truong',
    'stt',
    'ho va ten',
    'lop ',
    'khoi ',
  ];

  return skipKeywords.some(keyword => normalized === keyword || normalized.startsWith(keyword + ':'));
}

/**
 * Kiểm tra tính hợp lệ của một học sinh
 */
export function validateStudentItem(
  item: Omit<ParsedStudentItem, 'status' | 'errors' | 'warnings' | 'duplicateKey'>,
  schoolYearId: string = '2026-2027'
): { status: ValidationStatus; errors: string[]; warnings: string[]; duplicateKey: string } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Kiểm tra họ tên
  if (!item.fullName || item.fullName.trim().length === 0) {
    errors.push('Thiếu họ và tên học sinh');
  } else if (item.fullName.trim().length < 3) {
    errors.push('Họ tên quá ngắn không hợp lệ');
  }

  // 2. Kiểm tra lớp
  const normalizedClass = normalizeClassCode(item.className);
  if (!normalizedClass) {
    errors.push('Chưa xác định lớp học');
  } else if (!OFFICIAL_CLASS_NAMES.includes(normalizedClass)) {
    errors.push(`Lớp ${normalizedClass} không thuộc 20 lớp chính thức (6A1 - 9A5)`);
  }

  // 3. Kiểm tra ngày sinh
  if (!item.dateOfBirth) {
    warnings.push('Chưa có thông tin ngày sinh chính xác (cần bổ sung)');
  }

  // 4. Kiểm tra giới tính
  if (item.gender === 'UNSET') {
    warnings.push('Chưa xác định giới tính (cần kiểm tra)');
  }

  // 5. Kiểm tra bán trú
  if (item.boardingType === 'UNSET') {
    warnings.push('Chưa xác định diện Bán trú / Ngoại trú');
  }

  // Tạo duplicateKey chuẩn: normalizedName + dateOfBirth + classId + schoolYearId
  const normalizedName = removeVietnameseAccents(item.fullName);
  const duplicateKey = `${normalizedName}|${item.dateOfBirth || 'NO_DOB'}|${normalizedClass || item.className}|${schoolYearId}`;

  let status: ValidationStatus = 'VALID';
  if (errors.length > 0) {
    if (errors.some(e => e.includes('không thuộc 20 lớp'))) {
      status = 'INVALID_CLASS';
    } else {
      status = 'ERROR';
    }
  } else if (item.boardingType === 'UNSET') {
    status = 'UNSET_BOARDING';
  } else if (warnings.length > 0) {
    status = 'WARNING';
  }

  return { status, errors, warnings, duplicateKey };
}
