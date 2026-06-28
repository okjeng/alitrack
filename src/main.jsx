import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── 채널톡(Channel.io) 고객 채팅 초기화 ────────────────────────────
// VITE_CHANNEL_PLUGIN_KEY 환경변수가 없으면 조용히 건너뜀
;(function () {
  const key = import.meta.env.VITE_CHANNEL_PLUGIN_KEY || '1a643988-c27c-4f08-a70a-2947b49bba9e';
  if (!key) return;
  var w = window;
  if (w.ChannelIO) return;
  var ch = function () { ch.c(arguments); };
  ch.q = []; ch.c = function (a) { ch.q.push(a); };
  w.ChannelIO = ch;
  function l() {
    if (w.ChannelIOInitialized) return;
    w.ChannelIOInitialized = true;
    var s = document.createElement('script');
    s.type = 'text/javascript'; s.async = true;
    s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js';
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') l();
  else { w.addEventListener('DOMContentLoaded', l); w.addEventListener('load', l); }
  w.ChannelIO('boot', {
    pluginKey: key,
    hideChannelButtonOnBoot: true,
    language: 'ko',
  }, function(error) {
    window.ChannelIOBooted = !error;
  });
})();

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
