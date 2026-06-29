"""
src/routes/proxy.py
서버사이드 프록시 — 알리 API 키를 클라이언트에 절대 노출하지 않음

[서명 방식]
- sign_method = sha256  (HMAC-SHA256)
- timestamp = Unix ms
- 파라미터 알파벳 정렬 후 key+value 연결, sign 제외
"""

import time
import hmac
import hashlib
import httpx
import logging
from fastapi import APIRouter, Query, HTTPException, Depends

from src.config.settings import settings
from src.utils.auth      import verify_token_optional
from src.utils.cache     import cache_response

logger = logging.getLogger("alitrack.proxy")
router = APIRouter()

ALI_API_BASE = "https://api-sg.aliexpress.com/sync"


def _build_ali_signature(params: dict, secret: str) -> str:
    """HMAC-SHA256 서명 — sign 파라미터 제외, 알파벳 정렬"""
    keys = sorted(k for k in params if k != "sign")
    params_str = "".join(k + str(params[k]) for k in keys)
    return hmac.new(
        secret.encode("utf-8"),
        params_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().upper()


def _build_common_params(method: str, extra: dict) -> dict:
    """알리 API 공통 파라미터 조립"""
    params = {
        "app_key":    settings.ALI_APP_KEY,
        "method":     method,
        "timestamp":  str(int(time.time() * 1000)),   # ms
        "sign_method":"sha256",
        "format":     "json",
        "v":          "2.0",
        **extra,
    }
    params["sign"] = _build_ali_signature(params, settings.ALI_APP_SECRET)
    return params


def _sanitize_product(raw: dict) -> dict:
    """응답 필드 정규화 — 민감 필드(seller_id 등) 제거"""
    try:
        price = int(float(raw.get("target_sale_price", 0)))
    except (ValueError, TypeError):
        price = 0
    try:
        orig = int(float(raw.get("target_original_price", 0) or raw.get("original_price", 0)))
    except (ValueError, TypeError):
        orig = price

    discount_raw = raw.get("discount", "0%")
    try:
        discount = int(str(discount_raw).replace("%", ""))
    except (ValueError, TypeError):
        discount = 0

    img_url = raw.get("product_main_image_url") or ""
    if img_url.startswith("http://"):
        img_url = "https://" + img_url[7:]

    return {
        "id":            str(raw.get("product_id", "")),
        "name":          raw.get("product_title", ""),
        "price":         price,
        "orig_price":    orig,
        "discount":      discount,
        "image":         img_url,
        "rating":        float(str(raw.get("evaluate_rate", "0") or "0").replace("%", "") or 0),
        "reviews":       int(raw.get("lastest_volume", 0) or 0),
        "delivery_days": 5,
        "affiliate_url": raw.get("product_detail_url") or raw.get("promotion_link", ""),
    }


@router.get("/products")
@cache_response(ttl=300)
async def get_products(
    page:    int   = Query(1,  ge=1,  le=100),
    size:    int   = Query(20, ge=1,  le=50),
    keyword: str   = Query("", max_length=100),
    sort:    str   = Query("default"),
    _user              = Depends(verify_token_optional),
):
    """상품 목록 조회 — aliexpress.affiliate.product.query"""
    # sort 파라미터 매핑
    sort_map = {
        "default":      "LAST_VOLUME_DESC",
        "price_asc":    "SALE_PRICE_ASC",
        "price_desc":   "SALE_PRICE_DESC",
        "discount":     "DISCOUNT_DESC",
    }
    ali_sort = sort_map.get(sort, "LAST_VOLUME_DESC")

    params = _build_common_params(
        method="aliexpress.affiliate.product.query",
        extra={
            "tracking_id":    settings.ALI_TRACKING_ID,
            "page_no":        str(page),
            "page_size":      str(size),
            "keywords":       keyword if keyword else "best seller",
            "sort":           ali_sort,
            "target_currency":"KRW",
            "target_language":"ko",
            "ship_to_country":"KR",
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ALI_API_BASE, data=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        logger.warning("알리 API 응답 타임아웃 — 빈 배열 반환")
        return {"products": [], "page": page, "size": size, "total": 0}
    except httpx.HTTPStatusError as e:
        logger.error(f"알리 API HTTP 오류: {e.response.status_code} — 빈 배열 반환")
        return {"products": [], "page": page, "size": size, "total": 0}
    except Exception as e:
        logger.error(f"프록시 오류: {e}", exc_info=True)
        return {"products": [], "page": page, "size": size, "total": 0}

    if "error_response" in data:
        err = data["error_response"]
        logger.error(f"AliExpress 오류: code={err.get('code')} msg={err.get('msg')}")
        return {"products": [], "page": page, "size": size, "total": 0}

    root = data.get("aliexpress_affiliate_product_query_response", {})
    resp_result = root.get("resp_result", {})
    resp_code = resp_result.get("resp_code", -1)

    if resp_code not in (200, "200"):
        logger.error(f"AliExpress resp_code={resp_code} msg={resp_result.get('resp_msg')}")
        return {"products": [], "page": page, "size": size, "total": 0}

    result = resp_result.get("result", {})
    raw_products = result.get("products", {}).get("product", [])
    products = [_sanitize_product(p) for p in raw_products]

    return {
        "products": products,
        "page":     page,
        "size":     size,
        "total":    result.get("total_record_count", len(products)),
    }


@router.get("/product/{product_id}")
@cache_response(ttl=180)
async def get_product_detail(product_id: str):
    """단일 상품 상세 조회"""
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
        logger.warning(f"상품 상세 조회 오류: {e}")
        return _sanitize_product({})

    if "error_response" in data:
        logger.warning(f"상품 상세 오류: {data['error_response'].get('code')}")
        return _sanitize_product({})

    raw = (
        data.get("aliexpress_affiliate_product_detail_get_response", {})
            .get("resp_result", {})
            .get("result", {})
    )
    return _sanitize_product(raw)


@router.get("/affiliate-link/{product_id}")
async def get_affiliate_link(product_id: str):
    """제휴 딥링크 생성"""
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")

    source_url = f"https://www.aliexpress.com/item/{product_id}.html"
    params = _build_common_params(
        method="aliexpress.affiliate.link.generate",
        extra={
            "tracking_id":         settings.ALI_TRACKING_ID,
            "promotion_link_type": "0",
            "source_values":       source_url,
        },
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ALI_API_BASE, data=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"제휴 링크 생성 오류: {e}")
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
