import React, { useState, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { AuditLog } from '../types';
import { Sparkles, Search, Filter, Clock, User, Shield } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = log.description.toLowerCase().includes(term);
        const matchUser = log.userName.toLowerCase().includes(term);
        const matchAction = log.action.toLowerCase().includes(term);
        if (!matchDesc && !matchUser && !matchAction) return false;
      }
      return true;
    });
  }, [logs, entityFilter, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Giám sát tính toàn vẹn dữ liệu
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>NHẬT KÝ & LỊCH SỬ CHỈNH SỬA HỆ THỐNG</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lưu vết tự động người thực hiện, thời gian, báo cáo sĩ số và thay đổi dữ liệu học sinh
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Tổng cộng: <strong>{logs.length}</strong> sự kiện được ghi nhận
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nội dung, người thực hiện..."
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="attendance">Báo cáo sĩ số & Điểm danh</option>
            <option value="student">Hồ sơ học sinh</option>
            <option value="class">Danh sách lớp</option>
            <option value="user">Người dùng & Phân quyền</option>
            <option value="settings">Cài đặt hệ thống</option>
          </select>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="p-3 text-center">STT</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3">Nội dung chi tiết thay đổi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.userName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 uppercase font-semibold text-[10px]">
                    {log.entity}
                  </td>
                  <td className="p-3 text-slate-800 font-medium">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
