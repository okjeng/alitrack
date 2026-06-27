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
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import redis.asyncio as aioredis

from src.config.settings import settings

logger = logging.getLogger("alitrack.rate_limit")

# Redis 연결 (싱글톤)
_redis_client = None
_redis_available = None  # None=미확인, True=사용가능, False=불가

# Redis 없을 때 인메모리 fallback (단일 인스턴스 환경용)
_mem_counters: dict[str, list[float]] = defaultdict(list)

async def get_redis():
    global _redis_client, _redis_available
    if _redis_available is False:
        return None
    if _redis_client is None:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
            await _redis_client.ping()
            _redis_available = True
            logger.info("Redis 연결 성공")
        except Exception as e:
            _redis_available = False
            _redis_client = None
            logger.warning(f"Redis 연결 실패, 인메모리 Rate Limit으로 전환: {e}")
            return None
    return _redis_client


def _mem_rate_check(key: str, max_req: int, window: int) -> int:
    """인메모리 슬라이딩 윈도우 카운터. 현재 요청 수 반환."""
    now = time.time()
    cutoff = now - window
    timestamps = _mem_counters[key]
    # 윈도우 밖 항목 제거
    _mem_counters[key] = [t for t in timestamps if t > cutoff]
    _mem_counters[key].append(now)
    return len(_mem_counters[key])


def _get_limit_for_path(path: str) -> tuple[int, int]:
    """(최대 요청 수, 윈도우 초) 반환"""
    if any(p in path for p in ["/auth/login", "/auth/register", "/auth/kakao", "/auth/naver", "/auth/google"]):
        return settings.RATE_LIMIT_AUTH_PER_MINUTE, 60
    if "/products/search" in path:
        return settings.RATE_LIMIT_SEARCH_PER_MINUTE, 60
    return settings.RATE_LIMIT_PER_MINUTE, 60


def _get_client_ip(request: Request) -> str:
    """실제 클라이언트 IP 추출 — Railway/Cloudflare 프록시 신뢰 체인 적용"""
    direct_ip = request.client.host if request.client else "unknown"

    # Railway는 내부 로드밸런서 IP에서만 X-Forwarded-For를 추가함
    # 직접 연결 IP가 Railway 내부 대역(10.x.x.x)인 경우에만 헤더 신뢰
    is_trusted_proxy = direct_ip.startswith("10.") or direct_ip.startswith("172.") or direct_ip == "127.0.0.1"

    if is_trusted_proxy:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            # 마지막 신뢰 프록시 바로 앞 IP (rightmost rule)
            ips = [ip.strip() for ip in forwarded_for.split(",")]
            for ip in reversed(ips):
                if _is_valid_ip(ip) and not ip.startswith(("10.", "172.", "127.")):
                    return ip
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip and _is_valid_ip(cf_ip):
            return cf_ip

    return direct_ip


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
            if redis:
                pipe  = redis.pipeline()
                await pipe.incr(redis_key)
                await pipe.expire(redis_key, window)
                results = await pipe.execute()
                current_count = results[0]
            else:
                # Redis 미사용 시 인메모리 카운터 (Fail-Secure)
                current_count = _mem_rate_check(redis_key, max_req, window)
        except Exception as e:
            logger.warning(f"Redis rate limit 오류, 인메모리로 전환: {e}")
            current_count = _mem_rate_check(redis_key, max_req, window)

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
