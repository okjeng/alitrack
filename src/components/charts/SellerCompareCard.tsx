import { useState, useEffect } from "react";
import type { Product } from "../../types";
import { fmt, mapProduct, buildAffiliateUrl } from "../../utils";
import { API_BASE } from "../../data/constants";
import { extractKeyword } from "./helpers";

const fetchSellerList = async (productName: string, productId: string): Promise<Product[]> => {
  const keyword = extractKeyword(productName);
  try {
    const res = await fetch(`${API_BASE}/api/ali/products?keyword=${encodeURIComponent(keyword)}&size=5&sort=price_asc`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map(mapProduct).filter((p: Product) => p.id !== productId).slice(0, 4);
  } catch { return []; }
};

interface SellerCompareCardProps { product: Product; }

export const SellerCompareCard = ({ product }: SellerCompareCardProps) => {
  const [sellers, setSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSellerList(product.name, product.id).then(list => {
      setSellers(list);
      setLoading(false);
    });
  }, [product.id, product.name]);

  if (loading) {
    return (
      <div className="bg-[#F7F7F8] rounded-3xl p-4">
        <p className="text-sm font-bold text-gray-800 mb-3">🏪 다른 판매자 비교</p>
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (sellers.length === 0) return null;

  return (
    <div className="bg-[#F7F7F8] rounded-3xl p-4">
      <p className="text-sm font-bold text-gray-800 mb-3">🏪 다른 판매자 비교</p>
      <div className="space-y-2">
        {sellers.map((s, i) => (
          <a key={s.id} href={buildAffiliateUrl(s.id, s.affiliate_url)} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-3 bg-white rounded-2xl p-3 active:bg-gray-50 transition">
            <img src={s.image} alt={s.shortName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                 onError={e => { e.currentTarget.src = "https://placehold.co/48x48/F3F4F6/9CA3AF?text=📦"; e.currentTarget.onerror = null; }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-700 truncate">{s.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-extrabold text-gray-900">{fmt(s.price)}</p>
                {i === 0 && <span className="text-[9px] font-bold text-white bg-orange-500 px-1.5 py-0.5 rounded-full">최저</span>}
              </div>
            </div>
            <span className="text-gray-400 text-sm">›</span>
          </a>
        ))}
      </div>
    </div>
  );
};
