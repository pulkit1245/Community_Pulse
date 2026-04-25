import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Logs every state-changing request (POST/PATCH/DELETE) with timing,
    user context, and response status for security audit purposes.
    """

    AUDIT_METHODS = {"POST", "PATCH", "PUT", "DELETE"}

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        if request.method in self.AUDIT_METHODS:
            user_id = getattr(request.state, "user_id", None)
            role = getattr(request.state, "role", None)
            logger.info(
                "[AUDIT] %s %s | status=%s | user=%s | role=%s | %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                user_id or "anon",
                role or "-",
                elapsed_ms,
            )

        return response
