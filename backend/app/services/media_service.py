import base64
import os
import uuid
from typing import Optional

import httpx

from app.config import settings


class MediaUploadError(Exception):
    pass


def imagekit_enabled() -> bool:
    return bool(
        settings.IMAGEKIT_PUBLIC_KEY
        and settings.IMAGEKIT_PRIVATE_KEY
        and settings.IMAGEKIT_URL_ENDPOINT
    )


def _imagekit_auth_header() -> str:
    token = base64.b64encode(f"{settings.IMAGEKIT_PRIVATE_KEY}:".encode("utf-8")).decode("utf-8")
    return f"Basic {token}"


async def upload_media_file(filename: str, content: bytes, content_type: str) -> tuple[str, Optional[str]]:
    if imagekit_enabled():
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://upload.imagekit.io/api/v1/files/upload",
                headers={"Authorization": _imagekit_auth_header()},
                files={"file": (filename, content, content_type)},
                data={
                    "fileName": filename,
                    "folder": settings.IMAGEKIT_UPLOAD_FOLDER,
                    "useUniqueFileName": "true",
                },
            )

        if response.status_code not in (200, 201):
            raise MediaUploadError(f"ImageKit upload failed: {response.text}")

        payload = response.json()
        return payload["url"], payload.get("fileId")

    moments_dir = os.path.join(settings.MEDIA_UPLOAD_DIR, "moments")
    os.makedirs(moments_dir, exist_ok=True)
    local_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(moments_dir, local_filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as exc:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise MediaUploadError(f"Failed to write file to storage: {str(exc)}")

    return f"/uploads/moments/{local_filename}", None


async def delete_media_file(media_url: str, storage_file_id: Optional[str]) -> None:
    if storage_file_id and imagekit_enabled():
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.delete(
                f"https://api.imagekit.io/v1/files/{storage_file_id}",
                headers={"Authorization": _imagekit_auth_header()},
            )

        if response.status_code not in (200, 204):
            raise MediaUploadError(f"ImageKit delete failed: {response.text}")
        return

    filename = os.path.basename(media_url)
    file_path = os.path.join(settings.MEDIA_UPLOAD_DIR, "moments", filename)
    if os.path.exists(file_path):
        os.remove(file_path)
