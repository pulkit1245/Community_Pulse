import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class VolunteerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = None
    skills: List[str] = []
    zone_id: uuid.UUID
    bio: Optional[str] = None
    languages: List[str] = ["english"]
    password: Optional[str] = None


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    zone_id: Optional[uuid.UUID] = None
    is_available: Optional[bool] = None
    bio: Optional[str] = None
    languages: Optional[List[str]] = None


class VolunteerResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: Optional[str]
    skills: List[str]
    zone_id: uuid.UUID
    is_available: bool
    is_active: bool
    bio: Optional[str]
    languages: List[str]
    role: str
    total_assignments: int
    completed_assignments: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VolunteerListResponse(BaseModel):
    items: List[VolunteerResponse]
    total: int
    page: int
    page_size: int