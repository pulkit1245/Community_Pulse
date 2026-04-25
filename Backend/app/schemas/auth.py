from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    role: str


class IngestPayload(BaseModel):
    """Incoming message from WhatsApp/SMS webhook after parsing."""
    source: str  # whatsapp | sms
    sender_phone: str
    message: str
    zone_hint: Optional[str] = None