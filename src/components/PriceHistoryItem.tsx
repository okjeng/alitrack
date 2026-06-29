import { useMemo } from "react";
import type { Product, PricePoint } from "../types";
import { idToSeed, generateHistory, buildAffiliateUrl, fmt, getLocalAlerts } from "../utils";

interface SparklineProps { prices: number[]; width?: number; height?: number; }

const Sparkline = ({ prices, width = 60, height = 20 }: SparklineProps) => {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
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

interface ShoppingCandleChartProps { hist: PricePoint[]; width?: number; height?: number; }

const ShoppingCandleChart = ({ hist, width = 300, height = 80 }: ShoppingCandleChartProps) => {
  if (!hist || hist.length < 4) return null;
  const weekly: Array<{ open: number; close: number; high: number; low: number; date: string }> = [];
  for (let i = 0; i + 3 < hist.length; i += 4) {
    const slice  = hist.slice(i, i + 4).map(d => d.price);
    const open   = slice[0];
    const close  = slice[slice.length - 1];
    const high   = Math.max(...slice);
    const low    = Math.min(...slice);
    weekly.push({ open, close, high, low, date: hist[i].date });
  }
  const allPrices = weekly.flatMap(w => [w.high, w.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const cw    = width / weekly.length;
  const toY   = (p: number) => height - ((p - minP) / range) * height * 0.85 - height * 0.07;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {weekly.map((w, i) => {
        const isGreen = w.close >= w.open;
        const color   = isGreen ? "#22C55E" : "#EF4444";
        const cx      = i * cw + cw / 2;
        const bodyTop = toY(Math.max(w.open, w.close));
        const bodyBot = toY(Math.min(w.open, w.close));
        const bodyH   = Math.max(1, bodyBot - bodyTop);
        return (
          <g key={i}>
            <line x1={cx} y1={toY(w.high)} x2={cx} y2={toY(w.low)} stroke={color} strokeWidth="1" />
            <rect x={cx - cw * 0.28} y={bodyTop} width={cw * 0.56} height={bodyH} fill={color} rx="1" />
          </g>
        );
      })}
    </svg>
  );
};

interface PriceHistoryItemProps {
  item: Product & { timestamp?: number };
  onDetail: (item: Product) => void;
}

export const PriceHistoryItem = ({ item, onDetail }: PriceHistoryItemProps) => {
  const seed    = useMemo(() => idToSeed(item.id), [item.id]);
  const hist    = useMemo(() => generateHistory(item.price, seed), [item.price, seed]);
  const prices  = useMemo(() => hist.map(d => d.price), [hist]);
  const minP    = Math.min(...prices);
  const maxP    = Math.max(...prices);
  const isAtMin = item.price <= minP * 1.02;
  const alerts  = getLocalAlerts();
  const hasAlert = alerts.some(a => a.product_id === item.id);

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
      <div className="p-3">
        <div className="flex items-start gap-3 mb-3">
          <img src={item.image} alt={item.name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
            onError={e => { e.currentTarget.src = "https://placehold.co/56x56/F3F4F6/9CA3AF?text=📦"; e.currentTarget.onerror = null; }} />
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
        <div className="rounded-xl overflow-hidden bg-gray-50">
          <ShoppingCandleChart hist={hist} width={300} height={60} />
        </div>
        {hasAlert && (
          <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-xl px-2.5 py-1.5">
            <span className="text-xs">🔔</span>
            <p className="text-[10px] font-semibold text-orange-600">가격 알림 설정됨</p>
          </div>
        )}
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={() => onDetail(item)}
          className="flex-1 py-3 text-xs font-bold text-orange-500 active:bg-orange-50 transition">
          상세보기
        </button>
        <div className="w-px bg-gray-100" />
        <a href={buildAffiliateUrl(item.id, item.affiliate_url)} target="_blank" rel="noopener noreferrer"
          className="flex-1 py-3 text-xs font-bold text-gray-600 text-center active:bg-gray-50 transition">
          구매하기
        </a>
      </div>
    </div>
  );
};

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
