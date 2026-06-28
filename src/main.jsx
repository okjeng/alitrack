import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// PWA: beforeinstallprompt 캡처 — 브라우저가 설치 가능 조건 충족 시 발생
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  window.__pwa = {
    install: async () => {
      e.prompt();
      const { outcome } = await e.userChoice;
      window.__pwa = null;
      // React가 상태를 업데이트할 수 있도록 이벤트 발송
      window.dispatchEvent(new CustomEvent("pwa-installed", { detail: { accepted: outcome === "accepted" } }));
      return outcome === "accepted";
    },
  };
  window.dispatchEvent(new Event("pwa-installable"));
});

// Service Worker 등록
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
