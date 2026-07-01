import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface UseInfiniteCarouselOptions {
  itemCount: number;
  cloneCount?: number;
}

interface UseInfiniteCarouselResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cloneBefore: number[]; // 원본 배열 인덱스 (뒤쪽 n개를 앞에 복제)
  cloneAfter: number[];  // 원본 배열 인덱스 (앞쪽 n개를 뒤에 복제)
  isDragging: boolean;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    onClickCapture: (e: React.MouseEvent) => void;
  };
}

const DRAG_CLICK_THRESHOLD = 5; // 이 픽셀 이상 움직였으면 "드래그"로 간주, 이후 클릭은 억제

// 가로 스크롤 목록을 무한 루프처럼 보이게 만드는 훅
// 원리: 실제 아이템 앞뒤에 cloneCount개씩 복제본을 붙여 렌더링하고,
// 스크롤이 복제 영역으로 들어가면 애니메이션 없이 scrollLeft를 실제 영역 폭만큼 순간이동시킴.
// 초과분이 실제 영역 폭의 몇 배가 되든(빠른 스와이프로 복제 버퍼를 넘어가도) 나머지 연산 방식으로
// 안전하게 보정하도록 처리함.
export const useInfiniteCarousel = ({ itemCount, cloneCount = 10 }: UseInfiniteCarouselOptions): UseInfiniteCarouselResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const strideRef = useRef(0);
  const readyRef = useRef(false);
  const dragRef = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const n = Math.min(cloneCount, itemCount);
  const cloneBefore = Array.from({ length: n }, (_, i) => itemCount - n + i);
  const cloneAfter  = Array.from({ length: n }, (_, i) => i);

  // 아이템이 바뀌면(최초 로드 포함) 카드 폭(stride)을 측정하고, 실제 영역 시작점으로 스크롤 위치를 맞춤
  useLayoutEffect(() => {
    const el = containerRef.current;
    readyRef.current = false;
    if (!el || itemCount === 0) return;
    const children = el.children;
    if (children.length >= 2) {
      const a = (children[0] as HTMLElement).offsetLeft;
      const b = (children[1] as HTMLElement).offsetLeft;
      strideRef.current = b - a;
    }
    if (strideRef.current > 0) {
      el.scrollLeft = n * strideRef.current;
      readyRef.current = true;
    }
  }, [itemCount, n]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || itemCount === 0) return;

    const handleScroll = () => {
      if (!readyRef.current) return;
      const stride = strideRef.current;
      if (!stride) return;
      const realWidth = itemCount * stride;
      const min = n * stride;
      const max = min + realWidth;
      if (el.scrollLeft < min) {
        const overshoot = min - el.scrollLeft;
        const shifts = Math.ceil(overshoot / realWidth);
        el.scrollLeft += shifts * realWidth;
      } else if (el.scrollLeft > max) {
        const overshoot = el.scrollLeft - max;
        const shifts = Math.ceil(overshoot / realWidth);
        el.scrollLeft -= shifts * realWidth;
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [itemCount, n]);

  // 데스크탑 마우스 드래그 스크롤 전용 (터치는 브라우저 네이티브 스크롤을 그대로 사용)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = containerRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !dragRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.startScrollLeft - delta;
  };
  const endDrag = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (dragRef.current?.moved) suppressClickRef.current = true;
    dragRef.current = null;
    setIsDragging(false);
  };
  // 드래그(카드 이동)가 있었던 직후의 클릭은 카드 상세 이동으로 이어지지 않도록 한 번만 막음
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClickRef.current = false;
    }
  };

  return {
    containerRef,
    cloneBefore,
    cloneAfter,
    isDragging,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerLeave: endDrag, onClickCapture },
  };
};
