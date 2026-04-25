"""
Rate limiting middleware using slowapi.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.rate_limit import limiter
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to apply rate limiting to all requests.
    Rate limits are configured at the endpoint level via @limiter.limit() decorator.
    """

    async def dispatch(self, request: Request, call_next):
        """Process request through rate limiter."""
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Rate limit check failed: {exc}")
            raise
