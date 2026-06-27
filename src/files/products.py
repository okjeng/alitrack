"""
src/routes/products.py
상품 가격 히스토리 DB 조회 라우터
"""

from fastapi import APIRouter, Query, Depends, HTTPException
from src.utils.auth import verify_token_optional

router = APIRouter()


@router.get("/price-history/{product_id}")
async def get_price_history(
    product_id: str,
    days:       int = Query(90, ge=7, le=365),
    _user           = Depends(verify_token_optional),
):
    """상품 가격 히스토리 조회 — DB에서 읽기 (API 연동 시 실제 DB 쿼리로 교체)"""
    if not product_id.isdigit():
        raise HTTPException(status_code=400, detail="유효하지 않은 상품 ID입니다.")

    # TODO: DB 쿼리
    # records = await db.fetch_all(
    #   "SELECT recorded_at, price FROM price_history WHERE product_id=$1 AND recorded_at > NOW() - INTERVAL '$2 days' ORDER BY recorded_at",
    #   product_id, days
    # )
    return {"product_id": product_id, "days": days, "history": []}


@router.get("/wishlist")
async def get_wishlist(_user = Depends(lambda: None)):
    """찜 목록 조회 — 로그인 필요"""
    # TODO: 로그인 체크 + DB 조회
    return {"items": []}
