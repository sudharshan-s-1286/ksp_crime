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

        # 1. Centrality Detection & Network Scoring (Merged from SOURCE)
        degree_count: Dict[str, int] = {node.get("id", ""): 0 for node in nodes}
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in degree_count: degree_count[src] += 1
            if tgt in degree_count: degree_count[tgt] += 1
            
        # Sort nodes by degree count
        sorted_hubs = sorted(degree_count.items(), key=lambda x: x[1], reverse=True)
        central_hubs = [hub[0] for hub in sorted_hubs[:2]]

        # 2. HVT (High-Value Target) Flagging (Merged from SOURCE)
        hvt_flags = []
        for entity, degree in degree_count.items():
            if degree > 0:
                hvt_flags.append({
                    "entity": entity,
                    "centrality": degree,
                    "risk_level": "HIGH" if degree >= 3 else "MEDIUM-HIGH",
                    "reason": f"Connected to {degree} entities in the network"
                })
        hvt_flags.sort(key=lambda x: x["centrality"], reverse=True)

        # 3. Network Metrics Computation (Merged from SOURCE)
        n = len(nodes)
        e = len(edges)
        max_edges = n * (n - 1) / 2 if n > 1 else 1
        network_density = round(e / max_edges, 4) if max_edges > 0 else 0
        avg_degree = round((2 * e) / n, 2) if n > 0 else 0.0
        
        metrics = {
            "network_density": network_density,
            "avg_degree": avg_degree
        }

        # 4. Call LLM for professional network narrative briefing
        prompt = (
            f"You are a criminal syndicate network analyst. Write a 150-word professional association network briefing "
            f"on the following graph structure:\n\n"
            f"Nodes in Network: {nodes}\n"
            f"Edges (Relationships & Cases): {edges}\n"
            f"Identified Central Hubs: {central_hubs}\n"
            f"High-Value Targets (HVTs): {hvt_flags}\n"
            f"Network Metrics: {metrics}\n\n"
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
                "hvt_flags": hvt_flags,
                "network_metrics": metrics,
                "narrative_brief": narrative_brief
            },
            chunks=graph_chunks
        )
