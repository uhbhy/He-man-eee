from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.whatsapp import WhatsAppLog
from app.middleware.auth_middleware import get_current_user
from app.services.whatsapp_service import send_whatsapp_alert

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.post("/send", status_code=status.HTTP_200_OK)
async def trigger_whatsapp_alert(
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a virtual hug or kiss alert to the partner.
    Payload: {"type": "hug" | "kiss"}
    """
    alert_type = payload.get("type")
    if alert_type not in ("hug", "kiss"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid alert type. Must be 'hug' or 'kiss'."
        )

    success = await send_whatsapp_alert(current_user, alert_type, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to deliver alert notification."
        )

    return {"detail": f"Virtual {alert_type} sent successfully!"}
