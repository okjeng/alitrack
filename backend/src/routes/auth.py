"""
src/routes/auth.py — 이메일 회원가입 / 로그인

흐름:
  1) POST /api/auth/email/register — 이메일 + 비밀번호로 가입
  2) POST /api/auth/email/login    — 이메일 + 비밀번호로 로그인
  3) GET  /api/auth/me             — 저장된 토큰으로 로그인 상태 확인
  4) POST /api/auth/logout         — 로그아웃
"""

import secrets
import logging
import re
import hashlib
import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Response, Request, Cookie
from pydantic import BaseModel

from src.config.settings import settings
from src.utils.auth import create_access_token, create_refresh_token, verify_access_token
from src.utils.supabase_client import sb_upsert, sb_select

logger = logging.getLogger("alitrack.auth")
router = APIRouter()

# 쿠키 보안 설정
_COOKIE_BASE = dict(httponly=True, secure=True, samesite="lax")

def _cookie_opts(**extra):
    return {**_COOKIE_BASE, **extra}


# ─── /me — 현재 로그인 상태 확인 ────────────────────────────────────
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
            "user_id":  payload["sub"],
            "email":    payload.get("email"),
            "provider": payload.get("provider", ""),
            "nickname": payload.get("nickname", ""),
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


# ─── 토큰 갱신 ───────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(response: Response, alitrack_refresh: str | None = Cookie(default=None)):
    if not alitrack_refresh:
        raise HTTPException(status_code=401, detail="Refresh 토큰이 없습니다.")
    try:
        from jose import jwt
        payload = jwt.decode(alitrack_refresh, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise ValueError()
        user_id = payload["sub"]
        email   = payload.get("email", "")
        new_at  = create_access_token(user_id, email, "email")
        response.set_cookie("alitrack_token", new_at, max_age=3600, **_cookie_opts())
        return {"ok": True}
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다. 다시 로그인해주세요.")


# ─── 이메일 회원가입 / 로그인 ───────────────────────────────────────
class EmailAuthBody(BaseModel):
    email:    str
    password: str


def _validate_email(email: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email))


def _hash_pw(password: str) -> str:
    salt = os.urandom(32)
    key  = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000)
    return salt.hex() + ":" + key.hex()


def _verify_pw(plain: str, hashed: str) -> bool:
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        key  = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 260000)
        return key.hex() == key_hex
    except Exception:
        return False


async def _upsert_user(provider: str, provider_id: str, email: str,
                       nickname: str = "", password_hash: str = "") -> str:
    # 1차 시도: password_hash 포함
    for attempt, data in enumerate([
        {"provider": provider, "provider_id": provider_id, "email": email,
         "nickname": nickname, "password_hash": password_hash,
         "last_login": datetime.now(timezone.utc).isoformat()},
        # 2차: password_hash 컬럼 없을 때 폴백
        {"provider": provider, "provider_id": provider_id, "email": email,
         "nickname": nickname,
         "last_login": datetime.now(timezone.utc).isoformat()},
    ]):
        try:
            rows = await sb_upsert("users", data)
            if rows:
                return rows[0].get("id", provider_id)
        except Exception as e:
            logger.warning(f"users upsert 실패 (attempt {attempt+1}): {type(e).__name__}")
    return provider_id


@router.post("/email/register")
async def email_register(body: EmailAuthBody):
    """이메일 + 비밀번호 회원가입"""
    if not _validate_email(body.email):
        raise HTTPException(status_code=400, detail="유효하지 않은 이메일 형식입니다.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")

    existing = await sb_select("users", filters={"email": f"eq.{body.email}", "provider": "eq.email"}, limit=1)
    if existing:
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다. 로그인해주세요.")

    password_hash = _hash_pw(body.password)
    provider_id   = secrets.token_hex(16)
    nickname      = body.email.split("@")[0]

    user_id = await _upsert_user("email", provider_id, body.email, nickname, password_hash)

    token = create_access_token(user_id, body.email, "email", nickname)
    logger.info(f"이메일 가입: {body.email[:4]}***")
    return {"ok": True, "token": token, "email": body.email, "provider": "email", "user_id": user_id}


@router.post("/email/login")
async def email_login(body: EmailAuthBody):
    """이메일 + 비밀번호 로그인"""
    if not _validate_email(body.email):
        raise HTTPException(status_code=400, detail="유효하지 않은 이메일 형식입니다.")

    rows = await sb_select("users", filters={"email": f"eq.{body.email}", "provider": "eq.email"}, limit=1)
    if not rows:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    user = rows[0]
    if not _verify_pw(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    user_id  = user.get("id", "")
    nickname = user.get("nickname", body.email.split("@")[0])
    token    = create_access_token(user_id, body.email, "email", nickname)
    logger.info(f"이메일 로그인: {body.email[:4]}***")
    return {"ok": True, "token": token, "email": body.email, "provider": "email", "user_id": user_id}
