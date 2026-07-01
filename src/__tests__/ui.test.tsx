import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── 전역 mock ────────────────────────────────────────────────────
// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: localStorageMock });

// IntersectionObserver mock (무한 스크롤)
const observeMock = vi.fn();
const disconnectMock = vi.fn();
window.IntersectionObserver = vi.fn(() => ({
  observe: observeMock,
  disconnect: disconnectMock,
  unobserve: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: () => [],
})) as unknown as typeof IntersectionObserver;

// fetch mock (API 호출 차단)
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ products: [] }),
} as Response);

// ─── Toast ────────────────────────────────────────────────────────
import { Toast } from "../components/ui/index";

describe("Toast", () => {
  it("visible=true 이면 메시지가 보인다", () => {
    render(<Toast msg="복사 완료!" visible={true} />);
    expect(screen.getByText(/복사 완료!/)).toBeInTheDocument();
  });

  it("visible=false 이면 pointer-events-none 클래스가 있다", () => {
    const { container } = render(<Toast msg="테스트" visible={false} />);
    expect(container.firstChild).toHaveClass("pointer-events-none");
  });
});

// ─── SkeletonCard ─────────────────────────────────────────────────
import { SkeletonCard, LegalFooter } from "../components/ui/index";

describe("SkeletonCard", () => {
  it("animate-pulse 클래스를 가진다", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });
});

// ─── LegalFooter ─────────────────────────────────────────────────
describe("LegalFooter", () => {
  it("© 2026 AliTrack 문구를 렌더링한다", () => {
    render(<LegalFooter />);
    expect(screen.getByText(/© 2026 AliTrack/)).toBeInTheDocument();
  });
});

// ─── ProductCard ─────────────────────────────────────────────────
import { ProductCard } from "../components/ProductCard";

const mockProduct = {
  id: "p0001",
  name: "Xiaomi 레드미 노트",
  shortName: "레드미 노트",
  price: 189000,
  orig: 250000,
  discount: 24,
  image: "https://placehold.co/320x320/EEF2FF/6366F1?text=📱",
  tag: "핫딜",
  deliveryDays: 5,
  rating: 4.8,
  reviews: 1234,
};

describe("ProductCard", () => {
  it("상품명을 렌더링한다", () => {
    render(<ProductCard product={mockProduct} onProduct={vi.fn()} />);
    expect(screen.getByText(/Xiaomi 레드미 노트/)).toBeInTheDocument();
  });

  it("가격을 원화 포맷으로 렌더링한다", () => {
    render(<ProductCard product={mockProduct} onProduct={vi.fn()} />);
    expect(screen.getByText("189,000원")).toBeInTheDocument();
  });

  it("할인율을 표시한다", () => {
    render(<ProductCard product={mockProduct} onProduct={vi.fn()} />);
    expect(screen.getByText(/24%/)).toBeInTheDocument();
  });

  it("클릭하면 onProduct 콜백이 호출된다", async () => {
    const onProduct = vi.fn();
    render(<ProductCard product={mockProduct} onProduct={onProduct} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onProduct).toHaveBeenCalledWith(mockProduct);
  });

  it("신뢰할 수 없는 배송일 문구는 표시하지 않는다", () => {
    render(<ProductCard product={mockProduct} onProduct={vi.fn()} />);
    expect(screen.queryByText(/일 내 도착/)).not.toBeInTheDocument();
  });
});

// ─── PlaceholderScreen ───────────────────────────────────────────
import { PlaceholderScreen } from "../components/PlaceholderScreen";

describe("PlaceholderScreen", () => {
  it("title을 h1에 렌더링한다", () => {
    render(<PlaceholderScreen title="테스트 화면" onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "테스트 화면" })).toBeInTheDocument();
  });

  it("준비 중 고정 문구를 렌더링한다", () => {
    render(<PlaceholderScreen title="준비 중" onBack={vi.fn()} />);
    expect(screen.getByText("준비 중입니다")).toBeInTheDocument();
  });

  it("뒤로가기 버튼 클릭 시 onBack이 호출된다", async () => {
    const onBack = vi.fn();
    render(<PlaceholderScreen title="준비 중" onBack={onBack} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onBack).toHaveBeenCalled();
  });
});

// ─── CookieBanner ────────────────────────────────────────────────
import { CookieBanner } from "../components/CookieBanner";

describe("CookieBanner", () => {
  it("모두 동의 / 거부 버튼이 렌더링된다", () => {
    render(<CookieBanner onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText("모두 동의")).toBeInTheDocument();
    expect(screen.getByText("거부")).toBeInTheDocument();
  });

  it("모두 동의 버튼 클릭 시 onAccept가 호출된다", async () => {
    const onAccept = vi.fn();
    render(<CookieBanner onAccept={onAccept} onDecline={vi.fn()} />);
    await userEvent.click(screen.getByText("모두 동의"));
    expect(onAccept).toHaveBeenCalled();
  });

  it("거부 버튼 클릭 시 onDecline이 호출된다", async () => {
    const onDecline = vi.fn();
    render(<CookieBanner onAccept={vi.fn()} onDecline={onDecline} />);
    await userEvent.click(screen.getByText("거부"));
    expect(onDecline).toHaveBeenCalled();
  });
});

// ─── EmptyStates ─────────────────────────────────────────────────
import { EmptyWishlist, EmptyPriceHistory } from "../components/EmptyStates";

describe("EmptyWishlist", () => {
  it("찜한 상품이 없어요 문구를 렌더링한다", () => {
    render(<EmptyWishlist />);
    expect(screen.getByText("찜한 상품이 없어요")).toBeInTheDocument();
  });

  it("안내 문구를 렌더링한다", () => {
    render(<EmptyWishlist />);
    expect(screen.getByText(/관심 있는 상품을 찜해두면/)).toBeInTheDocument();
  });
});

describe("EmptyPriceHistory", () => {
  it("조회한 상품이 없어요 문구를 렌더링한다", () => {
    render(<EmptyPriceHistory />);
    expect(screen.getByText("조회한 상품이 없어요")).toBeInTheDocument();
  });

  it("안내 문구를 렌더링한다", () => {
    render(<EmptyPriceHistory />);
    expect(screen.getByText(/자동으로 기록이 저장/)).toBeInTheDocument();
  });
});

// ─── ShareSheet ──────────────────────────────────────────────────
import { ShareSheet } from "../modals/ShareSheet";

describe("ShareSheet", () => {
  it("공유하기 제목이 렌더링된다", () => {
    render(<ShareSheet product={mockProduct} onClose={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByText("공유하기")).toBeInTheDocument();
  });

  it("카카오·SNS 공유하기 버튼이 존재한다", () => {
    render(<ShareSheet product={mockProduct} onClose={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByText(/카카오/)).toBeInTheDocument();
  });

  it("링크 복사하기 버튼이 존재한다", () => {
    render(<ShareSheet product={mockProduct} onClose={vi.fn()} showToast={vi.fn()} />);
    expect(screen.getByText(/링크 복사/)).toBeInTheDocument();
  });
});

// ─── InfiniteProductGrid — 에러 UI ────────────────────────────────
import { InfiniteProductGrid } from "../components/InfiniteProductGrid";

describe("InfiniteProductGrid", () => {
  beforeEach(() => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network Error"));
  });

  it("API 실패 시 오류 메시지와 재시도 버튼을 렌더링한다", async () => {
    render(<InfiniteProductGrid onProduct={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/상품을 불러오지 못했습니다/)).toBeInTheDocument();
      expect(screen.getByText("다시 시도")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("재시도 버튼 클릭 시 fetch가 다시 호출된다", async () => {
    render(<InfiniteProductGrid onProduct={vi.fn()} />);
    await waitFor(() => screen.getByText("다시 시도"), { timeout: 3000 });
    const retryCount = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.click(screen.getByText("다시 시도"));
    await waitFor(() => {
      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(retryCount);
    }, { timeout: 3000 });
  });
});
