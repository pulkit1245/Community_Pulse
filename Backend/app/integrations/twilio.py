import hmac
import hashlib
from app.core.config import settings


async def send_sms(to: str, body: str) -> bool:
    """Send SMS via Twilio REST API."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        print(f"[SMS MOCK] To: {to} | Body: {body[:80]}")
        return True

    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        message = client.messages.create(
            body=body,
            from_=settings.twilio_phone_number,
            to=to,
        )
        return message.sid is not None
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        raise


def verify_twilio_signature(signature: str, url: str, params: dict) -> bool:
    """Verify Twilio webhook signature."""
    if not settings.twilio_auth_token:
        return True  # Skip in dev

    from twilio.request_validator import RequestValidator
    validator = RequestValidator(settings.twilio_auth_token)
    return validator.validate(url, params, signature)