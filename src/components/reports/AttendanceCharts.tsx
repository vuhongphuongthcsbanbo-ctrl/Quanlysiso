import React, { useState } from 'react';
import { GradeGroupSummary } from '../../services/dailyReportService';

interface TrendPoint {
  date: string;
  dayLabel: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

interface AttendanceChartsProps {
  trendData: TrendPoint[];
  gradeData: GradeGroupSummary[];
  presentCount: number;
  absentCount: number;
  boardingPresent: number;
  boardingAbsent: number;
}

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  trendData,
  gradeData,
  presentCount,
  absentCount,
  boardingPresent,
  boardingAbsent,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    data: TrendPoint;
  } | null>(null);

  const totalStudents = presentCount + absentCount;
  const boardingTotal = boardingPresent + boardingAbsent;

  // Donut chart calculations
  const presentPct = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
  const absentPct = totalStudents > 0 ? (absentCount / totalStudents) * 100 : 0;

  // Line chart SVG coordinates
  const validTrend = trendData.filter(t => t.total > 0);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 25;

  const minRate = 80;
  const maxRate = 100;

  const points = validTrend.map((pt, idx) => {
    const x = paddingX + (idx / Math.max(1, validTrend.length - 1)) * (chartWidth - paddingX * 2);
    const clampedRate = Math.min(maxRate, Math.max(minRate, pt.rate));
    const y = chartHeight - paddingY - ((clampedRate - minRate) / (maxRate - minRate)) * (chartHeight - paddingY * 2);
    return { x, y, pt };
  });

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  // Max absent in grades for bar chart scaling
  const maxGradeAbsent = Math.max(1, ...gradeData.map(g => g.absentCount));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
      {/* 1. Line Chart: Xu hướng chuyên cần các ngày gần nhất */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between relative">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Xu hướng tỉ lệ chuyên cần (%)
            </h4>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              Diễn biến theo các ngày học gần nhất
            </div>
          </div>
          {validTrend.length > 0 && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Mục tiêu: ≥ 98.0%
            </span>
          )}
        </div>

        {validTrend.length < 2 ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span>Chưa đủ dữ liệu các ngày trước để vẽ biểu đồ đường xu hướng.</span>
            <span className="text-[11px] text-slate-400 mt-1">Dữ liệu sẽ tự động tích lũy khi các ngày tiếp theo được duyệt.</span>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 select-none"
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {/* Grid lines */}
              {[90, 95, 100].map(val => {
                const y = chartHeight - paddingY - ((val - minRate) / (maxRate - minRate)) * (chartHeight - paddingY * 2);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Area under line */}
              {points.length > 0 && (
                <path
                  d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`}
                  fill="url(#trendGrad)"
                  opacity="0.3"
                />
              )}

              {/* Line path */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient def */}
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    className="cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGElement).getBoundingClientRect();
                      setActiveTooltip({ x: rect.left, y: rect.top, data: p.pt });
                    }}
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#64748b"
                  >
                    {p.pt.dayLabel}
                  </text>
                </g>
              ))}
            </svg>

            {/* Tooltip on hover */}
            {activeTooltip && (
              <div className="absolute top-2 right-2 bg-slate-900 text-white rounded-xl p-2.5 shadow-xl text-xs z-20 pointer-events-none animate-in fade-in duration-100 border border-slate-700">
                <div className="font-bold text-amber-300">{activeTooltip.data.date}</div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="text-slate-300">Có mặt:</span>
                  <span className="font-bold text-emerald-400">{activeTooltip.data.present} HS</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-300">Vắng:</span>
                  <span className="font-bold text-rose-400">{activeTooltip.data.absent} HS</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 mt-1">
                  <span className="text-slate-300">Tỉ lệ:</span>
                  <span className="font-bold text-blue-300">{activeTooltip.data.rate.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Donut & Bar: Cơ cấu toàn trường & Vắng theo khối 6-9 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tỉ lệ có mặt & vắng theo khối
          </h4>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            Phân bổ thực tế hôm nay
          </div>
        </div>

        {totalStudents === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Chưa đủ dữ liệu để tạo biểu đồ.
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Visual Bar Breakdown: Có mặt vs Vắng */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-emerald-800">Có mặt: {presentCount} ({presentPct.toFixed(1)}%)</span>
                <span className="font-bold text-rose-800">Vắng: {absentCount} ({absentPct.toFixed(1)}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${presentPct}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${absentPct}%` }}
                />
              </div>
            </div>

            {/* Bán trú: Có mặt vs Vắng */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1 text-slate-600">
                <span>Bán trú ({boardingTotal} HS):</span>
                <span className="font-bold text-amber-900">
                  Có mặt {boardingPresent} · Vắng {boardingAbsent}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${boardingTotal > 0 ? (boardingPresent / boardingTotal) * 100 : 100}%` }}
                />
                <div
                  className="bg-rose-400 h-full"
                  style={{ width: `${boardingTotal > 0 ? (boardingAbsent / boardingTotal) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Lượt vắng theo khối 6 - 9 (Bar Chart) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Học sinh vắng theo Khối (6, 7, 8, 9)
              </div>
              <div className="space-y-1.5">
                {gradeData.map(g => {
                  const pct = (g.absentCount / maxGradeAbsent) * 100;
                  return (
                    <div key={g.grade} className="flex items-center text-xs">
                      <span className="w-14 font-bold text-slate-700">{g.gradeLabel}:</span>
                      <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden mx-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            g.absentCount > 0 ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-bold text-slate-900">
                        {g.absentCount} vắng
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-100">
          Chỉ số tự động cập nhật từ các lớp đã được duyệt
        </div>
      </div>
    </div>
  );
};
