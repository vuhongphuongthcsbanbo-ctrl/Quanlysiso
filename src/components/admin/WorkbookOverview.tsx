import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  Building,
} from 'lucide-react';
import { WorkbookAnalysis } from '../../services/excelParserService';

interface WorkbookOverviewProps {
  analysis: WorkbookAnalysis;
  onSelectSheet: (sheetName: string) => void;
  onProceed: () => void;
}

export const WorkbookOverview: React.FC<WorkbookOverviewProps> = ({
  analysis,
  onSelectSheet,
  onProceed,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* File summary bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">{analysis.fileName}</h3>
            <p className="text-xs text-slate-500">
              Kích thước: <span className="font-medium text-slate-700">{formatFileSize(analysis.fileSize)}</span> · Số
              dòng đọc được: <span className="font-medium text-slate-700">{analysis.totalRowsFound} dòng</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analysis.hasAll20Classes ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Đã nhận diện đủ 20 lớp chính thức</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Phát hiện {analysis.detectedClasses.length}/20 lớp</span>
            </div>
          )}

          <button
            onClick={onProceed}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Tiếp tục: Ánh xạ cột</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Sheet selector if multiple */}
        {analysis.sheetNames.length > 1 && (
          <div className="bg-blue-50/60 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Các Sheet trong file ({analysis.sheetNames.length} sheet):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.sheetNames.map(sheet => (
                <button
                  key={sheet}
                  onClick={() => onSelectSheet(sheet)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    analysis.activeSheetName === sheet
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sheet}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-blue-700 mt-2">
              Đang phân tích sheet: <strong>{analysis.activeSheetName}</strong>
            </p>
          </div>
        )}

        {/* 20 Classes Detection Status */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Tình trạng nhận diện 20 lớp (Khối 6, 7, 8, 9)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {['6A1','6A2','6A3','6A4','6A5',
              '7A1','7A2','7A3','7A4','7A5',
              '8A1','8A2','8A3','8A4','8A5',
              '9A1','9A2','9A3','9A4','9A5'].map(cls => {
              const detected = analysis.detectedClasses.includes(cls);
              return (
                <div
                  key={cls}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    detected
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>{cls}</span>
                  {detected ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">Đã thấy</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Chưa thấy</span>
                  )}
                </div>
              );
            })}
          </div>

          {analysis.invalidClasses.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              <span className="font-bold">Lớp ngoài danh mục 20 lớp: </span>
              {analysis.invalidClasses.join(', ')} (Hệ thống sẽ giữ lại để bạn chỉnh sửa hoặc xác nhận).
            </div>
          )}
        </div>

        {/* Detected Headers preview */}
        <div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span>Tiêu đề các cột phát hiện trong file ({analysis.headers.length} cột):</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.headers.map((h, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-mono"
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Sample rows table */}
        {analysis.sampleRows.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Dữ liệu xem trước 5 dòng đầu tiên:
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    {analysis.headers.slice(0, 7).map((h, i) => (
                      <th key={i} className="p-2.5 font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50">
                      {analysis.headers.slice(0, 7).map((h, cIdx) => (
                        <td key={cIdx} className="p-2.5 text-slate-700 whitespace-nowrap">
                          {String(row[h] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
