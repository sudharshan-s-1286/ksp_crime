"""
db/neo4j_client.py
Singleton Neo4j client for Cypher graph queries.
Used by agents that traverse person-FIR-crime relationship networks.
"""

import logging
import os
from typing import Any, Dict, List

from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class Neo4jClient:
    """
    Singleton wrapper around the Neo4j Python driver.

    All agents import the module-level `neo4j_client` instance
    rather than instantiating this class directly.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")

        if not all([uri, user, password]):
            raise EnvironmentError(
                "NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables must all be set."
            )

        try:
            self._driver = GraphDatabase.driver(uri, auth=(user, password))
            logger.info(f"Neo4jClient: Driver created for URI={uri}.")
        except Exception as e:
            logger.error(f"Neo4jClient: Failed to create driver: {e}", exc_info=True)
            raise

    def query(self, cypher: str, params: Dict[str, Any] = {}) -> List[Dict[str, Any]]:
        """
        Execute a read Cypher query and return results as a list of dicts.

        Args:
            cypher: Cypher query string.
            params: Dict of query parameters (use $param syntax in Cypher).

        Returns:
            List of dicts, one per record returned by the query.
        """
        try:
            with self._driver.session() as session:
                result = session.run(cypher, params)
                return [dict(record) for record in result]
        except Neo4jError as e:
            logger.error(f"Neo4jClient.query Neo4j error: {e}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Neo4jClient.query failed: {e}", exc_info=True)
            raise

    def write(self, cypher: str, params: Dict[str, Any] = {}) -> None:
        """
        Execute a write Cypher query (CREATE, MERGE, SET, DELETE).

        Args:
            cypher: Write Cypher query string.
            params: Dict of query parameters.
        """
        try:
            with self._driver.session() as session:
                session.write_transaction(lambda tx: tx.run(cypher, params))
            logger.info("Neo4jClient.write: Write transaction completed.")
        except Neo4jError as e:
            logger.error(f"Neo4jClient.write Neo4j error: {e}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Neo4jClient.write failed: {e}", exc_info=True)
            raise

    def health_check(self) -> bool:
        """
        Verify the Neo4j connection is alive.

        Returns:
            True if RETURN 1 succeeds, False otherwise.
        """
        try:
            result = self.query("RETURN 1 AS alive")
            return len(result) > 0 and result[0].get("alive") == 1
        except Exception as e:
            logger.error(f"Neo4jClient.health_check failed: {e}", exc_info=True)
            return False

    def close(self) -> None:
        """Close the Neo4j driver and free all connections."""
        try:
            self._driver.close()
            logger.info("Neo4jClient: Driver closed.")
        except Exception as e:
            logger.error(f"Neo4jClient.close failed: {e}", exc_info=True)


# ── Module-level singleton ─────────────────────────────────────────────────────
# All agents import this directly:  from db.neo4j_client import neo4j_client
neo4j_client = Neo4jClient()
