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
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    from sqlalchemy import cast, String, text

    # Build base filter conditions as text conditions to avoid enum comparison issues
    conditions = []
    if zone_id:
        conditions.append(f"zone_id = '{zone_id}'")
    if status:
        conditions.append(f"LOWER(status) = '{status.lower()}'")
    if urgency:
        conditions.append(f"LOWER(urgency) = '{urgency.lower()}'")
    if category:
        conditions.append(f"LOWER(category) = '{category.lower()}'")

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    offset = (page - 1) * page_size

    # Count query
    count_row = await db.execute(
        text(f"SELECT COUNT(*) FROM needs {where_clause}")
    )
    total = count_row.scalar() or 0

    # Fetch items
    rows = await db.execute(
        text(f"""
            SELECT id FROM needs
            {where_clause}
            ORDER BY created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """)
    )
    ids = [row[0] for row in rows.fetchall()]

    if not ids:
        return NeedListResponse(items=[], total=total, page=page, page_size=page_size)

    # Fetch full ORM objects by ID (avoids enum comparison issues entirely)
    id_list = ", ".join(f"'{i}'" for i in ids)
    result = await db.execute(
        select(Need).where(text(f"id IN ({id_list})")).order_by(Need.created_at.desc())
    )
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