// 홈 화면 섹션 문구 및 카테고리 목록 — 새 홈 화면 구조 전용 상수
// (기존 src/data/constants.ts의 CATEGORIES와는 별개, 홈 카테고리 바 전용)

import type { Product } from "../types";

export interface HomeCategory {
  id: string;
  icon: string;
  label: string;
  keyword: string; // "" = 전체(필터 없음)
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { id: "all",         icon: "🏷️", label: "전체",           keyword: "" },
  { id: "women",       icon: "👗", label: "여성의류",       keyword: "여성의류" },
  { id: "men",         icon: "👔", label: "남성의류",       keyword: "남성의류" },
  { id: "shoes",       icon: "👟", label: "신발",           keyword: "신발" },
  { id: "beauty",      icon: "💄", label: "뷰티&헬스",     keyword: "뷰티 헬스" },
  { id: "phone",       icon: "📱", label: "폰&액세서리",   keyword: "휴대폰 액세서리" },
  { id: "electronics", icon: "💻", label: "전자제품",       keyword: "전자제품" },
  { id: "furniture",   icon: "🏠", label: "가구&인테리어", keyword: "가구 인테리어" },
  { id: "car",         icon: "🚗", label: "자동차용품",     keyword: "자동차용품" },
  { id: "toys",        icon: "🧸", label: "장난감&게임",   keyword: "장난감 게임" },
  { id: "pet",         icon: "🐾", label: "반려동물",       keyword: "반려동물용품" },
  { id: "bag",         icon: "👜", label: "가방&여행",     keyword: "가방 여행" },
  { id: "sports",      icon: "⚽", label: "스포츠&아웃도어", keyword: "스포츠 아웃도어" },
  { id: "tools",       icon: "🔧", label: "공구&DIY",      keyword: "공구" },
  { id: "baby",        icon: "👶", label: "유아&출산",     keyword: "유아용품" },
  { id: "jewelry",     icon: "💍", label: "주얼리&악세서리", keyword: "주얼리 악세서리" },
];

export const HOME_SECTION_COPY = {
  trending:   { title: "🏆 인기 급상승", moreLabel: "더보기" },
  megaDeal:   { title: "✂️ 초특가 찬스", moreLabel: "더보기" },
  praised:    { title: "👍 구매자 극찬 상품" },
  priceFinal: { title: "🏷️ 오늘 자 가격 종결템", moreLabel: "더보기" },
  railEmpty: "상품을 불러오지 못했어요.",
  comingSoon: "준비 중이에요",
} as const;

export interface PriceFinalMall {
  id: string;
  label: string;
}

// 오늘 자 가격 종결템 — 쇼핑몰별 탭 (지금은 API 미연동, 준비중 UI만)
export const PRICE_FINAL_MALLS: PriceFinalMall[] = [
  { id: "coupang", label: "쿠팡" },
  { id: "11st",    label: "11번가" },
  { id: "emart",   label: "이마트몰" },
  { id: "temu",    label: "테무" },
  { id: "gmarket", label: "G마켓" },
];

// 구매자 극찬 상품 평점 기준 완화 순서: 90%+ → 85%+ → (그래도 없으면) 필터 없이 평점순 정렬
// useTopProducts의 useEffect 의존성 배열에 안전하게 넣기 위해 모듈 스코프 상수로 고정
export const PRAISED_MIN_RATING_CASCADE: number[] = [90, 85];

// 평점 필터를 통과한 상품을 판매량(lastest_volume) 내림차순으로 재정렬
// 참고: 백엔드가 lastest_volume(최근 판매량)을 Product.reviews 필드에 담아서 내려줌
export const sortByVolumeDesc = (a: Product, b: Product): number => b.reviews - a.reviews;
