import { NAV_H } from "../data/constants";

interface CookieBannerProps { onAccept: () => void; onDecline: () => void; }

export const CookieBanner = ({ onAccept, onDecline }: CookieBannerProps) => (
  <div className="fixed left-0 right-0 z-[200] px-4 pb-2 flex justify-center"
       style={{ bottom: `calc(env(safe-area-inset-bottom,0px) + ${NAV_H}px)` }}>
    <div className="w-full max-w-[580px] bg-gray-900 rounded-3xl px-5 py-4 shadow-2xl">
      <p className="text-xs font-bold text-white mb-1">🍪 쿠키 및 개인정보 사용 동의</p>
      <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
        더 나은 쇼핑 경험을 위해 쿠키와 분석 도구를 사용합니다.
        상품 추천·가격 알림 등 핵심 기능에 활용되며 제3자와 공유하지 않습니다.
      </p>
      <div className="flex gap-2">
        <button onClick={onDecline}
          className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-gray-300 bg-gray-800 active:bg-gray-700 transition">
          거부
        </button>
        <button onClick={onAccept}
          className="flex-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-orange-500 active:bg-orange-600 transition">
          모두 동의
        </button>
      </div>
    </div>
  </div>
);
