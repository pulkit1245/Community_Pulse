import hashlib
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.need import Need, NeedStatus
from app.schemas.need import NeedCreate
from app.core.audit import write_audit


def _compute_embedding_hash(title: str, description: str, zone_id: str) -> str:
    """Compute a deterministic hash for deduplication.
    In production, replace with pgvector cosine similarity check."""
    content = f"{title.lower().strip()}|{(description or '').lower().strip()}|{zone_id}"
    return hashlib.sha256(content.encode()).hexdigest()


async def ingest_need(
    db: AsyncSession,
    payload: NeedCreate,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> tuple[Need, bool]:
    """
    Ingest a new need with deduplication check.
    Returns (need, is_duplicate).
    """
    embedding_hash = _compute_embedding_hash(
        payload.title, payload.description or "", str(payload.zone_id)
    )

    # Deduplication check
    existing = await db.execute(
        select(Need).where(Need.embedding_hash == embedding_hash)
    )
    duplicate = existing.scalar_one_or_none()
    if duplicate:
        return duplicate, True

    need = Need(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        urgency=payload.urgency,
        zone_id=payload.zone_id,
        requester_name=payload.requester_name,
        requester_phone=payload.requester_phone,
        skills_required=payload.skills_required,
        people_count=payload.people_count,
        source=payload.source,
        status=NeedStatus.OPEN,
        embedding_hash=embedding_hash,
    )
    db.add(need)
    await db.flush()

    await write_audit(
        db=db,
        action="need.created",
        entity_type="need",
        entity_id=need.id,
        user_id=user_id,
        details={"source": payload.source, "urgency": payload.urgency},
        ip_address=ip_address,
    )

    return need, False


async def parse_whatsapp_message(message: str, sender_phone: str) -> dict:
    """
    Parse a raw WhatsApp/SMS message into a structured need payload.
    Simple keyword parser — swap with NLP in production.
    """
    message_lower = message.lower()

    urgency = "medium"
    if any(w in message_lower for w in ["urgent", "emergency", "critical", "now", "dying"]):
        urgency = "critical"
    elif any(w in message_lower for w in ["soon", "asap", "quickly"]):
        urgency = "high"

    category = "general"
    if any(w in message_lower for w in ["food", "water", "hungry", "thirsty"]):
        category = "food_water"
    elif any(w in message_lower for w in ["medical", "medicine", "doctor", "injured", "hospital"]):
        category = "medical"
    elif any(w in message_lower for w in ["shelter", "house", "roof", "sleep"]):
        category = "shelter"
    elif any(w in message_lower for w in ["rescue", "trapped", "stuck", "help"]):
        category = "rescue"

    return {
        "title": message[:100],
        "description": message,
        "category": category,
        "urgency": urgency,
        "requester_phone": sender_phone,
        "source": "whatsapp",
    }