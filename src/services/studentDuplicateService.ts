/**
 * Student Duplicate Detection Service
 * Kiểm tra trùng lặp học sinh thông minh:
 * - Không chỉ kiểm tra tên
 * - Đối soát qua normalizedName + dateOfBirth + classId
 * - Phân biệt trùng họ tên nhưng khác ngày sinh (chỉ cảnh báo)
 * - Tuyệt đối KHÔNG tự xóa học sinh nghi trùng, để ADMIN lựa chọn giữ bản ghi nào
 */

import { ParsedStudentItem, removeVietnameseAccents } from './studentValidationService';
import { Student } from '../types';

export interface DuplicateGroup {
  id: string;
  duplicateKey: string;
  name: string;
  className: string;
  items: ParsedStudentItem[];
  resolution?: 'KEEP_FIRST' | 'KEEP_SECOND' | 'KEEP_ALL' | 'SKIP_ALL';
  selectedItemId?: string; // item được giữ
}

export interface ExistingConflict {
  parsedItem: ParsedStudentItem;
  existingStudent: Student;
  conflictType: 'EXACT_DUPLICATE' | 'SAME_NAME_DIFF_DOB' | 'CLASS_CHANGED';
  resolution?: 'UPDATE_EXISTING' | 'KEEP_EXISTING' | 'CREATE_NEW' | 'SKIP';
}

/**
 * Phát hiện học sinh trùng lặp trong nội bộ file vừa tải lên
 */
export function detectInternalDuplicates(items: ParsedStudentItem[]): {
  duplicateGroups: DuplicateGroup[];
  updatedItems: ParsedStudentItem[];
} {
  const keyMap = new Map<string, ParsedStudentItem[]>();
  const nameMap = new Map<string, ParsedStudentItem[]>();

  items.forEach(item => {
    // 1. Group theo duplicateKey (Tên + Ngày sinh + Lớp)
    if (item.duplicateKey) {
      if (!keyMap.has(item.duplicateKey)) {
        keyMap.set(item.duplicateKey, []);
      }
      keyMap.get(item.duplicateKey)!.push(item);
    }

    // 2. Group theo Tên + Lớp để cảnh báo trùng tên khác ngày sinh
    const nameClassKey = `${item.normalizedName}|${item.className}`;
    if (!nameMap.has(nameClassKey)) {
      nameMap.set(nameClassKey, []);
    }
    nameMap.get(nameClassKey)!.push(item);
  });

  const duplicateGroups: DuplicateGroup[] = [];
  const updatedItems = items.map(item => ({ ...item }));

  // Xử lý trùng hoàn toàn (cùng Tên + Ngày sinh + Lớp)
  keyMap.forEach((groupItems, key) => {
    if (groupItems.length > 1) {
      const groupId = `dup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      duplicateGroups.push({
        id: groupId,
        duplicateKey: key,
        name: groupItems[0].fullName,
        className: groupItems[0].className,
        items: groupItems,
      });

      // Đánh dấu status là DUPLICATE trong danh sách
      groupItems.forEach(gi => {
        const found = updatedItems.find(it => it.tempId === gi.tempId);
        if (found) {
          found.status = 'DUPLICATE';
          found.warnings.push(`Nghi trùng lặp với ${groupItems.length - 1} dòng khác trong file`);
        }
      });
    }
  });

  // Xử lý trùng tên nhưng khác ngày sinh (Chỉ cảnh báo, KHÔNG coi là lỗi)
  nameMap.forEach(groupItems => {
    if (groupItems.length > 1) {
      // Kiểm tra xem có khác ngày sinh không
      const dobs = new Set(groupItems.map(g => g.dateOfBirth));
      if (dobs.size > 1) {
        groupItems.forEach(gi => {
          const found = updatedItems.find(it => it.tempId === gi.tempId);
          if (found && !found.warnings.some(w => w.includes('Cùng họ tên nhưng khác ngày sinh'))) {
            found.warnings.push(`Cùng họ tên nhưng khác ngày sinh với học sinh khác trong lớp ${gi.className}`);
          }
        });
      }
    }
  });

  return { duplicateGroups, updatedItems };
}

/**
 * Đối soát với dữ liệu học sinh hiện có trong cơ sở dữ liệu
 */
export function checkAgainstExistingStudents(
  items: ParsedStudentItem[],
  existingStudents: Student[]
): {
  conflicts: ExistingConflict[];
  newCount: number;
  unchangedCount: number;
  changedCount: number;
} {
  const conflicts: ExistingConflict[] = [];
  let newCount = 0;
  let unchangedCount = 0;
  let changedCount = 0;

  items.forEach(item => {
    // Tìm học sinh theo normalizedName + ngày sinh
    const match = existingStudents.find(
      es => removeVietnameseAccents(es.fullName) === item.normalizedName && es.dateOfBirth === item.dateOfBirth
    );

    if (match) {
      // Kiểm tra xem có thay đổi lớp không
      if (match.className !== item.className) {
        conflicts.push({
          parsedItem: item,
          existingStudent: match,
          conflictType: 'CLASS_CHANGED',
        });
        changedCount++;
      } else {
        // Cùng tên, cùng ngày sinh, cùng lớp -> Trùng hoàn toàn
        conflicts.push({
          parsedItem: item,
          existingStudent: match,
          conflictType: 'EXACT_DUPLICATE',
        });
        unchangedCount++;
      }
    } else {
      // Kiểm tra xem có cùng họ tên nhưng khác ngày sinh trong lớp không
      const nameMatch = existingStudents.find(
        es => removeVietnameseAccents(es.fullName) === item.normalizedName && es.className === item.className
      );
      if (nameMatch) {
        conflicts.push({
          parsedItem: item,
          existingStudent: nameMatch,
          conflictType: 'SAME_NAME_DIFF_DOB',
        });
      }
      newCount++;
    }
  });

  return { conflicts, newCount, unchangedCount, changedCount };
}
