import { useMemo } from "react";
import type { Product, PricePoint } from "../types";
import { idToSeed, generateHistory, buildAffiliateUrl, fmt, getLocalAlerts } from "../utils";
import { FALLBACK_IMAGE } from "../data/constants";

interface SparklineProps { prices: number[]; width?: number; height?: number; }
const Sparkline = ({ prices, width = 60, height = 20 }: SparklineProps) => {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const lastY = height - ((prices[prices.length - 1] - min) / range) * height;
  const isDown = prices[prices.length - 1] <= prices[0];
  const color = isDown ? "#22C55E" : "#EF4444";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
      <circle cx={(prices.length - 1) / (prices.length - 1) * width} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
};

// 가격 변동 바 차트 — 하락=빨강(소비자 유리), 상승=파랑
interface PriceTrendBarsProps { hist: PricePoint[]; }
const PriceTrendBars = ({ hist }: PriceTrendBarsProps) => {
  const points = hist.slice(-20);
  if (points.length < 2) return null;
  const W = 300, H = 60;
  const prices = points.map(d => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const n = prices.length;
  const barW = W / n;
  const toY = (p: number) => H - ((p - minP) / range) * H * 0.82 - H * 0.08;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {prices.map((p, i) => {
        const prev  = i > 0 ? prices[i - 1] : p;
        const color = p < prev ? "#EF4444" : p > prev ? "#3B82F6" : "#9CA3AF";
        const cx    = i * barW + barW / 2;
        const y     = toY(p);
        const barH  = Math.max(2, H - y - H * 0.08);
        return (
          <g key={i}>
            <rect x={cx - barW * 0.28} y={y} width={barW * 0.56} height={barH}
              fill={color} opacity={0.65} rx={1.5} />
            <circle cx={cx} cy={y} r={2} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};

// 누적 절감액 카드 전용 인라인 볼린저밴드 (흰색/반투명 톤)
interface SavingsLineChartProps { data: number[]; }
export const SavingsLineChart = ({ data }: SavingsLineChartProps) => {
  if (!data || data.length < 3) return null;
  const W = 300, H = 56;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const toX = (i: number) => (i / (data.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / range) * H * 0.82 - H * 0.09;
  const win = Math.min(5, Math.max(2, Math.floor(data.length / 3)));
  const stats = data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - win + 1), i + 1);
    const mean  = slice.reduce((a, b) => a + b, 0) / slice.length;
    const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length);
    return { mean, upper: mean + 1.5 * std, lower: Math.max(0, mean - 1.5 * std) };
  });
  const linePts = data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const maPts   = stats.map((s, i) => `${toX(i)},${toY(s.mean)}`).join(" ");
  const bandPath = [
    stats.map((s, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(s.upper)}`).join(" "),
    [...stats].reverse().map((s, i) => `L${toX(stats.length - 1 - i)},${toY(s.lower)}`).join(" "),
    "Z",
  ].join(" ");
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={bandPath} fill="rgba(255,255,255,0.12)" />
      <polyline fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"
        strokeDasharray="3 2" points={maPts} />
      <polyline fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" points={linePts} />
    </svg>
  );
};

// 독립형 볼린저밴드 컴포넌트 (유지)
interface BollingerSavingsChartProps { hist: PricePoint[]; }
export const BollingerSavingsChart = ({ hist }: BollingerSavingsChartProps) => {
  if (!hist || hist.length < 20) return null;
  const prices  = hist.map(d => d.price);
  const win     = 20;
  const bands   = prices.slice(win - 1).map((_, i) => {
    const slice  = prices.slice(i, i + win);
    const mean   = slice.reduce((a, b) => a + b, 0) / win;
    const std    = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / win);
    return { mean, upper: mean + 2 * std, lower: mean - 2 * std, price: prices[i + win - 1] };
  });
  const allVals = bands.flatMap(b => [b.upper, b.lower]);
  const minV    = Math.min(...allVals);
  const maxV    = Math.max(...allVals);
  const range   = maxV - minV || 1;
  const W       = 300, H = 80;
  const toX = (i: number) => (i / (bands.length - 1)) * W;
  const toY = (v: number) => H - ((v - minV) / range) * H * 0.85 - H * 0.07;
  const upperPts = bands.map((b, i) => `${toX(i)},${toY(b.upper)}`).join(" ");
  const lowerPts = bands.map((b, i) => `${toX(i)},${toY(b.lower)}`).join(" ");
  const meanPts  = bands.map((b, i) => `${toX(i)},${toY(b.mean)}`).join(" ");
  const pricePts = bands.map((b, i) => `${toX(i)},${toY(b.price)}`).join(" ");
  const bandPath = [
    bands.map((b, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(b.upper)}`).join(" "),
    bands.map((b, i) => `L${toX(bands.length - 1 - i)},${toY(bands[bands.length - 1 - i].lower)}`).join(" "),
    "Z",
  ].join(" ");
  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-sm font-bold text-gray-800 mb-1">📉 볼린저 밴드 분석</p>
      <p className="text-[10px] text-gray-400 mb-3">가격이 하단 밴드에 닿으면 매수 타이밍!</p>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={bandPath} fill="#6366F120" />
        <polyline fill="none" stroke="#6366F140" strokeWidth="1" points={upperPts} />
        <polyline fill="none" stroke="#6366F140" strokeWidth="1" points={lowerPts} />
        <polyline fill="none" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 2" points={meanPts} />
        <polyline fill="none" stroke="#FF5A1F" strokeWidth="2" points={pricePts} />
      </svg>
      <div className="flex gap-4 mt-2">
        {[["#FF5A1F","실제가"],["#9CA3AF","이동평균"],["#6366F1","볼린저 밴드"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{background:c}} />
            <p className="text-[9px] text-gray-500">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PriceHistoryItemProps {
  item: Product & { timestamp?: number };
  onDetail: (item: Product) => void;
}

export const PriceHistoryItem = ({ item, onDetail }: PriceHistoryItemProps) => {
  const seed     = useMemo(() => idToSeed(item.id), [item.id]);
  const hist     = useMemo(() => generateHistory(item.price, seed), [item.price, seed]);
  const prices   = useMemo(() => hist.map(d => d.price), [hist]);
  const minP     = Math.min(...prices);
  const maxP     = Math.max(...prices);
  const isAtMin  = item.price <= minP * 1.02;
  const hasAlert = getLocalAlerts().some(a => a.product_id === item.id);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <div className="p-3">
        <div className="flex items-start gap-3 mb-3">
          <img src={item.image} alt={item.name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
            onError={e => { e.currentTarget.src = FALLBACK_IMAGE; e.currentTarget.onerror = null; }} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-base font-extrabold text-gray-900">{fmt(item.price)}</p>
              {isAtMin && <span className="text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">역대최저!</span>}
            </div>
            <p className="text-[10px] text-gray-400">최저 {fmt(minP)} / 최고 {fmt(maxP)}</p>
          </div>
          <Sparkline prices={prices.slice(-14)} />
        </div>

        <div className="rounded-xl overflow-hidden bg-gray-50 px-1 pt-2 pb-1">
          <PriceTrendBars hist={hist} />
          <div className="flex items-center gap-3 px-1 pb-1 mt-0.5">
            {([["#EF4444","하락"],["#3B82F6","상승"],["#9CA3AF","동일"]] as const).map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{background:c, opacity:0.7}} />
                <span className="text-[9px] text-gray-400">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {hasAlert && (
          <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-xl px-2.5 py-1.5">
            <span className="text-xs">🔔</span>
            <p className="text-[10px] font-semibold text-orange-600">가격 알림 설정됨</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <button onClick={() => onDetail(item)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md active:opacity-80 transition"
          style={{ background:"linear-gradient(135deg,#FF5A1F,#f7462a)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          상세보기
        </button>
        <a href={buildAffiliateUrl(item.id, item.affiliate_url)} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md active:opacity-80 transition"
          style={{ background:"linear-gradient(135deg,#1F2937,#374151)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          구매하기
        </a>
      </div>
    </div>
  );
};
