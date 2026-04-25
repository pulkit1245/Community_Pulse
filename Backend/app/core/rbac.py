from enum import Enum
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token

security = HTTPBearer()


class Role(str, Enum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"
    VIEWER = "viewer"


ROLE_PERMISSIONS = {
    Role.ADMIN: ["read", "write", "delete", "match", "dispatch"],
    Role.COORDINATOR: ["read", "write", "match", "dispatch"],
    Role.VOLUNTEER: ["read", "self_update"],
    Role.VIEWER: ["read"],
}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    role = payload.get("role", Role.VIEWER)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return {"user_id": user_id, "role": role}


def require_roles(allowed_roles: List[Role]):
    def _checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user['role']}' is not permitted for this action",
            )
        return current_user
    return _checker


def require_permission(permission: str):
    def _checker(current_user: dict = Depends(get_current_user)):
        role = current_user["role"]
        if permission not in ROLE_PERMISSIONS.get(role, []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' denied for role '{role}'",
            )
        return current_user
    return _checker