import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Chặn thông báo lỗi WebSocket HMR bị đóng trong môi trường iFrame proxy
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && (event.message.includes('WebSocket') || event.message.includes('ws://') || event.message.includes('wss://'))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    const msg = String(event.reason || '');
    if (msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
