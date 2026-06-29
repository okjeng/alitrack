import { useState } from "react";
import { getLocalWishlist, fmt } from "../utils.js";
import { NotificationSettingsSheet } from "../components/MyPage.jsx";

export const MoreScreen = ({ onFeedback, onPrivacy, onTerms, onHowTo, user, onLogin, onLogout, showToast, onInstall, isStandalone }) => {
  const [showNotif, setShowNotif]     = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const savings = getLocalWishlist().reduce((acc, p) => acc + ((p.orig || 0) - (p.price || 0)), 0);

  const clearCache = () => {
    try {
      const keep = ["alitrack_local_alerts","alitrack_wishlist","alitrack_guest_id","alitrack_onboarded","alitrack_cookie_consent","alitrack_notif_settings"];
      Object.keys(localStorage).filter(k => !keep.includes(k)).forEach(k => localStorage.removeItem(k));
    } catch {}
    showToast("캐시가 삭제됐어요");
  };

  return (
    <div className="pb-10">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <p className="text-base font-bold text-gray-900">더보기</p>
      </div>
      <div className="px-4 py-5 space-y-4">
        <div className="rounded-3xl p-5 text-white" style={{ background:"linear-gradient(135deg,#FF5A1F,#F59E0B)" }}>
          <p className="text-xs font-bold opacity-80 mb-1">나의 누적 절감액</p>
          <p className="text-3xl font-extrabold">{savings > 0 ? fmt(savings) : "0원"}</p>
          <p className="text-xs opacity-70 mt-1">알리트랙으로 절약한 금액이에요 🎉</p>
        </div>

        {user ? (
          <div className="bg-[#F7F7F8] rounded-2xl px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-blue-500 font-bold">이메일 회원</p>
            </div>
            <button onClick={onLogout} className="text-xs text-gray-400 font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200">로그아웃</button>
          </div>
        ) : (
          <button onClick={onLogin}
            className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2">
            📧 이메일로 가입하고 데이터 보관
          </button>
        )}

        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">서비스 설정</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            <button onClick={() => setShowNotif(true)}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <span className="text-lg">🔔</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">알림 설정</span>
              <span className="text-gray-400 text-xs">›</span>
            </button>
            {!isStandalone && (
              <button onClick={onInstall}
                className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-sm font-semibold text-gray-800">AliTrack 전용 앱 설치</span>
                  <span className="text-[10px] text-gray-400">홈 화면에 추가 · 앱처럼 빠르게 실행</span>
                </div>
                <span className="text-gray-400 text-xs">›</span>
              </button>
            )}
            <button onClick={clearCache}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-100 transition">
              <span className="text-lg">🗑️</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">앱 캐시 삭제</span>
              <span className="text-xs text-orange-500 font-bold">삭제</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">고객 지원</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            <button onClick={() => {
              if (window.ChannelIOBooted) { window.ChannelIO("openChat"); }
              else if (window.ChannelIO) {
                setTimeout(() => {
                  if (window.ChannelIOBooted) window.ChannelIO("openChat");
                  else showToast("채팅 연결 중이에요. 잠시 후 다시 눌러주세요.");
                }, 2000);
                showToast("채팅을 연결하는 중이에요...");
              } else { showToast("채팅 기능을 불러오는 중이에요. 잠시 후 다시 눌러주세요."); }
            }}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <span className="block text-sm font-semibold text-gray-800">1:1 AI 고객상담</span>
                <span className="text-[10px] text-gray-400">궁금한 점을 바로 물어보세요</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">AI</span>
            </button>
            <button onClick={() => setShowWithdraw(true)}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-100 transition">
              <span className="text-lg">🚪</span>
              <span className="flex-1 text-sm font-semibold text-gray-800 text-left">계정 탈퇴</span>
              <span className="text-gray-400 text-xs">›</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-4">
              <span className="text-lg">ℹ️</span>
              <span className="flex-1 text-sm font-semibold text-gray-800">현재 버전</span>
              <span className="text-xs text-gray-400 font-medium">v4.2.0</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 px-1 mb-2">앱 정보</p>
          <div className="bg-[#F7F7F8] rounded-2xl overflow-hidden">
            {[
              { icon:"📖", label:"사용법 가이드",    action: onHowTo  },
              { icon:"🔒", label:"개인정보처리방침", action: onPrivacy },
              { icon:"📄", label:"이용약관",         action: onTerms  },
            ].map((item,idx,arr) => (
              <button key={item.label} onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-4 active:bg-gray-100 transition ${idx < arr.length-1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-sm font-semibold text-gray-800 text-left">{item.label}</span>
                <span className="text-gray-400 text-xs">›</span>
              </button>
            ))}
            <p className="px-4 py-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100">
              본 서비스는 더 나은 기능을 위해 익명화된 분석 데이터를 사용합니다.
            </p>
          </div>
        </div>

        <div className="text-center py-3">
          <p className="text-xs text-gray-400">AliTrack v4.2.0 · © 2026 AliTrack</p>
          <p className="text-[10px] text-gray-300 mt-1">Made with ❤️ for Korean Ali Shoppers</p>
        </div>
      </div>

      {showNotif && <NotificationSettingsSheet onClose={() => setShowNotif(false)} />}

      {showWithdraw && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-6" onClick={() => setShowWithdraw(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-[340px]" onClick={e => e.stopPropagation()}>
            <p className="text-base font-extrabold text-gray-900 mb-2">정말 탈퇴하시겠어요?</p>
            <p className="text-xs text-gray-400 mb-5">탈퇴 시 모든 데이터가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowWithdraw(false)}
                className="flex-1 py-3 rounded-2xl bg-[#F7F7F8] text-sm font-bold text-gray-600">취소</button>
              <button onClick={() => { showToast("탈퇴 처리되었습니다."); setShowWithdraw(false); if (onLogout) onLogout(); }}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-sm font-bold text-white">탈퇴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
