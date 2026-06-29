import { useMemo } from "react";
import { rankBySearch } from "../utils.js";
import { useInfiniteProducts } from "../hooks/useInfiniteProducts.js";
import { SkeletonCard, LoadingSpinner } from "./ui/index.jsx";
import { ProductCard } from "./ProductCard.jsx";

export const InfiniteProductGrid = ({ onProduct, title, keyword, sort, rankKeyword }) => {
  const { items, loading, initialized, loaderRef, hasMore, error, retry } = useInfiniteProducts(keyword, sort);
  const displayItems = useMemo(
    () => rankKeyword ? rankBySearch(items, rankKeyword) : items,
    [items, rankKeyword]
  );

  return (
    <div>
      {title && <p className="text-sm font-bold text-gray-900 mb-3">{title}</p>}

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
            {loading && <><SkeletonCard /><SkeletonCard /></>}
          </div>
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
