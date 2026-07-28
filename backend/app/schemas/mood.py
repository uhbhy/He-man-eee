from datetime import date, datetime
import uuid
from typing import Optional, Literal
from pydantic import BaseModel, Field


VALID_MOODS = Literal["happy", "loved", "meh", "sad", "excited"]


class MoodCheckinCreate(BaseModel):
    mood: VALID_MOODS
    note: Optional[str] = Field(None, max_length=500)


class MoodCheckinResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    mood: str
    note: Optional[str]
    checked_at: date
    created_at: datetime
    username: Optional[str] = None
    display_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TodayMoodResponse(BaseModel):
    """Summary of both users' moods for today."""
    boyfriend: Optional[MoodCheckinResponse] = None
    girlfriend: Optional[MoodCheckinResponse] = None
