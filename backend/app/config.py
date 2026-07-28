import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/couples_db")
    SECRET_KEY: str = Field(default="supersecretkeyhere")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)
    CORS_ORIGINS: str = Field(default="http://localhost:5173")
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=587)
    SMTP_USERNAME: str = Field(default="")
    SMTP_PASSWORD: str = Field(default="")
    SMTP_FROM_EMAIL: str = Field(default="")
    BOYFRIEND_EMAIL: str = Field(default="")
    GIRLFRIEND_EMAIL: str = Field(default="")
    MEDIA_UPLOAD_DIR: str = Field(default="./uploads")
    IMAGEKIT_PUBLIC_KEY: str = Field(default="")
    IMAGEKIT_PRIVATE_KEY: str = Field(default="")
    IMAGEKIT_URL_ENDPOINT: str = Field(default="")
    IMAGEKIT_UPLOAD_FOLDER: str = Field(default="/couples-app/moments")

    # Load from .env file inside backend directory or workspace root
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
