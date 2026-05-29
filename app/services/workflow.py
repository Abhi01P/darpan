from langgraph.graph import StateGraph, END
from app.schemas.agent_state import AgentState
from app.services.agents.gatekeeper import node_gatekeeper
from app.services.agents.stylist import node_stylist
from app.services.agents.artist import node_artist

def route_gatekeeper(state: AgentState) -> str:
    """Route based on Gatekeeper's validation."""
    if state["image_type"] == "invalid":
        return "end"
        
    chat_history = state.get("chat_history", [])
    
    if chat_history and chat_history[-1].get("content", "").startswith("I want to try on this item:"):
        return "artist"

    # If chat history is provided, consult the Stylist first
    if chat_history and len(chat_history) > 0:
        return "stylist"
        
    # Otherwise, go straight to Artist for 2D processing
    return "artist"

def build_drapenet_graph():
    """Builds the LangGraph orchestration for the Virtual Try-On workflow."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("gatekeeper", node_gatekeeper)
    workflow.add_node("stylist", node_stylist)
    workflow.add_node("artist", node_artist)

    # Set Entry Point
    workflow.set_entry_point("gatekeeper")

    # Add Conditional Edges
    workflow.add_conditional_edges(
        "gatekeeper",
        route_gatekeeper,
        {
            "stylist": "stylist",
            "artist": "artist",
            "end": END
        }
    )

    # Define the rest of the flow
    workflow.add_edge("stylist", "artist")
    workflow.add_edge("artist", END)

    return workflow.compile()

drapenet_workflow = build_drapenet_graph()
