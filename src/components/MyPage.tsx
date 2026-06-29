import { useState } from "react";
import type { User } from "../types";
import { getGuestId, getLocalAlerts, getLocalWishlist } from "../utils";

interface GuestMypageProps { onLogin: () => void; }

export const GuestMypage = ({ onLogin }: GuestMypageProps) => {
  const [guestId, setGuestId] = useState(getGuestId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(guestId);
  const localAlerts = getLocalAlerts();
  const localWish   = getLocalWishlist();

  const saveId = () => {
    const clean = draft.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
    if (!clean) return;
    try { localStorage.setItem("alitrack_guest_id", clean); } catch {}
    setGuestId(clean);
    setEditing(false);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="bg-[#F7F7F8] rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">👤</div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">나의 게스트 ID</p>
            {editing ? (
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && saveId()}
                className="text-base font-extrabold text-gray-900 bg-transparent outline-none border-b-2 border-blue-400 w-full" autoFocus />
            ) : (
              <p className="text-base font-extrabold text-gray-900">{guestId}</p>
            )}
          </div>
          <button onClick={() => { if (editing) saveId(); else { setDraft(guestId); setEditing(true); } }}
            className="text-xs text-blue-500 font-bold px-3 py-1.5 rounded-xl bg-blue-50 active:bg-blue-100">
            {editing ? "저장" : "변경"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400">이 기기에서만 유효 · 이메일 가입 시 데이터 이전 가능</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="text-xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">알림 신청</p>
            <p className="text-xs text-gray-400">{localAlerts.length > 0 ? `${localAlerts.length}개 상품 모니터링 중` : "아직 없어요"}</p>
          </div>
          <span className="text-sm font-extrabold text-orange-500">{localAlerts.length}</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="text-xl">❤️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">찜한 상품</p>
            <p className="text-xs text-gray-400">{localWish.length > 0 ? `${localWish.length}개 저장됨` : "아직 없어요"}</p>
          </div>
          <span className="text-sm font-extrabold text-orange-500">{localWish.length}</span>
        </div>
      </div>

      <div className="bg-[#EFF6FF] border border-blue-200 rounded-3xl p-5">
        <p className="text-sm font-extrabold text-gray-900 mb-1">📧 이메일로 가입하면</p>
        <p className="text-xs text-gray-500 mb-3">소중한 기록이 안전하게 보관돼요</p>
        <div className="space-y-1.5 mb-4">
          {["📈 가격기록 영구 보관","❤️ 관심상품 영구 저장","🔄 기기 변경 시 데이터 연동","📬 최저가 달성 시 이메일 알림"].map(t => (
            <p key={t} className="text-[12px] text-gray-700">{t}</p>
          ))}
        </div>
        <button onClick={onLogin}
          className="w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-blue-500 text-white active:bg-blue-600 transition">
          이메일로 가입하기 →
        </button>
      </div>
    </div>
  );
};

export const EmptyMypage = ({ onLogin }: GuestMypageProps) => <GuestMypage onLogin={onLogin} />;

interface LoggedInMypageProps { user: User; onLogout: () => void; }

export const LoggedInMypage = ({ user, onLogout }: LoggedInMypageProps) => {
  const email = user?.email || "";
  const nick  = (user as User & { nickname?: string })?.nickname || (email.split("@")[0] || "사용자");

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="bg-[#F7F7F8] rounded-3xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">📧</div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-gray-900 truncate">{nick}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600">
            📧 이메일 회원
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50">
        {[
          { icon:"❤️", label:"찜한 상품",  desc:"영구 저장됨" },
          { icon:"🔔", label:"가격 알림",  desc:"이메일로 최저가 알림 수신" },
          { icon:"📈", label:"가격기록",   desc:"영구 보관됨" },
          { icon:"🔄", label:"기기 연동",  desc:"어느 기기에서나 동일한 데이터" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-4 px-5 py-4">
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">활성</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout}
        className="w-full py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 active:bg-gray-50 transition">
        로그아웃
      </button>
    </div>
  );
};

interface NotifSettings { card: boolean; night: boolean; sensitivity: string; }
interface NotificationSettingsSheetProps { onClose: () => void; }

export const NotificationSettingsSheet = ({ onClose }: NotificationSettingsSheetProps) => {
  const load = (): NotifSettings => { try { return { card: true, night: false, sensitivity: "보통", ...JSON.parse(localStorage.getItem("alitrack_notif_settings") || "{}") }; } catch { return { card: true, night: false, sensitivity: "보통" }; } };
  const [s, setS] = useState<NotifSettings>(load);

  const save = (next: NotifSettings) => {
    setS(next);
    try { localStorage.setItem("alitrack_notif_settings", JSON.stringify(next)); } catch {}
  };
  const toggle = (key: keyof Pick<NotifSettings, "card" | "night">) => save({ ...s, [key]: !s[key] });

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-base font-extrabold text-gray-900 mb-4">알림 설정</p>
        <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden mb-4">
          {(["card", "night"] as const).map((key, idx, arr) => {
            const meta = key === "card"
              ? { label: "카드/쿠폰 알림", desc: "할인 카드·쿠폰 정보 알림" }
              : { label: "야간 알림", desc: "오후 10시 ~ 오전 8시 알림" };
            return (
              <div key={key} className={`flex items-center gap-4 px-4 py-4 ${idx < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{meta.label}</p>
                  <p className="text-xs text-gray-400">{meta.desc}</p>
                </div>
                <button onClick={() => toggle(key)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${s[key] ? "bg-blue-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${s[key] ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs font-bold text-gray-500 mb-2 px-1">가격 민감도</p>
        <div className="flex gap-2 mb-5">
          {[["낮음","1%"],["보통","5%"],["높음","10%"]].map(([l, v]) => (
            <button key={l} onClick={() => save({ ...s, sensitivity: l })}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition ${s.sensitivity === l ? "bg-blue-500 text-white" : "bg-[#F7F7F8] text-gray-500"}`}>
              {l}<br/><span className="text-xs font-normal">{v} 이상</span>
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm">
          저장하기
        </button>
      </div>
    </div>
  );
};
