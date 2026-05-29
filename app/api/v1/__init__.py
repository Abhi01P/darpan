from fastapi import APIRouter
from app.api.v1.endpoints import tryon, auth, wardrobe, catalog, upload

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Welcome to DrapeNet API"}

router.include_router(tryon.router, prefix="/try-on", tags=["try-on"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(wardrobe.router, prefix="/platform", tags=["wardrobe"])
router.include_router(catalog.router, prefix="/platform", tags=["catalog"])
router.include_router(upload.router, prefix="/upload", tags=["upload"])
