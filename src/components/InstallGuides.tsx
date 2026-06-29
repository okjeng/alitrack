import { useState } from "react";

interface AndroidInstallGuideProps { onClose: () => void; isSamsung?: boolean; }

export const AndroidInstallGuide = ({ onClose, isSamsung }: AndroidInstallGuideProps) => {
  const [tab, setTab] = useState(isSamsung ? "samsung" : "chrome");

  const CHROME_STEPS = [
    { n:1, icon:"⋮",  text:"주소창 오른쪽 끝 ⋮ 메뉴를 탭해요" },
    { n:2, icon:"＋", text:"'홈 화면에 추가' 또는 '앱 설치'를 탭해요" },
    { n:3, icon:"✓",  text:"'설치' 또는 '추가'를 눌러 완료해요" },
  ];
  const SAMSUNG_STEPS = [
    { n:1, icon:"≡",  text:"화면 하단 메뉴(≡)를 탭해요" },
    { n:2, icon:"＋", text:"'페이지 추가' → '홈 화면'을 탭해요" },
    { n:3, icon:"✓",  text:"오른쪽 상단 '추가'를 탭하면 완료!" },
  ];
  const steps = tab === "samsung" ? SAMSUNG_STEPS : CHROME_STEPS;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3 text-3xl">📲</div>
          <p className="text-lg font-extrabold text-gray-900">AliTrack 홈 화면에 추가</p>
          <p className="text-xs text-gray-400 mt-1">앱처럼 빠르게 실행할 수 있어요</p>
        </div>
        <div className="flex gap-2 mb-4 bg-[#F7F7F8] p-1 rounded-2xl">
          {[{id:"chrome",label:"Chrome"},{id:"samsung",label:"삼성 인터넷"}].map(b => (
            <button key={b.id} onClick={() => setTab(b.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${tab === b.id ? "bg-white text-orange-500 shadow-sm" : "text-gray-400"}`}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="space-y-3 mb-5">
          {steps.map(({ n, icon, text }) => (
            <div key={n} className="flex items-center gap-4 bg-[#F7F7F8] rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-base font-extrabold flex-shrink-0">{n}</div>
              <div>
                <p className="text-sm font-bold text-orange-500 mb-0.5">{icon}</p>
                <p className="text-sm font-semibold text-gray-800">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`rounded-2xl px-4 py-3 mb-5 ${tab === "samsung" ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className={`text-xs text-center ${tab === "samsung" ? "text-blue-700" : "text-orange-700"}`}>
            💡 {tab === "samsung" ? "삼성 인터넷 브라우저 기준이에요" : "Chrome 브라우저 기준이에요"}
          </p>
        </div>
        <button onClick={onClose}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
          확인
        </button>
      </div>
    </div>
  );
};

interface IosInstallGuideProps { onClose: () => void; }

export const IosInstallGuide = ({ onClose }: IosInstallGuideProps) => (
  <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
    <div className="absolute inset-0 bg-black/50" />
    <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-6 animate-slideUp"
         style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}
         onClick={e => e.stopPropagation()}>
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <circle cx="12" cy="17" r="1" fill="#FF5A1F"/>
          </svg>
        </div>
        <p className="text-lg font-extrabold text-gray-900">AliTrack 앱 설치</p>
        <p className="text-xs text-gray-400 mt-1">Safari에서 홈 화면에 추가하세요</p>
      </div>
      <div className="space-y-3 mb-6">
        {[
          { n:1, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, text:"화면 하단의 공유 버튼을 탭해요" },
          { n:2, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, text:"'홈 화면에 추가'를 선택해요" },
          { n:3, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, text:"오른쪽 상단 '추가'를 탭하면 완료!" },
        ].map(({ n, icon, text }) => (
          <div key={n} className="flex items-center gap-4 bg-[#F7F7F8] rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">{n}</div>
            <div className="text-gray-500 flex-shrink-0">{icon}</div>
            <p className="text-sm font-semibold text-gray-800">{text}</p>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 rounded-2xl px-4 py-3 mb-5">
        <p className="text-xs text-orange-700 text-center">💡 Safari 브라우저에서만 홈 화면 추가가 가능해요</p>
      </div>
      <button onClick={onClose}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm active:bg-orange-600 transition">
        확인
      </button>
    </div>
  </div>
);
