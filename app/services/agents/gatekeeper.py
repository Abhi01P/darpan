import logging
import uuid
from app.schemas.agent_state import AgentState
from app.services.scraper import extract_product_info

logger = logging.getLogger(__name__)

def node_gatekeeper(state: AgentState) -> AgentState:
    """
    Validates inputs and determines routing.
    
    For chat-only flows (no image uploaded yet), we still allow the workflow
    to proceed to the Stylist — the Stylist can search for garments and give
    advice without requiring a user photo upfront.
    """
    logger.info("[Gatekeeper] Analyzing inputs")
    
    has_image = bool(state.get("user_image_url"))
    has_chat = bool(state.get("chat_history"))
    
    # Only reject if there's truly nothing to work with
    if not has_image and not has_chat:
        return {
            **state,
            "image_type": "invalid",
            "validation_message": "Please upload a photo or ask me something.",
            "current_agent": "gatekeeper"
        }
    
    # Check if a product URL was provided for scraping
    garment_page_url = state.get("garment_page_url")
    if garment_page_url and not state.get("garment_image_url"):
        logger.info("[Gatekeeper] External product URL detected. Initiating extraction...")
        try:
            extracted_data = extract_product_info(garment_page_url)
            if extracted_data:
                state["garment_image_url"] = extracted_data["image_url"]
                state["garment_title"] = extracted_data["title"]
                state["validation_message"] = f"Successfully extracted '{extracted_data['title']}'."
            else:
                state["validation_message"] = "Failed to extract product image from URL."
        except Exception as e:
            logger.warning(f"[Gatekeeper] Scraping failed: {e}")
            state["validation_message"] = "Could not extract product from URL."
    else:
        state["validation_message"] = "Input validated successfully."

    # Intercept Direct Try-on commands to populate UI state without LLM invocation
    chat_history = state.get("chat_history", [])
    if chat_history and chat_history[-1].get("content", "").startswith("I want to try on this item:"):
        latest_query = chat_history[-1]["content"]
        title = state.get("garment_title") or latest_query.replace("I want to try on this item: ", "").strip() or "Selected Item"
        state["styling_advice"] = f"Great choice! I'm sending the '{title}' to the fitting room right now."
        if state.get("garment_image_url"):
            state["recommended_items"] = [{
                "item_id": state.get("recommended_garment_id") or f"direct_{uuid.uuid4().hex[:8]}",
                "title": title,
                "image_url": state.get("garment_image_url")
            }]

    state["image_type"] = "full_body"
    state["current_agent"] = "gatekeeper"
    
    logger.info(f"[Gatekeeper] Passed — image={has_image}, chat={has_chat}")
    return state
