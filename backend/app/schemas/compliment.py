from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class ComplimentResponse(BaseModel):
    id: uuid.UUID
    message: str
    created_by: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
