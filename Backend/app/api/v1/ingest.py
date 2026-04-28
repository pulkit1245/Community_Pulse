from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.core.rate_limit import limiter, ingest_limit
from app.schemas.need import NeedCreate, NeedResponse
from app.schemas.auth import IngestPayload
from app.services.ingestion import ingest_need, parse_whatsapp_message
from app.integrations.whatsapp import verify_whatsapp_signature, parse_whatsapp_webhook
from app.integrations.twilio import verify_twilio_signature
from app.core.config import settings

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("", response_model=NeedResponse, status_code=201)
@limiter.limit(ingest_limit)
async def ingest_need_api(
    request: Request,
    payload: NeedCreate,
    db: AsyncSession = Depends(get_db),
):
    """Ingest a need via REST API with deduplication."""
    need, is_duplicate = await ingest_need(
        db=db,
        payload=payload,
        ip_address=request.client.host if request.client else None,
    )
    if is_duplicate:
        raise HTTPException(status_code=409, detail="Duplicate need detected")
    return need


@router.post("/whatsapp", status_code=200)
@limiter.limit(ingest_limit)
async def whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_hub_signature_256: Optional[str] = Header(None),
):
    """WhatsApp Business API webhook — receive and ingest messages."""
    body_bytes = await request.body()

    # Signature verification
    if x_hub_signature_256:
        if not verify_whatsapp_signature(body_bytes, x_hub_signature_256):
            raise HTTPException(status_code=403, detail="Invalid WhatsApp signature")

    payload = await request.json()

    # WhatsApp verification challenge (GET is handled via query param check)
    if "hub.challenge" in str(payload):
        return {"hub.challenge": payload.get("hub.challenge")}

    messages = parse_whatsapp_webhook(payload)
    ingested = []

    for msg in messages:
        parsed = await parse_whatsapp_message(msg["body"], msg["from"])
        # Default to first zone — in production, resolve zone from phone/GPS
        from app.models.zone import Zone
        from sqlalchemy import select
        zone_result = await db.execute(select(Zone).limit(1))
        zone = zone_result.scalar_one_or_none()
        if not zone:
            continue

        need_payload = NeedCreate(
            title=parsed["title"],
            description=parsed["description"],
            category=parsed["category"],
            urgency=parsed["urgency"],
            zone_id=zone.id,
            requester_phone=parsed["requester_phone"],
            source="whatsapp",
        )
        need, is_dup = await ingest_need(db=db, payload=need_payload)
        if not is_dup:
            ingested.append(str(need.id))

    return {"status": "ok", "ingested": len(ingested)}


@router.get("/whatsapp")
async def whatsapp_verify(request: Request):
    """WhatsApp webhook verification challenge."""
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/sms", status_code=200)
@limiter.limit(ingest_limit)
async def twilio_sms_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_twilio_signature: Optional[str] = Header(None),
):
    """Twilio SMS ingestion endpoint."""
    form = await request.form()
    params = dict(form)

    if x_twilio_signature:
        if not verify_twilio_signature(x_twilio_signature, str(request.url), params):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    sender = params.get("From", "")
    body = params.get("Body", "")

    parsed = await parse_whatsapp_message(body, sender)

    from app.models.zone import Zone
    from sqlalchemy import select
    zone_result = await db.execute(select(Zone).limit(1))
    zone = zone_result.scalar_one_or_none()
    if not zone:
        return {"status": "no zone configured"}

    need_payload = NeedCreate(
        title=parsed["title"],
        description=parsed["description"],
        category=parsed["category"],
        urgency=parsed["urgency"],
        zone_id=zone.id,
        requester_phone=sender,
        source="sms",
    )
    need, is_dup = await ingest_need(db=db, payload=need_payload)

    return {"status": "ok", "duplicate": is_dup, "need_id": str(need.id) if not is_dup else None}