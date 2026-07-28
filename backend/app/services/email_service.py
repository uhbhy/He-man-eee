import socket
import smtplib
from email.message import EmailMessage
import httpx

from app.config import settings
from app.models.user import User


def _recipient_email_for(sender: User) -> str:
    if sender.role == "boyfriend":
        return settings.GIRLFRIEND_EMAIL
    return settings.BOYFRIEND_EMAIL


def email_notifications_enabled() -> bool:
    has_resend = bool(settings.RESEND_API_KEY and settings.BOYFRIEND_EMAIL and settings.GIRLFRIEND_EMAIL)
    has_smtp = bool(
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.SMTP_FROM_EMAIL
        and settings.BOYFRIEND_EMAIL
        and settings.GIRLFRIEND_EMAIL
    )
    return has_resend or has_smtp


def send_partner_email(sender: User, subject: str, body: str) -> bool:
    recipient = _recipient_email_for(sender)
    if not recipient:
        print(f"[MOCK EMAIL] Missing recipient for sender={sender.display_name} subject={subject}")
        return True

    if not email_notifications_enabled():
        print(f"[MOCK EMAIL] To: {recipient} | Subject: {subject} | Body: {body}")
        return True

    # 1. Use Resend HTTP API if configured (Bypasses Render outbound SMTP port blocking)
    if settings.RESEND_API_KEY:
        try:
            from_email = settings.RESEND_FROM_EMAIL or "onboarding@resend.dev"
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_email,
                    "to": [recipient],
                    "subject": subject,
                    "text": body,
                },
                timeout=10.0,
            )
            if response.status_code in (200, 201):
                print(f"[RESEND EMAIL SUCCESS] Sent to {recipient}")
                return True
            else:
                print(f"[RESEND EMAIL FAILED] Status {response.status_code}: {response.text}")
        except Exception as exc:
            print(f"[RESEND EMAIL ERROR]: {exc}")

    # 2. Fallback to raw SMTP (For local dev or non-restricted environments)
    if (
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.SMTP_FROM_EMAIL
    ):
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = recipient
        message.set_content(body)

        try:
            addr_info = socket.getaddrinfo(settings.SMTP_HOST, settings.SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
            ipv4_host = addr_info[0][4][0]

            with smtplib.SMTP(ipv4_host, settings.SMTP_PORT, timeout=10) as smtp:
                smtp.ehlo(settings.SMTP_HOST)
                smtp.starttls()
                smtp.ehlo(settings.SMTP_HOST)
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                smtp.send_message(message)
                return True
        except Exception as exc:
            print(f"[SMTP EMAIL ERROR]: {exc}")
            return False

    return False
