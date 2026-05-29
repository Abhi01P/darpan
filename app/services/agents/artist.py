from app.schemas.agent_state import AgentState
from app.services.ml_pipeline import generate_local_tryon
import uuid

def node_artist(state: AgentState) -> AgentState:
    """
    Executes the 2D Virtual Try-On directly (synchronously for Vercel Serverless).
    """
    print(f"--- [Artist] Initiating 2D Virtual Try-On ---")
    
    user_image = state.get("user_image_url")
    garment_image = state.get("garment_image_url")
    
    if user_image and garment_image:
        try:
            result_url = generate_local_tryon(user_image, garment_image)
            state["final_output_url"] = result_url
            # We mock the task ID so the frontend polling mechanism instantly resolves it
            state["tryon_task_id"] = f"sync_task_{uuid.uuid4().hex}"
            print(f"--- [Artist] Try-On complete: {result_url} ---")
        except Exception as e:
            print(f"--- [Artist] Error during try-on: {e} ---")
            state["error"] = str(e)
            
    state["current_agent"] = "artist"
    return state
