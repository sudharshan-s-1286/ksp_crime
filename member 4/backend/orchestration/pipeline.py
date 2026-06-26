import time
import logging
from typing import Dict, Any, List, Union
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.orchestration.router import Router
from backend.orchestration.memory import Memory
from backend.orchestration.context_manager import ContextManager

# Import all agents dynamically to avoid circular imports and enable flexible orchestration
from backend.agents.profiling_agent import ProfilingAgent
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.forecast_agent import ForecastAgent
from backend.agents.decision_support_agent import DecisionSupportAgent
from backend.agents.sociology_agent import SociologyAgent
from backend.agents.financial_agent import FinancialAgent

# Stubs/Lazy-loaded imports for M2 and M5 agents (which we will create next)
from backend.agents.master_agent import MasterAgent
from backend.agents.crime_query_agent import CrimeQueryAgent
from backend.agents.network_agent import NetworkAgent
from backend.agents.reasoning_agent import ReasoningAgent
from backend.agents.explainability_agent import ExplainabilityAgent
from backend.agents.response_agent import ResponseAgent

logger = logging.getLogger("CopilotPipeline")

class CopilotPipeline:
    """
    Central orchestration pipeline that coordinates multi-agent workflows,
    manages session memory, enriches security contexts, and executes logical synthesis.
    """
    def __init__(self):
        self.router = Router()
        self.memory = Memory()
        self.context_manager = ContextManager()
        
        # Instantiate all agents in a registry
        self.agent_registry = {
            "master_agent": MasterAgent(),
            "crime_query_agent": CrimeQueryAgent(),
            "network_agent": NetworkAgent(),
            "profiling_agent": ProfilingAgent(),
            "analytics_agent": AnalyticsAgent(),
            "forecast_agent": ForecastAgent(),
            "sociology_agent": SociologyAgent(),
            "financial_agent": FinancialAgent(),
            "decision_support_agent": DecisionSupportAgent(),
            "reasoning_agent": ReasoningAgent(),
            "explainability_agent": ExplainabilityAgent(),
            "response_agent": ResponseAgent()
        }

    def execute(self, session_id: str, query: str, role: str = "Investigator", context: Dict[str, Any] = None) -> AgentOutput:
        """
        Executes the full multi-agent pipeline for a user query.
        """
        start_time = time.time()
        logger.info(f"Initiating pipeline execution for session '{session_id}' (Role: {role}).")

        # 1. Load conversation history
        chat_history = self.memory.get_formatted_history(session_id)
        
        # Prepare initial pipeline context
        pipeline_context = context.copy() if context else {}
        pipeline_context["role"] = role
        pipeline_context["chat_history"] = chat_history
        pipeline_context["session_id"] = session_id

        # 2. Build initial AgentInput
        message = AgentInput(
            query=query,
            context=pipeline_context,
            entities={},
            agent_results={}
        )

        # 3. Enrich context and apply security clearances via ContextManager
        message, diagnostics = self.context_manager.enrich_context(message)

        # 4. Route query to active specialized agents
        routed_agents = self.router.route(message)

        # Enforce that specialized agents run
        running_results: Dict[str, Any] = {}
        all_chunks: List[Dict[str, Any]] = []

        # 5. Execute routed agents in a dependency-injecting loop
        for agent_name in routed_agents:
            if agent_name in self.agent_registry:
                agent = self.agent_registry[agent_name]
                logger.info(f"Executing routed agent: '{agent_name}'")
                
                # Pass currently accumulated results to the agent input
                message.agent_results = running_results
                
                try:
                    agent_output = agent.run(message)
                    running_results[agent_name] = agent_output.data
                    all_chunks.extend(agent_output.chunks)
                except Exception as e:
                    logger.error(f"Agent '{agent_name}' failed during pipeline execution: {str(e)}")
                    # Save error to results to let downstream reasoning know
                    running_results[agent_name] = {
                        "status": "error",
                        "error_message": str(e)
                    }

        # 6. Execute Final Reasoning & Synthesis Units
        # reasoning_agent synthesizes findings
        message.agent_results = running_results
        logger.info("Executing ReasoningAgent for logical synthesis...")
        reasoning_output = self.agent_registry["reasoning_agent"].run(message)
        running_results["reasoning_agent"] = reasoning_output.data
        
        # explainability_agent adds citations and source tracking
        logger.info("Executing ExplainabilityAgent for citation formatting...")
        explain_input = AgentInput(
            query=query,
            context=message.context,
            entities=message.entities,
            agent_results=running_results
        )
        explain_output = self.agent_registry["explainability_agent"].run(explain_input)
        running_results["explainability_agent"] = explain_output.data

        # response_agent generates the final markdown report and applies security role filters
        logger.info("Executing ResponseAgent for final formatting and security filtering...")
        response_input = AgentInput(
            query=query,
            context=message.context,
            entities=message.entities,
            agent_results=running_results
        )
        final_output = self.agent_registry["response_agent"].run(response_input)
        
        # Add all accumulated chunks to final output for transparency
        final_output.chunks = all_chunks

        # 7. Save assistant response to memory
        assistant_text = final_output.data.get("markdown_response", "Processed successfully.")
        self.memory.add_message(session_id, "user", query)
        self.memory.add_message(session_id, "assistant", assistant_text)

        duration = time.time() - start_time
        logger.info(f"Pipeline execution completed successfully in {duration:.3f}s.")
        return final_output
