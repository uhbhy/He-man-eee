import os
import tempfile
import uuid
from app.models.user import User
from app.services.email_service import NOTIFICATION_TEMPLATES, send_partner_email

def main():
    dummy_user = User(
        id=uuid.uuid4(),
        username="abhi",
        display_name="Abhi",
        role="boyfriend"
    )

    out_dir = os.path.join(tempfile.gettempdir(), "email_previews")
    os.makedirs(out_dir, exist_ok=True)
    print(f"Rendering email previews to: {out_dir}")

    test_cases = {
        "hug": {"detail": "Thinking of you so much today!"},
        "kiss": {"detail": "Can't wait to see you tonight!"},
        "mood": {"mood": "excited", "note": "Planning our upcoming weekend trip!"},
        "moment": {"caption": "Unforgettable dinner date", "image_url": "https://ik.imagekit.io/demo/tr:w-600/medium_cafe_b680f4f9.jpg", "media_type": "photo"},
        "wishlist": {"title": "Stargazing picnic at Durgam Cheruvu", "detail": "Bring blankets and hot cocoa!"},
        "compliment": {"detail": "You make every single day brighter just by being yourself."},
    }

    for ntype, context in test_cases.items():
        send_partner_email(dummy_user, ntype, context)
        print(f"Generated preview for: {ntype}")

if __name__ == "__main__":
    main()
