"""
src/routes/products.py
상품 가격 히스토리 / 찜 목록 라우터 (Supabase REST API 연동)
"""

import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, Depends, HTTPException
from src.utils.auth import verify_token_optional, require_auth
from src.utils.supabase_client import sb_select, sb_upsert, sb_delete

logger = logging.getLogger("alitrack.products")
router = APIRouter()


@router.get("/price-history/{product_id}")
async def get_price_history(
    product_id: str,
    days:       int = Query(90, ge=7, le=365),
    _user           = Depends(verify_token_optional),
):
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")

    try:
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        data = await sb_select(
            "price_history",
            filters={"product_id": f"eq.{product_id}", "recorded_at": f"gte.{since}"},
            order="recorded_at.asc",
            columns="price,recorded_at",
        )
        return {"product_id": product_id, "days": days, "history": data}
    except RuntimeError:
        return {"product_id": product_id, "days": days, "history": []}
    except Exception as e:
        logger.warning(f"price_history 조회 오류: {e}")
        return {"product_id": product_id, "days": days, "history": []}


@router.get("/wishlist")
async def get_wishlist(user = Depends(require_auth)):
    try:
        data = await sb_select(
            "wishlist",
            filters={"user_id": f"eq.{user['user_id']}"},
            order="created_at.desc",
            columns="product_id,product_snapshot,created_at",
        )
        return {"items": data}
    except RuntimeError:
        return {"items": []}
    except Exception as e:
        logger.warning(f"wishlist 조회 오류: {e}")
        return {"items": []}


@router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user = Depends(require_auth)):
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")
    try:
        await sb_upsert("wishlist", {"user_id": str(user["user_id"]), "product_id": product_id})
        return {"ok": True}
    except Exception as e:
        logger.error(f"wishlist 추가 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류")


@router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user = Depends(require_auth)):
    try:
        await sb_delete("wishlist", {"user_id": f"eq.{user['user_id']}", "product_id": f"eq.{product_id}"})
        return {"ok": True}
    except Exception as e:
        logger.error(f"wishlist 삭제 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류")
