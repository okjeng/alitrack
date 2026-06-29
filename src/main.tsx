import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { q?: unknown[]; c?: (a: unknown) => void };
    ChannelIOInitialized?: boolean;
    ChannelIOBooted?: boolean;
    __pwa?: { install: () => Promise<boolean> } | null;
  }
}

// ─── 채널톡(Channel.io) 고객 채팅 초기화
;(function () {
  const key = import.meta.env.VITE_CHANNEL_PLUGIN_KEY || "1a643988-c27c-4f08-a70a-2947b49bba9e";
  if (!key) return;
  const w = window;
  if (w.ChannelIO) return;
  const ch: Window["ChannelIO"] = function (...args: unknown[]) { ch!.c!(args); } as Window["ChannelIO"];
  ch!.q = []; ch!.c = function (a: unknown) { ch!.q!.push(a); };
  w.ChannelIO = ch;
  function l() {
    if (w.ChannelIOInitialized) return;
    w.ChannelIOInitialized = true;
    const s = document.createElement("script");
    s.type = "text/javascript"; s.async = true;
    s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    document.head.appendChild(s);
  }
  if (document.readyState === "complete") l();
  else { w.addEventListener("DOMContentLoaded", l); w.addEventListener("load", l); }
  w.ChannelIO!("boot", {
    pluginKey: key,
    hideChannelButtonOnBoot: true,
    language: "ko",
  }, function(error: unknown) {
    window.ChannelIOBooted = !error;
  });
})();

// PWA: beforeinstallprompt 캡처
window.addEventListener("beforeinstallprompt", (e: Event) => {
  e.preventDefault();
  const promptEvent = e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };
  window.__pwa = {
    install: async () => {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.__pwa = null;
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
