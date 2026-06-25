"""
agents/network_agent.py

Criminal network analysis agent.
Identifies key players, clusters, hubs, and high-value targets using graph analytics.
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lightweight contracts
# ---------------------------------------------------------------------------

class AgentInput(Protocol):
    query: str
    filters: dict[str, Any]
    context: dict[str, Any]
    entities: list[str]


class AgentOutput:
    """Standard output schema for all agents."""

    def __init__(
        self,
        success: bool,
        data: dict[str, Any],
        chunks: list[str],
        confidence: float,
        error: str | None = None,
    ) -> None:
        self.success = success
        self.data = data
        self.chunks = chunks
        self.confidence = confidence
        self.error = error


class BaseAgent:
    async def run(self, message: AgentInput) -> AgentOutput:
        raise NotImplementedError


class GraphRetrieverProtocol(Protocol):
    def get_network(self, entity_id: str) -> dict[str, list[Any]]:
        ...

    def find_clusters(self) -> list[dict[str, Any]]:
        ...

    def find_hubs(self) -> list[dict[str, Any]]:
        ...

    def to_chunks(self, data: Any) -> list[str]:
        ...


class GeminiClientProtocol(Protocol):
    def generate(self, prompt: str) -> str:
        ...


# ---------------------------------------------------------------------------
# NetworkAgent
# ---------------------------------------------------------------------------

class NetworkAgent(BaseAgent):
    """
    Analyzes criminal networks to identify key players, clusters,
    hubs, and high-value targets. Returns intelligence-grade metrics.
    """

    def __init__(
        self,
        graph_retriever: GraphRetrieverProtocol,
        gemini_client: GeminiClientProtocol,
    ) -> None:
        self.graph = graph_retriever
        self.gemini = gemini_client

    async def run(self, message: AgentInput) -> AgentOutput:
        return await self._execute(message)

    async def _execute(self, message: AgentInput) -> AgentOutput:
        """
        Workflow:
        1. Extract entities
        2. Fetch and merge networks for all entities
        3. Find clusters
        4. Calculate degree centrality (both edge endpoints incremented)
        5. Flag HVTs (centrality > 5) with risk_level and reason
        6. Find hubs via dedicated Cypher query
        7. Compute network metrics (density, avg_degree, cluster_count)
        8. Generate Gemini narrative
        9. Return structured AgentOutput
        """
        try:
            # STEP 1
            entities: list[str] = message.entities or []
            if not entities:
                return AgentOutput(
                    success=False,
                    data={},
                    chunks=[],
                    confidence=0.0,
                    error="No entities provided for network analysis",
                )

            # STEP 2: Fetch and merge networks
            logger.info("NetworkAgent: fetching networks for %d entities", len(entities))
            combined_graph: dict[str, list[Any]] = {"nodes": [], "edges": []}
            seen_node_ids: set[str] = set()

            for entity_id in entities:
                try:
                    network = self.graph.get_network(entity_id)
                    for node in network.get("nodes", []):
                        nid = node.get("id", "")
                        if nid and nid not in seen_node_ids:
                            combined_graph["nodes"].append(node)
                            seen_node_ids.add(nid)
                    combined_graph["edges"].extend(network.get("edges", []))
                except Exception as exc:
                    logger.warning("get_network failed for '%s': %s", entity_id, exc)

            # STEP 3: Clusters
            logger.info("NetworkAgent: finding clusters")
            clusters: list[dict[str, Any]] = []
            try:
                clusters = self.graph.find_clusters()
            except Exception as exc:
                logger.warning("find_clusters failed: %s", exc)

            # STEP 4: Degree centrality — both source and target incremented
            centrality: dict[str, int] = self._calculate_centrality(combined_graph)

            # STEP 5: HVT flags with risk_level and dynamic reason
            hvt_flags: list[dict[str, Any]] = []
            for entity, degree in centrality.items():
                if degree > 5:
                    hvt_flags.append({
                        "entity": entity,
                        "centrality": degree,
                        "risk_level": "HIGH" if degree > 10 else "MEDIUM-HIGH",
                        "reason": f"Connected to {degree} entities in the network",
                    })
            hvt_flags.sort(key=lambda x: x["centrality"], reverse=True)
            logger.info("NetworkAgent: identified %d HVTs", len(hvt_flags))

            # Key entities by centrality (top 10)
            key_entities = sorted(
                [{"entity": k, "centrality": v} for k, v in centrality.items()],
                key=lambda x: x["centrality"],
                reverse=True,
            )[:10]

            # STEP 6: Hubs via dedicated Cypher
            hubs: list[dict[str, Any]] = []
            try:
                hubs = self.graph.find_hubs()
            except Exception as exc:
                logger.warning("find_hubs failed: %s", exc)

            # STEP 7: Network metrics
            metrics = self._compute_metrics(combined_graph, clusters)

            # STEP 8: Narrative
            logger.info("NetworkAgent: generating narrative")
            narrative: str = self.gemini.generate(
                self._build_narrative_prompt(key_entities, hvt_flags, clusters, metrics)
            )

            graph_chunks: list[str] = self.graph.to_chunks(combined_graph)

            # STEP 9: Return
            return AgentOutput(
                success=True,
                data={
                    "network_graph": combined_graph,
                    "key_entities": key_entities,
                    "clusters": clusters,
                    "hvt_flags": hvt_flags,
                    "hubs": hubs,
                    "network_metrics": metrics,
                    "network_narrative": narrative,
                },
                chunks=graph_chunks,
                confidence=0.92,
            )

        except Exception as exc:
            logger.error("NetworkAgent failed: %s", exc, exc_info=True)
            return AgentOutput(
                success=False,
                data={},
                chunks=[],
                confidence=0.0,
                error=str(exc),
            )

    def _calculate_centrality(self, graph: dict[str, list[Any]]) -> dict[str, int]:
        """
        Degree centrality: count direct connections per node.
        Both source and target of every edge are incremented.

        Args:
            graph: {"nodes": [...], "edges": [...]}

        Returns:
            {node_id: degree}
        """
        centrality: dict[str, int] = {node.get("id", ""): 0 for node in graph["nodes"]}

        for edge in graph["edges"]:
            source = edge.get("source") or edge.get("start_node", "")
            target = edge.get("target") or edge.get("end_node", "")
            if source in centrality:
                centrality[source] += 1
            if target in centrality:
                centrality[target] += 1

        return centrality

    def _compute_metrics(
        self,
        graph: dict[str, list[Any]],
        clusters: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Compute intelligence-grade network metrics.

        Returns:
            {
                "cluster_count": int,
                "network_density": float,   # edges / max_possible_edges
                "avg_degree": float
            }
        """
        n = len(graph["nodes"])
        e = len(graph["edges"])

        max_edges = n * (n - 1) / 2 if n > 1 else 1
        density = round(e / max_edges, 4)

        avg_degree = round((2 * e) / n, 2) if n > 0 else 0.0

        return {
            "cluster_count": len(clusters),
            "network_density": density,
            "avg_degree": avg_degree,
        }

    def _build_narrative_prompt(
        self,
        key_entities: list[dict[str, Any]],
        hvt_flags: list[dict[str, Any]],
        clusters: list[dict[str, Any]],
        metrics: dict[str, Any],
    ) -> str:
        """Build a grounded 200-word intelligence narrative prompt."""
        key_str = ", ".join(
            f"{e['entity']} (degree: {e['centrality']})" for e in key_entities[:5]
        )
        hvt_str = ", ".join(
            f"{h['entity']} [{h['risk_level']}]" for h in hvt_flags[:5]
        ) or "None identified"
        cluster_summary = f"{metrics['cluster_count']} cluster(s) detected"

        return (
            "You are a criminal intelligence analyst.\n\n"
            "Generate a 200-word intelligence narrative covering:\n"
            "- Key connectors and network hubs\n"
            "- Criminal groups and clusters\n"
            "- Organizational hierarchy\n"
            "- Risk indicators and threat assessment\n\n"
            f"Network Metrics: density={metrics['network_density']}, "
            f"avg_degree={metrics['avg_degree']}, {cluster_summary}\n"
            f"Key Entities: {key_str or 'None'}\n"
            f"High-Value Targets: {hvt_str}\n\n"
            "Do not hallucinate. Use only the data above.\n"
            "Narrative (max 200 words):"
        )
