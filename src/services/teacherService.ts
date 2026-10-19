import * as XLSX from 'xlsx';
import { Teacher, EmploymentStatus, AccountStatus, UserRole } from '../types';
import { storageService, STORAGE_KEYS } from './storageService';
import { OFFICIAL_CLASS_NAMES } from './studentValidationService';

const TEACHERS_STORAGE_KEY = 'thcs_banbo_v2_teachers';

export class TeacherService {
  /**
   * Khởi tạo danh sách giáo viên từ 20 GVCN hiện tại của Trường THCS Bản Bo nếu chưa có
   */
  public getTeachers(): Teacher[] {
    try {
      const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
      if (raw) {
        const list: Teacher[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch {
      // Bỏ qua
    }

    // Nếu chưa có, đồng bộ khởi tạo từ danh sách 20 lớp và user của trường
    const initialTeachers = this.generateInitialTeachers();
    this.saveTeachers(initialTeachers);
    return initialTeachers;
  }

  public saveTeachers(teachers: Teacher[]) {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
  }

  public getTeacherById(id: string): Teacher | undefined {
    return this.getTeachers().find(t => t.id === id);
  }

  public getTeacherByEmail(email: string): Teacher | undefined {
    const clean = email.trim().toLowerCase();
    return this.getTeachers().find(t => t.email.toLowerCase() === clean);
  }

  public getTeacherByClass(classIdOrName: string): Teacher | undefined {
    const clean = classIdOrName.trim().toUpperCase();
    return this.getTeachers().find(
      t =>
        t.employmentStatus === 'ACTIVE' &&
        (t.assignedClassId === classIdOrName ||
          t.assignedClassName === clean ||
          t.assignedClassId === `cls_${clean.toLowerCase()}`)
    );
  }

  /**
   * Thêm giáo viên mới
   */
  public createTeacher(
    data: {
      fullName: string;
      teacherCode?: string;
      email: string;
      phone: string;
      role: UserRole;
      assignedClassId?: string;
      employmentStatus?: EmploymentStatus;
      notes?: string;
    },
    performedById: string,
    performedByName: string
  ): { success: boolean; teacher?: Teacher; message: string } {
    const trimmedName = data.fullName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      return { success: false, message: 'Họ và tên giáo viên không được để trống (tối thiểu 3 ký tự).' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Địa chỉ email không đúng định dạng hợp lệ.' };
    }

    const teachers = this.getTeachers();

    // Kiểm tra trùng email
    if (teachers.some(t => t.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email ${cleanEmail} đã tồn tại trong danh sách giáo viên.` };
    }

    // Kiểm tra lớp chủ nhiệm: 1 giáo viên chỉ chủ nhiệm 1 lớp, 1 lớp chỉ có 1 GVCN chính
    let assignedClassName = '';
    if (data.assignedClassId) {
      const cls = storageService.getClasses().find(
        c => c.id === data.assignedClassId || c.name === data.assignedClassId
      );
      if (cls) {
        assignedClassName = cls.name;
        // Kiểm tra xem lớp đã có GVCN chưa
        const existingClassTeacher = teachers.find(
          t => t.employmentStatus === 'ACTIVE' && (t.assignedClassId === cls.id || t.assignedClassName === cls.name)
        );
        if (existingClassTeacher) {
          return {
            success: false,
            message: `Lớp ${cls.name} hiện đã có GVCN là thầy/cô ${existingClassTeacher.fullName}. Vui lòng chuyển sang chức năng "Thay đổi GVCN" để phân công lại.`,
          };
        }
      }
    }

    const newId = `tch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const teacherCode = data.teacherCode?.trim() || `GV-${String(teachers.length + 1).padStart(2, '0')}`;

    const newTeacher: Teacher = {
      id: newId,
      teacherCode,
      fullName: trimmedName,
      email: cleanEmail,
      phone: data.phone.trim(),
      role: data.role,
      assignedClassId: data.assignedClassId || undefined,
      assignedClassName: assignedClassName || undefined,
      schoolYearId: '2026-2027',
      employmentStatus: data.employmentStatus || 'ACTIVE',
      accountStatus: 'NOT_CREATED',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: performedByName,
    };

    teachers.push(newTeacher);
    this.saveTeachers(teachers);

    // Ghi audit log
    storageService.saveAuditLog({
      id: `log_tch_create_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CREATE_TEACHER',
      entity: 'teacher',
      entityId: newId,
      targetTeacherId: newId,
      description: `Thêm mới hồ sơ giáo viên: ${newTeacher.fullName} (${newTeacher.teacherCode}), phân công: ${newTeacher.assignedClassName || 'Chưa phân lớp'}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      newValue: JSON.stringify({ fullName: newTeacher.fullName, email: newTeacher.email, role: newTeacher.role }),
    });

    return { success: true, teacher: newTeacher, message: `Thêm giáo viên ${newTeacher.fullName} thành công!` };
  }

  /**
   * Cập nhật thông tin hồ sơ giáo viên
   */
  public updateTeacher(
    id: string,
    updates: Partial<Teacher>,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex(t => t.id === id);
    if (idx === -1) {
      return { success: false, message: 'Không tìm thấy hồ sơ giáo viên cần sửa.' };
    }

    const current = teachers[idx];

    // Nếu sửa email, kiểm tra email mới có bị trùng không
    if (updates.email) {
      const cleanEmail = updates.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, message: 'Địa chỉ email không đúng định dạng.' };
      }
      if (teachers.some(t => t.id !== id && t.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: `Email ${cleanEmail} đã được sử dụng bởi giáo viên khác.` };
      }
      updates.email = cleanEmail;
    }

    const updated: Teacher = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    teachers[idx] = updated;
    this.saveTeachers(teachers);

    // Đồng bộ sang bảng User nếu giáo viên này đã có tài khoản
    const users = storageService.getUsers();
    const uIdx = users.findIndex(u => u.teacherId === id || (u.email && u.email.toLowerCase() === current.email.toLowerCase()));
    if (uIdx !== -1) {
      users[uIdx] = {
        ...users[uIdx],
        name: updated.fullName,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        assignedClassId: updated.assignedClassId,
        assignedClassName: updated.assignedClassName,
        employmentStatus: updated.employmentStatus,
        updatedAt: new Date().toISOString(),
      };
      storageService.saveUser(users[uIdx]);
    }

    storageService.saveAuditLog({
      id: `log_tch_update_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'UPDATE_TEACHER',
      entity: 'teacher',
      entityId: id,
      targetTeacherId: id,
      description: `Cập nhật thông tin hồ sơ giáo viên ${updated.fullName}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      oldValue: JSON.stringify({ fullName: current.fullName, email: current.email, role: current.role }),
      newValue: JSON.stringify({ fullName: updated.fullName, email: updated.email, role: updated.role }),
    });

    return { success: true, message: `Cập nhật thông tin giáo viên ${updated.fullName} thành công!` };
  }

  /**
   * Thay đổi trạng thái công tác (ACTIVE | TEMPORARILY_INACTIVE | LEFT)
   * Không xóa hồ sơ giáo viên nếu đã có lịch sử
   */
  public setEmploymentStatus(
    id: string,
    status: EmploymentStatus,
    reason: string,
    performedById: string,
    performedByName: string
  ): { success: boolean; message: string } {
    const teachers = this.getTeachers();
    const target = teachers.find(t => t.id === id);
    if (!target) return { success: false, message: 'Không tìm thấy giáo viên.' };

    const oldStatus = target.employmentStatus;
    target.employmentStatus = status;
    target.updatedAt = new Date().toISOString();

    // Nếu giáo viên nghỉ công tác hoặc tạm ngừng, hủy phân công chủ nhiệm hiện tại để nhường cho GV khác
    if (status !== 'ACTIVE' && target.assignedClassId) {
      const oldClass = target.assignedClassName || target.assignedClassId;
      target.assignedClassId = undefined;
      target.assignedClassName = undefined;

      // Cập nhật bảng lớp
      const classes = storageService.getClasses();
      const c = classes.find(cls => cls.name === oldClass || cls.id === target.assignedClassId);
      if (c) {
        c.teacherId = '';
        c.teacherName = 'Chưa phân công';
        c.teacherPhone = '';
        storageService.saveClass(c);
      }
    }

    this.saveTeachers(teachers);

    storageService.saveAuditLog({
      id: `log_emp_status_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'UPDATE_TEACHER',
      entity: 'teacher',
      entityId: id,
      targetTeacherId: id,
      description: `Thay đổi trạng thái công tác giáo viên ${target.fullName}: từ ${oldStatus} sang ${status}. Lý do: ${reason || 'Không ghi'}`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
      reason,
      oldValue: oldStatus,
      newValue: status,
    });

    return { success: true, message: `Đã cập nhật trạng thái công tác của thầy/cô ${target.fullName}.` };
  }

  /**
   * Tải file Excel mẫu danh sách 20 GVCN cho Trường THCS Bản Bo
   */
  public downloadSampleTemplate() {
    const sampleRows = [
      {
        'STT': 1,
        'Mã giáo viên': 'GV6A1',
        'Họ và tên': 'Nguyễn Văn An',
        'Email': 'nguyenvanan@thcsbanbo.edu.vn',
        'Số điện thoại': '0982 123 456',
        'Lớp chủ nhiệm': '6A1',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 2,
        'Mã giáo viên': 'GV6A2',
        'Họ và tên': 'Lò Thị Mai',
        'Email': 'lothimai@thcsbanbo.edu.vn',
        'Số điện thoại': '0984 234 567',
        'Lớp chủ nhiệm': '6A2',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 3,
        'Mã giáo viên': 'GV6A3',
        'Họ và tên': 'Trần Thị Thu',
        'Email': 'tranthithu@thcsbanbo.edu.vn',
        'Số điện thoại': '0981 345 678',
        'Lớp chủ nhiệm': '6A3',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 4,
        'Mã giáo viên': 'GV6A4',
        'Họ và tên': 'Hoàng Văn Bình',
        'Email': 'hoangvanbinh@thcsbanbo.edu.vn',
        'Số điện thoại': '0983 456 789',
        'Lớp chủ nhiệm': '6A4',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 5,
        'Mã giáo viên': 'GV6A5',
        'Họ và tên': 'Điêu Văn Tiến',
        'Email': 'dieuventien@thcsbanbo.edu.vn',
        'Số điện thoại': '0985 567 890',
        'Lớp chủ nhiệm': '6A5',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 6,
        'Mã giáo viên': 'GV7A1',
        'Họ và tên': 'Trần Quốc Hưng',
        'Email': 'tranquochung@thcsbanbo.edu.vn',
        'Số điện thoại': '0973 345 678',
        'Lớp chủ nhiệm': '7A1',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 7,
        'Mã giáo viên': 'GV7A2',
        'Họ và tên': 'Hoàng Thị Lan',
        'Email': 'hoangthilan@thcsbanbo.edu.vn',
        'Số điện thoại': '0912 456 789',
        'Lớp chủ nhiệm': '7A2',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 8,
        'Mã giáo viên': 'GV7A3',
        'Họ và tên': 'Lò Văn Chiến',
        'Email': 'lovanchien@thcsbanbo.edu.vn',
        'Số điện thoại': '0971 678 901',
        'Lớp chủ nhiệm': '7A3',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 9,
        'Mã giáo viên': 'GV7A4',
        'Họ và tên': 'Nông Thị Thảo',
        'Email': 'nongthithao@thcsbanbo.edu.vn',
        'Số điện thoại': '0914 789 012',
        'Lớp chủ nhiệm': '7A4',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 10,
        'Mã giáo viên': 'GV7A5',
        'Họ và tên': 'Đèo Văn Nam',
        'Email': 'deovannam@thcsbanbo.edu.vn',
        'Số điện thoại': '0975 890 123',
        'Lớp chủ nhiệm': '7A5',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 11,
        'Mã giáo viên': 'GV8A1',
        'Họ và tên': 'Vàng A Tủa',
        'Email': 'vangatua@thcsbanbo.edu.vn',
        'Số điện thoại': '0965 567 890',
        'Lớp chủ nhiệm': '8A1',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 12,
        'Mã giáo viên': 'GV8A2',
        'Họ và tên': 'Lê Thị Hồng',
        'Email': 'lethihong@thcsbanbo.edu.vn',
        'Số điện thoại': '0986 678 901',
        'Lớp chủ nhiệm': '8A2',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 13,
        'Mã giáo viên': 'GV8A3',
        'Họ và tên': 'Lý A Sùng',
        'Email': 'lyasung@thcsbanbo.edu.vn',
        'Số điện thoại': '0963 901 234',
        'Lớp chủ nhiệm': '8A3',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 14,
        'Mã giáo viên': 'GV8A4',
        'Họ và tên': 'Nguyễn Thị Ngọc',
        'Email': 'nguyenthingoc@thcsbanbo.edu.vn',
        'Số điện thoại': '0987 012 345',
        'Lớp chủ nhiệm': '8A4',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 15,
        'Mã giáo viên': 'GV8A5',
        'Họ và tên': 'Hà Văn Dũng',
        'Email': 'havandung@thcsbanbo.edu.vn',
        'Số điện thoại': '0968 123 456',
        'Lớp chủ nhiệm': '8A5',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 16,
        'Mã giáo viên': 'GV9A1',
        'Họ và tên': 'Đặng Minh Tuấn',
        'Email': 'dangminhtuan@thcsbanbo.edu.vn',
        'Số điện thoại': '0977 789 012',
        'Lớp chủ nhiệm': '9A1',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 17,
        'Mã giáo viên': 'GV9A2',
        'Họ và tên': 'Nùng Thị Hoa',
        'Email': 'nungthihoa@thcsbanbo.edu.vn',
        'Số điện thoại': '0918 890 123',
        'Lớp chủ nhiệm': '9A2',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 18,
        'Mã giáo viên': 'GV9A3',
        'Họ và tên': 'Vũ Đình Trọng',
        'Email': 'vudinhtrong@thcsbanbo.edu.vn',
        'Số điện thoại': '0978 234 567',
        'Lớp chủ nhiệm': '9A3',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 19,
        'Mã giáo viên': 'GV9A4',
        'Họ và tên': 'Mai Thị Hằng',
        'Email': 'maithihang@thcsbanbo.edu.vn',
        'Số điện thoại': '0988 345 678',
        'Lớp chủ nhiệm': '9A4',
        'Vai trò': 'HEAD_TEACHER',
      },
      {
        'STT': 20,
        'Mã giáo viên': 'GV9A5',
        'Họ và tên': 'Tạ Văn Quyết',
        'Email': 'tavanquyet@thcsbanbo.edu.vn',
        'Số điện thoại': '0919 456 789',
        'Lớp chủ nhiệm': '9A5',
        'Vai trò': 'HEAD_TEACHER',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 22 },
      { wch: 32 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, 'DS_GVCN_20_LOP');
    XLSX.writeFile(wb, 'Mau_Danh_Sach_GVCN_THCS_Ban_Bo_2026_2027.xlsx');
  }

  /**
   * Import danh sách giáo viên từ file Excel
   */
  public importTeachersFromExcel(
    rows: any[],
    performedById: string,
    performedByName: string
  ): {
    success: boolean;
    importedCount: number;
    errors: string[];
    duplicateEmails: string[];
    duplicateClasses: string[];
    parsedTeachers: Teacher[];
  } {
    const errors: string[] = [];
    const duplicateEmails: string[] = [];
    const duplicateClasses: string[] = [];
    const parsedTeachers: Teacher[] = [];

    const existingTeachers = this.getTeachers();
    const seenEmails = new Set(existingTeachers.map(t => t.email.toLowerCase()));
    const classAssignedMap = new Map<string, string>(); // className -> teacherName

    existingTeachers.forEach(t => {
      if (t.employmentStatus === 'ACTIVE' && t.assignedClassName) {
        classAssignedMap.set(t.assignedClassName.toUpperCase(), t.fullName);
      }
    });

    rows.forEach((row, idx) => {
      const rowIdx = idx + 2;
      const fullName = (row['Họ và tên'] || row['Họ tên'] || row['Ho va ten'] || row['fullName'] || '').toString().trim();
      if (!fullName) {
        errors.push(`Dòng ${rowIdx}: Thiếu họ và tên giáo viên.`);
        return;
      }

      const rawEmail = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
      if (!rawEmail) {
        errors.push(`Dòng ${rowIdx} (${fullName}): Thiếu email đăng nhập.`);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        errors.push(`Dòng ${rowIdx} (${fullName}): Email "${rawEmail}" không hợp lệ.`);
        return;
      }

      if (seenEmails.has(rawEmail)) {
        duplicateEmails.push(`Dòng ${rowIdx}: Email "${rawEmail}" bị trùng lặp.`);
        return;
      }
      seenEmails.add(rawEmail);

      const phone = (row['Số điện thoại'] || row['SDT'] || row['phone'] || '').toString().trim();
      const rawClass = (row['Lớp chủ nhiệm'] || row['Lớp'] || row['className'] || '').toString().trim().toUpperCase();
      let assignedClassId: string | undefined = undefined;
      let assignedClassName: string | undefined = undefined;

      if (rawClass) {
        if (OFFICIAL_CLASS_NAMES.includes(rawClass)) {
          if (classAssignedMap.has(rawClass)) {
            duplicateClasses.push(
              `Dòng ${rowIdx}: Lớp ${rawClass} đã được phân công cho thầy/cô ${classAssignedMap.get(rawClass)}.`
            );
          } else {
            assignedClassName = rawClass;
            assignedClassId = `cls_${rawClass.toLowerCase()}`;
            classAssignedMap.set(rawClass, fullName);
          }
        } else {
          errors.push(`Dòng ${rowIdx} (${fullName}): Lớp "${rawClass}" không thuộc 20 lớp chính thức của trường.`);
        }
      }

      const teacherCode = (row['Mã giáo viên'] || row['Mã GV'] || row['teacherCode'] || `GV-${String(idx + 1).padStart(2, '0')}`).toString().trim();
      const rawRole = (row['Vai trò'] || row['role'] || 'HEAD_TEACHER').toString().trim();
      const role: UserRole = rawRole.toUpperCase() === 'ADMIN' ? 'ADMIN' : rawRole.toUpperCase() === 'BOARD_OF_MANAGEMENT' ? 'BOARD_OF_MANAGEMENT' : 'HEAD_TEACHER';

      parsedTeachers.push({
        id: `tch_imp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        teacherCode,
        fullName,
        email: rawEmail,
        phone,
        role,
        assignedClassId,
        assignedClassName,
        schoolYearId: '2026-2027',
        employmentStatus: 'ACTIVE',
        accountStatus: 'NOT_CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: performedByName,
      });
    });

    if (errors.length > 0 || duplicateEmails.length > 0 || duplicateClasses.length > 0) {
      return {
        success: false,
        importedCount: 0,
        errors,
        duplicateEmails,
        duplicateClasses,
        parsedTeachers,
      };
    }

    // Lưu vào database
    const merged = [...existingTeachers, ...parsedTeachers];
    this.saveTeachers(merged);

    // Đồng bộ vào classes nếu có phân công
    const classes = storageService.getClasses();
    parsedTeachers.forEach(pt => {
      if (pt.assignedClassName) {
        const cls = classes.find(c => c.name === pt.assignedClassName);
        if (cls) {
          cls.teacherId = pt.id;
          cls.teacherName = pt.fullName;
          cls.teacherPhone = pt.phone;
          storageService.saveClass(cls);
        }
      }
    });

    storageService.saveAuditLog({
      id: `log_tch_import_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: performedById,
      userName: performedByName,
      action: 'CREATE_TEACHER',
      entity: 'teacher',
      entityId: 'excel_import',
      description: `Nhập thành công ${parsedTeachers.length} hồ sơ giáo viên từ file Excel.`,
      performedBy: performedByName,
      performedAt: new Date().toISOString(),
    });

    return {
      success: true,
      importedCount: parsedTeachers.length,
      errors: [],
      duplicateEmails: [],
      duplicateClasses: [],
      parsedTeachers,
    };
  }

  /**
   * Khởi tạo danh sách 22 giáo viên & cán bộ của THCS Bản Bo nếu kho dữ liệu rỗng
   */
  private generateInitialTeachers(): Teacher[] {
    const rawUsers = storageService.getUsers();
    const result: Teacher[] = [];

    // Thêm Thầy/Cô Vũ Hồng Phương (Admin / Quản trị viên)
    result.push({
      id: 'tch_vuhongphuong',
      teacherCode: 'CB-ADMIN',
      fullName: 'Vũ Hồng Phương',
      email: 'vuhongphuongthcsbanbo@gmail.com',
      phone: '0988 567 899',
      role: 'ADMIN',
      schoolYearId: '2026-2027',
      employmentStatus: 'ACTIVE',
      accountStatus: 'ACTIVE',
      authUid: 'auth_user_vuhongphuong',
      notes: 'Quản trị viên hệ thống - Trường THCS Bản Bo',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
      createdBy: 'Hệ thống THCS Bản Bo',
    });

    // Thêm BGH & TPT
    result.push({
      id: 'tch_tpt',
      teacherCode: 'CB-TPT',
      fullName: 'Phạm Ngọc Thúy',
      email: 'phamngocthuy@thcsbanbo.edu.vn',
      phone: '0989 123 888',
      role: 'ADMIN',
      schoolYearId: '2026-2027',
      employmentStatus: 'ACTIVE',
      accountStatus: 'ACTIVE',
      authUid: 'auth_user_tpt',
      notes: 'Tổng Phụ trách Đội - Quản trị viên hệ thống',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
      createdBy: 'Hệ thống THCS Bản Bo',
    });

    result.push({
      id: 'tch_bgh',
      teacherCode: 'CB-BGH',
      fullName: 'Hoàng Xuân Nhật',
      email: 'hoangxuannhat@thcsbanbo.edu.vn',
      phone: '0912 345 678',
      role: 'BOARD_OF_MANAGEMENT',
      schoolYearId: '2026-2027',
      employmentStatus: 'ACTIVE',
      accountStatus: 'ACTIVE',
      authUid: 'auth_user_bgh',
      notes: 'Hiệu trưởng Trường THCS Bản Bo',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
      createdBy: 'Hệ thống THCS Bản Bo',
    });

    // 20 GVCN cho 20 lớp chính thức
    const teacherDefaults = [
      { code: 'GV6A1', name: 'Nguyễn Văn An', email: 'nguyenvanan@thcsbanbo.edu.vn', phone: '0982 123 456', class: '6A1' },
      { code: 'GV6A2', name: 'Lò Thị Mai', email: 'lothimai@thcsbanbo.edu.vn', phone: '0984 234 567', class: '6A2' },
      { code: 'GV6A3', name: 'Trần Thị Thu', email: 'tranthithu@thcsbanbo.edu.vn', phone: '0981 345 678', class: '6A3' },
      { code: 'GV6A4', name: 'Hoàng Văn Bình', email: 'hoangvanbinh@thcsbanbo.edu.vn', phone: '0983 456 789', class: '6A4' },
      { code: 'GV6A5', name: 'Điêu Văn Tiến', email: 'dieuvantien@thcsbanbo.edu.vn', phone: '0985 567 890', class: '6A5' },
      { code: 'GV7A1', name: 'Trần Quốc Hưng', email: 'tranquochung@thcsbanbo.edu.vn', phone: '0973 345 678', class: '7A1' },
      { code: 'GV7A2', name: 'Hoàng Thị Lan', email: 'hoangthilan@thcsbanbo.edu.vn', phone: '0912 456 789', class: '7A2' },
      { code: 'GV7A3', name: 'Lò Văn Chiến', email: 'lovanchien@thcsbanbo.edu.vn', phone: '0971 678 901', class: '7A3' },
      { code: 'GV7A4', name: 'Nông Thị Thảo', email: 'nongthithao@thcsbanbo.edu.vn', phone: '0914 789 012', class: '7A4' },
      { code: 'GV7A5', name: 'Đèo Văn Nam', email: 'deovannam@thcsbanbo.edu.vn', phone: '0975 890 123', class: '7A5' },
      { code: 'GV8A1', name: 'Vàng A Tủa', email: 'vangatua@thcsbanbo.edu.vn', phone: '0965 567 890', class: '8A1' },
      { code: 'GV8A2', name: 'Lê Thị Hồng', email: 'lethihong@thcsbanbo.edu.vn', phone: '0986 678 901', class: '8A2' },
      { code: 'GV8A3', name: 'Lý A Sùng', email: 'lyasung@thcsbanbo.edu.vn', phone: '0963 901 234', class: '8A3' },
      { code: 'GV8A4', name: 'Nguyễn Thị Ngọc', email: 'nguyenthingoc@thcsbanbo.edu.vn', phone: '0987 012 345', class: '8A4' },
      { code: 'GV8A5', name: 'Hà Văn Dũng', email: 'havandung@thcsbanbo.edu.vn', phone: '0968 123 456', class: '8A5' },
      { code: 'GV9A1', name: 'Đặng Minh Tuấn', email: 'dangminhtuan@thcsbanbo.edu.vn', phone: '0977 789 012', class: '9A1' },
      { code: 'GV9A2', name: 'Nùng Thị Hoa', email: 'nungthihoa@thcsbanbo.edu.vn', phone: '0918 890 123', class: '9A2' },
      { code: 'GV9A3', name: 'Vũ Đình Trọng', email: 'vudinhtrong@thcsbanbo.edu.vn', phone: '0978 234 567', class: '9A3' },
      { code: 'GV9A4', name: 'Mai Thị Hằng', email: 'maithihang@thcsbanbo.edu.vn', phone: '0988 345 678', class: '9A4' },
      { code: 'GV9A5', name: 'Tạ Văn Quyết', email: 'tavanquyet@thcsbanbo.edu.vn', phone: '0919 456 789', class: '9A5' },
    ];

    teacherDefaults.forEach((tDef, idx) => {
      const existingUser = rawUsers.find(u => u.email.toLowerCase() === tDef.email.toLowerCase());
      result.push({
        id: `tch_${tDef.class.toLowerCase()}`,
        teacherCode: tDef.code,
        fullName: tDef.name,
        email: tDef.email.toLowerCase(),
        phone: tDef.phone,
        role: 'HEAD_TEACHER',
        assignedClassId: `cls_${tDef.class.toLowerCase()}`,
        assignedClassName: tDef.class,
        schoolYearId: '2026-2027',
        employmentStatus: 'ACTIVE',
        accountStatus: existingUser?.isActive ? 'ACTIVE' : 'NOT_CREATED',
        authUid: existingUser ? `auth_${existingUser.id}` : undefined,
        createdAt: '2026-08-15T00:00:00.000Z',
        updatedAt: '2026-08-15T00:00:00.000Z',
        createdBy: 'Phạm Ngọc Thúy',
      });
    });

    return result;
  }
}

export const teacherService = new TeacherService();
