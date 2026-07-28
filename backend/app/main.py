import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure media upload directory exists
    os.makedirs(settings.MEDIA_UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.MEDIA_UPLOAD_DIR, "moments"), exist_ok=True)
    
    # Verify database connection
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("Database connection verified successfully.")
    except Exception as e:
        print(f"Warning: Database connection failed during startup: {e}")
        
    yield
    # Clean up connection pool
    await engine.dispose()

app = FastAPI(
    title="Couples App API",
    description="A private, romantic web application for couples 💛",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (allow local React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads folder exists before mounting to avoid errors
os.makedirs(settings.MEDIA_UPLOAD_DIR, exist_ok=True)

# Mount media directory for static file serving
app.mount("/uploads", StaticFiles(directory=settings.MEDIA_UPLOAD_DIR), name="uploads")

# Include routers
from app.routers.auth import router as auth_router
from app.routers.quiz import router as quiz_router
from app.routers.moments import router as moments_router
from app.routers.compliments import router as compliments_router
from app.routers.wishlist import router as wishlist_router
from app.routers.mood import router as mood_router
from app.routers.notifications import router as notifications_router
app.include_router(auth_router, prefix="/api/v1")
app.include_router(quiz_router, prefix="/api/v1")
app.include_router(moments_router, prefix="/api/v1")
app.include_router(compliments_router, prefix="/api/v1")
app.include_router(wishlist_router, prefix="/api/v1")
app.include_router(mood_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")

from fastapi import Request, status
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception details on the server console/logs
    import traceback
    print(f"Unhandled exception occurred during request to {request.url.path}:")
    traceback.print_exc()
    
    # Return a generic 500 error to the client to avoid leaking database or stack trace details
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

@app.get("/")
async def root():
    return {"message": "Welcome to the Couples App API! 💛"}
