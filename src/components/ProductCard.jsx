import { useMemo } from "react";
import { fmt, avg60, idToSeed, generateHistory } from "../utils.js";
import { TAG_COLORS } from "../data/constants.js";

export const ProductCard = ({ product:p, onProduct }) => {
  const hist = useMemo(() => generateHistory(p.price, idToSeed(p.id)), [p.id, p.price]);
  const av   = useMemo(() => avg60(hist), [hist]);
  const diff = av - p.price;

  return (
    <button onClick={() => onProduct(p)} aria-label={`${p.name} 상세보기`}
      className="rounded-2xl bg-[#F7F7F8] overflow-hidden text-left active:opacity-75 transition w-full">
      <div className="relative">
        <img src={p.image} alt={p.shortName} loading="lazy"
          className="w-full aspect-square object-cover"
          onError={e => { e.currentTarget.src = "https://placehold.co/320x320/EEF2FF/6366F1?text=📦"; e.currentTarget.onerror = null; }} />
        <span className={`absolute top-2 left-2 text-[9px] font-extrabold text-white px-1.5 py-0.5 rounded-full ${TAG_COLORS[p.tag]||"bg-gray-500"}`}>
          {p.tag}
        </span>
      </div>
      <div className="p-2.5 space-y-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00C07F] bg-green-50 px-1.5 py-0.5 rounded-full">
          🚀 {p.deliveryDays}일 내 도착
        </span>
        <p className="text-[11px] font-semibold text-gray-800 leading-snug"
           style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {p.name}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-base font-extrabold text-gray-900">{fmt(p.price)}</p>
          {p.discount > 0
            ? <span className="text-[11px] font-bold text-red-500">▼ {p.discount}%</span>
            : p.discount < 0
            ? <span className="text-[11px] font-bold text-blue-500">▲ {Math.abs(p.discount)}%</span>
            : null}
        </div>
        <p className="text-[9px] text-gray-400 leading-tight">*API 참고가 · 실제가 다를 수 있음</p>
        {diff > 0
          ? <p className="text-[10px] text-orange-500 font-semibold leading-tight">평균 대비 {fmt(Math.round(diff/100)*100)} 저렴!</p>
          : <p className="text-[10px] text-blue-500 font-semibold">현재 최저가 근접 중</p>
        }
        <p className="text-[10px] text-gray-400">⭐ {p.rating} ({p.reviews.toLocaleString()})</p>
      </div>
    </button>
  );
};
