import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.db import get_mongodb_client
from app.core.config import settings
from app.schemas.platform import WardrobeItemCreate, WardrobeResponse, AddProductViaUrlRequest, WardrobeItemResponse, SwipeRequest
from app.services.scraper import extract_product_info

router = APIRouter()

@router.get("/wardrobe/dislikes", response_model=list)
async def get_dislikes(current_user: dict = Depends(get_current_user)):
    """Fetches the user's disliked items array to pass into the RAG state."""
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    user = await db["users"].find_one({"email": current_user["email"]})
    return user.get("disliked_items", [])

@router.post("/swipe", status_code=status.HTTP_200_OK)
async def swipe_item(
    req: SwipeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Handles a Tinder-style swipe on a recommended garment.
    Swipe Left (Dislike): Adds to a 'disliked_items' array so the AI stops recommending it.
    Swipe Right (Like): Adds the item to the user's wardrobe for future try-ons.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    if req.action == "dislike":
        await db["users"].update_one(
            {"_id": current_user["_id"]},
            {"$addToSet": {"disliked_items": req.item_id}}
        )
        return {"status": "success", "message": f"Item {req.item_id} added to dislikes."}

    elif req.action == "like":
        # Save a wardrobe entry with the actual item data
        item_dict = {
            "item_id": req.item_id,
            "title": req.title or "Liked Item",
            "image_url": req.image_url or "",
            "added_at": datetime.now(timezone.utc),
        }
        await db["wardrobes"].update_one(
            {"user_id": current_user["id"]},
            {"$push": {"items": item_dict}},
            upsert=True
        )
        return {"status": "success", "message": f"Item {req.item_id} saved to wardrobe."}

    return {"status": "ignored", "message": "Unknown swipe action."}


@router.get("/wardrobe", response_model=WardrobeResponse)
async def get_wardrobe(current_user: dict = Depends(get_current_user)):
    """
    Retrieves the logged-in user's private virtual closet (wardrobe).
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    wardrobe = await db["wardrobes"].find_one({"user_id": current_user["id"]})
    if not wardrobe:
        return WardrobeResponse(items=[])
        
    return WardrobeResponse(items=wardrobe.get("items", []))

@router.post("/wardrobe/add", response_model=WardrobeItemResponse)
async def add_item_manually(
    item_in: WardrobeItemCreate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Manually appends an item to the user's wardrobe.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    item_dict = {
        **item_in.model_dump(),
        "added_at": datetime.now(timezone.utc)
    }
    
    await db["wardrobes"].update_one(
        {"user_id": current_user["id"]},
        {"$push": {"items": item_dict}},
        upsert=True
    )
    
    return item_dict

@router.post("/wardrobe/add-by-url", response_model=WardrobeItemResponse)
async def add_item_by_url(
    req: AddProductViaUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts an external e-commerce URL, scrapes product image and title, 
    and appends it to the user's wardrobe.
    """
    extracted = extract_product_info(req.url)
    if not extracted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not scrape or extract clothing information from this URL."
        )
        
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    item_dict = {
        "item_id": f"scraped_{str(uuid.uuid4())[:8]}",
        "title": extracted["title"],
        "image_url": extracted["image_url"],
        "source_url": req.url,
        "price_comparisons": extracted.get("price_comparisons", []),
        "added_at": datetime.now(timezone.utc)
    }
    
    await db["wardrobes"].update_one(
        {"user_id": current_user["id"]},
        {"$push": {"items": item_dict}},
        upsert=True
    )
    
    return item_dict

@router.delete("/wardrobe/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_wardrobe(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Removes a clothing item from the user's virtual closet.
    """
    client = get_mongodb_client()
    db = client[settings.DATABASE_NAME]
    
    await db["wardrobes"].update_one(
        {"user_id": current_user["id"]},
        {"$pull": {"items": {"item_id": item_id}}}
    )
    return
