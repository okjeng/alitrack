"""
src/routes/products.py
상품 가격 히스토리 / 찜 목록 DB 라우터 (Supabase 연동)
"""

import logging
from fastapi import APIRouter, Query, Depends, HTTPException
from src.utils.auth import verify_token_optional, require_auth
from src.utils.supabase_client import supabase_query

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
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        result = await supabase_query(
            lambda sb: sb.table("price_history")
              .select("price, recorded_at")
              .eq("product_id", product_id)
              .gte("recorded_at", since)
              .order("recorded_at")
              .execute()
        )
        return {"product_id": product_id, "days": days, "history": result.data}
    except RuntimeError:
        # Supabase 미설정 시 빈 결과
        return {"product_id": product_id, "days": days, "history": []}
    except Exception as e:
        logger.error(f"price_history 조회 오류: {e}")
        return {"product_id": product_id, "days": days, "history": []}


@router.get("/wishlist")
async def get_wishlist(user = Depends(require_auth)):
    try:
        result = await supabase_query(
            lambda sb: sb.table("wishlist")
              .select("product_id, product_snapshot, created_at")
              .eq("user_id", str(user["user_id"]))
              .order("created_at", desc=True)
              .execute()
        )
        return {"items": result.data}
    except RuntimeError:
        return {"items": []}
    except Exception as e:
        logger.error(f"wishlist 조회 오류: {e}")
        return {"items": []}


@router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user = Depends(require_auth)):
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")
    try:
        await supabase_query(
            lambda sb: sb.table("wishlist")
              .upsert({"user_id": str(user["user_id"]), "product_id": product_id})
              .execute()
        )
        return {"ok": True}
    except Exception as e:
        logger.error(f"wishlist 추가 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류")


@router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user = Depends(require_auth)):
    try:
        await supabase_query(
            lambda sb: sb.table("wishlist")
              .delete()
              .eq("user_id", str(user["user_id"]))
              .eq("product_id", product_id)
              .execute()
        )
        return {"ok": True}
    except Exception as e:
        logger.error(f"wishlist 삭제 오류: {e}")
        raise HTTPException(status_code=500, detail="서버 오류")
