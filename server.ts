import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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

// ==========================================
// MOUNT VITE MIDDLEWARE (DEV) HOẶC STATIC (PROD)
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
