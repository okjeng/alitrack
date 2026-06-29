// AliTrack 순수 유틸리티 함수 모음
// 모든 함수는 React에 의존하지 않는 순수 함수로 단위 테스트 가능

import type { Product, LocalAlert, PricePoint, WishlistItem, HistoryItem } from "./types";

export const ALI_TRACKING_ID = "alitrack_kr";

// ─── 포맷/수학 ────────────────────────────────────────────────────
export const fmt      = (n: number): string => n.toLocaleString("ko-KR") + "원";
export const avg60    = (h: PricePoint[]): number => Math.round(h.reduce((s, d) => s + d.price, 0) / h.length / 100) * 100;
export const idToSeed = (id: string): number => id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 9301;

// ─── GA4 이벤트 헬퍼 ─────────────────────────────────────────────
export const trackEvent = (name: string, params: Record<string, unknown> = {}): void => {
  try { if (typeof (window as Window & { gtag?: Function }).gtag === "function") (window as Window & { gtag: Function }).gtag("event", name, params); } catch {}
};

// ─── API 응답 변환 ────────────────────────────────────────────────
export const mapProduct = (p: Record<string, unknown>): Product => {
  const disc = (p.discount as number) || 0;
  const tag =
    disc >= 50 ? "역대최저" :
    disc >= 30 ? "핫딜" :
    disc >= 20 ? "최저가근접" :
    disc >= 10 ? "특가" : "핫딜";
  let imgUrl = (p.image as string) || "";
  if (imgUrl.startsWith("http://")) imgUrl = "https://" + imgUrl.slice(7);
  return {
    id:           String(p.id || ""),
    name:         (p.name as string) || "",
    shortName:    ((p.name as string) || "").split(/\s+/).slice(0, 3).join(" "),
    price:        (p.price as number) || 0,
    orig:         (p.orig_price as number) || (p.price as number) || 0,
    discount:     disc,
    image:        imgUrl || "https://placehold.co/320x320/EEF2FF/6366F1?text=📦",
    tag,
    deliveryDays: (p.delivery_days as number) || 0,
    rating:       (p.rating as number) || 0,
    reviews:      (p.reviews as number) || 0,
    affiliate_url: (p.affiliate_url as string) || "",
  };
};

// ─── URL ─────────────────────────────────────────────────────────
export const buildAffiliateUrl = (productId: string, affiliateUrl: string | undefined): string => {
  if (affiliateUrl && !affiliateUrl.includes("s.click.aliexpress.com")) return affiliateUrl;
  return `https://ko.aliexpress.com/item/${productId}.html?aff_fcid=${ALI_TRACKING_ID}&aff_platform=portals-tool&sk=${ALI_TRACKING_ID}&aff_trace_key=${ALI_TRACKING_ID}`;
};

// ─── 클립보드 ─────────────────────────────────────────────────────
export const copyToClipboard = async (text: string): Promise<void> => {
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
export const generateHistory = (current: number, seed: number): PricePoint[] => {
  const pts: PricePoint[] = []; const today = new Date();
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
export const rankBySearch = (
  items: Array<{ name: string; shortName?: string; tag?: string }>,
  keyword: string,
): Array<{ name: string; shortName?: string; tag?: string }> => {
  if (!keyword) return items;
  const kw = keyword.toLowerCase().trim();
  const words = kw.split(/\s+/).filter(Boolean);
  const score = (item: { name: string; shortName?: string; tag?: string }): number => {
    if (item.name.toLowerCase() === kw) return 4;
    const text = [item.name, item.shortName, item.tag].filter(Boolean).join(" ").toLowerCase();
    if (text.includes(kw)) return text.startsWith(kw) ? 3 : 2;
    const hits = words.filter(w => text.includes(w)).length;
    return hits > 0 ? hits / words.length : 0;
  };
  return [...items]
    .filter(item => score(item) > 0)
    .sort((a, b) => score(b) - score(a));
};

// ─── localStorage 헬퍼 ───────────────────────────────────────────
export const getGuestId = (): string => {
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

export const getLocalAlerts = (): LocalAlert[] => {
  try { return JSON.parse(localStorage.getItem("alitrack_local_alerts") || "[]"); } catch { return []; }
};
export const saveLocalAlert = (alert: LocalAlert): void => {
  try {
    const list = getLocalAlerts().filter(a => a.product_id !== alert.product_id);
    list.push(alert);
    localStorage.setItem("alitrack_local_alerts", JSON.stringify(list));
  } catch {}
};
export const removeLocalAlert = (productId: string): void => {
  try {
    localStorage.setItem("alitrack_local_alerts",
      JSON.stringify(getLocalAlerts().filter(a => a.product_id !== productId)));
  } catch {}
};

export const getLocalWishlist = (): WishlistItem[] => {
  try { return JSON.parse(localStorage.getItem("alitrack_wishlist") || "[]"); } catch { return []; }
};
export const toggleLocalWish = (product: Product): boolean => {
  try {
    const list = getLocalWishlist();
    const idx  = list.findIndex(p => p.id === product.id);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.push({ id: product.id, name: product.name, price: product.price, image_url: product.image }); }
    localStorage.setItem("alitrack_wishlist", JSON.stringify(list));
    return idx < 0;
  } catch { return false; }
};

export const getPriceHistory = (): HistoryItem[] => {
  try { return JSON.parse(localStorage.getItem("alitrack_price_history") || "[]"); } catch { return []; }
};
export const savePriceHistory = (product: Product): void => {
  try {
    let hist = getPriceHistory().filter(h => h.productId !== String(product.id));
    hist.unshift({
      productId:     String(product.id),
      id:            product.id,
      name:          product.name || "",
      shortName:     product.shortName || "",
      image:         product.image || "",
      price:         product.price || 0,
      orig:          product.orig || product.price || 0,
      discount:      product.discount || 0,
      tag:           product.tag || "",
      deliveryDays:  product.deliveryDays || 0,
      rating:        product.rating || 0,
      reviews:       product.reviews || 0,
      affiliate_url: product.affiliate_url || "",
      timestamp:     Date.now(),
    });
    localStorage.setItem("alitrack_price_history", JSON.stringify(hist.slice(0, 50)));
  } catch {}
};
