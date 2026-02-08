import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initSentry, Sentry } from './sentry.js';

initSentry();

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center text-[#7b6f8c]">应用出错了，请刷新重试。</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  // Unregister old SW to prevent stale cache blank screens
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}
