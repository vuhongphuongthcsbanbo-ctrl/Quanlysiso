import React, { useState, useMemo } from 'react';
import {
  ParsedStudentItem,
  ValidationStatus,
  OFFICIAL_CLASS_NAMES,
} from '../../services/studentValidationService';
import {
  ClassStudentBreakdown,
  excelImportService,
} from '../../services/excelImportService';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  Filter,
  Search,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface ImportPreviewStepProps {
  items: ParsedStudentItem[];
  classBreakdowns: ClassStudentBreakdown[];
  onUpdateItem: (updated: ParsedStudentItem) => void;
  onBack: () => void;
  onProceedToConfirmation: () => void;
}

export const ImportPreviewStep: React.FC<ImportPreviewStepProps> = ({
  items,
  classBreakdowns,
  onUpdateItem,
  onBack,
  onProceedToConfirmation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ParsedStudentItem>>({});

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Thống kê tổng
  const totalCount = items.length;
  const validCount = items.filter(it => it.status === 'VALID').length;
  const warningCount = items.filter(it => it.status === 'WARNING').length;
  const errorCount = items.filter(
    it => it.status === 'ERROR' || it.status === 'INVALID_CLASS' || it.status === 'INVALID_DOB'
  ).length;
  const duplicateCount = items.filter(it => it.status === 'DUPLICATE').length;
  const unsetBoardingCount = items.filter(it => it.boardingType === 'UNSET').length;

  // Lọc
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      // Tìm kiếm
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = it.fullName.toLowerCase().includes(q);
        const matchClass = it.className.toLowerCase().includes(q);
        const matchDob = it.displayDob.includes(q);
        if (!matchName && !matchClass && !matchDob) return false;
      }

      // Lọc trạng thái
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ERROR' && it.status !== 'ERROR' && it.status !== 'INVALID_CLASS' && it.status !== 'INVALID_DOB') {
          return false;
        }
        if (statusFilter === 'UNSET_BOARDING' && it.boardingType !== 'UNSET') {
          return false;
        }
        if (statusFilter !== 'ERROR' && statusFilter !== 'UNSET_BOARDING' && it.status !== statusFilter) {
          return false;
        }
      }

      // Lọc Khối
      if (gradeFilter !== 'ALL') {
        if (String(it.grade) !== gradeFilter) return false;
      }

      // Lọc Lớp
      if (classFilter !== 'ALL') {
        if (it.className !== classFilter) return false;
      }

      return true;
    });
  }, [items, searchTerm, statusFilter, gradeFilter, classFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const currentPagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Bắt đầu sửa nhanh
  const handleStartEdit = (item: ParsedStudentItem) => {
    setEditingItemId(item.tempId);
    setEditFormData({
      fullName: item.fullName,
      className: item.className,
      displayDob: item.displayDob,
      dateOfBirth: item.dateOfBirth,
      gender: item.gender,
      boardingType: item.boardingType,
    });
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = (originalItem: ParsedStudentItem) => {
    const updated: ParsedStudentItem = {
      ...originalItem,
      fullName: editFormData.fullName || originalItem.fullName,
      className: editFormData.className || originalItem.className,
      displayDob: editFormData.displayDob || originalItem.displayDob,
      dateOfBirth: editFormData.dateOfBirth || originalItem.dateOfBirth,
      gender: (editFormData.gender as any) || originalItem.gender,
      boardingType: (editFormData.boardingType as any) || originalItem.boardingType,
      isModifiedByUser: true,
      status: 'VALID',
      errors: [],
      warnings: ['Đã chỉnh sửa so với file gốc'],
    };
    onUpdateItem(updated);
    setEditingItemId(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đọc Được</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">học sinh</div>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hợp Lệ</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{validCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">sẵn sàng nhập</div>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Cần Kiểm Tra</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{warningCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">cảnh báo nhỏ</div>
        </div>

        <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 shadow-xs">
          <div className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Có Lỗi</span>
          </div>
          <div className="text-2xl font-black text-red-700 mt-1">{errorCount}</div>
          <div className="text-[11px] text-red-600 mt-0.5">thiếu tên/ngày/lớp</div>
        </div>

        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
            <Copy className="w-3.5 h-3.5 text-purple-600" />
            <span>Nghi Trùng</span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{duplicateCount}</div>
          <div className="text-[11px] text-purple-600 mt-0.5">cần đối soát</div>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Chưa Bán Trú</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{unsetBoardingCount}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">sẽ thiết lập sau</div>
        </div>
      </div>

      {/* Class by Class Breakdown Accordion / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Sĩ số phát hiện theo 20 lớp chính thức (Khối 6, 7, 8, 9):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {classBreakdowns.map(cb => (
            <div
              key={cb.classCode}
              onClick={() => setClassFilter(classFilter === cb.classCode ? 'ALL' : cb.classCode)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                classFilter === cb.classCode
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                  : cb.totalStudents > 0
                  ? 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  : 'bg-red-50/50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-800">{cb.classCode}</span>
                <span className={cb.totalStudents > 0 ? 'text-blue-600' : 'text-red-500'}>
                  {cb.totalStudents} HS
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>BT: {cb.boardingCount}</span>
                <span>NT: {cb.nonBoardingCount}</span>
                {cb.unsetBoardingCount > 0 && <span className="text-amber-600 font-bold">?: {cb.unsetBoardingCount}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table & Filtering Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm học sinh, ngày sinh, lớp..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VALID">Hợp lệ ({validCount})</option>
              <option value="WARNING">Cần kiểm tra ({warningCount})</option>
              <option value="ERROR">Có lỗi ({errorCount})</option>
              <option value="DUPLICATE">Nghi trùng ({duplicateCount})</option>
              <option value="UNSET_BOARDING">Chưa xác định bán trú ({unsetBoardingCount})</option>
            </select>

            {/* Filter by Grade */}
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">Tất cả Khối</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>

            {/* Filter by Class */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">Tất cả 20 Lớp</option>
              {OFFICIAL_CLASS_NAMES.map(c => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <button
                onClick={() => excelImportService.exportErrorItemsToExcel(items)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất DS cần kiểm tra ({errorCount})</span>
              </button>
            )}

            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            <button
              onClick={onProceedToConfirmation}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>Xác nhận nhập ({validCount + warningCount + unsetBoardingCount} HS)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold w-12 text-center">STT</th>
                <th className="p-3 font-bold">Họ và tên</th>
                <th className="p-3 font-bold">Ngày sinh</th>
                <th className="p-3 font-bold">Giới tính</th>
                <th className="p-3 font-bold">Lớp</th>
                <th className="p-3 font-bold">Bán trú / Ngoại trú</th>
                <th className="p-3 font-bold">Dân tộc</th>
                <th className="p-3 font-bold">Trạng thái kiểm tra</th>
                <th className="p-3 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPagedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                currentPagedItems.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isEditing = editingItemId === item.tempId;

                  return (
                    <tr
                      key={item.tempId}
                      className={`hover:bg-slate-50/70 ${
                        item.status === 'ERROR' || item.status === 'INVALID_CLASS' || item.status === 'INVALID_DOB'
                          ? 'bg-red-50/30'
                          : item.status === 'DUPLICATE'
                          ? 'bg-purple-50/30'
                          : item.status === 'WARNING'
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      <td className="p-3 text-center text-slate-500 font-mono">{globalIdx}</td>

                      {/* Họ tên */}
                      <td className="p-3 font-semibold text-slate-800">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.fullName || ''}
                            onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                            className="w-full p-1 border rounded text-xs bg-white"
                          />
                        ) : (
                          <div>
                            <span>{item.fullName}</span>
                            {item.isModifiedByUser && (
                              <span className="ml-1.5 text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-normal">
                                Đã sửa
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Ngày sinh */}
                      <td className="p-3 text-slate-600 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.displayDob || ''}
                            onChange={e =>
                              setEditFormData({
                                ...editFormData,
                                displayDob: e.target.value,
                                dateOfBirth: e.target.value,
                              })
                            }
                            placeholder="dd/mm/yyyy"
                            className="w-24 p-1 border rounded text-xs bg-white"
                          />
                        ) : (
                          item.displayDob || <span className="text-red-500 font-semibold">Chưa có</span>
                        )}
                      </td>

                      {/* Giới tính */}
                      <td className="p-3 text-slate-600">
                        {isEditing ? (
                          <select
                            value={editFormData.gender || 'UNSET'}
                            onChange={e => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                            className="p-1 border rounded text-xs bg-white"
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="UNSET">Chưa rõ</option>
                          </select>
                        ) : item.gender === 'male' ? (
                          'Nam'
                        ) : item.gender === 'female' ? (
                          'Nữ'
                        ) : (
                          <span className="text-amber-600">Chưa rõ</span>
                        )}
                      </td>

                      {/* Lớp */}
                      <td className="p-3 font-bold text-slate-700">
                        {isEditing ? (
                          <select
                            value={editFormData.className || ''}
                            onChange={e => setEditFormData({ ...editFormData, className: e.target.value })}
                            className="p-1 border rounded text-xs bg-white font-bold"
                          >
                            <option value="">-- Chọn lớp --</option>
                            {OFFICIAL_CLASS_NAMES.map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : item.className ? (
                          item.className
                        ) : (
                          <span className="text-red-500 font-bold">Chưa có</span>
                        )}
                      </td>

                      {/* Bán trú */}
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editFormData.boardingType || 'UNSET'}
                            onChange={e =>
                              setEditFormData({ ...editFormData, boardingType: e.target.value as any })
                            }
                            className="p-1 border rounded text-xs bg-white"
                          >
                            <option value="BOARDING">Bán trú</option>
                            <option value="NON_BOARDING">Ngoại trú</option>
                            <option value="UNSET">Chưa xác định</option>
                          </select>
                        ) : item.boardingType === 'BOARDING' ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                            Bán trú
                          </span>
                        ) : item.boardingType === 'NON_BOARDING' ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                            Ngoại trú
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[11px]">
                            Chưa xác định
                          </span>
                        )}
                      </td>

                      {/* Dân tộc */}
                      <td className="p-3 text-slate-600">{item.ethnicGroup || '—'}</td>

                      {/* Trạng thái kiểm tra */}
                      <td className="p-3">
                        {item.status === 'VALID' ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Hợp lệ</span>
                          </span>
                        ) : item.status === 'DUPLICATE' ? (
                          <span className="flex items-center gap-1 text-purple-700 font-semibold text-[11px]">
                            <Copy className="w-3.5 h-3.5 text-purple-600" />
                            <span>Nghi trùng lặp</span>
                          </span>
                        ) : item.status === 'WARNING' || item.status === 'UNSET_BOARDING' ? (
                          <span className="flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{item.warnings[0] || 'Cần kiểm tra'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-700 font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>{item.errors[0] || 'Lỗi dữ liệu'}</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                              title="Lưu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                              title="Hủy"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa nhanh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredItems.length)} trên {filteredItems.length} dòng
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 border rounded bg-white disabled:opacity-40"
              >
                Trước
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border rounded bg-white disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
