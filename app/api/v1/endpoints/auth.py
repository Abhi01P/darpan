from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.db import get_mongodb_client
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.auth import UserCreate, UserResponse, Token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    """
    Registers a new user and sets up their default, empty Digital Twin properties.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
        
    user_dict = {
        "email": user_in.email,
        "name": user_in.name,
        "gender": user_in.gender,
        "hashed_password": get_password_hash(user_in.password),
        "digital_twin": {
            "avatar_mesh_url": None,
            "measurements": None
        }
    }
    
    result = await db["users"].insert_one(user_dict)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_in.email,
        name=user_in.name,
        gender=user_in.gender,
        digital_twin=user_dict["digital_twin"]
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user and returns an OAuth2/JWT access token.
    FastAPI OAuth2PasswordRequestForm maps credentials to `username` (email) and `password`.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    return Token(
        access_token=create_access_token(user["email"]),
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Returns details of the currently authenticated user session.
    """
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        gender=current_user.get("gender"),
        digital_twin=current_user.get("digital_twin")
    )

from app.schemas.auth import AvatarUpdateRequest

@router.put("/me/avatar", response_model=UserResponse)
async def update_avatar(req: AvatarUpdateRequest, current_user: dict = Depends(get_current_user)):
    """
    Updates the user's permanent avatar photo for virtual try-on.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"digital_twin.avatar_mesh_url": req.avatar_url}}
    )
    
    updated_user = await db["users"].find_one({"email": current_user["email"]})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        name=updated_user["name"],
        gender=updated_user.get("gender"),
        digital_twin=updated_user.get("digital_twin")
    )
