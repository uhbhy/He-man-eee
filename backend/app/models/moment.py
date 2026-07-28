import uuid
from datetime import datetime, date
from sqlalchemy import String, text, ForeignKey, Date, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Moment(Base):
    __tablename__ = "moments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    uploader_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    media_url: Mapped[str] = mapped_column(Text, nullable=False)
    storage_file_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'photo' | 'video'
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    taken_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    uploader: Mapped["User"] = relationship("User")
