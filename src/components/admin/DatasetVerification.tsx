import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Building,
  Users,
  Trash2,
  Lock,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Sparkles,
  ChevronRight,
  GraduationCap,
  UtensilsCrossed,
  Check,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { excelImportService } from '../../services/excelImportService';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_CLASS_NAMES } from '../../services/studentValidationService';
import { Student } from '../../types';

interface DatasetVerificationProps {
  onDatasetActivated?: () => void;
  onNavigateToImport?: () => void;
  initialStudents?: Student[];
}

export const DatasetVerification: React.FC<DatasetVerificationProps> = ({
  onDatasetActivated,
  onNavigateToImport,
  initialStudents,
}) => {
  const { currentUser } = useAuth();
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // State danh sách học sinh
  const [students, setStudents] = useState<Student[]>(() => {
    if (initialStudents && initialStudents.length > 0) return initialStudents;
    return storageService.getStudents();
  });
  const datasetStatus = excelImportService.getDatasetStatus();
  const stats = useMemo(() => excelImportService.calculateSummaryStats(students), [students]);

  // Tự động cập nhật nếu initialStudents truyền vào thay đổi
  React.useEffect(() => {
    if (initialStudents && initialStudents.length > 0) {
      setStudents(initialStudents);
    }
  }, [initialStudents?.length]);

  // Bộ lọc danh sách học sinh
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [boardingFilter, setBoardingFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 30;

  // Reload data
  const refreshStudents = () => {
    setStudents(storageService.getStudents());
  };

  // Thống kê 4 khối
  const grades = [6, 7, 8, 9].map(g => {
    const gradeStudents = students.filter(s => s.grade === g && s.status === 'active');
    const classes = [1, 2, 3, 4, 5].map(idx => {
      const className = `${g}A${idx}`;
      const clsStudents = gradeStudents.filter(
        s =>
          s.className === className ||
          s.className?.toUpperCase() === className ||
          s.classId === className ||
          s.classId === `cls_${className.toLowerCase()}`
      );
      return {
        name: className,
        total: clsStudents.length,
        boarding: clsStudents.filter(s => s.boardingType === 'BOARDING').length,
        nonBoarding: clsStudents.filter(s => s.boardingType === 'NON_BOARDING').length,
        unset: clsStudents.filter(s => s.boardingType === 'UNSET').length,
      };
    });

    return {
      grade: g,
      total: gradeStudents.length,
      classes,
    };
  });

  // Học sinh sau khi lọc
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (s.fullName || '').toLowerCase().includes(q);
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchClass = (s.className || '').toLowerCase().includes(q);
        const matchAddress = (s.address || '').toLowerCase().includes(q);
        const matchDob = (s.dateOfBirth || '').includes(q);
        if (!matchName && !matchCode && !matchClass && !matchAddress && !matchDob) {
          return false;
        }
      }

      // Khối
      if (selectedGradeFilter !== 'ALL') {
        if (String(s.grade) !== selectedGradeFilter) return false;
      }

      // Lớp
      if (selectedClassFilter !== 'ALL') {
        if (s.className !== selectedClassFilter) return false;
      }

      // Bán trú
      if (boardingFilter !== 'ALL') {
        if (boardingFilter === 'BOARDING' && s.boardingType !== 'BOARDING') return false;
        if (boardingFilter === 'NON_BOARDING' && s.boardingType !== 'NON_BOARDING') return false;
        if (boardingFilter === 'UNSET' && s.boardingType !== 'UNSET') return false;
      }

      return true;
    });
  }, [students, searchTerm, selectedGradeFilter, selectedClassFilter, boardingFilter]);

  // Phân trang
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  // Chọn lớp từ thẻ 4 khối
  const handleSelectClassFromBlock = (className: string, grade: number) => {
    setSelectedGradeFilter(String(grade));
    setSelectedClassFilter(className);
    setCurrentPage(1);
    // Cuộn xuống bảng danh sách học sinh
    const el = document.getElementById('student-table-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Nạp nhanh bộ dữ liệu mẫu 20 lớp
  const handleQuickLoadSample20Classes = () => {
    const res = excelImportService.loadSampleDatasetDirectly(
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );
    refreshStudents();
    setSuccessMessage(`Đã nạp thành công bộ dữ liệu mẫu gồm ${res.count} học sinh cho đủ 20 lớp chính thức! Danh sách đã hiển thị bên dưới, sẵn sàng để kiểm tra và kích hoạt.`);
  };

  // Kích hoạt dữ liệu chính thức
  const handleActivateDataset = () => {
    if (!confirmedCheckbox) {
      setErrorMessage('Vui lòng tích vào ô xác nhận dữ liệu chính thức.');
      return;
    }

    if (!stats.isReadyForActivation || students.length === 0) {
      setErrorMessage(`Chưa thể kích hoạt: ${stats.unreadyReasons.join(', ') || 'Chưa có học sinh nào trong cơ sở dữ liệu'}`);
      return;
    }

    excelImportService.activateStudentDataset(
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    setSuccessMessage(
      'Đã kích hoạt thành công DỮ LIỆU CHÍNH THỨC Năm học 2026–2027! Toàn bộ Dashboard Tổng Phụ Trách và giao diện GVCN đã chuyển sang sử dụng bộ dữ liệu thật này.'
    );

    if (onDatasetActivated) {
      setTimeout(() => {
        onDatasetActivated();
      }, 1200);
    }
  };

  // Xóa demo data an toàn
  const handlePurgeDemo = () => {
    if (purgeConfirmText !== 'XOA DEMO') {
      return;
    }

    const { removedCount } = excelImportService.purgeDemoDataSafely(
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );

    refreshStudents();
    setShowPurgeModal(false);
    setPurgeConfirmText('');
    setSuccessMessage(`Đã xóa an toàn ${removedCount} học sinh demo. Toàn bộ học sinh thật từ file Excel được giữ nguyên.`);
  };

  return (
    <div className="space-y-6">
      {/* Header status bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trường THCS Bản Bo · Năm học 2026–2027
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                datasetStatus === 'ACTIVE_DATASET'
                  ? 'bg-emerald-100 text-emerald-800'
                  : datasetStatus === 'DRAFT_IMPORT'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {datasetStatus === 'ACTIVE_DATASET'
                ? 'DỮ LIỆU CHÍNH THỨC (ĐANG DÙNG)'
                : datasetStatus === 'DRAFT_IMPORT'
                ? 'BẢN NHÁP VỪA NHẬP (CHỜ KÍCH HOẠT)'
                : datasetStatus === 'NO_DATA'
                ? 'CHƯA CÓ DỮ LIỆU HỌC SINH'
                : 'DỮ LIỆU DEMO MẪU'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Kiểm Tra Sĩ Số & Kích Hoạt Bộ Dữ Liệu Toàn Trường
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phạm Ngọc Thúy · Tổng Phụ trách Đội quản lý và phê duyệt
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => excelImportService.downloadSampleTemplate()}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Tải file Excel mẫu gồm 20 lớp chính thức"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Tải Excel Mẫu 20 Lớp</span>
          </button>

          {students.length === 0 && (
            <button
              type="button"
              onClick={handleQuickLoadSample20Classes}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              title="Nạp dữ liệu mẫu 20 lớp để thử nghiệm quy trình"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nạp Thử Dữ Liệu 20 Lớp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Dọn Dữ Liệu Demo</span>
          </button>
        </div>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Banners cảnh báo nếu chưa có học sinh */}
      {students.length === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="max-w-xl mx-auto space-y-1">
            <h3 className="text-base font-bold text-amber-950">
              Hiện tại chưa có danh sách học sinh trong cơ sở dữ liệu
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Dữ liệu học sinh demo đã được làm sạch. Bạn có thể tải lên tệp Excel danh sách học sinh của trường,
              hoặc bấm nút nạp thử bộ dữ liệu mẫu 20 lớp để kiểm tra trước quy trình kích hoạt.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {onNavigateToImport && (
              <button
                type="button"
                onClick={onNavigateToImport}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Tải lên file Excel học sinh (.xls / .xlsx)
              </button>
            )}
            <button
              type="button"
              onClick={handleQuickLoadSample20Classes}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Nạp thử 60 học sinh mẫu (20 lớp) để kiểm tra</span>
            </button>
          </div>
        </div>
      )}

      {/* Thẻ Thống kê 7 chỉ số */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Sĩ Số</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalStudents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.presentClassesCount}/20 lớp có học sinh
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khối 6</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.grade6}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 lớp (6A1-6A5)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khối 7</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.grade7}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 lớp (7A1-7A5)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khối 8</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.grade8}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 lớp (8A1-8A5)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Khối 9</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stats.grade9}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5 lớp (9A1-9A5)</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Bán Trú</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.boardingCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {stats.totalStudents > 0 ? ((stats.boardingCount / stats.totalStudents) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Ngoại Trú</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{stats.nonBoardingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.totalStudents > 0 ? ((stats.nonBoardingCount / stats.totalStudents) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* 4 Khối chính thức (Khối 6, 7, 8, 9) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grades.map(g => (
          <div key={g.grade} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span>KHỐI {g.grade}</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                Tổng: {g.total} học sinh
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {g.classes.map(cls => (
                <div
                  key={cls.name}
                  onClick={() => handleSelectClassFromBlock(cls.name, g.grade)}
                  className="py-2.5 px-2 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs group"
                  title={`Bấm để xem danh sách học sinh lớp ${cls.name}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-slate-800 w-12 group-hover:text-blue-600">
                      {cls.name}
                    </span>
                    <span className="text-slate-500">
                      Bán trú: <strong className="text-emerald-700">{cls.boarding}</strong> · Ngoại trú:{' '}
                      <strong className="text-slate-700">{cls.nonBoarding}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.unset > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Chưa rõ BT: {cls.unset}
                      </span>
                    )}
                    <span className="font-black text-sm text-slate-900">{cls.total} HS</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================
          KHU VỰC QUAN TRỌNG: DANH SÁCH HỌC SINH CHI TIẾT
          (Hiển thị đầy đủ danh sách học sinh để xem xét trước khi kích hoạt)
      ================================================== */}
      <div id="student-table-section" className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Đối Soát Hồ Sơ Trước Khi Kích Hoạt</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              DANH SÁCH HỌC SINH CHI TIẾT ({filteredStudents.length} học sinh)
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số học sinh hiện có trong bộ dữ liệu: {students.length} học sinh
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(selectedGradeFilter !== 'ALL' || selectedClassFilter !== 'ALL' || boardingFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGradeFilter('ALL');
                  setSelectedClassFilter('ALL');
                  setBoardingFilter('ALL');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên, mã HS, ngày sinh..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedGradeFilter}
              onChange={e => {
                setSelectedGradeFilter(e.target.value);
                setSelectedClassFilter('ALL');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Tất cả các khối (Khối 6–9)</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          <div>
            <select
              value={selectedClassFilter}
              onChange={e => {
                setSelectedClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Tất cả 20 lớp chính thức</option>
              {OFFICIAL_CLASS_NAMES.map(cls => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={boardingFilter}
              onChange={e => {
                setBoardingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden"
            >
              <option value="ALL">Tất cả diện học sinh</option>
              <option value="BOARDING">Học sinh Bán trú</option>
              <option value="NON_BOARDING">Học sinh Ngoại trú</option>
              <option value="UNSET">Chưa xác định Bán trú</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách học sinh */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3 w-28">Mã HS</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3 w-24">Ngày sinh</th>
                <th className="p-3 w-20">Giới tính</th>
                <th className="p-3 w-20">Lớp</th>
                <th className="p-3 w-28">Diện học sinh</th>
                <th className="p-3 w-24">Dân tộc</th>
                <th className="p-3">Địa chỉ (Thôn / Bản)</th>
                <th className="p-3 w-28">Nguồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <p className="font-semibold">Không tìm thấy học sinh nào phù hợp với bộ lọc.</p>
                    {students.length === 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Cơ sở dữ liệu học sinh hiện đang trống. Thầy/cô vui lòng nạp dữ liệu từ file Excel hoặc bấm "Nạp Thử Dữ Liệu 20 Lớp".
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((stu, idx) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-bold">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px] font-bold">
                      {stu.code || stu.studentCode || '--'}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{stu.fullName}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{stu.dateOfBirth}</td>
                    <td className="p-3 text-slate-700">
                      {stu.gender === 'female' ? (
                        <span className="text-pink-700 font-bold">Nữ</span>
                      ) : (
                        <span className="text-blue-700 font-bold">Nam</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {stu.className}
                      </span>
                    </td>
                    <td className="p-3">
                      {stu.boardingType === 'BOARDING' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Bán trú
                        </span>
                      ) : stu.boardingType === 'UNSET' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Chưa xác định
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          Ngoại trú
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{stu.ethnicGroup || 'Thái'}</td>
                    <td className="p-3 text-slate-600 truncate max-w-xs">{stu.address || 'Xã Bản Bo'}</td>
                    <td className="p-3 text-[10px] text-slate-500 font-mono">
                      {stu.sourceFileName ? 'Excel' : stu.source || 'Nhập Excel'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {filteredStudents.length > pageSize && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>
              Trang {currentPage} / {totalPages} (Tổng số {filteredStudents.length} học sinh)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          KHU VỰC KÍCH HOẠT DỮ LIỆU CHÍNH THỨC
      ================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>Xác Nhận & Kích Hoạt Dữ Liệu Học Sinh Năm Học 2026–2027</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Sau khi kích hoạt, toàn bộ 20 GVCN sẽ điểm danh trực tiếp trên danh sách này, và Báo cáo Tổng hợp Sáng
            của Tổng Phụ trách sẽ lấy số liệu chính thức từ đây.
          </p>
        </div>

        {/* Trạng thái kiểm tra */}
        {stats.totalStudents === 0 ? (
          <div className="p-3.5 bg-amber-950/70 border border-amber-600/50 rounded-xl text-xs text-amber-300 space-y-1">
            <strong>Chưa thể kích hoạt:</strong>
            <p>Chưa có học sinh nào trong cơ sở dữ liệu. Vui lòng tải file Excel lên hoặc bấm nút nạp dữ liệu mẫu.</p>
          </div>
        ) : stats.missingClassesCount > 0 ? (
          <div className="p-3.5 bg-amber-950/70 border border-amber-600/50 rounded-xl text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-2 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Đã có dữ liệu của {stats.presentClassesCount}/20 lớp ({stats.totalStudents} học sinh).</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Các lớp chưa có học sinh: {stats.missingClasses.join(', ')}. Thầy/cô vẫn có thể kích hoạt trước cho các lớp hiện tại, các lớp còn thiếu sẽ được nạp bổ sung sau.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Đầy đủ 20/20 lớp chính thức ({stats.totalStudents} học sinh).</div>
              <div className="text-[11px] text-emerald-400/80">0 lỗi dữ liệu, 100% học sinh đã phân định Bán trú / Ngoại trú. Sẵn sàng đưa vào vận hành chính thức!</div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={e => setConfirmedCheckbox(e.target.checked)}
              disabled={stats.totalStudents === 0}
              className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-400 cursor-pointer"
            />
            <span>
              Tôi xác nhận danh sách trên là dữ liệu chính thức của Trường THCS Bản Bo năm học 2026–2027.
            </span>
          </label>

          <button
            type="button"
            onClick={handleActivateDataset}
            disabled={!confirmedCheckbox || stats.totalStudents === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
              confirmedCheckbox && stats.totalStudents > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-98'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>KÍCH HOẠT DỮ LIỆU CHÍNH THỨC</span>
          </button>
        </div>
      </div>

      {/* Modal Xóa Demo an toàn */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Xóa Dữ Liệu Demo</h4>
                <p className="text-xs text-slate-500">Bảo toàn dữ liệu thật vừa import</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thao tác này chỉ xóa các bản ghi học sinh ban đầu có <code>isDemo: true</code>. Toàn bộ học sinh
              thật bạn vừa nhập từ file Excel sẽ được bảo toàn nguyên vẹn.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nhập <span className="text-red-600 font-mono">XOA DEMO</span> để xác nhận:
              </label>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={e => setPurgeConfirmText(e.target.value)}
                placeholder="XOA DEMO"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePurgeDemo}
                disabled={purgeConfirmText !== 'XOA DEMO'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Xác nhận xóa demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
