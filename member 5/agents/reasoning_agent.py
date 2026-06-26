"""
agents/reasoning_agent.py
ReasoningAgent: synthesises all upstream agent results into a structured
chain-of-thought analysis using the Claude API.
"""

import json
import logging
import re
from typing import Any, Dict, List

from agents.base_agent import BaseAgent
from contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert criminal intelligence analyst for the Karnataka State Police.
Your task is to reason carefully over structured evidence produced by multiple specialised AI agents.
Always think step-by-step. Be precise, evidence-based, and flag uncertainty when it exists.
Never invent facts — only reason over what is provided."""


class ReasoningAgent(BaseAgent):
    """
    Synthesises all upstream agent results into a multi-step chain-of-thought
    analysis and produces structured conclusions with a confidence score.
    """

    def __init__(self, claude_client):
        super().__init__(name="ReasoningAgent", claude_client=claude_client)

    def _execute(self, message: AgentInput) -> AgentOutput:
        """
        1. Collects all upstream agent results from message.agent_results.
        2. Builds a structured CoT prompt for Claude.
        3. Parses the response into reasoning_steps, conclusions, confidence.
        4. Returns AgentOutput with data and confidence score.
        """
        agent_results: Dict[str, Any] = message.agent_results

        # ── Build the prompt ──────────────────────────────────────────────────
        prompt = self._build_prompt(message.query, agent_results)

        # ── Call Claude ───────────────────────────────────────────────────────
        self.logger.info("ReasoningAgent: Calling Claude for chain-of-thought synthesis.")
        raw_response = self._call_claude(prompt, system=SYSTEM_PROMPT)

        # ── Parse the structured response ─────────────────────────────────────
        reasoning_steps, conclusions, confidence = self._parse_response(raw_response)

        self.logger.info(
            f"ReasoningAgent: Produced {len(reasoning_steps)} steps, "
            f"{len(conclusions)} conclusions, confidence={confidence:.2f}."
        )

        return AgentOutput(
            agent_name=self.name,
            data={
                "reasoning_steps": reasoning_steps,
                "conclusions": conclusions,
                "confidence": confidence,
                "raw_response": raw_response,
            },
            chunks=reasoning_steps,  # expose steps as readable chunks
            confidence=confidence,
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_prompt(self, query: str, agent_results: Dict[str, Any]) -> str:
        """
        Construct a chain-of-thought prompt that injects all agent outputs
        as JSON sections and asks Claude to reason through them.
        """
        sections = []
        for agent_name, result in agent_results.items():
            try:
                formatted = json.dumps(result, indent=2, ensure_ascii=False, default=str)
            except Exception:
                formatted = str(result)
            sections.append(f"### {agent_name} Output\n```json\n{formatted}\n```")

        agent_data_block = "\n\n".join(sections) if sections else "No upstream agent data available."

        prompt = f"""
You are analysing a law enforcement investigation query.

## Original Investigation Query
{query}

## Evidence from Specialised Agents
{agent_data_block}

## Your Task — Reason Step by Step

Please work through the following four stages and label each clearly:

**STAGE 1 — ESTABLISHED FACTS**
List every concrete fact that is directly supported by the agent outputs above.
Format each fact as a numbered bullet: "FACT N: <statement>"

**STAGE 2 — CONNECTIONS**
Identify meaningful connections, patterns, or relationships between the facts.
Format each connection as: "CONNECTION N: <statement>"

**STAGE 3 — CONCLUSIONS**
Based on the facts and connections, state your conclusions about the investigation.
Format each conclusion as: "CONCLUSION N: <statement>"

**STAGE 4 — CONFIDENCE ASSESSMENT**
Rate your overall confidence that the conclusions are correct on a scale from 0.0 to 1.0.
Consider: data completeness, source agreement, and the strength of evidence.
Format as: "CONFIDENCE: <float between 0.0 and 1.0>"
Briefly explain the rating in 1–2 sentences.
"""
        return prompt.strip()

    def _parse_response(self, raw: str):
        """
        Parse Claude's structured response into:
          - reasoning_steps (list[str]): all FACT + CONNECTION lines
          - conclusions (list[str]): all CONCLUSION lines
          - confidence (float): extracted CONFIDENCE score
        """
        reasoning_steps: List[str] = []
        conclusions: List[str] = []
        confidence: float = 0.5  # default if parsing fails

        # Extract FACT and CONNECTION lines
        for match in re.finditer(r"(FACT \d+|CONNECTION \d+):\s*(.+?)(?=\n[A-Z]|\Z)", raw, re.DOTALL):
            step = f"{match.group(1)}: {match.group(2).strip()}"
            reasoning_steps.append(step)

        # Extract CONCLUSION lines
        for match in re.finditer(r"CONCLUSION \d+:\s*(.+?)(?=\nCONCLUSION|\nCONFIDENCE|\Z)", raw, re.DOTALL):
            conclusions.append(match.group(1).strip())

        # Extract CONFIDENCE score
        conf_match = re.search(r"CONFIDENCE:\s*([0-9]*\.?[0-9]+)", raw)
        if conf_match:
            try:
                parsed = float(conf_match.group(1))
                confidence = max(0.0, min(1.0, parsed))
            except ValueError:
                pass

        # If parsing found nothing, treat the entire response as one step
        if not reasoning_steps:
            reasoning_steps = [raw.strip()]
        if not conclusions:
            conclusions = [raw.strip()]

        return reasoning_steps, conclusions, confidence
