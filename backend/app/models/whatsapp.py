import uuid
from datetime import datetime
from sqlalchemy import String, text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'hug' | 'kiss'
    sent_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'success', 'failed', 'rate_limited'

    # Relationships
    sender: Mapped["User"] = relationship("User")
