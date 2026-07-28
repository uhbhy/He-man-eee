from datetime import date
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.mood import MoodCheckin
from app.models.user import User
from app.schemas.mood import MoodCheckinCreate, MoodCheckinResponse, TodayMoodResponse
from app.middleware.auth_middleware import get_current_user
from app.services.email_service import send_partner_email

router = APIRouter(prefix="/mood", tags=["mood"])


@router.post("", response_model=MoodCheckinResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_mood(
    payload: MoodCheckinCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record or update today's mood check-in for the current user.
    If the user already checked in today, the existing record is updated.
    """
    today = date.today()

    # Check for existing check-in today
    result = await db.execute(
        select(MoodCheckin)
        .options(selectinload(MoodCheckin.user))
        .where(MoodCheckin.user_id == current_user.id)
        .where(MoodCheckin.checked_at == today)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.mood = payload.mood
        existing.note = payload.note
        await db.commit()
        await db.refresh(existing, ["user"])
        checkin = existing
    else:
        checkin = MoodCheckin(
            user_id=current_user.id,
            mood=payload.mood,
            note=payload.note,
            checked_at=today
        )
        db.add(checkin)
        await db.commit()

        result = await db.execute(
            select(MoodCheckin)
            .options(selectinload(MoodCheckin.user))
            .where(MoodCheckin.id == checkin.id)
        )
        checkin = result.scalar_one()

    send_partner_email(current_user, "mood", {"mood": payload.mood, "note": payload.note})
    return _enrich(checkin)


@router.get("/today", response_model=TodayMoodResponse)
async def get_today_moods(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return today's mood check-ins for both users.
    Returns null for any user who hasn't checked in yet.
    """
    today = date.today()
    result = await db.execute(
        select(MoodCheckin)
        .options(selectinload(MoodCheckin.user))
        .where(MoodCheckin.checked_at == today)
    )
    checkins = result.scalars().all()

    response = TodayMoodResponse()
    for c in checkins:
        enriched = _enrich(c)
        if c.user and c.user.role == "boyfriend":
            response.boyfriend = enriched
        elif c.user and c.user.role == "girlfriend":
            response.girlfriend = enriched

    return response


@router.get("/history", response_model=List[MoodCheckinResponse])
async def get_mood_history(
    days: int = Query(default=14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return the last N days of mood check-ins for the current user.
    Default: 14 days. Max: 90 days.
    """
    result = await db.execute(
        select(MoodCheckin)
        .options(selectinload(MoodCheckin.user))
        .where(MoodCheckin.user_id == current_user.id)
        .order_by(MoodCheckin.checked_at.desc())
        .limit(days)
    )
    checkins = result.scalars().all()
    return [_enrich(c) for c in checkins]


def _enrich(checkin: MoodCheckin) -> MoodCheckinResponse:
    """Merge user display data into the response model."""
    return MoodCheckinResponse(
        id=checkin.id,
        user_id=checkin.user_id,
        mood=checkin.mood,
        note=checkin.note,
        checked_at=checkin.checked_at,
        created_at=checkin.created_at,
        username=checkin.user.username if checkin.user else None,
        display_name=checkin.user.display_name if checkin.user else None,
    )
