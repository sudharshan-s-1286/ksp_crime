import logging
from typing import List, Set, Dict, Any
from backend.contracts.agent_schemas import AgentInput

logger = logging.getLogger("Router")

class Router:
    """
    Intelligent query router that evaluates natural language queries, 
    extracts entities, and maps them to a set of active cognitive agents.
    """
    def __init__(self):
        # Intent-based keyword maps
        self.agent_keywords = {
            "forecast_agent": ["forecast", "predict", "trend", "alert", "anomaly", "projection", "warning", "early warning"],
            "analytics_agent": ["hotspot", "statistic", "yoy", "year-over-year", "time-of-day", "temporal", "spatial", "distribution", "density"],
            "profiling_agent": ["profile", "background", "history", "suspect", "offender", "recidivism", "modus operandi", "mo"],
            "sociology_agent": ["sociology", "social", "demographic", "unemployment", "vulnerability", "neighborhood", "youth"],
            "financial_agent": ["financial", "hawala", "money", "launder", "shell company", "bank", "audit", "transaction", "cash"],
            "decision_support_agent": ["recommendation", "next step", "action", "risk", "priority", "coordination", "inter-agency", "commander"]
        }

    def route(self, message: AgentInput) -> List[str]:
        """
        Analyzes the query intent and returns a list of target agent names to execute.
        Also enriches the message entities if any suspect names or districts are detected in the query text.
        """
        query = message.query.lower().strip()
        selected_agents: Set[str] = set()

        # 1. Extract Suspect Names from query text if not already provided
        suspects = message.entities.get("person_names", [])
        if not suspects:
            ignore_words = {"KSP", "Crime", "Copilot", "Karnataka", "Police", "Morning", "Afternoon", "Evening", "Night", "Burglary", "Theft", "Assault", "Cyber", "Financial", "Forensic", "Investigator", "Supervisor", "Policymaker", "Shivajinagar", "Mysore", "Mangalore", "Bangalore", "Profile", "Analyze", "Provide", "Review", "Check", "Show", "Generate", "Run", "Get", "Find", "Inspect", "Test", "Demo", "Complete", "Full", "Summary", "Report", "Provide", "Intelligence", "Brief", "Run", "Complete", "Audit", "Next", "What", "How", "When", "Where", "Why", "Can", "Will", "Is", "Are", "Was", "Were", "Do", "Does", "Did", "Has", "Have", "Had"}
            ignore_words_upper = {w.upper() for w in ignore_words}
            tokens = message.query.split()
            for i in range(len(tokens) - 1):
                w1 = tokens[i].strip()
                w2 = tokens[i + 1].strip()
                if (len(w1) > 1 and len(w2) > 1 and
                    w1[0].isupper() and w1[1:].islower() and
                    w2[0].isupper() and w2[1:].islower() and
                    w1.upper() not in ignore_words_upper and
                    w2.upper() not in ignore_words_upper):
                    full_name = f"{w1} {w2}"
                    if full_name not in suspects:
                        suspects.append(full_name)
            if suspects:
                message.entities["person_names"] = suspects
                logger.info(f"Router extracted suspect names from query: {suspects}")

        # 2. Extract District from query text if not already provided
        district = message.context.get("district")
        if not district:
            districts = ["shivajinagar", "mysore", "mangalore", "bangalore east", "bangalore central"]
            for dist in districts:
                if dist in query:
                    # Title case the district name
                    message.context["district"] = dist.title()
                    logger.info(f"Router extracted district from query: {dist.title()}")
                    break

        # 3. Analyze keywords to select agents
        for agent_name, keywords in self.agent_keywords.items():
            for kw in keywords:
                if kw in query:
                    selected_agents.add(agent_name)
                    break

        # 4. Apply intelligent defaults
        # If a suspect is mentioned, always include profiling and network analysis
        if message.entities.get("person_names") or message.entity_id:
            selected_agents.add("profiling_agent")
            selected_agents.add("network_agent")
            
        # If the query is financial in nature, include financial agent
        if any(w in query for w in ["hawala", "money", "shell", "launder"]):
            selected_agents.add("financial_agent")

        # If no agents were selected, default to crime query and response synthesis
        if not selected_agents:
            logger.info("No specific agent intent matched. Defaulting to crime_query_agent.")
            selected_agents.add("crime_query_agent")

        # Always ensure decision support runs if recommendations are asked
        if any(w in query for w in ["recommendation", "action", "risk", "priority", "briefing"]):
            selected_agents.add("decision_support_agent")

        # Convert to sorted list for deterministic execution order
        routed_list = sorted(list(selected_agents))
        logger.info(f"Router mapped query to agents: {routed_list}")
        return routed_list
