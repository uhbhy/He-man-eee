import socket
import smtplib
from email.message import EmailMessage

from app.config import settings
from app.models.user import User


def _recipient_email_for(sender: User) -> str:
    if sender.role == "boyfriend":
        return settings.GIRLFRIEND_EMAIL
    return settings.BOYFRIEND_EMAIL


def email_notifications_enabled() -> bool:
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.SMTP_FROM_EMAIL
        and settings.BOYFRIEND_EMAIL
        and settings.GIRLFRIEND_EMAIL
    )


def send_partner_email(sender: User, subject: str, body: str) -> bool:
    recipient = _recipient_email_for(sender)
    if not recipient:
        print(f"[MOCK EMAIL] Missing recipient for sender={sender.display_name} subject={subject}")
        return True

    if not email_notifications_enabled():
        print(f"[MOCK EMAIL] To: {recipient} | Subject: {subject} | Body: {body}")
        return True

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(body)

    try:
        # Resolve hostname strictly to IPv4 to bypass Render free tier IPv6 network unreachable errors
        addr_info = socket.getaddrinfo(settings.SMTP_HOST, settings.SMTP_PORT, socket.AF_INET, socket.SOCK_STREAM)
        ipv4_host = addr_info[0][4][0]

        with smtplib.SMTP(ipv4_host, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo(settings.SMTP_HOST)
            smtp.starttls()
            smtp.ehlo(settings.SMTP_HOST)
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    except Exception as exc:
        print(f"SMTP delivery failed: {exc}")
        return False

    return True

