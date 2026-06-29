import { useState } from "react";
import { ONBOARDING_SLIDES } from "../data/constants";

interface OnboardingScreenProps { onDone: () => void; }

export const OnboardingScreen = ({ onDone }: OnboardingScreenProps) => {
  const [idx, setIdx] = useState(0);
  const slide = ONBOARDING_SLIDES[idx];
  const isLast = idx === ONBOARDING_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center px-8"
         style={{ background: slide.bg, transition: "background 0.4s" }}>
      <div className="w-full max-w-[360px] flex flex-col items-center text-center">
        <div className="text-8xl mb-8 transition-transform duration-300" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.1))" }}>
          {slide.emoji}
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3 whitespace-pre-line leading-tight">
          {slide.title}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line mb-10">
          {slide.desc}
        </p>
        <div className="flex gap-1.5 mb-10">
          {ONBOARDING_SLIDES.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
                 style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? slide.accent : "#D1D5DB" }} />
          ))}
        </div>
        <button onClick={() => isLast ? onDone() : setIdx(i => i + 1)}
          className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-lg active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg,${slide.accent},${slide.accent}cc)` }}>
          {isLast ? "시작하기 🚀" : "다음 →"}
        </button>
        {!isLast && (
          <button onClick={onDone} className="mt-4 text-xs text-gray-400 underline active:text-gray-600">
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
};
