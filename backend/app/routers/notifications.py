from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.services.email_service import send_partner_email

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/send", status_code=status.HTTP_200_OK)
async def trigger_partner_notification(
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification_type = payload.get("type")
    if notification_type not in ("hug", "kiss"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid notification type. Must be 'hug' or 'kiss'."
        )

    success = send_partner_email(current_user, notification_type, {"detail": payload.get("note")})
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to deliver email notification."
        )

    return {"detail": f"Virtual {notification_type} email sent successfully!"}
