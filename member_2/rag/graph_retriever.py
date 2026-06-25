"""
rag/graph_retriever.py

Graph-based retrieval layer for KSP Crime Copilot.
All outputs are plain JSON-serializable dicts — no Neo4j objects leak out.
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


class Neo4jClientProtocol(Protocol):
    def run_query(self, cypher: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        ...


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _serialize_node(node: Any) -> dict[str, str]:
    """
    Convert a raw Neo4j node (or plain dict) into a frontend-safe dict.

    Output shape: {"id": str, "label": str, "name": str}
    """
    if isinstance(node, dict):
        return {
            "id": str(node.get("id", "")),
            "label": str(node.get("type") or node.get("label", "Unknown")),
            "name": str(node.get("name") or node.get("id", "")),
        }
    # neo4j.graph.Node duck-typing
    node_id = str(getattr(node, "id", "") or dict(node).get("id", ""))
    labels = list(getattr(node, "labels", ["Unknown"]))
    props = dict(node) if hasattr(node, "items") else {}
    return {
        "id": node_id,
        "label": labels[0] if labels else "Unknown",
        "name": str(props.get("name", node_id)),
    }


def _serialize_edge(rel: Any) -> dict[str, str]:
    """
    Convert a raw Neo4j relationship (or plain dict) into a frontend-safe dict.

    Output shape: {"source": str, "target": str, "type": str}
    """
    if isinstance(rel, dict):
        return {
            "source": str(rel.get("start_node") or rel.get("source", "")),
            "target": str(rel.get("end_node") or rel.get("target", "")),
            "type": str(rel.get("type", "RELATED_TO")),
        }
    # neo4j.graph.Relationship duck-typing
    return {
        "source": str(getattr(rel, "start_node", {}).get("id", "")),
        "target": str(getattr(rel, "end_node", {}).get("id", "")),
        "type": str(getattr(rel, "type", "RELATED_TO")),
    }


# ---------------------------------------------------------------------------
# GraphRetriever
# ---------------------------------------------------------------------------

class GraphRetriever:
    """
    Retrieves structured graph data from Neo4j for crime intelligence queries.
    All public methods return plain JSON-serializable dicts/lists.

    Args:
        neo4j_client: Any object satisfying Neo4jClientProtocol.
    """

    def __init__(self, neo4j_client: Neo4jClientProtocol) -> None:
        self._db = neo4j_client

    # ------------------------------------------------------------------
    # Public dispatch
    # ------------------------------------------------------------------

    def retrieve(self, query: AgentInput) -> dict[str, Any]:
        """
        Dispatch to the correct graph method based on query.filters['type'].

        Supported types: network | clusters | shortest_path | co_accused | hubs

        Returns:
            {"result": <method output>, "chunks": list[str]}

        Raises:
            ValueError: For unsupported or misconfigured filter types.
        """
        query_type: str = query.filters.get("type", "")
        logger.info("GraphRetriever.retrieve type='%s'", query_type)

        if query_type == "network":
            result = self.get_network(query.filters["entity_id"])
        elif query_type == "clusters":
            result = self.find_clusters()
        elif query_type == "shortest_path":
            result = self.shortest_path(query.filters["entity_a"], query.filters["entity_b"])
        elif query_type == "co_accused":
            result = self.get_co_accused(query.filters["person_name"])
        elif query_type == "hubs":
            result = self.find_hubs()
        else:
            raise ValueError(f"Unsupported graph query type: '{query_type}'")

        return {"result": result, "chunks": self.to_chunks(result)}

    # ------------------------------------------------------------------
    # Method 1 — Network (2-hop)
    # ------------------------------------------------------------------

    def get_network(self, entity_id: str) -> dict[str, list[dict[str, str]]]:
        """
        Return all nodes and edges within 2 hops of the given entity.
        Output is fully JSON-serializable for frontend graph visualizations.

        Args:
            entity_id: Unique identifier of the root node.

        Returns:
            {
                "nodes": [{"id": str, "label": str, "name": str}, ...],
                "edges": [{"source": str, "target": str, "type": str}, ...]
            }
        """
        cypher = """
            MATCH (n {id: $entity_id})-[r*1..2]-(m)
            RETURN n, r, m
        """
        logger.debug("get_network: entity_id=%s", entity_id)
        try:
            rows = self._db.run_query(cypher, {"entity_id": entity_id})
        except Exception as exc:
            logger.error("get_network failed: %s", exc)
            raise

        nodes: list[dict[str, str]] = []
        edges: list[dict[str, str]] = []
        seen_node_ids: set[str] = set()

        for row in rows:
            for node_key in ("n", "m"):
                raw_node = row.get(node_key)
                if raw_node is not None:
                    node = _serialize_node(raw_node)
                    if node["id"] not in seen_node_ids:
                        nodes.append(node)
                        seen_node_ids.add(node["id"])

            raw_rel = row.get("r")
            if raw_rel is not None:
                # Variable-length paths return a list of relationships
                rels = raw_rel if isinstance(raw_rel, list) else [raw_rel]
                for rel in rels:
                    edges.append(_serialize_edge(rel))

        return {"nodes": nodes, "edges": edges}

    # ------------------------------------------------------------------
    # Method 2 — Clusters
    # ------------------------------------------------------------------

    def find_clusters(self) -> list[dict[str, Any]]:
        """
        Identify criminal groups as connected components with size > 3.
        The WHERE clause in Cypher enforces this; Python post-filters as a
        safety net in case the driver returns unexpected rows.

        Returns:
            [{"cluster_id": str, "members": list[str], "size": int}, ...]
        """
        cypher = """
            MATCH (p)-[:ACCUSED_IN]->(f:FIR)
            WITH f, collect(p.name) AS members
            WHERE size(members) > 3
            RETURN f.id AS cluster_id, members, size(members) AS size
            ORDER BY size DESC
        """
        logger.debug("find_clusters called")
        try:
            rows = self._db.run_query(cypher, {})
        except Exception as exc:
            logger.error("find_clusters failed: %s", exc)
            raise

        return [
            {
                "cluster_id": str(row["cluster_id"]),
                "members": list(row["members"]),
                "size": int(row["size"]),
            }
            for row in rows
            if int(row["size"]) > 3  # safety post-filter
        ]

    # ------------------------------------------------------------------
    # Method 3 — Shortest path
    # ------------------------------------------------------------------

    def shortest_path(self, entity_a: str, entity_b: str) -> list[str]:
        """
        Find the shortest path between two entities.

        Args:
            entity_a: ID of the first entity.
            entity_b: ID of the second entity.

        Returns:
            Ordered list of node names along the path, or [] if no path exists.
        """
        cypher = """
            MATCH (a {id: $entity_a}), (b {id: $entity_b}),
                  p = shortestPath((a)-[*]-(b))
            RETURN [node IN nodes(p) | coalesce(node.name, node.id)] AS path
        """
        logger.debug("shortest_path: %s -> %s", entity_a, entity_b)
        try:
            rows = self._db.run_query(cypher, {"entity_a": entity_a, "entity_b": entity_b})
        except Exception as exc:
            logger.error("shortest_path failed: %s", exc)
            raise

        if not rows:
            logger.info("shortest_path: no path found between %s and %s", entity_a, entity_b)
            return []

        return list(rows[0].get("path", []))

    # ------------------------------------------------------------------
    # Method 4 — Co-accused
    # ------------------------------------------------------------------

    def get_co_accused(self, person_name: str) -> list[dict[str, str]]:
        """
        Find all co-accused who share a FIR with the given person.

        Args:
            person_name: Full name of the person of interest.

        Returns:
            [{"person": str, "fir_id": str}, ...]
        """
        cypher = """
            MATCH (p:Person {name: $person_name})-[:ACCUSED_IN]->(f:FIR)
                  <-[:ACCUSED_IN]-(co:Person)
            WHERE co.name <> $person_name
            RETURN DISTINCT co.name AS person, f.id AS fir_id
        """
        logger.debug("get_co_accused: person_name=%s", person_name)
        try:
            rows = self._db.run_query(cypher, {"person_name": person_name})
        except Exception as exc:
            logger.error("get_co_accused failed: %s", exc)
            raise

        return [{"person": str(row["person"]), "fir_id": str(row["fir_id"])} for row in rows]

    # ------------------------------------------------------------------
    # Method 5 — Hubs
    # ------------------------------------------------------------------

    def find_hubs(self) -> list[dict[str, Any]]:
        """
        Find high-degree nodes (degree > 5) — direct support for HVT detection.

        Returns:
            [{"node": {"id": str, "label": str, "name": str}, "degree": int}, ...]
            Ordered by degree descending.
        """
        cypher = """
            MATCH (n)-[r]-()
            WITH n, count(r) AS degree
            WHERE degree > 5
            RETURN n, degree
            ORDER BY degree DESC
        """
        logger.debug("find_hubs called")
        try:
            rows = self._db.run_query(cypher, {})
        except Exception as exc:
            logger.error("find_hubs failed: %s", exc)
            raise

        return [
            {"node": _serialize_node(row["n"]), "degree": int(row["degree"])}
            for row in rows
        ]

    # ------------------------------------------------------------------
    # Chunk conversion
    # ------------------------------------------------------------------

    def to_chunks(self, data: Any) -> list[str]:
        """
        Convert graph query results into human-readable RAG strings.

        Args:
            data: Output from any graph method (dict or list).

        Returns:
            list[str] suitable for LLM context injection.
        """
        chunks: list[str] = []

        # Network: {"nodes": [...], "edges": [...]}
        if isinstance(data, dict) and "nodes" in data and "edges" in data:
            for node in data["nodes"]:
                chunks.append(f"{node['name']} is a {node['label']} in the criminal network.")
            for edge in data["edges"]:
                rel = edge["type"].lower().replace("_", " ")
                chunks.append(f"{edge['source']} {rel} {edge['target']}.")

        # Clusters: [{"cluster_id", "members", "size"}]
        elif isinstance(data, list) and data and "cluster_id" in data[0]:
            for c in data:
                chunks.append(
                    f"Cluster {c['cluster_id']} has {c['size']} members: {', '.join(c['members'])}."
                )

        # Shortest path: ["Name A", "Node", "Name B"]
        elif isinstance(data, list) and data and isinstance(data[0], str):
            chunks.append("Shortest path: " + " → ".join(data) + ".")

        # Co-accused: [{"person", "fir_id"}]
        elif isinstance(data, list) and data and "fir_id" in data[0] and "person" in data[0]:
            for item in data:
                chunks.append(f"{item['person']} is co-accused in FIR {item['fir_id']}.")

        # Hubs: [{"node": {...}, "degree": int}]
        elif isinstance(data, list) and data and "degree" in data[0]:
            for item in data:
                chunks.append(
                    f"{item['node']['name']} is a network hub with degree {item['degree']}."
                )

        return chunks
