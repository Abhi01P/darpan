from app.schemas.agent_state import AgentState
from app.core.db import get_vector_store
from app.core.config import settings
from google import genai

def node_stylist(state: AgentState) -> AgentState:
    """
    Handles conversational history and RAG for fashion recommendations.
    Implements Intent Detection to separate greetings from shopping requests,
    and negative filtering to avoid showing garments the user swiped left on.
    """
    print(f"--- [Stylist] Analyzing conversation history ---")
    
    chat_history = state.get("chat_history", [])
    
    if len(chat_history) > 0:
        latest_query = chat_history[-1].get("content", "")
        print(f"--- [Stylist] Latest Query: {latest_query} ---")
        
        import os
        if not os.path.exists(settings.GOOGLE_CREDENTIALS_PATH):
            print("--- [Stylist] No credentials found, using mock Conversational RAG ---")
            state["recommended_garment_id"] = "garment_mock_123"
            state["styling_advice"] = f"Based on your request '{latest_query}', I think you'll love this piece! (MOCK AI)"
            if not state.get("garment_image_url"):
                state["garment_image_url"] = "https://mock-storage.com/garment_mock_123.jpg"
        else:
            try:
                # Credentials are set once in config.py at import time
                genai_client = genai.Client(
                    vertexai=True,
                    project=settings.GCP_PROJECT_ID,
                    location=settings.GCP_LOCATION,
                )
                
                # 1. INTENT DETECTION
                intent_prompt = (
                    f"Analyze this user message: '{latest_query}'. "
                    "Determine the intent: "
                    "1. Reply 'GREETING' if it is a hello or general chat. "
                    "2. Reply 'CLARIFY' if they want clothes but haven't specified color, type, OR occasion. "
                    "3. Reply 'TRYON_SPECIFIC' if they explicitly say they want to try on a specific item they just selected (e.g. 'I want to try on this item: ...'). "
                    "4. Reply 'SEARCH' if they have specified enough details to search for new clothes (like 'blue beach shirt' or 'black formal jacket')."
                )
                intent_res = genai_client.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=intent_prompt
                )
                
                intent_val = intent_res.text.upper()
                print(f"--- [Stylist] Intent Detected: {intent_val} ---")
                
                transcript = ""
                for msg in chat_history:
                    role = "User" if msg.get("role") == "user" else "Stylist"
                    transcript += f"{role}: {msg.get('content')}\n"

                if "GREETING" in intent_val:
                    chat_prompt = (
                        "You are DrapeNet's expert fashion stylist AI. You are having a conversation with a user.\n"
                        f"Conversation so far:\n{transcript}\n\n"
                        "The user just greeted you. Respond warmly in 1-2 sentences. "
                        "Introduce yourself, and briefly explain that you can recommend outfits and search the internet for specific clothes."
                    )
                    response = genai_client.models.generate_content(model="gemini-3.1-flash-lite", contents=chat_prompt)
                    state["styling_advice"] = response.text
                    state["recommended_garment_id"] = None 
                    
                elif "CLARIFY" in intent_val:
                    chat_prompt = (
                        "You are DrapeNet's expert fashion stylist AI. You are having a conversation with a user.\n"
                        f"Conversation so far:\n{transcript}\n\n"
                        "The user wants clothes, but you need more details to perform a web search. "
                        "Ask 1-2 friendly follow-up questions to determine their preferred color, fit, or exact style."
                    )
                    response = genai_client.models.generate_content(model="gemini-3.1-flash-lite", contents=chat_prompt)
                    state["styling_advice"] = response.text
                    state["recommended_garment_id"] = None 
                    
                elif "TRYON_SPECIFIC" in intent_val:
                    print("--- [Stylist] Direct Try-On Intent Detected ---")
                    if state.get("garment_image_url"):
                        chat_prompt = (
                            "You are DrapeNet's expert fashion stylist AI.\n"
                            f"Conversation so far:\n{transcript}\n\n"
                            "The user has selected a specific item to try on. "
                            "Respond with a brief, enthusiastic confirmation (1 sentence) that you are initiating the virtual try-on for this piece."
                        )
                        response = genai_client.models.generate_content(model="gemini-3.1-flash-lite", contents=chat_prompt)
                        state["styling_advice"] = response.text
                        
                        # Populate recommended items with just this one item so the UI card works
                        import uuid
                        item_id = state.get("recommended_garment_id") or f"direct_{uuid.uuid4().hex[:8]}"
                        title = state.get("garment_title") or latest_query.replace("I want to try on this item: ", "").strip() or "Selected Item"
                        
                        state["recommended_items"] = [{
                            "item_id": item_id,
                            "title": title,
                            "image_url": state["garment_image_url"]
                        }]
                    else:
                        state["styling_advice"] = "I'd love to help you try that on, but I don't have the image for it. Let's try searching for it instead!"
                        
                else:
                    # SEARCH INTENT
                    print("--- [Stylist] Preparing Live Web Search... ---")
                    
                    # Include gender context so the search query is appropriately scoped
                    gender = state.get("user_gender") or ""
                    gender_hint = ""
                    if gender == "male":
                        gender_hint = "The user is male. Prefix the query with 'mens' if not already specified."
                    elif gender == "female":
                        gender_hint = "The user is female. Prefix the query with 'womens' if not already specified."
                    
                    # Ask Gemini to generate the perfect e-commerce search query based on the chat
                    query_prompt = (
                        f"Based on this conversation:\n{transcript}\n"
                        f"{gender_hint}\n"
                        "Generate a 3-5 word search query to find the exact clothing item the user wants "
                        "on an e-commerce site (e.g. 'mens blue linen shirt'). Reply ONLY with the query."
                    )
                    query_res = genai_client.models.generate_content(model="gemini-3.1-flash-lite", contents=query_prompt)
                    search_string = query_res.text.strip().strip('"').strip("'")
                    
                    print(f"--- [Stylist] Search String Generated: {search_string} ---")
                    
                    from app.services.scraper import search_live_retailer
                    live_items = search_live_retailer(search_string)
                    
                    if live_items:
                        # Store ALL items for the frontend card stack
                        state["recommended_items"] = [
                            {"item_id": it["item_id"], "title": it["title"], "image_url": it["image_url"]}
                            for it in live_items
                        ]
                        # First item is the "featured" one (for backward compat)
                        first = live_items[0]
                        state["recommended_garment_id"] = first["item_id"]
                        state["garment_image_url"] = first["image_url"]
                        state["garment_title"] = first["title"]
                            
                        prompt = (
                            "You are DrapeNet's expert fashion stylist. You are having a conversation with a user.\n"
                            f"Conversation so far:\n{transcript}\n\n"
                            f"You just searched the internet and found {len(live_items)} matching items.\n"
                            f"The top result is: '{first['title']}'.\n\n"
                            "Tell the user you found several options for them to browse through. "
                            "Be enthusiastic but brief (1-2 sentences). Don't list all items."
                        )
                        
                        response = genai_client.models.generate_content(
                            model="gemini-3.1-flash-lite",
                            contents=prompt
                        )
                        state["styling_advice"] = response.text
                    else:
                        state["styling_advice"] = f"I searched the web for '{search_string}' but couldn't find a high-quality match right now. Could you try describing it differently?"
                        state["recommended_garment_id"] = None
                        state["recommended_items"] = []
                        
            except Exception as e:
                print(f"--- [Stylist] RAG Error: {str(e)} ---")
                state["styling_advice"] = "Encountered an error while finding recommendations."
                state["error"] = str(e)
            
    state["current_agent"] = "stylist"
    return state
