from datetime import datetime, timezone, UTC
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.wishlist import WishlistItem
from app.models.user import User
from app.schemas.wishlist import WishlistItemCreate, WishlistItemResponse
from app.middleware.auth_middleware import get_current_user

from app.services.email_service import send_partner_email

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

@router.get("", response_model=List[WishlistItemResponse])
async def list_wishlist_items(
    category: Optional[str] = Query(None, pattern="^(date_idea|place|other)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all wishlist items, sorted by created_at DESC.
    Optionally filter by category.
    """
    query = select(WishlistItem).options(selectinload(WishlistItem.creator))
    
    if category:
        query = query.where(WishlistItem.category == category)
        
    query = query.order_by(WishlistItem.created_at.desc())
    
    result = await db.execute(query)
    items = result.scalars().all()
    return items

@router.post("", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def create_wishlist_item(
    payload: WishlistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new wishlist item. Sets added_by to the currently authenticated user.
    """
    item = WishlistItem(
        added_by=current_user.id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        is_done=False
    )
    
    db.add(item)
    await db.commit()
    
    # Reload item with creator profile loaded
    result = await db.execute(
        select(WishlistItem)
        .options(selectinload(WishlistItem.creator))
        .where(WishlistItem.id == item.id)
    )
    db_item = result.scalar_one()
    send_partner_email(current_user, "wishlist", {"title": payload.title, "detail": payload.description})
    return db_item

@router.patch("/{id}/done", response_model=WishlistItemResponse)
async def mark_item_done(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle completed state for a wishlist item.
    Sets done_at to current timestamp when marked completed.
    """
    result = await db.execute(
        select(WishlistItem)
        .options(selectinload(WishlistItem.creator))
        .where(WishlistItem.id == id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found"
        )
        
    # Toggle done state
    item.is_done = not item.is_done
    if item.is_done:
        # Use naive UTC datetime to match TIMESTAMP WITHOUT TIME ZONE column
        item.done_at = datetime.utcnow()
    else:
        item.done_at = None
        
    await db.commit()
    return item

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_wishlist_item(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a wishlist item. Only the creator of the item is allowed to delete it.
    """
    result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.id == id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found"
        )
        
    if item.added_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this wishlist item."
        )
        
    await db.delete(item)
    await db.commit()
    
    return {"detail": "Wishlist item successfully deleted"}
