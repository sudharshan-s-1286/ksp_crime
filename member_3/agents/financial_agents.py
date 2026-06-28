"""
agents/financial_agents.py

Financial intelligence agent for KSP Crime Copilot.
Detects money laundering, hawala operations, and shell company fronts.
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
    def get_network(self, entity_id: str) -> dict[str, list[Any]]:
        ...


class GeminiClientProtocol(Protocol):
    def generate(self, prompt: str) -> str:
        ...


# ---------------------------------------------------------------------------
# FinancialAgent
# ---------------------------------------------------------------------------

class FinancialAgent(BaseAgent):
    """
    Detects illicit financial operations, including money laundering,
    hawala transactions, and shell company fronts, using SQL and Graph data.
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
        1. Extract target suspect from entities list
        2. Query SQL for financial and cyber FIRs linked to the suspect
        3. Query Graph to find accomplice / courier network connections
        4. Analyze modus operandi to flag Hawala/Shell activities and score risk
        5. Prompt Gemini to write forensic intelligence narrative
        6. Return AgentOutput
        """
        try:
            suspect_name = message.entities[0] if message.entities else "Ramesh Kumar"
            logger.info("FinancialAgent: starting analysis for suspect='%s'", suspect_name)

            all_chunks: list[str] = []

            # 2. Relational SQL queries for financial cases
            sql_result = self.sql_retriever.retrieve(message)
            records = sql_result.get("records", [])
            sql_chunks = sql_result.get("chunks", [])
            all_chunks.extend(sql_chunks)

            # Filter records matching this suspect with financial keywords
            financial_firs = [
                r for r in records
                if str(r.get("accused", "")).lower() == suspect_name.lower()
                and any(
                    kw in str(r.get("crime_type", "")).lower() or kw in str(r.get("modus_operandi", "")).lower()
                    for kw in ("financial", "cyber", "laundering", "fraud", "hawala", "theft", "extortion")
                )
            ]

            # 3. Graph Network connections
            graph_data: dict[str, list[Any]] = {"nodes": [], "edges": []}
            try:
                # Retrieve co-accused network for the suspect name or entity ID
                graph_data = self.graph_retriever.get_network(suspect_name)
            except Exception as exc:
                logger.warning("get_network failed for '%s': %s", suspect_name, exc)

            # 4. Pattern matching and risk scoring
            financial_flags: list[str] = []
            shell_companies: list[str] = []
            risk_score = 0.0

            if financial_firs:
                risk_score += 4.0  # Base risk for active financial records
                for fir in financial_firs:
                    mo = str(fir.get("modus_operandi", "")).lower()
                    if "hawala" in mo or "routing" in mo:
                        financial_flags.append("Hawala money routing detected")
                        risk_score += 2.0
                    if "shell" in mo or "front" in mo or "corp" in mo or "textile" in mo:
                        financial_flags.append("Shell company front usage detected")
                        shell_companies.append(
                            str(fir.get("shell_name") or "Textile Shell Front Corp")
                        )
                        risk_score += 2.0

            edges = graph_data.get("edges", [])
            for edge in edges:
                rel_type = str(edge.get("type", ""))
                if "hawala" in rel_type.lower() or "courier" in rel_type.lower() or "fencer" in rel_type.lower():
                    target_name = edge.get("target") or edge.get("end_node", "Unknown")
                    financial_flags.append(
                        f"Linked to known financial intermediary: {target_name} ({rel_type})"
                    )
                    risk_score += 1.5

            risk_score = min(10.0, risk_score)

            # 5. Prompt & Narrative
            prompt = self._build_prompt(suspect_name, shell_companies, financial_flags, len(edges), risk_score)
            logger.info("FinancialAgent: generating forensic briefing")
            briefing: str = self.gemini.generate(prompt)

            return AgentOutput(
                success=True,
                data={
                    "financial_flags": financial_flags,
                    "shell_companies": shell_companies,
                    "risk_score": risk_score,
                    "analysis": briefing,
                },
                chunks=all_chunks,
                confidence=0.91,
            )

        except Exception as exc:
            logger.error("FinancialAgent failed: %s", exc, exc_info=True)
            return AgentOutput(
                success=False,
                data={},
                chunks=[],
                confidence=0.0,
                error=str(exc),
            )

    def _build_prompt(
        self,
        suspect: str,
        shell_companies: list[str],
        flags: list[str],
        edge_count: int,
        risk_score: float,
    ) -> str:
        """Construct prompt for financial intelligence analysis."""
        flags_str = ", ".join(flags) or "None detected"
        shells_str = ", ".join(shell_companies) or "None detected"
        return (
            "You are a forensic financial investigator.\n\n"
            f"Write a 150-word financial intelligence briefing detailing a suspected money laundering operation "
            f"for suspect '{suspect}' based on these findings:\n\n"
            f"Suspect: {suspect}\n"
            f"Detected Shell Companies: {shells_str}\n"
            f"Financial Flags: {flags_str}\n"
            f"Graph Network Connections: {edge_count} active links\n"
            f"Assigned Risk Score: {risk_score}/10\n\n"
            "Explain the mechanics of how the money is routed, how front companies are utilized, "
            "and what specific bank audit trails should be subpoenaed next.\n"
            "Use only the supplied metrics. Do not hallucinate. Keep the response under 150 words.\n\n"
            "Forensic Briefing:"
        )
