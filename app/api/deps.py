from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from app.core.config import settings
from app.core.db import get_mongodb_client
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Retrieves the currently authenticated user from the database.
    Injectable dependency for secure endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except (InvalidTokenError, ValidationError):
        raise credentials_exception
        
    client = get_mongodb_client()
    user = await client[settings.DATABASE_NAME]["users"].find_one({"email": token_data.email})
    
    if user is None:
        raise credentials_exception
        
    # Standardize output model mapping (MongoDB uses ObjectId, we convert to string representation)
    user["id"] = str(user["_id"])
    return user
