import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { SchoolSettings, SchoolClass, Student } from '../../types';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  School,
  Building2,
  Users,
  Upload,
  UtensilsCrossed,
  Check,
  Sparkles,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface YearSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const YearSetupWizardModal: React.FC<YearSetupWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const settings = storageService.getSettings();
  const classes = storageService.getClasses();
  const students = storageService.getStudents();

  const [schoolYearName, setSchoolYearName] = useState<string>('2026-2027');
  const [adminName, setAdminName] = useState<string>('Phạm Ngọc Thúy');
  const [adminTitle, setAdminTitle] = useState<string>('Tổng Phụ trách Đội');

  if (!isOpen) return null;

  const totalBoarding = students.filter(s => s.boardingType === 'BOARDING').length;
  const totalNonBoarding = students.filter(s => s.boardingType === 'NON_BOARDING').length;

  const handleFinish = () => {
    storageService.addAuditLog(
      adminName,
      `Kích hoạt và hoàn tất thiết lập Năm học ${schoolYearName} cho Trường THCS Bản Bo (20 lớp, ${students.length} học sinh)`,
      'settings',
      'KÍCH HOẠT NĂM HỌC'
    );
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded uppercase">
              Trình hướng dẫn thiết lập
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              THIẾT LẬP NĂM HỌC {schoolYearName}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7 Steps Indicator (Section AH) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
          {[
            { num: 1, title: 'Trường' },
            { num: 2, title: '20 lớp' },
            { num: 3, title: 'GVCN' },
            { num: 4, title: 'Học sinh' },
            { num: 5, title: 'Bán trú' },
            { num: 6, title: 'Kiểm tra' },
            { num: 7, title: 'Kích hoạt' },
          ].map(s => (
            <div
              key={s.num}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl whitespace-nowrap ${
                currentStep === s.num
                  ? 'bg-blue-600 text-white'
                  : currentStep > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Step Contents */}
        <div className="min-h-60">
          {/* Bước 1: Thông tin nhà trường */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">Bước 1: Xác nhận thông tin nhà trường</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Tên đơn vị</label>
                  <input
                    type="text"
                    disabled
                    value={settings.schoolName}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    disabled
                    value={settings.schoolAddress}
                    className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Người quản trị chính</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Chức vụ</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bước 2: 20 lớp */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">
                Bước 2: Cấu hình 20 lớp học (Khối 6, 7, 8, 9)
              </div>
              <p className="text-slate-500">
                Nhà trường đã có sẵn danh sách 20 lớp chuẩn. Quản trị viên có thể thêm, sửa phòng học hoặc ngừng hoạt động nếu cần.
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center font-bold">
                {classes.map(c => (
                  <div key={c.id} className="p-2 bg-white rounded-xl border border-slate-200">
                    <div className="text-sm font-black text-slate-900">{c.name}</div>
                    <div className="text-[10px] text-slate-400">Khối {c.grade}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bước 3: Danh sách GVCN */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">
                Bước 3: Phân công Giáo viên chủ nhiệm cho 20 lớp
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {classes.map(c => (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">{c.name}</strong>
                      <span className="text-slate-400 ml-2">(Khối {c.grade})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-900">{c.teacherName || 'Chưa phân công'}</span>
                      <span className="text-[11px] text-slate-500 ml-2">SĐT: {c.teacherPhone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bước 4: Import học sinh */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">
                Bước 4: Danh sách học sinh toàn trường
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-black text-emerald-950 text-sm">
                  Đã tải {students.length} học sinh vào hệ thống!
                </div>
                <div className="text-emerald-800">
                  Phân bổ đều trên 20 lớp (trung bình ~33 học sinh / lớp). Có thể import thêm từ Excel tại trang Danh sách học sinh bất cứ lúc nào.
                </div>
              </div>
            </div>
          )}

          {/* Bước 5: Xác định Bán trú / Ngoại trú cố định */}
          {currentStep === 5 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">
                Bước 5: Xác định học sinh bán trú theo danh sách cố định
              </div>
              <p className="text-slate-500">
                Tại Trường THCS Bản Bo, học sinh bán trú được thiết lập cố định 1 lần đầu năm:
              </p>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xs font-bold text-amber-800 uppercase">Học sinh Bán trú</div>
                  <div className="text-2xl font-black text-amber-950 mt-1">{totalBoarding}</div>
                  <div className="text-[10px] text-amber-700">Ăn nghỉ trưa tại trường</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-xs font-bold text-blue-800 uppercase">Học sinh Ngoại trú</div>
                  <div className="text-2xl font-black text-blue-950 mt-1">{totalNonBoarding}</div>
                  <div className="text-[10px] text-blue-700">Tự túc bữa trưa</div>
                </div>
              </div>
            </div>
          )}

          {/* Bước 6: Kiểm tra tổng số học sinh */}
          {currentStep === 6 && (
            <div className="space-y-3 animate-in fade-in text-xs">
              <div className="font-extrabold text-sm text-slate-900">
                Bước 6: Kiểm tra đối chiếu số liệu tổng thể
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Tổng số lớp:</span>
                  <strong className="text-slate-900">{classes.length} lớp</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Tổng số học sinh toàn trường:</span>
                  <strong className="text-slate-900">{students.length} học sinh</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-amber-800 font-semibold">Tổng học sinh Bán trú:</span>
                  <strong className="text-amber-900">{totalBoarding} ({((totalBoarding / students.length) * 100).toFixed(1)}%)</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-blue-800 font-semibold">Tổng học sinh Ngoại trú:</span>
                  <strong className="text-blue-900">{totalNonBoarding} ({((totalNonBoarding / students.length) * 100).toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          )}

          {/* Bước 7: Kích hoạt năm học */}
          {currentStep === 7 && (
            <div className="space-y-3 animate-in fade-in text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                SẴN SÀNG KÍCH HOẠT NĂM HỌC {schoolYearName}!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Hệ thống Quản lý Sĩ số Học sinh Trường THCS Bản Bo đã hoàn tất khởi tạo 20 lớp, phân công GVCN và danh sách bán trú cố định.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
              currentStep === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>KÍCH HOẠT NĂM HỌC</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
