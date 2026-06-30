import type { Category, Product } from "../types";

export const PAGE_SIZE = 20;

// 외부 서비스 의존 없는 인라인 SVG 폴백 이미지
export const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Crect width='320' height='320' fill='%23EEF2FF'/%3E%3Crect x='115' y='95' width='90' height='65' rx='6' fill='%236366F1' opacity='.2'/%3E%3Crect x='95' y='155' width='130' height='80' rx='6' fill='%236366F1' opacity='.15'/%3E%3Cpath d='M115 155 L95 155 M205 155 L225 155' stroke='%236366F1' stroke-width='2' opacity='.3'/%3E%3C/svg%3E";

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL || "https://alitrack-production.up.railway.app";

export const NAV_H = 56;
export const BTN_H = 72;

export const TAG_COLORS: Record<string, string> = {
  역대최저: "bg-red-500", 핫딜: "bg-orange-500",
  최저가근접: "bg-blue-500", 긴급핫딜: "bg-pink-500", 특가: "bg-green-600",
};

interface ProductTemplate {
  namePrefix: string;
  shortPrefix: string;
  basePrice: number;
  image: string;
  tag: string;
  deliveryDays: number;
  rating: number;
}

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { namePrefix:"Xiaomi 레드미 노트",    shortPrefix:"레드미 노트",      basePrice:189000, image:FALLBACK_IMAGE, tag:"역대최저",   deliveryDays:5, rating:4.8 },
  { namePrefix:"UGREEN GaN 충전기",     shortPrefix:"GaN 충전기",       basePrice:28500,  image:FALLBACK_IMAGE, tag:"핫딜",       deliveryDays:4, rating:4.7 },
  { namePrefix:"Anker Soundcore",       shortPrefix:"Soundcore",        basePrice:45900,  image:FALLBACK_IMAGE, tag:"최저가근접", deliveryDays:5, rating:4.6 },
  { namePrefix:"Baseus 맥세이프",       shortPrefix:"맥세이프 거치대",  basePrice:12800,  image:FALLBACK_IMAGE, tag:"긴급핫딜",   deliveryDays:3, rating:4.5 },
  { namePrefix:"Haylou GT 이어폰",      shortPrefix:"Haylou GT",        basePrice:4800,   image:FALLBACK_IMAGE, tag:"특가",       deliveryDays:5, rating:4.4 },
  { namePrefix:"Xiaomi 스마트워치",     shortPrefix:"샤오미 워치",      basePrice:62000,  image:FALLBACK_IMAGE, tag:"역대최저",   deliveryDays:5, rating:4.7 },
  { namePrefix:"Toocki GaN 미니 충전기",shortPrefix:"Toocki 충전기",    basePrice:3900,   image:FALLBACK_IMAGE, tag:"핫딜",       deliveryDays:4, rating:4.5 },
  { namePrefix:"ELEGOO RGB 무드등",     shortPrefix:"RGB 무드등",       basePrice:8900,   image:FALLBACK_IMAGE, tag:"최저가근접", deliveryDays:5, rating:4.3 },
  { namePrefix:"Joyroom 케이블 세트",   shortPrefix:"케이블 세트",      basePrice:7500,   image:FALLBACK_IMAGE, tag:"특가",       deliveryDays:3, rating:4.6 },
  { namePrefix:"Baseus 무선충전 패드",  shortPrefix:"무선충전 패드",    basePrice:4500,   image:FALLBACK_IMAGE, tag:"긴급핫딜",   deliveryDays:5, rating:4.4 },
  { namePrefix:"Xiaomi 공기청정기",     shortPrefix:"샤오미 공기청정기",basePrice:89000,  image:FALLBACK_IMAGE, tag:"역대최저",   deliveryDays:5, rating:4.8 },
  { namePrefix:"LED 마스크팩 기기",     shortPrefix:"LED 마스크팩",     basePrice:32000,  image:FALLBACK_IMAGE, tag:"핫딜",       deliveryDays:4, rating:4.5 },
  { namePrefix:"HAGIBIS USB-C 허브",    shortPrefix:"USB-C 허브",       basePrice:24900,  image:FALLBACK_IMAGE, tag:"특가",       deliveryDays:5, rating:4.6 },
  { namePrefix:"Baseus 보조배터리",     shortPrefix:"보조배터리",       basePrice:28900,  image:FALLBACK_IMAGE, tag:"역대최저",   deliveryDays:3, rating:4.7 },
  { namePrefix:"Xiaomi 게이밍 마우스",  shortPrefix:"게이밍 마우스",    basePrice:16500,  image:FALLBACK_IMAGE, tag:"핫딜",       deliveryDays:5, rating:4.4 },
  { namePrefix:"UGREEN 노트북 거치대",  shortPrefix:"노트북 거치대",    basePrice:19900,  image:FALLBACK_IMAGE, tag:"최저가근접", deliveryDays:4, rating:4.5 },
  { namePrefix:"샤오미 스마트 플러그",  shortPrefix:"스마트 플러그",    basePrice:8500,   image:FALLBACK_IMAGE, tag:"특가",       deliveryDays:5, rating:4.3 },
  { namePrefix:"Anker 마그네틱 케이블", shortPrefix:"마그네틱 케이블",  basePrice:12000,  image:FALLBACK_IMAGE, tag:"핫딜",       deliveryDays:4, rating:4.6 },
  { namePrefix:"JMGO 미니 빔프로젝터",  shortPrefix:"미니 빔프로젝터",  basePrice:145000, image:FALLBACK_IMAGE, tag:"역대최저",   deliveryDays:5, rating:4.7 },
  { namePrefix:"Dreame 무선 청소기",    shortPrefix:"무선 청소기",      basePrice:178000, image:FALLBACK_IMAGE, tag:"긴급핫딜",   deliveryDays:5, rating:4.8 },
];

const daysFromNow = (days: number): string => {
  if (days === 0) return "오늘 자정 만료";
  const d = new Date(); d.setDate(d.getDate() + days);
  return `${d.getMonth()+1}/${d.getDate()} 만료 (D-${days})`;
};

interface DiscountCode {
  code: string;
  desc: string;
  expire: string;
  color: string;
}

export const DISCOUNT_CODES: DiscountCode[] = [
  { code:"ALIMAX15",  desc:"전품목 15% 할인",          expire:daysFromNow(0),  color:"#FF5A1F" },
  { code:"NEWUSER30", desc:"신규 가입자 30% 추가 할인", expire:daysFromNow(3),  color:"#6366F1" },
  { code:"SHIP999",   desc:"배송비 999원 고정",         expire:daysFromNow(7),  color:"#00C07F" },
  { code:"SUMMER10",  desc:"여름 시즌 10% 특별 할인",   expire:daysFromNow(14), color:"#F59E0B" },
];

interface PromoBanner {
  id: string;
  title: string;
  sub: string;
  badge: string;
  bg: string;
  products: string[];
  keyword: string;
  sort: string;
}

export const PROMO_BANNERS: PromoBanner[] = [
  { id:"b1", title:"2026 알리 메가 세일",  sub:"선착순 최대 50% 특가",     badge:"🎊 메가세일",   bg:"linear-gradient(135deg,#FF5A1F,#f7462a)",  products:["갤럭시 버즈","스마트워치","충전기"], keyword:"electronics", sort:"discount" },
  { id:"b2", title:"공식 브랜드 위크",     sub:"샤오미·안커·바세우스 특가", badge:"🏷 브랜드위크", bg:"linear-gradient(135deg,#6366F1,#8B5CF6)",  products:["노트북","이어폰","스마트홈"],        keyword:"gadget",      sort:"default"  },
  { id:"b3", title:"플래시 딜 3시간",      sub:"오늘만 이 가격!",           badge:"⚡ 긴급",       bg:"linear-gradient(135deg,#0EA5E9,#6366F1)",  products:["케이블","보조배터리","거치대"],      keyword:"sale",        sort:"discount" },
  { id:"b4", title:"무료배송 페스티벌",    sub:"전품목 무료배송 이벤트",    badge:"🚚 무배축제",   bg:"linear-gradient(135deg,#10B981,#0EA5E9)",  products:["생활용품","뷰티","주방"],            keyword:"beauty",      sort:"default"  },
  { id:"b5", title:"5일 특급 배송전",      sub:"5일 내 도착 보장 상품만",   badge:"🚀 5일배송",    bg:"linear-gradient(135deg,#F59E0B,#EF4444)",  products:["전자제품","패션","홈데코"],          keyword:"fashion",     sort:"default"  },
];

export const CATEGORIES: Category[] = [
  { id:"domestic",  icon:"🏠", label:"한국배송",  keyword:"sport",   sort:"default"   },
  { id:"cheap",     icon:"💸", label:"초저가템",  keyword:"",        sort:"price_asc" },
  { id:"popular",   icon:"🏆", label:"인기랭킹",  keyword:"",        sort:"default"   },
  { id:"reviewed",  icon:"⭐", label:"리뷰많은",  keyword:"gadget",  sort:"default"   },
  { id:"limited",   icon:"⚡", label:"한정특가",  keyword:"sale",    sort:"discount"  },
  { id:"value",     icon:"💎", label:"실속상품",  keyword:"home",    sort:"discount"  },
  { id:"monthly",   icon:"🗓️", label:"월간옵션", keyword:"fashion", sort:"default"   },
  { id:"freeship",  icon:"🚚", label:"무료배송",  keyword:"outdoor", sort:"default"   },
];

export const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value:"default",    label:"인기순"   },
  { value:"price_asc",  label:"낮은가격" },
  { value:"price_desc", label:"높은가격" },
  { value:"discount",   label:"할인율순" },
];

interface OnboardingSlide {
  emoji: string;
  title: string;
  desc: string;
  bg: string;
  accent: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  { emoji:"🔍", title:"알리 최저가,\n한눈에 확인해요",    desc:"알리익스프레스 수천만 개 상품의\n실시간 가격 변동을 추적합니다",         bg:"linear-gradient(145deg,#fff7ed,#fff)", accent:"#FF5A1F" },
  { emoji:"🚨", title:"역대 최저가\n달성하면 알려드려요", desc:"관심 상품을 찜해두면\n가격이 떨어질 때 즉시 알림을 보내드려요",         bg:"linear-gradient(145deg,#eff6ff,#fff)", accent:"#6366F1" },
  { emoji:"💸", title:"핫딜·할인코드\n놓치지 마세요",     desc:"매일 업데이트되는 알리 핫딜과\n할인코드를 가장 먼저 만나보세요",           bg:"linear-gradient(145deg,#f0fdf4,#fff)", accent:"#00C07F" },
];

export const COUPANG_PARTNER_ID = "AF4860198";

export const generateDummyPage = (page: number): Promise<Product[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const items: Product[] = Array.from({ length: PAGE_SIZE }, (_, i) => {
        const globalIdx = (page - 1) * PAGE_SIZE + i;
        const tmpl = PRODUCT_TEMPLATES[globalIdx % PRODUCT_TEMPLATES.length];
        const variation   = Math.floor(globalIdx / PRODUCT_TEMPLATES.length);
        const priceVariant = Math.round((tmpl.basePrice * (0.85 + Math.random() * 0.3)) / 100) * 100;
        const origVariant  = Math.round(priceVariant * (1.2 + Math.random() * 0.4) / 100) * 100;
        const discount     = Math.round((1 - priceVariant / origVariant) * 100);
        const reviewCount  = Math.floor(Math.random() * 5000) + 200;
        const ratingVar    = +(tmpl.rating - 0.1 + Math.random() * 0.2).toFixed(1);
        return {
          id:          `p${String(globalIdx + 1).padStart(4,"0")}`,
          name:        `${tmpl.namePrefix} ${variation > 0 ? `(${["Pro","Max","Ultra","Plus","Neo"][variation % 5]})` : ""}`.trim(),
          shortName:   tmpl.shortPrefix,
          price:       priceVariant,
          orig:        origVariant,
          discount,
          image:       tmpl.image,
          tag:         tmpl.tag,
          deliveryDays:tmpl.deliveryDays,
          rating:      Math.min(5.0, ratingVar),
          reviews:     reviewCount,
        };
      });
      resolve(items);
    }, 600);
  });
