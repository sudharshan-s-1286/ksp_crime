import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever
from backend.rag.analytics_retriever import AnalyticsRetriever
from backend.config.settings import call_llm

logger = logging.getLogger("SociologyAgent")

class SociologyAgent(BaseAgent):
    """
    Agent that analyzes the sociological dimensions of crime patterns, focusing on
    district demographics, regional vulnerability indices, and recidivism drivers.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()
        self.analytics_retriever = AnalyticsRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        district = message.context.get("district", "Shivajinagar")
        all_retrieved_chunks = []

        # 1. Fetch crime count for this district from SQL
        sql_query = "SELECT COUNT(*) as incident_count FROM firs WHERE LOWER(district) = LOWER(?)"
        sql_chunks = self.sql_retriever.retrieve(sql_query, (district,))
        all_retrieved_chunks.extend(sql_chunks)
        incident_count = sql_chunks[0]["data"]["incident_count"] if sql_chunks else 0

        # 2. Fetch pre-computed analytical indicators
        trend_chunks = self.analytics_retriever.retrieve(district)
        all_retrieved_chunks.extend(trend_chunks)
        analytics_data = trend_chunks[0]["data"] if trend_chunks else {}

        # Extract vulnerability and baseline metrics
        vuln_index = analytics_data.get("demographic_vulnerability_index", {}).get(district, 0.50)
        baseline_recidivism = analytics_data.get("state_wide_baselines", {}).get("recidivism_rate", 0.22)

        # 3. Calculate sociology indicators
        # Area risk score combines incident count and vulnerability index
        normalized_incidents = min(1.0, incident_count / 10.0) # Scale compared to high-crime baseline
        area_risk_score = round((normalized_incidents * 0.4 + vuln_index * 0.6) * 10, 1)

        # Recidivism risk scale (districts with higher vulnerability have higher recidivism drivers)
        recidivism_risk = round(baseline_recidivism * (1 + vuln_index * 0.5), 2)

        demographics = {
            "target_district": district,
            "recorded_incidents": incident_count,
            "vulnerability_index": vuln_index,
            "state_average_recidivism": baseline_recidivism
        }

        # 4. Prompt LLM to write a sociological crime-driver assessment
        prompt = (
            f"You are a criminal sociologist. Write a 150-word professional sociological assessment "
            f"on the crime drivers in the '{district}' district based on the following metrics:\n\n"
            f"District: {district}\n"
            f"Recorded Incidents: {incident_count}\n"
            f"Vulnerability Index: {vuln_index} (Scale 0-1)\n"
            f"Recidivism Risk: {recidivism_risk * 100}%\n\n"
            f"Analyze how urban density, economic factors, and local community infrastructure are "
            f"influencing these numbers. Highlight actionable preventive and community-oriented interventions."
        )

        sociological_analysis = call_llm(prompt)

        return AgentOutput(
            data={
                "demographics": demographics,
                "area_risk_score": area_risk_score,
                "recidivism_risk": recidivism_risk,
                "analysis": sociological_analysis
            },
            chunks=all_retrieved_chunks
        )
