from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime, date
from typing import Optional
from app.schemas.user import UserResponse

class MomentResponse(BaseModel):
    id: uuid.UUID
    uploader_id: uuid.UUID
    media_url: str
    storage_file_id: Optional[str] = None
    media_type: str
    caption: Optional[str] = None
    taken_at: Optional[date] = None
    created_at: datetime
    uploader: UserResponse

    model_config = ConfigDict(from_attributes=True)
