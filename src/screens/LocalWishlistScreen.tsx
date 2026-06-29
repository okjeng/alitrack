import { useState } from "react";
import type { Product, WishlistItem } from "../types";
import { getLocalWishlist, toggleLocalWish, fmt } from "../utils";
import { IconBack } from "../components/ui/index";
import { EmptyWishlist } from "../components/EmptyStates";

interface LocalWishlistScreenProps {
  onBack: () => void;
  onGoHome: () => void;
  onProduct: (p: Product) => void;
  showToast: (msg: string) => void;
}

const toProduct = (w: WishlistItem): Product => ({
  id: w.id, name: w.name, shortName: w.name, price: w.price,
  orig: w.orig ?? Math.round(w.price * 1.3), discount: 0,
  image: w.image_url, tag: "", deliveryDays: 0, rating: 0, reviews: 0,
});

export const LocalWishlistScreen = ({ onBack, onGoHome: _onGoHome, onProduct, showToast }: LocalWishlistScreenProps) => {
  const [wish, setWish] = useState<WishlistItem[]>(getLocalWishlist);

  const remove = (item: WishlistItem) => {
    toggleLocalWish(toProduct(item));
    setWish(getLocalWishlist());
    showToast("관심상품에서 제거했어요");
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기"
          className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <IconBack />
        </button>
        <p className="text-base font-bold text-gray-900">찜한상품</p>
        {wish.length > 0 && <span className="ml-auto text-xs text-orange-500 font-bold">{wish.length}개</span>}
      </div>

      {wish.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <div className="px-4 py-4 space-y-3">
          {wish.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex shadow-sm">
              <button onClick={() => onProduct(toProduct(p))} className="flex-1 flex items-center gap-3 px-4 py-3 text-left">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-50" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{p.name}</p>
                  {p.price && <p className="text-sm font-extrabold text-orange-500 mt-1">{fmt(p.price)}</p>}
                </div>
              </button>
              <button onClick={() => remove(p)}
                className="px-4 text-gray-300 hover:text-red-400 transition text-lg border-l border-gray-50">❤️</button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 text-center pt-2">
            이 기기에만 저장됩니다 · 이메일 가입 시 계정에 통합돼요
          </p>
        </div>
      )}
    </div>
  );
};
