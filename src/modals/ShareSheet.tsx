import type { Product } from "../types";
import { copyToClipboard } from "../utils";

interface ShareSheetProps {
  product: Product;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ShareSheet = ({ product, onClose, showToast }: ShareSheetProps) => {
  const url = `https://alitrack.kr/p/${product.id}`;

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `[AliTrack] ${product.name}`, url });
        showToast("공유되었어요!");
      } catch (e) {
        if ((e as Error).name !== "AbortError") showToast("공유에 실패했어요.");
      }
    } else {
      await copyToClipboard(url);
      showToast("링크가 복사되었습니다!");
    }
    onClose();
  };

  const copy = async () => {
    try { await copyToClipboard(url); showToast("링크가 복사되었습니다!"); }
    catch { showToast("복사 실패. 다시 시도해주세요."); }
    onClose();
  };

  const actions = [
    { label:"카카오·SNS 공유하기", icon:"💬", action: shareNative },
    { label:"링크 복사하기",        icon:"🔗", action: copy },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-6 pt-5 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-sm font-bold text-gray-900 mb-4">공유하기</p>
        {actions.map(i => (
          <button key={i.label} onClick={i.action}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition text-sm font-semibold text-gray-800 mb-2">
            <span className="text-xl">{i.icon}</span>{i.label}
          </button>
        ))}
      </div>
    </div>
  );
};
