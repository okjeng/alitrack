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
    # .env 예시: ALLOWED_HOSTS=alitrack.kr,www.alitrack.kr
    ALLOWED_HOSTS: List[str] = ["alitrack.kr", "www.alitrack.kr", "localhost"]
    ALLOWED_ORIGINS: List[str] = ["https://alitrack.kr", "https://www.alitrack.kr"]

    # ── 알리익스프레스 제휴 API ───────────────────────────────────
    # ⚠️ 절대 소스코드에 직접 쓰지 마세요 — .env 에만 저장
    ALI_APP_KEY: str         # .env: ALI_APP_KEY=xxxxxxxx
    ALI_APP_SECRET: str      # .env: ALI_APP_SECRET=xxxxxxxxxxxxxxxx
    ALI_TRACKING_ID: str     # .env: ALI_TRACKING_ID=your_tracking_id

    # ── 데이터베이스 ──────────────────────────────────────────────
    # .env 예시: DATABASE_URL=postgresql://user:pass@host:5432/alitrack
    DATABASE_URL: str

    # ── JWT 인증 ──────────────────────────────────────────────────
    # 최소 32자 랜덤 문자열 권장: openssl rand -hex 32
    JWT_SECRET: str
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
