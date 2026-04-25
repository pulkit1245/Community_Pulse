import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rbac import get_current_user, require_permission, Role, require_roles
from app.schemas.volunteer import VolunteerCreate, VolunteerUpdate, VolunteerResponse, VolunteerListResponse
from app.services.volunteer import (
    create_volunteer, get_volunteer, list_volunteers, update_volunteer, delete_volunteer
)

router = APIRouter(prefix="/volunteers", tags=["volunteers"])


@router.get("", response_model=VolunteerListResponse)
async def list_volunteers_api(
    zone_id: Optional[uuid.UUID] = Query(None),
    available_only: bool = Query(False),
    skill: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    items, total = await list_volunteers(db, zone_id, available_only, skill, page, page_size)
    return VolunteerListResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=VolunteerResponse, status_code=201)
async def create_volunteer_api(
    payload: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("write")),
):
    return await create_volunteer(db, payload, user_id=current_user["user_id"])


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer_api(
    volunteer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    vol = await get_volunteer(db, volunteer_id)
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return vol


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer_api(
    volunteer_id: uuid.UUID,
    payload: VolunteerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Volunteers can only update themselves; coordinators/admins can update any
    if current_user["role"] == Role.VOLUNTEER and current_user["user_id"] != str(volunteer_id):
        raise HTTPException(status_code=403, detail="Volunteers can only update their own profile")
    vol = await update_volunteer(db, volunteer_id, payload, user_id=current_user["user_id"])
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return vol


@router.delete("/{volunteer_id}", status_code=204)
async def delete_volunteer_api(
    volunteer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_roles([Role.ADMIN, Role.COORDINATOR])),
):
    success = await delete_volunteer(db, volunteer_id, user_id=current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Volunteer not found")