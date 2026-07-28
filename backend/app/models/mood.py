import uuid
from datetime import datetime, date
from sqlalchemy import String, text, ForeignKey, Date, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class MoodCheckin(Base):
    __tablename__ = "mood_checkins"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    mood: Mapped[str] = mapped_column(String(20), nullable=False)  # 'happy' | 'loved' | 'meh' | 'sad' | 'excited'
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[date] = mapped_column(
        Date,
        server_default=text("CURRENT_DATE"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User")

    # Unique check-in per user per day constraint
    __table_args__ = (
        UniqueConstraint("user_id", "checked_at", name="uq_user_mood_checked_at"),
    )
