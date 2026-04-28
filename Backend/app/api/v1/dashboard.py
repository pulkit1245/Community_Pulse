"""
Dashboard aggregation endpoints.
  GET /dashboard/stats   → KPI numbers for the StatsBar
  GET /dashboard/zones   → Zone heatmap data
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.need import Need, NeedStatus, UrgencyLevel
from app.models.assignment import Assignment, AssignmentStatus
from app.models.volunteer import Volunteer
from app.models.zone import Zone

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ── Response schemas ──────────────────────────────────────────

class DashboardStats(BaseModel):
    total_needs: int
    unmatched_needs: int
    critical_needs: int
    available_volunteers: int
    total_volunteers: int
    active_tasks: int
    people_reached_today: int
    avg_dispatch_minutes: float


class ZoneData(BaseModel):
    zone_id: str
    name: str
    need_score: float
    critical_count: int
    moderate_count: int
    low_count: int
    volunteer_count: int
    lat: float
    lng: float


# ── Endpoints ─────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    from sqlalchemy import text

    # Use raw SQL to avoid enum/VARCHAR comparison issues
    total_needs = (await db.execute(text("SELECT COUNT(*) FROM needs"))).scalar() or 0

    unmatched_needs = (
        await db.execute(text("SELECT COUNT(*) FROM needs WHERE status = 'open'"))
    ).scalar() or 0

    critical_needs = (
        await db.execute(
            text("SELECT COUNT(*) FROM needs WHERE UPPER(urgency) IN ('CRITICAL', 'HIGH')")
        )
    ).scalar() or 0

    total_volunteers = (await db.execute(text("SELECT COUNT(*) FROM volunteers"))).scalar() or 0

    available_volunteers = (
        await db.execute(text("SELECT COUNT(*) FROM volunteers WHERE is_available = true"))
    ).scalar() or 0

    active_tasks = (
        await db.execute(
            text("SELECT COUNT(*) FROM assignments WHERE LOWER(status) IN ('notified', 'accepted', 'in_progress')")
        )
    ).scalar() or 0

    people_reached = (
        await db.execute(
            text(
                "SELECT COALESCE(SUM(people_count), 0) FROM needs "
                "WHERE status = 'completed' AND updated_at >= CURRENT_DATE"
            )
        )
    ).scalar() or 0

    return DashboardStats(
        total_needs=total_needs,
        unmatched_needs=unmatched_needs,
        critical_needs=critical_needs,
        available_volunteers=available_volunteers,
        total_volunteers=total_volunteers,
        active_tasks=active_tasks,
        people_reached_today=int(people_reached),
        avg_dispatch_minutes=4.2,
    )


# Rough lat/lng for demo zones (keyed by zone name)
_ZONE_COORDS = {
    "North Sector":  (28.75, 77.12),
    "South Sector":  (28.50, 77.20),
    "East Sector":   (28.63, 77.35),
    "West Sector":   (28.63, 76.95),
    "Central Zone":  (28.63, 77.22),
    "River Belt":    (28.70, 77.30),
}

URGENCY_SCORE_MAP = {
    UrgencyLevel.CRITICAL: 95,
    UrgencyLevel.HIGH: 70,
    UrgencyLevel.MEDIUM: 40,
    UrgencyLevel.LOW: 10,
}


@router.get("/zones", response_model=List[ZoneData])
async def get_zones_heatmap(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    from sqlalchemy import text

    zones_result = await db.execute(select(Zone))
    zones = zones_result.scalars().all()

    result = []
    for zone in zones:
        zone_id = str(zone.id)

        # Use raw SQL with UPPER() to handle mixed-case urgency stored in DB
        counts = (await db.execute(text(f"""
            SELECT
                COUNT(*) FILTER (WHERE UPPER(urgency) IN ('CRITICAL', 'HIGH'))  AS critical_count,
                COUNT(*) FILTER (WHERE UPPER(urgency) = 'MEDIUM')               AS moderate_count,
                COUNT(*) FILTER (WHERE UPPER(urgency) = 'LOW')                  AS low_count,
                COUNT(*)                                                          AS total_count,
                COALESCE(
                  AVG(CASE
                    WHEN UPPER(urgency) = 'CRITICAL' THEN 95
                    WHEN UPPER(urgency) = 'HIGH'     THEN 70
                    WHEN UPPER(urgency) = 'MEDIUM'   THEN 40
                    ELSE 10
                  END), 0
                ) AS avg_score
            FROM needs
            WHERE zone_id = '{zone_id}'
              AND LOWER(status) != 'completed'
        """))).fetchone()

        vol_count = (await db.execute(
            text(f"SELECT COUNT(*) FROM volunteers WHERE zone_id = '{zone_id}'")
        )).scalar() or 0

        lat, lng = _ZONE_COORDS.get(zone.name, (28.63, 77.22))

        result.append(ZoneData(
            zone_id=zone_id,
            name=zone.name,
            need_score=round(float(counts.avg_score or 0), 1),
            critical_count=int(counts.critical_count or 0),
            moderate_count=int(counts.moderate_count or 0),
            low_count=int(counts.low_count or 0),
            volunteer_count=int(vol_count),
            lat=lat,
            lng=lng,
        ))

    return result

