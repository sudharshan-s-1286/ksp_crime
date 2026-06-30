import logging
from typing import List, Dict, Any

logger = logging.getLogger("GraphRetriever")

class GraphRetriever:
    """
    RAG retriever that simulates queries to a Neo4j Graph Database
    to fetch co-accused relationships, syndicate structures, and suspect networks.
    """
    def __init__(self):
        # In-memory graph representation
        self.network = {
            "Suresh Patil": [
                {"co_accused": "Dinesh Gowda", "relationship": "Syndicate Associate", "shared_cases": ["FIR-2025-018"], "strength": 1},
                {"co_accused": "Vinay M.", "relationship": "Fencer/Receiver", "shared_cases": ["FIR-2025-001", "FIR-2025-009"], "strength": 2},
                {"co_accused": "Anil K.", "relationship": "Accomplice", "shared_cases": ["FIR-2025-009"], "strength": 1}
            ],
            "Ramesh Kumar": [
                {"co_accused": "Mohan Raj", "relationship": "Technical Accomplice", "shared_cases": ["FIR-2025-002"], "strength": 1},
                {"co_accused": "Kiran S.", "relationship": "Hawala Courier", "shared_cases": ["FIR-2025-005"], "strength": 1}
            ],
            "Dinesh Gowda": [
                {"co_accused": "Suresh Patil", "relationship": "Syndicate Associate", "shared_cases": ["FIR-2025-018"], "strength": 1},
                {"co_accused": "Shankar Lal", "relationship": "Enforcer", "shared_cases": ["FIR-2025-011", "FIR-2025-022"], "strength": 2}
            ]
        }

    def retrieve(self, suspect_names: List[str]) -> List[Dict[str, Any]]:
        """
        Retrieves the co-accused network nodes and edges for the specified suspects.
        """
        logger.info(f"Retrieving co-accused network for suspects: {suspect_names}")
        nodes = []
        edges = []
        visited_nodes = set()
        
        # Add primary suspects to node list
        for name in suspect_names:
            if name not in visited_nodes:
                nodes.append({"id": name, "label": "Suspect", "role": "Primary Target"})
                visited_nodes.add(name)
                
            # Fetch connections
            connections = self.network.get(name, [])
            for conn in connections:
                co_accused = conn["co_accused"]
                if co_accused not in visited_nodes:
                    # Determine label based on relationship
                    label = "Fencer" if "Fencer" in conn["relationship"] else "Suspect"
                    nodes.append({"id": co_accused, "label": label, "role": conn["relationship"]})
                    visited_nodes.add(co_accused)
                    
                # Add edge
                edges.append({
                    "source": name,
                    "target": co_accused,
                    "type": conn["relationship"],
                    "weight": conn["strength"],
                    "case_ids": conn["shared_cases"]
                })
                
        result = {
            "nodes": nodes,
            "edges": edges,
            "summary": f"Retrieved {len(nodes)} nodes and {len(edges)} edges in the criminal network.",
            "chunks": self.to_chunks({"nodes": nodes, "edges": edges})
        }
        
        return [{
            "source": "graph_retriever",
            "data": result
        }]

    # ------------------------------------------------------------------
    # Additional Graph Logic (Merged from SOURCE)
    # ------------------------------------------------------------------

    def to_chunks(self, data: Dict[str, Any]) -> List[str]:
        """
        Convert graph query results into human-readable RAG strings.
        Adapted from SOURCE's chunking logic to support LLMs.
        """
        chunks: List[str] = []
        if "nodes" in data and "edges" in data:
            for node in data["nodes"]:
                chunks.append(f"{node['id']} is a {node['label']} with role: {node.get('role', 'Unknown')}.")
            for edge in data["edges"]:
                cases = ", ".join(edge.get("case_ids", []))
                chunks.append(f"{edge['source']} is connected to {edge['target']} via {edge['type']} (Cases: {cases}).")
        return chunks

    def find_hubs(self) -> List[Dict[str, Any]]:
        """
        Find high-degree nodes (High Value Targets).
        Adapted from SOURCE network scoring.
        """
        hubs = []
        for node, connections in self.network.items():
            hubs.append({"node": node, "degree": len(connections)})
        return sorted(hubs, key=lambda x: x["degree"], reverse=True)

    def shortest_path(self, entity_a: str, entity_b: str) -> List[str]:
        """
        Find the shortest path between two entities using BFS.
        Adapted from SOURCE graph traversal.
        """
        if entity_a not in self.network:
            return []
            
        queue = [[entity_a]]
        visited = {entity_a}
        
        while queue:
            path = queue.pop(0)
            node = path[-1]
            
            if node == entity_b:
                return path
                
            for conn in self.network.get(node, []):
                neighbor = conn["co_accused"]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])
                    
        return []

    def find_clusters(self) -> List[Dict[str, Any]]:
        """
        Identify criminal groups as connected components.
        Adapted from SOURCE cluster detection.
        """
        visited = set()
        clusters = []
        
        for node in self.network.keys():
            if node not in visited:
                component = []
                queue = [node]
                visited.add(node)
                
                while queue:
                    curr = queue.pop(0)
                    component.append(curr)
                    for conn in self.network.get(curr, []):
                        neighbor = conn["co_accused"]
                        if neighbor not in visited and neighbor in self.network:
                            visited.add(neighbor)
                            queue.append(neighbor)
                            
                if len(component) > 1:
                    clusters.append({
                        "cluster_id": f"cluster_{len(clusters)+1}",
                        "members": component,
                        "size": len(component)
                    })
                    
        return sorted(clusters, key=lambda x: x["size"], reverse=True)
