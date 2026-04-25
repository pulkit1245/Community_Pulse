import uuid
from typing import List, Optional
import numpy as np
from scipy.optimize import linear_sum_assignment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.need import Need, NeedStatus
from app.models.volunteer import Volunteer
from app.models.assignment import Assignment, AssignmentStatus
from app.core.audit import write_audit

URGENCY_WEIGHTS = {"critical": 4.0, "high": 3.0, "medium": 2.0, "low": 1.0}
SKILL_MATCH_BONUS = 2.0
ZONE_MATCH_BONUS = 3.0
AVAILABILITY_PENALTY = -999.0


def _compute_match_score(need: Need, volunteer: Volunteer) -> float:
    """
    Compute a match score for a need-volunteer pair.
    Higher is better. Returns AVAILABILITY_PENALTY if volunteer unavailable.
    """
    if not volunteer.is_available or not volunteer.is_active:
        return AVAILABILITY_PENALTY

    score = 0.0

    # Zone match
    if str(need.zone_id) == str(volunteer.zone_id):
        score += ZONE_MATCH_BONUS

    # Skill match — fraction of required skills the volunteer has
    required = set(s.lower() for s in (need.skills_required or []))
    has = set(s.lower() for s in (volunteer.skills or []))
    if required:
        overlap = len(required & has) / len(required)
        score += overlap * SKILL_MATCH_BONUS

    # Urgency weight
    score += URGENCY_WEIGHTS.get(need.urgency, 1.0)

    # Prefer volunteers with fewer current assignments (load balancing)
    active_load = volunteer.total_assignments - volunteer.completed_assignments
    score -= active_load * 0.1

    return score


def _build_weight_matrix(needs: List[Need], volunteers: List[Volunteer]) -> np.ndarray:
    """Build an N×M cost matrix (negated scores for minimisation)."""
    n, m = len(needs), len(volunteers)
    matrix = np.zeros((n, m))
    for i, need in enumerate(needs):
        for j, vol in enumerate(volunteers):
            matrix[i][j] = -_compute_match_score(need, vol)
    return matrix


async def run_matching(
    db: AsyncSession,
    zone_id: Optional[uuid.UUID] = None,
    need_ids: Optional[List[uuid.UUID]] = None,
    dry_run: bool = False,
    user_id: Optional[str] = None,
) -> dict:
    """
    Run the bipartite matching algorithm and persist assignments.
    Returns summary dict with assignments and unmatched needs.
    """
    # Fetch open needs
    needs_query = select(Need).where(Need.status == NeedStatus.OPEN)
    if zone_id:
        needs_query = needs_query.where(Need.zone_id == zone_id)
    if need_ids:
        needs_query = needs_query.where(Need.id.in_(need_ids))
    needs_result = await db.execute(needs_query)
    needs = list(needs_result.scalars().all())

    # Fetch available volunteers
    vols_query = select(Volunteer).where(Volunteer.is_available == True, Volunteer.is_active == True)
    if zone_id:
        vols_query = vols_query.where(Volunteer.zone_id == zone_id)
    vols_result = await db.execute(vols_query)
    volunteers = list(vols_result.scalars().all())

    if not needs or not volunteers:
        return {
            "assignments": [],
            "total_matched": 0,
            "unmatched_needs": [str(n.id) for n in needs],
            "dry_run": dry_run,
        }

    matrix = _build_weight_matrix(needs, volunteers)

    # scipy linear_sum_assignment solves the assignment problem
    row_ind, col_ind = linear_sum_assignment(matrix)

    assignments = []
    matched_need_ids = set()

    for r, c in zip(row_ind, col_ind):
        score = -matrix[r][c]
        if score <= 0:
            continue  # No valid match

        need = needs[r]
        volunteer = volunteers[c]
        matched_need_ids.add(str(need.id))

        if not dry_run:
            assignment = Assignment(
                need_id=need.id,
                volunteer_id=volunteer.id,
                status=AssignmentStatus.PENDING,
                match_score=round(score, 4),
            )
            db.add(assignment)
            await db.flush()

            need.status = NeedStatus.ASSIGNED
            volunteer.total_assignments += 1

            await write_audit(
                db=db,
                action="assignment.created",
                entity_type="assignment",
                entity_id=assignment.id,
                user_id=user_id,
                details={
                    "need_id": str(need.id),
                    "volunteer_id": str(volunteer.id),
                    "score": round(score, 4),
                },
            )

            assignments.append({
                "need_id": str(need.id),
                "volunteer_id": str(volunteer.id),
                "match_score": round(score, 4),
                "assignment_id": str(assignment.id),
            })
        else:
            assignments.append({
                "need_id": str(need.id),
                "volunteer_id": str(volunteer.id),
                "match_score": round(score, 4),
                "assignment_id": None,
            })

    unmatched = [str(n.id) for n in needs if str(n.id) not in matched_need_ids]

    return {
        "assignments": assignments,
        "total_matched": len(assignments),
        "unmatched_needs": unmatched,
        "dry_run": dry_run,
    }


async def decline_and_rematch(
    db: AsyncSession,
    assignment_id: uuid.UUID,
    decline_reason: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Optional[dict]:
    """Mark assignment declined, free volunteer, and try to rematch the need."""
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        return None

    assignment.status = AssignmentStatus.DECLINED
    assignment.decline_reason = decline_reason

    # Free the volunteer
    vol_result = await db.execute(select(Volunteer).where(Volunteer.id == assignment.volunteer_id))
    volunteer = vol_result.scalar_one_or_none()
    if volunteer:
        volunteer.is_available = True

    # Reset need to open
    need_result = await db.execute(select(Need).where(Need.id == assignment.need_id))
    need = need_result.scalar_one_or_none()
    if need:
        need.status = NeedStatus.OPEN

    await write_audit(
        db=db,
        action="assignment.declined",
        entity_type="assignment",
        entity_id=assignment_id,
        user_id=user_id,
        details={"reason": decline_reason},
    )

    # Attempt rematch
    rematch_result = await run_matching(
        db=db, need_ids=[assignment.need_id], user_id=user_id
    )
    return rematch_result