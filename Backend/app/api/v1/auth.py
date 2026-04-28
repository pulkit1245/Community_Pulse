from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.models.volunteer import Volunteer
from app.models.zone import Zone
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.volunteer import VolunteerCreate
from app.services.volunteer import create_volunteer

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Support login by email (frontend) or phone (direct API / legacy)
    if not payload.email and not payload.phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either email or phone",
        )

    if payload.email:
        result = await db.execute(select(Volunteer).where(Volunteer.email == payload.email))
    else:
        result = await db.execute(select(Volunteer).where(Volunteer.phone == payload.phone))

    volunteer = result.scalar_one_or_none()

    if not volunteer or not volunteer.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(payload.password, volunteer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(
        data={"sub": str(volunteer.id), "role": volunteer.role, "phone": volunteer.phone}
    )

    from app.schemas.auth import UserInfo
    user_info = UserInfo(
        id=str(volunteer.id),
        email=volunteer.email or "",
        name=volunteer.name,
        role=volunteer.role,
        zone=str(volunteer.zone_id) if volunteer.zone_id else None,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        role=volunteer.role,
        user=user_info,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: VolunteerCreate, db: AsyncSession = Depends(get_db)):
    """Public registration endpoint for new volunteers."""
    
    # Check if zone exists
    zone = await db.execute(select(Zone).where(Zone.id == payload.zone_id))
    if not zone.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid zone_id provided"
        )

    # Check if phone already exists
    existing = await db.execute(select(Volunteer).where(Volunteer.phone == payload.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for registration"
        )

    volunteer = await create_volunteer(db, payload)
    await db.commit()
    
    token = create_access_token(
        data={"sub": str(volunteer.id), "role": volunteer.role, "phone": volunteer.phone}
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
        role=volunteer.role,
    )