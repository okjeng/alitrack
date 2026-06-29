import { useMemo } from "react";
import type { PricePoint } from "../../types";
import { fmt } from "../../utils";
import { buildTimeline } from "./helpers";

interface PriceTimelineProps { hist: PricePoint[]; currentPrice: number; }

export const PriceTimeline = ({ hist, currentPrice }: PriceTimelineProps) => {
  const events = useMemo(() => buildTimeline(hist, currentPrice), [hist, currentPrice]);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-sm font-bold text-gray-800 mb-4">📜 가격 변동 히스토리</p>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-4">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 pl-8 relative">
              <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                   style={{ background: `${ev.color}18`, border: `1.5px solid ${ev.color}` }}>
                {ev.icon}
              </div>
              <div className="flex-1 bg-white rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold" style={{ color: ev.color }}>{ev.label}</span>
                  <span className="text-[10px] text-gray-400">{ev.date}</span>
                </div>
                <p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmt(ev.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 bg-blue-50 rounded-2xl p-3">
        <p className="text-[11px] text-blue-700 font-bold">💬 현재가: {fmt(currentPrice)}</p>
        <p className="text-[10px] text-blue-600 mt-0.5">알림 설정 시 최저가 달성 즉시 알림을 받을 수 있어요</p>
      </div>
    </div>
  );
};
