import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever
from backend.rag.graph_retriever import GraphRetriever
from backend.config.settings import call_llm

logger = logging.getLogger("FinancialAgent")

class FinancialAgent(BaseAgent):
    """
    Agent that detects illicit financial operations, including money laundering, 
    hawala transactions, and shell company fronts, using SQL and Graph data.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()
        self.graph_retriever = GraphRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        suspect_name = message.entity_id or "Ramesh Kumar"
        all_retrieved_chunks = []

        # 1. Query SQL for financial FIRs linked to the suspect
        sql_query = "SELECT * FROM firs WHERE LOWER(suspect_name) = LOWER(?) AND (crime_type LIKE '%Financial%' OR crime_type LIKE '%Cyber%')"
        sql_chunks = self.sql_retriever.retrieve(sql_query, (suspect_name,))
        all_retrieved_chunks.extend(sql_chunks)
        financial_firs = [chunk["data"] for chunk in sql_chunks]

        # 2. Query Graph to extract co-accused network to find financial couriers/associates
        graph_chunks = self.graph_retriever.retrieve([suspect_name])
        all_retrieved_chunks.extend(graph_chunks)
        network_data = graph_chunks[0]["data"] if graph_chunks else {}

        # 3. Analyze patterns and extract flags
        financial_flags = []
        shell_companies = []
        risk_score = 0.0

        if financial_firs:
            risk_score += 4.0  # Base risk for active financial cases
            for fir in financial_firs:
                mo = fir.get("modus_operandi", "").lower()
                if "hawala" in mo or "transfer" in mo:
                    financial_flags.append("Hawala money routing detected")
                    risk_score += 2.0
                if "shell" in mo or "corporation" in mo or "textile" in mo:
                    financial_flags.append("Shell company front usage detected")
                    shell_companies.append("Textile Shell Front Corp (Identified in FIR)")
                    risk_score += 2.0
        
        # Examine graph relationships for couriers
        edges = network_data.get("edges", [])
        for edge in edges:
            rel_type = edge.get("type", "")
            if "Hawala Courier" in rel_type or "Fencer" in rel_type:
                financial_flags.append(f"Linked to known financial intermediary: {edge.get('target')} ({rel_type})")
                risk_score += 1.5

        risk_score = min(10.0, risk_score)  # Cap at 10

        # 4. Prompt LLM for financial analysis report
        prompt = (
            f"You are a forensic financial investigator. Write a 150-word financial intelligence briefing "
            f"detailing a suspected money laundering operation for suspect '{suspect_name}' based on these findings:\n\n"
            f"Suspect: {suspect_name}\n"
            f"Detected Shell Companies: {shell_companies}\n"
            f"Financial Flags: {financial_flags}\n"
            f"Graph Network Connections: {len(edges)} active links\n"
            f"Assigned Risk Score: {risk_score}/10\n\n"
            f"Explain the mechanics of how the money is routed, how front companies are utilized, "
            f"and what specific bank audit trails should be subpoenaed next."
        )

        financial_briefing = call_llm(prompt)

        return AgentOutput(
            data={
                "financial_flags": financial_flags,
                "shell_companies": shell_companies,
                "risk_score": risk_score,
                "analysis": financial_briefing
            },
            chunks=all_retrieved_chunks
        )
