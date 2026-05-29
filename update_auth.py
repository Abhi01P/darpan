from pydantic import BaseModel
from typing import Optional

class AvatarUpdateRequest(BaseModel):
    avatar_url: Optional[str] = None
