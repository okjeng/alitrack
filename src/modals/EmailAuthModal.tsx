import { useState } from "react";
import type { User } from "../types";
import { API_BASE } from "../data/constants";

interface EmailAuthModalProps {
  onDismiss: () => void;
  onLoginSuccess: (user: User) => void;
}

export const EmailAuthModal = ({ onDismiss, onLoginSuccess }: EmailAuthModalProps) => {
  const [tab, setTab]      = useState("register");
  const [email, setEmail]  = useState("");
  const [pw, setPw]        = useState("");
  const [loading, setLoad] = useState(false);
  const [err, setErr]      = useState("");

  const submit = async () => {
    setErr("");
    if (!email.includes("@")) { setErr("올바른 이메일을 입력해주세요."); return; }
    if (pw.length < 8) { setErr("비밀번호는 8자 이상이어야 합니다."); return; }
    setLoad(true);
    try {
      const endpoint = tab === "register" ? "/api/auth/email/register" : "/api/auth/email/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.detail || "오류가 발생했습니다."); return; }
      try { sessionStorage.setItem("ali_token", data.token); } catch {}
      onLoginSuccess({ user_id: data.user_id || "", email: data.email, provider: "email", logged_in: true });
      onDismiss();
    } catch { setErr("네트워크 오류가 발생했습니다."); }
    finally { setLoad(false); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex bg-[#F7F7F8] rounded-2xl p-1 mb-5">
          {[["register","회원가입"],["login","로그인"]].map(([v,l]) => (
            <button key={v} onClick={() => { setTab(v); setErr(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${tab === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="bg-[#EFF6FF] rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-blue-700 mb-2">📧 이메일 가입 혜택</p>
          <div className="grid grid-cols-2 gap-y-1.5">
            {["📈 가격기록 영구 보관","❤️ 관심상품 영구 저장","🔔 최저가 알림 이메일 수신","🔄 기기 변경 시 데이터 연동"].map(b => (
              <p key={b} className="text-[11px] text-blue-800">{b}</p>
            ))}
          </div>
        </div>
        <div className="space-y-3 mb-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 transition"
            onKeyDown={e => e.key === "Enter" && submit()} />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="비밀번호 (8자 이상)"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 transition"
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && <p className="text-xs text-red-500 mb-3 px-1">{err}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm active:bg-blue-600 transition disabled:opacity-60">
          {loading ? "처리 중..." : (tab === "register" ? "이메일로 가입하기" : "로그인")}
        </button>
        <button onClick={onDismiss} className="w-full mt-3 py-2.5 text-xs text-gray-400">나중에 하기</button>
      </div>
    </div>
  );
};
