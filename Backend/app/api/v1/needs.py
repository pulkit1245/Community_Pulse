import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.rbac import get_current_user, require_permission
from app.models.need import Need, NeedStatus, UrgencyLevel
from app.schemas.need import NeedResponse, NeedListResponse, NeedUpdate, NeedCreate

router = APIRouter(prefix="/needs", tags=["needs"])


@router.get("", response_model=NeedListResponse)
async def list_needs(
    zone_id: Optional[uuid.UUID] = Query(None),
    status: Optional[NeedStatus] = Query(None),
    urgency: Optional[UrgencyLevel] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    query = select(Need)
    if zone_id:
        query = query.where(Need.zone_id == zone_id)
    if status:
        query = query.where(Need.status == status)
    if urgency:
        query = query.where(Need.urgency == urgency)
    if category:
        query = query.where(Need.category == category)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    query = query.order_by(Need.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return NeedListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{need_id}", response_model=NeedResponse)
async def get_need(
    need_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    return need


@router.patch("/{need_id}", response_model=NeedResponse)
async def update_need(
    need_id: uuid.UUID,
    payload: NeedUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("write")),
):
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(need, field, value)
    await db.commit()
    return need


@router.post("", response_model=NeedResponse, status_code=201)
async def create_need(
    payload: NeedCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("write")),
):
    """Create a new need via REST API."""
    from app.services.ingestion import ingest_need
    
    need, is_duplicate = await ingest_need(
        db=db,
        payload=payload,
        user_id=current_user["user_id"],
    )
    if is_duplicate:
        raise HTTPException(status_code=409, detail="Duplicate need detected")
    await db.commit()
    return need


@router.delete("/{need_id}", status_code=204)
async def delete_need(
    need_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_permission("delete")),
):
    result = await db.execute(select(Need).where(Need.id == need_id))
    need = result.scalar_one_or_none()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    need.status = NeedStatus.CANCELLED
    await db.commit()