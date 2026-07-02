import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
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

interface PriceRangeChartProps { hist: PricePoint[]; minP: number; maxP: number; }

export const PriceRangeChart = ({ hist, minP, maxP }: PriceRangeChartProps) => {
  void minP; void maxP; // used by parent for layout decisions
  const [activeTab, setActiveTab] = useState("30d");
  const tabDays = TABS.find(t => t.id === activeTab)?.days ?? 30;
  const data    = useMemo(() => sliceHist(hist, tabDays), [hist, tabDays]);
  const dMin    = useMemo(() => Math.min(...data.map(d => d.price)), [data]);
  const dMax    = useMemo(() => Math.max(...data.map(d => d.price)), [data]);
  const dAvg    = useMemo(() => avg60(data), [data]);

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-800">📊 가격 변동 차트</p>
        <p className="text-xs text-gray-400">평균 {fmt(dAvg)}</p>
      </div>
      <div className="flex gap-1.5 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>
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
    </div>
  );
};
