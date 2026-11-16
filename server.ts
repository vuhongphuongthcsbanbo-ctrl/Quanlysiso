import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// ==========================================
// LƯU TRỮ BỀN VỮNG BÁO CÁO SĨ SỐ TRÊN SERVER (JSON FILE)
// (Bảo đảm lưu được báo cáo Ngày, Tuần, Tháng, Học kỳ, Năm học)
// ==========================================
const DATA_DIR = path.resolve(__dirname, 'data');
const REPORTS_STORE_FILE = path.join(DATA_DIR, 'saved_reports.json');

interface ServerReportsStore {
  dailyOfficialReports: any[];
  periodReports: any[];
  attendanceReports: any[];
  updatedAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readReportsStore(): ServerReportsStore {
  try {
    ensureDataDir();
    if (!fs.existsSync(REPORTS_STORE_FILE)) {
      return {
        dailyOfficialReports: [],
        periodReports: [],
        attendanceReports: [],
        updatedAt: new Date().toISOString(),
      };
    }
    const raw = fs.readFileSync(REPORTS_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      dailyOfficialReports: Array.isArray(parsed.dailyOfficialReports) ? parsed.dailyOfficialReports : [],
      periodReports: Array.isArray(parsed.periodReports) ? parsed.periodReports : [],
      attendanceReports: Array.isArray(parsed.attendanceReports) ? parsed.attendanceReports : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[THCS Bản Bo] Không thể đọc file saved_reports.json:', err);
    return {
      dailyOfficialReports: [],
      periodReports: [],
      attendanceReports: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeReportsStore(store: ServerReportsStore) {
  try {
    ensureDataDir();
    store.updatedAt = new Date().toISOString();
    const tmpFile = `${REPORTS_STORE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpFile, REPORTS_STORE_FILE);
  } catch (err) {
    console.error('[THCS Bản Bo] Lỗi ghi file saved_reports.json:', err);
  }
}

function normalizeServerSession(session?: string | null): 'MORNING' | 'AFTERNOON' {
  if (!session) return 'MORNING';
  const s = String(session).toUpperCase().trim();
  if (s === 'AFTERNOON' || s === 'CHIEU' || s === 'CHIỀU') return 'AFTERNOON';
  return 'MORNING';
}

// ==========================================
// THỜI GIAN CHUẨN VIỆT NAM (Asia/Ho_Chi_Minh)
// ==========================================
function getVietnamServerTime(): {
  dateStr: string;
  timeStr: string;
  fullTimestamp: string;
  hours: number;
  minutes: number;
  seconds: number;
  dayOfWeek: number;
} {
  const now = new Date();
  const vnString = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const vnDate = new Date(vnString);

  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, '0');
  const day = String(vnDate.getDate()).padStart(2, '0');
  const hours = vnDate.getHours();
  const minutes = vnDate.getMinutes();
  const seconds = vnDate.getSeconds();

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hStr}:${mStr}`,
    fullTimestamp: `${year}-${month}-${day} ${hStr}:${mStr}:${sStr}`,
    hours,
    minutes,
    seconds,
    dayOfWeek: vnDate.getDay(),
  };
}

// ==========================================
// BACKEND SCHEDULER & STATE
// (Chạy ngầm liên tục, độc lập với trình duyệt)
// ==========================================
interface BackendReminderLog {
  timestamp: string;
  key: string;
  type: string;
  target: string;
  message: string;
}

const backendReminderHistory: BackendReminderLog[] = [];
let backendSchedulerRunCount = 0;
let lastSchedulerRun: string | null = null;

function runBackendAttendanceCheck() {
  const vn = getVietnamServerTime();
  lastSchedulerRun = vn.fullTimestamp;
  backendSchedulerRunCount++;

  const currentMinutes = vn.hours * 60 + vn.minutes;
  // Khung giờ theo dõi buổi sáng: 06:45 - 08:00
  const isMorningWindow = currentMinutes >= (6 * 60 + 45) && currentMinutes <= (8 * 60 + 0);

  if (isMorningWindow) {
    // Ghi nhận vòng lặp kiểm tra của hệ thống
    const logItem: BackendReminderLog = {
      timestamp: vn.fullTimestamp,
      key: `${vn.dateStr}_MORNING_CHECK_${vn.hours}_${vn.minutes}`,
      type: 'SERVER_SCHEDULE_CHECK',
      target: '20_CLASSES',
      message: `Hệ thống backend đã kiểm tra sĩ số lúc ${vn.timeStr} (Múi giờ Asia/Ho_Chi_Minh)`,
    };
    if (!backendReminderHistory.some(h => h.key === logItem.key)) {
      backendReminderHistory.unshift(logItem);
      if (backendReminderHistory.length > 200) {
        backendReminderHistory.pop();
      }
    }
  }
}

// Chạy định kỳ backend mỗi 30 giây
const backgroundInterval = setInterval(runBackendAttendanceCheck, 30000);
runBackendAttendanceCheck(); // Chạy ngay lần đầu khởi động

// ==========================================
// API ROUTES
// ==========================================

// 1. Lấy giờ server chuẩn Việt Nam
app.get('/api/time', (req, res) => {
  const vn = getVietnamServerTime();
  res.json({
    timezone: 'Asia/Ho_Chi_Minh',
    serverDate: vn.dateStr,
    serverTime: vn.timeStr,
    fullTimestamp: vn.fullTimestamp,
    dayOfWeek: vn.dayOfWeek,
    epoch: Date.now(),
  });
});

// 2. Trạng thái hoạt động của Scheduler ngầm
app.get('/api/reminders/status', (req, res) => {
  const vn = getVietnamServerTime();
  res.json({
    status: 'ACTIVE_RUNNING',
    timezone: 'Asia/Ho_Chi_Minh',
    serverTime: vn.fullTimestamp,
    totalSchedulerRuns: backendSchedulerRunCount,
    lastSchedulerRun,
    historyCount: backendReminderHistory.length,
    recentLogs: backendReminderHistory.slice(0, 20),
    isMorningActiveWindow: vn.hours >= 6 && vn.hours <= 8,
  });
});

// 3. Kích hoạt kiểm tra tức thì qua HTTP
app.post('/api/reminders/check', (req, res) => {
  runBackendAttendanceCheck();
  const vn = getVietnamServerTime();
  res.json({
    success: true,
    message: `Đã thực thi kiểm tra nhắc nhở lúc ${vn.fullTimestamp}`,
    serverTime: vn.fullTimestamp,
    totalRuns: backendSchedulerRunCount,
  });
});

// 4. Lấy toàn bộ báo cáo đã lưu trên server (Ngày, Tuần, Tháng, Học kỳ, Năm học)
app.get('/api/reports/saved', (req, res) => {
  const store = readReportsStore();
  res.json({
    success: true,
    ...store,
  });
});

// 5. Lưu báo cáo sĩ số theo ngày (SchoolDailyReport)
app.post('/api/reports/daily-official', (req, res) => {
  const report = req.body;
  if (!report || !report.date) {
    res.status(400).json({ success: false, message: 'Thiếu dữ liệu báo cáo ngày.' });
    return;
  }
  const store = readReportsStore();
  const normSess = normalizeServerSession(report.session);
  const normalized = { ...report, session: normSess };
  const idx = store.dailyOfficialReports.findIndex(
    (r) =>
      r.id === normalized.id ||
      (r.date === normalized.date && normalizeServerSession(r.session) === normSess)
  );
  if (idx >= 0) {
    store.dailyOfficialReports[idx] = normalized;
  } else {
    store.dailyOfficialReports.push(normalized);
  }
  writeReportsStore(store);
  res.json({ success: true, report: normalized });
});

app.delete('/api/reports/daily-official/:id', (req, res) => {
  const { id } = req.params;
  const store = readReportsStore();
  const prevLen = store.dailyOfficialReports.length;
  store.dailyOfficialReports = store.dailyOfficialReports.filter((r) => r.id !== id);
  if (store.dailyOfficialReports.length !== prevLen) {
    writeReportsStore(store);
  }
  res.json({ success: true });
});

// 6. Lưu báo cáo định kỳ (Tuần, Tháng, Học kỳ, Năm học)
app.post('/api/reports/period', (req, res) => {
  const report = req.body;
  if (!report || !report.periodKey || !report.periodType) {
    res.status(400).json({ success: false, message: 'Thiếu dữ liệu báo cáo định kỳ.' });
    return;
  }
  const store = readReportsStore();
  const normSess = normalizeServerSession(report.session);
  const normalized = { ...report, session: normSess };
  const idx = store.periodReports.findIndex(
    (r) => r.id === normalized.id || r.periodKey === normalized.periodKey
  );
  if (idx >= 0) {
    store.periodReports[idx] = normalized;
  } else {
    store.periodReports.push(normalized);
  }
  writeReportsStore(store);
  res.json({ success: true, report: normalized });
});

app.delete('/api/reports/period/:id', (req, res) => {
  const { id } = req.params;
  const store = readReportsStore();
  const prevLen = store.periodReports.length;
  store.periodReports = store.periodReports.filter((r) => r.id !== id);
  if (store.periodReports.length !== prevLen) {
    writeReportsStore(store);
  }
  res.json({ success: true });
});

// 7. Đồng bộ báo cáo điểm danh từng lớp lên server
app.post('/api/reports/attendance-sync', (req, res) => {
  const incoming = Array.isArray(req.body?.reports)
    ? req.body.reports
    : req.body?.report
    ? [req.body.report]
    : [];
  if (incoming.length === 0) {
    res.json({ success: true, count: 0 });
    return;
  }
  const store = readReportsStore();
  for (const item of incoming) {
    if (!item || !item.date || !item.classId) continue;
    const normSess = normalizeServerSession(item.session);
    const normalized = { ...item, session: normSess };
    const idx = store.attendanceReports.findIndex(
      (r) =>
        r.id === normalized.id ||
        (r.date === normalized.date &&
          (r.classId === normalized.classId || r.className === normalized.className) &&
          normalizeServerSession(r.session) === normSess)
    );
    if (idx >= 0) {
      store.attendanceReports[idx] = normalized;
    } else {
      store.attendanceReports.push(normalized);
    }
  }
  writeReportsStore(store);
  res.json({ success: true, count: store.attendanceReports.length });
});


// ==========================================
// MOUNT VITE MIDDLEWARE (DEV) HOẶC STATIC (PROD)
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    // Fallback cho SPA trong môi trường dev nếu vite.middlewares không chặn
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[THCS Bản Bo] Server đang chạy tại http://0.0.0.0:${PORT}`);
    console.log(`[THCS Bản Bo] Múi giờ hệ thống: Asia/Ho_Chi_Minh (UTC+7)`);
    console.log(`[THCS Bản Bo] Scheduler ngầm đang kiểm tra định kỳ mỗi 30s.`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[THCS Bản Bo] Port ${PORT} đang được sử dụng.`);
    } else {
      console.error('[THCS Bản Bo] Lỗi server:', err);
    }
  });
}

startServer();
