import React from 'react';
import { ColumnMapping } from '../../services/excelParserService';
import { Check, AlertCircle, ArrowLeft, ArrowRight, Table2 } from 'lucide-react';

interface ColumnMappingStepProps {
  headers: string[];
  mapping: ColumnMapping;
  onUpdateMapping: (newMapping: ColumnMapping) => void;
  onBack: () => void;
  onNext: () => void;
}

export const ColumnMappingStep: React.FC<ColumnMappingStepProps> = ({
  headers,
  mapping,
  onUpdateMapping,
  onBack,
  onNext,
}) => {
  const handleChange = (field: keyof ColumnMapping, value: string) => {
    onUpdateMapping({
      ...mapping,
      [field]: value,
    });
  };

  const fieldsConfig: {
    key: keyof ColumnMapping;
    label: string;
    description: string;
    required: boolean;
  }[] = [
    {
      key: 'fullName',
      label: 'Họ và tên học sinh',
      description: 'Cột chứa họ và tên đầy đủ (Bắt buộc). Giữ nguyên dấu tiếng Việt.',
      required: true,
    },
    {
      key: 'className',
      label: 'Lớp',
      description: 'Mã hoặc tên lớp (ví dụ: 6A1, 7A2,...). Nếu để trống, hệ thống sẽ dò theo sheet/tiêu đề.',
      required: false,
    },
    {
      key: 'dateOfBirth',
      label: 'Ngày sinh',
      description: 'Hỗ trợ dd/mm/yyyy, serial number Excel, datetime.',
      required: false,
    },
    {
      key: 'gender',
      label: 'Giới tính',
      description: 'Nam/Nữ. Tuyệt đối không tự suy đoán nếu file không có.',
      required: false,
    },
    {
      key: 'boardingType',
      label: 'Bán trú / Ngoại trú',
      description: 'Nếu file có ghi Bán trú/Ngoại trú. Nếu không có, hệ thống sẽ để UNSET để thiết lập sau.',
      required: false,
    },
    {
      key: 'ethnicGroup',
      label: 'Thành phần Dân tộc',
      description: 'Thái, Mông, Dao, Giáy, v.v.',
      required: false,
    },
    {
      key: 'code',
      label: 'Mã học sinh',
      description: 'Mã định danh trong file (nếu có). Nếu không có hệ thống sẽ tự sinh ID.',
      required: false,
    },
    {
      key: 'address',
      label: 'Địa chỉ / Thôn bản',
      description: 'Bản, xã, nơi cư trú.',
      required: false,
    },
    {
      key: 'nationality',
      label: 'Quốc tịch',
      description: 'Mặc định Việt Nam nếu không có.',
      required: false,
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      description: 'Thông tin bổ sung.',
      required: false,
    },
  ];

  const isValid = !!mapping.fullName;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Table2 className="w-5 h-5 text-blue-600" />
            <span>Ánh Xạ Cột (Column Mapping)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn cột tương ứng trong file Excel của bạn với trường dữ liệu hệ thống THCS Bản Bo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Xem trước & Kiểm tra ({isValid ? 'Sẵn sàng' : 'Cần chọn Họ và tên'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {!mapping.boardingType && (
          <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>Lưu ý về diện Bán trú:</strong> Trong file chưa chọn cột Bán trú. Sau khi nhập danh sách,
              hệ thống sẽ tự động chuyển sang bước <strong>Thiết lập Bán trú / Ngoại trú</strong> để Quản trị
              viên phân loại theo đúng danh sách được duyệt của nhà trường, tuyệt đối không tự đoán mò.
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {fieldsConfig.map(field => {
            const currentValue = mapping[field.key] || '';
            const isMapped = !!currentValue;

            return (
              <div
                key={field.key}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isMapped ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <div className="md:w-1/2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{field.label}</span>
                    {field.required && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                        Bắt buộc
                      </span>
                    )}
                    {isMapped && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã ánh xạ</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                </div>

                <div className="md:w-1/2 flex items-center gap-2">
                  <select
                    value={currentValue}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className={`w-full p-2.5 text-xs rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                      isMapped
                        ? 'border-emerald-300 bg-emerald-50/30 text-slate-800 font-medium'
                        : field.required
                        ? 'border-red-300 bg-red-50/30 text-slate-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <option value="">-- Không ánh xạ / Bỏ qua --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>
                        Cột: {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
