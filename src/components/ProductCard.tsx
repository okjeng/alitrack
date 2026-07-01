import type { Product } from "../types";
import { fmt } from "../utils";
import { TAG_COLORS, FALLBACK_IMAGE } from "../data/constants";

interface ProductCardProps {
  product: Product;
  onProduct: (p: Product) => void;
}

export const ProductCard = ({ product:p, onProduct }: ProductCardProps) => {
  const saved = p.discount > 0 && p.orig > p.price ? p.orig - p.price : 0;

  return (
    <button onClick={() => onProduct(p)} aria-label={`${p.name} 상세보기`}
      className="rounded-2xl bg-[#F7F7F8] overflow-hidden text-left active:opacity-75 transition w-full">
      <div className="relative bg-gray-100">
        <img src={p.image} alt={p.shortName} loading="lazy"
          className="w-full aspect-square object-cover"
          onError={e => { e.currentTarget.src = FALLBACK_IMAGE; e.currentTarget.onerror = null; }} />
        <span className={`absolute top-2 left-2 text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full ${TAG_COLORS[p.tag]||"bg-gray-500"}`}>
          {p.tag}
        </span>
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-[11px] font-semibold text-gray-800 leading-snug"
           style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5">
          {p.discount > 0
            ? <span className="text-[11px] font-bold text-red-500">▼{p.discount}%</span>
            : p.discount < 0
            ? <span className="text-[11px] font-bold text-blue-500">▲{Math.abs(p.discount)}%</span>
            : null}
          <p className="text-base font-extrabold text-gray-900">{fmt(p.price)}</p>
        </div>
        {saved > 0 && (
          <p className="text-[10px] text-gray-400">
            <span className="line-through">{fmt(p.orig)}</span> 💸 {fmt(saved)} 이득
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-[9px] text-green-600 leading-tight">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow:"0 0 4px #22c55e" }} />
          실시간 가격 동기화 <span className="text-[8px] text-gray-400">(환율 반영)</span>
        </span>
        <p className="text-[10px] text-gray-400">⭐ {p.rating}</p>
      </div>
    </button>
  );
};
