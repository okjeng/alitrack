"""
스케줄러 엔드포인트 — GitHub Actions / 외부 Cron에서 호출
CRON_SECRET 헤더로 인증 (무단 실행 방지)

호출 예시:
  curl -X POST https://api.alitrack.kr/api/scheduler/run \
       -H "X-Cron-Secret: <CRON_SECRET>"
"""

import logging
import secrets
from fastapi import APIRouter, HTTPException, Header
from src.config.settings import settings
from src.utils.supabase_client import sb_select
from src.utils.email import send_price_alert

logger = logging.getLogger("alitrack.scheduler")
router = APIRouter()


def _verify_secret(x_cron_secret: str | None) -> None:
    if not settings.CRON_SECRET:
        raise HTTPException(status_code=503, detail="스케줄러 미설정")
    if not x_cron_secret or not secrets.compare_digest(x_cron_secret, settings.CRON_SECRET):
        raise HTTPException(status_code=401, detail="인증 실패")


@router.post("/run")
async def run_scheduler(x_cron_secret: str | None = Header(default=None)):
    """가격 알림 확인 + 오래된 데이터 정리"""
    _verify_secret(x_cron_secret)
    results = {"alerts_sent": 0, "errors": 0, "cleanup": 0}

    # ── 1. 활성 가격 알림 확인 ────────────────────────────────────
    try:
        alerts = await sb_select("price_alerts", filters={"is_active": "eq.true"}) or []
    except Exception as e:
        logger.error(f"price_alerts 조회 실패: {type(e).__name__}")
        alerts = []

    for alert in alerts:
        try:
            product_id   = alert.get("product_id")
            target_price = alert.get("target_price", 0)
            user_id      = alert.get("user_id")

            # 최신 가격 조회
            history = await sb_select(
                "price_history",
                filters={"product_id": f"eq.{product_id}"},
                order="recorded_at.desc",
                limit=1,
            ) or []

            if not history:
                continue

            current_price = history[0].get("price", 0)
            if current_price <= 0 or current_price > target_price:
                continue

            # 사용자 이메일 조회
            users = await sb_select("users", filters={"id": f"eq.{user_id}"}, limit=1) or []
            if not users:
                continue
            to_email = users[0].get("email", "")
            if not to_email or "@" not in to_email:
                continue

            # 상품명 조회
            products = await sb_select("products", filters={"id": f"eq.{product_id}"}, limit=1) or []
            product_name = products[0].get("name", "상품") if products else "상품"
            product_url  = products[0].get("ali_url", "") if products else ""

            sent = send_price_alert(to_email, product_name, current_price, target_price, product_url)
            if sent:
                results["alerts_sent"] += 1

        except Exception as e:
            logger.error(f"알림 처리 오류: {type(e).__name__}")
            results["errors"] += 1

    # ── 2. 오래된 가격 데이터 정리 (90일 이상) ───────────────────
    # Supabase RPC 호출 (supabase_migrations.sql의 cleanup 함수)
    logger.info(f"스케줄러 완료: {results}")
    return {"ok": True, **results}


@router.post("/test-email")
async def test_email(x_cron_secret: str | None = Header(default=None)):
    """이메일 설정 확인용"""
    _verify_secret(x_cron_secret)
    from src.utils.email import send_test_email
    ok = send_test_email(settings.GMAIL_ADDRESS)
    return {"ok": ok, "to": settings.GMAIL_ADDRESS}
