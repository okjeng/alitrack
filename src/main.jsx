import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// PWA: beforeinstallprompt 캡처
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  window.__pwa = {
    install: async () => {
      e.prompt();
      const { outcome } = await e.userChoice;
      window.__pwa = null;
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
