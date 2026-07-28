from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import List, Optional

class QuestionResponse(BaseModel):
    id: uuid.UUID
    question: str
    options: List[str]
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class QuizAttemptRequest(BaseModel):
    question_id: uuid.UUID
    selected: str

class QuizAttemptResponse(BaseModel):
    is_correct: bool
    correct_answer: str

class QuizScoreResponse(BaseModel):
    total: int
    correct: int
    incorrect: int
    percentage: float

class QuizHistoryResponse(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    question_text: str
    selected: str
    is_correct: bool
    attempted_at: datetime

    model_config = ConfigDict(from_attributes=True)
