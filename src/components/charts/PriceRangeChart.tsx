import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import type { PricePoint } from "../../types";
import { fmt, avg60 } from "../../utils";
import { ChartTip } from "../ui/index";
import { sliceHist } from "./helpers";

const TABS = [
  { id:"7d",  label:"1주일", days:7   },
  { id:"30d", label:"1개월", days:30  },
  { id:"90d", label:"3개월", days:90  },
  { id:"all", label:"전체",  days:999 },
];

const BINS = 8; // 전체 탭 벨커브의 가격 구간 수

// 가격대별 출현 빈도 (벨커브 데이터) — dMin~dMax를 BINS개 구간으로 나눠 카운트
const buildBellData = (data: PricePoint[], dMin: number, dMax: number) => {
  const binW = (dMax - dMin || 1) / BINS;
  const counts = Array.from({ length: BINS }, () => 0);
  data.forEach(d => {
    const idx = Math.min(BINS - 1, Math.max(0, Math.floor((d.price - dMin) / binW)));
    counts[idx]++;
  });
  return counts.map((count, i) => ({ price: Math.round(dMin + (i + 0.5) * binW), count }));
};

const binIndexFor = (price: number, dMin: number, dMax: number) => {
  const binW = (dMax - dMin || 1) / BINS;
  return Math.min(BINS - 1, Math.max(0, Math.floor((price - dMin) / binW)));
};

// 현재가 위치 색상 보간 — 저가(초록) ~ 고가(빨강)
const priceHeatColor = (current: number, dMin: number, dMax: number) => {
  const t = Math.min(1, Math.max(0, (current - dMin) / (dMax - dMin || 1)));
  const from = [34, 197, 94], to = [239, 68, 68];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix.join(",")})`;
};

interface BuyBadgeProps { current: number; dMin: number; dAvg: number; }
const BuyBadge = ({ current, dMin, dAvg }: BuyBadgeProps) => {
  const badge =
    current <= dMin * 1.05 ? { emoji:"🟢", text:"지금 구매 추천!", className:"bg-green-500 text-white" } :
    current >= dAvg * 1.1  ? { emoji:"🟠", text:"가격 하락 대기",   className:"bg-orange-500 text-white" } :
                              { emoji:"💙", text:"적정 가격대",     className:"bg-blue-500 text-white" };
  return (
    <div className="flex justify-center mt-3">
      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ${badge.className}`}>
        {badge.emoji} {badge.text}
      </span>
    </div>
  );
};

interface PriceRangeChartProps { hist: PricePoint[]; minP: number; maxP: number; }

export const PriceRangeChart = ({ hist, minP, maxP }: PriceRangeChartProps) => {
  void minP; void maxP; // used by parent for layout decisions
  const [activeTab, setActiveTab] = useState("30d");
  const isAll   = activeTab === "all";
  const tabDays = TABS.find(t => t.id === activeTab)?.days ?? 30;
  const data    = useMemo(() => sliceHist(hist, tabDays), [hist, tabDays]);
  const dMin    = useMemo(() => Math.min(...data.map(d => d.price)), [data]);
  const dMax    = useMemo(() => Math.max(...data.map(d => d.price)), [data]);
  const dAvg    = useMemo(() => avg60(data), [data]);
  // hist의 마지막 포인트는 항상 오늘(현재가)로 생성됨(generateHistory) — 탭으로 슬라이스해도 유지됨
  const current = data[data.length - 1]?.price ?? dMax;

  const bellData  = useMemo(() => buildBellData(data, dMin, dMax), [data, dMin, dMax]);
  const bellY     = bellData[binIndexFor(current, dMin, dMax)]?.count ?? 0;
  const heatColor = useMemo(() => priceHeatColor(current, dMin, dMax), [current, dMin, dMax]);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      {!isAll && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-800">실시간 가격 추이</p>
          <p className="text-xs text-gray-400">평균 {fmt(dAvg)}</p>
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isAll ? (
        <>
          <div className="flex gap-2 mb-3">
            {([
              ["역대최저가", dMin,    "text-red-500"],
              ["평균가",     dAvg,    "text-gray-700"],
              ["현재가",     current, "text-orange-500"],
            ] as const).map(([label, value, cls]) => (
              <div key={label} className="flex-1 bg-white rounded-2xl py-2.5 text-center">
                <p className="text-[10px] text-gray-400">{label}</p>
                <p className={`text-sm font-extrabold mt-0.5 ${cls}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={bellData} margin={{top:4,right:6,left:-24,bottom:0}}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF5A1F" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
              <XAxis dataKey="price" type="number" domain={[dMin, dMax]}
                tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}
                tickFormatter={(v: number)=>`${(v/1000).toFixed(0)}k`}/>
              <YAxis hide/>
              <Tooltip content={<ChartTip/>}/>
              <ReferenceLine x={current} stroke={heatColor} strokeWidth={2} strokeDasharray="4 2"/>
              <ReferenceDot x={current} y={bellY} r={5} fill={heatColor} stroke="white" strokeWidth={2}/>
              <Area type="monotone" dataKey="count" stroke="#FF5A1F" strokeWidth={2.5}
                fill="url(#cGrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{top:4,right:6,left:-24,bottom:0}}>
            <defs>
              <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FF5A1F" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false}/>
            <XAxis dataKey="date" tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:9,fill:"#9ca3af"}} tickLine={false} axisLine={false}
              tickFormatter={(v: number)=>`${(v/1000).toFixed(0)}k`} domain={[dMin*0.9, dMax*1.06]}/>
            <Tooltip content={<ChartTip/>}/>
            <ReferenceLine y={dMin} stroke="#FF5A1F" strokeDasharray="4 2" strokeWidth={1.5}/>
            <Area type="monotone" dataKey="price" stroke="#FF5A1F" strokeWidth={2.5}
              fill="url(#cGrad)" dot={false}
              activeDot={{r:5,fill:"#FF5A1F",stroke:"white",strokeWidth:2}}/>
          </AreaChart>
        </ResponsiveContainer>
      )}

      {!isAll && (
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-orange-400"/>
            <p className="text-[10px] text-gray-400">최저가 기준선</p>
          </div>
          <div className="flex gap-3">
            <p className="text-[10px] text-gray-400">최저 <span className="text-red-500 font-bold">{fmt(dMin)}</span></p>
            <p className="text-[10px] text-gray-400">최고 <span className="text-gray-600 font-bold">{fmt(dMax)}</span></p>
          </div>
        </div>
      )}

      <BuyBadge current={current} dMin={dMin} dAvg={dAvg}/>

      <p className="mt-3 text-[11px] text-[#999]">
        * 가격 추이는 알리익스프레스 실시간 데이터를 분석한 참고용 정보입니다. 실제 가격과 다를 수 있으니 구매 전 확인하세요.
      </p>
    </div>
  );
};
