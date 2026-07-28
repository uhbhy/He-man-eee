import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.moment import Moment
from app.models.user import User
from app.schemas.moment import MomentResponse
from app.middleware.auth_middleware import get_current_user
from app.services.email_service import send_partner_email
from app.services.media_service import MediaUploadError, delete_media_file, upload_media_file

router = APIRouter(prefix="/moments", tags=["moments"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 megabytes

@router.post("", response_model=MomentResponse, status_code=status.HTTP_201_CREATED)
async def upload_moment(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    taken_at: Optional[date] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a new photo or video moment.
    Enforces a 50MB file size limit and saves the media to local storage.
    """
    # 1. Enforce size limit
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_PAYLOAD_TOO_LARGE,
            detail="File size exceeds the 50MB limit."
        )
        
    # 2. File type detection
    content_type = file.content_type or ""
    if content_type.startswith("video/"):
        media_type = "video"
    else:
        media_type = "photo"
        
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_PAYLOAD_TOO_LARGE,
                detail="File size exceeds the 50MB limit."
            )
        filename = file.filename or f"{uuid.uuid4()}.{'mp4' if media_type == 'video' else 'jpg'}"
        media_url, storage_file_id = await upload_media_file(filename, content, content_type or "application/octet-stream")
    except MediaUploadError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
        
    # 4. Save record to DB
    moment = Moment(
        uploader_id=current_user.id,
        media_url=media_url,
        storage_file_id=storage_file_id,
        media_type=media_type,
        caption=caption,
        taken_at=taken_at
    )
    
    db.add(moment)
    await db.commit()
    
    # Reload with uploader relationship loaded
    result = await db.execute(
        select(Moment)
        .options(selectinload(Moment.uploader))
        .where(Moment.id == moment.id)
    )
    db_moment = result.scalar_one()
    subject = f"{current_user.display_name} uploaded a new moment"
    body = f"{current_user.display_name} just uploaded a new {media_type}."
    if caption:
        body += f" Caption: {caption}"
    send_partner_email(current_user, subject, body)
    return db_moment

@router.get("", response_model=List[MomentResponse])
async def list_moments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all moments, sorted by taken_at DESC (falling back to created_at DESC).
    """
    result = await db.execute(
        select(Moment)
        .options(selectinload(Moment.uploader))
        .order_by(Moment.taken_at.desc().nulls_last(), Moment.created_at.desc())
    )
    moments = result.scalars().all()
    return moments

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_moment(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a moment. Only the uploader is allowed to delete it.
    Associated physical file is deleted from local storage.
    """
    # Fetch moment
    result = await db.execute(
        select(Moment)
        .where(Moment.id == id)
    )
    moment = result.scalar_one_or_none()
    
    if not moment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moment not found"
        )
        
    # Verify owner
    if moment.uploader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the uploader can delete this moment."
        )
        
    # Delete file from storage
    try:
        await delete_media_file(moment.media_url, moment.storage_file_id)
    except MediaUploadError as e:
        print(f"Warning: Failed to delete media from storage for {moment.id}: {e}")
            
    # Delete from DB
    await db.delete(moment)
    await db.commit()
    
    return {"detail": "Moment successfully deleted"}
