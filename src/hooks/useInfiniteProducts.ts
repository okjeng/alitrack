import { useState, useEffect, useRef } from "react";
import type { Product } from "../types";
import { mapProduct } from "../utils";
import { PAGE_SIZE, API_BASE } from "../data/constants";

interface UseInfiniteProductsResult {
  items: Product[];
  loading: boolean;
  initialized: boolean;
  loaderRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  error: string | null;
  retry: () => void;
}

export const useInfiniteProducts = (keyword = "", sort = "default"): UseInfiniteProductsResult => {
  console.log("[5] useInfiniteProducts 호출됨, keyword =", JSON.stringify(keyword));
  const [items, setItems]             = useState<Product[]>([]);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const loaderRef      = useRef<HTMLDivElement | null>(null);
  const loadingRef     = useRef(false);
  const hasMoreRef     = useRef(true);
  const pageRef        = useRef(0);
  const keywordRef     = useRef(keyword);
  const sortRef        = useRef(sort);
  const initializedRef = useRef(false);

  const fetchPage = (pageNum: number, kw = keywordRef.current, s = sortRef.current) => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({ page: String(pageNum), size: String(PAGE_SIZE), sort: s });
    console.log("[6] fetchPage 실행, kw =", JSON.stringify(kw));
    if (kw) params.set("keyword", kw);
    fetch(`${API_BASE}/api/ali/products?${params}`, { signal: controller.signal })
      .then(res => {
        clearTimeout(timeout);
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { products?: unknown[] }) => {
        const newItems: Product[] = (data.products || []).map(p => mapProduct(p as Record<string, unknown>));
        if (newItems.length === 0) {
          hasMoreRef.current = false;
          setHasMore(false);
        } else {
          setItems(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const unique = newItems.filter(p => !existingIds.has(p.id));
            if (unique.length === 0) return prev;
            return [...prev, ...unique];
          });
          pageRef.current = pageNum;
          setPage(pageNum);
        }
      })
      .catch((e: Error) => {
        clearTimeout(timeout);
        setError(e.name === "AbortError" ? "요청 시간이 초과됐습니다." : "상품을 불러오지 못했습니다.");
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
        if (!initializedRef.current) { initializedRef.current = true; setInitialized(true); }
      });
  };

  // keyword/sort 변경 시 초기화 후 재요청
  useEffect(() => {
    console.log("[7] useEffect 실행, keyword(클로저) =", JSON.stringify(keyword), "keywordRef.current(before) =", JSON.stringify(keywordRef.current));
    setItems([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    setInitialized(false);
    hasMoreRef.current = true;
    pageRef.current = 0;
    initializedRef.current = false;
    loadingRef.current = false;
    keywordRef.current = keyword;
    sortRef.current    = sort;
    console.log("[8] fetchPage(1) 직전, keyword =", JSON.stringify(keyword));
    fetchPage(1, keyword, sort);
    return () => { loadingRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, sort]);

  // 무한 스크롤
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          fetchPage(pageRef.current + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [initialized]); // initialized가 true가 된 후 observer 재연결

  return { items, loading, initialized, loaderRef, hasMore, error, retry: () => fetchPage(pageRef.current + 1) };
};
