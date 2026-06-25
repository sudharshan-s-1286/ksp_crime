"""
tests/test_agents.py

Pytest suite for GraphRetriever, CrimeQueryAgent, and NetworkAgent.
Uses only mock implementations — no real databases required.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import MagicMock

import pytest

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.graph_retriever import GraphRetriever
from agents.crime_query_agent import AgentOutput, CrimeQueryAgent
from agents.network_agent import NetworkAgent


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

class MockAgentInput:
    def __init__(
        self,
        query: str = "test",
        filters: dict | None = None,
        context: dict | None = None,
        entities: list[str] | None = None,
    ):
        self.query = query
        self.filters = filters or {}
        self.context = context or {}
        self.entities = entities or []


def make_neo4j_client(rows: list[dict[str, Any]]) -> MagicMock:
    client = MagicMock()
    client.run_query.return_value = rows
    return client


def make_mock_gemini(response: str = "Mock narrative.") -> MagicMock:
    client = MagicMock()
    client.generate.return_value = response
    return client


# ---------------------------------------------------------------------------
# TEST 1 — GraphRetriever: network — nodes/edges returned and JSON-serializable
# ---------------------------------------------------------------------------

def test_graph_retriever_network():
    """Verify get_network returns non-empty nodes/edges in JSON-serializable plain dicts."""
    rows = [
        {
            "n": {"id": "P001", "name": "Ravi Kumar", "type": "Person"},
            "r": {"type": "CO_ACCUSED", "start_node": "P001", "end_node": "P002"},
            "m": {"id": "P002", "name": "Akash Singh", "type": "Person"},
        }
    ]
    retriever = GraphRetriever(neo4j_client=make_neo4j_client(rows))
    result = retriever.get_network("P001")

    assert len(result["nodes"]) > 0, "Expected nodes"
    assert len(result["edges"]) > 0, "Expected edges"

    # Verify correct serialized shape
    node = result["nodes"][0]
    assert "id" in node and "label" in node and "name" in node, \
        f"Node missing required keys: {node}"

    edge = result["edges"][0]
    assert "source" in edge and "target" in edge and "type" in edge, \
        f"Edge missing required keys: {edge}"

    # Critical: must be JSON-serializable (no Neo4j objects)
    json.dumps(result)  # raises TypeError if not serializable

    node_ids = [n["id"] for n in result["nodes"]]
    assert "P001" in node_ids
    assert "P002" in node_ids


# ---------------------------------------------------------------------------
# TEST 2 — GraphRetriever: shortest_path — normal and empty (no path found)
# ---------------------------------------------------------------------------

def test_graph_retriever_shortest_path():
    """Verify shortest_path returns correct path and gracefully returns [] when not found."""
    rows = [{"path": ["Ravi Kumar", "FIR-102", "Akash Singh"]}]
    retriever = GraphRetriever(neo4j_client=make_neo4j_client(rows))
    path = retriever.shortest_path("P001", "P002")

    assert isinstance(path, list)
    assert len(path) > 0
    assert "Ravi Kumar" in path

    # Empty result — no path found, must return [] not crash
    retriever_empty = GraphRetriever(neo4j_client=make_neo4j_client([]))
    empty_path = retriever_empty.shortest_path("P001", "P999")
    assert empty_path == [], f"Expected [] for missing path, got: {empty_path}"


# ---------------------------------------------------------------------------
# TEST 3 — GraphRetriever: find_clusters — size > 3 enforced
# ---------------------------------------------------------------------------

def test_graph_retriever_find_clusters_size_filter():
    """Verify find_clusters enforces size > 3 as a post-filter safety net."""
    rows = [
        {"cluster_id": "FIR-001", "members": ["A", "B", "C", "D"], "size": 4},
        {"cluster_id": "FIR-002", "members": ["X", "Y", "Z"], "size": 3},  # must be excluded
    ]
    retriever = GraphRetriever(neo4j_client=make_neo4j_client(rows))
    clusters = retriever.find_clusters()

    assert all(c["size"] > 3 for c in clusters), \
        f"Cluster with size <= 3 slipped through: {clusters}"
    cluster_ids = [c["cluster_id"] for c in clusters]
    assert "FIR-001" in cluster_ids
    assert "FIR-002" not in cluster_ids, "Size-3 cluster should be filtered out"


# ---------------------------------------------------------------------------
# TEST 4 — GraphRetriever: find_hubs
# ---------------------------------------------------------------------------

def test_graph_retriever_find_hubs():
    """Verify find_hubs returns nodes with degree > 5 in correct shape."""
    rows = [
        {"n": {"id": "ravi", "name": "Ravi Kumar", "type": "Person"}, "degree": 8},
        {"n": {"id": "gang_fir", "name": "FIR-Gang-01", "type": "FIR"}, "degree": 6},
    ]
    retriever = GraphRetriever(neo4j_client=make_neo4j_client(rows))
    hubs = retriever.find_hubs()

    assert len(hubs) == 2
    assert all("node" in h and "degree" in h for h in hubs)
    assert all(h["degree"] > 5 for h in hubs)
    assert hubs[0]["node"]["id"] == "ravi"
    json.dumps(hubs)  # must be JSON-serializable


# ---------------------------------------------------------------------------
# TEST 5 — CrimeQueryAgent: success, summary, dedup, co-accused merge
# ---------------------------------------------------------------------------

def make_mock_sql_retriever(records: list[dict]) -> MagicMock:
    retriever = MagicMock()
    retriever.retrieve.return_value = {
        "records": records,
        "chunks": [f"Record: {r['fir_id']}" for r in records],
    }
    return retriever


def make_mock_graph_retriever_for_crime(co_accused: list[dict]) -> MagicMock:
    retriever = MagicMock()
    retriever.get_co_accused.return_value = co_accused
    return retriever


@pytest.mark.asyncio
async def test_crime_query_agent():
    """Verify success=True, summary generated, total_count > 0, and dedup works."""
    sql_records = [
        {"fir_id": "FIR-001", "crime_type": "Robbery", "location": "Bengaluru", "accused": "Ravi"},
        {"fir_id": "FIR-002", "crime_type": "Burglary", "location": "Mysuru", "accused": "Akash"},
        # Duplicate — should appear only once in merged output
        {"fir_id": "FIR-001", "crime_type": "Robbery", "location": "Bengaluru", "accused": "Ravi"},
    ]
    co_accused = [{"person": "Suresh", "fir_id": "FIR-003"}]

    agent = CrimeQueryAgent(
        sql_retriever=make_mock_sql_retriever(sql_records),
        graph_retriever=make_mock_graph_retriever_for_crime(co_accused),
        gemini_client=make_mock_gemini("2 crimes detected. Repeat offender: Ravi."),
    )

    output: AgentOutput = await agent.run(
        MockAgentInput(query="crimes in Bengaluru", filters={"region": "Bengaluru"}, entities=["Ravi"])
    )

    assert output.success is True, f"Expected success=True, error: {output.error}"
    assert output.data["summary"], "Expected non-empty summary"
    assert output.data["total_count"] > 0

    # Deduplication: FIR-001 should appear exactly once
    fir_ids = [r["fir_id"] for r in output.data["crime_records"]]
    assert fir_ids.count("FIR-001") == 1, "Duplicate FIR-001 was not deduplicated"

    # Co-accused FIR merged in
    assert "FIR-003" in fir_ids, "Co-accused FIR-003 should be present"

    # Gemini prompt contains anti-hallucination instruction
    call_args = agent.gemini.generate.call_args[0][0]
    assert "Do not hallucinate" in call_args


# ---------------------------------------------------------------------------
# TEST 6 — NetworkAgent: clusters, narrative, HVT detection, metrics
# ---------------------------------------------------------------------------

def make_mock_graph_retriever_for_network() -> MagicMock:
    """
    Graph with fir1 having degree 7 (ravi, akash, suresh, vijay, mohan + 2 more)
    to trigger HVT (> 5).
    """
    retriever = MagicMock()
    retriever.get_network.return_value = {
        "nodes": [
            {"id": "ravi",   "name": "Ravi Kumar",   "label": "Person"},
            {"id": "akash",  "name": "Akash Singh",  "label": "Person"},
            {"id": "fir1",   "name": "FIR-001",      "label": "FIR"},
            {"id": "suresh", "name": "Suresh",       "label": "Person"},
            {"id": "vijay",  "name": "Vijay",        "label": "Person"},
            {"id": "mohan",  "name": "Mohan",        "label": "Person"},
            {"id": "kumar",  "name": "Kumar",        "label": "Person"},
            {"id": "dev",    "name": "Dev",          "label": "Person"},
        ],
        "edges": [
            {"source": "ravi",   "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "akash",  "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "suresh", "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "vijay",  "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "mohan",  "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "kumar",  "target": "fir1",  "type": "ACCUSED_IN"},
            {"source": "dev",    "target": "fir1",  "type": "ACCUSED_IN"},  # fir1 degree = 7
            {"source": "ravi",   "target": "akash", "type": "ASSOCIATE_OF"},
            {"source": "ravi",   "target": "suresh","type": "ASSOCIATE_OF"},
        ],
    }
    retriever.find_clusters.return_value = [
        {"cluster_id": "FIR-001", "members": ["Ravi", "Akash", "Suresh", "Vijay"], "size": 4}
    ]
    retriever.find_hubs.return_value = [
        {"node": {"id": "fir1", "label": "FIR", "name": "FIR-001"}, "degree": 7}
    ]
    retriever.to_chunks.return_value = [
        "Ravi Kumar is a Person in the criminal network.",
        "Ravi Kumar accused in FIR-001.",
    ]
    return retriever


@pytest.mark.asyncio
async def test_network_agent():
    """Verify clusters, narrative, HVT (fir1 degree=7 > 5), and network metrics."""
    agent = NetworkAgent(
        graph_retriever=make_mock_graph_retriever_for_network(),
        gemini_client=make_mock_gemini("FIR-001 is a hub with 7 connections indicating gang activity."),
    )

    output: AgentOutput = await agent.run(
        MockAgentInput(query="analyze network", entities=["ravi"])
    )

    assert output.success is True, f"Expected success=True, error: {output.error}"
    assert len(output.data["clusters"]) > 0, "Expected clusters"
    assert output.data["network_narrative"], "Expected narrative"
    assert len(output.chunks) > 0, "Expected chunks"

    # HVT: fir1 has degree 7 — must be flagged
    hvt_ids = [h["entity"] for h in output.data["hvt_flags"]]
    assert "fir1" in hvt_ids, f"fir1 (degree=7) should be an HVT, got: {hvt_ids}"

    # HVT shape includes risk_level and reason
    hvt = next(h for h in output.data["hvt_flags"] if h["entity"] == "fir1")
    assert "risk_level" in hvt, "HVT must have risk_level"
    assert "reason" in hvt, "HVT must have reason"
    assert "7" in hvt["reason"], "Reason should mention the degree count"

    # Network metrics present and typed correctly
    metrics = output.data["network_metrics"]
    assert "cluster_count" in metrics
    assert "network_density" in metrics
    assert "avg_degree" in metrics
    assert isinstance(metrics["network_density"], float)
    assert isinstance(metrics["avg_degree"], float)
    assert metrics["cluster_count"] == 1

    # Hubs from dedicated Cypher query
    assert len(output.data["hubs"]) > 0, "Expected hubs from find_hubs()"

    # Narrative prompt contains anti-hallucination instruction
    call_args = agent.gemini.generate.call_args[0][0]
    assert "Do not hallucinate" in call_args
