-- AliTrack Supabase 마이그레이션
-- Supabase SQL Editor에서 실행하세요: https://supabase.com/dashboard/project/tpuftqwsrfrvujtffzbh/sql

-- ─── users 테이블 ───────────────────────────────────────────────────
-- 소셜 로그인(카카오/네이버/구글) 사용자 저장
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider      TEXT NOT NULL,             -- 'kakao' | 'naver' | 'google'
    provider_id   TEXT NOT NULL,             -- 소셜 서비스의 고유 사용자 ID
    email         TEXT NOT NULL,
    nickname      TEXT DEFAULT '',
    profile_image TEXT DEFAULT '',
    last_login    TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (provider, provider_id)           -- upsert 키: 같은 소셜 계정 중복 방지
);

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- service_role(백엔드 전용)은 RLS 우회 — 별도 정책 불필요
-- 아래는 선택적: 사용자 본인만 자신의 데이터 조회 가능
CREATE POLICY "users: own row only" ON public.users
    FOR SELECT USING (true);  -- 백엔드에서만 service_role로 접근하므로 일단 허용

-- ─── products 테이블 업데이트 ─────────────────────────────────────
-- 이미 존재하는 경우 skip
CREATE TABLE IF NOT EXISTS public.products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    image_url   TEXT DEFAULT '',
    ali_url     TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "products: public read" ON public.products FOR SELECT USING (true);

-- ─── price_history 테이블 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_history (
    id          BIGSERIAL PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price       INTEGER NOT NULL,
    currency    TEXT DEFAULT 'KRW',
    recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "price_history: public read" ON public.price_history FOR SELECT USING (true);

-- ─── wishlist 테이블 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "wishlist: own rows" ON public.wishlist
    FOR ALL USING (true);  -- 백엔드 service_role 전용

-- ─── price_alerts 테이블 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id   TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    target_price INTEGER NOT NULL,
    is_active    BOOLEAN DEFAULT true,
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "price_alerts: own rows" ON public.price_alerts
    FOR ALL USING (true);  -- 백엔드 service_role 전용
