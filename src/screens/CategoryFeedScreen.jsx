import { useState, useEffect } from "react";
import { SORT_OPTIONS } from "../data/constants.js";
import { IconBack, SkeletonCard, LegalFooter } from "../components/ui/index.jsx";
import { InfiniteProductGrid } from "../components/InfiniteProductGrid.jsx";

export const CategoryFeedScreen = ({ cat, onBack, onProduct }) => {
  const [isLoading, setIsLoading]     = useState(true);
  const [sort, setSort]               = useState(cat.sort || "default");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setSort(cat.sort || "default");
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, [cat.id]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "인기순";

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} aria-label="뒤로 가기"
            className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <div>
            <p className="text-base font-extrabold text-gray-900">{cat.icon} {cat.label}</p>
            {!isLoading && <p className="text-[11px] text-gray-400">계속 로드 중...</p>}
          </div>
          <div className="ml-auto relative">
            <button onClick={() => setShowSortMenu(v => !v)}
              className="text-xs text-gray-600 font-semibold bg-[#F7F7F8] px-3 py-1.5 rounded-xl flex items-center gap-1">
              {currentSortLabel} ⚙️
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[110px]">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => { setSort(o.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition ${sort === o.value ? "bg-orange-50 text-orange-500" : "text-gray-700 active:bg-gray-50"}`}>
                    {sort === o.value ? "✓ " : ""}{o.label}
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
            {Array(6).fill(0).map((_,i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <InfiniteProductGrid key={`${cat.id}-${sort}`} onProduct={onProduct} keyword={cat.keyword || ""} sort={sort} />
        )}
        <LegalFooter />
      </div>
    </div>
  );
};
