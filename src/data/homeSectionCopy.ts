// 홈 화면 섹션 문구 및 카테고리 목록 — 새 홈 화면 구조 전용 상수
// (기존 src/data/constants.ts의 CATEGORIES와는 별개, 홈 카테고리 바 전용)

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
  trending: { title: "🏆 인기 급상승", moreLabel: "더보기" },
  megaDeal: { title: "✂️ 초특가 찬스", moreLabel: "더보기" },
  trusted:  { title: "💯 믿고 사는 상품" },
  railEmpty: "상품을 불러오지 못했어요.",
} as const;
