import { fmt } from "../../utils";
import { extractKeyword, buildCoupangUrl } from "./helpers";

interface CoupangCompareCardProps { productName: string; currentPrice: number; }

export const CoupangCompareCard = ({ productName, currentPrice }: CoupangCompareCardProps) => {
  const keyword  = extractKeyword(productName);
  const url      = buildCoupangUrl(keyword);
  const estRange = { low: Math.round(currentPrice * 0.9 / 100) * 100, high: Math.round(currentPrice * 1.15 / 100) * 100 };

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛒</span>
        <p className="text-sm font-bold text-gray-800">쿠팡 가격 비교</p>
        <span className="ml-auto text-[10px] text-gray-400">제휴 링크</span>
      </div>
      <div className="bg-white rounded-2xl p-3 mb-3">
        <p className="text-xs text-gray-500 mb-1">검색어</p>
        <p className="text-sm font-bold text-gray-800">{keyword}</p>
        <p className="text-[10px] text-gray-400 mt-1">예상 가격대 {fmt(estRange.low)} ~ {fmt(estRange.high)}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
         className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm text-white"
         style={{ background:"linear-gradient(135deg,#E53935,#B71C1C)" }}>
        <span>쿠팡에서 비교하기</span>
        <span className="text-lg">↗</span>
      </a>
      <p className="text-[9px] text-gray-400 text-center mt-2">제휴 구매 시 소정의 수수료를 받을 수 있습니다</p>
    </div>
  );
};
