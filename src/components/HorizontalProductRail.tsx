import type { Product } from "../types";
import { RailProductCard } from "./RailProductCard";
import { useTopProducts } from "../hooks/useTopProducts";
import { useInfiniteCarousel } from "../hooks/useInfiniteCarousel";
import { HOME_SECTION_COPY } from "../data/homeSectionCopy";

interface HorizontalProductRailProps {
  title: string;
  sort: string;
  count?: number;
  minRatingCascade?: number[];
  sortBy?: (a: Product, b: Product) => number;
  moreLabel?: string;
  onMore?: () => void;
  onProduct: (p: Product) => void;
}

// 섹션 헤더(제목+더보기) + 가로 스크롤 무한 루프 캐러셀 (최대 count장)
export const HorizontalProductRail = ({ title, sort, count = 30, minRatingCascade, sortBy, moreLabel, onMore, onProduct }: HorizontalProductRailProps) => {
  const { items, loading, error } = useTopProducts(sort, count, minRatingCascade, sortBy);
  const { containerRef, cloneBefore, cloneAfter, isDragging, pointerHandlers } = useInfiniteCarousel({ itemCount: items.length });

  return (
    <div className="p-4" style={{ borderRadius: 24, background: "#FAFAFA" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-900" style={{ fontWeight: 700, fontSize: 16 }}>{title}</p>
        {onMore && (
          <button onClick={onMore} aria-label={`${title} ${moreLabel ?? "더보기"}`}
            className="flex items-center text-gray-500 active:text-gray-700 transition flex-shrink-0"
            style={{ height: 48, fontSize: 13, fontWeight: 600 }}>
            {moreLabel ?? "더보기"} <span className="ml-0.5">〉</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="w-36 flex-shrink-0 bg-gray-200 animate-pulse" style={{ borderRadius: 16, aspectRatio: "0.75" }} />
          ))}
        </div>
      ) : error || items.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center">{HOME_SECTION_COPY.railEmpty}</p>
      ) : (
        <div ref={containerRef} {...pointerHandlers}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}>
          {cloneBefore.map(i => <RailProductCard key={`before-${items[i].id}`} product={items[i]} onProduct={onProduct} />)}
          {items.map(p => <RailProductCard key={p.id} product={p} onProduct={onProduct} />)}
          {cloneAfter.map(i => <RailProductCard key={`after-${items[i].id}`} product={items[i]} onProduct={onProduct} />)}
        </div>
      )}
    </div>
  );
};
