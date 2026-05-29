from typing import TypedDict, Optional, Literal, List, Dict

class AgentState(TypedDict):
    # Inputs
    user_image_url: str
    garment_image_url: Optional[str]
    garment_page_url: Optional[str]
    user_gender: Optional[str]  # "male", "female", "non-binary"
    chat_history: List[Dict[str, str]] # List of {"role": "user"|"assistant", "content": "..."}
    disliked_items: List[str] # List of item_ids to filter out of RAG
    
    # Internal State
    image_type: Literal["full_body", "garment", "invalid", "unknown"]
    validation_message: str
    garment_title: Optional[str]
    
    # Outputs from Stylist Agent
    recommended_garment_id: Optional[str]
    recommended_items: List[Dict[str, str]]  # [{item_id, title, image_url}]
    styling_advice: str
    
    # Outputs from Visualization Agent (Artist)
    tryon_task_id: Optional[str]
    final_output_url: Optional[str]
    
    # Workflow control
    current_agent: str
    error: Optional[str]
