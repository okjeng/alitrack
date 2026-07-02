import { fmt } from "../../utils";
import { extractKeyword, buildCoupangUrl } from "./helpers";

interface CoupangCompareCardProps {
  productName: string;
  currentPrice: number;
  discount: number;
  affiliateUrl: string;
}

export const CoupangCompareCard = ({ productName, currentPrice, discount, affiliateUrl }: CoupangCompareCardProps) => {
  const coupangUrl = buildCoupangUrl(extractKeyword(productName));

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-center text-gray-800 text-sm mb-3" style={{ fontWeight: 700 }}>
        가격 vs 빠른 배송, 당신에게 맞는 선택을!
      </p>

      <div className="flex gap-2">
        {/* 알리익스프레스 */}
        <div className="flex-1 bg-white rounded-2xl p-3" style={{ boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <p className="text-sm font-bold text-gray-800 mb-2">AliExpress</p>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <p className="text-lg font-extrabold text-gray-900">{fmt(currentPrice)}</p>
            {discount > 0 && (
              <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">-{discount}%</span>
            )}
          </div>
          <div className="space-y-1 mb-3">
            <p className="text-[11px] text-gray-500">배송 <span className="text-gray-700 font-semibold">15~25일</span></p>
            <p className="text-[11px] text-gray-500">배송비 <span className="text-gray-700 font-semibold">무료</span></p>
            <p className="text-[11px] text-gray-500">특징 <span className="text-orange-600 font-bold">최저가</span></p>
          </div>
          <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
             className="block text-center text-white font-bold text-xs py-2.5 rounded-xl"
             style={{ background: "linear-gradient(135deg,#FF5A1F,#f7462a)" }}>
            알리에서 구매하기
          </a>
        </div>

        {/* 쿠팡 */}
        <div className="flex-1 bg-white rounded-2xl p-3" style={{ boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <p className="text-sm font-bold text-gray-800 mb-2">Coupang</p>
          <p className="text-sm font-bold text-gray-700 mb-2" style={{ minHeight: 28 }}>빠른 배송이 필요하다면?</p>
          <div className="space-y-1 mb-3">
            <p className="text-[11px] text-gray-500">배송 <span className="text-gray-700 font-semibold">1~3일</span></p>
            <p className="text-[11px] text-gray-500">배송비 <span className="text-gray-700 font-semibold">무료 (로켓배송)</span></p>
            <p className="text-[11px] text-gray-500">특징 <span className="text-red-600 font-bold">가장 빠름</span></p>
          </div>
          <a href={coupangUrl} target="_blank" rel="noopener noreferrer"
             className="block text-center text-white font-bold text-xs py-2.5 rounded-xl"
             style={{ background: "linear-gradient(135deg,#E53935,#B71C1C)" }}>
            쿠팡에서 확인하기 →
          </a>
          <p className="text-[9px] text-gray-400 text-center mt-1.5">최종 가격은 쿠팡에서 직접 확인하세요</p>
        </div>
      </div>
    </div>
  );
};
