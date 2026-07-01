import { useState } from "react";
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

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    trackEvent("search", { search_term: q });
    onSearch(q);
  };

  const clearSearch = () => setSearchQuery("");

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

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 py-3 mt-4 border-y border-gray-100">
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
      </div>

      <div className="px-4 pt-4">
        <InfiniteProductGrid key={activeCategory.id} onProduct={onProduct} keyword={activeCategory.keyword} />
        <LegalFooter />
      </div>
    </div>
  );
};
