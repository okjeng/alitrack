import type { Product } from "../types";
import { fmt } from "../utils";
import { FALLBACK_IMAGE } from "../data/constants";

interface RailProductCardProps {
  product: Product;
  onProduct: (p: Product) => void;
}

// 가로 스크롤 레일 전용 카드 — 이미지 + 2줄 말줄임 상품명 + 가격 + 할인율 배지
export const RailProductCard = ({ product: p, onProduct }: RailProductCardProps) => (
  <button onClick={() => onProduct(p)} aria-label={`${p.name} 상세보기`}
    className="w-36 flex-shrink-0 text-left bg-white active:opacity-75 transition"
    style={{ borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)", overflow: "hidden" }}>
    <div className="relative bg-gray-100">
      <img src={p.image} alt={p.shortName} loading="lazy"
        className="w-full aspect-square object-cover"
        onError={e => { e.currentTarget.src = FALLBACK_IMAGE; e.currentTarget.onerror = null; }} />
      {p.discount > 0 && (
        <span className="absolute top-2 left-2 text-white px-1.5 py-0.5 rounded-full"
          style={{ fontSize: 10, fontWeight: 600, background: "#EF4444" }}>
          {p.discount}%
        </span>
      )}
    </div>
    <div className="p-2 space-y-1">
      <p className="text-gray-800 leading-snug"
         style={{ fontWeight: 500, fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {p.name}
      </p>
      <p className="text-gray-900" style={{ fontWeight: 700, fontSize: 14 }}>{fmt(p.price)}</p>
    </div>
  </button>
);
