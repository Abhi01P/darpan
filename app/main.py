import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import router as api_v1_router
from app.core.config import settings

UPLOAD_DIR = "uploads"

def create_app() -> FastAPI:
    # Ensure the uploads directory exists before mounting static files
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static files for uploads
    app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app

app = create_app()
