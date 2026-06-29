export const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

interface ToastProps { msg: string; visible: boolean; }
export const Toast = ({ msg, visible }: ToastProps) => (
  <div className={`fixed z-[300] left-1/2 -translate-x-1/2 transition-all duration-300 ${visible?"opacity-100 translate-y-0":"opacity-0 -translate-y-2 pointer-events-none"}`}
       style={{ top:"calc(env(safe-area-inset-top,0px) + 20px)" }}>
    <div className="bg-gray-900 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap flex items-center gap-2">
      ✅ {msg}
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="rounded-2xl bg-gray-100 overflow-hidden" style={{ animation:"shimmer 1.4s ease-in-out infinite" }}>
    <div className="aspect-square bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-2/5" />
    </div>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center py-8 gap-3">
    <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"
         style={{ borderWidth:3, animation:"spin 0.8s linear infinite" }} />
    <p className="text-xs text-gray-400">상품을 불러오는 중...</p>
  </div>
);

export const LegalFooter = () => (
  <div className="bg-[#F9F9F9] rounded-2xl px-4 py-5 space-y-2.5 mt-6">
    {[
      "본 서비스의 가격 분석 및 최저가 정보는 수집된 데이터를 기반으로 한 독립적인 분석 결과이며, 실제 판매 가격과 다를 수 있습니다.",
      "상품 가격은 실시간으로 변동될 수 있으므로, 최종 구매 전 해당 쇼핑몰에서 결제 금액을 반드시 재확인하시기 바랍니다.",
      "본 서비스는 제휴 마케팅 프로그램에 참여하고 있으며, 링크를 통한 구매 시 소정의 수수료를 받을 수 있습니다.",
      "발생한 수익은 광고 없는 무료 가격 추적 서비스의 안정적인 운영 및 고도화에 전액 재투자됩니다.",
    ].map((t,i) => <p key={i} style={{fontSize:11,color:"#8E8E93",lineHeight:1.65}}>· {t}</p>)}
    <div className="pt-2 border-t border-gray-200 flex justify-between">
      <p style={{fontSize:10,color:"#C7C7CC"}}>© 2026 AliTrack. All rights reserved.</p>
      <p style={{fontSize:10,color:"#C7C7CC"}}>v4.1.0</p>
    </div>
  </div>
);

interface ChartTipProps { active?: boolean; payload?: Array<{ value?: number }>; label?: string; }
export const ChartTip = ({ active, payload, label }: ChartTipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-orange-400">{(payload[0].value ?? 0).toLocaleString("ko-KR")}원</p>
    </div>
  );
};
