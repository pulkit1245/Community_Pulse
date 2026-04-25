import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum as SAEnum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


class NeedStatus(str, enum.Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UrgencyLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Need(Base):
    __tablename__ = "needs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    urgency: Mapped[UrgencyLevel] = mapped_column(SAEnum(UrgencyLevel), default=UrgencyLevel.MEDIUM)
    status: Mapped[NeedStatus] = mapped_column(SAEnum(NeedStatus), default=NeedStatus.OPEN)
    zone_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("zones.id"), nullable=False)
    requester_name: Mapped[str] = mapped_column(String(200), nullable=True)
    requester_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    skills_required: Mapped[list] = mapped_column(JSON, default=list)
    source: Mapped[str] = mapped_column(String(50), default="api")  # api, whatsapp, sms
    embedding_hash: Mapped[str] = mapped_column(String(64), nullable=True, index=True)
    people_count: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    zone: Mapped["Zone"] = relationship("Zone", back_populates="needs")
    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="need", uselist=False)