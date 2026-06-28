"""
agents/sociology_agent.py

Sociology analysis agent for KSP Crime Copilot.
Assesses demographic vulnerabilities, local crime density, and recidivism drivers.
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


class SQLRetrieverProtocol(Protocol):
    def retrieve(self, query: AgentInput) -> dict[str, Any]:
        ...


class AnalyticsRetrieverProtocol(Protocol):
    def retrieve(self, query: str) -> list[dict[str, Any]]:
        ...


class GeminiClientProtocol(Protocol):
    def generate(self, prompt: str) -> str:
        ...


# ---------------------------------------------------------------------------
# SociologyAgent
# ---------------------------------------------------------------------------

class SociologyAgent(BaseAgent):
    """
    Analyzes the sociological dimensions of crime patterns, focusing on
    district demographics, regional vulnerability indices, and recidivism drivers.
    """

    def __init__(
        self,
        sql_retriever: SQLRetrieverProtocol,
        analytics_retriever: AnalyticsRetrieverProtocol,
        gemini_client: GeminiClientProtocol,
    ) -> None:
        self.sql_retriever = sql_retriever
        self.analytics_retriever = analytics_retriever
        self.gemini = gemini_client

    async def run(self, message: AgentInput) -> AgentOutput:
        return await self._execute(message)

    async def _execute(self, message: AgentInput) -> AgentOutput:
        """
        Workflow:
        1. Fetch crime statistics count for district from SQL
        2. Fetch pre-computed analytical indicators (vulnerability, baselines)
        3. Compute risk scores (area_risk_score, recidivism_risk)
        4. Prompt Gemini to write sociological assessment
        5. Return AgentOutput
        """
        try:
            district = message.context.get("district") or message.filters.get("district", "Shivajinagar")
            logger.info("SociologyAgent: starting assessment for district='%s'", district)

            all_chunks: list[str] = []

            # 1. SQL incident count retrieval
            # We mock/inject a query message or run retrieve depending on what SQLRetriever expects.
            # In member_2, SQLRetriever.retrieve accepts AgentInput and returns a dict with 'records' list.
            sql_result = self.sql_retriever.retrieve(message)
            records = sql_result.get("records", [])
            sql_chunks = sql_result.get("chunks", [])
            all_chunks.extend(sql_chunks)

            # Count of incidents targeting this district
            incident_count = len([
                r for r in records
                if str(r.get("location") or r.get("district", "")).lower() == district.lower()
            ])
            if not incident_count and records:
                # If no direct location match, fallback to total records returned by retriever
                incident_count = len(records)

            # 2. Fetch analytical indicators
            analytics_chunks = self.analytics_retriever.retrieve(district)
            all_chunks.extend([
                f"Analytics baseline loaded for {district}."
                for _ in analytics_chunks
            ])

            analytics_data = {}
            if analytics_chunks:
                analytics_data = analytics_chunks[0].get("data", {})

            # Extract indices
            vuln_index = analytics_data.get("demographic_vulnerability_index", {}).get(district, 0.50)
            baseline_recidivism = analytics_data.get("state_wide_baselines", {}).get("recidivism_rate", 0.22)

            # 3. Calculate metrics
            normalized_incidents = min(1.0, incident_count / 10.0)
            area_risk_score = round((normalized_incidents * 0.4 + vuln_index * 0.6) * 10, 1)
            recidivism_risk = round(baseline_recidivism * (1 + vuln_index * 0.5), 2)

            demographics = {
                "target_district": district,
                "recorded_incidents": incident_count,
                "vulnerability_index": vuln_index,
                "state_average_recidivism": baseline_recidivism,
            }

            # 4. Prompt & Summary
            prompt = self._build_prompt(district, incident_count, vuln_index, recidivism_risk)
            logger.info("SociologyAgent: calling Gemini for analysis")
            analysis: str = self.gemini.generate(prompt)

            return AgentOutput(
                success=True,
                data={
                    "demographics": demographics,
                    "area_risk_score": area_risk_score,
                    "recidivism_risk": recidivism_risk,
                    "analysis": analysis,
                },
                chunks=all_chunks,
                confidence=0.88,
            )

        except Exception as exc:
            logger.error("SociologyAgent failed: %s", exc, exc_info=True)
            return AgentOutput(
                success=False,
                data={},
                chunks=[],
                confidence=0.0,
                error=str(exc),
            )

    def _build_prompt(
        self,
        district: str,
        incident_count: int,
        vulnerability_index: float,
        recidivism_risk: float,
    ) -> str:
        """Construct prompt for criminal sociology analysis."""
        return (
            "You are a criminal sociologist.\n\n"
            f"Write a 150-word professional sociological assessment on the crime drivers in the '{district}' district "
            "based on the following metrics:\n\n"
            f"District: {district}\n"
            f"Recorded Incidents: {incident_count}\n"
            f"Vulnerability Index: {vulnerability_index} (Scale 0-1)\n"
            f"Recidivism Risk: {recidivism_risk * 100:.1f}%\n\n"
            "Analyze how urban density, economic factors, and local community infrastructure are "
            "influencing these numbers. Highlight actionable preventive and community-oriented interventions.\n"
            "Use only the supplied metrics. Do not hallucinate. Keep the response under 150 words.\n\n"
            "Sociological Assessment:"
        )
