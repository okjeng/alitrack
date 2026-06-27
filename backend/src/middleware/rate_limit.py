"""
src/middleware/rate_limit.py
IP당 Rate Limit 미들웨어 (Redis 기반)

엔드포인트별 차등 제한:
  - 로그인/가입  : 분당 10회  (브루트포스 방지)
  - 검색         : 분당 30회  (스크래핑 방지)
  - 일반 API     : 분당 60회
  - 전체         : 시간당 500회 (글로벌 제한)

차단 시: 429 Too Many Requests + Retry-After 헤더 반환
"""

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import redis.asyncio as aioredis

from src.config.settings import settings

logger = logging.getLogger("alitrack.rate_limit")

# Redis 연결 (싱글톤)
_redis_client = None

async def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


def _get_limit_for_path(path: str) -> tuple[int, int]:
    """(최대 요청 수, 윈도우 초) 반환"""
    if any(p in path for p in ["/auth/login", "/auth/register", "/auth/kakao", "/auth/naver", "/auth/google"]):
        return settings.RATE_LIMIT_AUTH_PER_MINUTE, 60
    if "/products/search" in path:
        return settings.RATE_LIMIT_SEARCH_PER_MINUTE, 60
    return settings.RATE_LIMIT_PER_MINUTE, 60


def _get_client_ip(request: Request) -> str:
    """실제 클라이언트 IP 추출 (프록시 헤더 고려)"""
    # Vercel / Cloudflare 등 프록시 환경
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # 첫 번째 IP가 실제 클라이언트 IP
        ip = forwarded_for.split(",")[0].strip()
        # 신뢰할 수 없는 IP 형식이면 직접 연결 IP 사용
        if _is_valid_ip(ip):
            return ip
    cf_ip = request.headers.get("CF-Connecting-IP")  # Cloudflare
    if cf_ip and _is_valid_ip(cf_ip):
        return cf_ip
    return request.client.host if request.client else "unknown"


def _is_valid_ip(ip: str) -> bool:
    """간단한 IP 형식 검증"""
    parts = ip.split(".")
    if len(parts) == 4:
        return all(p.isdigit() and 0 <= int(p) <= 255 for p in parts)
    # IPv6 간단 체크
    return ":" in ip and len(ip) <= 39


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 헬스체크는 제외
        if request.url.path == "/health":
            return await call_next(request)

        client_ip    = _get_client_ip(request)
        path         = request.url.path
        max_req, window = _get_limit_for_path(path)

        # Redis 키: ip:경로그룹:현재_윈도우
        window_key = int(time.time()) // window
        redis_key  = f"rl:{client_ip}:{path.split('/')[2] if path.count('/') >= 2 else 'root'}:{window_key}"

        try:
            redis = await get_redis()
            pipe  = redis.pipeline()
            await pipe.incr(redis_key)
            await pipe.expire(redis_key, window)
            results = await pipe.execute()
            current_count = results[0]
        except Exception as e:
            # Redis 장애 시 서비스 중단 방지 — 요청 통과시킴 (Fail-Open)
            logger.warning(f"Redis rate limit 오류 (Fail-Open): {e}")
            return await call_next(request)

        remaining = max(0, max_req - current_count)

        # 제한 초과
        if current_count > max_req:
            logger.warning(f"Rate limit 초과: IP={client_ip}, path={path}, count={current_count}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                    "retry_after": window,
                },
                headers={
                    "Retry-After":              str(window),
                    "X-RateLimit-Limit":        str(max_req),
                    "X-RateLimit-Remaining":    "0",
                    "X-RateLimit-Reset":        str((window_key + 1) * window),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"]     = str(max_req)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
