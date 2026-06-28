const CACHE = "alitrack-v3";  // 버전 올릴 때마다 변경 → 구버전 캐시 강제 삭제
const PRECACHE = ["/", "/index.html"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
);

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // API·sw.js·index.html은 항상 네트워크 우선 (최신 버전 보장)
  if (e.request.url.includes("/api/")) return;
  const url = new URL(e.request.url);
  if (url.pathname === "/sw.js" || url.pathname === "/" || url.pathname === "/index.html") {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // 정적 assets는 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
