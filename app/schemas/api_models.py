from typing import Optional, List, Dict
from pydantic import BaseModel

class TryOnRequest(BaseModel):
    user_image_url: str = ""
    garment_image_url: Optional[str] = None
    garment_page_url: Optional[str] = None
    user_query: Optional[str] = None
    user_gender: Optional[str] = None
    chat_history: Optional[List[Dict[str, str]]] = []
    disliked_items: Optional[List[str]] = []

class TryOnResponse(BaseModel):
    status: str
    message: str
    tryon_task_id: Optional[str] = None
    styling_advice: Optional[str] = None
    recommended_garment_id: Optional[str] = None
    extracted_garment_title: Optional[str] = None
    recommended_garment_image_url: Optional[str] = None
    recommended_items: Optional[List[Dict[str, str]]] = None
