import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.need import NeedStatus, UrgencyLevel


class NeedCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    category: str
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    zone_id: uuid.UUID
    requester_name: Optional[str] = None
    requester_phone: Optional[str] = None
    skills_required: List[str] = []
    people_count: int = Field(default=1, ge=1)
    source: str = "api"


class NeedUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    urgency: Optional[UrgencyLevel] = None
    status: Optional[NeedStatus] = None
    skills_required: Optional[List[str]] = None


class NeedResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    category: str
    urgency: UrgencyLevel
    status: NeedStatus
    zone_id: uuid.UUID
    requester_name: Optional[str]
    requester_phone: Optional[str]
    skills_required: List[str]
    people_count: int
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NeedListResponse(BaseModel):
    items: List[NeedResponse]
    total: int
    page: int
    page_size: int