import { describe, it, expect } from "vitest";
import {
  fmt, avg60,
  mapProduct, buildAffiliateUrl, rankBySearch, generateHistory,
} from "../utils.js";

// ─── fmt ─────────────────────────────────────────────────────────
describe("fmt", () => {
  it("숫자를 원화 포맷으로 변환한다", () => {
    expect(fmt(10000)).toBe("10,000원");
    expect(fmt(0)).toBe("0원");
    expect(fmt(1234567)).toBe("1,234,567원");
  });
});

// ─── avg60 ───────────────────────────────────────────────────────
describe("avg60", () => {
  it("가격 배열의 평균을 100원 단위로 반환한다", () => {
    const history = [{ price: 10000 }, { price: 20000 }, { price: 30000 }];
    expect(avg60(history)).toBe(20000);
  });
  it("단일 항목이면 그 값을 100원 단위로 반환한다", () => {
    expect(avg60([{ price: 15555 }])).toBe(15600);
  });
});

// ─── mapProduct ──────────────────────────────────────────────────
describe("mapProduct", () => {
  it("API 응답을 프론트 상품 객체로 변환한다", () => {
    const raw = { id: 1, name: "테스트 상품", price: 10000, orig_price: 15000, discount: 33, rating: 4.5, reviews: 100 };
    const result = mapProduct(raw);
    expect(result.id).toBe("1");
    expect(result.name).toBe("테스트 상품");
    expect(result.price).toBe(10000);
    expect(result.tag).toBe("핫딜");
  });
  it("discount 50 이상이면 역대최저 태그를 반환한다", () => {
    expect(mapProduct({ id: "x", price: 5000, discount: 55 }).tag).toBe("역대최저");
  });
  it("discount 20 이상 30 미만이면 최저가근접 태그를 반환한다", () => {
    expect(mapProduct({ id: "x", price: 5000, discount: 25 }).tag).toBe("최저가근접");
  });
  it("id 없으면 빈 문자열로 처리한다", () => {
    expect(mapProduct({ price: 1000 }).id).toBe("");
  });
  it("image 없으면 기본 플레이스홀더 이미지를 반환한다", () => {
    const result = mapProduct({ id: "1", price: 1000 });
    expect(result.image).toContain("placehold.co");
  });
});

// ─── buildAffiliateUrl ───────────────────────────────────────────
describe("buildAffiliateUrl", () => {
  it("유효한 AliExpress URL이 있으면 그대로 반환한다", () => {
    const url = "https://ko.aliexpress.com/item/12345.html";
    expect(buildAffiliateUrl("12345", url)).toBe(url);
  });
  it("s.click URL이면 직접 상품 URL로 대체한다", () => {
    const clickUrl = "https://s.click.aliexpress.com/e/xxx";
    expect(buildAffiliateUrl("12345", clickUrl)).toContain("ko.aliexpress.com/item/12345.html");
  });
  it("affiliate URL 없으면 상품 ID 기반 URL을 생성한다", () => {
    const result = buildAffiliateUrl("99999", "");
    expect(result).toContain("ko.aliexpress.com/item/99999.html");
    expect(result).toContain("alitrack_kr");
  });
  it("생성된 URL은 https로 시작한다", () => {
    expect(buildAffiliateUrl("1", "")).toMatch(/^https:\/\//);
  });
});

// ─── rankBySearch ─────────────────────────────────────────────────
describe("rankBySearch", () => {
  const items = [
    { name: "Xiaomi 레드미 노트" },
    { name: "에어텐트 캠핑용" },
    { name: "에어 텐트 대형" },
    { name: "블루투스 이어폰" },
  ];

  it("keyword 없으면 원본 배열을 그대로 반환한다", () => {
    expect(rankBySearch(items, "")).toEqual(items);
  });
  it("완전 일치 상품이 맨 앞에 온다", () => {
    const result = rankBySearch([{ name: "에어텐트" }, { name: "에어텐트 캠핑용" }], "에어텐트");
    expect(result[0].name).toBe("에어텐트");
  });
  it("keyword 포함 상품만 결과에 포함된다 (무관 상품 필터링)", () => {
    const result = rankBySearch(items, "에어텐트");
    const names = result.map(i => i.name);
    expect(names).toContain("에어텐트 캠핑용");
    expect(names).not.toContain("블루투스 이어폰");
    expect(names).not.toContain("Xiaomi 레드미 노트");
  });
  it("원본 배열을 변경하지 않는다 (불변성)", () => {
    const original = [...items];
    rankBySearch(items, "에어텐트");
    expect(items).toEqual(original);
  });
  it("대소문자 구분 없이 매칭한다", () => {
    const data = [{ name: "Xiaomi Phone" }, { name: "Samsung" }];
    const result = rankBySearch(data, "xiaomi");
    expect(result[0].name).toBe("Xiaomi Phone");
  });
});

// ─── generateHistory ─────────────────────────────────────────────
describe("generateHistory", () => {
  it("가격 포인트 배열을 반환한다", () => {
    const result = generateHistory(10000, 12345);
    expect(result.length).toBeGreaterThan(0);
  });
  it("마지막 포인트가 현재 가격이다", () => {
    const result = generateHistory(10000, 12345);
    expect(result[result.length - 1].price).toBe(10000);
  });
  it("같은 seed로 동일한 결과를 반환한다 (결정론적)", () => {
    const r1 = generateHistory(10000, 99999);
    const r2 = generateHistory(10000, 99999);
    expect(r1).toEqual(r2);
  });
  it("각 포인트는 date와 price 필드를 가진다", () => {
    const result = generateHistory(5000, 111);
    expect(result[0]).toHaveProperty("date");
    expect(result[0]).toHaveProperty("price");
  });
});
