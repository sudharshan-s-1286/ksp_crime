"""
tests/test_member3.py

Pytest suite for AnalyticsRetriever, VectorRetriever, SociologyAgent, and FinancialAgent.
Uses mock implementations — no databases or external API connections required.
"""

from __future__ import annotations

import json
from typing import Any
from unittest.mock import MagicMock

import pytest

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.analytics_retriver import AnalyticsRetriever
from rag.vector_retriver import VectorRetriever
from agents.sociology_agent import SociologyAgent, AgentOutput as SociologyOutput
from agents.financial_agents import FinancialAgent, AgentOutput as FinancialOutput


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


def make_mock_gemini(response: str = "Mock narrative.") -> MagicMock:
    client = MagicMock()
    client.generate.return_value = response
    return client


# ---------------------------------------------------------------------------
# TEST 1 — AnalyticsRetriever
# ---------------------------------------------------------------------------

def test_analytics_retriever():
    """Verify AnalyticsRetriever returns the expected data baselines and indices."""
    retriever = AnalyticsRetriever()
    results = retriever.retrieve("Shivajinagar")

    assert len(results) == 1
    data = results[0]["data"]
    assert "state_wide_baselines" in data
    assert "category_clearance_rates" in data
    assert "demographic_vulnerability_index" in data

    # Verify key properties
    assert data["demographic_vulnerability_index"]["Shivajinagar"] == 0.82
    assert data["state_wide_baselines"]["recidivism_rate"] == 0.22


# ---------------------------------------------------------------------------
# TEST 2 — VectorRetriever
# ---------------------------------------------------------------------------

def test_vector_retriever():
    """Verify VectorRetriever searches documents correctly using TF-IDF matching."""
    retriever = VectorRetriever()
    
    # Query matching Ramesh Kumar
    results = retriever.retrieve("Ramesh Kumar hawala network", k=2)
    assert len(results) == 2
    
    # First match should be the Ramesh Kumar document
    first_doc = results[0]
    assert "Ramesh Kumar" in first_doc["title"]
    assert first_doc["similarity_score"] > 0.0
    assert first_doc["metadata"]["suspect_name"] == "Ramesh Kumar"

    # Query matching Suresh Patil
    results_suresh = retriever.retrieve("Suresh Patil burglaries", k=2)
    assert len(results_suresh) == 2
    assert "Suresh Patil" in results_suresh[0]["text"]
    assert results_suresh[0]["similarity_score"] > 0.0


# ---------------------------------------------------------------------------
# TEST 3 — SociologyAgent
# ---------------------------------------------------------------------------

def make_mock_sql_retriever(records: list[dict]) -> MagicMock:
    retriever = MagicMock()
    retriever.retrieve.return_value = {
        "records": records,
        "chunks": [f"Record FIR: {r.get('fir_id')}" for r in records],
    }
    return retriever


def make_mock_analytics_retriever(data: dict) -> MagicMock:
    retriever = MagicMock()
    retriever.retrieve.return_value = [{"data": data}]
    return retriever


@pytest.mark.asyncio
async def test_sociology_agent():
    """Verify SociologyAgent computes correct risk scores and calls Gemini."""
    # 5 incidents in Shivajinagar
    sql_records = [
        {"fir_id": "FIR-001", "location": "Shivajinagar", "crime_type": "Theft"},
        {"fir_id": "FIR-002", "location": "Shivajinagar", "crime_type": "Burglary"},
        {"fir_id": "FIR-003", "location": "Shivajinagar", "crime_type": "Assault"},
        {"fir_id": "FIR-004", "location": "Shivajinagar", "crime_type": "Theft"},
        {"fir_id": "FIR-005", "location": "Shivajinagar", "crime_type": "Burglary"},
    ]

    analytics_data = {
        "state_wide_baselines": {"recidivism_rate": 0.20},
        "demographic_vulnerability_index": {"Shivajinagar": 0.80}
    }

    agent = SociologyAgent(
        sql_retriever=make_mock_sql_retriever(sql_records),
        analytics_retriever=make_mock_analytics_retriever(analytics_data),
        gemini_client=make_mock_gemini("Sociological risk assessment response."),
    )

    message = MockAgentInput(
        query="sociology risk assessment",
        filters={"district": "Shivajinagar"},
        context={"district": "Shivajinagar"}
    )

    output: SociologyOutput = await agent.run(message)

    assert output.success is True, f"Error: {output.error}"
    assert output.data["analysis"] == "Sociological risk assessment response."
    
    # incident_count = 5. normalized_incidents = 5/10 = 0.5.
    # vuln_index = 0.80.
    # area_risk_score = (0.5 * 0.4 + 0.8 * 0.6) * 10 = (0.2 + 0.48) * 10 = 6.8.
    assert output.data["area_risk_score"] == 6.8
    
    # recidivism_risk = 0.20 * (1 + 0.80 * 0.5) = 0.20 * 1.4 = 0.28.
    assert output.data["recidivism_risk"] == 0.28

    assert output.data["demographics"]["recorded_incidents"] == 5
    assert output.data["demographics"]["vulnerability_index"] == 0.80


# ---------------------------------------------------------------------------
# TEST 4 — FinancialAgent
# ---------------------------------------------------------------------------

def make_mock_graph_retriever(network: dict) -> MagicMock:
    retriever = MagicMock()
    retriever.get_network.return_value = network
    return retriever


@pytest.mark.asyncio
async def test_financial_agent():
    """Verify FinancialAgent parses financial flags and scores risk correctly."""
    sql_records = [
        {
            "fir_id": "FIR-101",
            "accused": "Ramesh Kumar",
            "crime_type": "Financial fraud",
            "modus_operandi": "Hawala routing using shell companies",
            "shell_name": "Ramesh Textile Front"
        }
    ]

    graph_network = {
        "nodes": [
            {"id": "Ramesh Kumar", "name": "Ramesh Kumar", "label": "Person"},
            {"id": "Karan", "name": "Karan", "label": "Person"}
        ],
        "edges": [
            {"source": "Ramesh Kumar", "target": "Karan", "type": "Hawala Courier"}
        ]
    }

    agent = FinancialAgent(
        sql_retriever=make_mock_sql_retriever(sql_records),
        graph_retriever=make_mock_graph_retriever(graph_network),
        gemini_client=make_mock_gemini("Financial audit report narrative."),
    )

    message = MockAgentInput(
        query="financial background",
        entities=["Ramesh Kumar"]
    )

    output: FinancialOutput = await agent.run(message)

    assert output.success is True, f"Error: {output.error}"
    assert output.data["analysis"] == "Financial audit report narrative."
    
    # Risk calculation:
    # Base risk = 4.0
    # "hawala" in MO -> +2.0
    # "shell" in MO -> +2.0
    # Courier edge -> +1.5
    # Total = 9.5
    assert output.data["risk_score"] == 9.5
    assert "Hawala money routing detected" in output.data["financial_flags"]
    assert "Shell company front usage detected" in output.data["financial_flags"]
    assert "Ramesh Textile Front" in output.data["shell_companies"]
