"""
agents/explainability_agent.py
ExplainabilityAgent: maps reasoning conclusions to supporting evidence,
cites sources, flags weak links, and produces a plain-English summary.
"""

import json
import logging
import re
from typing import Any, Dict, List

from agents.base_agent import BaseAgent
from contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior criminal intelligence analyst producing evidence accountability reports
for the Karnataka State Police. Your outputs must be transparent, auditable, and suitable for
presentation to both technical investigators and non-technical police officers.
Never invent evidence. If evidence is missing or weak, say so explicitly."""


class ExplainabilityAgent(BaseAgent):
    """
    Takes reasoning conclusions and all upstream agent results, then produces:
      - An evidence map: which evidence supports each conclusion
      - Source citations: which agent/retriever each piece of evidence came from
      - Weak conclusions: conclusions that lack strong evidential backing
      - A plain-English summary accessible to non-technical police officers
    """

    def __init__(self, claude_client):
        super().__init__(name="ExplainabilityAgent", claude_client=claude_client)

    def _execute(self, message: AgentInput) -> AgentOutput:
        """
        1. Reads reasoning conclusions from message.agent_results['ReasoningAgent'].
        2. Reads all other agent outputs for evidence.
        3. Prompts Claude to produce a full explainability report.
        4. Returns AgentOutput with evidence_map, plain_summary, weak_conclusions, source_citations.
        """
        agent_results: Dict[str, Any] = message.agent_results

        # ── Extract reasoning conclusions ─────────────────────────────────────
        reasoning_data = agent_results.get("ReasoningAgent", {})
        conclusions: List[str] = reasoning_data.get("data", {}).get("conclusions", [])
        if not conclusions:
            self.logger.warning("ExplainabilityAgent: No conclusions found from ReasoningAgent.")
            conclusions = ["No conclusions available from ReasoningAgent."]

        # ── Build and send prompt ─────────────────────────────────────────────
        prompt = self._build_prompt(message.query, conclusions, agent_results)
        self.logger.info("ExplainabilityAgent: Calling Claude for evidence mapping.")
        raw_response = self._call_claude(prompt, system=SYSTEM_PROMPT)

        # ── Parse structured output ───────────────────────────────────────────
        evidence_map, plain_summary, weak_conclusions, source_citations = self._parse_response(
            raw_response, conclusions
        )

        self.logger.info(
            f"ExplainabilityAgent: Mapped {len(evidence_map)} conclusions, "
            f"{len(weak_conclusions)} weak, {len(source_citations)} citations."
        )

        return AgentOutput(
            agent_name=self.name,
            data={
                "evidence_map": evidence_map,
                "plain_summary": plain_summary,
                "weak_conclusions": weak_conclusions,
                "source_citations": source_citations,
                "raw_response": raw_response,
            },
            chunks=[plain_summary] + source_citations,
            confidence=self._derive_confidence(weak_conclusions, conclusions),
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_prompt(
        self,
        query: str,
        conclusions: List[str],
        agent_results: Dict[str, Any],
    ) -> str:
        """Construct the evidence-mapping prompt."""

        conclusions_block = "\n".join(
            f"CONCLUSION {i + 1}: {c}" for i, c in enumerate(conclusions)
        )

        # Format all non-reasoning agent outputs as evidence sections
        evidence_sections = []
        for agent_name, result in agent_results.items():
            if agent_name == "ReasoningAgent":
                continue
            try:
                formatted = json.dumps(result, indent=2, ensure_ascii=False, default=str)
            except Exception:
                formatted = str(result)
            evidence_sections.append(f"### Evidence from {agent_name}\n```json\n{formatted}\n```")

        evidence_block = (
            "\n\n".join(evidence_sections) if evidence_sections
            else "No supporting agent evidence provided."
        )

        prompt = f"""
## Investigation Query
{query}

## Conclusions to Explain (produced by ReasoningAgent)
{conclusions_block}

## Raw Evidence from Upstream Agents
{evidence_block}

## Your Task

Produce a structured explainability report with exactly four sections:

---
**EVIDENCE MAP**
For each conclusion above, list the specific pieces of evidence that support it.
Format as:
CONCLUSION N EVIDENCE:
- <specific data point or fact> [SOURCE: <AgentName>]
- <another supporting piece> [SOURCE: <AgentName>]
...

---
**WEAK CONCLUSIONS**
List any conclusions where the supporting evidence is missing, thin, or contradictory.
Format as:
WEAK: <conclusion text> — REASON: <why the evidence is insufficient>

---
**SOURCE CITATIONS**
List every agent/retriever cited in this report as a numbered bibliography.
Format as:
CITATION N: <AgentName> — <brief description of what data it provided>

---
**PLAIN ENGLISH SUMMARY**
Write 3–5 sentences summarising the key findings in language that a non-technical
police officer with no AI background can fully understand. Avoid jargon.
Begin with: SUMMARY: <your text here>
"""
        return prompt.strip()

    def _parse_response(self, raw: str, conclusions: List[str]):
        """
        Parse Claude's structured explainability report into four components.
        """
        evidence_map: Dict[str, List[str]] = {}
        plain_summary: str = ""
        weak_conclusions: List[str] = []
        source_citations: List[str] = []

        # ── Evidence map ──────────────────────────────────────────────────────
        conclusion_blocks = re.findall(
            r"CONCLUSION (\d+) EVIDENCE:\s*(.*?)(?=CONCLUSION \d+ EVIDENCE:|WEAK:|SOURCE CITATIONS:|PLAIN ENGLISH SUMMARY:|$)",
            raw, re.DOTALL
        )
        for idx_str, block in conclusion_blocks:
            idx = int(idx_str) - 1
            key = conclusions[idx] if idx < len(conclusions) else f"Conclusion {idx_str}"
            bullets = [
                line.strip().lstrip("- ").strip()
                for line in block.strip().splitlines()
                if line.strip().startswith("-")
            ]
            evidence_map[key] = bullets

        # ── Weak conclusions ──────────────────────────────────────────────────
        weak_matches = re.findall(r"WEAK:\s*(.+?)(?=WEAK:|CITATION|SUMMARY:|$)", raw, re.DOTALL)
        for match in weak_matches:
            weak_conclusions.append(match.strip())

        # ── Source citations ──────────────────────────────────────────────────
        citation_matches = re.findall(r"CITATION \d+:\s*(.+?)(?=CITATION \d+:|SUMMARY:|$)", raw, re.DOTALL)
        for match in citation_matches:
            source_citations.append(match.strip())

        # ── Plain English summary ─────────────────────────────────────────────
        summary_match = re.search(r"SUMMARY:\s*(.+)", raw, re.DOTALL)
        if summary_match:
            plain_summary = summary_match.group(1).strip()
        else:
            # Fall back: grab last paragraph
            paragraphs = [p.strip() for p in raw.strip().split("\n\n") if p.strip()]
            plain_summary = paragraphs[-1] if paragraphs else raw.strip()

        return evidence_map, plain_summary, weak_conclusions, source_citations

    def _derive_confidence(self, weak_conclusions: List[str], all_conclusions: List[str]) -> float:
        """
        Simple heuristic: confidence = fraction of conclusions that are NOT weak.
        """
        if not all_conclusions:
            return 0.0
        strong = len(all_conclusions) - len(weak_conclusions)
        return round(max(0.0, min(1.0, strong / len(all_conclusions))), 2)
