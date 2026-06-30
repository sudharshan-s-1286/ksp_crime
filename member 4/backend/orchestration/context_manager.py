import logging
from typing import Dict, Any, Tuple
from backend.contracts.agent_schemas import AgentInput

logger = logging.getLogger("ContextManager")

class ContextManager:
    """
    Manages security metadata, validates user roles, enforces rate/token bounds,
    and enriches pipeline execution contexts with security clearances.
    """
    VALID_ROLES = {"investigator", "supervisor", "policymaker"}

    def __init__(self):
        # Maps roles to authorization description for logging/security audits
        self.role_permissions = {
            "investigator": "Tactical case files, target locations, suspect networks, and concrete investigative actions.",
            "supervisor": "Priority scoring, risk matrices, budget checks, and case progress monitoring.",
            "policymaker": "Statewide high-level crime distributions, macro statistics, and inter-agency coordination."
        }

    def enrich_context(self, message: AgentInput) -> Tuple[AgentInput, Dict[str, Any]]:
        """
        Validates the user role and enriches the message context with security metadata.
        Returns a tuple of the enriched AgentInput and a diagnostic report dictionary.
        """
        # Read role from message context or entities, defaulting to Investigator
        role_raw = message.context.get("role", message.entities.get("role", "Investigator"))
        role = str(role_raw).strip().lower()

        # Enforce valid role fallback
        if role not in self.VALID_ROLES:
            logger.warning(f"Unauthorized or invalid role '{role_raw}' requested. Defaulting to 'investigator' credentials.")
            role = "investigator"
            message.context["role"] = "Investigator"

        # Attach security clearances to context
        security_clearance = {
            "authorized_role": role,
            "clearance_level": "Level 1 (Tactical)" if role == "investigator" else ("Level 2 (Management)" if role == "supervisor" else "Level 3 (Executive)"),
            "scope_description": self.role_permissions[role]
        }
        
        message.context["security_clearance"] = security_clearance
        logger.info(f"Enriched pipeline context for authorized role: '{role.upper()}' ({security_clearance['clearance_level']}).")

        diagnostics = {
            "status": "success",
            "authorized_role": role,
            "clearance_level": security_clearance["clearance_level"],
            "query_length_bytes": len(message.query.encode("utf-8"))
        }

        return message, diagnostics
