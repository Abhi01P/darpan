from typing import Optional, Literal
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    name: str
    gender: Optional[Literal["male", "female", "non-binary"]] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DigitalTwinMeasurements(BaseModel):
    chest: Optional[float] = None
    waist: Optional[float] = None
    inseam: Optional[float] = None

class DigitalTwinState(BaseModel):
    avatar_mesh_url: Optional[str] = None
    measurements: Optional[DigitalTwinMeasurements] = None

class UserResponse(UserBase):
    id: str
    digital_twin: Optional[DigitalTwinState] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class AvatarUpdateRequest(BaseModel):
    avatar_url: Optional[str] = None
