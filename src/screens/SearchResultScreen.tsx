import { useState, useEffect } from "react";
import type { Product } from "../types";
import { trackEvent } from "../utils";
import { IconBack, LegalFooter } from "../components/ui/index";
import { InfiniteProductGrid } from "../components/InfiniteProductGrid";

interface SearchResultScreenProps {
  keyword: string;
  onBack: () => void;
  onProduct: (p: Product) => void;
}

export const SearchResultScreen = ({ keyword, onBack, onProduct }: SearchResultScreenProps) => {
  const [query, setQuery]               = useState(keyword);
  const [activeKeyword, setActiveKeyword] = useState(keyword);

  useEffect(() => {
    setQuery(keyword);
    setActiveKeyword(keyword);
  }, [keyword]);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    trackEvent("search", { search_term: q });
    setActiveKeyword(q);
  };

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="뒤로 가기"
            className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <input value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={e => e.target.select()}
              onKeyDown={e => e.key === "Enter" && !e.nativeEvent.isComposing && handleSearch()}
              placeholder="알리 꿀템 검색" aria-label="상품 검색"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F7F7F8] text-sm text-gray-800 placeholder-gray-400 outline-none" />
          </div>
          <button onClick={handleSearch} aria-label="검색 실행"
            className="px-4 py-3 rounded-2xl bg-orange-500 active:bg-orange-600 text-white text-sm font-bold transition flex-shrink-0">
            검색
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-sm font-bold text-gray-900 mb-3">🔍 &ldquo;{activeKeyword}&rdquo; 검색결과</p>
        <InfiniteProductGrid key={activeKeyword} onProduct={onProduct} keyword={activeKeyword} sort="default" rankKeyword={activeKeyword} />
        <LegalFooter />
      </div>
    </div>
  );
};
