import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.assignment import AssignmentStatus


class MatchRequest(BaseModel):
    zone_id: Optional[uuid.UUID] = None
    need_ids: Optional[List[uuid.UUID]] = None
    dry_run: bool = False


class MatchResult(BaseModel):
    need_id: uuid.UUID
    volunteer_id: uuid.UUID
    match_score: float
    assignment_id: Optional[uuid.UUID] = None  # None during dry_run


class MatchResponse(BaseModel):
    assignments: List[MatchResult]
    total_matched: int
    unmatched_needs: List[uuid.UUID]
    dry_run: bool


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    notes: Optional[str] = None
    decline_reason: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    need_id: uuid.UUID
    volunteer_id: uuid.UUID
    status: AssignmentStatus
    match_score: Optional[float]
    notes: Optional[str]
    decline_reason: Optional[str]
    notification_sent_at: Optional[datetime]
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}