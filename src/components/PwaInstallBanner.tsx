interface PwaInstallBannerProps { onInstall: () => void; onDismiss: () => void; }

export const PwaInstallBanner = ({ onInstall, onDismiss }: PwaInstallBannerProps) => (
  <div className="mx-4 mb-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
    <span className="text-2xl flex-shrink-0">📲</span>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-orange-800">앱으로 설치하세요!</p>
      <p className="text-[10px] text-orange-600">홈 화면에 추가하면 더 빠르게 이용할 수 있어요</p>
    </div>
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <button onClick={onInstall}
        className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-[10px] font-bold active:bg-orange-600 transition">
        설치
      </button>
      <button onClick={onDismiss}
        className="px-3 py-1.5 rounded-xl bg-orange-100 text-orange-600 text-[10px] font-bold active:bg-orange-200 transition">
        닫기
      </button>
    </div>
  </div>
);
