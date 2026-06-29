import { useState, useEffect, useCallback, useRef } from "react";
import { mapProduct, trackEvent, getLocalAlerts } from "./utils.js";
import { API_BASE, NAV_H } from "./data/constants.js";

import { Toast } from "./components/ui/index.jsx";
import { OnboardingScreen } from "./components/OnboardingScreen.jsx";
import { CookieBanner } from "./components/CookieBanner.jsx";
import { FeedbackSheet } from "./modals/FeedbackSheet.jsx";
import { NotificationSettingsSheet } from "./components/MyPage.jsx";
import { EmailAuthModal } from "./modals/EmailAuthModal.jsx";
import { IosInstallGuide } from "./components/InstallGuides.jsx";
import { AndroidInstallGuide } from "./components/InstallGuides.jsx";
import { EmptyMypage, LoggedInMypage } from "./components/MyPage.jsx";

import { HomeScreen } from "./screens/HomeScreen.jsx";
import { CategoryFeedScreen } from "./screens/CategoryFeedScreen.jsx";
import { DetailScreen } from "./screens/DetailScreen.jsx";
import { PriceHistoryScreen } from "./screens/PriceHistoryScreen.jsx";
import { LocalWishlistScreen } from "./screens/LocalWishlistScreen.jsx";
import { MoreScreen } from "./screens/MoreScreen.jsx";
import { HowToUseScreen } from "./screens/HowToUseScreen.jsx";
import { PrivacyScreen } from "./screens/PrivacyScreen.jsx";
import { TermsScreen } from "./screens/TermsScreen.jsx";

export default function App() {
  const [screen, setScreen]       = useState("home");
  const [activeNav, setActiveNav] = useState("home");
  const [selProduct, setSelProduct] = useState(null);
  const [selCat, setSelCat]         = useState(null);
  const [loginModal, setLoginModal] = useState(null);
  const [user, setUser]             = useState(null);
  const [toast, setToast]           = useState({ msg:"", visible:false });
  const toastTimer      = useRef(null);
  const scrollPositions = useRef({});
  const mainRef         = useRef(null);

  // 딥링크: /p/{id} → 상품 상세
  useEffect(() => {
    const match = window.location.pathname.match(/^\/p\/(\d+)$/);
    if (!match) return;
    fetch(`${API_BASE}/api/ali/product/${match[1]}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.id) { setSelProduct(mapProduct(data)); setScreen("detail"); } })
      .catch(() => {});
    window.history.replaceState({}, "", "/");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("alitrack_onboarded"); } catch { return false; }
  });
  const [showCookie, setShowCookie] = useState(() => {
    try { return !localStorage.getItem("alitrack_cookie_consent"); } catch { return false; }
  });
  const [pwaInstallable, setPwaInstallable] = useState(() => !!window.__pwa);
  const [showIosGuide, setShowIosGuide]         = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const isSamsung    = /SamsungBrowser/i.test(navigator.userAgent);
  const isAndroid    = /Android/i.test(navigator.userAgent);
  const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || !!window.navigator.standalone;
  const [installBannerDismissed, setInstallBannerDismissed] = useState(
    () => localStorage.getItem("alitrack_install_dismissed") === "1"
  );
  const showInstallMenu   = !isStandalone && (pwaInstallable || isIOS || isAndroid);
  const showInstallBanner = showInstallMenu && !installBannerDismissed;

  useEffect(() => {
    const onInstallable = () => setPwaInstallable(true);
    const onInstalled   = () => setPwaInstallable(false);
    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("pwa-installed",   onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("pwa-installed",   onInstalled);
    };
  }, []);

  // 저장된 토큰으로 로그인 복원
  useEffect(() => {
    const stored = (() => { try { return sessionStorage.getItem("ali_token"); } catch { return null; } })();
    if (!stored) return;
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.logged_in) return;
        setUser(data);
        const localAlerts = getLocalAlerts();
        if (localAlerts.length > 0) {
          fetch(`${API_BASE}/api/alerts/merge-guest`, {
            method: "POST",
            headers: { Authorization: `Bearer ${stored}`, "Content-Type": "application/json" },
            body: JSON.stringify({ alerts: localAlerts }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.merged > 0) {
                showToast(`알림 ${d.merged}건이 계정에 통합됐어요 🎉`);
                localStorage.removeItem("alitrack_local_alerts");
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible:true });
    toastTimer.current = setTimeout(() => setToast(p => ({ ...p, visible:false })), 2200);
  }, []);

  const handleLogout = useCallback(() => {
    try { sessionStorage.removeItem("ali_token"); } catch {}
    setUser(null);
    showToast("로그아웃되었습니다.");
  }, [showToast]);

  const [showFeedback, setShowFeedback]           = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);

  const showLogin         = useCallback(() => setLoginModal(true), []);
  const handleLoginDismiss  = () => setLoginModal(null);
  const handleLoginSuccess  = useCallback((data) => {
    setUser({ user_id: data.user_id || "", email: data.email, provider: data.provider || "email", logged_in: true });
    showToast("이메일로 로그인 성공!");
  }, [showToast]);

  const saveScroll = useCallback(() => {
    if (mainRef.current) scrollPositions.current[screen] = mainRef.current.scrollTop;
  }, [screen]);

  const restoreScroll = useCallback((s) => {
    requestAnimationFrame(() => {
      if (mainRef.current && scrollPositions.current[s] != null)
        mainRef.current.scrollTop = scrollPositions.current[s];
    });
  }, []);

  const goTo = useCallback((s) => {
    saveScroll();
    window.history.pushState({ screen:s }, "");
    setScreen(s);
    requestAnimationFrame(() => { if (mainRef.current) mainRef.current.scrollTop = 0; });
  }, [saveScroll]);

  const goCategory = useCallback((cat) => { setSelCat(cat); goTo("feed"); setActiveNav("home"); }, [goTo]);
  const goProduct  = useCallback((p) => { setSelProduct(p); goTo("detail"); trackEvent("product_view", { product_id:p.id, product_name:p.name, price:p.price }); }, [goTo]);
  const goBack     = useCallback(() => window.history.back(), []);
  const goHome     = useCallback(() => { goTo("home"); setActiveNav("home"); }, [goTo]);

  const scrollToProducts = useCallback(() => {
    goHome();
    setTimeout(() => {
      const el = document.getElementById("hot-products-section");
      if (el && mainRef.current) mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior:"smooth" });
    }, 350);
  }, [goHome]);

  const handleNav = useCallback((id) => { setActiveNav(id); goTo(id); }, [goTo]);

  useEffect(() => {
    const onPop = () => setScreen(prev => {
      const next = ["detail","feed","privacy","terms","howto"].includes(prev)
        ? prev === "detail" ? (selCat ? "feed" : "home") : "home"
        : "home";
      restoreScroll(next);
      return next;
    });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [restoreScroll, selCat]);

  const handleCookieAccept = () => {
    try { localStorage.setItem("alitrack_cookie_consent", "all"); } catch {}
    setShowCookie(false);
    if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage:"granted" });
  };
  const handleCookieDecline = () => {
    try { localStorage.setItem("alitrack_cookie_consent", "essential"); } catch {}
    setShowCookie(false);
  };

  const handleOnboardingDone = () => {
    try { localStorage.setItem("alitrack_onboarded", "1"); } catch {}
    setShowOnboarding(false);
  };

  const handlePwaInstall = async () => {
    if (isStandalone) { showToast("이미 앱으로 설치되어 있어요 ✅"); return; }
    if (isIOS) { setShowIosGuide(true); return; }
    if (window.__pwa?.install) {
      const accepted = await window.__pwa.install();
      setPwaInstallable(false);
      showToast(accepted ? "앱 설치가 시작되었습니다 🎉" : "설치가 취소되었습니다");
      return;
    }
    setShowAndroidGuide(true);
  };

  const dismissInstallBanner = () => {
    localStorage.setItem("alitrack_install_dismissed", "1");
    setInstallBannerDismissed(true);
  };

  const NAV_ITEMS_FULL = [
    { id:"home",     icon:"🏠", label:"홈(핫딜)" },
    { id:"history",  icon:"📈", label:"가격기록" },
    { id:"wishlist", icon:"❤️", label:"찜한상품" },
    { id:"mypage",   icon:"👤", label:"나의기록" },
    { id:"more",     icon:"☰",  label:"더보기"   },
  ];

  const renderScreen = () => {
    switch (screen) {
      case "home":     return <HomeScreen onCategory={goCategory} onProduct={goProduct} showLogin={showLogin} showToast={showToast} onInstall={handlePwaInstall} showInstallBanner={showInstallBanner} onDismissInstall={dismissInstallBanner}/>;
      case "feed":     return selCat ? <CategoryFeedScreen cat={selCat} onBack={goBack} onProduct={goProduct}/> : null;
      case "detail":   return selProduct ? <DetailScreen product={selProduct} onBack={goBack} showLogin={showLogin} showToast={showToast} user={user}/> : null;
      case "history":  return <PriceHistoryScreen onBack={goBack} onScrollToProducts={scrollToProducts} onProduct={goProduct} showToast={showToast}/>;
      case "wishlist": return <LocalWishlistScreen onBack={goBack} onGoHome={goHome} onProduct={goProduct} showToast={showToast}/>;
      case "mypage":   return (
        <div>
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
            <button onClick={goBack} className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <p className="text-base font-bold text-gray-900">나의기록</p>
          </div>
          {user ? <LoggedInMypage user={user} onLogout={handleLogout}/> : <EmptyMypage onLogin={showLogin}/>}
        </div>
      );
      case "more":     return <MoreScreen onFeedback={() => setShowFeedback(true)} onPrivacy={() => goTo("privacy")} onTerms={() => goTo("terms")} onHowTo={() => goTo("howto")} user={user} onLogin={showLogin} onLogout={handleLogout} showToast={showToast} onInstall={handlePwaInstall} isStandalone={isStandalone}/>;
      case "howto":    return <HowToUseScreen onBack={goBack}/>;
      case "privacy":  return <PrivacyScreen onBack={goBack}/>;
      case "terms":    return <TermsScreen onBack={goBack}/>;
      default:         return <HomeScreen onCategory={goCategory} onProduct={goProduct} showLogin={showLogin} showToast={showToast}/>;
    }
  };

  return (
    <>
      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        .scrollbar-none::-webkit-scrollbar{display:none;}
        .scrollbar-none{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .animate-slideUp{animation:slideUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards;}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
        .animate-pulse{animation:pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .animate-spin{animation:spin 0.8s linear infinite;}
        .line-clamp-1{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      `}</style>

      {showOnboarding && <OnboardingScreen onDone={handleOnboardingDone}/>}

      <Toast msg={toast.msg} visible={toast.visible}/>

      <div className="min-h-screen bg-white flex justify-center"
           style={{ fontFamily:"'Pretendard','Apple SD Gothic Neo',system-ui,sans-serif" }}>
        <div className="w-full max-w-[600px] min-h-screen bg-white flex flex-col">

          <header className="sticky top-0 z-20 bg-white/96 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
            <button onClick={() => { goTo("home"); setActiveNav("home"); }} aria-label="AliTrack 홈으로 이동" className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">AliTrack</span>
              <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">BETA</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNotifSettings(true)} aria-label="알림 설정"
                className="w-8 h-8 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-sm active:bg-gray-200 transition">🔔</button>
              <button onClick={() => { if (user) { goTo("mypage"); setActiveNav("mypage"); } else showLogin(); }}
                aria-label={user ? "마이페이지" : "로그인"}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition ${user ? "bg-blue-50 active:bg-blue-100" : "bg-[#F7F7F8] active:bg-gray-200"}`}>👤</button>
            </div>
          </header>

          <main ref={mainRef}
                style={{ paddingBottom:`calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)`, overflowY:"auto", flex:1 }}>
            {renderScreen()}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
               style={{ background:"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)", paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
            <div className="w-full max-w-[600px] flex border-t border-gray-100">
              {NAV_ITEMS_FULL.map(n => (
                <button key={n.id} onClick={() => handleNav(n.id)}
                  aria-label={n.label}
                  aria-current={activeNav === n.id ? "page" : undefined}
                  className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${activeNav === n.id ? "text-orange-500" : "text-gray-400"}`}>
                  <span className="text-xl leading-none">{n.icon}</span>
                  <span className="text-[10px] font-semibold">{n.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {showCookie && <CookieBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline}/>}
      {showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} showToast={showToast}/>}
      {showNotifSettings && <NotificationSettingsSheet onClose={() => setShowNotifSettings(false)}/>}
      {showIosGuide && <IosInstallGuide onClose={() => setShowIosGuide(false)}/>}
      {showAndroidGuide && <AndroidInstallGuide onClose={() => setShowAndroidGuide(false)} isSamsung={isSamsung}/>}
      {loginModal && <EmailAuthModal onDismiss={handleLoginDismiss} onLoginSuccess={handleLoginSuccess}/>}
    </>
  );
}
