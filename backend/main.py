"""
AliTrack 백엔드 서버 — main.py
Production-ready Security 적용 완료

실행 방법:
  pip install -r requirements.txt
  uvicorn main:app --host 0.0.0.0 --port 8000
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from src.middleware.security    import SecurityHeadersMiddleware
from src.middleware.rate_limit  import RateLimitMiddleware
from src.middleware.xss_filter  import XSSFilterMiddleware
from src.routes.products        import router as products_router
from src.routes.proxy           import router as proxy_router
from src.routes.auth            import router as auth_router
from src.config.settings        import settings

# ─── 로거 설정 ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("alitrack")

# ─── 앱 생명주기 ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AliTrack 서버 시작")
    yield
    logger.info("🛑 AliTrack 서버 종료")

# ─── FastAPI 앱 ───────────────────────────────────────────────────
app = FastAPI(
    title="AliTrack API",
    version="1.0.0",
    docs_url=None,          # 운영환경에서 Swagger UI 비활성화
    redoc_url=None,         # 운영환경에서 ReDoc 비활성화
    openapi_url=None,       # 운영환경에서 OpenAPI 스키마 비활성화
    lifespan=lifespan,
)

# ─── 미들웨어 등록 (순서 중요: 바깥→안쪽 순) ─────────────────────

# 1. 신뢰할 호스트만 허용 (Host 헤더 스푸핑 방지)
_hosts = [h.strip() for h in settings.ALLOWED_HOSTS.split(",") if h.strip()]
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=_hosts,
)

# 2. CORS — 허용된 출처만
_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
_credentials = "*" not in _origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r".*" if "*" in _origins else None,
    allow_credentials=_credentials,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    expose_headers=["X-RateLimit-Remaining"],
    max_age=600,
)

# 3. 보안 헤더 (XSS·클릭재킹·MIME 스니핑 방지)
app.add_middleware(SecurityHeadersMiddleware)

# 4. Rate Limit (IP당 요청 제한)
app.add_middleware(RateLimitMiddleware)

# 5. XSS 입력값 필터
app.add_middleware(XSSFilterMiddleware)

# ─── 라우터 등록 ──────────────────────────────────────────────────
app.include_router(products_router, prefix="/api/products", tags=["products"])
app.include_router(proxy_router,    prefix="/api/ali",      tags=["ali-proxy"])
app.include_router(auth_router,     prefix="/api/auth",     tags=["auth"])

# ─── 글로벌 예외 핸들러 ───────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 내부 에러 메시지를 클라이언트에 절대 노출하지 않음
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요."},
    )

# ─── 헬스체크 ─────────────────────────────────────────────────────
@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "timestamp": int(time.time())}


# ─── 임시 디버그 (배포 확인 후 삭제) ─────────────────────────────
@app.get("/debug/ali-raw", include_in_schema=False)
async def debug_ali_raw(keyword: str = "phone"):
    import time as _time
    import hmac as _hmac
    import hashlib as _hashlib
    import httpx as _httpx
    from src.config.settings import settings as _s

    params = {
        "app_key":    _s.ALI_APP_KEY,
        "method":     "aliexpress.affiliate.hotproduct.query",
        "timestamp":  str(int(_time.time() * 1000)),
        "sign_method":"sha256",
        "tracking_id": _s.ALI_TRACKING_ID,
        "page_no":    "1",
        "page_size":  "3",
        "keywords":   keyword,
        "sort":       "default",
        "target_currency": "KRW",
        "target_language": "ko",
        "country":    "KR",
    }
    sorted_params = sorted(params.items())
    sign_string = _s.ALI_APP_SECRET + "".join(f"{k}{v}" for k, v in sorted_params) + _s.ALI_APP_SECRET
    params["sign"] = _hmac.new(
        _s.ALI_APP_SECRET.encode("utf-8"),
        sign_string.encode("utf-8"),
        _hashlib.sha256,
    ).hexdigest().upper()

    async with _httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get("https://api-sg.aliexpress.com/sync", params=params)
        return resp.json()
