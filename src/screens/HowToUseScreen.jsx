import { IconBack } from "../components/ui/index.jsx";

export const HowToUseScreen = ({ onBack }) => {
  const steps = [
    {
      num:1, tag:"첫 만남", color:"orange",
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      title:"가입 없이 바로 시작해요",
      desc:"회원가입? 로그인? 필요 없어요. AliTrack은 처음 접속하는 순간부터 당신의 쇼핑 비서가 됩니다.",
      action:"접속하면", result:"바로 쇼핑 시작",
      tip:"이메일 가입 시 기기를 바꿔도 데이터가 유지돼요",
    },
    {
      num:2, tag:"상품 탐색", color:"blue",
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
      title:"키워드 하나면 세상의 가격이 열려요",
      desc:"찾고 싶은 상품 키워드를 검색창에 입력하세요. 할인율·가격·리뷰까지 한눈에 정렬해 드려요.",
      action:"키워드 입력 →", result:"최저가 상품 목록",
      tip:"카테고리 버튼으로 분야별 핫딜을 빠르게 찾아요",
    },
    {
      num:3, tag:"가격 기록", color:"purple",
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      title:"구경만 해도 기록이 쌓여요",
      desc:"상세 페이지를 열면 AliTrack이 자동으로 그 상품을 기억해둬요. 나중에 가격 기록 탭에서 다시 볼 수 있어요.",
      action:"상세 페이지 방문 →", result:"자동 가격 기록 저장",
      tip:"역대 최저가 대비 현재 가격을 그래프로 확인하세요",
    },
    {
      num:4, tag:"가격 알림", color:"amber",
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      title:"목표가를 설정하면, 우리가 대신 지켜봐요",
      desc:"원하는 가격을 정해두면 도달하는 순간 브라우저로 바로 알려드려요. 앱 설치 없이도 24시간 작동해요.",
      action:"🔔 알림 설정 →", result:"목표가 달성 시 즉시 알림",
      tip:"가격 기록 탭의 벨 아이콘으로도 알림을 관리해요",
    },
    {
      num:5, tag:"앱 설치", color:"emerald",
      icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3"/></svg>,
      title:"홈 화면에 추가하면 진짜 앱이 돼요",
      desc:"더보기 탭에서 'AliTrack 전용 앱 설치'를 누르면 스마트폰 홈 화면에 바로 추가돼요. 앱스토어 없이도 앱처럼 실행!",
      action:"더보기 → 앱 설치 →", result:"앱처럼 즉시 실행",
      tip:"iOS라면 사파리 하단 공유 버튼 → 홈 화면에 추가",
    },
  ];

  const tips = [
    { icon:"📊", badge:"가격 분석",  badgeColor:"blue",    title:"가격의 파도를 읽어요",         desc:"상세 페이지의 가격 그래프는 단순한 숫자가 아니에요. '역대 최저가 기준선'과 지금 가격을 비교해 지금이 구매 골든타임인지 확인하세요." },
    { icon:"⏰", badge:"타이밍 전략", badgeColor:"purple",  title:"타이밍이 곧 절약이에요",        desc:"가격 기록 탭에서 역대 최저가에 가장 근접한 상품이 맨 위에 정렬돼요. '지금이 기회'인 상품을 한눈에 파악하세요." },
    { icon:"⚖️", badge:"현명한 선택", badgeColor:"emerald", title:"직구 vs 국내 배송, 이제 비교해요", desc:"알리익스프레스의 가격과 배송 기간을 미리 파악하고, 쿠팡의 빠른 배송과 비교해 무엇이 최선인지 직접 결정하세요." },
  ];

  const colorMap = {
    orange:  { bg:"bg-orange-50",  ring:"ring-orange-100",  badge:"bg-orange-100 text-orange-600",   pill:"bg-orange-500",  text:"text-orange-500"  },
    blue:    { bg:"bg-blue-50",    ring:"ring-blue-100",    badge:"bg-blue-100 text-blue-600",        pill:"bg-blue-500",    text:"text-blue-500"    },
    purple:  { bg:"bg-purple-50",  ring:"ring-purple-100",  badge:"bg-purple-100 text-purple-600",   pill:"bg-purple-500",  text:"text-purple-500"  },
    amber:   { bg:"bg-amber-50",   ring:"ring-amber-100",   badge:"bg-amber-100 text-amber-600",     pill:"bg-amber-500",   text:"text-amber-500"   },
    emerald: { bg:"bg-emerald-50", ring:"ring-emerald-100", badge:"bg-emerald-100 text-emerald-600", pill:"bg-emerald-500", text:"text-emerald-500" },
  };
  const tipColor = { blue:"bg-blue-100 text-blue-600", purple:"bg-purple-100 text-purple-600", emerald:"bg-emerald-100 text-emerald-600" };

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} aria-label="뒤로 가기"
          className="w-9 h-9 rounded-xl bg-[#F7F7F8] flex items-center justify-center text-gray-700 active:bg-gray-200 transition flex-shrink-0">
          <IconBack />
        </button>
        <p className="text-base font-bold text-gray-900">사용법 가이드</p>
      </div>

      <div className="px-4 pb-10">
        <div className="mt-5 mb-6 bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl px-5 py-6 text-white shadow-lg shadow-orange-200">
          <p className="text-[11px] font-bold opacity-80 tracking-widest mb-2">SMART SHOPPING GUIDE</p>
          <p className="text-xl font-extrabold leading-tight mb-1">똑똑한 쇼핑의 시작,</p>
          <p className="text-xl font-extrabold leading-tight mb-4">AliTrack과 함께해요</p>
          <p className="text-xs opacity-85 leading-relaxed">가입 없이 시작하고, 가격을 기억하고,<br/>목표가에 도달하면 바로 알림을 받아요.</p>
          <div className="flex gap-2 mt-4">
            {["무료","가입 불필요","실시간 알림"].map(t => (
              <span key={t} className="text-[10px] font-bold bg-white/20 rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1 h-4 bg-orange-500 rounded-full" />
            <p className="text-sm font-extrabold text-gray-900">쇼핑의 시작, AliTrack 기초 가이드</p>
          </div>
          <div className="space-y-3">
            {steps.map(s => {
              const c = colorMap[s.color];
              return (
                <div key={s.num} className={`bg-white rounded-3xl p-5 shadow-sm ring-1 ${c.ring}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${c.pill} text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0`}>{s.num}</div>
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${c.badge}`}>{s.tag}</span>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                  </div>
                  <p className="text-base font-extrabold text-gray-900 leading-snug mb-1.5">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex items-center gap-2 bg-[#F7F7F8] rounded-2xl px-4 py-3 mb-3">
                    <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{s.action}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span className={`text-xs font-extrabold flex-1 ${c.text}`}>{s.result}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-extrabold text-orange-500 flex-shrink-0 mt-0.5">TIP</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{s.tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 my-6 px-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400 tracking-widest">LEVEL UP</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 px-1 mb-3">
            <div className="w-1 h-4 bg-purple-500 rounded-full" />
            <p className="text-sm font-extrabold text-gray-900">💡 더 똑똑하게 쇼핑하는 법</p>
          </div>
          <div className="space-y-3">
            {tips.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold rounded-full px-2.5 py-1 ${tipColor[t.badgeColor]}`}>{t.badge}</span>
                    </div>
                    <p className="text-sm font-extrabold text-gray-900 leading-snug mb-1.5">{t.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-3xl px-5 py-6 text-white text-center">
          <p className="text-2xl mb-2">🛒</p>
          <p className="text-base font-extrabold mb-1">이제 당신도 가격 고수</p>
          <p className="text-xs opacity-70 leading-relaxed">충동구매는 이제 그만, AliTrack과 함께<br/>기다리고, 비교하고, 최저가에 구매하세요.</p>
          <div className="mt-4 h-px bg-white/10" />
          <p className="text-[10px] opacity-50 mt-3">AliTrack · 알리익스프레스 가격 추적 서비스</p>
        </div>
      </div>
    </div>
  );
};
