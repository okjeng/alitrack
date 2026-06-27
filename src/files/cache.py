"""
src/utils/cache.py
Redis 응답 캐시 데코레이터

API 응답을 Redis에 캐시해서 알리 API 중복 호출 방지
TTL(유효기간) 초과 시 자동 만료
"""

import json
import hashlib
import logging
import functools
from fastapi.responses import JSONResponse
import redis.asyncio as aioredis

from src.config.settings import settings

logger = logging.getLogger("alitrack.cache")

_redis = None

async def _get_redis():
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def cache_response(ttl: int = 300):
    """
    API 응답 캐시 데코레이터
    ttl: 캐시 유지 시간 (초)
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 키: 함수명 + 인자 해시
            key_data = f"{func.__name__}:{json.dumps(kwargs, sort_keys=True, default=str)}"
            cache_key = "cache:" + hashlib.md5(key_data.encode()).hexdigest()

            try:
                redis = await _get_redis()
                cached = await redis.get(cache_key)
                if cached:
                    logger.debug(f"캐시 HIT: {cache_key}")
                    return JSONResponse(content=json.loads(cached))
            except Exception as e:
                logger.warning(f"캐시 읽기 실패 (무시): {e}")

            # 캐시 미스 — 실제 함수 실행
            result = await func(*args, **kwargs)

            try:
                redis = await _get_redis()
                content = result if isinstance(result, dict) else result.body
                if isinstance(content, bytes):
                    content = json.loads(content)
                await redis.setex(cache_key, ttl, json.dumps(content))
                logger.debug(f"캐시 SET: {cache_key}, TTL={ttl}s")
            except Exception as e:
                logger.warning(f"캐시 저장 실패 (무시): {e}")

            return result
        return wrapper
    return decorator
