import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


class AssignmentStatus(str, enum.Enum):
    PENDING = "pending"
    NOTIFIED = "notified"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REMATCHED = "rematched"


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    need_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("needs.id"), nullable=False)
    volunteer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("volunteers.id"), nullable=False)
    status: Mapped[AssignmentStatus] = mapped_column(
        SAEnum(AssignmentStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=AssignmentStatus.PENDING,
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    decline_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    notification_sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    need: Mapped["Need"] = relationship("Need", back_populates="assignment")
    volunteer: Mapped["Volunteer"] = relationship("Volunteer", back_populates="assignments")