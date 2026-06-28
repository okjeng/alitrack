"""
Supabase REST API 클라이언트 (httpx 사용, 별도 패키지 불필요)
service_role key → RLS 우회, 서버 전용
"""

import httpx
from src.config.settings import settings

_BASE = None
_HEADERS = None


def _init():
    global _BASE, _HEADERS
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY 환경변수 없음")
    _BASE = f"{settings.SUPABASE_URL}/rest/v1"
    _HEADERS = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _headers():
    if _HEADERS is None:
        _init()
    return _HEADERS


def _base():
    if _BASE is None:
        _init()
    return _BASE


async def sb_select(table: str, filters: dict = None, order: str = None,
                    limit: int = None, columns: str = "*") -> list:
    params = {"select": columns}
    if filters:
        params.update(filters)
    if order:
        params["order"] = order
    if limit:
        params["limit"] = str(limit)
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.get(f"{_base()}/{table}", headers=_headers(), params=params)
        r.raise_for_status()
        return r.json()


async def sb_upsert(table: str, data: dict) -> list:
    import logging
    log = logging.getLogger("alitrack.supabase")
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.post(
            f"{_base()}/{table}",
            headers={**_headers(), "Prefer": "resolution=merge-duplicates,return=representation"},
            json=data,
        )
        if not r.is_success:
            log.error(f"sb_upsert [{table}] {r.status_code}: {r.text[:300]}")
        r.raise_for_status()
        return r.json()


async def sb_delete(table: str, filters: dict) -> list:
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.delete(
            f"{_base()}/{table}", headers=_headers(), params=filters
        )
        r.raise_for_status()
        return r.json()
