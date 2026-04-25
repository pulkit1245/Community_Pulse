from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from app.models.audit_log import AuditLog


async def write_audit(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    user_id: Optional[str],
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
):
    """Write an immutable audit log entry on every state-changing action."""
    stmt = insert(AuditLog).values(
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        user_id=str(user_id) if user_id else None,
        details=details or {},
        ip_address=ip_address,
        created_at=datetime.now(timezone.utc),
    )
    await db.execute(stmt)