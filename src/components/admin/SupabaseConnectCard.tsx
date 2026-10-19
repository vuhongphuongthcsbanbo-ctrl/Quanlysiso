import React, { useState, useEffect } from 'react';
import {
  Database,
  CloudCheck,
  CloudAlert,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Code2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import {
  supabaseService,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SQL_SCHEMA,
  ConnectionTestResult,
} from '../../services/supabaseService';

export const SupabaseConnectCard: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pulling, setPulling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  // Auto test connection on mount
  useEffect(() => {
    runTest();
  }, []);

  const runTest = async () => {
    setTesting(true);
    setSyncResult(null);
    try {
      const res = await supabaseService.testConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        connected: false,
        hasTables: false,
        message: e?.message || 'Không thể kiểm tra kết nối',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePushData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await supabaseService.pushAllToSupabase();
      setSyncResult(res);
      if (res.success) {
        runTest();
      }
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'Lỗi đồng bộ' });
    } finally {
      setSyncing(false);
    }
  };

  const handlePullData = async () => {
    setPulling(true);
    setSyncResult(null);
    try {
      const res = await supabaseService.pullFromSupabase();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'Lỗi tải dữ liệu' });
    } finally {
      setPulling(false);
    }
  };

  // Mask anon key for safety
  const maskedKey = SUPABASE_ANON_KEY
    ? `${SUPABASE_ANON_KEY.substring(0, 10)}...${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 6)}`
    : 'Chưa cấu hình';

  const projectId = SUPABASE_URL ? SUPABASE_URL.replace('https://', '').split('.')[0] : '';

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-slate-200 rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Cơ sở dữ liệu đám mây Supabase
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400">
                <Zap className="w-3.5 h-3.5" /> PostgreSQL Realtime
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              KẾT NỐI DỮ LIỆU SUPABASE CHÍNH THỨC
            </h3>
            <p className="text-xs text-slate-400">
              Đồng bộ dữ liệu điểm danh, học sinh và báo cáo thời gian thực cho Trường THCS Bản Bo
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {testing ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Đang kiểm tra...
            </span>
          ) : testResult?.connected && testResult.hasTables ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ĐÃ KẾT NỐI & SẴN SÀNG
            </span>
          ) : testResult?.connected && !testResult.hasTables ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              CẦN CHẠY SQL TẠO BẢNG
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
              <CloudAlert className="w-3.5 h-3.5 text-rose-400" />
              CHƯA KẾT NỐI
            </span>
          )}

          <button
            onClick={runTest}
            disabled={testing}
            title="Kiểm tra lại kết nối"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connection Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Project URL</span>
          <div className="font-mono text-emerald-300 truncate font-semibold" title={SUPABASE_URL}>
            {SUPABASE_URL}
          </div>
          <span className="text-[10px] text-slate-500">Project ID: {projectId}</span>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Anon Public Key</span>
          <div className="font-mono text-teal-300 truncate font-semibold" title={SUPABASE_ANON_KEY}>
            {maskedKey}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Khóa client công khai an toàn</span>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Độ trễ / Phản hồi</span>
          <div className="font-mono text-amber-300 text-sm font-black flex items-center gap-1">
            <Server className="w-3.5 h-3.5" />
            {testResult?.latencyMs ? `${testResult.latencyMs} ms` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">
            {testResult?.hasTables ? 'Bảng dữ liệu: Đầy đủ 8/8' : 'Bảng dữ liệu: Chưa tạo bảng'}
          </span>
        </div>
      </div>

      {/* Alert / Notice Message */}
      {testResult && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
            testResult.connected && testResult.hasTables
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : testResult.connected && !testResult.hasTables
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {testResult.connected && testResult.hasTables ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : testResult.connected ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CloudAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold">{testResult.message}</div>
            {testResult.connected && !testResult.hasTables && (
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Máy chủ Supabase đã nhận kết nối thành công. Để bắt đầu lưu trữ sĩ số và học sinh, bạn chỉ cần bấm nút <b>"Sao chép mã SQL"</b> bên dưới, sau đó mở <b>SQL Editor</b> trên Supabase và bấm <b>RUN</b>.
              </p>
            )}
          </div>
        </div>
      )}

      {syncResult && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
            syncResult.success
              ? 'bg-emerald-900/50 border-emerald-500/40 text-emerald-200 font-bold'
              : 'bg-rose-900/50 border-rose-500/40 text-rose-200 font-bold'
          }`}
        >
          {syncResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Copy SQL Schema */}
        <button
          onClick={handleCopySql}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'ĐÃ SAO CHÉP MÃ SQL!' : 'SAO CHÉP MÃ SQL TẠO BẢNG'}</span>
        </button>

        {/* Push local data up */}
        <button
          onClick={handlePushData}
          disabled={syncing}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
        >
          <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
          <span>{syncing ? 'ĐANG TẢI DỮ LIỆU LÊN...' : 'ĐỒNG BỘ DỮ LIỆU LÊN SUPABASE'}</span>
        </button>

        {/* Pull data down */}
        <button
          onClick={handlePullData}
          disabled={pulling}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <CloudDownload className={`w-4 h-4 ${pulling ? 'animate-bounce' : ''}`} />
          <span>{pulling ? 'ĐANG TẢI VỀ...' : 'TẢI DỮ LIỆU TỪ SUPABASE VỀ MÁY'}</span>
        </button>

        {/* Direct link to Supabase Project */}
        <a
          href={`https://supabase.com/dashboard/project/${projectId}/sql`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-slate-800/60 hover:bg-slate-700/80 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 transition ml-auto"
        >
          <span>Mở Supabase SQL Editor</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Toggle view SQL */}
        <button
          onClick={() => setShowSql(!showSql)}
          className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{showSql ? 'Ẩn mã SQL' : 'Xem trước mã SQL'}</span>
          {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* SQL Preview Box */}
      {showSql && (
        <div className="relative mt-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-xs font-mono overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[11px] font-bold text-emerald-400">Kịch bản PostgreSQL Schema (8 Bảng)</span>
            <button
              onClick={handleCopySql}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-sans font-bold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Đã sao chép' : 'Sao chép tất cả'}</span>
            </button>
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre font-mono text-[11px] leading-relaxed text-slate-300 scrollbar-thin">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      )}

      {/* Step by step instructions */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
        <div className="font-bold text-white flex items-center gap-2">
          <span>HƯỚNG DẪN 3 BƯỚC HOÀN TẤT THIẾT LẬP TRÊN SUPABASE:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed">
          <li>
            Bấm nút <span className="text-emerald-400 font-bold">"SAO CHÉP MÃ SQL TẠO BẢNG"</span> ở trên.
          </li>
          <li>
            Bấm <span className="text-teal-400 font-bold">"Mở Supabase SQL Editor"</span> (hoặc vào mục <b>SQL Editor</b> trên trang quản trị Supabase), dán toàn bộ đoạn mã vừa chép và bấm nút <b>RUN</b> (Chạy).
          </li>
          <li>
            Quay lại đây và bấm <span className="text-emerald-400 font-bold">"ĐỒNG BỘ DỮ LIỆU LÊN SUPABASE"</span> để nạp toàn bộ danh sách 20 lớp, học sinh và báo cáo sĩ số lên đám mây.
          </li>
        </ol>
      </div>
    </div>
  );
};
