"""
스케줄러 엔드포인트 — GitHub Actions / 외부 Cron에서 호출
CRON_SECRET 헤더로 인증 (무단 실행 방지)

호출 예시:
  curl -X POST https://api.alitrack.kr/api/scheduler/run \
       -H "X-Cron-Secret: <CRON_SECRET>"

흐름:
  1. push_subscriptions + price_alerts 에서 유일한 product_id 수집
  2. AliExpress API로 현재 가격 조회 → price_history 저장
  3. push_subscriptions: 목표가 달성 → Web Push 발송
  4. price_alerts:      목표가 달성 → 이메일 발송
"""

import asyncio
import logging
import secrets
import time
import hmac
import hashlib
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException, Header

from src.config.settings    import settings
from src.utils.supabase_client import sb_select, sb_upsert
from src.utils.email        import send_price_alert

logger = logging.getLogger("alitrack.scheduler")
router = APIRouter()

ALI_API_BASE = "https://api-sg.aliexpress.com/sync"


# ─── 인증 ────────────────────────────────────────────────────────────
def _verify_secret(x_cron_secret: str | None) -> None:
    if not settings.CRON_SECRET:
        raise HTTPException(status_code=503, detail="스케줄러 미설정")
    if not x_cron_secret or not secrets.compare_digest(x_cron_secret, settings.CRON_SECRET):
        raise HTTPException(status_code=401, detail="인증 실패")


# ─── AliExpress 가격 조회 ─────────────────────────────────────────────
def _ali_signature(params: dict) -> str:
    sorted_params = sorted((k, v) for k, v in params.items() if k not in {"sign", "sign_method"})
    msg = "".join(f"{k}{v}" for k, v in sorted_params)
    return hmac.new(
        settings.ALI_APP_SECRET.encode(),
        msg.encode(),
        hashlib.md5,
    ).hexdigest().upper()


async def _fetch_product_price(product_id: str) -> int | None:
    """AliExpress 상품 상세 API로 현재 가격 조회 (원)"""
    if not (settings.ALI_APP_KEY and settings.ALI_APP_SECRET):
        return None
    params = {
        "app_key":    settings.ALI_APP_KEY,
        "method":     "aliexpress.affiliate.productdetail.get",
        "timestamp":  str(int(time.time())),
        "sign_method":"hmac",
        "format":     "json",
        "v":          "2.0",
        "product_ids":str(product_id),
        "tracking_id":settings.ALI_TRACKING_ID,
        "target_currency": "KRW",
        "target_language": "ko",
        "country":    "KR",
    }
    params["sign"] = _ali_signature(params)
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(ALI_API_BASE, data=params)
            r.raise_for_status()
            data = r.json()
        resp = (data
                .get("aliexpress_affiliate_productdetail_get_response", {})
                .get("resp_result", {}))
        if resp.get("resp_code") not in (0, "0", 200, "200"):
            return None
        products = (resp.get("result", {})
                       .get("products", {})
                       .get("product", []))
        if not products:
            return None
        raw_price = products[0].get("target_sale_price", 0)
        return int(float(raw_price)) if raw_price else None
    except Exception as e:
        logger.warning(f"가격 조회 실패 product={product_id}: {type(e).__name__}")
        return None


async def _store_price(product_id: str, price: int) -> None:
    """price_history 테이블에 현재 가격 저장"""
    try:
        await sb_upsert("price_history", {
            "product_id":  product_id,
            "price":       price,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"price_history 저장 실패: {type(e).__name__}")


# ─── Web Push 발송 ────────────────────────────────────────────────────
async def _send_web_push(endpoint: str, auth: str, p256dh: str, payload: dict) -> bool:
    import json

    def _blocking():
        try:
            from pywebpush import webpush
            webpush(
                subscription_info={"endpoint": endpoint, "keys": {"auth": auth, "p256dh": p256dh}},
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
            return True
        except Exception as exc:
            logger.warning(f"Web Push 실패: {exc}")
            return False

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _blocking)


# ─── 메인 스케줄러 ───────────────────────────────────────────────────
@router.post("/run")
async def run_scheduler(x_cron_secret: str | None = Header(default=None)):
    """가격 조회 → 알림 발송 (Web Push + 이메일)"""
    _verify_secret(x_cron_secret)
    results = {
        "push_sent": 0, "email_sent": 0,
        "products_checked": 0, "errors": 0,
    }

    # ── 1. 알림 대상 product_id 수집 ──────────────────────────────
    push_subs = await sb_select("push_subscriptions") or []
    email_alerts = await sb_select("price_alerts", filters={"is_active": "eq.true"}) or []

    push_by_product: dict[str, list] = {}
    for s in push_subs:
        pid = s.get("product_id", "")
        if pid:
            push_by_product.setdefault(pid, []).append(s)

    email_by_product: dict[str, list] = {}
    for a in email_alerts:
        pid = a.get("product_id", "")
        if pid:
            email_by_product.setdefault(pid, []).append(a)

    all_product_ids = set(push_by_product) | set(email_by_product)
    if not all_product_ids:
        logger.info("알림 대상 없음")
        return {"ok": True, **results}

    # ── 2. 상품별 현재 가격 조회 + 저장 ──────────────────────────
    price_map: dict[str, int] = {}
    for pid in all_product_ids:
        price = await _fetch_product_price(pid)
        if price and price > 0:
            price_map[pid] = price
            await _store_price(pid, price)
            results["products_checked"] += 1
        else:
            # API 미승인 → price_history 최신값 사용
            hist = await sb_select(
                "price_history",
                filters={"product_id": f"eq.{pid}"},
                order="recorded_at.desc",
                limit=1,
            ) or []
            if hist:
                price_map[pid] = hist[0].get("price", 0)

    # ── 3. Web Push 발송 ──────────────────────────────────────────
    if settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY:
        for pid, subs in push_by_product.items():
            current = price_map.get(pid, 0)
            if current <= 0:
                continue
            triggered = [s for s in subs if 0 < s.get("target_price", 0) >= current]
            for sub in triggered:
                product_name = ""
                try:
                    prods = await sb_select("products", filters={"id": f"eq.{pid}"}, limit=1) or []
                    product_name = prods[0].get("name", "상품") if prods else "상품"
                except Exception:
                    pass

                payload = {
                    "title":      f"[AliTrack] 목표가 달성! 🎉",
                    "body":       f"{product_name or '상품'} — 지금 {current:,}원",
                    "url":        f"https://alitrack.kr",
                    "product_id": pid,
                }
                sent = await _send_web_push(
                    sub.get("endpoint", ""),
                    sub.get("auth", ""),
                    sub.get("p256dh", ""),
                    payload,
                )
                if sent:
                    results["push_sent"] += 1
    else:
        logger.warning("VAPID 키 미설정 — Web Push 건너뜀")

    # ── 4. 이메일 발송 ────────────────────────────────────────────
    for pid, alerts in email_by_product.items():
        current = price_map.get(pid, 0)
        if current <= 0:
            continue
        triggered = [a for a in alerts if 0 < a.get("target_price", 0) >= current]
        for alert in triggered:
            try:
                user_id = alert.get("user_id")
                users   = await sb_select("users", filters={"id": f"eq.{user_id}"}, limit=1) or []
                if not users:
                    continue
                to_email = users[0].get("email", "")
                if not to_email or "@" not in to_email:
                    continue

                prods = await sb_select("products", filters={"id": f"eq.{pid}"}, limit=1) or []
                pname = prods[0].get("name", "상품") if prods else "상품"
                purl  = prods[0].get("ali_url", "") if prods else ""

                sent = send_price_alert(to_email, pname, current, alert["target_price"], purl)
                if sent:
                    results["email_sent"] += 1
            except Exception as e:
                logger.error(f"이메일 발송 오류: {type(e).__name__}")
                results["errors"] += 1

    logger.info(f"스케줄러 완료: {results}")
    return {"ok": True, **results}


@router.post("/test-email")
async def test_email(x_cron_secret: str | None = Header(default=None)):
    """이메일 설정 확인용"""
    _verify_secret(x_cron_secret)
    from src.utils.email import send_test_email
    ok = send_test_email(settings.GMAIL_ADDRESS)
    return {"ok": ok, "to": settings.GMAIL_ADDRESS}


@router.post("/test-push")
async def test_push(x_cron_secret: str | None = Header(default=None)):
    """Web Push 설정 확인용 — 등록된 첫 번째 구독자에게 테스트 발송"""
    _verify_secret(x_cron_secret)
    if not (settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY):
        return {"ok": False, "reason": "VAPID 키 미설정"}

    subs = await sb_select("push_subscriptions", limit=1) or []
    if not subs:
        return {"ok": False, "reason": "등록된 구독 없음"}

    sub = subs[0]
    sent = await _send_web_push(
        sub["endpoint"], sub["auth"], sub["p256dh"],
        {
            "title": "[AliTrack] 알림 테스트",
            "body":  "Web Push 연결이 정상 작동합니다 ✅",
            "url":   "https://alitrack.kr",
        },
    )
    return {"ok": sent, "endpoint_prefix": sub["endpoint"][:40]}
