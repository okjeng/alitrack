"""
src/utils/auth.py
JWT 토큰 생성·검증 유틸리티

[보안 원칙]
- JWT_SECRET은 .env에서만 로드, 소스코드 하드코딩 금지
- 토큰은 HttpOnly 쿠키로만 전달 (JS에서 접근 불가 → XSS 탈취 방지)
- 토큰 만료 시간 엄격 적용
- Refresh 토큰과 Access 토큰 분리
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt

from src.config.settings import settings

logger = logging.getLogger("alitrack.auth")


def create_access_token(user_id: str, email: str, provider: str = "") -> str:
    """Access Token 생성 (짧은 만료: 1시간)"""
    payload = {
        "sub":      user_id,
        "email":    email,
        "provider": provider,
        "type":     "access",
        "iat":      datetime.now(timezone.utc),
        "exp":      datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Refresh Token 생성 (긴 만료: 7일)"""
    payload = {
        "sub":  user_id,
        "type": "refresh",
        "iat":  datetime.now(timezone.utc),
        "exp":  datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> dict:
    """Access Token 검증 — 실패 시 401 예외"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰 유형입니다.")
        return payload
    except JWTError as e:
        logger.warning(f"토큰 검증 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다. 다시 로그인해주세요.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_token_optional(
    access_token: Optional[str] = Cookie(None, alias="alitrack_token"),
) -> Optional[dict]:
    """
    선택적 토큰 검증 — 로그인 없이도 접근 가능한 엔드포인트용
    토큰이 있으면 검증, 없으면 None 반환
    """
    if not access_token:
        return None
    try:
        return verify_access_token(access_token)
    except HTTPException:
        return None


async def require_auth(
    access_token: Optional[str] = Cookie(None, alias="alitrack_token"),
) -> dict:
    """
    필수 인증 — 로그인이 반드시 필요한 엔드포인트용
    쿠키에서 토큰 읽기 (Authorization 헤더 미사용 → XSS 탈취 방지)
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요한 기능입니다.",
        )
    return verify_access_token(access_token)
