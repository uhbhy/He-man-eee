from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, TokenResponse, UserResponse
from app.services.auth_service import verify_password, create_access_token
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Authenticate a user using username and password.
    Returns a JWT access token and user information.
    """
    # Look up the user by username
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
    
    # Verify user exists and check password hash
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate access token
    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        username=user.username
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the profile info of the currently logged-in user.
    Protected by JWT authentication.
    """
    return current_user
