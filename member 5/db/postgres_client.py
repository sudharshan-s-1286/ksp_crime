"""
db/postgres_client.py
Singleton PostgreSQL client using psycopg2 connection pooling.
Imported by all agents that need relational crime data queries.
"""

import logging
import os
from typing import Any, Dict, List, Tuple

import psycopg2
from psycopg2 import pool, extras
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class PostgresClient:
    """
    Singleton wrapper around a psycopg2 SimpleConnectionPool.

    All agents import the module-level `postgres_client` instance
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

        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise EnvironmentError("DATABASE_URL environment variable is not set.")

        try:
            self._pool = pool.SimpleConnectionPool(
                minconn=2,
                maxconn=10,
                dsn=database_url
            )
            logger.info("PostgresClient: Connection pool created (minconn=2, maxconn=10).")
        except Exception as e:
            logger.error(f"PostgresClient: Failed to create connection pool: {e}", exc_info=True)
            raise

    def execute_query(self, sql: str, params: Tuple = ()) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return all rows as a list of dicts.

        Args:
            sql: SQL query string (use %s placeholders for params).
            params: Tuple of query parameters.

        Returns:
            List of dicts, one per row, keyed by column name.
        """
        conn = None
        try:
            conn = self._pool.getconn()
            with conn.cursor(cursor_factory=extras.RealDictCursor) as cursor:
                cursor.execute(sql, params)
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"PostgresClient.execute_query failed: {e}", exc_info=True)
            raise
        finally:
            if conn:
                self._pool.putconn(conn)

    def execute_many(self, sql: str, params_list: List[Tuple]) -> None:
        """
        Execute a batch INSERT/UPDATE using executemany.

        Args:
            sql: SQL query string with %s placeholders.
            params_list: List of parameter tuples, one per row.
        """
        conn = None
        try:
            conn = self._pool.getconn()
            with conn.cursor() as cursor:
                cursor.executemany(sql, params_list)
            conn.commit()
            logger.info(f"PostgresClient.execute_many: inserted {len(params_list)} rows.")
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"PostgresClient.execute_many failed: {e}", exc_info=True)
            raise
        finally:
            if conn:
                self._pool.putconn(conn)

    def health_check(self) -> bool:
        """
        Verify the database connection is alive.

        Returns:
            True if SELECT 1 succeeds, False otherwise.
        """
        try:
            result = self.execute_query("SELECT 1 AS alive")
            return len(result) > 0
        except Exception as e:
            logger.error(f"PostgresClient.health_check failed: {e}", exc_info=True)
            return False

    def close(self) -> None:
        """Close all connections in the pool."""
        try:
            self._pool.closeall()
            logger.info("PostgresClient: All connections closed.")
        except Exception as e:
            logger.error(f"PostgresClient.close failed: {e}", exc_info=True)


# ── Module-level singleton ─────────────────────────────────────────────────────
# All agents import this directly:  from db.postgres_client import postgres_client
postgres_client = PostgresClient()
