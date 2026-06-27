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
  { namePrefix:"Joyroom 케이블 세트",   shortPrefix:"케이블 세트",     basePrice:7500,   image:"https://placehold.co/320x320/EFF6FF/60A5FA?text=🔗", tag:"특가",       deliveryDays:3, rating:4.6 },
  { namePrefix:"Baseus 무선충전 패드",  shortPrefix:"무선충전 패드",   basePrice:4500,   image:"https://placehold.co/320x320/FFF1F2/F43F5E?text=📡", tag:"긴급핫딜",   deliveryDays:5, rating:4.4 },
  { namePrefix:"Xiaomi 공기청정기",     shortPrefix:"샤오미 공기청정기",basePrice:89000, image:"https://placehold.co/320x320/F0FDF4/4ADE80?text=🌀", tag:"역대최저",   deliveryDays:5, rating:4.8 },
  { namePrefix:"LED 마스크팩 기기",     shortPrefix:"LED 마스크팩",    basePrice:32000,  image:"https://placehold.co/320x320/FFF7ED/FB923C?text=💄", tag:"핫딜",       deliveryDays:4, rating:4.5 },
  { namePrefix:"HAGIBIS USB-C 허브",    shortPrefix:"USB-C 허브",      basePrice:24900,  image:"https://placehold.co/320x320/F0F0FF/818CF8?text=🔗", tag:"특가",       deliveryDays:5, rating:4.6 },
  { namePrefix:"Baseus 보조배터리",     shortPrefix:"보조배터리",      basePrice:28900,  image:"https://placehold.co/320x320/FFF8F0/FB923C?text=🔋", tag:"역대최저",   deliveryDays:3, rating:4.7 },
  { namePrefix:"Xiaomi 게이밍 마우스",  shortPrefix:"게이밍 마우스",   basePrice:16500,  image:"https://placehold.co/320x320/F0FFF8/34D399?text=🖱", tag:"핫딜",       deliveryDays:5, rating:4.4 },
  { namePrefix:"UGREEN 노트북 거치대",  shortPrefix:"노트북 거치대",   basePrice:19900,  image:"https://placehold.co/320x320/F8F0FF/C084FC?text=💻", tag:"최저가근접", deliveryDays:4, rating:4.5 },
  { namePrefix:"샤오미 스마트 플러그",  shortPrefix:"스마트 플러그",   basePrice:8500,   image:"https://placehold.co/320x320/ECFDF5/10B981?text=🔌", tag:"특가",       deliveryDays:5, rating:4.3 },
  { namePrefix:"Anker 마그네틱 케이블", shortPrefix:"마그네틱 케이블", basePrice:12000,  image:"https://placehold.co/320x320/EFF6FF/3B82F6?text=🔗", tag:"핫딜",       deliveryDays:4, rating:4.6 },
  { namePrefix:"JMGO 미니 빔프로젝터",  shortPrefix:"미니 빔프로젝터", basePrice:145000, image:"https://placehold.co/320x320/FDF4FF/A855F7?text=📽", tag:"역대최저",   deliveryDays:5, rating:4.7 },
  { namePrefix:"Dreame 무선 청소기",    shortPrefix:"무선 청소기",     basePrice:178000, image:"https://placehold.co/320x320/F0FDF4/22C55E?text=🌀", tag:"긴급핫딜",   deliveryDays:5, rating:4.8 },
];

const PAGE_SIZE = 10; // 한 번에 로드할 상품 수

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.alitrack.kr";

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
  { id:"domestic",  icon:"🚢", label:"한국배송" },
  { id:"cheap",     icon:"💸", label:"초저가템" },
  { id:"popular",   icon:"🏆", label:"인기랭킹" },
  { id:"reviewed",  icon:"⭐", label:"리뷰많은" },
  { id:"limited",   icon:"⚡", label:"한정특가" },
  { id:"value",     icon:"💎", label:"실속상품" },
  { id:"monthly",   icon:"📅", label:"월간옵션" },
  { id:"freeship",  icon:"🚚", label:"무료배송" },
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
  { id:"b1", title:"2026 알리 메가 세일",  sub:"선착순 최대 50% 특가",     badge:"🗓 메가세일",   bg:"linear-gradient(135deg,#FF5A1F,#f7462a)",  products:["갤럭시 버즈","스마트워치","충전기"] },
  { id:"b2", title:"공식 브랜드 위크",     sub:"샤오미·안커·바세우스 특가", badge:"🏷 브랜드위크", bg:"linear-gradient(135deg,#6366F1,#8B5CF6)",  products:["노트북","이어폰","스마트홈"] },
  { id:"b3", title:"플래시 딜 3시간",      sub:"오늘만 이 가격!",           badge:"⚡ 긴급",       bg:"linear-gradient(135deg,#0EA5E9,#6366F1)",  products:["케이블","보조배터리","거치대"] },
  { id:"b4", title:"무료배송 페스티벌",    sub:"전품목 무료배송 이벤트",    badge:"🚚 무배축제",   bg:"linear-gradient(135deg,#10B981,#0EA5E9)",  products:["생활용품","뷰티","주방"] },
  { id:"b5", title:"5일 특급 배송전",      sub:"5일 내 도착 보장 상품만",   badge:"🚀 5일배송",    bg:"linear-gradient(135deg,#F59E0B,#EF4444)",  products:["전자제품","패션","홈데코"] },
];

// ═══════════════════════════════════════════════════════════════════
// 유틸
// ═══════════════════════════════════════════════════════════════════
const fmt       = (n) => n.toLocaleString("ko-KR") + "원";
const avg60     = (h) => Math.round(h.reduce((s,d) => s+d.price, 0) / h.length / 100) * 100;
const idToSeed  = (id) => id.split("").reduce((a,c) => a + c.charCodeAt(0), 0) * 9301;
const NAV_H     = 56;
const BTN_H     = 72;

const buildAffiliateUrl = (productId) =>
  `https://www.aliexpress.com/item/${productId}.html`;

const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement("textarea");
    el.value = text; el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el); el.focus(); el.select();
    document.execCommand("copy"); document.body.removeChild(el);
  }
};

const generateHistory = (current, seed) => {
  const pts = []; const today = new Date();
  let rng = seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  let p = current * 1.4;
  for (let i = 60; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    p = i === 0 ? current : Math.max(current * 1.02, p + (rand() - 0.52) * current * 0.07);
    if (i % 4 === 0 || i === 0)
      pts.push({ date:`${d.getMonth()+1}/${d.getDate()}`, price:Math.round(p/100)*100 });
  }
  return pts;
};

// ═══════════════════════════════════════════════════════════════════
// ✅ 핵심 훅: useInfiniteProducts
//    - API 연동 시 generateDummyPage → fetch 로만 바꾸면 됩니다
//    - 실제 알리처럼 스크롤 끝에 닿을 때마다 다음 페이지 자동 로드
// ═══════════════════════════════════════════════════════════════════
const useInfiniteProducts = () => {
  const [items, setItems]       = useState([]);
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [initialized, setInitialized] = useState(false);
  const loaderRef               = useRef(null);
  const loadingRef              = useRef(false); // ref로도 관리해서 클로저 문제 방지

  const fetchPage = useCallback(async (pageNum) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      // ── API 연동 시 아래 한 줄만 교체 ──
      // const res = await fetch(`/api/products?page=${pageNum}&size=${PAGE_SIZE}`);
      // const data = await res.json();
      // const newItems = data.items;
      const newItems = await generateDummyPage(pageNum);
      // ────────────────────────────────────
      setItems(prev => {
        // 중복 id 방지
        const existingIds = new Set(prev.map(p => p.id));
        const unique = newItems.filter(p => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
      setPage(pageNum);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized]);

  // 최초 1페이지 로드
  useEffect(() => {
    fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver — 로더 div가 보이면 다음 페이지 요청
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchPage(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" } // 200px 미리 감지해서 끊김 방지
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, fetchPage]);

  return { items, loading, initialized, loaderRef };
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
    <button onClick={() => onProduct(p)}
      className="rounded-2xl bg-[#F7F7F8] overflow-hidden text-left active:opacity-75 transition w-full">
      <div className="relative">
        <img src={p.image} alt={p.shortName} loading="lazy"
          className="w-full aspect-square object-cover" />
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
            ? <span className="text-[11px] font-bold text-blue-500">▼ {p.discount}%</span>
            : p.discount < 0
            ? <span className="text-[11px] font-bold text-red-500">▲ {Math.abs(p.discount)}%</span>
            : null}
        </div>
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
const InfiniteProductGrid = ({ onProduct, title }) => {
  const { items, loading, initialized, loaderRef } = useInfiniteProducts();

  return (
    <div>
      {title && <p className="text-sm font-bold text-gray-900 mb-3">{title}</p>}

      {/* 첫 로드 전 — 스켈레톤 전체 표시 */}
      {!initialized ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(8).fill(0).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {items.map(p => <ProductCard key={p.id} product={p} onProduct={onProduct} />)}

            {/* 추가 로드 중 — 하단에 스켈레톤 2개 */}
            {loading && <><SkeletonCard /><SkeletonCard /></>}
          </div>

          {/* 로더 감지 영역 — 이 div가 뷰포트에 들어오면 다음 페이지 로드 */}
          <div ref={loaderRef}>
            {loading && <LoadingSpinner />}
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 하단 네비
// ═══════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id:"home",     icon:"🏠", label:"홈(핫딜)" },
  { id:"history",  icon:"📈", label:"가격기록" },
  { id:"wishlist", icon:"❤️", label:"찜한상품" },
  { id:"mypage",   icon:"👤", label:"나의기록" },
];

const BottomNav = ({ active, onNav }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
       style={{ background:"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)",
                paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
    <div className="w-full max-w-[600px] flex border-t border-gray-100">
      {NAV_ITEMS.map(n => (
        <button key={n.id} onClick={() => onNav(n.id)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active===n.id?"text-orange-500":"text-gray-400"}`}>
          <span className="text-xl leading-none">{n.icon}</span>
          <span className="text-[10px] font-semibold">{n.label}</span>
        </button>
      ))}
    </div>
  </nav>
);

// ═══════════════════════════════════════════════════════════════════
// 모달: 로그인
// ═══════════════════════════════════════════════════════════════════
const SOCIAL_PROVIDERS = [
  { key:"kakao",  label:"카카오톡으로 계속하기", bg:"#FEE500", text:"#181600", icon:"💬" },
  { key:"naver",  label:"네이버로 계속하기",     bg:"#03C75A", text:"#fff",    icon:"N",  fw:true },
  { key:"google", label:"구글로 계속하기",       bg:"#fff",    text:"#444",    icon:"G",  fw:true, border:true },
];

const LoginModal = ({ onDismiss }) => {
  const handleSocial = (key) => {
    window.location.href = `${API_BASE}/api/auth/${key}/login`;
  };
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <p className="text-xl font-extrabold text-gray-900 text-center">3초 만에 가입하고</p>
        <p className="text-xl font-extrabold text-orange-500 text-center mb-1">최저가 알림 받기 🔔</p>
        <p className="text-xs text-gray-400 text-center mb-7">간편 로그인으로 가입 즉시 이용 가능</p>
        <div className="space-y-3">
          {SOCIAL_PROVIDERS.map(b => (
            <button key={b.key} onClick={() => handleSocial(b.key)}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition active:scale-95 ${b.border ? "border border-gray-200 shadow-sm" : ""}`}
              style={{background: b.bg, color: b.text}}>
              <span className={b.fw ? "font-extrabold text-base" : "text-lg"}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
        <button onClick={onDismiss} className="w-full mt-4 py-2 text-xs text-gray-400">나중에 하기</button>
      </div>
    </div>
  );
};

// 모달: 공유
const ShareSheet = ({ product, onClose, showToast }) => {
  const copy = async () => {
    try { await copyToClipboard(`https://alitrack.kr/p/${product.id}`); showToast("링크가 복사되었습니다!"); }
    catch { showToast("복사 실패. 다시 시도해주세요."); }
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-sm font-bold text-gray-900 mb-4">공유하기</p>
        {[{label:"카카오톡으로 공유",icon:"💬",action:onClose},{label:"문자로 보내기",icon:"📱",action:onClose},{label:"링크 복사하기",icon:"🔗",action:copy}]
          .map(i=>(
            <button key={i.label} onClick={i.action}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition text-sm font-semibold text-gray-800 mb-2">
              <span className="text-xl">{i.icon}</span>{i.label}
            </button>
          ))}
      </div>
    </div>
  );
};

// 모달: 알림
const ALERT_ITEMS = [
  {id:"lowest",  label:"역대 최저가 돌파 알림",     emoji:"📉"},
  {id:"card",    label:"내 보유카드 맞춤 할인 알림", emoji:"🎟️"},
  {id:"restock", label:"품절 상품 재입고 알림",      emoji:"📦"},
  {id:"watch",   label:"관심상품 가격 변동 알림",    emoji:"🌟"},
];

const AlertModal = ({ onClose, showToast }) => {
  const [toggles, setToggles] = useState({lowest:true,card:false,restock:false,watch:true});
  const flip = (id) => setToggles(p=>{
    const n={...p,[id]:!p[id]};
    showToast(n[id]?"알림이 설정되었어요 🔔":"알림이 해제되었어요");
    return n;
  });
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 24px)"}}
           onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-base font-bold text-gray-900 mb-1">알림 설정</p>
        <p className="text-xs text-gray-400 mb-5">원하는 알림만 골라서 받으세요</p>
        <div className="space-y-2">
          {ALERT_ITEMS.map(item=>(
            <div key={item.id} className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
              </div>
              <button onClick={()=>flip(item.id)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${toggles[item.id]?"bg-orange-500":"bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${toggles[item.id]?"left-6":"left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-4 rounded-2xl bg-orange-500 text-white text-sm font-bold">저장하기</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 화면 1: 홈
// ═══════════════════════════════════════════════════════════════════
const HomeScreen = ({ onCategory, onProduct, showLogin, showToast }) => {
  const [tab, setTab]             = useState("hotdeal");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [catLoading, setCatLoading] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const isPaused = useRef(false);
  const bannerTimer = useRef(null);

  useEffect(()=>{
    bannerTimer.current = setInterval(()=>{ if(!isPaused.current) setBannerIdx(i=>(i+1)%PROMO_BANNERS.length); }, 3500);
    return ()=>clearInterval(bannerTimer.current);
  },[]);

  const handleCategory = (cat) => {
    setActiveCat(cat.id); setCatLoading(true);
    setTimeout(()=>{ setCatLoading(false); onCategory(cat); }, 600);
  };

  const copyCode = async (code) => {
    try { await copyToClipboard(code); showToast(`"${code}" 코드가 복사되었습니다!`); }
    catch { showToast("복사 실패. 직접 코드를 선택해주세요."); }
  };

  const b = PROMO_BANNERS[bannerIdx];

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* 검색창 */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
        <input readOnly placeholder="알리 꿀템 검색 또는 링크 붙여넣기"
          onClick={()=>showToast("🔍 검색 기능을 준비 중이에요!")}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F7F7F8] text-sm text-gray-600 placeholder-gray-400 outline-none cursor-pointer" />
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
          <div className="rounded-3xl p-5 text-white"
               style={{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)"}}>
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
          <div className="rounded-3xl overflow-hidden"
               onMouseEnter={()=>{isPaused.current=true;}} onMouseLeave={()=>{isPaused.current=false;}}
               onTouchStart={()=>{isPaused.current=true;}} onTouchEnd={()=>{isPaused.current=false;}}>
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
                    <button key={i} onClick={()=>setBannerIdx(i)}
                      className={`rounded-full transition-all duration-300 ${i===bannerIdx?"w-4 h-1.5 bg-white":"w-1.5 h-1.5 bg-white/40"}`}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 무한 스크롤 상품 그리드 */}
          <InfiniteProductGrid onProduct={onProduct} title="🔥 지금 핫한 상품들" />
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
const CategoryFeedScreen = ({ cat, onBack, onProduct }) => {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(()=>{ const t=setTimeout(()=>setIsLoading(false),700); return ()=>clearTimeout(t); },[cat.id]);

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <div>
            <p className="text-base font-extrabold text-gray-900">{cat.icon} {cat.label}</p>
            {!isLoading && <p className="text-[11px] text-gray-400">계속 로드 중...</p>}
          </div>
          <button className="ml-auto text-xs text-gray-400 bg-[#F7F7F8] px-3 py-1.5 rounded-xl">필터 ⚙️</button>
        </div>
      </div>
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(6).fill(0).map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : (
          <InfiniteProductGrid onProduct={onProduct} />
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

// 다음 대형 세일 계산
const calcNextSale = () => {
  const today = new Date();
  const year  = today.getFullYear();
  const sales = [
    { name:"솔로데이",   emoji:"🛍",  date: new Date(year, 10, 11) }, // 11/11
    { name:"블랙프라이데이", emoji:"🖤", date: new Date(year, 10, 29) }, // 11/29
    { name:"크리스마스 세일", emoji:"🎄", date: new Date(year, 11, 20) }, // 12/20
    { name:"신년 세일",  emoji:"🎆",  date: new Date(year+1, 0, 1)  }, // 1/1
    { name:"발렌타인",   emoji:"💝",  date: new Date(year+1, 1, 14) }, // 2/14
  ];
  const upcoming = sales
    .map(s => ({ ...s, dday: Math.ceil((s.date - today) / 86400000) }))
    .filter(s => s.dday > 0)
    .sort((a, b) => a.dday - b.dday);
  return upcoming[0] || { name:"솔로데이", emoji:"🛍", dday:365 };
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
      color: isMin ? "#EF4444" : isMax ? "#6366F1" : isUp ? "#F97316" : "#00C07F",
      icon:  isMin ? "🏆" : isMax ? "📈" : isUp ? "▲" : "▼",
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

  return (
    <div className="rounded-3xl overflow-hidden"
         style={{background:"linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)"}}>
      <div className="p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">🗓 다음 대형 세일 예측</p>
          <span className="text-xs font-extrabold bg-orange-500 px-2.5 py-1 rounded-full">
            D-{sale.dday}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{sale.emoji}</span>
          <div>
            <p className="text-base font-extrabold">{sale.name}</p>
            <p className="text-xs text-blue-200 mt-0.5">
              약 {sale.dday}일 후 · 역대 최대 {expectedDisc}% 추가 할인 예상
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-200">현재가</p>
            <p className="text-sm font-extrabold">{fmt(currentPrice)}</p>
          </div>
          <div className="text-blue-200 text-lg">→</div>
          <div className="text-right">
            <p className="text-[10px] text-blue-200">세일 예상가</p>
            <p className="text-sm font-extrabold text-orange-400">{fmt(expectedPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-200">예상 절감액</p>
            <p className="text-sm font-extrabold text-green-400">-{fmt(currentPrice - expectedPrice)}</p>
          </div>
        </div>

        <p className="text-[10px] text-blue-300/60 mt-2 text-center">
          * 과거 세일 데이터 기반 예측이며 실제와 다를 수 있습니다
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

// 더미 셀러 데이터 생성 — API 연동 시 이 함수를 fetch로 교체
const fetchSellerList = async (productName, currentPrice) => {
  // TODO: API 연동 시 아래 주석 해제 후 더미 제거
  // const keyword = extractKeyword(productName);
  // const res = await fetch(`/api/ali/products?keyword=${encodeURIComponent(keyword)}&sort=price&size=5`);
  // const data = await res.json();
  // return data.products.filter(p => p.id !== currentProductId).slice(0, 4);

  // 더미 셀러 데이터 (seed 기반 고정)
  await new Promise(r => setTimeout(r, 400)); // API 딜레이 시뮬레이션
  const seed = currentPrice;
  const rng  = (n) => ((n * 1664525 + 1013904223) & 0xffffffff) >>> 0;
  return [
    {
      id: "s1",
      sellerName: "TopDeal Store",
      price: Math.round(currentPrice * 0.91 / 100) * 100,
      rating: 4.7,
      reviews: rng(seed) % 3000 + 500,
      deliveryDays: 5,
      badge: "최저가",
    },
    {
      id: "s2",
      sellerName: "BestBuy Official",
      price: Math.round(currentPrice * 0.96 / 100) * 100,
      rating: 4.8,
      reviews: rng(rng(seed)) % 5000 + 1000,
      deliveryDays: 4,
      badge: "공식판매",
    },
    {
      id: "s3",
      sellerName: "MegaSale Shop",
      price: Math.round(currentPrice * 1.04 / 100) * 100,
      rating: 4.5,
      reviews: rng(rng(rng(seed))) % 2000 + 200,
      deliveryDays: 6,
      badge: null,
    },
  ].sort((a, b) => a.price - b.price);
};

const SellerCompareCard = ({ product }) => {
  const [sellers, setSellers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSellerList(product.name, product.price).then(data => {
      if (!cancelled) { setSellers(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [product.id, product.price]);

  const cheaperCount = sellers.filter(s => s.price < product.price).length;
  const displayList  = expanded ? sellers : sellers.slice(0, 2);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-800">🏪 알리 셀러 가격 비교</p>
          {!loading && cheaperCount > 0 && (
            <p className="text-xs text-orange-500 font-bold mt-0.5">
              더 싸게 파는 셀러 {cheaperCount}개 발견!
            </p>
          )}
          {!loading && cheaperCount === 0 && (
            <p className="text-xs text-green-600 font-bold mt-0.5">
              현재 최저가 셀러입니다 ✅
            </p>
          )}
        </div>
        <span className="text-[10px] text-gray-400 bg-white px-2 py-1 rounded-xl">
          {loading ? "조회 중..." : `${sellers.length}개 셀러`}
        </span>
      </div>

      {/* 내 상품 기준 */}
      <div className="flex items-center gap-3 bg-orange-50 rounded-2xl px-3 py-2.5 mb-2">
        <span className="text-[10px] font-extrabold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full flex-shrink-0">
          현재
        </span>
        <p className="text-xs text-gray-700 font-semibold flex-1 line-clamp-1">{product.shortName}</p>
        <p className="text-sm font-extrabold text-orange-500 flex-shrink-0">{fmt(product.price)}</p>
      </div>

      {/* 셀러 목록 */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded-2xl animate-pulse"/>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((s, i) => {
            const isCheaper = s.price < product.price;
            const diff      = product.price - s.price;
            // TODO: API 연동 시 buildAffiliateUrl(s.id) 로 교체
            const url       = `https://www.aliexpress.com/item/${s.id}.html`;
            return (
              <a key={s.id} href={url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 active:opacity-75 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-bold text-gray-800 truncate">{s.sellerName}</p>
                    {s.badge && (
                      <span className="text-[9px] font-extrabold text-white bg-blue-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    ⭐ {s.rating} · {s.reviews.toLocaleString()}리뷰 · {s.deliveryDays}일배송
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-extrabold ${isCheaper ? "text-red-500" : "text-gray-700"}`}>
                    {fmt(s.price)}
                  </p>
                  {isCheaper && (
                    <p className="text-[10px] text-red-400 font-bold">{fmt(diff)} 저렴</p>
                  )}
                  {!isCheaper && (
                    <p className="text-[10px] text-gray-400">{fmt(s.price - product.price)} 비쌈</p>
                  )}
                </div>
                <span className="text-gray-300 text-xs flex-shrink-0">›</span>
              </a>
            );
          })}
        </div>
      )}

      {/* 더보기 토글 */}
      {!loading && sellers.length > 2 && (
        <button onClick={() => setExpanded(e => !e)}
          className="w-full mt-2 py-2 text-xs text-gray-400 font-semibold text-center">
          {expanded ? "접기 ▲" : `셀러 ${sellers.length - 2}개 더 보기 ▼`}
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 🛒 쿠팡 검색 링크 컴포넌트
// 쿠팡 파트너스 ID 발급 후 COUPANG_PARTNER_ID 만 교체하면 완료
// ═══════════════════════════════════════════════════════════════════

// TODO: 쿠팡 파트너스 가입 후 실제 ID로 교체
// https://partners.coupang.com
const COUPANG_PARTNER_ID = "YOUR_PARTNER_ID"; // ← 여기만 교체

const buildCoupangUrl = (keyword) => {
  const encoded = encodeURIComponent(keyword);
  // 쿠팡 파트너스 트래킹 URL 구조
  // 실제 파트너 ID 입력 시 수수료 자동 추적됨
  if (COUPANG_PARTNER_ID === "YOUR_PARTNER_ID") {
    // 파트너 ID 미설정 시 일반 검색 링크
    return `https://www.coupang.com/np/search?q=${encoded}`;
  }
  // 파트너 ID 설정 시 트래킹 링크
  return `https://www.coupang.com/np/search?q=${encoded}&sourceType=affiliate&affiliateCode=${COUPANG_PARTNER_ID}`;
};

const CoupangCompareCard = ({ productName, currentPrice }) => {
  const keyword     = useMemo(() => extractKeyword(productName), [productName]);
  const coupangUrl  = useMemo(() => buildCoupangUrl(keyword), [keyword]);
  const [copied, setCopied] = useState(false);

  // 쿠팡 링크 클릭 시 로그 (API 연동 후 클릭 추적으로 활용)
  const handleClick = () => {
    // TODO: POST /api/track/coupang-click { productName, keyword }
    console.log("[쿠팡 클릭]", keyword);
  };

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
           onClick={handleClick}
           className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-extrabold active:opacity-90 transition"
           style={{background:"linear-gradient(90deg,#C0392B,#E74C3C)"}}>
          <span>🛒</span>
          쿠팡에서 "{keyword}" 검색하기 →
        </a>

        {/* 제휴 고지 */}
        <p className="text-[10px] text-gray-400 text-center mt-2">
          {COUPANG_PARTNER_ID !== "YOUR_PARTNER_ID"
            ? "이 링크를 통한 구매 시 쿠팡 파트너스 수수료가 발생할 수 있습니다"
            : "쿠팡 파트너스 연동 후 수수료 추적이 활성화됩니다"}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 화면 3: 상품 상세 (셀러비교 + 쿠팡링크 통합)
// ═══════════════════════════════════════════════════════════════════
const DetailScreen = ({ product, onBack, showLogin, showToast }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [wished, setWished]       = useState(false);

  const seed         = useMemo(() => idToSeed(product.id), [product.id]);
  const hist         = useMemo(() => generateHistory(product.price, seed), [product.price, seed]);
  const minP         = useMemo(() => Math.min(...hist.map(d => d.price)), [hist]);
  const maxP         = useMemo(() => Math.max(...hist.map(d => d.price)), [hist]);
  const affiliateUrl = useMemo(() => buildAffiliateUrl(product.id), [product.id]);

  const handleWish  = () => showLogin();
  const handleAlert = () => showLogin();

  return (
    <>
      <div style={{paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H+BTN_H}px)`}}>
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
          <button onClick={onBack}
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
          <img src={product.image.replace("320x320","500x500")} alt={product.shortName}
            loading="lazy" className="w-full max-h-72 object-contain mx-auto" />
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
                  ? <span className="text-base font-bold text-blue-500">▼ {product.discount}%</span>
                  : product.discount < 0
                  ? <span className="text-base font-bold text-red-500">▲ {Math.abs(product.discount)}%</span>
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
              {icon:wished?"❤️":"🤍", label:"관심상품", action:handleWish},
              {icon:"🔔", label:"알림 받기",  action:handleAlert},
              {icon:"🔗", label:"공유하기",   action:()=>setShareOpen(true)},
            ].map(b => (
              <button key={b.label} onClick={b.action}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl bg-[#F7F7F8] active:bg-gray-200 transition">
                <span className="text-xl">{b.icon}</span>
                <span className="text-[10px] text-gray-600 font-semibold">{b.label}</span>
              </button>
            ))}
          </div>

          {/* 역대 최저가 배지 */}
          <div className="flex items-center gap-3 bg-red-50 rounded-2xl p-4">
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div>
              <p className="text-sm font-extrabold text-red-600">알림: 현재 수집된 데이터 중 가장 낮은 가격대인 것으로 분석됩니다.</p>
              <p className="text-xs text-red-400 mt-0.5">수집 기간 내 최저가 {fmt(minP)} 기준</p>
            </div>
          </div>

          {/* ✅ [1] 기간 탭 전환 차트 */}
          <PriceRangeChart hist={hist} minP={minP} maxP={maxP} />

          {/* ✅ [2] 요일별 가격 패턴 */}
          <WeeklyPatternCard basePrice={product.price} seed={seed} />

          {/* ✅ [3] 다음 세일 D-day */}
          <NextSaleCountdown currentPrice={product.price} />

          {/* ✅ [4] 가격 등락 타임라인 */}
          <PriceTimeline hist={hist} currentPrice={product.price} />

          {/* ✅ [5] 알리 셀러 간 가격 비교 */}
          <SellerCompareCard product={product} />

          {/* ✅ [6] 쿠팡 비교 링크 */}
          <CoupangCompareCard productName={product.name} currentPrice={product.price} />

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
        <a href={affiliateUrl} target="_blank" rel="noopener noreferrer"
           className="w-full max-w-[568px] block text-center text-white font-extrabold py-4 rounded-2xl text-sm shadow-xl active:opacity-90 transition"
           style={{background:"linear-gradient(90deg,#FF5A1F,#f7462a)"}}>
          알리익스프레스에서 최저가로 구매하기 →
        </a>
      </div>

      {shareOpen && <ShareSheet product={product} onClose={()=>setShareOpen(false)} showToast={showToast}/>}
      {alertOpen && <AlertModal onClose={()=>setAlertOpen(false)} showToast={showToast}/>}
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
        { title:"1. 개인정보 수집 항목 및 목적", body:"AliTrack(이하 \"서비스\")은 아래와 같은 목적으로 최소한의 개인정보를 수집합니다.\n\n• 소셜 로그인(카카오·네이버·구글): 이메일 주소, 닉네임, 프로필 이미지\n• 서비스 이용: 관심 상품 목록, 알림 설정 정보, 서비스 이용 기록\n\n수집 목적: 회원 식별, 최저가 알림 발송, 찜 목록 및 가격 기록 보관, 서비스 품질 개선" },
        { title:"2. 개인정보 보유 및 이용 기간", body:"• 회원 탈퇴 시 즉시 파기\n• 전자상거래법: 계약·청약철회 기록 5년, 대금결제 기록 5년\n• 통신비밀보호법: 로그인 기록 3개월" },
        { title:"3. 개인정보 제3자 제공", body:"서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.\n단, 이용자가 사전에 동의한 경우 또는 법령의 규정에 의한 경우 예외로 합니다.\n\n※ 알리익스프레스 제휴 링크 클릭 시 해당 사이트의 개인정보처리방침이 적용됩니다." },
        { title:"4. 개인정보 처리 위탁", body:"• Supabase Inc. — 데이터베이스 저장 및 관리\n• Vercel Inc. — 웹 서비스 호스팅\n• 카카오(주) / 네이버(주) / Google LLC — 소셜 로그인 인증" },
        { title:"5. 이용자 권리", body:"이용자는 언제든지 개인정보 열람·수정·삭제·처리정지를 요청할 수 있습니다.\n행사 방법: 앱 내 [나의기록 → 계정 설정] 또는 privacy@alitrack.kr 로 요청\n\n• 개인정보분쟁조정위원회: www.kopico.go.kr (1833-6972)\n• 개인정보침해신고센터: privacy.kisa.or.kr (118)" },
        { title:"6. 쿠키 및 분석 도구", body:"• Google Analytics 4: 서비스 이용 통계 분석(익명 처리)\n• 카카오 픽셀: 마케팅 효과 측정\n브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다." },
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
        서비스 품질 개선을 위해 Google Analytics·카카오 픽셀을 사용합니다.
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
// ⑦ 빈 화면 Empty State (찜·가격기록·나의기록)
// ═══════════════════════════════════════════════════════════════════
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

const EmptyPriceHistory = ({ onGoHome }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
    <div className="w-24 h-24 rounded-3xl bg-[#F7F7F8] flex items-center justify-center text-4xl">📈</div>
    <div>
      <p className="text-base font-extrabold text-gray-900 mb-1">가격 기록이 없어요</p>
      <p className="text-xs text-gray-400 leading-relaxed">상품 상세 페이지를 방문하면<br/>자동으로 가격 기록이 쌓여요</p>
    </div>
    <button onClick={onGoHome}
      className="mt-2 px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
      상품 둘러보기
    </button>
  </div>
);

const EmptyMypage = ({ onLogin }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
    <div className="w-24 h-24 rounded-3xl bg-[#F7F7F8] flex items-center justify-center text-4xl">👤</div>
    <div>
      <p className="text-base font-extrabold text-gray-900 mb-1">로그인이 필요해요</p>
      <p className="text-xs text-gray-400 leading-relaxed">로그인하면 구매 내역, 알림 설정,<br/>찜 목록을 한 곳에서 관리할 수 있어요</p>
    </div>
    <button onClick={onLogin}
      className="mt-2 px-6 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
      3초 만에 로그인하기
    </button>
  </div>
);

// 더보기 화면 (피드백 버튼 + 법적 링크 포함)
const MoreScreen = ({ onBack, onFeedback, onPrivacy, onTerms }) => (
  <div className="pb-10">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
      <button onClick={onBack}
        className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <p className="text-base font-bold text-gray-900">더보기</p>
    </div>

    <div className="px-4 py-5 space-y-3">
      {/* 피드백 */}
      <div>
        <p className="text-xs font-bold text-gray-400 px-1 mb-2">고객 지원</p>
        {[
          { icon:"🐛", label:"오류 신고 · 기능 제안", action: onFeedback, badge:"문의하기" },
          { icon:"💬", label:"카카오톡 채널 상담", action:()=>window.open("https://pf.kakao.com/_ARQxfX/friend","_blank"), badge:"바로가기" },
        ].map(i => (
          <button key={i.label} onClick={i.action}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#F7F7F8] active:bg-gray-100 transition mb-2">
            <span className="text-xl">{i.icon}</span>
            <span className="flex-1 text-sm font-semibold text-gray-800 text-left">{i.label}</span>
            <span className="text-xs text-orange-500 font-bold">{i.badge}</span>
          </button>
        ))}
      </div>

      {/* 앱 정보 */}
      <div>
        <p className="text-xs font-bold text-gray-400 px-1 mb-2">앱 정보</p>
        <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
          {[
            { icon:"🔒", label:"개인정보처리방침", action: onPrivacy },
            { icon:"📄", label:"이용약관",         action: onTerms  },
            { icon:"📧", label:"이메일 문의",       action:()=>window.open("mailto:help@alitrack.kr") },
          ].map((i, idx, arr) => (
            <button key={i.label} onClick={i.action}
              className={`w-full flex items-center gap-3 px-4 py-4 active:bg-gray-100 transition ${idx < arr.length-1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-lg">{i.icon}</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">{i.label}</span>
              <span className="text-gray-400 text-xs">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* 버전 정보 */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">AliTrack v4.2.0 · © 2026 AliTrack</p>
        <p className="text-[10px] text-gray-300 mt-1">Made with ❤️ for Korean Ali Shoppers</p>
      </div>
    </div>
  </div>
);

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

  // ⑤ 온보딩 — 개발 테스트 중: false 고정
  // 배포 전에 아래 주석 해제하고 위 줄 삭제
  const [showOnboarding, setShowOnboarding] = useState(false);
  // useState(() => {
  //   try { return !localStorage.getItem("alitrack_onboarded"); }
  //   catch { return false; }
  // });

  // ③ 쿠키 배너 — 개발 테스트 중: false 고정
  // 배포 전 아래 주석 해제
  const [showCookie, setShowCookie] = useState(false);
  // useState(() => {
  //   try { return !localStorage.getItem("alitrack_cookie_consent"); }
  //   catch { return false; }
  // });

  // ⑥ PWA 설치 배너
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  useEffect(()=>{
    const handler = () => { setShowPwaBanner(true); };
    window.addEventListener("pwa-installable", handler);
    return () => window.removeEventListener("pwa-installable", handler);
  },[]);

  // 소셜 로그인 후 ?login=ok 처리 + 인증 상태 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "ok") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.logged_in) setUser(data); })
      .catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" })
      .finally(() => { setUser(null); showToast("로그아웃되었습니다."); });
  }, [showToast]);

  // ④ 피드백 시트
  const [showFeedback, setShowFeedback] = useState(false);

  const showToast = useCallback((msg)=>{
    clearTimeout(toastTimer.current);
    setToast({msg,visible:true});
    toastTimer.current=setTimeout(()=>setToast(p=>({...p,visible:false})),2200);
  },[]);

  const showLogin = useCallback(()=>setLoginModal(true),[]);
  const handleLoginDismiss = ()=>setLoginModal(null);

  const saveScroll = useCallback(()=>{
    if(mainRef.current) scrollPositions.current[screen]=mainRef.current.scrollTop;
  },[screen]);

  const restoreScroll = useCallback((s)=>{
    requestAnimationFrame(()=>{
      if(mainRef.current && scrollPositions.current[s]!=null)
        mainRef.current.scrollTop=scrollPositions.current[s];
    });
  },[]);

  const goTo = useCallback((s)=>{ saveScroll(); window.history.pushState({screen:s},""); setScreen(s); },[saveScroll]);
  const goCategory = useCallback((cat)=>{ setSelCat(cat); goTo("feed"); setActiveNav("home"); },[goTo]);
  const goProduct  = useCallback((p)=>{ setSelProduct(p); goTo("detail"); },[goTo]);
  const goBack     = useCallback(()=>window.history.back(),[]);
  const goHome     = useCallback(()=>{ goTo("home"); setActiveNav("home"); },[goTo]);

  const handleNav = useCallback((id)=>{
    setActiveNav(id);
    if(id==="home"){ goTo("home"); return; }
    if(id==="more"){ goTo("more"); return; }
    showLogin();
  },[goTo,showLogin]);

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
    // TODO: GA4·카카오 픽셀 활성화
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
    if(window.__pwa?.install) {
      const accepted = await window.__pwa.install();
      if(accepted) showToast("홈 화면에 추가되었습니다! 🎉");
    }
    setShowPwaBanner(false);
  };

  const renderScreen = () => {
    switch(screen){
      case "home":     return <HomeScreen onCategory={goCategory} onProduct={goProduct} showLogin={showLogin} showToast={showToast}/>;
      case "feed":     return selCat?<CategoryFeedScreen cat={selCat} onBack={goBack} onProduct={goProduct}/>:null;
      case "detail":   return selProduct?<DetailScreen product={selProduct} onBack={goBack} showLogin={showLogin} showToast={showToast}/>:null;
      // ⑦ Empty State 적용
      case "history":  return (
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p className="text-base font-bold text-gray-900">가격기록</p>
          </div>
          <EmptyPriceHistory onGoHome={goHome}/>
        </div>
      );
      case "wishlist": return (
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p className="text-base font-bold text-gray-900">찜한상품</p>
          </div>
          <EmptyWishlist onGoHome={goHome}/>
        </div>
      );
      case "mypage":   return (
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p className="text-base font-bold text-gray-900">나의기록</p>
          </div>
          <EmptyMypage onLogin={showLogin}/>
        </div>
      );
      // 더보기 화면
      case "more":     return <MoreScreen onBack={goBack} onFeedback={()=>setShowFeedback(true)} onPrivacy={()=>goTo("privacy")} onTerms={()=>goTo("terms")}/>;
      // 법적 페이지
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

          {/* ⑥ PWA 설치 배너 — 헤더 바로 아래 */}
          {showPwaBanner && !showOnboarding && (
            <PwaInstallBanner onInstall={handlePwaInstall} onDismiss={()=>setShowPwaBanner(false)}/>
          )}

          {/* 헤더 */}
          <header className="sticky top-0 z-20 bg-white/96 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
            <button onClick={()=>{goTo("home");setActiveNav("home");}} className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">AliTrack</span>
              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">BETA</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={showLogin}
                className="w-8 h-8 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-sm active:bg-gray-200 transition">🔔</button>
              {user
                ? <button onClick={handleLogout}
                    className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-sm active:bg-orange-100 transition" title={user.email}>👤</button>
                : <button onClick={showLogin}
                    className="w-8 h-8 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-sm active:bg-gray-200 transition">👤</button>
              }
              {/* ④ 피드백 버튼 (우상단 플로팅) */}
              <button onClick={()=>setShowFeedback(true)}
                className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-sm active:bg-orange-100 transition">✏️</button>
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
                  className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeNav===n.id?"text-orange-500":"text-gray-400"}`}>
                  <span className="text-xl leading-none">{n.icon}</span>
                  <span className="text-[10px] font-semibold">{n.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* ③ 쿠키 배너 */}
      {showCookie && !showOnboarding && (
        <CookieBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline}/>
      )}

      {/* ④ 피드백 시트 */}
      {showFeedback && <FeedbackSheet onClose={()=>setShowFeedback(false)} showToast={showToast}/>}

      {/* 로그인 모달 */}
      {loginModal && <LoginModal onDismiss={handleLoginDismiss}/>}
    </>
  );
}
