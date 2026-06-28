"""
src/routes/auth.py — 소셜 로그인 (카카오 / 네이버 / 구글)

흐름:
  1) 프론트: window.location.href = /api/auth/{provider}/login
  2) 백엔드: 소셜 OAuth 페이지로 리다이렉트
  3) 콜백:  소셜 토큰 교환 → 사용자 Supabase upsert → JWT 발급
  4) 백엔드: FRONTEND_URL?login=ok 로 리다이렉트
  5) 프론트: /api/auth/me 호출로 로그인 상태 확인
"""

import secrets
import httpx
import logging
import re
from datetime import datetime, timezone
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Response, Query, Cookie, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr

from src.config.settings import settings
from src.utils.auth import create_access_token, create_refresh_token, verify_access_token
from src.utils.supabase_client import sb_upsert, sb_select

logger = logging.getLogger("alitrack.auth")
router = APIRouter()


def _mask_err(e: Exception) -> str:
    """예외 메시지에서 URL/토큰/키 노출 없이 타입+요약만 반환"""
    msg = str(e)
    # httpx 요청 예외는 URL에 코드/토큰이 포함될 수 있음 — 타입만 기록
    if "httpx" in type(e).__module__:
        return f"{type(e).__name__} (외부 API 통신 오류)"
    # 토큰/코드 패턴 마스킹
    import re
    msg = re.sub(r"(code|token|secret|key|password)=[A-Za-z0-9+/_.%-]{4,}", r"\1=***", msg, flags=re.I)
    return f"{type(e).__name__}: {msg[:120]}"

# 쿠키 보안 설정
_COOKIE_BASE = dict(httponly=True, secure=True, samesite="lax")


def _cookie_opts(**extra):
    return {**_COOKIE_BASE, **extra}


def _set_auth_cookies(response: Response, user_id: str, email: str):
    at = create_access_token(user_id, email)
    rt = create_refresh_token(user_id)
    response.set_cookie("alitrack_token",   at, max_age=3600,           **_cookie_opts())
    response.set_cookie("alitrack_refresh", rt, max_age=3600 * 24 * 7,
                        path="/api/auth/refresh", **_cookie_opts())


async def _upsert_user(provider: str, provider_id: str, email: str,
                       nickname: str = "", profile_image: str = "") -> str:
    """Supabase users 테이블에 upsert 후 UUID 반환"""
    try:
        rows = await sb_upsert("users", {
            "provider":      provider,
            "provider_id":   provider_id,
            "email":         email,
            "nickname":      nickname,
            "profile_image": profile_image,
            "last_login":    datetime.now(timezone.utc).isoformat(),
        })
        if rows:
            return rows[0].get("id", provider_id)
    except Exception as e:
        logger.warning(f"users upsert 실패 (계속 진행): {e}")
    return provider_id


def _success_redirect(response: Response, user_id: str, email: str, provider: str = "") -> RedirectResponse:
    at = create_access_token(user_id, email, provider)
    resp = RedirectResponse(url=f"{settings.FRONTEND_URL}#tok={at}")
    resp.delete_cookie("oauth_state")
    return resp


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
            "logged_in": True,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")


# ─── 카카오 ─────────────────────────────────────────────────────────
@router.get("/kakao/login")
async def kakao_login():
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="카카오 로그인 준비 중입니다.")
    state = secrets.token_urlsafe(32)
    # account_email: 카카오 개발자 콘솔에서 "카카오계정(이메일)" 동의항목 활성화 필요
    url = "https://kauth.kakao.com/oauth/authorize?" + urlencode({
        "client_id":     settings.KAKAO_CLIENT_ID,
        "redirect_uri":  settings.KAKAO_REDIRECT_URI,
        "response_type": "code",
        "state":         state,
        "scope":         "profile_nickname,account_email",
    })
    resp = RedirectResponse(url=url)
    resp.set_cookie("oauth_state", state, max_age=600, httponly=False, secure=True, samesite="none")
    return resp


@router.get("/kakao/callback")
async def kakao_callback(
    code:  str = Query(...),
    state: str = Query(default=""),
    oauth_state: str | None = Cookie(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
):
    if error:
        logger.error(f"카카오 OAuth 에러: {error} - {error_description}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?login=fail&reason={error}")

    if oauth_state and state and not secrets.compare_digest(state, oauth_state):
        logger.warning(f"CSRF state 불일치 (계속 진행): got={state[:8]}.. expected={oauth_state[:8]}..")

    logger.info(f"카카오 콜백 수신: code={code[:8]}.. state={state[:8]}..")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tr = await client.post("https://kauth.kakao.com/oauth/token", data={
                "grant_type":    "authorization_code",
                "client_id":     settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri":  settings.KAKAO_REDIRECT_URI,
                "code":          code,
            })
            token_data  = tr.json()
            kakao_token = token_data.get("access_token")

            if not kakao_token:
                logger.error(f"카카오 토큰 교환 실패: {token_data}")
                raise HTTPException(status_code=502, detail="카카오 토큰 발급 실패")

            ur = await client.get("https://kapi.kakao.com/v2/user/me",
                                  headers={"Authorization": f"Bearer {kakao_token}"})
            ud = ur.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"카카오 로그인 오류: {_mask_err(e)}")
        raise HTTPException(status_code=502, detail="카카오 로그인에 실패했습니다.")

    # ── 카카오 응답 전체 로그 (이메일 매핑 디버그용) ──────────────────
    provider_id = str(ud.get("id", ""))
    account     = ud.get("kakao_account", {})
    profile     = account.get("profile", {})

    logger.info(
        f"[Kakao 사용자 정보] "
        f"id={provider_id} | "
        f"has_email={account.get('has_email')} | "
        f"email_needs_agreement={account.get('email_needs_agreement')} | "
        f"email={account.get('email', '(없음)')} | "
        f"nickname={profile.get('nickname', '(없음)')} | "
        f"kakao_account_keys={list(account.keys())}"
    )

    # ── 이메일 추출 — 동의 여부 확인 후 안전하게 매핑 ─────────────────
    email = ""
    has_email         = account.get("has_email", False)
    needs_agreement   = account.get("email_needs_agreement", True)
    kakao_email       = account.get("email", "")

    if has_email and not needs_agreement and kakao_email:
        email = kakao_email
        logger.info(f"[Kakao 이메일 확정] {email}")
    else:
        # 이메일 동의 안 했거나 없음 — @alitrack.kr 가짜 주소 저장 금지
        # provider_id 기반 내부 식별자로 대체 (표시용으로만 사용)
        if provider_id:
            email = f"kakao_{provider_id}@kakao.local"
        else:
            logger.error(f"[Kakao] provider_id 없음. 응답 전체: {ud}")
            raise HTTPException(status_code=502, detail="카카오 사용자 정보를 가져오지 못했습니다.")
        logger.warning(
            f"[Kakao 이메일 없음] "
            f"has_email={has_email}, needs_agreement={needs_agreement}, "
            f"kakao_email='{kakao_email}' → 내부 식별자 사용: {email}"
        )

    nickname = profile.get("nickname", "")
    avatar   = profile.get("profile_image_url", "")

    logger.info(f"[Kakao 최종] provider_id={provider_id}, email={email}, nickname={nickname}")

    user_id = await _upsert_user("kakao", provider_id, email, nickname, avatar)
    return _success_redirect(Response(), user_id, email, "kakao")


# ─── 네이버 ─────────────────────────────────────────────────────────
@router.get("/naver/login")
async def naver_login():
    if not settings.NAVER_CLIENT_ID:
        raise HTTPException(status_code=503, detail="네이버 로그인 준비 중입니다.")
    state = secrets.token_urlsafe(32)
    url = "https://nid.naver.com/oauth2.0/authorize?" + urlencode({
        "response_type": "code",
        "client_id":     settings.NAVER_CLIENT_ID,
        "redirect_uri":  settings.NAVER_REDIRECT_URI,
        "state":         state,
    })
    resp = RedirectResponse(url=url)
    resp.set_cookie("oauth_state", state, max_age=300, **_cookie_opts())
    return resp


@router.get("/naver/callback")
async def naver_callback(
    code:  str = Query(...),
    state: str = Query(...),
    oauth_state: str | None = Cookie(default=None),
):
    if not oauth_state or not secrets.compare_digest(state, oauth_state):
        raise HTTPException(status_code=400, detail="유효하지 않은 요청입니다.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tr = await client.post("https://nid.naver.com/oauth2.0/token", data={
                "grant_type":    "authorization_code",
                "client_id":     settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_CLIENT_SECRET,
                "redirect_uri":  settings.NAVER_REDIRECT_URI,
                "code":          code,
                "state":         state,
            })
            naver_token = tr.json().get("access_token")

            ur = await client.get("https://openapi.naver.com/v1/nid/me",
                                  headers={"Authorization": f"Bearer {naver_token}"})
            ud = ur.json().get("response", {})
    except Exception as e:
        logger.error(f"네이버 로그인 오류: {_mask_err(e)}")
        raise HTTPException(status_code=502, detail="네이버 로그인에 실패했습니다.")

    provider_id = ud.get("id", "")
    email       = ud.get("email", f"naver_{provider_id}@alitrack.kr")
    nickname    = ud.get("nickname", ud.get("name", ""))
    avatar      = ud.get("profile_image", "")

    user_id = await _upsert_user("naver", provider_id, email, nickname, avatar)
    return _success_redirect(Response(), user_id, email, "naver")


# ─── 구글 ─────────────────────────────────────────────────────────
@router.get("/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="구글 로그인 준비 중입니다.")
    state = secrets.token_urlsafe(32)
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id":     settings.GOOGLE_CLIENT_ID,
        "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "state":         state,
        "access_type":   "online",
    })
    resp = RedirectResponse(url=url)
    resp.set_cookie("oauth_state", state, max_age=300, **_cookie_opts())
    return resp


@router.get("/google/callback")
async def google_callback(
    code:  str = Query(...),
    state: str = Query(...),
    oauth_state: str | None = Cookie(default=None),
):
    if not oauth_state or not secrets.compare_digest(state, oauth_state):
        raise HTTPException(status_code=400, detail="유효하지 않은 요청입니다.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            tr = await client.post("https://oauth2.googleapis.com/token", data={
                "grant_type":    "authorization_code",
                "client_id":     settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri":  settings.GOOGLE_REDIRECT_URI,
                "code":          code,
            })
            google_token = tr.json().get("access_token")

            ur = await client.get("https://www.googleapis.com/oauth2/v2/userinfo",
                                  headers={"Authorization": f"Bearer {google_token}"})
            ud = ur.json()
    except Exception as e:
        logger.error(f"구글 로그인 오류: {_mask_err(e)}")
        raise HTTPException(status_code=502, detail="구글 로그인에 실패했습니다.")

    provider_id = ud.get("id", "")
    email       = ud.get("email", f"google_{provider_id}@alitrack.kr")
    nickname    = ud.get("name", "")
    avatar      = ud.get("picture", "")

    user_id = await _upsert_user("google", provider_id, email, nickname, avatar)
    return _success_redirect(Response(), user_id, email, "google")


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
        email   = payload.get("email", f"user_{user_id}@alitrack.kr")
        new_at  = create_access_token(user_id, email)
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
    from passlib.hash import bcrypt
    return bcrypt.hash(password)


def _verify_pw(plain: str, hashed: str) -> bool:
    from passlib.hash import bcrypt
    try:
        return bcrypt.verify(plain, hashed)
    except Exception:
        return False


@router.post("/email/register")
async def email_register(body: EmailAuthBody):
    """이메일 + 비밀번호 회원가입"""
    if not _validate_email(body.email):
        raise HTTPException(status_code=400, detail="유효하지 않은 이메일 형식입니다.")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")

    # 중복 이메일 확인
    existing = await sb_select("users", filters={"email": f"eq.{body.email}", "provider": "eq.email"}, limit=1)
    if existing:
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다. 로그인해주세요.")

    password_hash = _hash_pw(body.password)
    provider_id   = secrets.token_hex(16)

    try:
        rows = await sb_upsert("users", {
            "provider":      "email",
            "provider_id":   provider_id,
            "email":         body.email,
            "nickname":      body.email.split("@")[0],
            "profile_image": "",
            "last_login":    datetime.now(timezone.utc).isoformat(),
            "password_hash": password_hash,
        })
        user_id = rows[0].get("id", provider_id) if rows else provider_id
    except Exception as e:
        logger.error(f"이메일 가입 오류: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="회원가입에 실패했습니다.")

    token = create_access_token(user_id, body.email, "email")
    return {"ok": True, "token": token, "email": body.email, "provider": "email"}


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

    user_id = user.get("id", "")
    token   = create_access_token(user_id, body.email, "email")
    return {"ok": True, "token": token, "email": body.email, "provider": "email"}
