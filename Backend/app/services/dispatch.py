import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.assignment import Assignment, AssignmentStatus
from app.models.need import Need
from app.models.volunteer import Volunteer
from app.core.audit import write_audit
from app.integrations.twilio import send_sms
from app.integrations.whatsapp import send_whatsapp


def _build_volunteer_message(need: Need, assignment: Assignment) -> str:
    return (
        f"[Disaster Relief] You've been assigned a task.\n"
        f"Need: {need.title}\n"
        f"Urgency: {need.urgency.upper()}\n"
        f"Category: {need.category}\n"
        f"Assignment ID: {assignment.id}\n"
        f"Reply ACCEPT or DECLINE {assignment.id}"
    )


def _build_requester_message(volunteer: Volunteer, need: Need) -> str:
    return (
        f"[Disaster Relief] A volunteer has been assigned to your request.\n"
        f"Volunteer: {volunteer.name}\n"
        f"They will contact you shortly.\n"
        f"Need ref: {need.id}"
    )


async def dispatch_assignment(
    db: AsyncSession,
    assignment_id: uuid.UUID,
    user_id: Optional[str] = None,
) -> bool:
    """Send WhatsApp/SMS notification to volunteer and requester."""
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        return False

    need_result = await db.execute(select(Need).where(Need.id == assignment.need_id))
    need = need_result.scalar_one_or_none()

    vol_result = await db.execute(select(Volunteer).where(Volunteer.id == assignment.volunteer_id))
    volunteer = vol_result.scalar_one_or_none()

    if not need or not volunteer:
        return False

    vol_message = _build_volunteer_message(need, assignment)
    notification_ok = False

    # Try WhatsApp first, fall back to SMS
    try:
        await send_whatsapp(to=volunteer.phone, body=vol_message)
        notification_ok = True
    except Exception:
        try:
            await send_sms(to=volunteer.phone, body=vol_message)
            notification_ok = True
        except Exception:
            pass

    # Notify requester if they have a phone
    if need.requester_phone:
        req_message = _build_requester_message(volunteer, need)
        try:
            await send_sms(to=need.requester_phone, body=req_message)
        except Exception:
            pass

    if notification_ok:
        assignment.status = AssignmentStatus.NOTIFIED
        assignment.notification_sent_at = datetime.now(timezone.utc)

    await write_audit(
        db=db,
        action="assignment.dispatched",
        entity_type="assignment",
        entity_id=assignment_id,
        user_id=user_id,
        details={"notification_sent": notification_ok, "volunteer_phone": volunteer.phone},
    )

    return notification_ok