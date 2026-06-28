"""
Web Push 알림 엔드포인트
  GET  /api/push/vapid-public   — 프론트가 PushManager.subscribe()에 쓸 VAPID 공개 키
  POST /api/push/subscribe      — 브라우저 푸시 구독 + 목표가 저장
  POST /api/push/send           — 내부 전용: 특정 상품 구독자에게 알림 발송
"""
import logging
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from src.config.settings import settings
from src.utils.supabase_client import sb_upsert, sb_select, sb_delete

logger  = logging.getLogger("alitrack.push")
router  = APIRouter()


# ─── VAPID 공개 키 ────────────────────────────────────────────────────
@router.get("/vapid-public")
async def vapid_public():
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Web Push 미설정")
    return {"public_key": settings.VAPID_PUBLIC_KEY}


# ─── 구독 저장 ───────────────────────────────────────────────────────
class PushSubscribeBody(BaseModel):
    endpoint:     str
    auth:         str       # base64url
    p256dh:       str       # base64url
    product_id:   str
    target_price: int
    guest_id:     Optional[str] = None


@router.post("/subscribe")
async def push_subscribe(body: PushSubscribeBody):
    if body.target_price <= 0:
        raise HTTPException(status_code=400, detail="올바른 가격을 입력해주세요.")

    try:
        await sb_upsert("push_subscriptions", {
            "endpoint":     body.endpoint,
            "auth":         body.auth,
            "p256dh":       body.p256dh,
            "product_id":   body.product_id,
            "target_price": body.target_price,
            "guest_id":     body.guest_id or "",
        })
        logger.info(f"푸시 구독: product={body.product_id} target={body.target_price}")
    except Exception as e:
        # 테이블 미존재 시에도 200 반환 (프론트 경험 유지)
        logger.warning(f"push_subscriptions 저장 실패 (테이블 없음?): {type(e).__name__}")

    return {"ok": True}


# ─── 알림 발송 (내부 cron에서 호출) ─────────────────────────────────
class PushSendBody(BaseModel):
    product_id: str
    title:      str
    body:       str
    url:        str = "/"


async def _send_one(endpoint: str, auth: str, p256dh: str, payload: dict) -> bool:
    """단일 구독자에게 Web Push 발송"""
    import json
    from functools import partial

    if not (settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY):
        return False

    def _blocking_send():
        try:
            from pywebpush import webpush, WebPushException
            webpush(
                subscription_info={
                    "endpoint": endpoint,
                    "keys": {"auth": auth, "p256dh": p256dh},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
            return True
        except Exception as exc:
            logger.warning(f"Web Push 발송 실패: {exc}")
            return False

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _blocking_send)


@router.post("/unsubscribe")
async def push_unsubscribe(body: PushSubscribeBody):
    """푸시 알림 해제 — product_id + endpoint 기준으로 삭제"""
    try:
        await sb_delete("push_subscriptions", {
            "product_id": f"eq.{body.product_id}",
            "endpoint":   f"eq.{body.endpoint}",
        })
        logger.info(f"푸시 구독 해제: product={body.product_id}")
    except Exception as e:
        logger.warning(f"push unsubscribe 실패: {type(e).__name__}")
    return {"ok": True}


@router.post("/send")
async def push_send(body: PushSendBody, secret: str = ""):
    if secret != settings.CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    subs = await sb_select(
        "push_subscriptions",
        filters={"product_id": f"eq.{body.product_id}"},
    )
    if not subs:
        return {"ok": True, "sent": 0}

    payload = {"title": body.title, "body": body.body, "url": body.url,
               "product_id": body.product_id}
    tasks   = [_send_one(s["endpoint"], s["auth"], s["p256dh"], payload) for s in subs]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    sent    = sum(1 for r in results if r is True)

    logger.info(f"Web Push 발송: product={body.product_id} {sent}/{len(subs)}")
    return {"ok": True, "sent": sent, "total": len(subs)}
