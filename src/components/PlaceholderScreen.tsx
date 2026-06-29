import { IconBack } from "./ui/index";

interface PlaceholderScreenProps { title: string; onBack: () => void; }

export const PlaceholderScreen = ({ title, onBack }: PlaceholderScreenProps) => (
  <div className="min-h-screen bg-white flex flex-col">
    <header className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
      <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200 transition">
        <IconBack />
      </button>
      <h1 className="text-base font-bold text-gray-900">{title}</h1>
    </header>
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <span className="text-6xl">🚧</span>
      <p className="text-sm font-bold text-gray-700 text-center">준비 중입니다</p>
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        이 기능은 현재 개발 중이에요.<br />곧 만나볼 수 있어요!
      </p>
    </div>
  </div>
);
