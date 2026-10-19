import React, { useState } from 'react';
import {
  DuplicateGroup,
} from '../../services/studentDuplicateService';
import { ParsedStudentItem } from '../../services/studentValidationService';
import {
  Copy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface DuplicateReviewStepProps {
  groups: DuplicateGroup[];
  onResolveGroup: (groupId: string, resolution: 'KEEP_FIRST' | 'KEEP_SECOND' | 'KEEP_ALL' | 'SKIP_ALL') => void;
  onProceed: () => void;
  onBack: () => void;
}

export const DuplicateReviewStep: React.FC<DuplicateReviewStepProps> = ({
  groups,
  onResolveGroup,
  onProceed,
  onBack,
}) => {
  const [resolutions, setResolutions] = useState<Record<string, 'KEEP_FIRST' | 'KEEP_SECOND' | 'KEEP_ALL' | 'SKIP_ALL'>>({});

  const handleSelect = (groupId: string, res: 'KEEP_FIRST' | 'KEEP_SECOND' | 'KEEP_ALL' | 'SKIP_ALL') => {
    setResolutions(prev => ({ ...prev, [groupId]: res }));
    onResolveGroup(groupId, res);
  };

  const allResolved = groups.every(g => !!resolutions[g.id]);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-purple-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Copy className="w-5 h-5 text-purple-600" />
            <span>Đối Soát Học Sinh Nghi Trùng Lặp ({groups.length} trường hợp)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tuyệt đối không tự động xóa. Vui lòng đối chiếu từng trường hợp và quyết định giữ bản ghi phù hợp.
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
            onClick={onProceed}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Tiếp tục bước Nhập ({groups.length > 0 ? `${Object.keys(resolutions).length}/${groups.length} đã xử lý` : 'Hoàn tất'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {groups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không phát hiện học sinh nghi trùng lặp nào.</p>
          </div>
        ) : (
          groups.map((group, gIdx) => {
            const currentRes = resolutions[group.id] || 'KEEP_FIRST';

            return (
              <div
                key={group.id}
                className="border border-purple-200 rounded-xl p-4 bg-purple-50/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                    Trường hợp #{gIdx + 1}: {group.name} · Lớp {group.className}
                  </span>
                  <span className="text-xs text-slate-500">Phát hiện {group.items.length} bản ghi giống nhau</span>
                </div>

                {/* Compare items side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.items.map((item, itemIdx) => (
                    <div
                      key={item.tempId}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        (itemIdx === 0 && currentRes === 'KEEP_FIRST') ||
                        (itemIdx === 1 && currentRes === 'KEEP_SECOND') ||
                        currentRes === 'KEEP_ALL'
                          ? 'border-purple-500 bg-white shadow-xs ring-1 ring-purple-300'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="font-bold text-slate-800 mb-1">
                        BẢN GHI #{itemIdx + 1} (Dòng {item.originalRowIndex} trong Excel)
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div>
                          Họ và tên: <strong>{item.fullName}</strong>
                        </div>
                        <div>
                          Ngày sinh: <strong>{item.displayDob || item.dateOfBirth}</strong>
                        </div>
                        <div>
                          Giới tính: <strong>{item.gender === 'male' ? 'Nam' : 'Nữ'}</strong>
                        </div>
                        <div>
                          Lớp: <strong>{item.className}</strong>
                        </div>
                        <div>
                          Bán trú: <strong>{item.boardingType === 'BOARDING' ? 'Bán trú' : 'Ngoại trú'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resolution buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100">
                  <span className="text-xs font-bold text-slate-700">Hành động:</span>
                  <button
                    onClick={() => handleSelect(group.id, 'KEEP_FIRST')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentRes === 'KEEP_FIRST'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    GIỮ BẢN GHI 1
                  </button>
                  <button
                    onClick={() => handleSelect(group.id, 'KEEP_SECOND')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentRes === 'KEEP_SECOND'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    GIỮ BẢN GHI 2
                  </button>
                  <button
                    onClick={() => handleSelect(group.id, 'KEEP_ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentRes === 'KEEP_ALL'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    GIỮ CẢ HAI
                  </button>
                  <button
                    onClick={() => handleSelect(group.id, 'SKIP_ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentRes === 'SKIP_ALL'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    BỎ QUA CẢ HAI
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
