// AliTrack 순수 유틸리티 함수 모음
// 모든 함수는 React에 의존하지 않는 순수 함수로 단위 테스트 가능

export const ALI_TRACKING_ID = "alitrack_kr";

// ─── 포맷/수학 ────────────────────────────────────────────────────
export const fmt      = (n) => n.toLocaleString("ko-KR") + "원";
export const avg60    = (h) => Math.round(h.reduce((s, d) => s + d.price, 0) / h.length / 100) * 100;
export const idToSeed = (id) => id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 9301;

// ─── GA4 이벤트 헬퍼 ─────────────────────────────────────────────
export const trackEvent = (name, params = {}) => {
  try { if (typeof window.gtag === "function") window.gtag("event", name, params); } catch {}
};

// ─── API 응답 변환 ────────────────────────────────────────────────
export const mapProduct = (p) => {
  const disc = p.discount || 0;
  const tag =
    disc >= 50 ? "역대최저" :
    disc >= 30 ? "핫딜" :
    disc >= 20 ? "최저가근접" :
    disc >= 10 ? "특가" : "핫딜";
  return {
    id:           String(p.id || ""),
    name:         p.name || "",
    shortName:    (p.name || "").split(/\s+/).slice(0, 3).join(" "),
    price:        p.price || 0,
    orig:         p.orig_price || p.price || 0,
    discount:     disc,
    image:        p.image || "https://placehold.co/320x320/EEF2FF/6366F1?text=📦",
    tag,
    deliveryDays: p.delivery_days || 5,
    rating:       p.rating || 0,
    reviews:      p.reviews || 0,
    affiliate_url: p.affiliate_url || "",
  };
};

// ─── URL ─────────────────────────────────────────────────────────
export const buildAffiliateUrl = (productId, affiliateUrl) => {
  if (affiliateUrl && !affiliateUrl.includes("s.click.aliexpress.com")) return affiliateUrl;
  return `https://ko.aliexpress.com/item/${productId}.html?aff_fcid=${ALI_TRACKING_ID}&aff_platform=portals-tool&sk=${ALI_TRACKING_ID}&aff_trace_key=${ALI_TRACKING_ID}`;
};

// ─── 클립보드 ─────────────────────────────────────────────────────
export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement("textarea");
    el.value = text; el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el); el.focus(); el.select();
    document.execCommand("copy"); document.body.removeChild(el);
  }
};

// ─── LCG 난수 기반 60일 가격 히스토리 생성 ───────────────────────
// LCG(Linear Congruential Generator) 알고리즘으로 seed 기반 결정론적 난수 생성
// 동일 seed → 동일 히스토리 보장 (차트 일관성)
export const generateHistory = (current, seed) => {
  const pts = []; const today = new Date();
  let rng = seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  let p = current * 1.4;
  for (let i = 60; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    p = i === 0 ? current : Math.max(current * 1.02, p + (rand() - 0.52) * current * 0.07);
    if (i % 4 === 0 || i === 0)
      pts.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, price: Math.round(p / 100) * 100 });
  }
  return pts;
};

// ─── 검색 랭킹 ───────────────────────────────────────────────────
// 완전일치(4) > 전방일치(3) > 포함(2) > 단어부분일치(비율) 순 정렬
export const rankBySearch = (items, keyword) => {
  if (!keyword) return items;
  const kw = keyword.toLowerCase().trim();
  const words = kw.split(/\s+/).filter(Boolean);
  const score = (name) => {
    const n = (name || "").toLowerCase();
    if (n === kw) return 4;
    if (n.startsWith(kw)) return 3;
    if (n.includes(kw)) return 2;
    const hits = words.filter(w => n.includes(w)).length;
    return hits > 0 ? hits / words.length : 0;
  };
  return [...items].sort((a, b) => score(b.name) - score(a.name));
};

// ─── localStorage 헬퍼 ───────────────────────────────────────────
export const getGuestId = () => {
  try {
    let id = localStorage.getItem("alitrack_guest_id");
    if (!id) {
      const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
      id = `ALI-${rand}`;
      localStorage.setItem("alitrack_guest_id", id);
    }
    return id;
  } catch { return "ALI-GUEST"; }
};

export const getLocalAlerts = () => {
  try { return JSON.parse(localStorage.getItem("alitrack_local_alerts") || "[]"); } catch { return []; }
};
export const saveLocalAlert = (alert) => {
  try {
    const list = getLocalAlerts().filter(a => a.product_id !== alert.product_id);
    list.push(alert);
    localStorage.setItem("alitrack_local_alerts", JSON.stringify(list));
  } catch {}
};
export const removeLocalAlert = (productId) => {
  try {
    localStorage.setItem("alitrack_local_alerts",
      JSON.stringify(getLocalAlerts().filter(a => a.product_id !== productId)));
  } catch {}
};

export const getLocalWishlist = () => {
  try { return JSON.parse(localStorage.getItem("alitrack_wishlist") || "[]"); } catch { return []; }
};
export const toggleLocalWish = (product) => {
  try {
    const list = getLocalWishlist();
    const idx  = list.findIndex(p => p.id === product.id);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.push({ id: product.id, name: product.name, price: product.price, image_url: product.image }); }
    localStorage.setItem("alitrack_wishlist", JSON.stringify(list));
    return idx < 0;
  } catch { return false; }
};

export const getPriceHistory = () => {
  try { return JSON.parse(localStorage.getItem("alitrack_price_history") || "[]"); } catch { return []; }
};
export const savePriceHistory = (product) => {
  try {
    let hist = getPriceHistory().filter(h => h.productId !== String(product.id));
    hist.unshift({
      productId:     String(product.id),
      id:            product.id,
      name:          product.name || product.title || "",
      image:         product.image || "",
      price:         product.price || 0,
      orig:          product.orig || product.price || 0,
      affiliate_url: product.affiliate_url || "",
      timestamp:     Date.now(),
    });
    localStorage.setItem("alitrack_price_history", JSON.stringify(hist.slice(0, 50)));
  } catch {}
};
