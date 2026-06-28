-- AliTrack Supabase 마이그레이션
-- Supabase SQL Editor에서 실행하세요: https://supabase.com/dashboard/project/tpuftqwsrfrvujtffzbh/sql

-- ─── users 테이블 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider      TEXT NOT NULL,
    provider_id   TEXT NOT NULL,
    email         TEXT NOT NULL,
    nickname      TEXT DEFAULT '',
    profile_image TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    last_login    TIMESTAMPTZ DEFAULT now(),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (provider, provider_id)
);

-- 기존 테이블에 이메일 가입용 컬럼 추가 (이미 있으면 무시됨)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: own row only" ON public.users
    FOR SELECT USING (true);

-- ─── products 테이블 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    image_url   TEXT DEFAULT '',
    ali_url     TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products: public read" ON public.products FOR SELECT USING (true);

-- ─── price_history 테이블 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_history (
    id          BIGSERIAL PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price       INTEGER NOT NULL,
    currency    TEXT DEFAULT 'KRW',
    recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_history: public read" ON public.price_history FOR SELECT USING (true);

-- ─── wishlist 테이블 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist: own rows" ON public.wishlist
    FOR ALL USING (true);

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
CREATE POLICY "price_alerts: own rows" ON public.price_alerts
    FOR ALL USING (true);

-- ════════════════════════════════════════════════════════════════════
-- ─── 인덱스 최적화 ────────────────────────────────────────────────
-- ════════════════════════════════════════════════════════════════════

-- price_history: 상품별 가격 조회 (시간순) — 가장 많이 사용되는 쿼리
CREATE INDEX IF NOT EXISTS idx_price_history_product_time
    ON public.price_history (product_id, recorded_at DESC);

-- price_history: 특정 기간 이후 데이터 조회 (정리 스케줄러용)
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at
    ON public.price_history (recorded_at);

-- wishlist: 사용자별 찜 목록 조회
CREATE INDEX IF NOT EXISTS idx_wishlist_user
    ON public.wishlist (user_id, created_at DESC);

-- price_alerts: 활성 알림만 조회 (스케줄러용)
CREATE INDEX IF NOT EXISTS idx_price_alerts_active
    ON public.price_alerts (is_active, product_id) WHERE is_active = true;

-- users: 소셜 로그인 조회 (provider + provider_id)
CREATE INDEX IF NOT EXISTS idx_users_provider
    ON public.users (provider, provider_id);

-- ════════════════════════════════════════════════════════════════════
-- ─── 중복 가격 저장 방지 함수 ─────────────────────────────────────
-- 직전 가격과 동일하면 INSERT 하지 않음 (중복 데이터 제거)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION insert_price_if_changed(
    p_product_id TEXT,
    p_price      INTEGER,
    p_currency   TEXT DEFAULT 'KRW'
) RETURNS VOID AS $$
DECLARE
    last_price INTEGER;
BEGIN
    SELECT price INTO last_price
    FROM public.price_history
    WHERE product_id = p_product_id
    ORDER BY recorded_at DESC
    LIMIT 1;

    IF last_price IS DISTINCT FROM p_price THEN
        INSERT INTO public.price_history (product_id, price, currency)
        VALUES (p_product_id, p_price, p_currency);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════
-- ─── 오래된 가격 데이터 정리 (90일 이상) ─────────────────────────
-- Supabase Cron 또는 수동 실행: 매주 1회 권장
-- ════════════════════════════════════════════════════════════════════
-- 실행: SELECT cleanup_old_price_history();
CREATE OR REPLACE FUNCTION cleanup_old_price_history() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.price_history
    WHERE recorded_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
