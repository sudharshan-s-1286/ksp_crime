"""
agents/response_agent.py
ResponseAgent: produces the final role-filtered, professionally formatted
police report response using all upstream agent data.
"""

import json
import logging
import re
from typing import Any, Dict, List

from agents.base_agent import BaseAgent
from contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior intelligence report writer for the Karnataka State Police.
You write clear, professional, actionable reports tailored to the specific reader's role.
Every report must be factual, concise, and free of speculation beyond what the evidence supports."""

# Role definitions control what Claude is asked to include
ROLE_INSTRUCTIONS = {
    "Investigator": """
You are writing for a field investigator with full operational access.
Include:
- Complete factual findings from all agents
- Specific person names, FIR numbers, locations, and dates (where available)
- Detailed recommended actions with priority ordering
- Risk factors and potential investigative leads
- All source citations
""",
    "Supervisor": """
You are writing for a police supervisor who needs situational awareness.
Include:
- Executive summary of key findings (no granular data)
- Priority score and threat level
- Key risks and escalation triggers
- High-level recommended actions
- Do NOT include individual suspect names or granular case details
""",
    "Policymaker": """
You are writing for a senior policymaker or police commissioner.
Include:
- High-level crime trends and patterns only
- Geographic or temporal clusters
- Resource or coordination needs
- Strategic recommendations
- Do NOT include individual case details, names, or operational specifics
""",
}


class ResponseAgent(BaseAgent):
    """
    Final pipeline agent. Synthesises all upstream agent data into a
    role-appropriate, professionally formatted police report response.

    Supports three roles: Investigator | Supervisor | Policymaker
    """

    def __init__(self, claude_client):
        super().__init__(name="ResponseAgent", claude_client=claude_client)

    def _execute(self, message: AgentInput) -> AgentOutput:
        """
        1. Reads all agent results including reasoning and explainability.
        2. Determines the user role and selects the correct output filter.
        3. Calls Claude to write the final professionally formatted response.
        4. Returns complete AgentOutput with final_answer, priority_score,
           recommended_actions, confidence, role, sources_used.
        """
        agent_results: Dict[str, Any] = message.agent_results
        role: str = message.role.strip()

        # Validate role, default to Investigator if unrecognised
        if role not in ROLE_INSTRUCTIONS:
            self.logger.warning(
                f"ResponseAgent: Unknown role '{role}'. Defaulting to 'Investigator'."
            )
            role = "Investigator"

        # ── Collect key upstream data ─────────────────────────────────────────
        reasoning_data = agent_results.get("ReasoningAgent", {}).get("data", {})
        explainability_data = agent_results.get("ExplainabilityAgent", {}).get("data", {})
        sources_used = self._collect_sources(agent_results)

        # ── Build and send prompt ─────────────────────────────────────────────
        prompt = self._build_prompt(message.query, role, agent_results)
        self.logger.info(f"ResponseAgent: Calling Claude for role='{role}' final response.")
        raw_response = self._call_claude(prompt, system=SYSTEM_PROMPT)

        # ── Parse structured fields from response ─────────────────────────────
        final_answer, priority_score, recommended_actions = self._parse_response(raw_response)

        # ── Derive overall confidence from reasoning agent ────────────────────
        confidence = float(reasoning_data.get("confidence", 0.5))

        self.logger.info(
            f"ResponseAgent: Done. role={role}, priority={priority_score}, "
            f"confidence={confidence:.2f}, actions={len(recommended_actions)}."
        )

        return AgentOutput(
            agent_name=self.name,
            data={
                "final_answer": final_answer,
                "priority_score": priority_score,
                "recommended_actions": recommended_actions,
                "confidence": confidence,
                "role": role,
                "sources_used": sources_used,
            },
            chunks=[final_answer] + recommended_actions,
            confidence=confidence,
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_prompt(
        self,
        query: str,
        role: str,
        agent_results: Dict[str, Any],
    ) -> str:
        """Construct the role-filtered final response prompt."""

        role_instruction = ROLE_INSTRUCTIONS[role]

        # Summarise all agent data as compact JSON
        try:
            all_data = json.dumps(agent_results, indent=2, ensure_ascii=False, default=str)
        except Exception:
            all_data = str(agent_results)

        prompt = f"""
## Investigation Query
{query}

## Reader Role: {role}
{role_instruction}

## All Agent Intelligence Data
```json
{all_data}
```

## Your Task

Write a complete, professional police intelligence report for a {role}.

Structure your response with exactly these labelled sections:

FINAL REPORT:
<Write the main body of the report here. Use professional police report language.
Follow the role instructions above strictly for what to include or exclude.>

PRIORITY SCORE: <integer from 1 (low) to 10 (critical)>
<One sentence justifying the score.>

RECOMMENDED ACTIONS:
- ACTION 1: <specific, actionable step>
- ACTION 2: <specific, actionable step>
- ACTION 3: <specific, actionable step>
<Add more actions if necessary. Each must be concrete and role-appropriate.>
"""
        return prompt.strip()

    def _parse_response(self, raw: str):
        """
        Parse the three structured sections from Claude's response.

        Returns:
            final_answer (str), priority_score (int), recommended_actions (list[str])
        """
        final_answer: str = ""
        priority_score: int = 5
        recommended_actions: List[str] = []

        # ── Final report body ─────────────────────────────────────────────────
        report_match = re.search(
            r"FINAL REPORT:\s*(.*?)(?=PRIORITY SCORE:|RECOMMENDED ACTIONS:|$)",
            raw, re.DOTALL
        )
        if report_match:
            final_answer = report_match.group(1).strip()
        else:
            final_answer = raw.strip()

        # ── Priority score ────────────────────────────────────────────────────
        priority_match = re.search(r"PRIORITY SCORE:\s*(\d+)", raw)
        if priority_match:
            try:
                priority_score = max(1, min(10, int(priority_match.group(1))))
            except ValueError:
                pass

        # ── Recommended actions ───────────────────────────────────────────────
        actions_match = re.search(
            r"RECOMMENDED ACTIONS:\s*(.*?)(?=$)",
            raw, re.DOTALL
        )
        if actions_match:
            for line in actions_match.group(1).strip().splitlines():
                line = line.strip()
                # Match "- ACTION N: ..." or "- ..." bullet lines
                if re.match(r"^-\s*(ACTION \d+:)?\s*.+", line):
                    cleaned = re.sub(r"^-\s*(ACTION \d+:)?\s*", "", line).strip()
                    if cleaned:
                        recommended_actions.append(cleaned)

        return final_answer, priority_score, recommended_actions

    def _collect_sources(self, agent_results: Dict[str, Any]) -> List[str]:
        """
        Extract source citations from ExplainabilityAgent if available,
        otherwise list all agent names as sources.
        """
        expl_data = agent_results.get("ExplainabilityAgent", {}).get("data", {})
        citations = expl_data.get("source_citations", [])
        if citations:
            return citations
        # Fallback: just list the agent names that ran
        return [k for k in agent_results.keys() if agent_results[k] and not agent_results[k].get("error")]
