from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl

class PriceComparison(BaseModel):
    retailer: str
    price: float
    url: str

class WardrobeItemBase(BaseModel):
    item_id: str
    title: str
    image_url: str
    source_url: Optional[str] = None
    price_comparisons: Optional[List[PriceComparison]] = []

class WardrobeItemCreate(WardrobeItemBase):
    pass

class WardrobeItemResponse(WardrobeItemBase):
    added_at: datetime

class WardrobeResponse(BaseModel):
    items: List[WardrobeItemResponse]

class CatalogItemBase(BaseModel):
    title: str
    description: str
    image_url: str
    brand: str
    price: float

class CatalogItemCreate(CatalogItemBase):
    pass

class CatalogItemResponse(CatalogItemBase):
    id: str

class AddProductViaUrlRequest(BaseModel):
    url: str

class SwipeRequest(BaseModel):
    item_id: str
    action: str  # "like" or "dislike"
    title: Optional[str] = None
    image_url: Optional[str] = None
