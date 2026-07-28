import uuid
from datetime import datetime
from sqlalchemy import text, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Compliment(Base):
    __tablename__ = "compliments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        server_default=text("true"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    creator: Mapped["User"] = relationship("User")
