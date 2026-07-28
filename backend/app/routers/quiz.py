import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.quiz import QuizQuestion, QuizAttempt
from app.models.user import User
from app.schemas.quiz import (
    QuestionResponse,
    QuizAttemptRequest,
    QuizAttemptResponse,
    QuizScoreResponse,
    QuizHistoryResponse
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all quiz questions.
    The response list is randomized/shuffled, and the answer field is hidden.
    """
    result = await db.execute(select(QuizQuestion))
    questions = list(result.scalars().all())

    if len(questions) <= limit:
        random.shuffle(questions)
        return questions

    return random.sample(questions, limit)

@router.post("/attempt", response_model=QuizAttemptResponse)
async def submit_attempt(
    payload: QuizAttemptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit an attempt to answer a question.
    Saves the attempt to database and returns correctness and the correct answer.
    """
    # Fetch the question
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id == payload.question_id))
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
        
    is_correct = payload.selected == question.answer
    
    # Create attempt log
    attempt = QuizAttempt(
        user_id=current_user.id,
        question_id=payload.question_id,
        selected=payload.selected,
        is_correct=is_correct
    )
    
    db.add(attempt)
    await db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer
    }

@router.get("/score", response_model=QuizScoreResponse)
async def get_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the overall score stats of the current user.
    """
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    )
    attempts = list(result.scalars().all())
    
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    incorrect = total - correct
    percentage = (correct / total * 100) if total > 0 else 0.0
    
    return {
        "total": total,
        "correct": correct,
        "incorrect": incorrect,
        "percentage": percentage
    }

@router.get("/history", response_model=List[QuizHistoryResponse])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all past attempts for the current user, including question text.
    """
    result = await db.execute(
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.question))
        .where(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.attempted_at.desc())
    )
    attempts = list(result.scalars().all())
    
    history = []
    for a in attempts:
        # Prevent errors if questions are somehow deleted
        question_text = a.question.question if a.question else "Deleted Question"
        history.append({
            "id": a.id,
            "question_id": a.question_id,
            "question_text": question_text,
            "selected": a.selected,
            "is_correct": a.is_correct,
            "attempted_at": a.attempted_at
        })
        
    return history
