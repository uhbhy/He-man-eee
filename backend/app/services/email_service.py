import os
import socket
import smtplib
from email.message import EmailMessage
from typing import Any, Dict, Optional
from jinja2 import Environment, FileSystemLoader
import httpx

from app.config import settings
from app.models.user import User

# Jinja2 environment setup
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "email")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=True)

# Notification templates config dictionary
NOTIFICATION_TEMPLATES = {
    "hug": {
        "accent_color": "#f8b4c0",
        "icon_emoji": "🤗",
        "subject": "{sender_name} sent you a hug 🤗",
        "headline": "A hug is on its way!",
        "cta_text": "Send one back 💛",
    },
    "kiss": {
        "accent_color": "#f6a6c1",
        "icon_emoji": "😘",
        "subject": "{sender_name} sent you a kiss 😘",
        "headline": "Pucker up!",
        "cta_text": "Open the app",
    },
    "mood": {
        "accent_color": "#f6d68a",
        "icon_emoji": "🌤️",
        "subject": "{sender_name} checked in feeling {mood} today",
        "headline": "Mood update from {sender_name}",
        "cta_text": "See how they're doing",
    },
    "moment": {
        "accent_color": "#c9b6e4",
        "icon_emoji": "📸",
        "subject": "{sender_name} added a new memory 📸",
        "headline": "A new moment was just captured",
        "cta_text": "View the moment",
    },
    "wishlist": {
        "accent_color": "#a8d8c9",
        "icon_emoji": "🌟",
        "subject": "{sender_name} added to your bucket list 🌟",
        "headline": "A new dream was added",
        "cta_text": "View bucket list",
    },
    "compliment": {
        "accent_color": "#f2b6c1",
        "icon_emoji": "💌",
        "subject": "{sender_name} sent you a compliment 💌",
        "headline": "Someone's thinking sweet thoughts about you",
        "cta_text": "Read it",
    },
}


def render_simple_body(main_text: str, detail: Optional[str] = None) -> str:
    html = f'<p style="margin:0 0 12px 0;">{main_text}</p>'
    if detail:
        html += f'''
        <div style="background-color:#fdf6f0; border-radius:12px; padding:16px; margin-top:8px;
                    font-style:italic; color:#7a6a6a;">
          "{detail}"
        </div>'''
    return html


def render_mood_body(mood: str, note: Optional[str] = None) -> str:
    html = f'<p style="margin:0 0 12px 0;">Feeling <strong>{mood}</strong> today.</p>'
    if note:
        html += f'''
        <div style="background-color:#fdf6f0; border-radius:12px; padding:16px; margin-top:8px; color:#7a6a6a;">
          {note}
        </div>'''
    return html


def render_moment_body(caption: Optional[str], image_url: Optional[str], media_type: str = "photo") -> str:
    html = ""
    if image_url and media_type == "photo":
        html += f'''
        <img src="{image_url}" alt="New moment"
             style="width:100%; border-radius:14px; margin-bottom:14px; display:block;" />'''
    elif caption:
        html += f'<p style="margin:0 0 12px 0;">Added a new {media_type}.</p>'

    if caption:
        html += f'<p style="margin:0;">{caption}</p>'
    elif not image_url:
        html += f'<p style="margin:0;">Uploaded a new {media_type} memory.</p>'
    return html


def _build_body_html_and_text(notification_type: str, sender_name: str, context: Dict[str, Any]) -> tuple[str, str]:
    detail = context.get("detail") or context.get("note")
    caption = context.get("caption")
    image_url = context.get("image_url")
    mood = context.get("mood", "")
    media_type = context.get("media_type", "photo")

    if notification_type in ("hug", "kiss"):
        main_text = f"{sender_name} just sent you a virtual {notification_type}! Go check on them and send some love back."
        body_html = render_simple_body(main_text, detail)
        text = f"{main_text}" + (f' Note: "{detail}"' if detail else "")
    elif notification_type == "mood":
        body_html = render_mood_body(mood, detail)
        text = f"{sender_name} checked in feeling {mood} today." + (f" Note: {detail}" if detail else "")
    elif notification_type == "moment":
        body_html = render_moment_body(caption, image_url, media_type)
        text = f"{sender_name} uploaded a new {media_type}." + (f" Caption: {caption}" if caption else "")
    elif notification_type == "wishlist":
        item_title = context.get("title", "a new item")
        main_text = f"{sender_name} added <strong>{item_title}</strong> to your shared wishlist!"
        body_html = render_simple_body(main_text, detail)
        text = f"{sender_name} added '{item_title}' to your shared wishlist."
    elif notification_type == "compliment":
        main_text = f"{sender_name} sent a sweet compliment your way:"
        body_html = render_simple_body(main_text, detail)
        text = f"{sender_name} sent you a compliment: {detail}" if detail else f"{sender_name} sent you a compliment."
    else:
        main_text = context.get("main_text", f"Notification from {sender_name}")
        body_html = render_simple_body(main_text, detail)
        text = main_text

    return body_html, text


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


def send_partner_email(sender: User, notification_type: str, context: Optional[Dict[str, Any]] = None) -> bool:
    if context is None:
        context = {}

    recipient = _recipient_email_for(sender)
    if not recipient:
        print(f"[MOCK EMAIL] Missing recipient for sender={sender.display_name} type={notification_type}")
        return True

    cfg = NOTIFICATION_TEMPLATES.get(notification_type, NOTIFICATION_TEMPLATES["hug"])

    fmt_context = {"sender_name": sender.display_name, **context}
    subject = cfg["subject"].format(**fmt_context)
    headline = cfg["headline"].format(**fmt_context)
    cta_text = cfg["cta_text"].format(**fmt_context)
    cta_url = context.get("cta_url", getattr(settings, "CORS_ORIGINS", "http://localhost:5173").split(",")[0])

    body_html, plain_text = _build_body_html_and_text(notification_type, sender.display_name, context)

    template = env.get_template("base.html")
    full_html = template.render(
        headline=headline,
        accent_color=cfg["accent_color"],
        icon_emoji=cfg["icon_emoji"],
        body_html=body_html,
        cta_text=cta_text,
        cta_url=cta_url,
    )

    if not email_notifications_enabled():
        print(f"[MOCK EMAIL] To: {recipient} | Subject: {subject}\nHTML length: {len(full_html)}\nText: {plain_text}")
        return True

    # 1. Use Resend HTTP API if configured
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
                    "html": full_html,
                    "text": plain_text,
                },
                timeout=10.0,
            )
            if response.status_code in (200, 201):
                print(f"[RESEND EMAIL SUCCESS] Sent '{notification_type}' to {recipient}")
                return True
            else:
                print(f"[RESEND EMAIL FAILED] Status {response.status_code}: {response.text}")
        except Exception as exc:
            print(f"[RESEND EMAIL ERROR]: {exc}")

    # 2. Fallback to SMTP
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
        message.set_content(plain_text)
        message.add_alternative(full_html, subtype="html")

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
