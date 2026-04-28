from fastapi import APIRouter
from app.api.v1 import ingest, needs, volunteers, match, tasks, auth, zones, dashboard
from app.core.config import settings

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(ingest.router)
router.include_router(needs.router)
router.include_router(volunteers.router)
router.include_router(match.router)
router.include_router(tasks.router)
router.include_router(zones.router)
router.include_router(dashboard.router)

if settings.enable_ml_routes:
    from app.api.v1 import ml

    router.include_router(ml.router)
