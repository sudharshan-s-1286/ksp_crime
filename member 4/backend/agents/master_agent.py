import logging
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger("MasterAgent")

class MasterAgent(BaseAgent):
    """
    Supervising agent that analyzes complex queries, decomposes them into logical execution 
    steps, and designs the multi-agent execution blueprint for the pipeline.
    """
    def __init__(self, name: str = None):
        super().__init__(name)

    def _execute(self, message: AgentInput) -> AgentOutput:
        query = message.query.lower()
        plan_steps = []
        
        logger.info(f"Analyzing query for execution planning: '{message.query}'")

        # Decompose query and build task list
        if any(w in query for w in ["profile", "suspect", "history", "background"]):
            plan_steps.append("1. Extract offender history and background metrics via SQL database.")
            plan_steps.append("2. Extract social association networks and fencing links via Neo4j Graph database.")
            plan_steps.append("3. Call Claude API to compile a cohesive offender intelligence narrative.")
            
        if any(w in query for w in ["forecast", "predict", "trend", "alert"]):
            plan_steps.append("4. Query 24-month historical monthly statistics for target crime types.")
            plan_steps.append("5. Perform first-degree linear regression to forecast 30, 60, and 90-day crime counts.")
            plan_steps.append("6. Calculate standard deviation threshold (mean + 2*std) to check for anomalies.")
            
        if any(w in query for w in ["hotspot", "analytics", "yoy", "time-of-day"]):
            plan_steps.append("7. Query geo-spatial coordinate density to pinpoint top 10 crime hotspots.")
            plan_steps.append("8. Aggregate temporal occurrence times into Morning/Afternoon/Evening/Night buckets.")
            plan_steps.append("9. Join crimes with district population table to calculate per-capita crime rates.")

        if any(w in query for w in ["hawala", "money", "shell", "financial"]):
            plan_steps.append("10. Track financial transactions and trace potential laundering vectors and front companies.")
            plan_steps.append("11. Scan co-accused network to detect links to known cash couriers.")

        # Default planning steps if query is generic
        if not plan_steps:
            plan_steps.append("1. Run semantic search against FAISS index of intelligence briefs.")
            plan_steps.append("2. Execute relational query to pull raw case records matching the query terms.")
            
        plan_steps.append("N. Route compiled sub-agent results to Reasoning, Explainability, and Response agents for synthesis and role-based security filtering.")

        planning_summary = (
            f"The MasterAgent has analyzed the query and designed a {len(plan_steps)}-step multi-agent "
            f"execution plan. The system will run RAG operations against relational (PostgreSQL), "
            f"graph (Neo4j), and vector (FAISS) repositories before synthesizing a final explainable response."
        )

        return AgentOutput(
            data={
                "execution_plan": plan_steps,
                "planning_summary": planning_summary,
                "status": "planned"
            },
            chunks=[]
        )
