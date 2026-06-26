"""
agents/base_agent.py
Abstract base class for all KSP Crime Copilot agents.
Every agent must extend BaseAgent and implement _execute().
"""

import logging
from abc import ABC, abstractmethod
from typing import List

from contracts.agent_schemas import AgentInput, AgentOutput

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract base class for all pipeline agents.

    Subclasses must implement _execute(). The public run() method
    wraps _execute() in error handling so the pipeline never crashes
    due to a single agent failure.
    """

    def __init__(self, name: str, claude_client):
        """
        Args:
            name: Human-readable name for this agent (e.g. 'ReasoningAgent').
            claude_client: Instantiated Anthropic client (anthropic.Anthropic()).
        """
        self.name = name
        self.claude_client = claude_client
        self.logger = logging.getLogger(f"agent.{name}")

    @abstractmethod
    def _execute(self, message: AgentInput) -> AgentOutput:
        """
        Core agent logic. Must be implemented by every subclass.

        Args:
            message: AgentInput containing query, session, role, prior results.

        Returns:
            AgentOutput with results, chunks, confidence, and optional error.
        """
        raise NotImplementedError

    async def run(self, message: AgentInput) -> AgentOutput:
        """
        Public entry point. Wraps _execute() in try/except so one
        failing agent never crashes the entire pipeline.

        Args:
            message: AgentInput for this agent.

        Returns:
            AgentOutput — either real results or a safe error payload.
        """
        try:
            self.logger.info(f"[{self.name}] Starting execution for session={message.session_id}")
            result = self._execute(message)
            self.logger.info(f"[{self.name}] Completed. confidence={result.confidence:.2f}")
            return result
        except Exception as e:
            self.logger.error(f"[{self.name}] Failed with error: {e}", exc_info=True)
            return AgentOutput(
                agent_name=self.name,
                data={},
                chunks=[],
                confidence=0.0,
                error=str(e)
            )

    def _call_claude(self, prompt: str, system: str = "") -> str:
        """
        Call the Claude API (claude-sonnet-4-6) with a given prompt.

        Args:
            prompt: User-turn content to send.
            system: Optional system prompt for role/context setting.

        Returns:
            The text content of Claude's response.
        """
        try:
            kwargs = {
                "model": "claude-sonnet-4-6",
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": prompt}],
            }
            if system:
                kwargs["system"] = system

            response = self.claude_client.messages.create(**kwargs)
            # Extract text from the first content block
            return response.content[0].text if response.content else ""
        except Exception as e:
            self.logger.error(f"[{self.name}] Claude API call failed: {e}", exc_info=True)
            raise

    def _format_chunks(self, results: List[dict]) -> List[str]:
        """
        Convert a list of dicts into readable string chunks for display
        or downstream consumption.

        Args:
            results: List of dict records (e.g. DB rows, agent outputs).

        Returns:
            List of formatted strings, one per input dict.
        """
        chunks = []
        for i, record in enumerate(results, start=1):
            if not isinstance(record, dict):
                chunks.append(f"[{i}] {str(record)}")
                continue
            lines = [f"[Record {i}]"]
            for key, value in record.items():
                lines.append(f"  {key}: {value}")
            chunks.append("\n".join(lines))
        return chunks
