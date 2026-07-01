import { useState } from "react";
import { PRICE_FINAL_MALLS, HOME_SECTION_COPY } from "../data/homeSectionCopy";

interface MallPriceRailProps {
  title: string;
  moreLabel?: string;
  onMore?: () => void;
}

// 쇼핑몰별 탭(가로 스크롤) + "준비 중" 플레이스홀더 — API 미연동 상태 전용
export const MallPriceRail = ({ title, moreLabel, onMore }: MallPriceRailProps) => {
  const [activeMall, setActiveMall] = useState(PRICE_FINAL_MALLS[0].id);
  const activeMallLabel = PRICE_FINAL_MALLS.find(m => m.id === activeMall)?.label ?? "";

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

      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-3">
        {PRICE_FINAL_MALLS.map(mall => (
          <button key={mall.id} onClick={() => setActiveMall(mall.id)}
            aria-current={activeMall === mall.id ? "true" : undefined}
            className={`flex-shrink-0 px-3 rounded-xl transition ${
              activeMall === mall.id ? "bg-orange-500 text-white" : "bg-white text-gray-600"
            }`}
            style={{ height: 40, fontSize: 12, fontWeight: 600 }}>
            {mall.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-8 gap-2 bg-white" style={{ borderRadius: 16 }}>
        <span className="text-3xl">🛠️</span>
        <p className="text-gray-600" style={{ fontSize: 13, fontWeight: 500 }}>{HOME_SECTION_COPY.comingSoon}</p>
        <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 500 }}>
          곧 {activeMallLabel} 최저가를 비교해서 보여드릴게요
        </p>
      </div>
    </div>
  );
};
