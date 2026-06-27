"""
src/config/settings.py
모든 민감한 값은 .env 파일에서만 읽습니다.
소스코드에 API 키·비밀번호를 절대 하드코딩하지 마세요.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any
from functools import lru_cache
import json


def _parse_str_list(v: Any) -> Any:
    """
    환경변수 List[str] 파싱 — 아래 형식 모두 허용:
      *          → ["*"]
      a,b,c      → ["a","b","c"]
      [*]        → ["*"]        (Railway CLI 따옴표 누락 처리)
      ["a","b"]  → ["a","b"]   (올바른 JSON 배열)
    """
    if not isinstance(v, str):
        return v
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            # [*] 처럼 따옴표 없는 경우 → 내부 값을 쉼표로 분리
            inner = v[1:-1]
            return [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()]
    # 쉼표 구분 문자열
    return [x.strip() for x in v.split(",") if x.strip()]


class Settings(BaseSettings):
    # ── 서버 기본 설정 ────────────────────────────────────────────
    ENV: str = "production"
    DEBUG: bool = False

    # ── 보안: 허용 호스트 / 출처 ──────────────────────────────────
    ALLOWED_HOSTS: List[str] = ["*"]
    ALLOWED_ORIGINS: List[str] = ["*"]

    @field_validator("ALLOWED_HOSTS", "ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_list(cls, v: Any) -> Any:
        return _parse_str_list(v)

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
    KAKAO_CLIENT_ID: str     = ""
    KAKAO_REDIRECT_URI: str  = "https://alitrack.kr/auth/kakao/callback"
    NAVER_CLIENT_ID: str     = ""
    NAVER_CLIENT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str    = ""
    GOOGLE_CLIENT_SECRET: str= ""

    # ── 이메일 파싱 (Gmail IMAP) ──────────────────────────────────
    GMAIL_ADDRESS: str       = ""
    GMAIL_APP_PASSWORD: str  = ""   # Gmail 앱 비밀번호 (계정 비밀번호 아님!)

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
