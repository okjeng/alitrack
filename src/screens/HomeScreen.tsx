import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { trackEvent } from "../utils";
import { HOME_CATEGORIES, HOME_SECTION_COPY, PRAISED_MIN_RATING_CASCADE, sortByVolumeDesc } from "../data/homeSectionCopy";
import { HorizontalProductRail } from "../components/HorizontalProductRail";
import { MallPriceRail } from "../components/MallPriceRail";
import { InfiniteProductGrid } from "../components/InfiniteProductGrid";
import { LegalFooter } from "../components/ui/index";
import type { Category, Product } from "../types";

interface HomeScreenProps {
  onCategory: (cat: Category) => void;
  onProduct: (p: Product) => void;
  onSearch: (keyword: string) => void;
  onNavigate: (screen: string) => void;
  showLogin: () => void;
  showToast: (msg: string) => void;
}

export const HomeScreen = ({
  onCategory: _onCategory, onProduct, onSearch, onNavigate, showLogin: _showLogin, showToast,
}: HomeScreenProps) => {
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeCategory, setActiveCategory] = useState(HOME_CATEGORIES[0]);
  const categoryBarSlotRef = useRef<HTMLDivElement>(null);
  const [appHeaderHeight, setAppHeaderHeight] = useState(57);
  const [categoryBarHeight, setCategoryBarHeight] = useState(0);
  const [isStuck, setIsStuck] = useState(false);

  // App.tsx의 <main>이 overflow-y:auto라 그 안에서는 sticky가 동작하지 않아서(실제 스크롤은
  // <main> 내부가 아니라 문서/윈도우 레벨에서 일어남) 카테고리 바 원래 자리를 벗어나는 시점을
  // 매 스크롤마다 실측(getBoundingClientRect)해서 직접 감지 — 위쪽 레일 섹션들이 상품 데이터를
  // 비동기로 늦게 불러와도(레이아웃 높이가 나중에 바뀌어도) 항상 최신 위치 기준으로 판단하기 위해
  // 값을 캐싱하지 않고 매번 다시 읽음. 헤더 높이는 하드코딩하지 않고 실측해서
  // App.tsx를 건드리지 않고도 안전하게 맞춤.
  useLayoutEffect(() => {
    const header = document.querySelector("header");
    if (header) setAppHeaderHeight(header.getBoundingClientRect().height);
    if (categoryBarSlotRef.current) setCategoryBarHeight(categoryBarSlotRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const slot = categoryBarSlotRef.current;
      if (!slot) return;
      setIsStuck(slot.getBoundingClientRect().top <= appHeaderHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [appHeaderHeight]);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    trackEvent("search", { search_term: q });
    onSearch(q);
  };

  const clearSearch = () => setSearchQuery("");

  const categoryBarInner = (
    <>
      <p className="text-left text-gray-900 mb-2" style={{ fontWeight: 700, fontSize: 14 }}>카테고리</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {HOME_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat)}
            aria-current={activeCategory.id === cat.id ? "true" : undefined}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 rounded-xl transition ${
              activeCategory.id === cat.id ? "bg-orange-500 text-white" : "bg-[#F7F7F8] text-gray-600"
            }`}
            style={{ height: 40, fontSize: 12, fontWeight: 600 }}>
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2">
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
                style={{ fontSize: 10, fontWeight: 800, color: "#fff", lineHeight: 1 }}>✕</button>
            )}
          </div>
          <button onClick={handleSearch} aria-label="검색 실행"
            className="px-4 py-3.5 rounded-2xl bg-orange-500 active:bg-orange-600 text-white text-sm font-bold transition flex-shrink-0">
            검색
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <HorizontalProductRail
          title={HOME_SECTION_COPY.trending.title}
          sort="default"
          moreLabel={HOME_SECTION_COPY.trending.moreLabel}
          onMore={() => onNavigate("trending")}
          onProduct={onProduct}
        />
        <HorizontalProductRail
          title={HOME_SECTION_COPY.megaDeal.title}
          sort="discount"
          moreLabel={HOME_SECTION_COPY.megaDeal.moreLabel}
          onMore={() => onNavigate("megaDeal")}
          onProduct={onProduct}
        />
        <HorizontalProductRail
          title={HOME_SECTION_COPY.praised.title}
          sort="default"
          count={30}
          minRatingCascade={PRAISED_MIN_RATING_CASCADE}
          sortBy={sortByVolumeDesc}
          onProduct={onProduct}
        />
        <MallPriceRail
          title={HOME_SECTION_COPY.priceFinal.title}
          moreLabel={HOME_SECTION_COPY.priceFinal.moreLabel}
          onMore={() => showToast("준비 중인 기능이에요. 조금만 기다려주세요!")}
        />
      </div>

      <div ref={categoryBarSlotRef} className="bg-white/95 backdrop-blur-sm px-4 py-3 mt-4 border-y border-gray-100"
           style={isStuck ? { height: categoryBarHeight, padding: 0, border: "none" } : undefined}>
        {!isStuck && categoryBarInner}
      </div>
      {isStuck && (
        <div className="fixed left-0 right-0 z-10 flex justify-center" style={{ top: appHeaderHeight }}>
          <div className="w-full bg-white/95 backdrop-blur-sm px-4 py-3 border-y border-gray-100" style={{ maxWidth: 600 }}>
            {categoryBarInner}
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <InfiniteProductGrid key={activeCategory.id} onProduct={onProduct} keyword={activeCategory.keyword} />
        <LegalFooter />
      </div>
    </div>
  );
};
