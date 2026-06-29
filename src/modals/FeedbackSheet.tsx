import { useState } from "react";

interface FeedbackSheetProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const FeedbackSheet = ({ onClose, showToast }: FeedbackSheetProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText]         = useState("");

  const TYPES = [
    { id:"bug",     icon:"🐛", label:"오류 신고"  },
    { id:"suggest", icon:"💡", label:"기능 제안"  },
    { id:"price",   icon:"📊", label:"가격 오류"  },
    { id:"etc",     icon:"💬", label:"기타 문의"  },
  ];

  const submit = () => {
    if (!selected) { showToast("문의 유형을 선택해주세요"); return; }
    showToast("소중한 의견 감사합니다! 빠르게 검토할게요 🙏");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[600px] bg-white rounded-t-3xl px-5 pt-5 animate-slideUp"
           style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-base font-extrabold text-gray-900 mb-1">의견 보내기</p>
        <p className="text-xs text-gray-400 mb-4">불편한 점이나 좋은 아이디어를 알려주세요</p>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition border-2 ${selected === t.id ? "border-orange-400 bg-orange-50" : "border-transparent bg-[#F7F7F8]"}`}>
              <span className="text-xl">{t.icon}</span>
              <span className="text-[10px] font-bold text-gray-700">{t.label}</span>
            </button>
          ))}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="자세한 내용을 입력해주세요 (선택)"
          maxLength={500}
          className="w-full h-28 px-4 py-3 rounded-2xl bg-[#F7F7F8] text-sm text-gray-700 placeholder-gray-400 outline-none resize-none" />
        <p className="text-[10px] text-gray-400 text-right mt-1 mb-4">{text.length}/500</p>
        <a href="https://pf.kakao.com/_ARQxfX/friend" target="_blank" rel="noopener noreferrer"
           className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl mb-3"
           style={{ background:"#FEE500", color:"#181600" }}>
          <span className="text-lg">💬</span>
          <span className="text-sm font-bold">카카오톡으로 바로 문의하기</span>
        </a>
        <button onClick={submit}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white text-sm font-bold active:bg-orange-600 transition">
          제출하기
        </button>
      </div>
    </div>
  );
};
