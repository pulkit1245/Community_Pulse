from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from app.core.security import decode_token
import logging

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Optional global auth middleware.
    Per-route auth is enforced via RBAC dependencies in each router.
    This middleware adds user info to request.state for logging purposes.
    """

    PUBLIC_PATHS = {"/health", "/", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ", 1)[1]
                payload = decode_token(token)
                request.state.user_id = payload.get("sub")
                request.state.role = payload.get("role")
            except Exception:
                request.state.user_id = None
                request.state.role = None
        else:
            request.state.user_id = None
            request.state.role = None

        response = await call_next(request)
        return response
