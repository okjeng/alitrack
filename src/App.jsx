/**
 * AliTrack — 알리익스프레스 가격 추적 웹앱 v4.1
 * ✅ 무한 스크롤 완전 구현 — 더미 데이터 자동 무한 생성
 *    API 연동 시 generateDummyPage() 함수만 실제 API 호출로 교체하면 됩니다.
 *
 * 필요한 패키지: npm install recharts
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  trackEvent, fmt, avg60, idToSeed,
  mapProduct, buildAffiliateUrl, copyToClipboard, generateHistory, rankBySearch,
  getGuestId, getLocalAlerts, saveLocalAlert, removeLocalAlert,
  getLocalWishlist, toggleLocalWish, getPriceHistory, savePriceHistory,
  ALI_TRACKING_ID,
} from "./utils.js";

// ═══════════════════════════════════════════════════════════════════
// 더미 상품 템플릿 — API 연동 시 이 블록 교체
// ═══════════════════════════════════════════════════════════════════
const PRODUCT_TEMPLATES = [
  { namePrefix:"Xiaomi 레드미 노트",    shortPrefix:"레드미 노트",     basePrice:189000, image:"https://placehold.co/320x320/EEF2FF/6366F1?text=📱", tag:"역대최저",   deliveryDays:5, rating:4.8 },
  { namePrefix:"UGREEN GaN 충전기",     shortPrefix:"GaN 충전기",      basePrice:28500,  image:"https://placehold.co/320x320/FFF7ED/F97316?text=⚡", tag:"핫딜",       deliveryDays:4, rating:4.7 },
  { namePrefix:"Anker Soundcore",       shortPrefix:"Soundcore",       basePrice:45900,  image:"https://placehold.co/320x320/F0FDF4/22C55E?text=🎧", tag:"최저가근접", deliveryDays:5, rating:4.6 },
  { namePrefix:"Baseus 맥세이프",       shortPrefix:"맥세이프 거치대", basePrice:12800,  image:"https://placehold.co/320x320/FFF1F2/FB7185?text=📲", tag:"긴급핫딜",   deliveryDays:3, rating:4.5 },
  { namePrefix:"Haylou GT 이어폰",      shortPrefix:"Haylou GT",       basePrice:4800,   image:"https://placehold.co/320x320/F0F9FF/38BDF8?text=🎵", tag:"특가",       deliveryDays:5, rating:4.4 },
  { namePrefix:"Xiaomi 스마트워치",     shortPrefix:"샤오미 워치",     basePrice:62000,  image:"https://placehold.co/320x320/FDF4FF/C084FC?text=⌚", tag:"역대최저",   deliveryDays:5, rating:4.7 },
  { namePrefix:"Toocki GaN 미니 충전기",shortPrefix:"Toocki 충전기",   basePrice:3900,   image:"https://placehold.co/320x320/FFFBEB/FCD34D?text=🔌", tag:"핫딜",       deliveryDays:4, rating:4.5 },
  { namePrefix:"ELEGOO RGB 무드등",     shortPrefix:"RGB 무드등",      basePrice:8900,   image:"https://placehold.co/320x320/ECFDF5/34D399?text=💡", tag:"최저가근접", deliveryDays:5, rating:4.3 },
  { namePrefix:"Joyroom 케이블 세트",   shortPrefix:"케이블 세트",     basePrice:7500,   image:"https://placehold.co/320x320/EFF6FF/60A5FA?text=🔌", tag:"특가",       deliveryDays:3, rating:4.6 },
  { namePrefix:"Baseus 무선충전 패드",  shortPrefix:"무선충전 패드",   basePrice:4500,   image:"https://placehold.co/320x320/FFF1F2/F43F5E?text=⚡", tag:"긴급핫딜",   deliveryDays:5, rating:4.4 },
  { namePrefix:"Xiaomi 공기청정기",     shortPrefix:"샤오미 공기청정기",basePrice:89000, image:"https://placehold.co/320x320/F0FDF4/4ADE80?text=🌀", tag:"역대최저",   deliveryDays:5, rating:4.8 },
  { namePrefix:"LED 마스크팩 기기",     shortPrefix:"LED 마스크팩",    basePrice:32000,  image:"https://placehold.co/320x320/FFF7ED/FB923C?text=💄", tag:"핫딜",       deliveryDays:4, rating:4.5 },
  { namePrefix:"HAGIBIS USB-C 허브",    shortPrefix:"USB-C 허브",      basePrice:24900,  image:"https://placehold.co/320x320/F0F0FF/818CF8?text=🔌", tag:"특가",       deliveryDays:5, rating:4.6 },
  { namePrefix:"Baseus 보조배터리",     shortPrefix:"보조배터리",      basePrice:28900,  image:"https://placehold.co/320x320/FFF8F0/FB923C?text=🔋", tag:"역대최저",   deliveryDays:3, rating:4.7 },
  { namePrefix:"Xiaomi 게이밍 마우스",  shortPrefix:"게이밍 마우스",   basePrice:16500,  image:"https://placehold.co/320x320/F0FFF8/34D399?text=🖱", tag:"핫딜",       deliveryDays:5, rating:4.4 },
  { namePrefix:"UGREEN 노트북 거치대",  shortPrefix:"노트북 거치대",   basePrice:19900,  image:"https://placehold.co/320x320/F8F0FF/C084FC?text=💻", tag:"최저가근접", deliveryDays:4, rating:4.5 },
  { namePrefix:"샤오미 스마트 플러그",  shortPrefix:"스마트 플러그",   basePrice:8500,   image:"https://placehold.co/320x320/ECFDF5/10B981?text=🔌", tag:"특가",       deliveryDays:5, rating:4.3 },
  { namePrefix:"Anker 마그네틱 케이블", shortPrefix:"마그네틱 케이블", basePrice:12000,  image:"https://placehold.co/320x320/EFF6FF/3B82F6?text=🔌", tag:"핫딜",       deliveryDays:4, rating:4.6 },
  { namePrefix:"JMGO 미니 빔프로젝터",  shortPrefix:"미니 빔프로젝터", basePrice:145000, image:"https://placehold.co/320x320/FDF4FF/A855F7?text=📽", tag:"역대최저",   deliveryDays:5, rating:4.7 },
  { namePrefix:"Dreame 무선 청소기",    shortPrefix:"무선 청소기",     basePrice:178000, image:"https://placehold.co/320x320/F0FDF4/22C55E?text=🌀", tag:"긴급핫딜",   deliveryDays:5, rating:4.8 },
];

const PAGE_SIZE = 20;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://alitrack-production.up.railway.app";


// ── 핵심: 더미 페이지 생성 함수 ──────────────────────────────────
// API 연동 시 이 함수만 fetch('/api/products?page='+page) 로 교체
const generateDummyPage = (page) => {
  return new Promise((resolve) => {
    // 실제 API처럼 0.6초 딜레이 시뮬레이션
    setTimeout(() => {
      const items = Array.from({ length: PAGE_SIZE }, (_, i) => {
        const globalIdx = (page - 1) * PAGE_SIZE + i;
        const tmpl = PRODUCT_TEMPLATES[globalIdx % PRODUCT_TEMPLATES.length];
        const variation = Math.floor(globalIdx / PRODUCT_TEMPLATES.length);
        const priceVariant = Math.round((tmpl.basePrice * (0.85 + Math.random() * 0.3)) / 100) * 100;
        const origVariant  = Math.round(priceVariant * (1.2 + Math.random() * 0.4) / 100) * 100;
        const discount     = Math.round((1 - priceVariant / origVariant) * 100);
        const reviewCount  = Math.floor(Math.random() * 5000) + 200;
        const ratingVar    = +(tmpl.rating - 0.1 + Math.random() * 0.2).toFixed(1);
        return {
          id:          `p${String(globalIdx + 1).padStart(4,"0")}`,
          name:        `${tmpl.namePrefix} ${variation > 0 ? `(${["Pro","Max","Ultra","Plus","Neo"][variation % 5]})` : ""}`.trim(),
          shortName:   tmpl.shortPrefix,
          price:       priceVariant,
          orig:        origVariant,
          discount,
          image:       tmpl.image,
          tag:         tmpl.tag,
          deliveryDays:tmpl.deliveryDays,
          rating:      Math.min(5.0, ratingVar),
          reviews:     reviewCount,
        };
      });
      resolve(items);
    }, 600);
  });
};

// ═══════════════════════════════════════════════════════════════════
// 기타 더미 데이터
// ═══════════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id:"domestic",  icon:"🏠", label:"한국배송",  keyword:"sport",       sort:"default"   },
  { id:"cheap",     icon:"💸", label:"초저가템",  keyword:"",            sort:"price_asc" },
  { id:"popular",   icon:"🏆", label:"인기랭킹",  keyword:"",            sort:"default"   },
  { id:"reviewed",  icon:"⭐", label:"리뷰많은",  keyword:"gadget",      sort:"default"   },
  { id:"limited",   icon:"⚡", label:"한정특가",  keyword:"sale",        sort:"discount"  },
  { id:"value",     icon:"💎", label:"실속상품",  keyword:"home",        sort:"discount"  },
  { id:"monthly",   icon:"🗓️", label:"월간옵션", keyword:"fashion",     sort:"default"   },
  { id:"freeship",  icon:"🚚", label:"무료배송",  keyword:"outdoor",     sort:"default"   },
];

const daysFromNow = (days) => {
  if (days === 0) return "오늘 자정 만료";
  const d = new Date(); d.setDate(d.getDate() + days);
  return `${d.getMonth()+1}/${d.getDate()} 만료 (D-${days})`;
};

const DISCOUNT_CODES = [
  { code:"ALIMAX15",  desc:"전품목 15% 할인",          expire:daysFromNow(0),  color:"#FF5A1F" },
  { code:"NEWUSER30", desc:"신규 가입자 30% 추가 할인", expire:daysFromNow(3),  color:"#6366F1" },
  { code:"SHIP999",   desc:"배송비 999원 고정",         expire:daysFromNow(7),  color:"#00C07F" },
  { code:"SUMMER10",  desc:"여름 시즌 10% 특별 할인",   expire:daysFromNow(14), color:"#F59E0B" },
];

const PROMO_BANNERS = [
  { id:"b1", title:"2026 알리 메가 세일",  sub:"선착순 최대 50% 특가",     badge:"🎊 메가세일",   bg:"linear-gradient(135deg,#FF5A1F,#f7462a)",  products:["갤럭시 버즈","스마트워치","충전기"], keyword:"electronics",  sort:"discount"  },
  { id:"b2", title:"공식 브랜드 위크",     sub:"샤오미·안커·바세우스 특가", badge:"🏷 브랜드위크", bg:"linear-gradient(135deg,#6366F1,#8B5CF6)",  products:["노트북","이어폰","스마트홈"],        keyword:"gadget",       sort:"default"   },
  { id:"b3", title:"플래시 딜 3시간",      sub:"오늘만 이 가격!",           badge:"⚡ 긴급",       bg:"linear-gradient(135deg,#0EA5E9,#6366F1)",  products:["케이블","보조배터리","거치대"],      keyword:"sale",         sort:"discount"  },
  { id:"b4", title:"무료배송 페스티벌",    sub:"전품목 무료배송 이벤트",    badge:"🚚 무배축제",   bg:"linear-gradient(135deg,#10B981,#0EA5E9)",  products:["생활용품","뷰티","주방"],            keyword:"beauty",       sort:"default"   },
  { id:"b5", title:"5일 특급 배송전",      sub:"5일 내 도착 보장 상품만",   badge:"🚀 5일배송",    bg:"linear-gradient(135deg,#F59E0B,#EF4444)",  products:["전자제품","패션","홈데코"],          keyword:"fashion",      sort:"default"   },
];

// ═══════════════════════════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════════════════════════
// 순수 유틸 함수는 src/utils.js 에서 import
// ═══════════════════════════════════════════════════════════════════
const NAV_H = 56;
const BTN_H = 72;

// ═══════════════════════════════════════════════════════════════════
// 핵심 훅: useInfiniteProducts — AliExpress API 연동
// ═══════════════════════════════════════════════════════════════════
const useInfiniteProducts = (keyword = "", sort = "default") => {
  const [items, setItems]             = useState([]);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError]             = useState(null);
  const loaderRef   = useRef(null);
  const loadingRef  = useRef(false);
  const hasMoreRef  = useRef(true);

  const fetchPage = useCallback(async (pageNum) => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({ page: pageNum, size: PAGE_SIZE, sort });
      if (keyword) params.set("keyword", keyword);
      const res  = await fetch(`${API_BASE}/api/ali/products?${params}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const newItems = (data.products || []).map(mapProduct);
      if (newItems.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const unique = newItems.filter(p => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setPage(pageNum);
      }
    } catch (e) {
      clearTimeout(timeout);
      setError(e.name === "AbortError" ? "요청 시간이 초과됐습니다." : "상품을 불러오지 못했습니다.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized, keyword, sort]);

  useEffect(() => { fetchPage(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          fetchPage(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, fetchPage]);

  return { items, loading, initialized, loaderRef, hasMore, error, retry: () => fetchPage(page + 1) };
};

// ═══════════════════════════════════════════════════════════════════
// 공통 UI
// ═══════════════════════════════════════════════════════════════════
const TAG_COLORS = {
  역대최저:"bg-red-500", 핫딜:"bg-orange-500",
  최저가근접:"bg-blue-500", 긴급핫딜:"bg-pink-500", 특가:"bg-green-600",
};

const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

const Toast = ({ msg, visible }) => (
  <div className={`fixed z-[300] left-1/2 -translate-x-1/2 transition-all duration-300 ${visible?"opacity-100 translate-y-0":"opacity-0 -translate-y-2 pointer-events-none"}`}
       style={{ top:"calc(env(safe-area-inset-top,0px) + 20px)" }}>
    <div className="bg-gray-900 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap flex items-center gap-2">
      ✅ {msg}
    </div>
  </div>
);

// 스켈레톤 카드 — 로딩 중 표시
const SkeletonCard = () => (
  <div className="rounded-2xl bg-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-2/5" />
    </div>
  </div>
);

// 로딩 스피너 (페이지 하단)
const LoadingSpinner = () => (
  <div className="flex flex-col items-center py-8 gap-3">
    <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"
         style={{ borderWidth:3, animation:"spin 0.8s linear infinite" }} />
    <p className="text-xs text-gray-400">상품을 불러오는 중...</p>
  </div>
);

const LegalFooter = () => (
  <div className="bg-[#F9F9F9] rounded-2xl px-4 py-5 space-y-2.5 mt-6">
    {[
      "본 서비스의 가격 분석 및 최저가 정보는 수집된 데이터를 기반으로 한 독립적인 분석 결과이며, 실제 판매 가격과 다를 수 있습니다.",
      "상품 가격은 실시간으로 변동될 수 있으므로, 최종 구매 전 해당 쇼핑몰에서 결제 금액을 반드시 재확인하시기 바랍니다.",
      "본 서비스는 제휴 마케팅 프로그램에 참여하고 있으며, 링크를 통한 구매 시 소정의 수수료를 받을 수 있습니다.",
      "발생한 수익은 광고 없는 무료 가격 추적 서비스의 안정적인 운영 및 고도화에 전액 재투자됩니다.",
    ].map((t,i) => <p key={i} style={{fontSize:11,color:"#8E8E93",lineHeight:1.65}}>· {t}</p>)}
    <div className="pt-2 border-t border-gray-200 flex justify-between">
      <p style={{fontSize:10,color:"#C7C7CC"}}>© 2026 AliTrack. All rights reserved.</p>
      <p style={{fontSize:10,color:"#C7C7CC"}}>v4.1.0</p>
    </div>
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-orange-400">{payload[0].value.toLocaleString("ko-KR")}원</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ProductCard
// ═══════════════════════════════════════════════════════════════════
const ProductCard = ({ product:p, onProduct }) => {
  const hist = useMemo(() => generateHistory(p.price, idToSeed(p.id)), [p.id, p.price]);
  const av   = useMemo(() => avg60(hist), [hist]);
  const diff = av - p.price;

  return (
    <button onClick={() => onProduct(p)} aria-label={`${p.name} 상세보기`}
      className="rounded-2xl bg-[#F7F7F8] overflow-hidden text-left active:opacity-75 transition w-full">
      <div className="relative">
        <img src={p.image} alt={p.shortName} loading="lazy"
          className="w-full aspect-square object-cover"
          onError={e => { e.currentTarget.src = "https://placehold.co/320x320/EEF2FF/6366F1?text=📦"; e.currentTarget.onerror = null; }} />
        <span className={`absolute top-2 left-2 text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full ${TAG_COLORS[p.tag]||"bg-gray-500"}`}>
          {p.tag}
        </span>
      </div>
      <div className="p-2.5 space-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00C07F] bg-green-50 px-1.5 py-0.5 rounded-full">
          🚀 {p.deliveryDays}일 내 도착
        </span>
        <p className="text-[11px] font-semibold text-gray-800 leading-snug"
           style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-base font-extrabold text-gray-900">{fmt(p.price)}</p>
          {p.discount > 0
            ? <span className="text-[11px] font-bold text-red-500">▼ {p.discount}%</span>
            : p.discount < 0
            ? <span className="text-[11px] font-bold text-blue-500">▲ {Math.abs(p.discount)}%</span>
            : null}
        </div>
        <p className="text-[9px] text-gray-400 leading-tight">*API 참고가 · 실제가 다를 수 있음</p>
        {diff > 0
          ? <p className="text-[10px] text-orange-500 font-semibold leading-tight">평균 대비 {fmt(Math.round(diff/100)*100)} 저렴!</p>
          : <p className="text-[10px] text-blue-500 font-semibold">현재 최저가 근접 중</p>
        }
        <p className="text-[10px] text-gray-400">⭐ {p.rating} ({p.reviews.toLocaleString()})</p>
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ✅ 무한 스크롤 상품 그리드 (공용) — 홈 / 카테고리 피드 공유
// ═══════════════════════════════════════════════════════════════════
const InfiniteProductGrid = ({ onProduct, title, keyword, sort, rankKeyword }) => {
  const { items, loading, initialized, loaderRef, hasMore, error, retry } = useInfiniteProducts(keyword, sort);
  const displayItems = useMemo(
    () => rankKeyword ? rankBySearch(items, rankKeyword) : items,
    [items, rankKeyword]
  );

  return (
    <div>
      {title && <p className="text-sm font-bold text-gray-900 mb-3">{title}</p>}

      {/* API 오류 */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm font-bold text-gray-700">{error}</p>
          <button onClick={retry}
            className="px-5 py-2.5 rounded-2xl bg-orange-500 text-white text-xs font-bold active:bg-orange-600 transition">
            다시 시도
          </button>
        </div>
      )}

      {/* 첫 로드 전 — 스켈레톤 전체 표시 */}
      {!error && !initialized ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(8).fill(0).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : !error && displayItems.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">🔍</span>
          <p className="text-sm font-bold text-gray-700">검색 결과가 없어요</p>
          <p className="text-xs text-gray-400 text-center">다른 검색어를 입력하거나<br/>맞춤법을 확인해 주세요</p>
        </div>
      ) : !error ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {displayItems.map(p => <ProductCard key={p.id} product={p} onProduct={onProduct} />)}

            {/* 추가 로드 중 — 하단에 스켈레톤 2개 */}
            {loading && <><SkeletonCard /><SkeletonCard /></>}
          </div>

          {/* 로더 감지 영역 */}
          <div ref={loaderRef}>
            {loading && <LoadingSpinner />}
            {!hasMore && items.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-6">모든 상품을 불러왔습니다</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 하단 네비 (NAV_ITEMS_FULL 5탭 — App 컴포넌트 내에 정의)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 모달: 이메일 회원가입 / 로그인
// ═══════════════════════════════════════════════════════════════════
const EmailAuthModal = ({ onDismiss, onLoginSuccess }) => {
  const [tab, setTab]       = useState("register"); // "register" | "login"
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [loading, setLoad]  = useState(false);
  const [err, setErr]       = useState("");

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) { setErr("올바른 이메일을 입력해주세요."); return; }
    if (pw.length < 8) { setErr("비밀번호는 8자 이상이어야 합니다."); return; }
    setLoad(true);
    try {
      const endpoint = tab === "register" ? "/api/auth/email/register" : "/api/auth/email/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.detail || "오류가 발생했습니다."); return; }
      try { sessionStorage.setItem("ali_token", data.token); } catch {}
      onLoginSuccess({ user_id: data.user_id || "", email: data.email, provider: "email", logged_in: true });
      onDismiss();
    } catch { setErr("네트워크 오류가 발생했습니다."); }
    finally { setLoad(false); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 28px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* 탭 */}
        <div className="flex bg-[#F7F7F8] rounded-2xl p-1 mb-5">
          {[["register","회원가입"],["login","로그인"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setTab(v);setErr("");}}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${tab===v?"bg-white text-gray-900 shadow-sm":"text-gray-400"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* 혜택 카드 */}
        <div className="bg-[#EFF6FF] rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-blue-700 mb-2">📧 이메일 가입 혜택</p>
          <div className="grid grid-cols-2 gap-y-1.5">
            {["📈 가격기록 영구 보관","❤️ 관심상품 영구 저장","🔔 최저가 알림 이메일 수신","🔄 기기 변경 시 데이터 연동"].map(b=>(
              <p key={b} className="text-[11px] text-blue-800">{b}</p>
            ))}
          </div>
        </div>

        {/* 입력 */}
        <div className="space-y-3 mb-3">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 transition"
            onKeyDown={e=>e.key==="Enter" && submit()} />
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            placeholder="비밀번호 (8자 이상)"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 transition"
            onKeyDown={e=>e.key==="Enter" && submit()} />
        </div>
        {err && <p className="text-xs text-red-500 mb-3 px-1">{err}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm active:bg-blue-600 transition disabled:opacity-60">
          {loading ? "처리 중..." : (tab==="register" ? "이메일로 가입하기" : "로그인")}
        </button>
        <button onClick={onDismiss} className="w-full mt-3 py-2.5 text-xs text-gray-400">나중에 하기</button>
      </div>
    </div>
  );
};

// 모달: 공유 (모든 사용자 가능)
const ShareSheet = ({ product, onClose, showToast }) => {
  const url = `https://alitrack.kr/p/${product.id}`;

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `[AliTrack] ${product.name}`, url });
        showToast("공유되었어요!");
      } catch (e) {
        if (e.name !== "AbortError") showToast("공유에 실패했어요.");
      }
    } else {
      await copyToClipboard(url);
      showToast("링크가 복사되었습니다!");
    }
    onClose();
  };

  const copy = async () => {
    try { await copyToClipboard(url); showToast("링크가 복사되었습니다!"); }
    catch { showToast("복사 실패. 다시 시도해주세요."); }
    onClose();
  };

  const actions = [
    { label:"카카오·SNS 공유하기", icon:"💬", action: shareNative },
    { label:"링크 복사하기",        icon:"🔗", action: copy },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-sm font-bold text-gray-900 mb-4">공유하기</p>
        {actions.map(i=>(
          <button key={i.label} onClick={i.action}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition text-sm font-semibold text-gray-800 mb-2">
            <span className="text-xl">{i.icon}</span>{i.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 웹 푸시 구독 헬퍼
async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    // VAPID 공개 키 조회
    const res  = await fetch(`${API_BASE}/api/push/vapid-public`);
    if (!res.ok) return null;
    const { public_key } = await res.json();

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: public_key,
    });
    const json  = sub.toJSON();
    const auth  = btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth"))));
    const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh"))));
    return { endpoint: json.endpoint, auth, p256dh };
  } catch { return null; }
}

// 모달: 최저가 알림 신청 (웹 푸시 방식)
// ═══════════════════════════════════════════════════════════════════
const AlertModal = ({ product, user, onClose, showToast }) => {
  const [step, setStep]       = useState("price");
  const [target, setTarget]   = useState(String(Math.round((product?.price || 0) * 0.9)));
  const [loading, setLoad]    = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const curPrice = product?.price || 0;
  const targetPrice = useRef(0);

  const goToPush = () => {
    const price = parseInt(target.replace(/[^0-9]/g,""), 10);
    if (!price || price <= 0) { showToast("올바른 가격을 입력해주세요."); return; }
    targetPrice.current = price;
    // 항상 로컬 저장 (웹 푸시 백업)
    saveLocalAlert({ product_id: product.id, product_name: product.name, image: product.image,
                     target_price: price, current_price: curPrice, saved_at: new Date().toISOString() });
    trackEvent("alert_set", { product_id: product.id, product_name: product.name, target_price: price, current_price: curPrice });
    setStep("push");
  };

  const requestPush = async () => {
    setLoad(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushGranted(false);
        setStep("done");
        return;
      }
      const sub = await subscribePush();
      if (sub) {
        // 백엔드에 구독 정보 + 목표가 전송
        await fetch(`${API_BASE}/api/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint:     sub.endpoint,
            auth:         sub.auth,
            p256dh:       sub.p256dh,
            product_id:   String(product.id),
            target_price: targetPrice.current,
            guest_id:     getGuestId(),
          }),
        });
        // 나중에 해제할 때 쓸 endpoint를 로컬 알림에 같이 저장
        const cur = getLocalAlerts().find(a => a.product_id === String(product.id));
        if (cur) saveLocalAlert({ ...cur, push_endpoint: sub.endpoint });
        setPushGranted(true);
      }
    } catch { /* 권한 거부 등 무시 */ }
    finally { setLoad(false); }
    setStep("done");
  };

  const skipPush = () => setStep("done");

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 28px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        {step === "price" && (
          <>
            <p className="text-lg font-extrabold text-gray-900 mb-1">최저가 알림 신청 🔔</p>
            <p className="text-xs text-gray-400 mb-4">목표 가격 도달 시 브라우저로 바로 알려드려요</p>
            <div className="bg-[#F7F7F8] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">현재 가격</span>
              <span className="text-base font-extrabold text-gray-900">{fmt(curPrice)}</span>
            </div>
            <p className="text-xs font-bold text-gray-700 mb-2">목표 가격</p>
            <div className="flex items-center border-2 border-orange-400 rounded-2xl px-4 mb-1 bg-white">
              <input type="number" value={target} onChange={e=>setTarget(e.target.value)}
                className="flex-1 py-3.5 text-xl font-bold outline-none bg-transparent"
                onKeyDown={e=>e.key==="Enter" && goToPush()} />
              <span className="text-sm text-gray-400 font-bold ml-1">원</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-5">현재보다 낮게 설정하세요 (예: {fmt(Math.round(curPrice*0.9))})</p>
            <button onClick={goToPush}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
              다음
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">가입 없이 바로 신청 가능</p>
          </>
        )}

        {step === "push" && (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">🔔</div>
              <p className="text-lg font-extrabold text-gray-900">브라우저 알림 허용</p>
              <p className="text-xs text-gray-400 mt-1">
                목표가 <span className="text-orange-500 font-bold">{fmt(targetPrice.current)}</span> 도달 시 바로 알려드려요
              </p>
            </div>
            <div className="bg-[#FFF7ED] rounded-2xl p-4 mb-5 space-y-2">
              {["📱 앱 설치 없이 브라우저 알림","🔕 언제든 설정에서 알림 끄기 가능","✅ iPhone·갤럭시·PC 모두 지원"].map(t=>(
                <p key={t} className="text-xs text-gray-700">{t}</p>
              ))}
            </div>
            <button onClick={requestPush} disabled={loading}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition disabled:opacity-60 mb-2">
              {loading ? "처리 중..." : "알림 허용하기"}
            </button>
            <button onClick={skipPush}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-400 bg-gray-50 active:bg-gray-100 transition">
              나중에 허용
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">
                {pushGranted ? "🔔" : "✅"}
              </div>
              <p className="text-lg font-extrabold text-gray-900">
                {pushGranted ? "알림이 설정됐어요!" : "알림이 등록됐어요!"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {pushGranted
                  ? `목표가 ${fmt(targetPrice.current)} 도달 시 브라우저로 알림을 드려요`
                  : "이 기기의 가격기록에 저장했어요"}
              </p>
            </div>
            <button onClick={onClose}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 화면 1: 홈
// ═══════════════════════════════════════════════════════════════════
const HomeScreen = ({ onCategory, onProduct, showLogin, showToast, onInstall, showInstallBanner, onDismissInstall }) => {
  const [tab, setTab]             = useState("hotdeal");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [catLoading, setCatLoading] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const isPaused    = useRef(false);
  const bannerTimer = useRef(null);
  const touchStartX = useRef(null);

  useEffect(()=>{
    bannerTimer.current = setInterval(()=>{ if(!isPaused.current) setBannerIdx(i=>(i+1)%PROMO_BANNERS.length); }, 3500);
    return ()=>clearInterval(bannerTimer.current);
  },[]);

  const handleBannerTouchStart = (e) => {
    isPaused.current = true;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleBannerTouchEnd = (e) => {
    isPaused.current = false;
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setBannerIdx(i => (i + 1) % PROMO_BANNERS.length);
    else           setBannerIdx(i => (i - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  };

  const handleCategory = (cat) => {
    setActiveCat(cat.id); setCatLoading(true);
    setTimeout(()=>{ setCatLoading(false); onCategory(cat); }, 600);
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setActiveSearch(q);
    trackEvent("search", { search_term: q });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const copyCode = async (code) => {
    try { await copyToClipboard(code); showToast(`"${code}" 코드가 복사되었습니다!`); }
    catch { showToast("복사 실패. 직접 코드를 선택해주세요."); }
  };

  const b = PROMO_BANNERS[bannerIdx];

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* 앱 설치 배너 — Android: 자동설치 / iOS: 안내 */}
      {showInstallBanner && (
        <PwaInstallBanner onInstall={onInstall} onDismiss={onDismissInstall} />
      )}

      {/* 검색창 */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setActiveSearch(""); }}
            onFocus={e => e.target.select()}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="알리 꿀템 검색"
            aria-label="상품 검색"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#F7F7F8] text-sm text-gray-800 placeholder-gray-400 outline-none" />
          {searchQuery && (
            <button onClick={clearSearch} aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center active:bg-gray-400 transition"
              style={{fontSize:10, fontWeight:800, color:"#fff", lineHeight:1}}>
              ✕
            </button>
          )}
        </div>
        <button onClick={handleSearch} aria-label="검색 실행"
          className="px-4 py-3.5 rounded-2xl bg-orange-500 active:bg-orange-600 text-white text-sm font-bold transition flex-shrink-0">
          검색
        </button>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-100">
        {[{id:"hotdeal",label:"🔥 실시간 핫딜"},{id:"coupon",label:"🎟 오늘의 할인코드"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex-1 pb-2.5 text-sm font-semibold relative transition-colors ${tab===t.id?"text-gray-900":"text-gray-400"}`}>
            {t.label}
            {tab===t.id&&<span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 rounded-full"/>}
          </button>
        ))}
      </div>

      {tab==="hotdeal" ? (
        <>
          {/* 다크 배너 */}
          <div className="rounded-3xl p-5 text-white cursor-pointer active:opacity-80 transition"
               style={{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)"}}
               onClick={()=>document.getElementById('hot-products-section')?.scrollIntoView({behavior:'smooth'})}>
            <p className="text-xs text-blue-300 font-semibold mb-1 tracking-widest uppercase">AliTrack · 가성비 분석</p>
            <p className="text-lg font-extrabold leading-snug">알리 직구 타이밍의 시간,<br/>찐 가성비 러버가 되어볼까? 🚀</p>
            <p className="text-xs text-blue-200 mt-2">지금 바로 핫딜 확인하기 →</p>
          </div>

          {/* 카테고리 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">카테고리</p>
            {catLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array(8).fill(0).map((_,i)=>(
                  <div key={i} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gray-100 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-gray-200"/><div className="w-10 h-2.5 rounded bg-gray-200"/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat=>(
                  <button key={cat.id} onClick={()=>handleCategory(cat)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition active:scale-95 ${activeCat===cat.id?"bg-orange-50 ring-1 ring-orange-300":"bg-[#F7F7F8]"}`}>
                    <span className="text-2xl leading-none">{cat.icon}</span>
                    <span className="text-[11px] text-gray-600 font-semibold text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 슬라이드 배너 */}
          <div className="rounded-3xl overflow-hidden cursor-pointer"
               onMouseEnter={()=>{isPaused.current=true;}} onMouseLeave={()=>{isPaused.current=false;}}
               onTouchStart={handleBannerTouchStart} onTouchEnd={handleBannerTouchEnd}
               onClick={()=>onCategory({id:b.id, icon:b.badge.charAt(0), label:b.title, keyword:b.keyword, sort:b.sort})}>
            <div style={{background:b.bg, transition:"background 0.5s"}}>
              <div className="p-5 text-white">
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{b.badge}</span>
                <p className="text-xl font-extrabold mt-3 leading-snug">{b.title}</p>
                <p className="text-sm text-white/80 mt-1">{b.sub}</p>
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                  {b.products.map((pr,i)=>(
                    <span key={i} className="flex-shrink-0 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">{pr}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 px-5 py-3 flex items-center justify-between">
                <span className="text-white text-xs">👆 지금 바로 확인하기</span>
                <div className="flex gap-1.5 items-center">
                  {PROMO_BANNERS.map((_,i)=>(
                    <button key={i} onClick={(e)=>{e.stopPropagation();setBannerIdx(i);}}
                      className={`rounded-full transition-all duration-300 ${i===bannerIdx?"w-4 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/40"}`}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 무한 스크롤 상품 그리드 — 검색 시 인라인 교체 */}
          {activeSearch ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">🔍 &ldquo;{activeSearch}&rdquo; 검색결과</p>
                <button onClick={clearSearch}
                  className="text-xs text-orange-500 font-semibold active:text-orange-600 transition">
                  초기화
                </button>
              </div>
              <InfiniteProductGrid
                key={activeSearch}
                onProduct={onProduct}
                keyword={activeSearch}
                sort="default"
                rankKeyword={activeSearch}
              />
            </div>
          ) : (
            <div id="hot-products-section">
              <InfiniteProductGrid onProduct={onProduct} title="🔥 지금 핫한 상품들" />
            </div>
          )}
          <LegalFooter />
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1">터치하면 코드가 자동으로 복사돼요!</p>
          {DISCOUNT_CODES.map(c=>(
            <button key={c.code} onClick={()=>copyCode(c.code)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#F7F7F8] active:bg-gray-100 transition text-left">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{background:c.color}}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{c.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.expire}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl text-white" style={{background:c.color}}>{c.code}</span>
                <span className="text-[10px] text-gray-400">탭하여 복사</span>
              </div>
            </button>
          ))}
          <LegalFooter />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 화면 2: 카테고리 피드
// ═══════════════════════════════════════════════════════════════════
const SORT_OPTIONS = [
  { value:"default",    label:"인기순"   },
  { value:"price_asc",  label:"낮은가격" },
  { value:"price_desc", label:"높은가격" },
  { value:"discount",   label:"할인율순" },
];

const CategoryFeedScreen = ({ cat, onBack, onProduct }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort]           = useState(cat.sort || "default");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(()=>{
    setIsLoading(true);
    setSort(cat.sort || "default");
    const t = setTimeout(()=>setIsLoading(false), 700);
    return ()=>clearTimeout(t);
  },[cat.id]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "인기순";

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="뒤로 가기" className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <div>
            <p className="text-base font-extrabold text-gray-900">{cat.icon} {cat.label}</p>
            {!isLoading && <p className="text-[11px] text-gray-400">계속 로드 중...</p>}
          </div>
          <div className="ml-auto relative">
            <button onClick={()=>setShowSortMenu(v=>!v)}
              className="text-xs text-gray-600 font-semibold bg-[#F7F7F8] px-3 py-1.5 rounded-xl flex items-center gap-1">
              {currentSortLabel} ⚙️
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[110px]">
                {SORT_OPTIONS.map(o=>(
                  <button key={o.value}
                    onClick={()=>{ setSort(o.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition
                      ${sort===o.value ? "bg-orange-50 text-orange-500" : "text-gray-700 active:bg-gray-50"}`}>
                    {sort===o.value ? "✓ " : ""}{o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : (
          <InfiniteProductGrid key={`${cat.id}-${sort}`} onProduct={onProduct} keyword={cat.keyword||""} sort={sort} />
        )}
        <LegalFooter />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 가격 분석 헬퍼 함수들
// ═══════════════════════════════════════════════════════════════════

// 기간별 히스토리 슬라이스
const sliceHist = (hist, days) => hist.slice(Math.max(0, hist.length - Math.ceil(days / 4)));

// 요일별 평균 가격 계산 (더미: seed 기반 고정값)
const calcWeeklyPattern = (basePrice, seed) => {
  const days = ["월","화","수","목","금","토","일"];
  let rng = seed;
  const rand = () => { rng=(rng*1664525+1013904223)&0xffffffff; return (rng>>>0)/0xffffffff; };
  return days.map((d, i) => {
    const variation = (rand() - 0.5) * 0.12; // ±6% 범위
    const price = Math.round(basePrice * (1 + variation) / 100) * 100;
    return { day: d, price, isMin: false };
  }).map((d, _, arr) => ({ ...d, isMin: d.price === Math.min(...arr.map(x => x.price)) }));
};

// 블랙프라이데이: 11월 넷째 목요일 다음 날 (금요일)
const getBlackFriday = (year) => {
  const nov1 = new Date(year, 10, 1);
  const firstThursday = ((4 - nov1.getDay() + 7) % 7) + 1;
  return new Date(year, 10, firstThursday + 21 + 1); // 넷째 목 + 1일
};

// 4대 확정 세일 날짜
const calcNextSale = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const y = today.getFullYear();
  const candidates = [
    { name:"6.18 알리 미드이어 세일", emoji:"☀️", maxDisc:60, date: new Date(y,   5, 18) },
    { name:"11.11 솔로데이",          emoji:"🛍", maxDisc:80, date: new Date(y,  10, 11) },
    { name:"블랙프라이데이",           emoji:"🖤", maxDisc:70, date: getBlackFriday(y)    },
    { name:"12.12 더블트웰브",         emoji:"🎁", maxDisc:60, date: new Date(y,  11, 12) },
    // 내년 순환
    { name:"6.18 알리 미드이어 세일", emoji:"☀️", maxDisc:60, date: new Date(y+1, 5, 18) },
    { name:"11.11 솔로데이",          emoji:"🛍", maxDisc:80, date: new Date(y+1,10, 11) },
    { name:"블랙프라이데이",           emoji:"🖤", maxDisc:70, date: getBlackFriday(y+1)  },
    { name:"12.12 더블트웰브",         emoji:"🎁", maxDisc:60, date: new Date(y+1,11, 12) },
  ];
  const upcoming = candidates
    .map(s => ({ ...s, dday: Math.ceil((s.date - today) / 86400000) }))
    .filter(s => s.dday >= 0)
    .sort((a, b) => a.dday - b.dday);
  return upcoming[0];
};

// 가격 이벤트 타임라인 생성 (더미)
const buildTimeline = (hist, currentPrice) => {
  const events = [];
  const minP = Math.min(...hist.map(d => d.price));
  const maxP = Math.max(...hist.map(d => d.price));
  // 최근 8개 포인트 중 변화가 큰 시점만 추출
  const recent = hist.slice(-20).filter((_,i) => i % 3 === 0).slice(-6).reverse();
  recent.forEach((pt, i) => {
    const prev = recent[i + 1];
    const isUp   = prev && pt.price > prev.price;
    const isDown = prev && pt.price < prev.price;
    const isMin  = pt.price === minP;
    const isMax  = pt.price === maxP;
    events.push({
      date:  pt.date,
      price: pt.price,
      label: isMin ? "역대최저" : isMax ? "최고가" : isUp ? "가격상승" : isDown ? "가격하락" : "변동없음",
      color: isMin ? "#EF4444" : isMax ? "#6366F1" : isUp ? "#3B82F6" : isDown ? "#EF4444" : "#9CA3AF",
      icon:  isMin ? "🏆" : isMax ? "📈" : isUp ? "▲" : isDown ? "▼" : "─",
    });
  });
  return events;
};

// ═══════════════════════════════════════════════════════════════════
// 차트 서브 컴포넌트들
// ═══════════════════════════════════════════════════════════════════

// [1] 기간 탭 전환 차트
const PriceRangeChart = ({ hist, minP, maxP }) => {
  const TABS = [
    { id:"7d",  label:"1주일",  days:7  },
    { id:"30d", label:"1개월",  days:30 },
    { id:"90d", label:"3개월",  days:90 },
    { id:"all", label:"전체",   days:999},
  ];
  const [activeTab, setActiveTab] = useState("30d");
  const tabDays = TABS.find(t => t.id === activeTab)?.days ?? 30;
  const data    = useMemo(() => sliceHist(hist, tabDays), [hist, tabDays]);
  const dMin    = useMemo(() => Math.min(...data.map(d => d.price)), [data]);
  const dMax    = useMemo(() => Math.max(...data.map(d => d.price)), [data]);
  const dAvg    = useMemo(() => avg60(data), [data]);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-800">📊 가격 변동 차트</p>
        <p className="text-xs text-gray-400">평균 {fmt(dAvg)}</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-gray-500"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{top:4,right:6,left:-24,bottom:0}}>
          <defs>
            <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#FF5A1F" stopOpacity={0.18}/>
              <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
          <XAxis dataKey="date" tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
          <YAxis tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}
            tickFormatter={v=>`${(v/1000).toFixed(0)}k`} domain={[dMin*0.9, dMax*1.06]}/>
          <Tooltip content={<ChartTip/>}/>
          <ReferenceLine y={dMin} stroke="#FF5A1F" strokeDasharray="4 2" strokeWidth={1.5}/>
          <Area type="monotone" dataKey="price" stroke="#FF5A1F" strokeWidth={2.5}
            fill="url(#cGrad)" dot={false}
            activeDot={{r:5,fill:"#FF5A1F",stroke:"white",strokeWidth:2}}/>
        </AreaChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-orange-400"/>
          <p className="text-[10px] text-gray-400">최저가 기준선</p>
        </div>
        <div className="flex gap-3">
          <p className="text-[10px] text-gray-400">최저 <span className="text-red-500 font-bold">{fmt(dMin)}</span></p>
          <p className="text-[10px] text-gray-400">최고 <span className="text-gray-600 font-bold">{fmt(dMax)}</span></p>
        </div>
      </div>
    </div>
  );
};

// [2] 요일별 가격 패턴
const WeeklyPatternCard = ({ basePrice, seed }) => {
  const pattern = useMemo(() => calcWeeklyPattern(basePrice, seed), [basePrice, seed]);
  const minPrice = Math.min(...pattern.map(d => d.price));
  const maxPrice = Math.max(...pattern.map(d => d.price));
  const cheapDay = pattern.find(d => d.isMin);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-bold text-gray-800">📅 요일별 가격 패턴</p>
        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          {cheapDay?.day}요일 최저
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        알리는 <span className="text-orange-500 font-bold">{cheapDay?.day}요일</span>에 가장 저렴한 경향이 있어요
      </p>

      {/* 바 차트 */}
      <div className="flex items-end gap-1.5 h-20">
        {pattern.map((d) => {
          const ratio = (d.price - minPrice) / (maxPrice - minPrice || 1);
          const barH  = 28 + ratio * 44; // 28px ~ 72px
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all duration-300 relative"
                   style={{
                     height: barH,
                     background: d.isMin
                       ? "linear-gradient(to top,#FF5A1F,#FF8C5A)"
                       : "linear-gradient(to top,#E5E7EB,#F3F4F6)",
                   }}>
                {d.isMin && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px]">🏆</span>
                )}
              </div>
              <p className={`text-[10px] font-bold ${d.isMin ? "text-orange-500" : "text-gray-400"}`}>{d.day}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[10px] text-gray-400">
          최저 <span className="text-orange-500 font-semibold">{fmt(minPrice)}</span>
          <span className="mx-1">·</span>
          최고 <span className="text-gray-500 font-semibold">{fmt(maxPrice)}</span>
        </p>
        <p className="text-[10px] text-gray-400">주간 편차 {fmt(maxPrice - minPrice)}</p>
      </div>
    </div>
  );
};

// [3] 다음 세일 D-day 카드
const NextSaleCountdown = ({ currentPrice }) => {
  const sale         = useMemo(() => calcNextSale(), []);
  const expectedDisc = 25; // 평균 추가 할인율 (더미, API 연동 시 실제값 사용)
  const expectedPrice= Math.round(currentPrice * (1 - expectedDisc / 100) / 100) * 100;

  if (!sale) return null;
  return (
    <div className="rounded-3xl overflow-hidden"
         style={{background:"linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)"}}>
      <div className="p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">🗓 다음 대형 세일</p>
          <span className="text-xs font-extrabold bg-orange-500 px-2.5 py-1 rounded-full">
            {sale.dday === 0 ? "오늘!" : `D-${sale.dday}`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{sale.emoji}</span>
          <div>
            <p className="text-base font-extrabold">{sale.name}</p>
            <p className="text-xs text-blue-200 mt-0.5">
              {sale.dday === 0 ? "오늘 시작!" : `${sale.dday}일 후`} · 역대 최대 {sale.maxDisc}% 할인 행사
            </p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-white/10 rounded-2xl">
          <p className="text-[11px] text-blue-200 font-semibold mb-1">이 상품 현재가</p>
          <p className="text-lg font-extrabold">{fmt(currentPrice)}</p>
          <p className="text-[10px] text-blue-300/70 mt-1">
            * 세일 시 가격은 알리익스프레스 앱에서 직접 확인하세요
          </p>
        </div>

        <p className="text-[10px] text-blue-300/50 mt-2 text-center">
          6.18 · 11.11 · 블랙프라이데이 · 12.12 공식 확정 일정
        </p>
      </div>
    </div>
  );
};

// [4] 가격 등락 타임라인
const PriceTimeline = ({ hist, currentPrice }) => {
  const events = useMemo(() => buildTimeline(hist, currentPrice), [hist, currentPrice]);
  const lowestCount = useMemo(() => {
    const minP = Math.min(...hist.map(d => d.price));
    return hist.filter(d => d.price <= minP * 1.01).length;
  }, [hist]);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-gray-800">🕐 가격 변동 히스토리</p>
        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
          역대최저 {lowestCount}회
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        이 상품은 지난 90일간 최저가를 <span className="font-bold text-gray-600">{lowestCount}번</span> 달성했어요
      </p>

      {/* 타임라인 */}
      <div className="space-y-3">
        {/* 현재가 — 항상 맨 위 */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center flex-shrink-0" style={{width:32}}>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm shadow-md">
              🔴
            </div>
            <div className="w-0.5 h-4 bg-gray-200 mt-1"/>
          </div>
          <div className="flex-1 bg-orange-50 rounded-2xl px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-orange-600">현재 · 오늘</p>
              <p className="text-sm font-extrabold text-orange-500">{fmt(currentPrice)}</p>
            </div>
            <p className="text-[10px] text-orange-400 mt-0.5">역대 최저가 달성 중</p>
          </div>
        </div>

        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-col items-center flex-shrink-0" style={{width:32}}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                   style={{background: ev.color + "20", color: ev.color, fontWeight:"bold"}}>
                {ev.icon}
              </div>
              {i < events.length - 1 && <div className="w-0.5 h-4 bg-gray-200 mt-1"/>}
            </div>
            <div className="flex-1 bg-white rounded-2xl px-3 py-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400">{ev.date}</p>
                <p className="text-xs font-extrabold" style={{color: ev.color}}>{fmt(ev.price)}</p>
              </div>
              <p className="text-[10px] font-semibold mt-0.5" style={{color: ev.color}}>{ev.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🏪 알리 셀러 간 가격 비교 컴포넌트
// API 연동 시: fetchSellerList() 함수만 실제 API 호출로 교체
// ═══════════════════════════════════════════════════════════════════

// 키워드 추출 — 상품명에서 핵심 단어만 뽑기
const extractKeyword = (name) => {
  // 불필요한 수식어 제거 후 앞 3단어만
  const stopWords = ["초소형","접이식","고속","급속","무선","블루투스","스마트","공식","정품","한국","세트","패키지"];
  return name
    .split(/[\s,·\-\(\)]+/)
    .filter(w => w.length > 1 && !stopWords.includes(w))
    .slice(0, 3)
    .join(" ");
};

// 알리 유사 상품 최저가 3개 — 실제 API 호출
const fetchSellerList = async (productName, productId) => {
  const keyword = extractKeyword(productName);
  if (!keyword) return [];
  try {
    const params = new URLSearchParams({ page: 1, size: 12, sort: "price_asc", keyword });
    const res  = await fetch(`${API_BASE}/api/ali/products?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || [])
      .map(mapProduct)
      .filter(p => p.price >= 500 && String(p.id) !== String(productId))
      .slice(0, 3);
  } catch {
    return [];
  }
};

const SellerCompareCard = ({ product }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSellerList(product.name, product.id).then(data => {
      if (!cancelled) { setItems(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [product.id]);

  const coupangKeyword = extractKeyword(product.name);
  const coupangUrl     = buildCoupangUrl(coupangKeyword);
  const cheaperCount   = items.filter(s => s.price < product.price).length;

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">🔍 유사 상품 최저가 비교</p>
          {!loading && cheaperCount > 0 && (
            <p className="text-xs text-orange-500 font-bold mt-0.5">알리에서 {cheaperCount}개 더 저렴한 옵션 발견!</p>
          )}
          {!loading && cheaperCount === 0 && items.length > 0 && (
            <p className="text-xs text-green-600 font-bold mt-0.5">현재 상품이 최저가 수준이에요 ✅</p>
          )}
        </div>
        <span className="text-[10px] text-gray-400 bg-white px-2 py-1 rounded-xl">
          {loading ? "검색 중..." : `알리 ${items.length}건`}
        </span>
      </div>

      {/* 현재 상품 기준 */}
      <div className="flex items-center gap-3 bg-orange-50 rounded-2xl px-3 py-2.5">
        <img src={product.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          onError={e => { e.currentTarget.src = "https://placehold.co/40x40/EEF2FF/6366F1?text=📦"; e.currentTarget.onerror=null; }} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-extrabold text-orange-500">현재 보는 상품</p>
          <p className="text-xs text-gray-700 font-semibold truncate">{product.shortName}</p>
        </div>
        <p className="text-sm font-extrabold text-orange-500 flex-shrink-0">{fmt(product.price)}</p>
      </div>

      {/* 알리 유사 최저가 3개 */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-2xl animate-pulse"/>)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">유사 상품을 찾지 못했어요</p>
      ) : (
        <div className="space-y-2">
          {items.map((s, i) => {
            const isCheaper = s.price < product.price;
            const diff      = Math.abs(product.price - s.price);
            return (
              <a key={s.id} href={buildAffiliateUrl(s.id, s.affiliate_url)}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 active:opacity-75 transition">
                <img src={s.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  onError={e => { e.currentTarget.src="https://placehold.co/40x40/EEF2FF/6366F1?text=📦"; e.currentTarget.onerror=null; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] font-extrabold text-white bg-gray-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {i+1}위
                    </span>
                    {isCheaper && <span className="text-[9px] font-extrabold text-white bg-red-500 px-1.5 py-0.5 rounded-full">더 저렴</span>}
                  </div>
                  <p className="text-xs text-gray-700 truncate">{s.shortName}</p>
                  <p className="text-[10px] text-gray-400">⭐{s.rating > 0 ? s.rating : "-"} · {s.reviews.toLocaleString()}리뷰</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-extrabold ${isCheaper ? "text-red-500" : "text-gray-700"}`}>{fmt(s.price)}</p>
                  <p className={`text-[10px] font-bold ${isCheaper ? "text-red-400" : "text-gray-400"}`}>
                    {isCheaper ? `-${fmt(diff)}` : `+${fmt(diff)}`}
                  </p>
                </div>
                <span className="text-gray-300 text-xs">›</span>
              </a>
            );
          })}
        </div>
      )}

      {/* 쿠팡 비교 링크 */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-[10px] text-gray-400 mb-2">국내 배송 비교 (쿠팡 가격은 직접 확인)</p>
        <a href={coupangUrl} target="_blank" rel="noopener noreferrer sponsored"
           className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-extrabold active:opacity-90 transition"
           style={{background:"linear-gradient(90deg,#C0392B,#E74C3C)"}}>
          <span>🛒</span>
          쿠팡에서 "{coupangKeyword}" 검색하기 →
        </a>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🛒 쿠팡 검색 링크 컴포넌트
// 쿠팡 파트너스 ID 발급 후 COUPANG_PARTNER_ID 만 교체하면 완료
// ═══════════════════════════════════════════════════════════════════

const COUPANG_PARTNER_ID = "AF4860198";

const buildCoupangUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword);
  // 쿠팡 파트너스 공식 트래킹 파라미터
  // affiliateCode=AF{숫자} + sourceType=affiliate + subId(선택)
  return `https://www.coupang.com/np/search?q=${encoded}&affiliateCode=${COUPANG_PARTNER_ID}&sourceType=affiliate&subId=alitrack`;
};

const CoupangCompareCard = ({ productName, currentPrice }) => {
  const keyword     = useMemo(() => extractKeyword(productName), [productName]);
  const coupangUrl  = useMemo(() => buildCoupangUrl(keyword), [keyword]);
  const [copied, setCopied] = useState(false);


  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-[#F7F7F8] flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">🛒 쿠팡에서도 검색해보기</p>
          <p className="text-xs text-gray-400 mt-0.5">같은 상품 국내 최저가 비교</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-[#C0392B] flex items-center justify-center">
            <span className="text-white text-[8px] font-extrabold">C</span>
          </div>
          <span className="text-xs font-extrabold text-[#C0392B]">쿠팡</span>
        </div>
      </div>

      {/* 검색 키워드 미리보기 */}
      <div className="px-4 py-3 bg-white">
        <div className="flex items-center gap-2 bg-[#F7F7F8] rounded-xl px-3 py-2 mb-3">
          <span className="text-gray-400 text-sm">🔍</span>
          <p className="text-xs text-gray-600 font-semibold flex-1">"{keyword}"</p>
          <span className="text-[10px] text-gray-400">검색어</span>
        </div>

        {/* 안내 문구 */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-base flex-shrink-0">💡</span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            알리 현재가 <span className="font-bold text-gray-800">{fmt(currentPrice)}</span> 기준으로
            쿠팡 검색 결과와 직접 비교해보세요.
            배송 속도·AS 환경 차이도 함께 고려하면 더 합리적인 선택이 가능해요.
          </p>
        </div>

        {/* 쿠팡 검색 버튼 */}
        <a href={coupangUrl} target="_blank" rel="noopener noreferrer sponsored"
           className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-extrabold active:opacity-90 transition"
           style={{background:"linear-gradient(90deg,#C0392B,#E74C3C)"}}>
          <span>🛒</span>
          쿠팡에서 "{keyword}" 검색하기 →
        </a>

      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 화면 3: 상품 상세 (셀러비교 + 쿠팡링크 통합)
// ═══════════════════════════════════════════════════════════════════
const DetailScreen = ({ product, onBack, showLogin, showToast, user }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [wished, setWished]       = useState(() => {
    try { return getLocalWishlist().some(p => p.id === product.id); } catch { return false; }
  });
  const [alertActive, setAlertActive] = useState(() => {
    try { return getLocalAlerts().some(a => a.product_id === product.id); } catch { return false; }
  });

  useEffect(() => { savePriceHistory(product); }, [product.id]);

  const seed         = useMemo(() => idToSeed(product.id), [product.id]);
  const hist         = useMemo(() => generateHistory(product.price, seed), [product.price, seed]);
  const minP         = useMemo(() => Math.min(...hist.map(d => d.price)), [hist]);
  const maxP         = useMemo(() => Math.max(...hist.map(d => d.price)), [hist]);
  const affiliateUrl = useMemo(() => buildAffiliateUrl(product.id, product.affiliate_url), [product.id, product.affiliate_url]);

  const handleWish = () => {
    const nowWished = toggleLocalWish(product);
    setWished(nowWished);
    showToast(nowWished
      ? (user ? "관심상품에 추가했어요 ❤️" : "관심상품에 추가했어요 ❤️  (이메일 가입 시 영구 보관)")
      : "관심상품에서 제거했어요");
  };

  const handleAlert = () => setAlertOpen(true);

  return (
    <>
      <div style={{paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H+BTN_H}px)`}}>
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
          <button onClick={onBack} aria-label="뒤로 가기"
            className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <p className="text-sm font-bold text-gray-900 flex-1"
             style={{display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
            {product.name}
          </p>
        </div>

        {/* 이미지 */}
        <div className="bg-[#F7F7F8]">
          <img src={product.image} alt={product.shortName}
            loading="lazy" className="w-full max-h-72 object-contain mx-auto"
            onError={e => { e.currentTarget.src = "https://placehold.co/500x500/EEF2FF/6366F1?text=📦"; e.currentTarget.onerror = null; }} />
        </div>

        <div className="px-4 pt-4 space-y-4">
          {/* 상품 기본 정보 */}
          <div>
            <span className={`text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${TAG_COLORS[product.tag]||"bg-gray-500"}`}>
              {product.tag}
            </span>
            <p className="text-lg font-extrabold text-gray-900 mt-2 leading-snug">{product.name}</p>
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-extrabold text-gray-900">{fmt(product.price)}</p>
                {product.discount > 0
                  ? <span className="text-base font-bold text-red-500">▼ {product.discount}%</span>
                  : product.discount < 0
                  ? <span className="text-base font-bold text-blue-500">▲ {Math.abs(product.discount)}%</span>
                  : null}
              </div>
              <p className="text-sm text-gray-400 line-through">{fmt(product.orig)}</p>
            </div>
            <p className="text-xs text-[#00C07F] font-bold mt-1">🚀 {product.deliveryDays}일 내 배송 · 무료배송</p>
            <p className="text-xs text-gray-400 mt-0.5">⭐ {product.rating} 평점 ({product.reviews.toLocaleString()}개 리뷰)</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {[
              {icon:wished?"❤️":"🤍",       label:"관심상품", action:handleWish},
              {icon:alertActive?"🔔":"🔕",   label:"알림 받기", action:handleAlert},
              {icon:"🔗",                    label:"공유하기",  action:()=>setShareOpen(true)},
            ].map(b => (
              <button key={b.label} onClick={b.action}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl bg-[#F7F7F8] active:bg-gray-200 transition">
                <span className="text-xl">{b.icon}</span>
                <span className="text-[10px] text-gray-600 font-semibold">{b.label}</span>
              </button>
            ))}
          </div>

          {/* 예상 절감액 배너 */}
          {(() => {
            const orig = product.orig || Math.round(product.price * 1.4);
            const saved = orig - product.price;
            const maxSave = orig - minP;
            if (saved <= 0) return null;
            return (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 tracking-wide mb-1">💰 지금 구매하면 절감되는 금액</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-extrabold text-emerald-600">{fmt(saved)}</p>
                  <p className="text-xs text-emerald-500 mb-0.5 line-through">{fmt(orig)}</p>
                </div>
                {minP < product.price && (
                  <p className="text-[11px] text-emerald-700 mt-1.5 font-semibold">
                    📉 역대 최저가 {fmt(minP)}까지 떨어지면 최대 {fmt(maxSave)} 절감 가능
                  </p>
                )}
              </div>
            );
          })()}

          {/* ✅ [1] 기간 탭 전환 차트 */}
          <PriceRangeChart hist={hist} minP={minP} maxP={maxP} />

          {/* ✅ [2] 요일별 가격 패턴 */}
          <WeeklyPatternCard basePrice={product.price} seed={seed} />

          {/* ✅ [3] 다음 세일 D-day */}
          <NextSaleCountdown currentPrice={product.price} />

          {/* ✅ [4] 가격 등락 타임라인 */}
          <PriceTimeline hist={hist} currentPrice={product.price} />

          {/* ✅ [5] 알리 유사 최저가 3개 + 쿠팡 비교 */}
          <SellerCompareCard product={product} />

          <LegalFooter />
        </div>
      </div>

      {/* 하단 고정 구매 버튼 */}
      <div className="fixed left-0 right-0 z-40 flex justify-center px-4 pt-3"
           style={{
             bottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)`,
             background:"linear-gradient(to top,white 65%,transparent)",
             paddingBottom:12,
           }}>
        <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
           onClick={() => trackEvent("purchase_click", { product_id: product.id, product_name: product.name, price: product.price })}
           className="w-full max-w-[568px] block text-center text-white font-extrabold py-4 rounded-2xl text-sm shadow-xl active:opacity-90 transition"
           style={{background:"linear-gradient(90deg,#FF5A1F,#f7462a)"}}>
          알리익스프레스에서 최저가로 구매하기 →
        </a>
      </div>

      {shareOpen && <ShareSheet product={product} onClose={()=>setShareOpen(false)} showToast={showToast}/>}
      {alertOpen && <AlertModal product={product} user={user} onClose={()=>{ setAlertOpen(false); setAlertActive(getLocalAlerts().some(a=>a.product_id===product.id)); }} showToast={showToast} showLogin={showLogin}/>}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 플레이스홀더
// ═══════════════════════════════════════════════════════════════════
const PlaceholderScreen = ({ title, emoji, desc, onBack }) => (
  <div>
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition">
        <IconBack />
      </button>
      <p className="text-base font-bold text-gray-900">{title}</p>
    </div>
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <span className="text-5xl">{emoji}</span>
      <p className="text-sm font-bold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400">{desc||"곧 오픈 예정이에요"}</p>
    </div>
  </div>
);


// ═══════════════════════════════════════════════════════════════════
// ① 개인정보처리방침 페이지
// ═══════════════════════════════════════════════════════════════════
const PrivacyScreen = ({ onBack }) => (
  <div className="pb-10">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <p className="text-base font-bold text-gray-900">개인정보처리방침</p>
    </div>
    <div className="px-5 py-5 space-y-6 text-gray-700">
      <p className="text-xs text-gray-400">시행일: 2026년 1월 1일 · 최종 수정: 2026년 6월 27일</p>
      {[
        { title:"1. 개인정보 수집 항목 및 목적", body:"AliTrack(이하 \"서비스\")은 아래와 같은 목적으로 최소한의 개인정보를 수집합니다.\n\n• 이메일 회원가입: 이메일 주소, 비밀번호(암호화 저장)\n• 서비스 이용: 관심 상품 목록, 알림 설정 정보, 서비스 이용 기록\n\n수집 목적: 회원 식별, 최저가 알림 발송, 찜 목록 및 가격 기록 보관, 서비스 품질 개선" },
        { title:"2. 개인정보 보유 및 이용 기간", body:"• 회원 탈퇴 시 즉시 파기\n• 전자상거래법: 계약·청약철회 기록 5년, 대금결제 기록 5년\n• 통신비밀보호법: 로그인 기록 3개월" },
        { title:"3. 개인정보 제3자 제공", body:"서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.\n단, 이용자가 사전에 동의한 경우 또는 법령의 규정에 의한 경우 예외로 합니다.\n\n※ 알리익스프레스 제휴 링크 클릭 시 해당 사이트의 개인정보처리방침이 적용됩니다." },
        { title:"4. 개인정보 처리 위탁", body:"• Supabase Inc. — 데이터베이스 저장 및 관리\n• Cloudflare Inc. — 웹 서비스 호스팅 (Cloudflare Pages)\n• Railway Corp. — 백엔드 서버 호스팅" },
        { title:"5. 이용자 권리", body:"이용자는 언제든지 개인정보 열람·수정·삭제·처리정지를 요청할 수 있습니다.\n행사 방법: 앱 내 [나의기록 → 계정 설정] 또는 privacy@alitrack.kr 로 요청\n\n• 개인정보분쟁조정위원회: www.kopico.go.kr (1833-6972)\n• 개인정보침해신고센터: privacy.kisa.or.kr (118)" },
        { title:"6. 쿠키 및 분석 도구", body:"• Google Analytics 4: 서비스 이용 통계 분석(익명 처리)\n브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다." },
        { title:"7. 개인정보 보호책임자", body:"이메일: privacy@alitrack.kr\n본 방침은 개인정보보호법, 정보통신망법 등 관련 법령을 준수하여 작성되었습니다." },
      ].map((s,i)=>(
        <div key={i} className="space-y-2">
          <p className="text-sm font-extrabold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// ② 이용약관 페이지
// ═══════════════════════════════════════════════════════════════════
const TermsScreen = ({ onBack }) => (
  <div className="pb-10">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </button>
      <p className="text-base font-bold text-gray-900">이용약관</p>
    </div>
    <div className="px-5 py-5 space-y-6 text-gray-700">
      <p className="text-xs text-gray-400">시행일: 2026년 1월 1일</p>
      {[
        { title:"제1조 (목적)", body:"이 약관은 AliTrack이 제공하는 알리익스프레스 가격 추적 및 핫딜 정보 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다." },
        { title:"제2조 (서비스의 내용)", body:"• 알리익스프레스 상품 가격 변동 추적 및 분석 정보\n• 실시간 핫딜 및 할인 정보 제공\n• 관심 상품 저장 및 최저가 알림\n• 알리익스프레스 제휴 링크를 통한 구매 연결\n\n※ 서비스는 가격 정보 제공 플랫폼이며, 직접 판매 또는 거래의 당사자가 아닙니다." },
        { title:"제3조 (가격 정보 면책)", body:"① 제공하는 가격 정보는 수집 시점 기준이며 알리익스프레스 실시간 가격과 다를 수 있습니다.\n② 최종 구매 가격은 알리익스프레스 앱·웹에서 반드시 재확인하시기 바랍니다.\n③ 가격 정보 오차로 인한 구매 손실에 대해 서비스는 법적 책임을 지지 않습니다." },
        { title:"제4조 (제휴 수수료 안내)", body:"① 서비스는 알리익스프레스 공식 제휴(Affiliate) 프로그램에 참여하고 있습니다.\n② 서비스 내 링크를 통해 상품을 구매하는 경우 구매 금액의 일부가 제휴 수수료로 지급될 수 있습니다.\n③ 이 수수료는 구매자에게 추가 비용을 발생시키지 않으며 서비스 운영 및 고도화에 사용됩니다.\n④ 위 사항은 공정거래위원회 추천·보증 등에 관한 표시·광고 심사지침을 준수하여 고지합니다." },
        { title:"제5조 (이용자 의무)", body:"다음 행위를 해서는 안 됩니다.\n• 서비스의 정보를 상업적 목적으로 무단 수집·재배포\n• 자동화 도구(봇, 크롤러)를 이용한 대량 데이터 수집\n• 타인의 계정 도용 또는 허위 정보 등록" },
        { title:"제6조 (서비스 중단 및 변경)", body:"① 시스템 점검, 서버 장애, 외부 API 변경 등으로 일시 중단될 수 있습니다.\n② 서비스 내용 변경 시 7일 전 앱 내 공지를 원칙으로 합니다." },
        { title:"제7조 (준거법 및 분쟁 해결)", body:"① 이 약관은 대한민국 법령에 따라 해석됩니다.\n② 분쟁 협의 불성립 시 서울중앙지방법원을 관할법원으로 합니다." },
      ].map((s,i)=>(
        <div key={i} className="space-y-2">
          <p className="text-sm font-extrabold text-gray-900">{s.title}</p>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// ③ 쿠키 동의 배너
// ═══════════════════════════════════════════════════════════════════
const CookieBanner = ({ onAccept, onDecline }) => (
  <div className="fixed bottom-0 left-0 right-0 z-[400] flex justify-center animate-slideUp"
       style={{paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)`}}>
    <div className="w-full max-w-[600px] bg-gray-900 mx-3 mb-3 rounded-2xl px-4 py-4 shadow-2xl">
      <p className="text-xs font-bold text-white mb-1">🍪 쿠키 및 분석 도구 사용 동의</p>
      <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
        서비스 품질 개선을 위해 Google Analytics를 사용합니다.
        수집된 데이터는 익명 처리되며 제3자에게 판매되지 않습니다.
      </p>
      <div className="flex gap-2">
        <button onClick={onDecline}
          className="flex-1 py-2 rounded-xl border border-gray-600 text-xs text-gray-300 font-semibold active:bg-gray-700 transition">
          필수만 허용
        </button>
        <button onClick={onAccept}
          className="flex-1 py-2 rounded-xl bg-orange-500 text-xs text-white font-bold active:bg-orange-600 transition">
          전체 동의
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// ④ 피드백·에러 신고 창구
// ═══════════════════════════════════════════════════════════════════
const FeedbackSheet = ({ onClose, showToast }) => {
  const [selected, setSelected] = useState(null);
  const [text, setText]         = useState("");

  const TYPES = [
    { id:"bug",     icon:"🐛", label:"오류 신고",   color:"#EF4444" },
    { id:"suggest", icon:"💡", label:"기능 제안",   color:"#6366F1" },
    { id:"price",   icon:"📊", label:"가격 오류",   color:"#F59E0B" },
    { id:"etc",     icon:"💬", label:"기타 문의",   color:"#00C07F" },
  ];

  const submit = () => {
    if (!selected) { showToast("문의 유형을 선택해주세요"); return; }
    // TODO: POST /api/feedback { type: selected, message: text }
    showToast("소중한 의견 감사합니다! 빠르게 검토할게요 🙏");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-5 pt-5 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5"/>
        <p className="text-base font-extrabold text-gray-900 mb-1">의견 보내기</p>
        <p className="text-xs text-gray-400 mb-4">불편한 점이나 좋은 아이디어를 알려주세요</p>

        {/* 유형 선택 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TYPES.map(t => (
            <button key={t.id} onClick={()=>setSelected(t.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition border-2 ${
                selected===t.id ? "border-orange-400 bg-orange-50" : "border-transparent bg-[#F7F7F8]"
              }`}>
              <span className="text-xl">{t.icon}</span>
              <span className="text-[10px] font-bold text-gray-700">{t.label}</span>
            </button>
          ))}
        </div>

        {/* 내용 입력 */}
        <textarea
          value={text} onChange={e=>setText(e.target.value)}
          placeholder="자세한 내용을 입력해주세요 (선택)"
          maxLength={500}
          className="w-full h-28 px-4 py-3 rounded-2xl bg-[#F7F7F8] text-sm text-gray-700 placeholder-gray-400 outline-none resize-none"
        />
        <p className="text-[10px] text-gray-400 text-right mt-1 mb-4">{text.length}/500</p>

        {/* 카카오 채널 바로가기 */}
        <a href="https://pf.kakao.com/_ARQxfX/friend" target="_blank" rel="noopener noreferrer"
           className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl mb-3"
           style={{background:"#FEE500", color:"#181600"}}>
          <span className="text-lg">💬</span>
          <span className="text-sm font-bold">카카오톡으로 바로 문의하기</span>
        </a>

        <button onClick={submit}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
          제출하기
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ⑤ 온보딩 화면 (첫 방문자용 3장 슬라이드)
// ═══════════════════════════════════════════════════════════════════
const ONBOARDING_SLIDES = [
  {
    emoji:"🔍",
    title:"알리 최저가,\n한눈에 확인해요",
    desc:"알리익스프레스 수천만 개 상품의\n실시간 가격 변동을 추적합니다",
    bg:"linear-gradient(145deg,#fff7ed,#fff)",
    accent:"#FF5A1F",
  },
  {
    emoji:"🚨",
    title:"역대 최저가\n달성하면 알려드려요",
    desc:"관심 상품을 찜해두면\n가격이 떨어질 때 즉시 알림을 보내드려요",
    bg:"linear-gradient(145deg,#eff6ff,#fff)",
    accent:"#6366F1",
  },
  {
    emoji:"💸",
    title:"핫딜·할인코드\n놓치지 마세요",
    desc:"매일 업데이트되는 알리 핫딜과\n할인코드를 가장 먼저 만나보세요",
    bg:"linear-gradient(145deg,#f0fdf4,#fff)",
    accent:"#00C07F",
  },
];

const OnboardingScreen = ({ onDone }) => {
  const [idx, setIdx] = useState(0);
  const s = ONBOARDING_SLIDES[idx];
  const isLast = idx === ONBOARDING_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[500] flex justify-center"
         style={{background:s.bg, transition:"background 0.4s ease"}}>
      <div className="w-full max-w-[600px] flex flex-col"
           style={{paddingTop:"env(safe-area-inset-top,0px)", paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}>

        {/* 건너뛰기 */}
        <div className="flex justify-end px-5 pt-4 pb-2">
          <button onClick={onDone} className="text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-xl bg-white/60">
            건너뛰기
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl shadow-lg"
               style={{background:"white"}}>
            {s.emoji}
          </div>
          <div className="space-y-3">
            <p className="text-2xl font-extrabold text-gray-900 leading-snug whitespace-pre-line">{s.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{s.desc}</p>
          </div>
        </div>

        {/* 페이지 인디케이터 */}
        <div className="flex justify-center gap-2 mb-8">
          {ONBOARDING_SLIDES.map((_,i) => (
            <div key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i===idx ? 20 : 6, height: 6,
                background: i===idx ? s.accent : "#E5E7EB",
              }}/>
          ))}
        </div>

        {/* 버튼 */}
        <div className="px-5">
          <button
            onClick={() => isLast ? onDone() : setIdx(i => i+1)}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-lg active:opacity-90 transition"
            style={{background: `linear-gradient(90deg, ${s.accent}, ${s.accent}cc)`}}>
            {isLast ? "시작하기 🚀" : "다음 →"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ⑥ PWA 설치 유도 배너
// ═══════════════════════════════════════════════════════════════════
const PwaInstallBanner = ({ onInstall, onDismiss }) => (
  <div className="mx-4 mb-3 animate-slideUp">
    <div className="bg-gray-900 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-xl">
      <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center text-xl flex-shrink-0">
        🛒
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold text-white">홈 화면에 추가하기</p>
        <p className="text-[10px] text-gray-400 mt-0.5">앱처럼 빠르게 실행 · 알림 수신 가능</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onDismiss}
          className="text-[10px] text-gray-400 px-2 py-1.5 rounded-lg border border-gray-700">
          나중에
        </button>
        <button onClick={onInstall}
          className="text-[10px] text-white font-bold px-3 py-1.5 rounded-lg bg-orange-500 active:bg-orange-600">
          설치
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// ⑦ 가격기록 화면 — 데이터 기반 쇼핑 성과 대시보드
// ═══════════════════════════════════════════════════════════════════

// 미니 스파크라인 (SVG) — ProductCard·DetailScreen 용도 유지
const Sparkline = ({ prices, color = "#FF5A1F", h = 28 }) => {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const n = prices.length - 1;
  const pts = prices
    .map((p, i) => `${((i / n) * 198 + 1).toFixed(1)},${(38 - ((p - min) / range) * 34 - 1).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full" style={{ height: h, display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ── 볼린저 밴드 차트 — 누적 절감액 카드 전용 ──────────────────────────
const BollingerSavingsChart = ({ data }) => {
  if (!data || data.length < 3) return null;
  const W = 280, H = 56;
  const PERIOD = Math.min(5, Math.max(2, Math.floor(data.length / 2)));

  const sma = data.map((_, i) => {
    const sl = data.slice(Math.max(0, i - PERIOD + 1), i + 1);
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  });
  const band = data.map((_, i) => {
    const sl = data.slice(Math.max(0, i - PERIOD + 1), i + 1);
    const m  = sl.reduce((a, b) => a + b, 0) / sl.length;
    return 2 * Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / sl.length);
  });
  const upper = sma.map((s, i) => s + band[i]);
  const lower = sma.map((s, i) => Math.max(0, s - band[i]));

  const allV  = [...data, ...upper, ...lower];
  const min   = Math.min(...allV);
  const max   = Math.max(...allV);
  const range = max - min || 1;
  const n     = data.length - 1 || 1;

  const px = (i) => ((i / n) * (W - 4) + 2).toFixed(1);
  const py = (v)  => (2 + ((max - v) / range) * (H - 4)).toFixed(1);
  const pts = (arr) => arr.map((v, i) => `${px(i)},${py(v)}`).join(" ");

  const uStr = upper.map((v, i) => `${px(i)},${py(v)}`).join(" L ");
  const lStr = [...lower].reverse().map((v, i) => `${px(n - i)},${py(v)}`).join(" L ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H, display: "block" }}>
      {/* 밴드 영역 */}
      <path d={`M ${uStr} L ${lStr} Z`} fill="rgba(255,255,255,0.13)" />
      {/* 상단 밴드 */}
      <polyline points={pts(upper)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeDasharray="3,2" />
      {/* 하단 밴드 */}
      <polyline points={pts(lower)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeDasharray="3,2" />
      {/* 중심 이동평균 */}
      <polyline points={pts(sma)} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
      {/* 실제 절감액 라인 */}
      <polyline points={pts(data)} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── 쇼핑 캔들 차트 — PriceHistoryItem 전용 ───────────────────────────
// 빨간 캔들 = 가격 하락 (구매 기회), 파란 캔들 = 가격 상승 (대기 권장)
const ShoppingCandleChart = ({ history }) => {
  if (!history || history.length < 4) return null;
  const W = 280, H = 52, PAD = 4;

  const CHUNK = Math.max(1, Math.ceil(history.length / 9));
  const candles = [];
  for (let i = 0; i < history.length; i += CHUNK) {
    const wk = history.slice(i, i + CHUNK);
    if (!wk.length) continue;
    const open  = wk[0].price;
    const close = wk[wk.length - 1].price;
    candles.push({ open, close, high: Math.max(...wk.map(d => d.price)), low: Math.min(...wk.map(d => d.price)) });
  }
  if (candles.length < 2) return null;

  const allP  = candles.flatMap(c => [c.high, c.low]);
  const min   = Math.min(...allP);
  const max   = Math.max(...allP);
  const range = max - min || 1;

  const slotW   = (W - PAD * 2) / candles.length;
  const candleW = Math.max(3, slotW * 0.55);
  const cx = (i) => PAD + i * slotW + slotW / 2;
  const py = (v)  => PAD + ((max - v) / range) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H, display: "block" }}>
      {candles.map((c, i) => {
        const isDown  = c.close <= c.open;
        const color   = isDown ? "#EF4444" : "#3B82F6";
        const bodyTop = py(Math.max(c.open, c.close));
        const bodyH   = Math.max(1.5, py(Math.min(c.open, c.close)) - bodyTop);
        const x = cx(i);
        return (
          <g key={i}>
            <line x1={x} y1={py(c.high)} x2={x} y2={py(c.low)} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} rx="1.5" />
          </g>
        );
      })}
    </svg>
  );
};

const PriceHistoryItem = ({ item, onProduct, onAlert, hasAlert }) => {
  const safeId    = String(item.id || item.productId || "");
  const seed      = useMemo(() => (safeId ? idToSeed(safeId) : 0), [safeId]);
  const history   = useMemo(() => generateHistory(item.price, seed), [item.price, seed]);
  const allLow    = useMemo(() => Math.min(...history.map(d => d.price)), [history]);
  const vsAllLow  = item.price - allLow;
  const isAtLow   = vsAllLow <= 0;
  const affiliate = buildAffiliateUrl(item.productId || safeId, item.affiliate_url);
  const normalized = useMemo(() => ({
    shortName:    item.name || "",
    tag:          "",
    discount:     0,
    rating:       0,
    reviews:      0,
    deliveryDays: 5,
    orig:         item.orig || Math.round((item.price || 0) * 1.4),
    ...item,
    id: safeId,
  }), [item, safeId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-50/80">
      <div className="px-3 pt-3 pb-0">
        {/* 상단: 이미지 + 정보 + 벨 */}
        <div className="flex items-start gap-2.5">
          <button className="flex-shrink-0" onClick={() => onProduct(normalized)}>
            {item.image
              ? <img src={item.image} alt="" className="w-11 h-11 rounded-xl object-cover bg-gray-100"/>
              : <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🛒</div>
            }
          </button>
          <button className="flex-1 min-w-0 text-left" onClick={() => onProduct(normalized)}>
            <p className="text-[11px] text-gray-400 line-clamp-1 leading-tight">{item.name || "상품명 없음"}</p>
            <p className="text-[15px] font-extrabold text-gray-900 mt-0.5 leading-tight">{fmt(item.price)}</p>
            {isAtLow ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5 mt-1">
                💰 현재가: 역대 최저가 달성
              </span>
            ) : (
              <span className="text-[10px] text-orange-500 font-semibold mt-1 block">
                📉 최저가 대비 -{allLow.toLocaleString("ko-KR")}원 더 저렴할 수 있어요
              </span>
            )}
          </button>
          <button
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition mt-0.5 ${hasAlert ? "bg-orange-100" : "bg-[#F7F7F8]"}`}
            onClick={e => { e.stopPropagation(); onAlert(item); }}>
            <span className="text-sm">{hasAlert ? "🔔" : "🔕"}</span>
          </button>
        </div>

        {/* 쇼핑 캔들 차트 */}
        <button className="w-full mt-2 block" onClick={() => onProduct(normalized)}>
          <ShoppingCandleChart history={history} />
          <div className="flex justify-end gap-3 mt-0.5 px-0.5">
            <span className="text-[9px] text-red-400 font-semibold">● 가격하락</span>
            <span className="text-[9px] text-blue-400 font-semibold">● 가격상승</span>
          </div>
        </button>

        {/* 하단: 상세보기 텍스트 링크 + 구매 버튼 */}
        <div className="flex items-center justify-between py-2.5 border-t border-gray-50 mt-1">
          <button onClick={() => onProduct(normalized)}
            className="text-[11px] font-semibold text-orange-500 active:text-orange-600 transition px-1">
            상세 분석 →
          </button>
          <a href={affiliate} target="_blank" rel="noopener noreferrer sponsored"
            className="bg-orange-500 active:bg-orange-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition"
            onClick={e => e.stopPropagation()}>
            지금 구매 →
          </a>
        </div>
      </div>
    </div>
  );
};

const PriceHistoryScreen = ({ onBack, onScrollToProducts, onProduct, showToast }) => {
  const raw = getPriceHistory();

  const sorted = useMemo(() => {
    return [...raw].sort((a, b) => {
      const lowA = Math.min(...generateHistory(a.price, idToSeed(String(a.productId))).map(d => d.price));
      const lowB = Math.min(...generateHistory(b.price, idToSeed(String(b.productId))).map(d => d.price));
      return (a.price - lowA) - (b.price - lowB);
    });
  }, [raw.map(r => r.productId).join(",")]);

  const [hist, setHist] = useState(sorted);
  const [alertModal, setAlertModal] = useState(null);

  // 누적 절감액 계산 (orig - price 합계)
  const totalSavings = useMemo(() =>
    hist.reduce((s, item) => {
      const orig = item.orig || Math.round(item.price * 1.4);
      return s + Math.max(0, orig - item.price);
    }, 0),
  [hist]);

  // 시간순 누적 절감액 스파크라인 데이터
  const savingsLine = useMemo(() => {
    let cum = 0;
    return [...hist]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => {
        const orig = item.orig || Math.round(item.price * 1.4);
        cum += Math.max(0, orig - item.price);
        return cum;
      });
  }, [hist]);

  const alertCount = getLocalAlerts().length;

  const hasAlert = (productId) => getLocalAlerts().some(a => a.product_id === String(productId));

  const toggleAlert = (item) => {
    if (hasAlert(item.productId)) {
      const alert = getLocalAlerts().find(a => a.product_id === String(item.productId));
      removeLocalAlert(String(item.productId));
      showToast("알림이 해제됐어요");
      setHist([...hist]);
      if (alert?.push_endpoint) {
        fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: String(item.productId), endpoint: alert.push_endpoint }),
        }).catch(() => {});
      }
    } else {
      setAlertModal(item);
    }
  };

  if (hist.length === 0) return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기" className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <p className="text-base font-bold text-gray-900">가격기록</p>
      </div>
      <EmptyPriceHistory onScrollToProducts={onScrollToProducts}/>
    </div>
  );

  return (
    <div className="bg-[#F7F7F8] min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기" className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <p className="text-base font-bold text-gray-900">쇼핑 성과</p>
        <span className="ml-auto text-[11px] text-gray-400 font-medium">{hist.length}개 탐색 중</span>
      </div>

      {/* ── 누적 절감액 성과 카드 ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl px-5 pt-5 pb-4 text-white shadow-lg shadow-orange-200/60 overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-bold opacity-75 tracking-wider">누적 절감액</p>
              <p className="text-[32px] font-extrabold leading-tight mt-0.5">
                {totalSavings > 0 ? fmt(totalSavings) : "0원"}
              </p>
              <p className="text-[11px] opacity-70 mt-1">
                {hist.length}개 탐색 · {alertCount > 0 ? `${alertCount}개 알림 설정 중` : "알림 설정 전"}
              </p>
            </div>
            <div className="bg-white/15 rounded-2xl px-3 py-2 text-center flex-shrink-0">
              <p className="text-[10px] opacity-80 font-semibold">절감</p>
              <p className="text-base font-extrabold">
                {totalSavings > 0
                  ? `-${Math.round(totalSavings / hist.reduce((s, item) => s + (item.orig || item.price * 1.4), 0) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
          {savingsLine.length > 2 && (
            <div className="mt-3" style={{ marginLeft: -8, marginRight: -8 }}>
              <BollingerSavingsChart data={savingsLine} />
              <div className="flex justify-end gap-3 px-2 mt-0.5 opacity-70">
                <span className="text-[9px] text-white font-semibold">─ 실제</span>
                <span className="text-[9px] text-white font-semibold opacity-70">─ 이동평균</span>
                <span className="text-[9px] text-white font-semibold opacity-50">- - 밴드</span>
              </div>
            </div>
          )}
          {totalSavings === 0 ? (
            <p className="text-[11px] opacity-60 mt-3">상품 상세 페이지를 방문하면 절감액이 쌓여요</p>
          ) : (
            <p className="text-[10px] opacity-55 mt-2 leading-relaxed">
              탐색한 상품의 알리 기준 원가 대비 할인가 차액을 누적한 예상 절감액이에요. API 참고가 기준이며 실제 결제 금액과 다를 수 있어요.
            </p>
          )}
        </div>
      </div>

      {/* ── 상품 리스트 ── */}
      <div className="px-4 pt-2 pb-6 space-y-2">
        {hist.map(item => (
          <PriceHistoryItem
            key={item.productId}
            item={item}
            onProduct={onProduct}
            onAlert={toggleAlert}
            hasAlert={hasAlert(item.productId)}
          />
        ))}
        <p className="text-[10px] text-gray-400 text-center pt-2">
          역대 최저가 근접 순 정렬 · 최대 50개 보관
        </p>
      </div>

      {alertModal && (
        <AlertModal
          product={{ id: alertModal.productId, name: alertModal.name, price: alertModal.price, image: alertModal.image }}
          user={null}
          onClose={() => { setAlertModal(null); setHist([...getPriceHistory()]); }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// ─── 알림 신청 목록 (내부 용도) ─────────────────────────────────────
const LocalAlertsScreen = ({ onBack, onGoHome, showToast }) => {
  const [alerts, setAlerts] = useState(getLocalAlerts);

  const remove = (productId) => {
    const alert = getLocalAlerts().find(a => a.product_id === String(productId));
    removeLocalAlert(productId);
    setAlerts(getLocalAlerts());
    showToast("알림이 삭제됐어요");
    if (alert?.push_endpoint) {
      fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: String(productId), endpoint: alert.push_endpoint }),
      }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기" className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <p className="text-base font-bold text-gray-900">가격기록</p>
        {alerts.length > 0 && <span className="ml-auto text-xs text-orange-500 font-bold">{alerts.length}개 모니터링 중</span>}
      </div>

      {alerts.length === 0 ? (
        <EmptyPriceHistory onScrollToProducts={onGoHome}/>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {alerts.map(a => (
            <div key={a.product_id} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">🔔</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{a.product_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  목표가 <span className="text-orange-500 font-extrabold">{fmt(a.target_price)}</span>
                  {a.current_price ? ` · 신청 시 ${fmt(a.current_price)}` : ""}
                </p>
                {a.saved_at && (
                  <p className="text-[10px] text-gray-300 mt-0.5">{new Date(a.saved_at).toLocaleDateString("ko-KR")} 신청</p>
                )}
              </div>
              <button onClick={()=>remove(a.product_id)}
                className="text-gray-300 hover:text-red-400 transition px-2 py-1 text-lg">✕</button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 text-center pt-2">
            이 기기에만 저장됩니다 · 이메일 가입 시 계정에 통합돼요
          </p>
        </div>
      )}
    </div>
  );
};

// ─── 찜한 상품 = 로컬 위시리스트 ────────────────────────────────────
const LocalWishlistScreen = ({ onBack, onGoHome, onProduct, showToast }) => {
  const [wish, setWish] = useState(getLocalWishlist);

  const remove = (product) => {
    toggleLocalWish(product);
    setWish(getLocalWishlist());
    showToast("관심상품에서 제거했어요");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기" className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <p className="text-base font-bold text-gray-900">찜한상품</p>
        {wish.length > 0 && <span className="ml-auto text-xs text-orange-500 font-bold">{wish.length}개</span>}
      </div>

      {wish.length === 0 ? (
        <EmptyWishlist onGoHome={onGoHome}/>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {wish.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex shadow-sm">
              <button onClick={()=>onProduct(p)} className="flex-1 flex items-center gap-3 px-4 py-3 text-left">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-50"/>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{p.name}</p>
                  {p.price && <p className="text-sm font-extrabold text-orange-500 mt-1">{fmt(p.price)}</p>}
                </div>
              </button>
              <button onClick={()=>remove(p)}
                className="px-4 text-gray-300 hover:text-red-400 transition text-lg border-l border-gray-50">❤️</button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 text-center pt-2">
            이 기기에만 저장됩니다 · 이메일 가입 시 계정에 통합돼요
          </p>
        </div>
      )}
    </div>
  );
};

const EmptyWishlist = ({ onGoHome }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
    <div className="w-24 h-24 rounded-3xl bg-[#F7F7F8] flex items-center justify-center text-4xl">❤️</div>
    <div>
      <p className="text-base font-extrabold text-gray-900 mb-1">아직 찜한 상품이 없어요</p>
      <p className="text-xs text-gray-400 leading-relaxed">관심 있는 상품의 ❤️를 누르면<br/>여기서 모아볼 수 있어요</p>
    </div>
    <button onClick={onGoHome}
      className="mt-2 px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
      핫딜 구경하기
    </button>
  </div>
);

const EmptyPriceHistory = ({ onScrollToProducts }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
    <div className="w-24 h-24 rounded-3xl bg-[#F7F7F8] flex items-center justify-center text-4xl">📈</div>
    <div>
      <p className="text-base font-extrabold text-gray-900 mb-1">가격 기록이 없어요</p>
      <p className="text-xs text-gray-400 leading-relaxed">상품 상세 페이지를 방문하면<br/>자동으로 가격 기록이 쌓여요</p>
    </div>
    <button onClick={onScrollToProducts}
      className="mt-2 px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
      상품 둘러보기
    </button>
  </div>
);

// ─── 미회원 나의기록 (게스트 ID + 로컬 데이터 현황 + 이메일 가입 유도) ────
const GuestMypage = ({ onLogin }) => {
  const [guestId, setGuestId]   = useState(getGuestId);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(guestId);
  const localAlerts = getLocalAlerts();
  const localWish   = getLocalWishlist();

  const saveId = () => {
    const clean = draft.trim().toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,12);
    if (!clean) return;
    try { localStorage.setItem("alitrack_guest_id", clean); } catch {}
    setGuestId(clean);
    setEditing(false);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* 게스트 ID 카드 */}
      <div className="bg-[#F7F7F8] rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">👤</div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">나의 게스트 ID</p>
            {editing ? (
              <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter" && saveId()}
                className="text-base font-extrabold text-gray-900 bg-transparent outline-none border-b-2 border-blue-400 w-full" autoFocus />
            ) : (
              <p className="text-base font-extrabold text-gray-900">{guestId}</p>
            )}
          </div>
          <button onClick={()=>{ if(editing) saveId(); else { setDraft(guestId); setEditing(true); }}}
            className="text-xs text-blue-500 font-bold px-3 py-1.5 rounded-xl bg-blue-50 active:bg-blue-100">
            {editing ? "저장" : "변경"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400">이 기기에서만 유효 · 이메일 가입 시 데이터 이전 가능</p>
      </div>

      {/* 로컬 현황 */}
      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="text-xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">알림 신청</p>
            <p className="text-xs text-gray-400">{localAlerts.length > 0 ? `${localAlerts.length}개 상품 모니터링 중` : "아직 없어요"}</p>
          </div>
          <span className="text-sm font-extrabold text-orange-500">{localAlerts.length}</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="text-xl">❤️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">찜한 상품</p>
            <p className="text-xs text-gray-400">{localWish.length > 0 ? `${localWish.length}개 저장됨` : "아직 없어요"}</p>
          </div>
          <span className="text-sm font-extrabold text-orange-500">{localWish.length}</span>
        </div>
      </div>

      {/* 이메일 가입 유도 */}
      <div className="bg-[#EFF6FF] border border-blue-200 rounded-3xl p-5">
        <p className="text-sm font-extrabold text-gray-900 mb-1">📧 이메일로 가입하면</p>
        <p className="text-xs text-gray-500 mb-3">소중한 기록이 안전하게 보관돼요</p>
        <div className="space-y-1.5 mb-4">
          {["📈 가격기록 영구 보관","❤️ 관심상품 영구 저장","🔄 기기 변경 시 데이터 연동","📬 최저가 달성 시 이메일 알림"].map(t=>(
            <p key={t} className="text-[12px] text-gray-700">{t}</p>
          ))}
        </div>
        <button onClick={onLogin}
          className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white active:bg-blue-600 transition">
          이메일로 가입하기 →
        </button>
      </div>
    </div>
  );
};

// ─── 로그인 나의기록 ─────────────────────────────────────────────────
const EmptyMypage = ({ onLogin }) => <GuestMypage onLogin={onLogin}/>;

const LoggedInMypage = ({ user, onLogout }) => {
  const email = user?.email || "";
  const nick  = user?.nickname || (email.split("@")[0] || "사용자");

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="bg-[#F7F7F8] rounded-3xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">📧</div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-gray-900 truncate">{nick}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600">
            📧 이메일 회원
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50">
        {[
          { icon:"❤️", label:"찜한 상품",   desc:"영구 저장됨" },
          { icon:"🔔", label:"가격 알림",   desc:"이메일로 최저가 알림 수신" },
          { icon:"📈", label:"가격기록",    desc:"영구 보관됨" },
          { icon:"🔄", label:"기기 연동",   desc:"어느 기기에서나 동일한 데이터" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-4 px-5 py-4">
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">활성</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout}
        className="w-full py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 active:bg-gray-50 transition">
        로그아웃
      </button>
    </div>
  );
};

// ─── 알림 설정 시트 ──────────────────────────────────────────────────
const NotificationSettingsSheet = ({ onClose }) => {
  const load = () => { try { return JSON.parse(localStorage.getItem("alitrack_notif_settings") || "{}"); } catch { return {}; } };
  const [s, setS] = useState(() => ({ card: true, night: false, sensitivity: "보통", ...load() }));

  const save = (next) => {
    setS(next);
    try { localStorage.setItem("alitrack_notif_settings", JSON.stringify(next)); } catch {}
  };
  const toggle = (key) => save({ ...s, [key]: !s[key] });

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 28px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-base font-extrabold text-gray-900 mb-4">알림 설정</p>

        <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden mb-4">
          {[
            { key:"card",  label:"카드/쿠폰 알림",  desc:"할인 카드·쿠폰 정보 알림" },
            { key:"night", label:"야간 알림",        desc:"오후 10시 ~ 오전 8시 알림" },
          ].map((item, idx, arr) => (
            <div key={item.key} className={`flex items-center gap-4 px-4 py-4 ${idx < arr.length-1 ? "border-b border-gray-100" : ""}`}>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button onClick={()=>toggle(item.key)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${s[item.key]?"bg-blue-500":"bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${s[item.key]?"left-6":"left-0.5"}`}/>
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-500 mb-2 px-1">가격 민감도</p>
        <div className="flex gap-2 mb-5">
          {[["낮음","1%"],["보통","5%"],["높음","10%"]].map(([l,v])=>(
            <button key={l} onClick={()=>save({...s,sensitivity:l})}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition ${s.sensitivity===l?"bg-blue-500 text-white":"bg-[#F7F7F8] text-gray-500"}`}>
              {l}<br/><span className="text-xs font-normal">{v} 이상</span>
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm">저장하기</button>
      </div>
    </div>
  );
};

// ─── Android / 공통 PWA 설치 안내 모달 ──────────────────────────────────
const AndroidInstallGuide = ({ onClose, isSamsung }) => {
  const [tab, setTab] = useState(isSamsung ? "samsung" : "chrome");

  const CHROME_STEPS = [
    { n:1, icon:"⋮",  text:"주소창 오른쪽 끝 ⋮ 메뉴를 탭해요" },
    { n:2, icon:"＋", text:"'홈 화면에 추가' 또는 '앱 설치'를 탭해요" },
    { n:3, icon:"✓",  text:"'설치' 또는 '추가'를 눌러 완료해요" },
  ];
  const SAMSUNG_STEPS = [
    { n:1, icon:"≡",  text:"화면 하단 메뉴(≡)를 탭해요" },
    { n:2, icon:"＋", text:"'페이지 추가' → '홈 화면'을 탭해요" },
    { n:3, icon:"✓",  text:"오른쪽 상단 '추가'를 탭하면 완료!" },
  ];
  const steps = tab === "samsung" ? SAMSUNG_STEPS : CHROME_STEPS;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3 text-3xl">📲</div>
          <p className="text-lg font-extrabold text-gray-900">AliTrack 홈 화면에 추가</p>
          <p className="text-xs text-gray-400 mt-1">앱처럼 빠르게 실행할 수 있어요</p>
        </div>

        {/* 브라우저 탭 선택 */}
        <div className="flex gap-2 mb-4 bg-[#F7F7F8] p-1 rounded-2xl">
          {[{id:"chrome",label:"Chrome"},{id:"samsung",label:"삼성 인터넷"}].map(b=>(
            <button key={b.id} onClick={()=>setTab(b.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                tab===b.id ? "bg-white text-orange-500 shadow-sm" : "text-gray-400"
              }`}>{b.label}</button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          {steps.map(({n,icon,text}) => (
            <div key={n} className="flex items-center gap-4 bg-[#F7F7F8] rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-base font-extrabold flex-shrink-0">{n}</div>
              <div>
                <p className="text-sm font-bold text-orange-500 mb-0.5">{icon}</p>
                <p className="text-sm font-semibold text-gray-800">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl px-4 py-3 mb-5 ${tab==="samsung" ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className={`text-xs text-center ${tab==="samsung" ? "text-blue-700" : "text-orange-700"}`}>
            💡 {tab==="samsung" ? "삼성 인터넷 브라우저 기준이에요" : "Chrome 브라우저 기준이에요"}
          </p>
        </div>

        <button onClick={onClose}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
          확인
        </button>
      </div>
    </div>
  );
};

// ─── iOS PWA 설치 안내 모달 ───────────────────────────────────────────
const IosInstallGuide = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50" />
    <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
         style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
         onClick={e => e.stopPropagation()}>
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <circle cx="12" cy="17" r="1" fill="#FF5A1F"/>
          </svg>
        </div>
        <p className="text-lg font-extrabold text-gray-900">AliTrack 앱 설치</p>
        <p className="text-xs text-gray-400 mt-1">Safari에서 홈 화면에 추가하세요</p>
      </div>
      <div className="space-y-3 mb-6">
        {[
          { n: 1, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          ), text: "화면 하단의 공유 버튼을 탭해요" },
          { n: 2, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          ), text: "'홈 화면에 추가'를 선택해요" },
          { n: 3, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ), text: "오른쪽 상단 '추가'를 탭하면 완료!" },
        ].map(({ n, icon, text }) => (
          <div key={n} className="flex items-center gap-4 bg-[#F7F7F8] rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
              {n}
            </div>
            <div className="text-gray-500 flex-shrink-0">{icon}</div>
            <p className="text-sm font-semibold text-gray-800">{text}</p>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 rounded-2xl px-4 py-3 mb-5">
        <p className="text-xs text-orange-700 text-center">
          💡 Safari 브라우저에서만 홈 화면 추가가 가능해요
        </p>
      </div>
      <button onClick={onClose}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
        확인
      </button>
    </div>
  </div>
);

// ─── 더보기 화면 ─────────────────────────────────────────────────────
const MoreScreen = ({ onFeedback, onPrivacy, onTerms, onHowTo, user, onLogin, onLogout, showToast, onInstall, isStandalone }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // 누적 절감액: 위시리스트 (orig - price) 합계
  const savings = getLocalWishlist().reduce((acc, p) => acc + ((p.orig || 0) - (p.price || 0)), 0);

  const clearCache = () => {
    try {
      const keep = ["alitrack_local_alerts","alitrack_wishlist","alitrack_guest_id","alitrack_onboarded","alitrack_cookie_consent","alitrack_notif_settings"];
      Object.keys(localStorage).filter(k=>!keep.includes(k)).forEach(k=>localStorage.removeItem(k));
    } catch {}
    showToast("캐시가 삭제됐어요");
  };

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-base font-bold text-gray-900">더보기</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* 누적 절감액 */}
        <div className="rounded-3xl p-5 text-white" style={{background:"linear-gradient(135deg,#FF5A1F,#F59E0B)"}}>
          <p className="text-xs font-bold opacity-80 mb-1">나의 누적 절감액</p>
          <p className="text-3xl font-extrabold">{savings > 0 ? fmt(savings) : "0원"}</p>
          <p className="text-xs opacity-70 mt-1">알리트랙으로 절약한 금액이에요 🎉</p>
        </div>

        {/* 계정 */}
        {user ? (
          <div className="bg-[#F7F7F8] rounded-2xl px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-blue-500 font-bold">이메일 회원</p>
            </div>
            <button onClick={onLogout} className="text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200">로그아웃</button>
          </div>
        ) : (
          <button onClick={onLogin}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2">
            📧 이메일로 가입하고 데이터 보관
          </button>
        )}

        {/* 서비스 설정 */}
        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">서비스 설정</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            <button onClick={()=>setShowNotif(true)}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <span className="text-lg">🔔</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">알림 설정</span>
              <span className="text-gray-400 text-xs">›</span>
            </button>
            {!isStandalone && (
              <button onClick={onInstall}
                className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-sm font-semibold text-gray-800">AliTrack 전용 앱 설치</span>
                  <span className="text-[10px] text-gray-400">홈 화면에 추가 · 앱처럼 빠르게 실행</span>
                </div>
                <span className="text-gray-400 text-xs">›</span>
              </button>
            )}
            <button onClick={clearCache}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-100 transition">
              <span className="text-lg">🗑️</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">앱 캐시 삭제</span>
              <span className="text-xs text-orange-500 font-bold">삭제</span>
            </button>
          </div>
        </div>

        {/* 고객 지원 */}
        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">고객 지원</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            <button
              onClick={() => {
                if (window.ChannelIOBooted) {
                  window.ChannelIO('openChat');
                } else if (window.ChannelIO) {
                  // SDK 로딩 중 — 잠시 후 재시도
                  setTimeout(() => {
                    if (window.ChannelIOBooted) window.ChannelIO('openChat');
                    else showToast("채팅 연결 중이에요. 잠시 후 다시 눌러주세요.");
                  }, 2000);
                  showToast("채팅을 연결하는 중이에요...");
                } else {
                  showToast("채팅 기능을 불러오는 중이에요. 잠시 후 다시 눌러주세요.");
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className="block text-sm font-semibold text-gray-800">1:1 AI 고객상담</span>
                <span className="text-[10px] text-gray-400">궁금한 점을 바로 물어보세요</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">AI</span>
            </button>
            <button onClick={()=>setShowWithdraw(true)}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <span className="text-lg">🚪</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">계정 탈퇴</span>
              <span className="text-gray-400 text-xs">›</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-lg">ℹ️</span>
              <span className="flex-1 text-sm font-semibold text-gray-800">현재 버전</span>
              <span className="text-xs text-gray-400 font-medium">v4.2.0</span>
            </div>
          </div>
        </div>

        {/* 앱 정보 */}
        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">앱 정보</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            {[
              { icon:"📖", label:"사용법 가이드",      action: onHowTo  },
              { icon:"🔒", label:"개인정보처리방침", action: onPrivacy },
              { icon:"📄", label:"이용약관",         action: onTerms  },
            ].map((i,idx,arr)=>(
              <button key={i.label} onClick={i.action}
                className={`w-full flex items-center gap-3 px-4 py-4 active:bg-gray-100 transition ${idx<arr.length-1?"border-b border-gray-100":""}`}>
                <span className="text-lg">{i.icon}</span>
                <span className="flex-1 text-sm font-semibold text-gray-800 text-left">{i.label}</span>
                <span className="text-gray-400 text-xs">›</span>
              </button>
            ))}
            <p className="px-4 py-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100">
              본 서비스는 더 나은 기능을 위해 익명화된 분석 데이터를 사용합니다. 개인을 식별하는 정보는 수집하지 않습니다.
            </p>
          </div>
        </div>

        <div className="text-center py-3">
          <p className="text-xs text-gray-400">AliTrack v4.2.0 · © 2026 AliTrack</p>
          <p className="text-[10px] text-gray-300 mt-1">Made with ❤️ for Korean Ali Shoppers</p>
        </div>
      </div>

      {showNotif && <NotificationSettingsSheet onClose={()=>setShowNotif(false)}/>}

      {showWithdraw && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-6" onClick={()=>setShowWithdraw(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-[340px]" onClick={e=>e.stopPropagation()}>
            <p className="text-base font-extrabold text-gray-900 mb-2">정말 탈퇴하시겠어요?</p>
            <p className="text-xs text-gray-400 mb-5">탈퇴 시 모든 데이터가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={()=>setShowWithdraw(false)}
                className="flex-1 py-3 rounded-2xl bg-[#F7F7F8] text-sm font-bold text-gray-600">취소</button>
              <button onClick={()=>{ showToast("탈퇴 처리되었습니다."); setShowWithdraw(false); if(onLogout) onLogout(); }}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-sm font-bold text-white">탈퇴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ⑧ 서사적 사용법 가이드
// ═══════════════════════════════════════════════════════════════════
const HowToUseScreen = ({ onBack }) => {
  const steps = [
    {
      num: 1,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      tag: "첫 만남",
      color: "orange",
      title: "가입 없이 바로 시작해요",
      desc: "회원가입? 로그인? 필요 없어요. AliTrack은 처음 접속하는 순간부터 당신의 쇼핑 비서가 됩니다.",
      action: "접속하면",
      result: "바로 쇼핑 시작",
      tip: "이메일 가입 시 기기를 바꿔도 데이터가 유지돼요",
    },
    {
      num: 2,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
      tag: "상품 탐색",
      color: "blue",
      title: "키워드 하나면 세상의 가격이 열려요",
      desc: "찾고 싶은 상품 키워드를 검색창에 입력하세요. 할인율·가격·리뷰까지 한눈에 정렬해 드려요.",
      action: "키워드 입력 →",
      result: "최저가 상품 목록",
      tip: "카테고리 버튼으로 분야별 핫딜을 빠르게 찾아요",
    },
    {
      num: 3,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      tag: "가격 기록",
      color: "purple",
      title: "구경만 해도 기록이 쌓여요",
      desc: "상세 페이지를 열면 AliTrack이 자동으로 그 상품을 기억해둬요. 나중에 가격 기록 탭에서 다시 볼 수 있어요.",
      action: "상세 페이지 방문 →",
      result: "자동 가격 기록 저장",
      tip: "역대 최저가 대비 현재 가격을 그래프로 확인하세요",
    },
    {
      num: 4,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      tag: "가격 알림",
      color: "amber",
      title: "목표가를 설정하면, 우리가 대신 지켜봐요",
      desc: "원하는 가격을 정해두면 도달하는 순간 브라우저로 바로 알려드려요. 앱 설치 없이도 24시간 작동해요.",
      action: "🔔 알림 설정 →",
      result: "목표가 달성 시 즉시 알림",
      tip: "가격 기록 탭의 벨 아이콘으로도 알림을 관리해요",
    },
    {
      num: 5,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/>
        </svg>
      ),
      tag: "앱 설치",
      color: "emerald",
      title: "홈 화면에 추가하면 진짜 앱이 돼요",
      desc: "더보기 탭에서 'AliTrack 전용 앱 설치'를 누르면 스마트폰 홈 화면에 바로 추가돼요. 앱스토어 없이도 앱처럼 실행!",
      action: "더보기 → 앱 설치 →",
      result: "앱처럼 즉시 실행",
      tip: "iOS라면 사파리 하단 공유 버튼 → 홈 화면에 추가",
    },
  ];

  const tips = [
    {
      icon: "📊",
      title: "가격의 파도를 읽어요",
      desc: "상세 페이지의 가격 그래프는 단순한 숫자가 아니에요. '역대 최저가 기준선'과 지금 가격을 비교해 지금이 구매 골든타임인지 확인하세요.",
      badge: "가격 분석",
      badgeColor: "blue",
    },
    {
      icon: "⏰",
      title: "타이밍이 곧 절약이에요",
      desc: "가격 기록 탭에서 역대 최저가에 가장 근접한 상품이 맨 위에 정렬돼요. '지금이 기회'인 상품을 한눈에 파악하세요.",
      badge: "타이밍 전략",
      badgeColor: "purple",
    },
    {
      icon: "⚖️",
      title: "직구 vs 국내 배송, 이제 비교해요",
      desc: "알리익스프레스의 가격과 배송 기간을 미리 파악하고, 쿠팡의 빠른 배송과 비교해 무엇이 최선인지 직접 결정하세요. 정보가 힘이에요.",
      badge: "현명한 선택",
      badgeColor: "emerald",
    },
  ];

  const colorMap = {
    orange:  { bg: "bg-orange-50",  ring: "ring-orange-100",  badge: "bg-orange-100 text-orange-600",  pill: "bg-orange-500" },
    blue:    { bg: "bg-blue-50",    ring: "ring-blue-100",    badge: "bg-blue-100 text-blue-600",      pill: "bg-blue-500" },
    purple:  { bg: "bg-purple-50",  ring: "ring-purple-100",  badge: "bg-purple-100 text-purple-600",  pill: "bg-purple-500" },
    amber:   { bg: "bg-amber-50",   ring: "ring-amber-100",   badge: "bg-amber-100 text-amber-600",    pill: "bg-amber-500" },
    emerald: { bg: "bg-emerald-50", ring: "ring-emerald-100", badge: "bg-emerald-100 text-emerald-600",pill: "bg-emerald-500" },
  };
  const tipColor = { blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600", emerald: "bg-emerald-100 text-emerald-600" };

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기"
          className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <p className="text-base font-bold text-gray-900">사용법 가이드</p>
      </div>

      <div className="px-4 pb-10">
        {/* 히어로 */}
        <div className="mt-5 mb-6 bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl px-5 py-6 text-white shadow-lg shadow-orange-200">
          <p className="text-[11px] font-bold opacity-80 tracking-widest mb-2">SMART SHOPPING GUIDE</p>
          <p className="text-xl font-extrabold leading-tight mb-1">똑똑한 쇼핑의 시작,</p>
          <p className="text-xl font-extrabold leading-tight mb-4">AliTrack과 함께해요</p>
          <p className="text-xs opacity-85 leading-relaxed">
            가입 없이 시작하고, 가격을 기억하고,<br/>
            목표가에 도달하면 바로 알림을 받아요.
          </p>
          <div className="flex gap-2 mt-4">
            {["무료","가입 불필요","실시간 알림"].map(t => (
              <span key={t} className="text-[10px] font-bold bg-white/20 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>

        {/* 섹션 1 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            <p className="text-sm font-extrabold text-gray-900">쇼핑의 시작, AliTrack 기초 가이드</p>
          </div>

          <div className="space-y-3">
            {steps.map(s => {
              const c = colorMap[s.color];
              return (
                <div key={s.num} className={`bg-white rounded-3xl p-5 shadow-sm ring-1 ${c.ring}`}>
                  {/* 상단: 번호 + 태그 + 아이콘 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${c.pill} text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0`}>
                        {s.num}
                      </div>
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${c.badge}`}>{s.tag}</span>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                      {s.icon}
                    </div>
                  </div>

                  {/* 제목 + 설명 */}
                  <p className="text-base font-extrabold text-gray-900 leading-snug mb-1.5">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{s.desc}</p>

                  {/* 행동 → 결과 플로우 */}
                  <div className="flex items-center gap-2 bg-[#F7F7F8] rounded-2xl px-4 py-3 mb-3">
                    <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{s.action}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className={`text-xs font-extrabold flex-1 ${s.color === "orange" ? "text-orange-500" : s.color === "blue" ? "text-blue-500" : s.color === "purple" ? "text-purple-500" : s.color === "amber" ? "text-amber-500" : "text-emerald-500"}`}>
                      {s.result}
                    </span>
                  </div>

                  {/* 팁 */}
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-extrabold text-orange-500 flex-shrink-0 mt-0.5">TIP</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{s.tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-6 px-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 tracking-widest">LEVEL UP</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 섹션 2 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <p className="text-sm font-extrabold text-gray-900">💡 더 똑똑하게 쇼핑하는 법</p>
          </div>

          <div className="space-y-3">
            {tips.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${tipColor[t.badgeColor]}`}>{t.badge}</span>
                    </div>
                    <p className="text-sm font-extrabold text-gray-900 leading-snug mb-1.5">{t.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 마무리 배너 */}
        <div className="bg-gray-900 rounded-3xl px-5 py-6 text-white text-center">
          <p className="text-2xl mb-2">🛒</p>
          <p className="text-base font-extrabold mb-1">이제 당신도 가격 고수</p>
          <p className="text-xs opacity-70 leading-relaxed">
            충동구매는 이제 그만, AliTrack과 함께<br/>
            기다리고, 비교하고, 최저가에 구매하세요.
          </p>
          <div className="mt-4 h-px bg-white/10" />
          <p className="text-[10px] opacity-50 mt-3">AliTrack · 알리익스프레스 가격 추적 서비스</p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// App 루트 — 7가지 기능 통합
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen]         = useState("home");
  const [activeNav, setActiveNav]   = useState("home");
  const [selProduct, setSelProduct] = useState(null);
  const [selCat, setSelCat]         = useState(null);
  const [loginModal, setLoginModal] = useState(null);
  const [user, setUser]             = useState(null);
  const [toast, setToast]           = useState({msg:"",visible:false});
  const toastTimer                  = useRef(null);
  const scrollPositions             = useRef({});
  const mainRef                     = useRef(null);

  // 딥링크 처리: /p/{product_id} → 상품 상세 화면으로 이동
  useEffect(() => {
    const match = window.location.pathname.match(/^\/p\/(\d+)$/);
    if (!match) return;
    const productId = match[1];
    fetch(`${API_BASE}/api/ali/product/${productId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.id) {
          setSelProduct(mapProduct(data));
          setScreen("detail");
        }
      })
      .catch(() => {});
    // URL을 루트로 교체 (뒤로가기 시 홈으로)
    window.history.replaceState({}, "", "/");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ⑤ 온보딩 — 첫 방문자에게만 표시
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("alitrack_onboarded"); }
    catch { return false; }
  });

  // ③ 쿠키 배너 — 동의 미완료 시 표시
  const [showCookie, setShowCookie] = useState(() => {
    try { return !localStorage.getItem("alitrack_cookie_consent"); }
    catch { return false; }
  });

  // ⑥ PWA 설치 상태
  const [pwaInstallable, setPwaInstallable] = useState(() => !!window.__pwa);
  const [showIosGuide, setShowIosGuide]         = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const isSamsung    = /SamsungBrowser/i.test(navigator.userAgent);
  const isAndroid    = /Android/i.test(navigator.userAgent);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(
    () => localStorage.getItem("alitrack_install_dismissed") === "1"
  );
  const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
                    || !!window.navigator.standalone;
  // Android 전체 + iOS + Chrome이 프롬프트 띄울 때 표시
  const showInstallMenu   = !isStandalone && (pwaInstallable || isIOS || isAndroid);
  const showInstallBanner = showInstallMenu && !installBannerDismissed;

  const dismissInstallBanner = () => {
    localStorage.setItem("alitrack_install_dismissed", "1");
    setInstallBannerDismissed(true);
  };

  useEffect(() => {
    const onInstallable = () => setPwaInstallable(true);
    const onInstalled   = () => setPwaInstallable(false);
    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("pwa-installed",   onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("pwa-installed",   onInstalled);
    };
  }, []);

  // 앱 시작 시 저장된 토큰으로 로그인 상태 복원
  useEffect(() => {
    const stored = (() => { try { return sessionStorage.getItem("ali_token"); } catch { return null; } })();
    if (!stored) return;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.logged_in) return;
        setUser(data);
        // 이메일 가입 후 게스트 로컬 알림 → 계정 통합
        const localAlerts = getLocalAlerts();
        if (localAlerts.length > 0) {
          fetch(`${API_BASE}/api/alerts/merge-guest`, {
            method: "POST",
            headers: { Authorization: `Bearer ${stored}`, "Content-Type": "application/json" },
            body: JSON.stringify({ alerts: localAlerts }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.merged > 0) {
                showToast(`알림 ${d.merged}건이 계정에 통합됐어요 🎉`);
                localStorage.removeItem("alitrack_local_alerts");
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg)=>{
    clearTimeout(toastTimer.current);
    setToast({msg,visible:true});
    toastTimer.current=setTimeout(()=>setToast(p=>({...p,visible:false})),2200);
  },[]);

  const handleLogout = useCallback(() => {
    try { sessionStorage.removeItem("ali_token"); } catch {}
    setUser(null);
    showToast("로그아웃되었습니다.");
  }, [showToast]);

  // ④ 피드백 시트
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  const showLogin = useCallback(()=>setLoginModal(true),[]);
  const handleLoginDismiss = ()=>setLoginModal(null);
  const handleLoginSuccess = useCallback((data)=>{
    setUser({ user_id: data.user_id || "", email: data.email, provider: data.provider || "email", logged_in: true });
    showToast("이메일로 로그인 성공!");
  },[showToast]);

  const saveScroll = useCallback(()=>{
    if(mainRef.current) scrollPositions.current[screen]=mainRef.current.scrollTop;
  },[screen]);

  const restoreScroll = useCallback((s)=>{
    requestAnimationFrame(()=>{
      if(mainRef.current && scrollPositions.current[s]!=null)
        mainRef.current.scrollTop=scrollPositions.current[s];
    });
  },[]);

  const goTo = useCallback((s)=>{
    saveScroll();
    window.history.pushState({screen:s},"");
    setScreen(s);
    requestAnimationFrame(()=>{ if(mainRef.current) mainRef.current.scrollTop = 0; });
  },[saveScroll]);
  const goCategory = useCallback((cat)=>{ setSelCat(cat); goTo("feed"); setActiveNav("home"); },[goTo]);
  const goProduct  = useCallback((p)=>{ setSelProduct(p); goTo("detail"); trackEvent("product_view", { product_id: p.id, product_name: p.name, price: p.price }); },[goTo]);
  const goBack     = useCallback(()=>window.history.back(),[]);
  const goHome     = useCallback(()=>{ goTo("home"); setActiveNav("home"); },[goTo]);

  const scrollToProducts = useCallback(()=>{
    goHome();
    setTimeout(()=>{
      const el = document.getElementById("hot-products-section");
      if(el && mainRef.current) mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }, 350);
  },[goHome]);

  const handleNav = useCallback((id)=>{
    setActiveNav(id);
    // 모든 탭 미회원도 접근 가능 (localStorage 기반으로 동작)
    goTo(id);
  },[goTo,showLogin,user]);

  useEffect(()=>{
    const onPop=()=>setScreen(prev=>{
      const next=["detail","feed","privacy","terms"].includes(prev)
        ? prev==="detail" ? "feed" : prev==="feed" ? "home" : "home"
        : "home";
      restoreScroll(next); return next;
    });
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[restoreScroll]);

  // 쿠키 동의 처리
  const handleCookieAccept = () => {
    try { localStorage.setItem("alitrack_cookie_consent","all"); } catch {}
    setShowCookie(false);
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
  };
  const handleCookieDecline = () => {
    try { localStorage.setItem("alitrack_cookie_consent","essential"); } catch {}
    setShowCookie(false);
  };

  // 온보딩 완료 처리
  const handleOnboardingDone = () => {
    try { localStorage.setItem("alitrack_onboarded","1"); } catch {}
    setShowOnboarding(false);
  };

  // PWA 설치
  const handlePwaInstall = async () => {
    if (isStandalone) {
      showToast("이미 앱으로 설치되어 있어요 ✅");
      return;
    }
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    // Chrome이 자동 프롬프트를 쏜 경우 → 네이티브 설치 다이얼로그
    if (window.__pwa?.install) {
      const accepted = await window.__pwa.install();
      setPwaInstallable(false);
      if (accepted) showToast("앱 설치가 시작되었습니다 🎉");
      else showToast("설치가 취소되었습니다");
      return;
    }
    // 그 외 Android (삼성 인터넷, Chrome 프롬프트 없음 등) → 수동 안내
    setShowAndroidGuide(true);
  };

  const renderScreen = () => {
    switch(screen){
      case "home":     return <HomeScreen onCategory={goCategory} onProduct={goProduct} showLogin={showLogin} showToast={showToast} onInstall={handlePwaInstall} showInstallBanner={showInstallBanner} onDismissInstall={dismissInstallBanner}/>;
      case "feed":     return selCat?<CategoryFeedScreen cat={selCat} onBack={goBack} onProduct={goProduct}/>:null;
      case "detail":   return selProduct?<DetailScreen product={selProduct} onBack={goBack} showLogin={showLogin} showToast={showToast} user={user}/>:null;
      case "history":  return <PriceHistoryScreen onBack={goBack} onScrollToProducts={scrollToProducts} onProduct={goProduct} showToast={showToast}/>;
      case "wishlist": return <LocalWishlistScreen onBack={goBack} onGoHome={goHome} onProduct={goProduct} showToast={showToast}/>;
      case "mypage":   return (
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p className="text-base font-bold text-gray-900">나의기록</p>
          </div>
          {user ? <LoggedInMypage user={user} onLogout={handleLogout}/> : <EmptyMypage onLogin={showLogin}/>}
        </div>
      );
      case "more":     return <MoreScreen onFeedback={()=>setShowFeedback(true)} onPrivacy={()=>goTo("privacy")} onTerms={()=>goTo("terms")} onHowTo={()=>goTo("howto")} user={user} onLogin={showLogin} onLogout={handleLogout} showToast={showToast} onInstall={handlePwaInstall} isStandalone={isStandalone}/>;
      // 법적/안내 페이지
      case "howto":    return <HowToUseScreen onBack={goBack}/>;
      case "privacy":  return <PrivacyScreen onBack={goBack}/>;
      case "terms":    return <TermsScreen onBack={goBack}/>;
      default:         return <HomeScreen onCategory={goCategory} onProduct={goProduct} showLogin={showLogin} showToast={showToast}/>;
    }
  };

  // 더보기 탭 포함 네비 (5탭으로 복원)
  const NAV_ITEMS_FULL = [
    { id:"home",     icon:"🏠", label:"홈(핫딜)" },
    { id:"history",  icon:"📈", label:"가격기록" },
    { id:"wishlist", icon:"❤️", label:"찜한상품" },
    { id:"mypage",   icon:"👤", label:"나의기록" },
    { id:"more",     icon:"☰",  label:"더보기"   },
  ];

  return (
    <>
      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        .scrollbar-none::-webkit-scrollbar{display:none;}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .animate-slideUp{animation:slideUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
        .animate-pulse{animation:pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .animate-spin{animation:spin 0.8s linear infinite;}
        .line-clamp-1{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      `}</style>

      {/* ⑤ 온보딩 */}
      {showOnboarding && <OnboardingScreen onDone={handleOnboardingDone}/>}

      <Toast msg={toast.msg} visible={toast.visible}/>

      <div className="min-h-screen bg-white flex justify-center"
           style={{fontFamily:"'Pretendard','Apple SD Gothic Neo',system-ui,sans-serif"}}>
        <div className="w-full max-w-[600px] min-h-screen bg-white flex flex-col">

          {/* 헤더 */}
          <header className="sticky top-0 z-20 bg-white/96 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
            <button onClick={()=>{goTo("home");setActiveNav("home");}} aria-label="AliTrack 홈으로 이동" className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">AliTrack</span>
              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">BETA</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowNotifSettings(true)} aria-label="알림 설정"
                className="w-8 h-8 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-sm active:bg-gray-200 transition">🔔</button>
              <button onClick={()=>{ if(user){ goTo("mypage"); setActiveNav("mypage"); } else showLogin(); }}
                aria-label={user ? "마이페이지" : "로그인"}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition ${user?"bg-blue-50 active:bg-blue-100":"bg-[#F7F7F8] active:bg-gray-200"}`}>👤</button>
            </div>
          </header>

          <main ref={mainRef}
                style={{paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)`,overflowY:"auto",flex:1}}>
            {renderScreen()}
          </main>

          {/* 하단 네비 — 5탭 */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
               style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",
                       paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
            <div className="w-full max-w-[600px] flex border-t border-gray-100">
              {NAV_ITEMS_FULL.map(n=>(
                <button key={n.id} onClick={()=>handleNav(n.id)}
                  aria-label={n.label}
                  aria-current={activeNav===n.id ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeNav===n.id?"text-orange-500":"text-gray-400"}`}>
                  <span className="text-xl leading-none">{n.icon}</span>
                  <span className="text-[10px] font-semibold">{n.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* ④ 피드백 시트 */}
      {showFeedback && <FeedbackSheet onClose={()=>setShowFeedback(false)} showToast={showToast}/>}

      {/* 알림 설정 시트 */}
      {showNotifSettings && <NotificationSettingsSheet onClose={()=>setShowNotifSettings(false)}/>}

      {/* iOS PWA 설치 안내 */}
      {showIosGuide && <IosInstallGuide onClose={()=>setShowIosGuide(false)}/>}

      {/* Android / 공통 PWA 설치 안내 */}
      {showAndroidGuide && <AndroidInstallGuide onClose={()=>setShowAndroidGuide(false)} isSamsung={isSamsung}/>}

      {/* 이메일 로그인/가입 모달 */}
      {loginModal && <EmailAuthModal onDismiss={handleLoginDismiss} onLoginSuccess={handleLoginSuccess}/>}
    </>
  );
}
