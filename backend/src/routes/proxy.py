"""
src/routes/proxy.py
서버사이드 프록시 — 알리 API 키를 클라이언트에 절대 노출하지 않음

[보안 원칙]
- 모든 알리 API 호출은 이 서버를 통해서만 이루어짐
- APP_KEY, APP_SECRET은 서버 메모리(.env)에만 존재
- 클라이언트는 /api/ali/... 만 호출하며, 실제 알리 API URL은 모름
- 응답에서 민감한 필드(seller_id 등) 제거 후 반환
"""

import time
import hmac
import hashlib
import httpx
import logging
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import JSONResponse

from src.config.settings import settings
from src.utils.auth      import verify_token_optional
from src.utils.cache     import cache_response

logger = logging.getLogger("alitrack.proxy")
router = APIRouter()

ALI_API_BASE = "https://api-sg.aliexpress.com/sync"


def _build_ali_signature(params: dict, secret: str) -> str:
    """
    알리 Portals API 서명 - HMAC-MD5 방식 (sign_method=hmac)
    HMAC-MD5(key=secret, msg=sorted_k1v1k2v2...)  wrapping 없음
    """
    excluded = {"sign", "sign_method"}
    sorted_params = sorted((k, v) for k, v in params.items() if k not in excluded)
    params_str = "".join(f"{k}{v}" for k, v in sorted_params)
    return hmac.new(
        secret.encode("utf-8"),
        params_str.encode("utf-8"),
        hashlib.md5,
    ).hexdigest().upper()


def _build_common_params(method: str, extra: dict) -> dict:
    """알리 API 공통 파라미터 조립 (APP_KEY는 서버에서만 주입)"""
    params = {
        "app_key":    settings.ALI_APP_KEY,    # ← .env에서만
        "method":     method,
        "timestamp":  str(int(time.time())),
        "sign_method":"hmac",
        "format":     "json",
        "v":          "2.0",
        **extra,
    }
    params["sign"] = _build_ali_signature(params, settings.ALI_APP_SECRET)
    return params


def _sanitize_product(raw: dict) -> dict:
    """
    알리 API 응답에서 민감 필드 제거 후 필요한 필드만 반환
    → 판매자 정보, 내부 ID 등 노출 방지
    """
    return {
        "id":            raw.get("product_id", ""),
        "name":          raw.get("product_title", ""),
        "price":         raw.get("target_sale_price", 0),
        "orig_price":    raw.get("target_original_price", 0),
        "discount":      raw.get("discount", 0),
        "image":         raw.get("product_main_image_url", ""),
        "rating":        raw.get("evaluate_rate", 0),
        "reviews":       raw.get("lastest_volume", 0),
        "delivery_days": 5,  # 기본값, 실제 배송 API 연동 시 교체
        # ❌ 제거 필드: seller_id, shop_id, commission_rate, affiliate_link 등
    }


@router.get("/products")
@cache_response(ttl=300)   # 5분 캐시 (알리 서버 부하 감소)
async def get_products(
    page:    int   = Query(1,  ge=1,  le=100),
    size:    int   = Query(20, ge=1,  le=50),
    keyword: str   = Query("", max_length=100),
    sort:    str   = Query("default"),
    _user              = Depends(verify_token_optional),   # 로그인 여부 확인 (선택)
):
    """핫딜 상품 목록 조회 — 알리 API 프록시"""
    params = _build_common_params(
        method="aliexpress.affiliate.hotproduct.query",
        extra={
            "tracking_id":    settings.ALI_TRACKING_ID,
            "page_no":        str(page),
            "page_size":      str(size),
            "keywords":       keyword,
            "sort":           sort,
            "target_currency":"KRW",
            "target_language":"ko",
            "country":        "KR",
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ALI_API_BASE, data=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="알리 서버 응답 시간이 초과되었습니다.")
    except httpx.HTTPStatusError as e:
        logger.error(f"알리 API 오류: {e.response.status_code}")
        raise HTTPException(status_code=502, detail="외부 서비스 오류가 발생했습니다.")
    except Exception as e:
        logger.error(f"프록시 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")

    # 에러 응답 — Access Token 승인 대기 중일 때는 빈 결과로 정상 응답
    if "error_response" in data:
        err = data["error_response"]
        logger.warning(f"AliExpress API 오류 (빈 결과 반환): {err.get('code')} - {err.get('msg')}")
        return {"products": [], "page": page, "size": size, "api_pending": True}

    # 정상 응답 파싱
    root = data.get("aliexpress_affiliate_hotproduct_query_response", {})
    resp_result = root.get("resp_result", {})
    resp_code = resp_result.get("resp_code", root.get("resp_code", -1))

    if resp_code not in (0, "0", 200, "200"):
        logger.warning(f"AliExpress resp_code 오류 (빈 결과 반환): code={resp_code}")
        return {"products": [], "page": page, "size": size, "api_pending": True}

    raw_products = (
        resp_result.get("result", {})
                   .get("products", {})
                   .get("product", [])
    )
    products = [_sanitize_product(p) for p in raw_products]

    return {"products": products, "page": page, "size": size}


@router.get("/product/{product_id}")
@cache_response(ttl=180)   # 3분 캐시
async def get_product_detail(product_id: str):
    """단일 상품 상세 조회"""
    # product_id 형식 검증 (숫자만 허용)
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")

    params = _build_common_params(
        method="aliexpress.affiliate.product.detail.get",
        extra={
            "tracking_id":    settings.ALI_TRACKING_ID,
            "product_id":     product_id,
            "target_currency":"KRW",
            "target_language":"ko",
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ALI_API_BASE, data=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.warning(f"상품 상세 조회 오류 (빈 결과 반환): {e}")
        return _sanitize_product({})

    if "error_response" in data:
        logger.warning(f"AliExpress 상품 상세 오류: {data['error_response'].get('code')}")
        return _sanitize_product({})

    raw = (
        data.get("aliexpress_affiliate_product_detail_get_response", {})
            .get("resp_result", {})
            .get("result", {})
    )
    return _sanitize_product(raw)


@router.get("/affiliate-link/{product_id}")
async def get_affiliate_link(product_id: str):
    """
    제휴 딥링크 생성 — 수수료 추적 URL 생성
    클라이언트가 APP_KEY 없이 제휴 링크를 만들 수 없도록 서버에서 생성
    """
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")

    source_url = f"https://www.aliexpress.com/item/{product_id}.html"
    params = _build_common_params(
        method="aliexpress.affiliate.link.generate",
        extra={
            "tracking_id":    settings.ALI_TRACKING_ID,
            "promotion_link_type": "0",
            "source_values":  source_url,
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ALI_API_BASE, data=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"제휴 링크 생성 오류: {e}")
        # 폴백: 기본 알리 링크 반환
        return {"url": source_url, "is_affiliate": False}

    promotion_link = (
        data.get("aliexpress_affiliate_link_generate_response", {})
            .get("resp_result", {})
            .get("result", {})
            .get("promotion_links", {})
            .get("promotion_link", [{}])[0]
            .get("promotion_link", source_url)
    )

    return {"url": promotion_link, "is_affiliate": True}
