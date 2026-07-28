from pydantic import BaseModel, ConfigDict, Field
import uuid
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse

class WishlistItemCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: str = Field(..., pattern="^(date_idea|place|other)$")

class WishlistItemResponse(BaseModel):
    id: uuid.UUID
    added_by: uuid.UUID
    category: str
    title: str
    description: Optional[str] = None
    is_done: bool
    done_at: Optional[datetime] = None
    created_at: datetime
    creator: UserResponse

    model_config = ConfigDict(from_attributes=True)
