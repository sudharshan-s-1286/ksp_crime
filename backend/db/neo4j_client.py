import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger("Neo4jClient")

# Try importing neo4j
HAS_NEO4J = False
try:
    from neo4j import GraphDatabase
    HAS_NEO4J = True
except ImportError:
    logger.warning("neo4j driver not installed. Neo4j connection will run in fallback mode.")

class Neo4jClient:
    """
    Production-ready Neo4j Graph Database Client.
    Falls back to a structured in-memory mock graph for local testing.
    """
    _instance = None
    _driver = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Neo4jClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD")
        
        self.use_neo4j = HAS_NEO4J and os.getenv("USE_NEO4J", "false").lower() == "true"

        if self.use_neo4j:
            if not self.password:
                logger.warning("NEO4J_PASSWORD environment variable is not set. Neo4j connection may fail.")
            try:
                logger.info(f"Connecting to Neo4j database at {self.uri}...")
                self._driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password or ""))
                self._driver.verify_connectivity()
                logger.info("Neo4j connectivity verified successfully.")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {str(e)}. Switching to mock fallback.")
                self.use_neo4j = False

        if not self.use_neo4j:
            logger.info("Initializing Neo4jClient in mock fallback mode.")
            # Seed our high-fidelity suspect network
            self.mock_network = {
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

    def execute_cypher(self, cypher_query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Executes a Cypher query against the Neo4j instance.
        """
        if self.use_neo4j:
            if not self._driver:
                raise ConnectionError("Neo4j driver is not initialized.")
            
            with self._driver.session() as session:
                try:
                    result = session.run(cypher_query, params or {})
                    return [record.data() for record in result]
                except Exception as e:
                    logger.error(f"Neo4j Cypher execution failed: {str(e)}")
                    raise e
        else:
            # Fallback mock logic for testing Cypher queries
            logger.warning(f"Neo4j client in fallback mode. Mocking query: '{cypher_query[:40]}...'")
            return self._mock_cypher_execution(cypher_query, params or {})

    def _mock_cypher_execution(self, cypher: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Simulates a few common Cypher queries to keep the system testable.
        """
        cypher_clean = cypher.lower().strip()
        
        # Scenario A: Retrieve co-accused network paths
        if "match" in cypher_clean and "co_accused" in cypher_clean:
            # Try to extract the suspect names from params
            names = params.get("names", [params.get("name", "Suresh Patil")])
            records = []
            
            for name in names:
                connections = self.mock_network.get(name, [])
                for conn in connections:
                    records.append({
                        "suspect": name,
                        "co_accused": conn["co_accused"],
                        "relationship": conn["relationship"],
                        "shared_cases": conn["shared_cases"],
                        "strength": conn["strength"]
                    })
            return records
            
        # Default empty/generic return
        return []

    def close(self):
        if self._driver:
            self._driver.close()
            logger.info("Neo4j client connection closed.")
