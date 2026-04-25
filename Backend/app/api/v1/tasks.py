import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.rbac import get_current_user, require_permission
from app.models.assignment import Assignment, AssignmentStatus
from app.schemas.assignment import AssignmentStatusUpdate, AssignmentResponse
from app.services.dispatch import dispatch_assignment
from app.core.audit import write_audit
from datetime import datetime, timezone

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[AssignmentResponse])
async def list_assignments(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(Assignment).order_by(Assignment.created_at.desc()).limit(100))
    return list(result.scalars().all())


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.patch("/{assignment_id}/status", response_model=AssignmentResponse)
async def update_task_status(
    assignment_id: uuid.UUID,
    payload: AssignmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update task status — e.g. volunteer accepts, completes, or declines."""
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = payload.status
    if payload.notes:
        assignment.notes = payload.notes
    if payload.decline_reason:
        assignment.decline_reason = payload.decline_reason
    if payload.status == AssignmentStatus.ACCEPTED:
        assignment.accepted_at = datetime.now(timezone.utc)
    if payload.status == AssignmentStatus.COMPLETED:
        assignment.completed_at = datetime.now(timezone.utc)

    await write_audit(
        db=db,
        action=f"assignment.{payload.status.value}",
        entity_type="assignment",
        entity_id=assignment_id,
        user_id=current_user["user_id"],
        details={"status": payload.status, "notes": payload.notes},
    )

    return assignment


@router.post("/{assignment_id}/dispatch")
async def dispatch_task(
    assignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("dispatch")),
):
    """Trigger WhatsApp/SMS notification for an assignment."""
    ok = await dispatch_assignment(db, assignment_id, user_id=current_user["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Assignment not found or notification failed")
    return {"status": "dispatched", "assignment_id": str(assignment_id)}