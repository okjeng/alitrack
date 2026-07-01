import { useEffect, useState } from "react";
import type { Product } from "../types";
import { mapProduct } from "../utils";
import { API_BASE } from "../data/constants";

interface UseTopProductsResult {
  items: Product[];
  loading: boolean;
  error: boolean;
}

// 무한스크롤 없이 상위 N개만 단발성으로 조회 (홈 화면 가로 스크롤 섹션 전용)
export const useTopProducts = (sort: string, limit = 15, minRating?: number): UseTopProductsResult => {
  const [items, setItems]     = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const fetchSize = minRating != null ? Math.max(limit * 4, 50) : limit;
    const params = new URLSearchParams({ page: "1", size: String(fetchSize), sort });
    fetch(`${API_BASE}/api/ali/products?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { products?: unknown[] }) => {
        if (cancelled) return;
        let mapped: Product[] = (data.products || []).map(p => mapProduct(p as Record<string, unknown>));
        if (minRating != null) mapped = mapped.filter(p => p.rating >= minRating);
        setItems(mapped.slice(0, limit));
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sort, limit, minRating]);

  return { items, loading, error };
};
