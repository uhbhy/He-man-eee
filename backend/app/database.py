from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Create async database engine
# Using echo=False for cleaner logs in production, but good to keep configurable
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Create session factory for async sessions
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Declarative base class for models
class Base(DeclarativeBase):
    pass

# Dependency to get db session in FastAPI routes
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
