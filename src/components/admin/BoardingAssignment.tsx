import React, { useState } from 'react';
import {
  UtensilsCrossed,
  CheckCircle,
  Save,
  Users,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { excelImportService } from '../../services/excelImportService';
import { useAuth } from '../../context/AuthContext';
import { OFFICIAL_CLASS_NAMES } from '../../services/studentValidationService';
import { Student } from '../../types';

interface BoardingAssignmentProps {
  onCompleted?: () => void;
}

export const BoardingAssignment: React.FC<BoardingAssignmentProps> = ({ onCompleted }) => {
  const { currentUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('6A1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Lấy danh sách học sinh theo lớp
  const allStudents = storageService.getStudents();
  const classStudents = allStudents.filter(
    s =>
      (s.className === selectedClass ||
        s.classId === selectedClass ||
        s.classId === `cls_${selectedClass.toLowerCase()}`) &&
      s.status === 'active'
  );

  // Tổng số học sinh chưa xác định diện bán trú toàn trường
  const unsetCount = allStudents.filter(s => s.boardingType === 'UNSET').length;

  // Khởi tạo set theo những em đã là BOARDING trong lớp khi đổi lớp
  React.useEffect(() => {
    const currentBoarding = new Set(
      classStudents.filter(s => s.boardingType === 'BOARDING').map(s => s.id)
    );
    setSelectedStudentIds(currentBoarding);
    setSaveSuccessMsg('');
  }, [selectedClass, allStudents.length]);

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const handleSelectAllInClass = () => {
    const allIds = new Set(classStudents.map(s => s.id));
    setSelectedStudentIds(allIds);
  };

  const handleDeselectAllInClass = () => {
    setSelectedStudentIds(new Set());
  };

  const handleSaveClassBoarding = () => {
    const boardingArray = Array.from(selectedStudentIds);
    excelImportService.setBoardingForClass(
      selectedClass,
      boardingArray,
      currentUser?.id || 'admin_tpt',
      currentUser?.name || 'Phạm Ngọc Thúy'
    );
    setSaveSuccessMsg(`Đã lưu thành công diện Bán trú cho lớp ${selectedClass}: ${boardingArray.length} Bán trú, ${classStudents.length - boardingArray.length} Ngoại trú.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    if (onCompleted) onCompleted();
  };

  const filteredClassStudents = classStudents.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-6">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-600" />
            <span>Thiết Lập Danh Sách Học Sinh Bán Trú</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác nhận học sinh Bán trú và Ngoại trú theo danh sách được duyệt chính thức. Tuyệt đối không tự suy đoán.
          </p>
        </div>

        {unsetCount > 0 ? (
          <div className="px-3.5 py-1.5 bg-amber-100 border border-amber-300 rounded-lg text-xs text-amber-900 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Còn {unsetCount} học sinh toàn trường chưa xác định Bán trú</span>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span>100% học sinh toàn trường đã được xác định Bán trú / Ngoại trú</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Class Selection Tabs */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Chọn lớp để thiết lập (20 lớp):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {OFFICIAL_CLASS_NAMES.map(c => {
              const countInClass = allStudents.filter(s => s.className === c).length;
              const unsetInClass = allStudents.filter(s => s.className === c && s.boardingType === 'UNSET').length;

              return (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                    selectedClass === c
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{c}</span>
                  {unsetInClass > 0 && (
                    <span className="ml-1 px-1 py-0.2 bg-amber-500 text-white rounded-full text-[9px]">
                      !
                    </span>
                  )}
                  <span className="text-[10px] opacity-75 ml-1 font-normal">({countInClass})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Class Action Bar */}
        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-blue-900 font-bold">Lớp {selectedClass}: </span>
              <span className="text-xs text-slate-700">
                Tổng <strong>{classStudents.length} HS</strong> · Đang chọn Bán trú:{' '}
                <strong className="text-blue-700">{selectedStudentIds.size}</strong> · Ngoại trú:{' '}
                <strong className="text-slate-700">{classStudents.length - selectedStudentIds.size}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllInClass}
              className="px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-medium cursor-pointer"
            >
              Chọn tất cả là Bán trú
            </button>
            <button
              onClick={handleDeselectAllInClass}
              className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer"
            >
              Bỏ chọn tất cả (Ngoại trú)
            </button>
            <button
              onClick={handleSaveClassBoarding}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Xác nhận lớp {selectedClass}</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Tìm học sinh trong lớp ${selectedClass}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Student Table with Checkboxes */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold w-12 text-center">Bán trú?</th>
                <th className="p-3 font-bold">Mã HS</th>
                <th className="p-3 font-bold">Họ và tên</th>
                <th className="p-3 font-bold">Ngày sinh</th>
                <th className="p-3 font-bold">Giới tính</th>
                <th className="p-3 font-bold">Dân tộc</th>
                <th className="p-3 font-bold">Hiện trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClassStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Chưa có học sinh trong lớp này.
                  </td>
                </tr>
              ) : (
                filteredClassStudents.map((stu, idx) => {
                  const isChecked = selectedStudentIds.has(stu.id);

                  return (
                    <tr
                      key={stu.id}
                      onClick={() => toggleStudent(stu.id)}
                      className={`hover:bg-blue-50/40 cursor-pointer ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(stu.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{stu.code}</td>
                      <td className="p-3 font-bold text-slate-800">{stu.fullName}</td>
                      <td className="p-3 text-slate-600 font-mono">{stu.dateOfBirth}</td>
                      <td className="p-3 text-slate-600">{stu.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                      <td className="p-3 text-slate-600">{stu.ethnicGroup || '—'}</td>
                      <td className="p-3">
                        {isChecked ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold rounded text-[11px]">
                            Bán trú
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                            Ngoại trú
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
