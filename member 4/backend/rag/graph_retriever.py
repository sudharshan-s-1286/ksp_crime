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
            "summary": f"Retrieved {len(nodes)} nodes and {len(edges)} edges in the criminal network."
        }
        
        return [{
            "source": "graph_retriever",
            "data": result
        }]
