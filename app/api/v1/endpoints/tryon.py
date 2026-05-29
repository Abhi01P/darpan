import logging
from fastapi import APIRouter, HTTPException
from app.schemas.api_models import TryOnRequest, TryOnResponse
from app.schemas.agent_state import AgentState
from app.services.workflow import drapenet_workflow

logger = logging.getLogger(__name__)

router = APIRouter()

# Global dict to temporarily hold synchronous results for the frontend poller
sync_results = {}

@router.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    """
    Checks the status of a task.
    """
    if task_id.startswith("sync_task_"):
        result = sync_results.get(task_id)
        if result:
            return {
                "task_id": task_id,
                "status": "SUCCESS",
                "result": {"result_image_url": result}
            }
        else:
            return {"task_id": task_id, "status": "FAILURE", "result": None}

    # Fallback if Celery is somehow still used
    return {"task_id": task_id, "status": "FAILURE", "result": None}

@router.post("/process", response_model=TryOnResponse)
async def process_tryon(request: TryOnRequest):
    """
    Initiates the DrapeNet workflow (Gatekeeper -> [Stylist] -> Artist).
    """
    chat_history = list(request.chat_history or [])
    if request.user_query and (
        not chat_history or chat_history[-1].get("content") != request.user_query
    ):
        chat_history.append({"role": "user", "content": request.user_query})

    initial_state = AgentState(
        user_image_url=request.user_image_url or "",
        garment_image_url=request.garment_image_url,
        garment_page_url=request.garment_page_url,
        user_gender=request.user_gender,
        chat_history=chat_history,
        disliked_items=request.disliked_items or [],
        image_type="unknown",
        validation_message="",
        garment_title=None,
        recommended_garment_id=None,
        recommended_items=[],
        styling_advice="",
        tryon_task_id=None,
        final_output_url=None,
        current_agent="start",
        error=None
    )
    
    try:
        final_state = drapenet_workflow.invoke(initial_state)
        
        if final_state["image_type"] == "invalid":
            raise HTTPException(status_code=400, detail=final_state["validation_message"])
            
        task_id = final_state.get("tryon_task_id")
        final_url = final_state.get("final_output_url")
        
        if task_id and final_url:
            sync_results[task_id] = final_url
            
        return TryOnResponse(
            status="accepted",
            message="Workflow completed.",
            tryon_task_id=task_id,
            styling_advice=final_state.get("styling_advice"),
            recommended_garment_id=final_state.get("recommended_garment_id"),
            extracted_garment_title=final_state.get("garment_title"),
            recommended_garment_image_url=final_state.get("garment_image_url"),
            recommended_items=final_state.get("recommended_items", [])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Workflow failed with unhandled exception")
        raise HTTPException(status_code=500, detail=str(e))
