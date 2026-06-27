/**
 * AliTrack Service Worker — sw.js
 * public/ 폴더 최상단에 위치해야 합니다 (public/sw.js)
 *
 * 캐싱 전략:
 *   앱 Shell (HTML/CSS/JS) → Cache First  (오프라인에서도 앱 실행)
 *   상품 이미지             → Cache First  (빠른 로딩)
 *   API 응답               → Network First (항상 최신 데이터 우선)
 *   알리 이미지 CDN         → Stale-While-Revalidate
 */

const CACHE_NAME      = "alitrack-v1";
const API_CACHE_NAME  = "alitrack-api-v1";
const IMG_CACHE_NAME  = "alitrack-img-v1";

// 앱 최초 실행에 필요한 핵심 파일 (App Shell)
const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ─── 설치 이벤트: App Shell 사전 캐싱 ────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] 설치 중...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] App Shell 캐싱 완료");
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  // 새 SW를 즉시 활성화 (기존 페이지 새로고침 없이)
  self.skipWaiting();
});

// ─── 활성화 이벤트: 구버전 캐시 정리 ────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] 활성화 중...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![CACHE_NAME, API_CACHE_NAME, IMG_CACHE_NAME].includes(key))
          .map((key) => {
            console.log("[SW] 구버전 캐시 삭제:", key);
            return caches.delete(key);
          })
      )
    )
  );
  // 현재 열린 모든 탭에 새 SW 즉시 적용
  self.clients.claim();
});

// ─── Fetch 인터셉트: 요청 유형별 캐싱 전략 ──────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST·PUT·DELETE 요청은 캐싱 안 함
  if (request.method !== "GET") return;

  // 1. API 요청 → Network First (최신 데이터 우선)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE_NAME, 30));
    return;
  }

  // 2. 알리 상품 이미지 CDN → Stale-While-Revalidate
  if (url.hostname.includes("alicdn.com") || url.hostname.includes("placehold.co")) {
    event.respondWith(staleWhileRevalidate(request, IMG_CACHE_NAME));
    return;
  }

  // 3. 앱 Shell (HTML/JS/CSS) → Cache First (오프라인 지원)
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

// ─── 캐싱 전략 함수들 ────────────────────────────────────────────

/**
 * Cache First: 캐시에 있으면 즉시 반환, 없으면 네트워크
 * → 앱 Shell, 정적 파일에 적합
 */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 오프라인 폴백
    const fallback = await cache.match("/");
    return fallback || new Response("오프라인 상태입니다.", { status: 503 });
  }
}

/**
 * Network First: 네트워크 우선, 실패 시 캐시
 * ttlMinutes: 캐시 유효 시간 (분)
 * → API 응답에 적합
 */
async function networkFirst(request, cacheName, ttlMinutes = 5) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // 응답에 캐시 타임스탬프 헤더 추가
      const cloned  = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const cachedResponse = new Response(await cloned.blob(), {
        status:     cloned.status,
        statusText: cloned.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    // 네트워크 실패 → 캐시에서 반환
    const cached = await cache.match(request);
    if (cached) {
      // TTL 체크
      const cachedAt = parseInt(cached.headers.get("sw-cached-at") || "0");
      const isExpired = Date.now() - cachedAt > ttlMinutes * 60 * 1000;
      if (!isExpired) return cached;
    }
    return new Response(
      JSON.stringify({ error: "오프라인 상태입니다. 인터넷 연결을 확인해주세요." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Stale-While-Revalidate: 캐시를 즉시 반환하면서 백그라운드로 갱신
 * → 이미지처럼 자주 바뀌지 않지만 최신성도 필요한 경우
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 백그라운드 갱신 (응답을 기다리지 않음)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// ─── 푸시 알림 수신 ──────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "AliTrack", body: event.data.text() };
  }

  const options = {
    body:    data.body   || "새로운 알림이 있습니다.",
    icon:    data.icon   || "/icons/icon-192x192.png",
    badge:   data.badge  || "/icons/badge-72x72.png",
    image:   data.image  || undefined,
    tag:     data.tag    || "alitrack-notification",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url:       data.url       || "/",
      productId: data.productId || null,
    },
    actions: [
      { action: "view",    title: "지금 확인하기" },
      { action: "dismiss", title: "나중에 보기"  },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "AliTrack 알림", options)
  );
});

// ─── 푸시 알림 클릭 ──────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // 없으면 새 탭 열기
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── 백그라운드 동기화 (오프라인 중 찜한 상품 나중에 동기화) ──────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-wishlist") {
    event.waitUntil(syncWishlist());
  }
});

async function syncWishlist() {
  // TODO: IndexedDB에 저장된 오프라인 찜 목록 → 서버 동기화
  console.log("[SW] 찜 목록 백그라운드 동기화 시도");
}
