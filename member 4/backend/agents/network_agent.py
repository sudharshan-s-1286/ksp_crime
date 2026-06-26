import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.graph_retriever import GraphRetriever
from backend.config.settings import call_llm

logger = logging.getLogger("NetworkAgent")

class NetworkAgent(BaseAgent):
    """
    Agent that models, visualizes, and assesses criminal association graphs
    and syndicates, pinpointing central coordinators and fencers.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.graph_retriever = GraphRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        suspects = message.entities.get("person_names", [])
        if not suspects and message.entity_id:
            suspects = [message.entity_id]
            
        if not suspects:
            # Default fallback for testing
            suspects = ["Suresh Patil"]

        logger.info(f"Analyzing association network for suspects: {suspects}")
        graph_chunks = self.graph_retriever.retrieve(suspects)
        
        network_data = {}
        if graph_chunks:
            network_data = graph_chunks[0]["data"]

        nodes = network_data.get("nodes", [])
        edges = network_data.get("edges", [])

        # 1. Identify Central Hubs (most connected nodes in this sub-graph)
        degree_count: Dict[str, int] = {}
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            degree_count[src] = degree_count.get(src, 0) + 1
            degree_count[tgt] = degree_count.get(tgt, 0) + 1
            
        # Sort nodes by degree count
        sorted_hubs = sorted(degree_count.items(), key=lambda x: x[1], reverse=True)
        central_hubs = [hub[0] for hub in sorted_hubs[:2]]

        # 2. Call LLM for professional network narrative briefing
        prompt = (
            f"You are a criminal syndicate network analyst. Write a 150-word professional association network briefing "
            f"on the following graph structure:\n\n"
            f"Nodes in Network: {nodes}\n"
            f"Edges (Relationships & Cases): {edges}\n"
            f"Identified Central Hubs: {central_hubs}\n\n"
            f"Identify which individuals act as coordinators, who are the likely fences/receivers of stolen goods, "
            f"and what operational vulnerabilities in their communication network should be targeted next. "
            f"Do not use placeholders."
        )
        
        narrative_brief = call_llm(prompt)

        return AgentOutput(
            data={
                "nodes": nodes,
                "edges": edges,
                "central_hubs": central_hubs,
                "narrative_brief": narrative_brief
            },
            chunks=graph_chunks
        )
