"""
src/routes/auth.py
소셜 로그인 라우터 (카카오 / 네이버 / 구글)

[보안 원칙]
- 토큰을 JS로 접근 불가한 HttpOnly + Secure + SameSite 쿠키에만 저장
- LocalStorage/SessionStorage 사용 금지 (XSS에 취약)
- CSRF 방지를 위한 state 파라미터 사용
- 소셜 client_secret은 .env에서만 로드
"""

import secrets
import httpx
import logging
from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import RedirectResponse

from src.config.settings import settings
from src.utils.auth      import create_access_token, create_refresh_token

logger = logging.getLogger("alitrack.auth")
router = APIRouter()

# 쿠키 공통 설정
COOKIE_CONFIG = {
    "httponly": True,     # JS 접근 완전 차단 → XSS 방지
    "secure":   True,     # HTTPS에서만 전송
    "samesite": "lax",    # CSRF 방지
    "domain":   "alitrack.kr",
}


def _set_auth_cookies(response: Response, user_id: str, email: str):
    """Access + Refresh 토큰을 HttpOnly 쿠키에 설정"""
    access_token  = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(
        key="alitrack_token",
        value=access_token,
        max_age=3600,           # 1시간
        **COOKIE_CONFIG,
    )
    response.set_cookie(
        key="alitrack_refresh",
        value=refresh_token,
        max_age=60 * 60 * 24 * 7,  # 7일
        path="/api/auth/refresh",   # Refresh 엔드포인트에서만 전송
        **COOKIE_CONFIG,
    )


# ─── 카카오 로그인 ────────────────────────────────────────────────
@router.get("/kakao/login")
async def kakao_login():
    """카카오 OAuth 시작 — state로 CSRF 방지"""
    state = secrets.token_urlsafe(32)
    kakao_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
        f"&state={state}"
    )
    resp = RedirectResponse(url=kakao_url)
    # state를 쿠키에 저장해서 콜백 시 검증
    resp.set_cookie("oauth_state", state, max_age=300, httponly=True, secure=True, samesite="lax")
    return resp


@router.get("/kakao/callback")
async def kakao_callback(
    code:  str = Query(...),
    state: str = Query(...),
    oauth_state: str = None,
):
    """카카오 콜백 처리"""
    # CSRF state 검증
    if not secrets.compare_digest(state, oauth_state or ""):
        raise HTTPException(status_code=400, detail="유효하지 않은 요청입니다.")

    # 카카오 토큰 교환
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type":   "authorization_code",
                    "client_id":    settings.KAKAO_CLIENT_ID,
                    "redirect_uri": settings.KAKAO_REDIRECT_URI,
                    "code":         code,
                },
            )
            token_data = token_resp.json()
            kakao_token = token_data.get("access_token")

            # 카카오 사용자 정보 조회
            user_resp = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {kakao_token}"},
            )
            user_data = user_resp.json()
    except Exception as e:
        logger.error(f"카카오 로그인 오류: {e}")
        raise HTTPException(status_code=502, detail="카카오 로그인에 실패했습니다.")

    kakao_id = str(user_data.get("id", ""))
    email    = user_data.get("kakao_account", {}).get("email", f"kakao_{kakao_id}@alitrack.kr")

    # TODO: DB에 사용자 Upsert
    # user = await upsert_user(provider="kakao", provider_id=kakao_id, email=email)

    response = RedirectResponse(url="https://alitrack.kr")
    _set_auth_cookies(response, user_id=kakao_id, email=email)
    response.delete_cookie("oauth_state")  # 사용한 state 즉시 삭제
    return response


# ─── 로그아웃 ─────────────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    """로그아웃 — 모든 인증 쿠키 즉시 삭제"""
    response.delete_cookie("alitrack_token",   domain="alitrack.kr")
    response.delete_cookie("alitrack_refresh", domain="alitrack.kr")
    return {"message": "로그아웃되었습니다."}


# ─── 토큰 갱신 ────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(
    response:      Response,
    refresh_token: str = None,
):
    """Refresh Token으로 Access Token 갱신"""
    from src.utils.auth import verify_access_token
    from jose import JWTError, jwt

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh 토큰이 없습니다.")

    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

        user_id = payload["sub"]
        # TODO: DB에서 email 조회
        email = f"user_{user_id}@alitrack.kr"

        new_access = create_access_token(user_id, email)
        response.set_cookie(
            key="alitrack_token",
            value=new_access,
            max_age=3600,
            **COOKIE_CONFIG,
        )
        return {"message": "토큰이 갱신되었습니다."}

    except Exception:
        raise HTTPException(status_code=401, detail="인증이 만료되었습니다. 다시 로그인해주세요.")
