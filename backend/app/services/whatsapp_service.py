import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.models.whatsapp import WhatsAppLog


def _recipient_number_for(sender: User) -> str:
    if sender.role == "boyfriend":
        return settings.GIRLFRIEND_WHATSAPP_NUMBER
    return settings.BOYFRIEND_WHATSAPP_NUMBER


async def _deliver_whatsapp_message(
    sender: User,
    message_type: str,
    message_text: str,
    db: AsyncSession
) -> bool:
    recipient_num = _recipient_number_for(sender)
    status = "mock_success"

    if settings.WHATSAPP_API_TOKEN and "mock" not in settings.WHATSAPP_API_TOKEN.lower() and settings.WHATSAPP_PHONE_NUMBER_ID and recipient_num:
        url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient_num,
            "type": "text",
            "text": {
                "body": message_text,
            },
        }
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
                if resp.status_code in (200, 201):
                    status = "success"
                else:
                    status = f"failed_api_{resp.status_code}"
                    print(f"WhatsApp API failed with status {resp.status_code}: {resp.text}")
        except Exception as exc:
            status = "failed_network"
            print(f"WhatsApp network error: {exc}")
    else:
        print(f"[MOCK WHATSAPP ALERT] To: {recipient_num or 'Unknown Partner'} | From: {sender.display_name} | Message: {message_text}")

    log_entry = WhatsAppLog(
        sender_id=sender.id,
        type=message_type,
        status=status,
    )
    db.add(log_entry)
    await db.commit()

    return status in ("success", "mock_success")


async def send_whatsapp_alert(
    sender: User,
    alert_type: str,
    db: AsyncSession
) -> bool:
    emoji = "[hug]" if alert_type == "hug" else "[kiss]"
    message_text = f"Hey! {sender.display_name} just sent you a virtual {alert_type}! {emoji} Go give them some love!"
    return await _deliver_whatsapp_message(sender, alert_type, message_text, db)


async def send_mood_checkin_alert(
    sender: User,
    mood: str,
    note: str | None,
    db: AsyncSession
) -> bool:
    message_text = f"{sender.display_name} just checked in feeling {mood} today."
    if note:
        message_text += f" Note: {note}"
    return await _deliver_whatsapp_message(sender, "mood_checkin", message_text, db)
