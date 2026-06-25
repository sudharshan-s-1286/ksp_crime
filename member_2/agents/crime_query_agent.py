"""
agents/crime_query_agent.py

First-layer intelligence agent for FIR and crime record retrieval.
Orchestrates SQL and graph retrieval + LLM summarization.
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


class GraphRetrieverProtocol(Protocol):
    def get_co_accused(self, person_name: str) -> list[dict[str, str]]:
        ...


class GeminiClientProtocol(Protocol):
    def generate(self, prompt: str) -> str:
        ...


# ---------------------------------------------------------------------------
# CrimeQueryAgent
# ---------------------------------------------------------------------------

class CrimeQueryAgent(BaseAgent):
    """
    Retrieves crime records from SQL and graph sources, then generates
    an investigative summary using Gemini LLM.
    """

    def __init__(
        self,
        sql_retriever: SQLRetrieverProtocol,
        graph_retriever: GraphRetrieverProtocol,
        gemini_client: GeminiClientProtocol,
    ) -> None:
        self.sql_retriever = sql_retriever
        self.graph_retriever = graph_retriever
        self.gemini = gemini_client

    async def run(self, message: AgentInput) -> AgentOutput:
        return await self._execute(message)

    async def _execute(self, message: AgentInput) -> AgentOutput:
        """
        Workflow:
        1. SQL retrieval with filters
        2. Graph co-accused lookup per entity
        3. Deduplicated merge (no set(dicts) — unhashable)
        4. Build structured Gemini prompt
        5. Generate summary
        6. Compute stats
        7. Return AgentOutput
        """
        try:
            # STEP 1: SQL retrieval
            logger.info("CrimeQueryAgent: retrieving SQL records")
            sql_result = self.sql_retriever.retrieve(message)
            records: list[dict[str, Any]] = sql_result.get("records", [])
            sql_chunks: list[str] = sql_result.get("chunks", [])

            # STEP 2: Graph co-accused lookup
            logger.info(
                "CrimeQueryAgent: fetching co-accused for %d entities", len(message.entities)
            )
            co_accused_data: list[dict[str, str]] = []
            for entity in message.entities:
                try:
                    co_accused_data.extend(self.graph_retriever.get_co_accused(entity))
                except Exception as exc:
                    logger.warning("get_co_accused failed for '%s': %s", entity, exc)

            # STEP 3: Deduplicated merge — dicts are unhashable, use seen set on fir_id
            seen: set[str] = set()
            merged: list[dict[str, Any]] = []
            for record in records:
                key = record.get("fir_id", "")
                if key not in seen:
                    seen.add(key)
                    merged.append(record)

            for co_item in co_accused_data:
                fir_id = co_item["fir_id"]
                if fir_id not in seen:
                    seen.add(fir_id)
                    merged.append(
                        {
                            "fir_id": fir_id,
                            "accused": co_item["person"],
                            "source": "graph_co_accused",
                        }
                    )

            all_chunks = sql_chunks + [
                f"{item['person']} is co-accused in FIR {item['fir_id']}."
                for item in co_accused_data
            ]

            # STEP 4 + 5: Prompt and summary
            logger.info("CrimeQueryAgent: generating summary with Gemini")
            summary: str = self.gemini.generate(self._build_summary_prompt(merged))

            # STEP 6: Stats
            total_count = len(merged)
            crime_types: list[str] = list({r.get("crime_type", "Unknown") for r in merged})
            locations: list[str] = list({r.get("location", "Unknown") for r in merged})

            # STEP 7: Return
            return AgentOutput(
                success=True,
                data={
                    "crime_records": merged,
                    "summary": summary,
                    "total_count": total_count,
                    "crime_types": crime_types,
                    "locations": locations,
                },
                chunks=all_chunks,
                confidence=0.90,
            )

        except Exception as exc:
            logger.error("CrimeQueryAgent failed: %s", exc, exc_info=True)
            return AgentOutput(
                success=False,
                data={},
                chunks=[],
                confidence=0.0,
                error=str(exc),
            )

    def _build_summary_prompt(self, records: list[dict[str, Any]]) -> str:
        """
        Build a grounded, hallucination-resistant prompt for a 150-word summary.
        """
        snippets = []
        for rec in records[:20]:
            snippets.append(
                f"FIR {rec.get('fir_id', 'N/A')}: "
                f"{rec.get('crime_type', 'N/A')} at {rec.get('location', 'N/A')}, "
                f"accused: {rec.get('accused', 'N/A')}, "
                f"date: {rec.get('date', 'N/A')}"
            )

        return (
            "You are a crime intelligence analyst.\n\n"
            "Summarize the following crime records in exactly these sections:\n"
            "1. Total crimes\n"
            "2. Crime types\n"
            "3. Geographic spread\n"
            "4. Timeline\n"
            "5. Repeat offenders\n"
            "6. Investigative patterns\n\n"
            "Maximum 150 words.\n"
            "Use only the supplied data.\n"
            "Do not hallucinate.\n\n"
            "Crime Records:\n"
            + "\n".join(snippets)
            + "\n\nSummary:"
        )
