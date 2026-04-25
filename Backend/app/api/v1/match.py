import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rbac import require_permission
from app.core.rate_limit import limiter, match_limit
from fastapi import Request
from app.schemas.assignment import MatchRequest, MatchResponse
from app.services.matching import run_matching, decline_and_rematch

router = APIRouter(prefix="/match", tags=["matching"])


@router.post("", response_model=MatchResponse)
@limiter.limit(match_limit)
async def run_match(
    request: Request,
    payload: MatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("match")),
):
    """
    Run the bipartite matching algorithm.
    Pass dry_run=true to preview assignments without persisting.
    """
    result = await run_matching(
        db=db,
        zone_id=payload.zone_id,
        need_ids=payload.need_ids,
        dry_run=payload.dry_run,
        user_id=current_user["user_id"],
    )
    return MatchResponse(**result)


@router.post("/decline/{assignment_id}")
async def decline_assignment(
    assignment_id: uuid.UUID,
    decline_reason: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("write")),
):
    """Decline an assignment and trigger automatic rematch."""
    result = await decline_and_rematch(
        db=db,
        assignment_id=assignment_id,
        decline_reason=decline_reason,
        user_id=current_user["user_id"],
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"status": "declined_and_rematched", "rematch": result}