"""
src/routes/auth.py — 이메일 회원가입 / 로그인

비밀번호는 Supabase Auth가 관리 (password_hash 컬럼 불필요)
  1) POST /api/auth/email/register — 이메일 + 비밀번호로 가입
  2) POST /api/auth/email/login    — 이메일 + 비밀번호로 로그인
  3) GET  /api/auth/me             — 저장된 토큰으로 로그인 상태 확인
  4) POST /api/auth/logout         — 로그아웃
"""

import re
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response, Request, Cookie
from pydantic import BaseModel
import httpx

from src.config.settings import settings
from src.utils.auth import create_access_token, verify_access_token
from src.utils.supabase_client import sb_upsert, sb_select

logger = logging.getLogger("alitrack.auth")
router = APIRouter()


# ─── Supabase Auth 헬퍼 ─────────────────────────────────────────────
def _sb_auth_headers():
    return {
        "apikey":        settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type":  "application/json",
    }

async def _sb_auth_create_user(email: str, password: str) -> dict:
    """Supabase Auth에 사용자 생성 (admin endpoint)"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users",
            headers=_sb_auth_headers(),
            json={"email": email, "password": password, "email_confirm": True},
        )
        if r.status_code == 422:
            body = r.json()
            msg  = body.get("msg", "") or body.get("message", "")
            if "already" in msg.lower() or "email" in msg.lower():
                raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다. 로그인해주세요.")
        r.raise_for_status()
        return r.json()

async def _sb_auth_login(email: str, password: str) -> dict:
    """Supabase Auth로 이메일/비밀번호 검증"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=_sb_auth_headers(),
            json={"email": email, "password": password},
        )
        if r.status_code in (400, 401, 422):
            raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        r.raise_for_status()
        return r.json()

async def _upsert_user(provider: str, provider_id: str, email: str, nickname: str = "") -> str:
    try:
        rows = await sb_upsert("users", {
            "provider":    provider,
            "provider_id": provider_id,
            "email":       email,
            "nickname":    nickname,
            "last_login":  datetime.now(timezone.utc).isoformat(),
        })
        if rows:
            return rows[0].get("id", provider_id)
    except Exception as e:
        logger.warning(f"users upsert 실패: {type(e).__name__}")
    return provider_id


# ─── /me ────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(request: Request):
    token = request.cookies.get("alitrack_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    try:
        payload = verify_access_token(token)
        return {
            "user_id":   payload["sub"],
            "email":     payload.get("email"),
            "provider":  payload.get("provider", ""),
            "nickname":  payload.get("nickname", ""),
            "logged_in": True,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")


# ─── 로그아웃 ────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("alitrack_token")
    response.delete_cookie("alitrack_refresh")
    return {"ok": True}


# ─── 토큰 갱신 ──────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(response: Response, alitrack_refresh: str | None = Cookie(default=None)):
    if not alitrack_refresh:
        raise HTTPException(status_code=401, detail="Refresh 토큰이 없습니다.")
    try:
        from jose import jwt
        payload = jwt.decode(alitrack_refresh, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise ValueError()
        new_at = create_access_token(payload["sub"], payload.get("email", ""), "email",
                                     payload.get("nickname", ""))
        response.set_cookie("alitrack_token", new_at, max_age=3600,
                            httponly=True, secure=True, samesite="lax")
        return {"ok": True}
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다. 다시 로그인해주세요.")


# ─── 이메일 회원가입 / 로그인 ───────────────────────────────────────
class EmailAuthBody(BaseModel):
    email:    str
    password: str


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email))


@router.post("/email/register")
async def email_register(body: EmailAuthBody):
    """이메일 + 비밀번호 회원가입 — 비밀번호는 Supabase Auth가 관리"""
    if not _validate_email(body.email):
        raise HTTPException(status_code=400, detail="유효하지 않은 이메일 형식입니다.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")

    # Supabase Auth에 사용자 생성 (이미 존재하면 409)
    auth_user = await _sb_auth_create_user(body.email, body.password)
    auth_id   = auth_user.get("id", "")
    nickname  = body.email.split("@")[0]

    user_id = await _upsert_user("email", auth_id, body.email, nickname)
    token   = create_access_token(user_id, body.email, "email", nickname)
    logger.info(f"이메일 가입: {body.email[:4]}***")
    return {"ok": True, "token": token, "email": body.email, "provider": "email", "user_id": user_id}


@router.post("/email/login")
async def email_login(body: EmailAuthBody):
    """이메일 + 비밀번호 로그인 — Supabase Auth로 검증"""
    if not _validate_email(body.email):
        raise HTTPException(status_code=400, detail="유효하지 않은 이메일 형식입니다.")

    # Supabase Auth로 비밀번호 검증
    await _sb_auth_login(body.email, body.password)

    # public.users에서 사용자 정보 조회
    rows = await sb_select("users",
                           filters={"email": f"eq.{body.email}", "provider": "eq.email"},
                           limit=1)
    if rows:
        user     = rows[0]
        user_id  = user.get("id", "")
        nickname = user.get("nickname", body.email.split("@")[0])
    else:
        # 드물게 users 테이블에 없으면 생성
        nickname = body.email.split("@")[0]
        user_id  = await _upsert_user("email", "", body.email, nickname)

    token = create_access_token(user_id, body.email, "email", nickname)
    logger.info(f"이메일 로그인: {body.email[:4]}***")
    return {"ok": True, "token": token, "email": body.email, "provider": "email", "user_id": user_id}
