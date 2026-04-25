import hmac
import hashlib
from app.core.config import settings


async def send_whatsapp(to: str, body: str) -> bool:
    """Send WhatsApp message via Twilio."""
    if not settings.twilio_account_sid:
        print(f"[WHATSAPP MOCK] To: {to} | Body: {body[:80]}")
        return True

    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        whatsapp_to = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
        message = client.messages.create(
            body=body,
            from_=settings.whatsapp_from,
            to=whatsapp_to,
        )
        return message.sid is not None
    except Exception as e:
        print(f"[WHATSAPP ERROR] {e}")
        raise


def verify_whatsapp_signature(
    payload_body: bytes,
    signature_header: str,
) -> bool:
    """
    Verify WhatsApp webhook signature using HMAC-SHA256.
    Used with Meta's WhatsApp Business API signature verification.
    """
    expected = hmac.new(
        settings.secret_key.encode(),
        payload_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)


def parse_whatsapp_webhook(payload: dict) -> list[dict]:
    """
    Parse incoming WhatsApp Business API webhook payload.
    Returns list of message dicts with {from, body, timestamp}.
    """
    messages = []
    try:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    messages.append({
                        "from": msg.get("from"),
                        "body": msg.get("text", {}).get("body", ""),
                        "timestamp": msg.get("timestamp"),
                        "message_id": msg.get("id"),
                    })
    except Exception:
        pass
    return messages