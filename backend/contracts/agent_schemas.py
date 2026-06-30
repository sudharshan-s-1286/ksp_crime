from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional

class AgentInput(BaseModel):
    """
    Standard input schema for all KSP Crime Copilot agents.
    """
    query: str
    entity_id: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    entities: Dict[str, Any] = Field(default_factory=dict)
    agent_results: Dict[str, Any] = Field(default_factory=dict)

class AgentOutput(BaseModel):
    """
    Standard output schema for all KSP Crime Copilot agents.
    """
    data: Dict[str, Any] = Field(
        ..., 
        description="Structured dictionary containing agent-specific data outputs."
    )
    chunks: List[Dict[str, Any]] = Field(
        default_factory=list, 
        description="Source document chunks or records retrieved and referenced by the agent."
    )
