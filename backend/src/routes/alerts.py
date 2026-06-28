"""
가격 알림 엔드포인트
- 미회원: localStorage 저장 (프론트에서 처리), 백엔드 호출 없음
- 카카오 회원: /subscribe 로 Supabase 저장
- 카카오 가입 후: /merge-guest 로 로컬 데이터 → 계정 통합
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from src.utils.supabase_client import sb_upsert
from src.utils.auth import verify_access_token

logger = logging.getLogger("alitrack.alerts")
router = APIRouter()


def _get_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get("alitrack_token")


class AlertSubscribeBody(BaseModel):
    product_id:   str
    product_name: str
    target_price: int


class GuestAlert(BaseModel):
    product_id:   str
    product_name: str
    target_price: int


class MergeGuestBody(BaseModel):
    alerts: list[GuestAlert]


@router.post("/subscribe")
async def subscribe_alert(body: AlertSubscribeBody, request: Request):
    """카카오 회원 가격 알림 신청"""
    token = _get_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    try:
        payload = verify_access_token(token)
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="인증 오류.")

    if body.target_price <= 0:
        raise HTTPException(status_code=400, detail="올바른 가격을 입력해주세요.")

    try:
        await sb_upsert("products", {"id": body.product_id, "name": body.product_name})
    except Exception:
        pass

    try:
        await sb_upsert("price_alerts", {
            "user_id":      user_id,
            "product_id":   body.product_id,
            "target_price": body.target_price,
            "is_active":    True,
        })
    except Exception as e:
        logger.error(f"price_alerts upsert 오류: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="알림 신청에 실패했습니다.")

    logger.info(f"알림 신청: user={user_id[:8]}… target={body.target_price}")
    return {"ok": True}


@router.post("/merge-guest")
async def merge_guest(body: MergeGuestBody, request: Request):
    """카카오 가입 후 로컬 저장 알림 → 계정으로 통합"""
    token = _get_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    try:
        payload  = verify_access_token(token)
        user_id  = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="인증 오류.")

    merged = 0
    for alert in body.alerts:
        try:
            await sb_upsert("products", {"id": alert.product_id, "name": alert.product_name})
            await sb_upsert("price_alerts", {
                "user_id":      user_id,
                "product_id":   alert.product_id,
                "target_price": alert.target_price,
                "is_active":    True,
            })
            merged += 1
        except Exception as e:
            logger.warning(f"알림 이전 실패: {type(e).__name__}")

    logger.info(f"게스트 알림 통합: user={user_id[:8]}… {merged}/{len(body.alerts)}건")
    return {"ok": True, "merged": merged}
