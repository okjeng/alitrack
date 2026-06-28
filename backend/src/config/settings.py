"""
src/config/settings.py
모든 민감한 값은 .env 파일에서만 읽습니다.
소스코드에 API 키·비밀번호를 절대 하드코딩하지 마세요.
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # ── 서버 기본 설정 ────────────────────────────────────────────
    ENV: str = "production"
    DEBUG: bool = False

    # ── 보안: 허용 호스트 / 출처 ──────────────────────────────────
    # str로 유지 — Railway CLI가 JSON 배열 저장 시 따옴표를 누락시켜
    # pydantic List[str] 파싱이 JSONDecodeError를 발생시키는 문제를 방지
    # main.py에서 .split(",")으로 파싱
    # DNS 완료 후: alitrack.kr,www.alitrack.kr,api.alitrack.kr
    ALLOWED_HOSTS: str = "alitrack-production.up.railway.app,alitrack.pages.dev,localhost"
    ALLOWED_ORIGINS: str = "https://alitrack.kr,https://alitrack.pages.dev,https://alitrack-production.up.railway.app"

    # ── Supabase ──────────────────────────────────────────────────
    SUPABASE_URL: str         = ""
    SUPABASE_KEY: str         = ""   # service_role key (서버 전용)

    # ── 알리익스프레스 제휴 API ───────────────────────────────────
    # https://portals.aliexpress.com 에서 발급
    ALI_APP_KEY: str      = ""
    ALI_APP_SECRET: str   = ""
    ALI_TRACKING_ID: str  = ""

    # ── 데이터베이스 ──────────────────────────────────────────────
    # Railway PostgreSQL 플러그인 추가 시 자동 주입됨
    DATABASE_URL: str     = ""

    # ── JWT 인증 ──────────────────────────────────────────────────
    JWT_SECRET: str       = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7일

    # ── Rate Limit 설정 ───────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60          # 일반 API
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10     # 로그인 엔드포인트 (더 엄격)
    RATE_LIMIT_SEARCH_PER_MINUTE: int = 30   # 검색 엔드포인트

    # ── 소셜 로그인 ───────────────────────────────────────────────
    # DNS 설정 완료 후: alitrack.kr / api.alitrack.kr 로 변경
    FRONTEND_URL: str        = "https://alitrack.kr"

    KAKAO_CLIENT_ID: str     = ""
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str  = "https://alitrack-production.up.railway.app/api/auth/kakao/callback"

    NAVER_CLIENT_ID: str     = ""
    NAVER_CLIENT_SECRET: str = ""
    NAVER_REDIRECT_URI: str  = "https://alitrack-production.up.railway.app/api/auth/naver/callback"

    GOOGLE_CLIENT_ID: str    = ""
    GOOGLE_CLIENT_SECRET: str= ""
    GOOGLE_REDIRECT_URI: str = "https://alitrack-production.up.railway.app/api/auth/google/callback"

    # ── 이메일 파싱 (Gmail IMAP) ──────────────────────────────────
    GMAIL_ADDRESS: str       = "turtlesmotivation@gmail.com"
    GMAIL_APP_PASSWORD: str  = ""   # Gmail 앱 비밀번호 (계정 비밀번호 아님!)

    # ── 스케줄러 인증 키 ─────────────────────────────────────────
    CRON_SECRET: str         = ""

    # ── Redis (Rate Limit·캐시 저장소) ────────────────────────────
    REDIS_URL: str           = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"           # 프로젝트 루트의 .env 파일
        env_file_encoding = "utf-8"
        case_sensitive = True       # 대소문자 구분


@lru_cache()             # 싱글톤: 앱 전체에서 한 번만 로드
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
