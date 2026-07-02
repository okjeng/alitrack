import { fmt } from "../../utils";
import { extractKeyword, buildCoupangUrl } from "./helpers";

interface CoupangCompareCardProps {
  productName: string;
  currentPrice: number;
  discount: number;
  affiliateUrl: string;
}

const ALI_COLOR = "#FF6B00";

interface InfoRowProps { label: string; value: string; accent: string; }
const InfoRow = ({ label, value, accent }: InfoRowProps) => (
  <div className="py-2" style={{ borderTop: "1px solid #F0F0F0" }}>
    <p className="text-[10px] text-gray-400">{label}</p>
    <p className="text-sm font-bold mt-0.5" style={{ color: accent }}>{value}</p>
  </div>
);

export const CoupangCompareCard = ({ productName, currentPrice, discount, affiliateUrl }: CoupangCompareCardProps) => {
  const coupangUrl = buildCoupangUrl(extractKeyword(productName));

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-center text-gray-800 text-sm mb-3" style={{ fontWeight: 700 }}>
        가격 vs 빠른 배송, 당신에게 맞는 선택을!
      </p>

      <div className="flex gap-2">
        {/* 알리익스프레스 — 주황색 강조 */}
        <div className="flex-1 bg-white p-3"
             style={{ borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: `1.5px solid ${ALI_COLOR}` }}>
          <p className="text-sm mb-1" style={{ color: ALI_COLOR, fontWeight: 700 }}>AliExpress</p>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <p className="text-xl" style={{ color: ALI_COLOR, fontWeight: 800 }}>{fmt(currentPrice)}</p>
            {discount > 0 && (
              <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">-{discount}%</span>
            )}
          </div>

          <div style={{ borderBottom: "1px solid #F0F0F0" }}>
            <InfoRow label="배송"   value="15~25일"      accent="#111827" />
            <InfoRow label="배송비" value="상품마다 상이" accent="#111827" />
            <InfoRow label="특징"   value="최저가"        accent={ALI_COLOR} />
          </div>

          <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
             className="block text-center text-white font-bold text-xs py-2.5 rounded-xl mt-3"
             style={{ background: "linear-gradient(135deg,#FF5A1F,#f7462a)" }}>
            알리에서 구매하기
          </a>
        </div>

        {/* 쿠팡 — 회색 톤, 유도 문구 강조 */}
        <div className="flex-1 bg-white p-3"
             style={{ borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: "1.5px solid #D1D5DB" }}>
          <p className="text-sm font-bold text-gray-700 mb-1">Coupang</p>
          <p className="text-base font-extrabold text-gray-800 mb-1" style={{ minHeight: 28 }}>빠른 배송이 필요하다면?</p>

          <div style={{ borderBottom: "1px solid #F0F0F0" }}>
            <InfoRow label="배송"   value="1~3일"        accent="#111827" />
            <InfoRow label="배송비" value="상품마다 상이" accent="#111827" />
            <InfoRow label="특징"   value="가장 빠름"     accent="#4B5563" />
          </div>

          <a href={coupangUrl} target="_blank" rel="noopener noreferrer"
             className="block text-center text-white font-bold text-xs py-2.5 rounded-xl mt-3"
             style={{ background: "linear-gradient(135deg,#1F2937,#374151)" }}>
            쿠팡에서 확인하기 →
          </a>
          <p className="text-[9px] text-gray-400 text-center mt-1.5">최종 가격은 쿠팡에서 직접 확인하세요</p>
        </div>
      </div>
    </div>
  );
};
