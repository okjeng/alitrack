import { useState, useEffect, useCallback, useRef } from "react";
import { mapProduct } from "../utils.js";
import { PAGE_SIZE, API_BASE } from "../data/constants.js";

export const useInfiniteProducts = (keyword = "", sort = "default") => {
  const [items, setItems]             = useState([]);
  const [page, setPage]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError]             = useState(null);
  const loaderRef   = useRef(null);
  const loadingRef  = useRef(false);
  const hasMoreRef  = useRef(true);

  const fetchPage = useCallback(async (pageNum) => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const params = new URLSearchParams({ page: pageNum, size: PAGE_SIZE, sort });
      if (keyword) params.set("keyword", keyword);
      const res  = await fetch(`${API_BASE}/api/ali/products?${params}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const newItems = (data.products || []).map(mapProduct);
      if (newItems.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const unique = newItems.filter(p => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
        setPage(pageNum);
      }
    } catch (e) {
      clearTimeout(timeout);
      setError(e.name === "AbortError" ? "요청 시간이 초과됐습니다." : "상품을 불러오지 못했습니다.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized, keyword, sort]);

  useEffect(() => { fetchPage(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          fetchPage(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, fetchPage]);

  return { items, loading, initialized, loaderRef, hasMore, error, retry: () => fetchPage(page + 1) };
};
