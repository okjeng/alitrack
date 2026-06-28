const CACHE = "alitrack-v4";
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
