"""
Supabase 클라이언트 싱글톤
service_role key 사용 → RLS 우회 (서버 전용, 절대 프론트에 노출 금지)
"""

import asyncio
from functools import lru_cache
from supabase import create_client, Client
from src.config.settings import settings


@lru_cache()
def _get_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY 환경변수가 설정되지 않았습니다.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def supabase_query(fn):
    """동기 Supabase 클라이언트를 비동기 FastAPI에서 안전하게 실행"""
    return await asyncio.to_thread(fn, _get_client())
