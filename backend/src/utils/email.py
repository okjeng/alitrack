"""
이메일 발송 유틸리티 — Gmail SMTP (TLS)
GMAIL_ADDRESS, GMAIL_APP_PASSWORD 환경변수 필요
Gmail 앱 비밀번호: Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from src.config.settings import settings

logger = logging.getLogger("alitrack.email")


def _is_configured() -> bool:
    return bool(settings.GMAIL_ADDRESS and settings.GMAIL_APP_PASSWORD)


def send_price_alert(
    to_email: str,
    product_name: str,
    current_price: int,
    target_price: int,
    product_url: str = "",
) -> bool:
    """최저가 달성 알림 이메일 발송. 성공 시 True 반환."""
    if not _is_configured():
        logger.warning("Gmail 환경변수 미설정 — 이메일 발송 건너뜀")
        return False

    subject = f"[AliTrack] 🎉 목표 가격 달성! {product_name[:30]}"
    body = f"""
안녕하세요, AliTrack 가격 알림입니다.

📦 상품명: {product_name}
💰 현재 가격: {current_price:,}원
🎯 목표 가격: {target_price:,}원
📉 절감액: {target_price - current_price:,}원

지금 바로 구매하러 가기:
{product_url or "https://alitrack.kr"}

---
이 알림은 AliTrack (https://alitrack.kr) 에서 발송되었습니다.
수신 거부: 앱 내 [알림 설정]에서 해제하세요.
""".strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"AliTrack <{settings.GMAIL_ADDRESS}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_ADDRESS, to_email, msg.as_string())
        logger.info(f"가격 알림 이메일 발송 완료: {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("Gmail 인증 실패 — 앱 비밀번호 확인 필요")
        return False
    except Exception as e:
        logger.error(f"이메일 발송 오류: {type(e).__name__}")
        return False


def send_test_email(to_email: str) -> bool:
    """설정 확인용 테스트 이메일"""
    if not _is_configured():
        logger.warning("Gmail 환경변수 미설정")
        return False

    msg = MIMEText("AliTrack 이메일 설정이 정상적으로 완료되었습니다! ✅", "plain", "utf-8")
    msg["Subject"] = "[AliTrack] 이메일 설정 확인"
    msg["From"]    = f"AliTrack <{settings.GMAIL_ADDRESS}>"
    msg["To"]      = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_ADDRESS, to_email, msg.as_string())
        logger.info(f"테스트 이메일 발송 완료: {to_email}")
        return True
    except Exception as e:
        logger.error(f"테스트 이메일 오류: {type(e).__name__}")
        return False
