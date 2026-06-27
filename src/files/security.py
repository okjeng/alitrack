"""
src/middleware/security.py
보안 헤더 미들웨어

적용되는 헤더:
  - X-Content-Type-Options   : MIME 스니핑 방지
  - X-Frame-Options          : 클릭재킹 방지
  - X-XSS-Protection         : 구형 브라우저 XSS 필터
  - Content-Security-Policy  : 스크립트·리소스 출처 제한
  - Strict-Transport-Security: HTTPS 강제 (HSTS)
  - Referrer-Policy          : 리퍼러 정보 최소화
  - Permissions-Policy       : 카메라·마이크 등 권한 차단
  - Cache-Control            : 민감 응답 캐싱 방지
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # MIME 스니핑 방지 — 브라우저가 Content-Type을 임의로 바꾸지 못하게
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 클릭재킹 방지 — iframe 내 로드 금지
        response.headers["X-Frame-Options"] = "DENY"

        # 구형 브라우저 XSS 필터 활성화
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # CSP — 허용된 출처의 스크립트·스타일만 실행
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "   # React 인라인 스크립트 허용
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https://placehold.co https://ae01.alicdn.com; "
            "connect-src 'self' https://api.aliexpress.com; "
            "frame-ancestors 'none';"
        )

        # HSTS — 1년간 HTTPS만 허용, 서브도메인 포함
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains; preload"
        )

        # 리퍼러 최소화 — 외부 사이트로 URL 정보 최소 노출
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 브라우저 기능 제한 — 불필요한 권한 전면 차단
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), bluetooth=()"
        )

        # 민감한 API 응답 캐싱 방지
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        # 서버 정보 숨김 (기본적으로 "uvicorn" 등이 노출될 수 있음)
        response.headers.pop("Server", None)
        response.headers.pop("X-Powered-By", None)

        return response
