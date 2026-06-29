import { useState, useMemo } from "react";
import type { Product } from "../types";
import { getPriceHistory, generateHistory, idToSeed, getLocalAlerts, removeLocalAlert, fmt } from "../utils";
import { API_BASE } from "../data/constants";
import { IconBack } from "../components/ui/index";
import { PriceHistoryItem, BollingerSavingsChart } from "../components/PriceHistoryItem";
import { EmptyPriceHistory } from "../components/EmptyStates";
import { AlertModal } from "../modals/AlertModal";
import type { PricePoint } from "../types";

interface HistoryItem extends Product { timestamp?: number; productId?: string; }

interface PriceHistoryScreenProps {
  onBack: () => void;
  onScrollToProducts: () => void;
  onProduct: (p: Product) => void;
  showToast: (msg: string) => void;
}

export const PriceHistoryScreen = ({ onBack, onScrollToProducts: _onScrollToProducts, onProduct, showToast }: PriceHistoryScreenProps) => {
  const raw = getPriceHistory();

  const sorted = useMemo(() => {
    return [...raw].sort((a, b) => {
      const lowA = Math.min(...generateHistory(a.price, idToSeed(String((a as HistoryItem).productId))).map((d: PricePoint) => d.price));
      const lowB = Math.min(...generateHistory(b.price, idToSeed(String((b as HistoryItem).productId))).map((d: PricePoint) => d.price));
      return (a.price - lowA) - (b.price - lowB);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw.map(r => (r as HistoryItem).productId).join(",")]);

  const [hist, setHist]         = useState(sorted);
  const [alertModal, setAlertModal] = useState<HistoryItem | null>(null);

  const totalSavings = useMemo(() =>
    hist.reduce((s, item) => {
      const orig = item.orig || Math.round(item.price * 1.4);
      return s + Math.max(0, orig - item.price);
    }, 0),
  [hist]);

  const savingsLine = useMemo(() => {
    let cum = 0;
    return [...hist]
      .sort((a, b) => ((a as HistoryItem).timestamp || 0) - ((b as HistoryItem).timestamp || 0))
      .map(item => {
        const orig = item.orig || Math.round(item.price * 1.4);
        cum += Math.max(0, orig - item.price);
        return cum;
      });
  }, [hist]);

  const alertCount = getLocalAlerts().length;
  const hasAlert   = (productId: string) => getLocalAlerts().some(a => a.product_id === String(productId));

  const toggleAlert = (item: HistoryItem) => {
    if (hasAlert(item.productId || item.id)) {
      const alert = getLocalAlerts().find(a => a.product_id === String(item.productId || item.id));
      removeLocalAlert(String(item.productId || item.id));
      showToast("알림이 해제됐어요");
      setHist([...hist]);
      if (alert?.push_endpoint) {
        fetch(`${API_BASE}/api/push/unsubscribe`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: String(item.productId || item.id), endpoint: alert.push_endpoint }),
        }).catch(() => {});
      }
    } else {
      setAlertModal(item);
    }
  };
  void toggleAlert;

  const BackBtn = () => (
    <button onClick={onBack} aria-label="뒤로 가기"
      className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
      <IconBack />
    </button>
  );

  if (hist.length === 0) return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <BackBtn />
        <p className="text-base font-bold text-gray-900">가격기록</p>
      </div>
      <EmptyPriceHistory />
    </div>
  );

  return (
    <div className="bg-[#F7F7F8] min-h-screen">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <BackBtn />
        <p className="text-base font-bold text-gray-900">쇼핑 성과</p>
        <span className="ml-auto text-[11px] text-gray-400 font-medium">{hist.length}개 탐색 중</span>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl px-5 pt-5 pb-4 text-white shadow-lg shadow-orange-200/60 overflow-hidden">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-bold opacity-75 tracking-wider">누적 절감액</p>
              <p className="text-[32px] font-extrabold leading-tight mt-0.5">
                {totalSavings > 0 ? fmt(totalSavings) : "0원"}
              </p>
              <p className="text-[11px] opacity-70 mt-1">
                {hist.length}개 탐색 · {alertCount > 0 ? `${alertCount}개 알림 설정 중` : "알림 설정 전"}
              </p>
            </div>
            <div className="bg-white/15 rounded-2xl px-3 py-2 text-center flex-shrink-0">
              <p className="text-[10px] opacity-80 font-semibold">절감</p>
              <p className="text-base font-extrabold">
                {totalSavings > 0
                  ? `-${Math.round(totalSavings / hist.reduce((s, item) => s + (item.orig || item.price * 1.4), 0) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
          {savingsLine.length > 2 && (
            <div className="mt-3" style={{ marginLeft:-8, marginRight:-8 }}>
              <BollingerSavingsChart hist={savingsLine.map((p, i) => ({ price: p, date: String(i) }))} />
              <div className="flex justify-end gap-3 px-2 mt-0.5 opacity-70">
                <span className="text-[9px] text-white font-semibold">─ 실제</span>
                <span className="text-[9px] text-white font-semibold opacity-70">─ 이동평균</span>
                <span className="text-[9px] text-white font-semibold opacity-50">- - 밴드</span>
              </div>
            </div>
          )}
          {totalSavings === 0
            ? <p className="text-[11px] opacity-60 mt-3">상품 상세 페이지를 방문하면 절감액이 쌓여요</p>
            : <p className="text-[10px] opacity-55 mt-2 leading-relaxed">탐색한 상품의 알리 기준 원가 대비 할인가 차액을 누적한 예상 절감액이에요.</p>
          }
        </div>
      </div>

      <div className="px-4 pt-2 pb-6 space-y-2">
        {hist.map(item => (
          <PriceHistoryItem key={(item as HistoryItem).productId || item.id} item={item} onDetail={onProduct} />
        ))}
        <p className="text-[10px] text-gray-400 text-center pt-2">역대 최저가 근접 순 정렬 · 최대 50개 보관</p>
      </div>

      {alertModal && (
        <AlertModal
          product={{ id: alertModal.productId || alertModal.id, name: alertModal.name, price: alertModal.price, image: alertModal.image, shortName: alertModal.shortName, orig: alertModal.orig, discount: alertModal.discount, tag: alertModal.tag, deliveryDays: alertModal.deliveryDays, rating: alertModal.rating, reviews: alertModal.reviews }}
          user={null}
          onClose={() => { setAlertModal(null); setHist([...getPriceHistory()]); }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
