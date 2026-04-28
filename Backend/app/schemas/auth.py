from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    # Accept email (frontend) OR phone (direct API calls)
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class UserInfo(BaseModel):
    id: str
    email: str
    name: str
    role: str
    zone: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str
    user: UserInfo


class IngestPayload(BaseModel):
    """Incoming message from WhatsApp/SMS webhook after parsing."""
    source: str  # whatsapp | sms
    sender_phone: str
    message: str
    zone_hint: Optional[str] = None