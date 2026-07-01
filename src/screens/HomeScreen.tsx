import { useState, useRef, useEffect } from "react";
import { copyToClipboard, trackEvent } from "../utils";
import { PROMO_BANNERS, CATEGORIES, DISCOUNT_CODES } from "../data/constants";
import { InfiniteProductGrid } from "../components/InfiniteProductGrid";
import { LegalFooter } from "../components/ui/index";
import type { Category } from "../types";

interface HomeScreenProps {
  onCategory: (cat: Category) => void;
  onProduct: (p: import("../types").Product) => void;
  showLogin: () => void;
  showToast: (msg: string) => void;
}

export const HomeScreen = ({ onCategory, onProduct, showLogin: _showLogin, showToast }: HomeScreenProps) => {
  const [tab, setTab]               = useState("hotdeal");
  const [bannerIdx, setBannerIdx]   = useState(0);
  const [catLoading, setCatLoading] = useState(false);
  const [activeCat, setActiveCat]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    if (!searchQuery.trim()) setActiveSearch("");
  }, [searchQuery]);
  const isPaused    = useRef(false);
  const bannerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      if (!isPaused.current) setBannerIdx(i => (i + 1) % PROMO_BANNERS.length);
    }, 3500);
    return () => { if (bannerTimer.current) clearInterval(bannerTimer.current); };
  }, []);

  const handleBannerTouchStart = (e: React.TouchEvent) => {
    isPaused.current = true;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleBannerTouchEnd = (e: React.TouchEvent) => {
    isPaused.current = false;
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setBannerIdx(i => (i + 1) % PROMO_BANNERS.length);
    else           setBannerIdx(i => (i - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length);
  };

  const handleCategory = (cat: Category) => {
    setActiveCat(cat.id); setCatLoading(true);
    setTimeout(() => { setCatLoading(false); onCategory(cat); }, 600);
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    console.log("[1] handleSearch 호출됨, q =", JSON.stringify(q));
    if (!q) return;
    setActiveSearch(q);
    console.log("[2] setActiveSearch 호출됨, q =", JSON.stringify(q));
    trackEvent("search", { search_term: q });
  };

  const clearSearch = () => { setSearchQuery(""); setActiveSearch(""); };

  const copyCode = async (code: string) => {
    try { await copyToClipboard(code); showToast(`"${code}" 코드가 복사되었습니다!`); }
    catch { showToast("복사 실패. 직접 코드를 선택해주세요."); }
  };

  const b = PROMO_BANNERS[bannerIdx];

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={e => e.target.select()}
            onKeyDown={e => e.key === "Enter" && !e.nativeEvent.isComposing && handleSearch()}
            placeholder="알리 꿀템 검색" aria-label="상품 검색"
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#F7F7F8] text-sm text-gray-800 placeholder-gray-400 outline-none" />
          {searchQuery && (
            <button onClick={clearSearch} aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center active:bg-gray-400 transition"
              style={{ fontSize:10, fontWeight:800, color:"#fff", lineHeight:1 }}>✕</button>
          )}
        </div>
        <button onClick={handleSearch} aria-label="검색 실행"
          className="px-4 py-3.5 rounded-2xl bg-orange-500 active:bg-orange-600 text-white text-sm font-bold transition flex-shrink-0">
          검색
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        {[{id:"hotdeal",label:"🔥 실시간 핫딜"},{id:"coupon",label:"🎟 오늘의 할인코드"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 pb-2.5 text-sm font-semibold relative transition-colors ${tab === t.id ? "text-gray-900" : "text-gray-400"}`}>
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 rounded-full" />}
          </button>
        ))}
      </div>

      {tab === "hotdeal" ? (
        <>
          <div className="rounded-3xl p-5 text-white cursor-pointer active:opacity-80 transition"
               style={{ background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)" }}
               onClick={() => document.getElementById("hot-products-section")?.scrollIntoView({ behavior:"smooth" })}>
            <p className="text-xs text-blue-300 font-semibold mb-1 tracking-widest uppercase">AliTrack · 가성비 분석</p>
            <p className="text-lg font-extrabold leading-snug">알리 직구 타이밍의 시간,<br/>찐 가성비 러버가 되어볼까? 🚀</p>
            <p className="text-xs text-blue-200 mt-2">지금 바로 핫딜 확인하기 →</p>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">카테고리</p>
            {catLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array(8).fill(0).map((_,i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-gray-100 animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-gray-200"/>
                    <div className="w-10 h-2.5 rounded bg-gray-200"/>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => handleCategory(cat)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition active:scale-95 ${activeCat === cat.id ? "bg-orange-50 ring-1 ring-orange-300" : "bg-[#F7F7F8]"}`}>
                    <span className="text-2xl leading-none">{cat.icon}</span>
                    <span className="text-[11px] text-gray-600 font-semibold text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl overflow-hidden cursor-pointer"
               onMouseEnter={() => { isPaused.current = true; }}
               onMouseLeave={() => { isPaused.current = false; }}
               onTouchStart={handleBannerTouchStart}
               onTouchEnd={handleBannerTouchEnd}
               onClick={() => onCategory({ id:b.id, icon:b.badge.charAt(0), label:b.title, keyword:b.keyword, sort:b.sort })}>
            <div style={{ background:b.bg, transition:"background 0.5s" }}>
              <div className="p-5 text-white">
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{b.badge}</span>
                <p className="text-xl font-extrabold mt-3 leading-snug">{b.title}</p>
                <p className="text-sm text-white/80 mt-1">{b.sub}</p>
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                  {b.products.map((pr, i) => (
                    <span key={i} className="flex-shrink-0 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">{pr}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 px-5 py-3 flex items-center justify-between">
                <span className="text-white text-xs">👆 지금 바로 확인하기</span>
                <div className="flex gap-1.5 items-center">
                  {PROMO_BANNERS.map((_,i) => (
                    <button key={i} onClick={e => { e.stopPropagation(); setBannerIdx(i); }}
                      className={`rounded-full transition-all duration-300 ${i === bannerIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {activeSearch ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">🔍 &ldquo;{activeSearch}&rdquo; 검색결과</p>
                <button onClick={clearSearch} className="text-xs text-orange-500 font-semibold active:text-orange-600 transition">초기화</button>
              </div>
              {console.log("[3] InfiniteProductGrid 렌더링, keyword =", JSON.stringify(activeSearch)) as unknown as null}
              <InfiniteProductGrid key={activeSearch} onProduct={onProduct} keyword={activeSearch} sort="default" rankKeyword={activeSearch} />
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
          {DISCOUNT_CODES.map(c => (
            <button key={c.code} onClick={() => copyCode(c.code)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#F7F7F8] active:bg-gray-100 transition text-left">
              <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background:c.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{c.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.expire}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl text-white" style={{ background:c.color }}>{c.code}</span>
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
