import { useState, useRef } from "react";
import type { Product, User } from "../types";
import { fmt, saveLocalAlert, trackEvent, getLocalAlerts, getGuestId } from "../utils";
import { API_BASE } from "../data/constants";

interface PushSub { endpoint: string; auth: string; p256dh: string; }

async function subscribePush(): Promise<PushSub | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-public`);
    if (!res.ok) return null;
    const { public_key } = await res.json();
    const reg  = await navigator.serviceWorker.ready;
    const sub  = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: public_key });
    const authKey = sub.getKey("auth");
    const p256dhKey = sub.getKey("p256dh");
    if (!authKey || !p256dhKey) return null;
    const auth   = btoa(String.fromCharCode(...new Uint8Array(authKey)));
    const p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhKey)));
    return { endpoint: sub.toJSON().endpoint!, auth, p256dh };
  } catch { return null; }
}

interface AlertModalProps {
  product: Product;
  user: User | null;
  onClose: () => void;
  showToast: (msg: string) => void;
  showLogin?: () => void;
}

export const AlertModal = ({ product, user: _user, onClose, showToast }: AlertModalProps) => {
  const [step, setStep]               = useState("price");
  const [target, setTarget]           = useState(String(Math.round((product?.price || 0) * 0.9)));
  const [loading, setLoad]            = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const curPrice    = product?.price || 0;
  const targetPrice = useRef(0);

  const goToPush = () => {
    const price = parseInt(target.replace(/[^0-9]/g, ""), 10);
    if (!price || price <= 0) { showToast("올바른 가격을 입력해주세요."); return; }
    targetPrice.current = price;
    saveLocalAlert({
      product_id: product.id, product_name: product.name, image: product.image,
      target_price: price, current_price: curPrice, saved_at: new Date().toISOString(),
    });
    trackEvent("alert_set", { product_id: product.id, product_name: product.name, target_price: price, current_price: curPrice });
    setStep("push");
  };

  const requestPush = async () => {
    setLoad(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPushGranted(false); setStep("done"); return; }
      const sub = await subscribePush();
      if (sub) {
        await fetch(`${API_BASE}/api/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint, auth: sub.auth, p256dh: sub.p256dh,
            product_id: String(product.id), target_price: targetPrice.current, guest_id: getGuestId(),
          }),
        });
        const cur = getLocalAlerts().find(a => a.product_id === String(product.id));
        if (cur) saveLocalAlert({ ...cur, push_endpoint: sub.endpoint });
        setPushGranted(true);
      }
    } catch { /* 권한 거부 등 무시 */ }
    finally { setLoad(false); }
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        {step === "price" && (
          <>
            <p className="text-lg font-extrabold text-gray-900 mb-1">최저가 알림 신청 🔔</p>
            <p className="text-xs text-gray-400 mb-4">목표 가격 도달 시 브라우저로 바로 알려드려요</p>
            <div className="bg-[#F7F7F8] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">현재 가격</span>
              <span className="text-base font-extrabold text-gray-900">{fmt(curPrice)}</span>
            </div>
            <p className="text-xs font-bold text-gray-700 mb-2">목표 가격</p>
            <div className="flex items-center border-2 border-orange-400 rounded-2xl px-4 mb-1 bg-white">
              <input type="number" value={target} onChange={e => setTarget(e.target.value)}
                className="flex-1 py-3.5 text-xl font-bold outline-none bg-transparent"
                onKeyDown={e => e.key === "Enter" && goToPush()} />
              <span className="text-sm text-gray-400 font-bold ml-1">원</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-5">현재보다 낮게 설정하세요 (예: {fmt(Math.round(curPrice * 0.9))})</p>
            <button onClick={goToPush}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
              다음
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">가입 없이 바로 신청 가능</p>
          </>
        )}

        {step === "push" && (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">🔔</div>
              <p className="text-lg font-extrabold text-gray-900">브라우저 알림 허용</p>
              <p className="text-xs text-gray-400 mt-1">
                목표가 <span className="text-orange-500 font-bold">{fmt(targetPrice.current)}</span> 도달 시 바로 알려드려요
              </p>
            </div>
            <div className="bg-[#FFF7ED] rounded-2xl p-4 mb-5 space-y-2">
              {["📱 앱 설치 없이 브라우저 알림","🔕 언제든 설정에서 알림 끄기 가능","✅ iPhone·갤럭시·PC 모두 지원"].map(t => (
                <p key={t} className="text-xs text-gray-700">{t}</p>
              ))}
            </div>
            <button onClick={requestPush} disabled={loading}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition disabled:opacity-60 mb-2">
              {loading ? "처리 중..." : "알림 허용하기"}
            </button>
            <button onClick={() => setStep("done")}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-400 bg-gray-50 active:bg-gray-100 transition">
              나중에 허용
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">
                {pushGranted ? "🔔" : "✅"}
              </div>
              <p className="text-lg font-extrabold text-gray-900">
                {pushGranted ? "알림이 설정됐어요!" : "알림이 등록됐어요!"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {pushGranted
                  ? `목표가 ${fmt(targetPrice.current)} 도달 시 브라우저로 알림을 드려요`
                  : "이 기기의 가격기록에 저장했어요"}
              </p>
            </div>
            <button onClick={onClose}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
};
