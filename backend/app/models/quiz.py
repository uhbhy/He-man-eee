import uuid
from datetime import datetime
from typing import List
from sqlalchemy import String, text, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[List[str]] = mapped_column(JSONB, nullable=False)  # ["option A", "option B", ...]
    answer: Mapped[str] = mapped_column(Text, nullable=False)  # correct answer string
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    attempts: Mapped[List["QuizAttempt"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False
    )
    selected: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        server_default=text("now()"),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    question: Mapped["QuizQuestion"] = relationship(back_populates="attempts")
