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
// minRatingCascade: [90, 85] 처럼 넘기면 90%+로 먼저 걸러보고, 결과가 0개면 85%+로 완화,
// 그마저도 0개면 필터 없이 평점 높은 순으로 정렬해서 보여줌 (안정적으로 항상 뭔가는 보여주기 위함)
// sortBy: 등급 필터를 통과한 결과를 추가로 재정렬(예: 판매량 내림차순)
// 참조 안정성을 위해 호출 쪽에서 모듈 스코프 상수로 넘겨야 함(매 렌더 새 배열/함수 X)
export const useTopProducts = (
  sort: string,
  limit = 15,
  minRatingCascade?: number[],
  sortBy?: (a: Product, b: Product) => number,
): UseTopProductsResult => {
  const [items, setItems]     = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const needsFilter = !!minRatingCascade?.length;
    // 백엔드 /api/ali/products의 size 상한은 50(le=50) — 이를 넘기면 422로 요청 자체가 실패함
    const fetchSize = needsFilter ? Math.min(50, Math.max(limit * 4, 30)) : limit;
    const params = new URLSearchParams({ page: "1", size: String(fetchSize), sort });
    fetch(`${API_BASE}/api/ali/products?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { products?: unknown[] }) => {
        if (cancelled) return;
        const mapped: Product[] = (data.products || []).map(p => mapProduct(p as Record<string, unknown>));
        let result = mapped;
        if (needsFilter) {
          let matched: Product[] = [];
          for (const threshold of minRatingCascade!) {
            matched = mapped.filter(p => p.rating >= threshold);
            if (matched.length > 0) break;
          }
          result = matched.length > 0 ? matched : [...mapped].sort((a, b) => b.rating - a.rating);
        }
        if (sortBy) result = [...result].sort(sortBy);
        setItems(result.slice(0, limit));
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sort, limit, minRatingCascade, sortBy]);

  return { items, loading, error };
};
