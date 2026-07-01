import type { Product } from "../types";
import { IconBack, LegalFooter } from "../components/ui/index";
import { InfiniteProductGrid } from "../components/InfiniteProductGrid";

interface ProductListScreenProps {
  title: string;
  sort: string;
  onBack: () => void;
  onProduct: (p: Product) => void;
}

// 홈 화면 가로 스크롤 섹션의 "더보기" 전체 목록 페이지 (인기 급상승 / 초특가 찬스 공용)
export const ProductListScreen = ({ title, sort, onBack, onProduct }: ProductListScreenProps) => (
  <div className="pb-6">
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="뒤로 가기"
          className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
          <IconBack />
        </button>
        <p className="text-base font-extrabold text-gray-900">{title}</p>
      </div>
    </div>
    <div className="px-4 pt-4">
      <InfiniteProductGrid key={sort} onProduct={onProduct} sort={sort} />
      <LegalFooter />
    </div>
  </div>
);
