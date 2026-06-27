"""
src/middleware/xss_filter.py
XSS 및 SQL 인젝션 입력값 필터 미들웨어

검색창·쿼리 파라미터에서 악성 패턴 탐지 시 400 반환
"""

import re
import logging
from urllib.parse import unquote
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("alitrack.xss_filter")

# XSS 패턴 목록
XSS_PATTERNS = [
    r"<script[\s>]",
    r"javascript\s*:",
    r"on\w+\s*=",           # onerror=, onclick= 등
    r"<iframe",
    r"<object",
    r"<embed",
    r"<svg[\s>]",
    r"expression\s*\(",
    r"vbscript\s*:",
    r"data\s*:\s*text/html",
]

# SQL 인젝션 패턴 목록
SQL_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bSELECT\b.*\bFROM\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bDELETE\b.*\bFROM\b)",
    r"(--|#|/\*)",           # SQL 주석
    r"(\bOR\b\s+\d+\s*=\s*\d+)",    # OR 1=1
    r"(\bAND\b\s+\d+\s*=\s*\d+)",   # AND 1=1
    r"(\bEXEC\b|\bEXECUTE\b)",
    r"\bxp_cmdshell\b",
]

# 악성 매크로/봇 User-Agent 패턴
MALICIOUS_UA_PATTERNS = [
    r"sqlmap",
    r"nikto",
    r"nmap",
    r"masscan",
    r"zgrab",
    r"python-requests.*bot",
]

_XSS_REGEX = [re.compile(p, re.IGNORECASE) for p in XSS_PATTERNS]
_SQL_REGEX  = [re.compile(p, re.IGNORECASE) for p in SQL_PATTERNS]
_UA_REGEX   = [re.compile(p, re.IGNORECASE) for p in MALICIOUS_UA_PATTERNS]


def _is_malicious(value: str) -> tuple[bool, str]:
    """입력값에서 악성 패턴 탐지. (탐지여부, 유형) 반환"""
    decoded = unquote(value)  # URL 인코딩 우회 방지

    for pattern in _XSS_REGEX:
        if pattern.search(decoded):
            return True, "XSS"

    for pattern in _SQL_REGEX:
        if pattern.search(decoded):
            return True, "SQL_INJECTION"

    return False, ""


class XSSFilterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. 악성 User-Agent 차단
        user_agent = request.headers.get("User-Agent", "")
        for ua_pattern in _UA_REGEX:
            if ua_pattern.search(user_agent):
                logger.warning(f"악성 봇 차단: UA={user_agent}, IP={request.client.host}")
                return JSONResponse(status_code=403, content={"error": "접근이 차단되었습니다."})

        # 2. 쿼리 파라미터 검사
        for key, value in request.query_params.items():
            detected, attack_type = _is_malicious(value)
            if detected:
                logger.warning(
                    f"{attack_type} 시도 탐지: "
                    f"param={key}, value={value[:50]}, "
                    f"IP={request.client.host}, path={request.url.path}"
                )
                return JSONResponse(
                    status_code=400,
                    content={"error": "유효하지 않은 입력값입니다."},
                )

        # 3. Path 파라미터 검사
        path = str(request.url.path)
        detected, attack_type = _is_malicious(path)
        if detected:
            logger.warning(f"{attack_type} in path: {path}, IP={request.client.host}")
            return JSONResponse(status_code=400, content={"error": "유효하지 않은 요청입니다."})

        return await call_next(request)
