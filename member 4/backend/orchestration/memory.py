import logging
from typing import List, Dict, Any

logger = logging.getLogger("Memory")

class Memory:
    """
    Manages session memory and multi-turn chat history for the KSP Crime Copilot.
    Provides utility methods to save, load, and format conversation histories.
    """
    def __init__(self):
        # In-memory store for session conversations
        # Maps session_id -> list of message dicts
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Retrieves the conversation history for a given session ID.
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str):
        """
        Appends a message (role: 'user' or 'assistant') to the session history.
        """
        history = self.get_history(session_id)
        history.append({"role": role, "content": content})
        logger.info(f"Added message for session '{session_id}' (Role: {role}). History size: {len(history)}.")
        
        # Apply sliding window context compression if history grows too long (>10 messages)
        if len(history) > 10:
            logger.info(f"Session '{session_id}' history size exceeds threshold. Compressing context window.")
            # Keep the system instruction/first message and the last 6 messages
            self.sessions[session_id] = history[:1] + history[-6:]

    def get_formatted_history(self, session_id: str) -> str:
        """
        Formats the chat history into a structured string suitable for LLM prompting.
        """
        history = self.get_history(session_id)
        if not history:
            return "No previous conversation history."
            
        formatted = []
        for msg in history:
            role_label = "User" if msg["role"] == "user" else "Copilot Assistant"
            formatted.append(f"{role_label}: {msg['content']}")
        return "\n".join(formatted)

    def clear_session(self, session_id: str):
        """
        Clears all conversation history for a given session ID.
        """
        if session_id in self.sessions:
            self.sessions[session_id] = []
            logger.info(f"Cleared session history for session '{session_id}'.")
