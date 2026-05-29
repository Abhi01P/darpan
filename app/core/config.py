import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DrapeNet API"
    API_V1_STR: str = "/api/v1"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # MongoDB Atlas (Mock default for local)
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "drapenet"

    # JWT Security — MUST be overridden via .env in production
    SECRET_KEY: str = "dev-only-insecure-key-override-via-SECRET_KEY-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # Google Cloud / Vertex AI
    GCP_PROJECT_ID: str = "onix-ai"
    GCP_LOCATION: str = "global"
    GOOGLE_CREDENTIALS_PATH: str = "key.json"

    # Application
    BASE_URL: str = "http://localhost:8000"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    class Config:
        env_file = ".env"

settings = Settings()

# Set Google credentials once at import time so all modules
# (including Celery workers that import config) inherit the env var.
if os.path.exists(settings.GOOGLE_CREDENTIALS_PATH):
    os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", settings.GOOGLE_CREDENTIALS_PATH)
