const CACHE = "alitrack-v11";
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
  if (e.request.url.includes("/api/")) return;
  const url = new URL(e.request.url);
  if (url.pathname === "/sw.js" || url.pathname === "/" || url.pathname === "/index.html") {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  const isExternalImage =
    url.hostname.includes("alicdn.com") ||
    url.hostname.includes("aliexpress-media.com") ||
    url.hostname.includes("aliexpress.com");
  if (isExternalImage) return;

  // JS/CSS 청크는 파일명 자체가 content-hash라 내용이 바뀌면 URL도 항상 바뀜.
  // network-first로 최신 청크를 먼저 시도하고, 네트워크 실패(오프라인 등) 시에만 캐시로 폴백.
  // (예전 cache-first 방식은 배포 후에도 예전 캐시를 그대로 반환해 "Failed to fetch
  //  dynamically imported module" 흰 화면의 원인이 됐음)
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => cached))
  );
});

// ─── Web Push 알림 ───────────────────────────────────────────────────
self.addEventListener("push", e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: "AliTrack", body: e.data.text() }; }

  const title = data.title || "AliTrack 가격 알림";
  const options = {
    body:    data.body  || "목표가에 도달했어요!",
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    tag:     data.product_id || "alitrack-alert",
    renotify: true,
    data:    { url: data.url || "/" },
    actions: [{ action: "view", title: "상품 보기" }],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(location.origin));
      if (match) { match.focus(); match.postMessage({ type: "navigate", url }); }
      else clients.openWindow(url);
    })
  );
});
