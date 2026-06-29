import { useMemo } from "react";
import { fmt } from "../../utils";
import { calcWeeklyPattern } from "./helpers";

interface WeeklyPatternCardProps { basePrice: number; seed: number; }

export const WeeklyPatternCard = ({ basePrice, seed }: WeeklyPatternCardProps) => {
  const pattern  = useMemo(() => calcWeeklyPattern(basePrice, seed), [basePrice, seed]);
  const minPrice = Math.min(...pattern.map(d => d.price));
  const maxPrice = Math.max(...pattern.map(d => d.price));
  const cheapDay = pattern.find(d => d.isMin);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-bold text-gray-800">📅 요일별 가격 패턴</p>
        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          {cheapDay?.day}요일 최저
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        알리는 <span className="text-orange-500 font-bold">{cheapDay?.day}요일</span>에 가장 저렴한 경향이 있어요
      </p>
      <div className="flex items-end gap-1.5 h-20">
        {pattern.map((d) => {
          const ratio = (d.price - minPrice) / (maxPrice - minPrice || 1);
          const barH  = 28 + ratio * 44;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg transition-all duration-300 relative"
                   style={{ height: barH, background: d.isMin ? "linear-gradient(to top,#FF5A1F,#FF8C5A)" : "linear-gradient(to top,#E5E7EB,#F3F4F6)" }}>
                {d.isMin && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px]">🏆</span>}
              </div>
              <p className={`text-[10px] font-bold ${d.isMin ? "text-orange-500" : "text-gray-400"}`}>{d.day}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[10px] text-gray-400">
          최저 <span className="text-orange-500 font-semibold">{fmt(minPrice)}</span>
          <span className="mx-1">·</span>
          최고 <span className="text-gray-500 font-semibold">{fmt(maxPrice)}</span>
        </p>
        <p className="text-[10px] text-gray-400">주간 편차 {fmt(maxPrice - minPrice)}</p>
      </div>
    </div>
  );
};
