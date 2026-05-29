from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.db import get_mongodb_client
from app.core.config import settings
from app.schemas.platform import CatalogItemCreate, CatalogItemResponse

router = APIRouter()

@router.get("/catalog", response_model=List[CatalogItemResponse])
async def list_catalog(limit: int = 20, skip: int = 0):
    """
    Returns the general curated system catalog of clothing items.
    Supports basic pagination via skip/limit.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    cursor = db["catalog_items"].find().skip(skip).limit(limit)
    items = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        items.append(CatalogItemResponse(**document))
        
    return items

@router.post("/catalog/add", response_model=CatalogItemResponse, status_code=status.HTTP_201_CREATED)
async def create_catalog_item(item_in: CatalogItemCreate):
    """
    Saves a new curated clothing item to the global system catalog.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    item_dict = item_in.model_dump()
    
    result = await db["catalog_items"].insert_one(item_dict)
    
    return CatalogItemResponse(
        id=str(result.inserted_id),
        **item_dict
    )
