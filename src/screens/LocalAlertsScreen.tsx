import { useState } from "react";
import { getLocalAlerts, removeLocalAlert, fmt } from "../utils";
import { API_BASE } from "../data/constants";
import { IconBack } from "../components/ui/index";
import { EmptyPriceHistory } from "../components/EmptyStates";

interface LocalAlertsScreenProps {
  onBack: () => void;
  onGoHome: () => void;
  showToast: (msg: string) => void;
}

export const LocalAlertsScreen = ({ onBack, onGoHome: _onGoHome, showToast }: LocalAlertsScreenProps) => {
  const [alerts, setAlerts] = useState(getLocalAlerts);

  const remove = (productId: string) => {
    const alert = getLocalAlerts().find(a => a.product_id === String(productId));
    removeLocalAlert(productId);
    setAlerts(getLocalAlerts());
    showToast("알림이 삭제됐어요");
    if (alert?.push_endpoint) {
      fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: String(productId), endpoint: alert.push_endpoint }),
      }).catch(() => {});
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기"
          className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
          <IconBack />
        </button>
        <p className="text-base font-bold text-gray-900">가격기록</p>
        {alerts.length > 0 && <span className="ml-auto text-xs text-orange-500 font-bold">{alerts.length}개 모니터링 중</span>}
      </div>

      {alerts.length === 0 ? (
        <EmptyPriceHistory />
      ) : (
        <div className="px-4 py-4 space-y-3">
          {alerts.map(a => (
            <div key={a.product_id} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">🔔</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{a.product_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  목표가 <span className="text-orange-500 font-extrabold">{fmt(a.target_price)}</span>
                  {a.current_price ? ` · 신청 시 ${fmt(a.current_price)}` : ""}
                </p>
                {a.saved_at && (
                  <p className="text-[10px] text-gray-300 mt-0.5">{new Date(a.saved_at).toLocaleDateString("ko-KR")} 신청</p>
                )}
              </div>
              <button onClick={() => remove(a.product_id)}
                className="text-gray-300 hover:text-red-400 transition px-2 py-1 text-lg">✕</button>
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
