import uuid
from datetime import datetime
from sqlalchemy import String, text, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    added_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False)  # 'date_idea' | 'place' | 'other'
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_done: Mapped[bool] = mapped_column(
        default=False,
        server_default=text("false"),
        nullable=False
    )
    done_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    creator: Mapped["User"] = relationship("User")
