import { useMemo } from "react";
import { fmt } from "../../utils.js";
import { calcNextSale } from "./helpers.js";

export const NextSaleCountdown = ({ currentPrice }) => {
  const sale = useMemo(() => calcNextSale(), []);
  if (!sale) return null;

  const estPrice = Math.round(currentPrice * (1 - sale.maxDisc / 100 / 2) / 100) * 100;
  const savings  = currentPrice - estPrice;

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-sm font-bold text-gray-800 mb-4">⏰ 다음 알리 빅세일까지</p>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-4xl">{sale.emoji}</div>
        <div>
          <p className="text-sm font-extrabold text-gray-900">{sale.name}</p>
          <p className="text-xs text-orange-500 font-bold">최대 {sale.maxDisc}% 할인</p>
        </div>
        <div className="ml-auto bg-orange-500 rounded-2xl px-3 py-2 text-center">
          <p className="text-lg font-extrabold text-white leading-none">{sale.dday === 0 ? "오늘!" : `D-${sale.dday}`}</p>
          <p className="text-[9px] text-orange-100 mt-0.5">{sale.dday === 0 ? "지금 구매하세요" : "남았습니다"}</p>
        </div>
      </div>
      {savings > 0 && (
        <div className="bg-white rounded-2xl p-3 flex items-center gap-3">
          <div className="text-xl">💡</div>
          <div>
            <p className="text-[11px] font-bold text-gray-800">세일 시 예상가 {fmt(estPrice)}</p>
            <p className="text-[10px] text-gray-500">지금보다 최대 {fmt(savings)} 절약 가능</p>
          </div>
        </div>
      )}
    </div>
  );
};
