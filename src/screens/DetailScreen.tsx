import { useState, useEffect, useMemo } from "react";
import type { Product, User } from "../types";
import { fmt, idToSeed, generateHistory, buildAffiliateUrl, toggleLocalWish, getLocalWishlist, getLocalAlerts, savePriceHistory, trackEvent } from "../utils";
import { TAG_COLORS, NAV_H, BTN_H, FALLBACK_IMAGE } from "../data/constants";
import { IconBack, LegalFooter } from "../components/ui/index";
import { PriceRangeChart } from "../components/charts/PriceRangeChart";
import { WeeklyPatternCard } from "../components/charts/WeeklyPatternCard";
import { NextSaleCountdown } from "../components/charts/NextSaleCountdown";
import { PriceTimeline } from "../components/charts/PriceTimeline";
import { SellerCompareCard } from "../components/charts/SellerCompareCard";
import { CoupangCompareCard } from "../components/charts/CoupangCompareCard";
import { ShareSheet } from "../modals/ShareSheet";
import { AlertModal } from "../modals/AlertModal";

interface DetailScreenProps {
  product: Product;
  onBack: () => void;
  showLogin: () => void;
  showToast: (msg: string) => void;
  user: User | null;
}

export const DetailScreen = ({ product, onBack, showLogin, showToast, user }: DetailScreenProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [wished, setWished]       = useState(() => {
    try { return getLocalWishlist().some(p => p.id === product.id); } catch { return false; }
  });
  const [alertActive, setAlertActive] = useState(() => {
    try { return getLocalAlerts().some(a => a.product_id === product.id); } catch { return false; }
  });

  useEffect(() => { savePriceHistory(product); }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  const seed         = useMemo(() => idToSeed(product.id), [product.id]);
  const hist         = useMemo(() => generateHistory(product.price, seed), [product.price, seed]);
  const minP         = useMemo(() => Math.min(...hist.map(d => d.price)), [hist]);
  const maxP         = useMemo(() => Math.max(...hist.map(d => d.price)), [hist]);
  const affiliateUrl = useMemo(() => buildAffiliateUrl(product.id, product.affiliate_url), [product.id, product.affiliate_url]);

  const handleWish = () => {
    const nowWished = toggleLocalWish(product);
    setWished(nowWished);
    showToast(nowWished
      ? (user ? "관심상품에 추가했어요 ❤️" : "관심상품에 추가했어요 ❤️  (이메일 가입 시 영구 보관)")
      : "관심상품에서 제거했어요");
  };

  return (
    <>
      <div style={{ paddingBottom: `calc(env(safe-area-inset-bottom,0px) + ${NAV_H + BTN_H}px)` }}>
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
          <button onClick={onBack} aria-label="뒤로 가기"
            className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
            <IconBack />
          </button>
          <p className="text-sm font-bold text-gray-900 flex-1"
             style={{ display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {product.name}
          </p>
        </div>

        <div className="bg-[#F7F7F8]">
          <img src={product.image} alt={product.shortName} loading="lazy"
            className="w-full max-h-72 object-contain mx-auto"
            onError={e => { e.currentTarget.src = FALLBACK_IMAGE; e.currentTarget.onerror = null; }} />
        </div>

        <div className="px-4 pt-4 space-y-4">
          <div>
            <span className={`text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${TAG_COLORS[product.tag] || "bg-gray-500"}`}>
              {product.tag}
            </span>
            <p className="text-lg font-extrabold text-gray-900 mt-2 leading-snug">{product.name}</p>
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-extrabold text-gray-900">{fmt(product.price)}</p>
                {product.discount > 0
                  ? <span className="text-base font-bold text-red-500">▼ {product.discount}%</span>
                  : product.discount < 0
                  ? <span className="text-base font-bold text-blue-500">▲ {Math.abs(product.discount)}%</span>
                  : null}
              </div>
              <p className="text-sm text-gray-400 line-through">{fmt(product.orig)}</p>
            </div>
            <p className="text-xs text-[#00C07F] font-bold mt-1">🚀 {product.deliveryDays}일 내 배송 · 무료배송</p>
            <p className="text-xs text-gray-400 mt-0.5">⭐ {product.rating} 평점 ({product.reviews.toLocaleString()}개 리뷰)</p>
          </div>

          <div className="flex gap-2">
            {[
              { icon:wished ? "❤️" : "🤍",     label:"관심상품", action:handleWish },
              { icon:alertActive ? "🔔" : "🔕", label:"알림 받기", action:() => setAlertOpen(true) },
              { icon:"🔗",                       label:"공유하기",  action:() => setShareOpen(true) },
            ].map(b => (
              <button key={b.label} onClick={b.action}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl bg-[#F7F7F8] active:bg-gray-200 transition">
                <span className="text-xl">{b.icon}</span>
                <span className="text-[10px] text-gray-600 font-semibold">{b.label}</span>
              </button>
            ))}
          </div>

          {(() => {
            const orig  = product.orig || Math.round(product.price * 1.4);
            const saved = orig - product.price;
            const maxSave = orig - minP;
            if (saved <= 0) return null;
            return (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 tracking-wide mb-1">💰 지금 구매하면 절감되는 금액</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-extrabold text-emerald-600">{fmt(saved)}</p>
                  <p className="text-xs text-emerald-500 mb-0.5 line-through">{fmt(orig)}</p>
                </div>
                {minP < product.price && (
                  <p className="text-[11px] text-emerald-700 mt-1.5 font-semibold">
                    📉 역대 최저가 {fmt(minP)}까지 떨어지면 최대 {fmt(maxSave)} 절감 가능
                  </p>
                )}
              </div>
            );
          })()}

          <PriceRangeChart hist={hist} minP={minP} maxP={maxP} />
          <WeeklyPatternCard basePrice={product.price} seed={seed} />
          <NextSaleCountdown currentPrice={product.price} />
          <PriceTimeline hist={hist} currentPrice={product.price} />
          <SellerCompareCard product={product} />
          <CoupangCompareCard productName={product.name} currentPrice={product.price} />
          <LegalFooter />
        </div>
      </div>

      <div className="fixed left-0 right-0 z-40 flex justify-center px-4 pt-3"
           style={{ bottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)`, background:"linear-gradient(to top,white 65%,transparent)", paddingBottom:12 }}>
        <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
           onClick={() => trackEvent("purchase_click", { product_id:product.id, product_name:product.name, price:product.price })}
           className="w-full max-w-[568px] block text-center text-white font-extrabold py-4 rounded-2xl text-sm shadow-xl active:opacity-90 transition"
           style={{ background:"linear-gradient(90deg,#FF5A1F,#f7462a)" }}>
          알리익스프레스에서 최저가로 구매하기 →
        </a>
      </div>

      {shareOpen && <ShareSheet product={product} onClose={() => setShareOpen(false)} showToast={showToast} />}
      {alertOpen && <AlertModal product={product} user={user}
        onClose={() => { setAlertOpen(false); setAlertActive(getLocalAlerts().some(a => a.product_id === product.id)); }}
        showToast={showToast} showLogin={showLogin} />}
    </>
  );
};
