import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.volunteer import Volunteer
from app.schemas.volunteer import VolunteerCreate, VolunteerUpdate
from app.core.security import get_password_hash
from app.core.audit import write_audit


async def create_volunteer(
    db: AsyncSession, payload: VolunteerCreate, user_id: Optional[str] = None
) -> Volunteer:
    hashed_pw = get_password_hash(payload.password) if payload.password else None
    volunteer = Volunteer(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        skills=payload.skills,
        zone_id=payload.zone_id,
        bio=payload.bio,
        languages=payload.languages,
        hashed_password=hashed_pw,
    )
    db.add(volunteer)
    await db.flush()
    await write_audit(db, "volunteer.created", "volunteer", volunteer.id, user_id)
    return volunteer


async def get_volunteer(db: AsyncSession, volunteer_id: uuid.UUID) -> Optional[Volunteer]:
    result = await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    return result.scalar_one_or_none()


async def list_volunteers(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    available_only: bool = False,
    skill: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list, int]:
    query = select(Volunteer).where(Volunteer.is_active == True)
    if zone_id:
        query = query.where(Volunteer.zone_id == zone_id)
    if available_only:
        query = query.where(Volunteer.is_available == True)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    if skill:
        items = [v for v in items if skill.lower() in [s.lower() for s in v.skills]]

    return items, total


async def update_volunteer(
    db: AsyncSession,
    volunteer_id: uuid.UUID,
    payload: VolunteerUpdate,
    user_id: Optional[str] = None,
) -> Optional[Volunteer]:
    volunteer = await get_volunteer(db, volunteer_id)
    if not volunteer:
        return None
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(volunteer, field, value)
    await write_audit(db, "volunteer.updated", "volunteer", volunteer_id, user_id,
                      details=payload.model_dump(exclude_none=True))
    return volunteer


async def delete_volunteer(
    db: AsyncSession, volunteer_id: uuid.UUID, user_id: Optional[str] = None
) -> bool:
    volunteer = await get_volunteer(db, volunteer_id)
    if not volunteer:
        return False
    volunteer.is_active = False
    await write_audit(db, "volunteer.deactivated", "volunteer", volunteer_id, user_id)
    return True