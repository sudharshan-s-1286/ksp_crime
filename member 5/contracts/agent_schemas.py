"""
contracts/agent_schemas.py
Shared Pydantic models used by all agents in KSP Crime Copilot.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentInput(BaseModel):
    """Input schema passed into every agent's run() method."""
    query: str = Field(..., description="The original user query or investigation question")
    session_id: str = Field(..., description="Unique session identifier for this investigation")
    role: str = Field(..., description="User role: 'Investigator', 'Supervisor', or 'Policymaker'")
    agent_results: Dict[str, Any] = Field(
        default_factory=dict,
        description="Accumulated results from previously executed agents"
    )


class AgentOutput(BaseModel):
    """Output schema returned by every agent's run() method."""
    agent_name: str = Field(..., description="Name of the agent that produced this output")
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured result data from the agent"
    )
    chunks: List[str] = Field(
        default_factory=list,
        description="Readable text chunks for display or downstream use"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if the agent failed, else None"
    )
