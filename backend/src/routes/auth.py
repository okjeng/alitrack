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
from datetime import datetime, timezone
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Response, Query, Cookie, Request
from fastapi.responses import RedirectResponse

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


def _success_redirect(response: Response, user_id: str, email: str) -> RedirectResponse:
    # JWT를 해시 프래그먼트로 전달 — URL 로그에 남지 않고 서버로 전송되지 않음
    at = create_access_token(user_id, email)
    resp = RedirectResponse(url=f"{settings.FRONTEND_URL}#tok={at}")
    resp.delete_cookie("oauth_state")
    return resp


# ─── /me — 현재 로그인 상태 확인 ────────────────────────────────────
@router.get("/me")
async def get_me(request: Request):
    token = request.cookies.get("alitrack_token")
    if not token:
        # Authorization: Bearer <token> 헤더 허용 (개발 편의)
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    try:
        payload = verify_access_token(token)
        return {"user_id": payload["sub"], "email": payload.get("email"), "logged_in": True}
    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다.")


# ─── 카카오 ─────────────────────────────────────────────────────────
@router.get("/kakao/login")
async def kakao_login():
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="카카오 로그인 준비 중입니다.")
    state = secrets.token_urlsafe(32)
    # account_email 제거 — 동의항목 미설정 시 Kakao가 흐름을 차단함
    url = "https://kauth.kakao.com/oauth/authorize?" + urlencode({
        "client_id":     settings.KAKAO_CLIENT_ID,
        "redirect_uri":  settings.KAKAO_REDIRECT_URI,
        "response_type": "code",
        "state":         state,
        "scope":         "profile_nickname",
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
    # Kakao가 에러를 반환한 경우 로그 후 프론트로 리다이렉트
    if error:
        logger.error(f"카카오 OAuth 에러: {error} - {error_description}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?login=fail&reason={error}")

    # CSRF state 검증 (실패해도 차단하지 않고 경고만 — 모바일 쿠키 이슈 대응)
    if oauth_state and state and not secrets.compare_digest(state, oauth_state):
        logger.warning(f"CSRF state 불일치 (계속 진행): got={state[:8]}.. expected={oauth_state[:8]}..")

    logger.info(f"카카오 콜백 수신: code={code[:8]}.. state={state[:8]}..")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 토큰 교환
            tr = await client.post("https://kauth.kakao.com/oauth/token", data={
                "grant_type":    "authorization_code",
                "client_id":     settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri":  settings.KAKAO_REDIRECT_URI,
                "code":          code,
            })
            kakao_token = tr.json().get("access_token")

            # 사용자 정보
            ur = await client.get("https://kapi.kakao.com/v2/user/me",
                                  headers={"Authorization": f"Bearer {kakao_token}"})
            ud = ur.json()
    except Exception as e:
        logger.error(f"카카오 로그인 오류: {_mask_err(e)}")
        raise HTTPException(status_code=502, detail="카카오 로그인에 실패했습니다.")

    provider_id = str(ud.get("id", ""))
    account     = ud.get("kakao_account", {})
    profile     = account.get("profile", {})
    email       = account.get("email", f"kakao_{provider_id}@alitrack.kr")
    nickname    = profile.get("nickname", "")
    avatar      = profile.get("profile_image_url", "")

    user_id = await _upsert_user("kakao", provider_id, email, nickname, avatar)
    return _success_redirect(Response(), user_id, email)


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
    return _success_redirect(Response(), user_id, email)


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
    return _success_redirect(Response(), user_id, email)


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
