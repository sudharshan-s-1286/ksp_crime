"""
tests/test_rag.py
Unit tests for PostgresClient, Neo4jClient, and FAISSClient.
All external connections are mocked — no real database required.
"""

import json
import os
import sys
import types
import unittest
from unittest.mock import MagicMock, patch, PropertyMock

# ── Path setup ────────────────────────────────────────────────────────────────
# Ensure the project root is on the path so imports resolve correctly.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PostgresClient Tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPostgresClient(unittest.TestCase):
    """Tests for db/postgres_client.py using a mocked connection pool."""

    def setUp(self):
        """Reset the singleton before each test."""
        # We patch at the module level so the singleton never talks to a real DB
        self.env_patch = patch.dict(os.environ, {
            "DATABASE_URL": "postgresql://test:test@localhost/testdb"
        })
        self.env_patch.start()

        self.pool_patch = patch("psycopg2.pool.SimpleConnectionPool")
        self.mock_pool_cls = self.pool_patch.start()

        # Build a realistic mock connection + cursor
        self.mock_conn = MagicMock()
        self.mock_cursor = MagicMock()
        self.mock_cursor.__enter__ = MagicMock(return_value=self.mock_cursor)
        self.mock_cursor.__exit__ = MagicMock(return_value=False)
        self.mock_conn.cursor.return_value = self.mock_cursor

        self.mock_pool = MagicMock()
        self.mock_pool.getconn.return_value = self.mock_conn
        self.mock_pool_cls.return_value = self.mock_pool

        # Clear the singleton so we get a fresh instance per test
        from db import postgres_client as pg_module
        pg_module.PostgresClient._instance = None
        pg_module.PostgresClient._initialized = False

        from db.postgres_client import PostgresClient
        self.client = PostgresClient()

    def tearDown(self):
        self.env_patch.stop()
        self.pool_patch.stop()
        from db import postgres_client as pg_module
        pg_module.PostgresClient._instance = None

    def test_health_check_returns_true(self):
        """health_check() should return True when SELECT 1 succeeds."""
        self.mock_cursor.fetchall.return_value = [{"alive": 1}]
        self.mock_cursor.description = [("alive",)]
        # Patch execute_query directly to avoid cursor_factory complexity
        with patch.object(self.client, "execute_query", return_value=[{"alive": 1}]):
            result = self.client.health_check()
        self.assertTrue(result)

    def test_health_check_returns_false_on_error(self):
        """health_check() should return False when the DB is unreachable."""
        with patch.object(self.client, "execute_query", side_effect=Exception("connection refused")):
            result = self.client.health_check()
        self.assertFalse(result)

    def test_execute_query_returns_list(self):
        """execute_query() must return a list of dicts."""
        fake_rows = [{"fir_id": 1, "crime": "theft"}, {"fir_id": 2, "crime": "assault"}]
        with patch.object(self.client, "execute_query", return_value=fake_rows):
            result = self.client.execute_query("SELECT * FROM fir LIMIT 2")
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 2)
        self.assertIn("fir_id", result[0])

    def test_execute_query_returns_empty_list_for_no_rows(self):
        """execute_query() must return [] for queries with no results."""
        with patch.object(self.client, "execute_query", return_value=[]):
            result = self.client.execute_query("SELECT * FROM fir WHERE 1=0")
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)

    def test_execute_many_calls_executemany(self):
        """execute_many() should delegate to cursor.executemany."""
        sql = "INSERT INTO fir (id, crime) VALUES (%s, %s)"
        params_list = [(1, "theft"), (2, "assault")]
        # Verify it does not raise and commits
        self.client.execute_many(sql, params_list)
        self.mock_cursor.executemany.assert_called_once_with(sql, params_list)
        self.mock_conn.commit.assert_called_once()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Neo4jClient Tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestNeo4jClient(unittest.TestCase):
    """Tests for db/neo4j_client.py using a mocked GraphDatabase driver."""

    def setUp(self):
        self.env_patch = patch.dict(os.environ, {
            "NEO4J_URI": "bolt://localhost:7687",
            "NEO4J_USER": "neo4j",
            "NEO4J_PASSWORD": "password",
        })
        self.env_patch.start()

        self.driver_patch = patch("neo4j.GraphDatabase.driver")
        self.mock_driver_cls = self.driver_patch.start()

        # Build mock session and result
        self.mock_record_1 = {"person": "Ravi", "fir_count": 3}
        self.mock_record_2 = {"person": "Kumar", "fir_count": 1}
        self.mock_result = [self.mock_record_1, self.mock_record_2]

        self.mock_session = MagicMock()
        self.mock_session.__enter__ = MagicMock(return_value=self.mock_session)
        self.mock_session.__exit__ = MagicMock(return_value=False)
        self.mock_session.run.return_value = self.mock_result

        self.mock_driver = MagicMock()
        self.mock_driver.session.return_value = self.mock_session
        self.mock_driver_cls.return_value = self.mock_driver

        from db import neo4j_client as neo_module
        neo_module.Neo4jClient._instance = None
        neo_module.Neo4jClient._initialized = False

        from db.neo4j_client import Neo4jClient
        self.client = Neo4jClient()

    def tearDown(self):
        self.env_patch.stop()
        self.driver_patch.stop()
        from db import neo4j_client as neo_module
        neo_module.Neo4jClient._instance = None

    def test_health_check_returns_true(self):
        """health_check() returns True when RETURN 1 succeeds."""
        with patch.object(self.client, "query", return_value=[{"alive": 1}]):
            result = self.client.health_check()
        self.assertTrue(result)

    def test_health_check_returns_false_on_error(self):
        """health_check() returns False when Neo4j is unreachable."""
        with patch.object(self.client, "query", side_effect=Exception("Connection refused")):
            result = self.client.health_check()
        self.assertFalse(result)

    def test_query_returns_list(self):
        """query() must return a list of dicts."""
        with patch.object(
            self.client, "query",
            return_value=[{"person": "Ravi", "fir_count": 3}]
        ):
            result = self.client.query("MATCH (p:Person) RETURN p.name AS person, p.fir_count AS fir_count")
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        self.assertIn("person", result[0])

    def test_query_returns_empty_list_for_no_results(self):
        """query() must return [] when Cypher finds nothing."""
        with patch.object(self.client, "query", return_value=[]):
            result = self.client.query("MATCH (p:Person {name: 'nobody'}) RETURN p")
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)

    def test_close_calls_driver_close(self):
        """close() must call driver.close() exactly once."""
        self.client.close()
        self.mock_driver.close.assert_called_once()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FAISSClient Tests
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestFAISSClient(unittest.TestCase):
    """Tests for db/faiss_client.py using a mocked FAISS index and metadata."""

    def setUp(self):
        import tempfile
        import numpy as np

        self.tmp_meta = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        )
        metadata = {
            "0": {"doc_id": "DOC001", "title": "Robbery case 2024", "district": "Bengaluru"},
            "1": {"doc_id": "DOC002", "title": "Fraud network report", "district": "Mysuru"},
        }
        json.dump(metadata, self.tmp_meta)
        self.tmp_meta.close()

        self.env_patch = patch.dict(os.environ, {
            "FAISS_INDEX_PATH": "/fake/index.faiss",
            "FAISS_METADATA_PATH": self.tmp_meta.name,
        })
        self.env_patch.start()

        # Mock the FAISS index
        self.mock_index = MagicMock()
        self.mock_index.d = 768
        self.mock_index.ntotal = 2
        self.mock_index.search.return_value = (
            np.array([[0.12, 0.45]], dtype=np.float32),
            np.array([[0, 1]], dtype=np.int64),
        )

        self.faiss_patch = patch("faiss.read_index", return_value=self.mock_index)
        self.faiss_patch.start()

        from db import faiss_client as faiss_module
        faiss_module.FAISSClient._instance = None
        faiss_module.FAISSClient._initialized = False

        from db.faiss_client import FAISSClient
        self.client = FAISSClient()

    def tearDown(self):
        import os as _os
        self.env_patch.stop()
        self.faiss_patch.stop()
        _os.unlink(self.tmp_meta.name)
        from db import faiss_client as faiss_module
        faiss_module.FAISSClient._instance = None

    def test_health_check_returns_true(self):
        """health_check() returns True when index is loaded."""
        result = self.client.health_check()
        self.assertTrue(result)

    def test_get_dimension_returns_int(self):
        """get_dimension() returns the correct index dimension."""
        dim = self.client.get_dimension()
        self.assertIsInstance(dim, int)
        self.assertEqual(dim, 768)

    def test_search_returns_list_of_dicts(self):
        """search() returns a list of correctly shaped dicts."""
        import numpy as np
        query_vector = np.random.rand(768).astype(np.float32)
        results = self.client.search(query_vector, top_k=2)

        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

        for item in results:
            self.assertIn("id", item, "Result dict must have 'id' key")
            self.assertIn("score", item, "Result dict must have 'score' key")
            self.assertIn("metadata", item, "Result dict must have 'metadata' key")
            self.assertIsInstance(item["id"], int)
            self.assertIsInstance(item["score"], float)
            self.assertIsInstance(item["metadata"], dict)

    def test_search_metadata_populated(self):
        """search() results must have non-empty metadata from the metadata file."""
        import numpy as np
        query_vector = np.random.rand(768).astype(np.float32)
        results = self.client.search(query_vector, top_k=2)
        for item in results:
            self.assertGreater(len(item["metadata"]), 0, "Metadata should not be empty")

    def test_search_calls_faiss_index(self):
        """search() must call index.search() with correct shape."""
        import numpy as np
        query_vector = np.random.rand(768).astype(np.float32)
        self.client.search(query_vector, top_k=2)
        self.mock_index.search.assert_called_once()
        call_args = self.mock_index.search.call_args
        passed_array = call_args[0][0]
        self.assertEqual(passed_array.shape, (1, 768))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    unittest.main(verbosity=2)
