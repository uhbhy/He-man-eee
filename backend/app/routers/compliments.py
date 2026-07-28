from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql.expression import func

from app.database import get_db
from app.models.compliment import Compliment
from app.models.user import User
from app.schemas.compliment import ComplimentResponse
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/compliments", tags=["compliments"])

@router.get("/random", response_model=ComplimentResponse)
async def get_random_compliment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get one random active compliment from the database.
    """
    result = await db.execute(
        select(Compliment)
        .where(Compliment.is_active == True)
        .order_by(func.random())
        .limit(1)
    )
    compliment = result.scalar_one_or_none()
    
    if not compliment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active compliments found. Please seed the database first!"
        )
        
    return compliment

@router.get("", response_model=List[ComplimentResponse])
async def list_compliments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all compliments (admin view).
    """
    result = await db.execute(
        select(Compliment)
        .order_by(Compliment.created_at.desc())
    )
    compliments = result.scalars().all()
    return compliments
