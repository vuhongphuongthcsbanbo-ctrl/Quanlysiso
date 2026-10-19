import React, { useState, useEffect } from 'react';
import { dataHealthService, DataHealthReport } from '../../services/dataHealthService';
import { ShieldCheck, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const DataHealthCheckView: React.FC = () => {
  const [report, setReport] = useState<DataHealthReport>(() => dataHealthService.checkDataHealth());
  const [isScanning, setIsScanning] = useState(false);

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setReport(dataHealthService.checkDataHealth());
      setIsScanning(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner (Mục CIX, CX, CXI) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Công cụ quản trị & đối soát số liệu (Chỉ ADMIN)
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            KIỂM TRA SỨC KHỎE CƠ SỞ DỮ LIỆU (Mục CIX, CX, CXI)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quét và phát hiện các điểm bất thường: thiếu snapshot, lệch số liệu tổng vs chi tiết, học sinh vắng mồ côi, báo cáo trùng lặp
          </p>
        </div>

        <button
          onClick={handleRescan}
          disabled={isScanning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>QUÉT DỮ LIỆU NGAY</span>
        </button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-2xl p-4 border shadow-xs ${
          report.isHealthy ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Tình trạng tổng thể
          </div>
          <div className="text-lg font-black mt-1 flex items-center gap-1.5">
            {report.isHealthy ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-950">DỮ LIỆU TOÀN VẸN</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-rose-950">{report.dangerCount} VẤN ĐỀ NGUY CƠ</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Kiểm tra lúc: {report.checkedAt}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-800 uppercase">Mức nguy cơ cao</div>
          <div className="text-2xl font-black text-rose-950 mt-1">{report.dangerCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Lệch số liệu hoặc trùng lặp</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Cần lưu ý</div>
          <div className="text-2xl font-black text-amber-950 mt-1">{report.warningCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Thiếu snapshot hoặc lớp trống</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase">Ghi nhận thông tin</div>
          <div className="text-2xl font-black text-blue-950 mt-1">{report.infoCount}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Học sinh cũ đã chuyển trường</div>
        </div>
      </div>

      {/* Issues list (Mục CX) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase">
            DANH SÁCH CHI TIẾT CÁC ĐIỂM KIỂM TRA
          </h4>
          <span className="text-xs text-slate-500 font-bold">
            Tổng cộng: {report.totalIssuesCount} mục ghi nhận
          </span>
        </div>

        {report.issues.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h5 className="text-base font-extrabold text-slate-900">
              Cơ sở dữ liệu hoàn toàn chuẩn xác và khớp nối!
            </h5>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Không phát hiện bất kỳ trường hợp trùng lặp, lệch sĩ số giữa tổng thể và chi tiết, hay lỗi thiếu snapshot nào.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.issues.map(issue => (
              <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  issue.severity === 'DANGER'
                    ? 'bg-rose-100 text-rose-700'
                    : issue.severity === 'WARNING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {issue.severity === 'DANGER' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : issue.severity === 'WARNING' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      issue.severity === 'DANGER'
                        ? 'bg-rose-200 text-rose-900'
                        : issue.severity === 'WARNING'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-blue-200 text-blue-900'
                    }`}>
                      {issue.severity === 'DANGER' ? 'NGUY CƠ' : issue.severity === 'WARNING' ? 'CẢNH BÁO' : 'THÔNG TIN'}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900">{issue.title}</h5>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{issue.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 font-medium">
                    {issue.date && <span>Ngày: {issue.date}</span>}
                    {issue.className && <span>Lớp: {issue.className}</span>}
                    <span>Loại: {issue.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
