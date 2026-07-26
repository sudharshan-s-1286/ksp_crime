import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever
from backend.rag.graph_retriever import GraphRetriever
from backend.rag.vector_retriever import VectorRetriever
from backend.config.settings import call_llm

logger = logging.getLogger("ProfilingAgent")

class ProfilingAgent(BaseAgent):
    """
    Agent that builds a comprehensive criminal profile for target individuals,
    aggregating data from SQL (FIRs, locations) and Graph (co-accused networks),
    and generating a professional offender narrative report.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()
        self.graph_retriever = GraphRetriever()
        self.vector_retriever = VectorRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        person_names = message.entities.get("person_names", [])
        if not person_names and message.entity_id:
            # Fallback to entity_id if person_names is not specified
            person_names = [message.entity_id]
            
        if not person_names:
            return AgentOutput(
                data={
                    "profile_fields": {},
                    "narrative_profile": "",
                    "risk_indicators": []
                },
                chunks=[]
            )

        all_retrieved_chunks = []
        all_firs = []
        
        # 1. Fetch FIR records from SQL for each person
        for person in person_names:
            sql_query = "SELECT * FROM firs WHERE LOWER(suspect_name) = LOWER(?)"
            chunks = self.sql_retriever.retrieve(sql_query, (person,))
            all_retrieved_chunks.extend(chunks)
            for chunk in chunks:
                all_firs.append(chunk["data"])

        # 2. Fetch co-accused network from Graph
        graph_chunks = self.graph_retriever.retrieve(person_names)
        all_retrieved_chunks.extend(graph_chunks)

        # 2b. Fetch supplementary intelligence from Vector store
        for person in person_names:
            vector_chunks = self.vector_retriever.retrieve(person, k=2)
            all_retrieved_chunks.extend(vector_chunks)

        network_data = {}
        if graph_chunks:
            network_data = graph_chunks[0]["data"]

        # 3. Compute profile fields
        total_firs = len(all_firs)
        crime_types = sorted(list(set(fir["crime_type"] for fir in all_firs)))
        active_districts = sorted(list(set(fir["district"] for fir in all_firs)))
        
        # Date range of criminal activity
        dates = [fir["occurrence_date"] for fir in all_firs if fir.get("occurrence_date")]
        if dates:
            dates.sort()
            date_range = f"{dates[0]} to {dates[-1]}"
        else:
            date_range = "N/A"
            
        # Number of co-accused links
        co_accused_links = len(network_data.get("edges", []))
        
        # Repeat offence flag (>2 of same crime type)
        crime_type_counts = {}
        for fir in all_firs:
            ct = fir["crime_type"]
            crime_type_counts[ct] = crime_type_counts.get(ct, 0) + 1
        
        repeat_offence = any(count > 2 for count in crime_type_counts.values())
        
        # Modus operandi summary
        mo_list = [fir["modus_operandi"] for fir in all_firs if fir.get("modus_operandi")]
        mo_summary = "; ".join(sorted(list(set(mo_list)))) if mo_list else "No recorded MO details."

        profile_fields = {
            "target_persons": person_names,
            "total_firs": total_firs,
            "crime_types": crime_types,
            "active_districts": active_districts,
            "date_range": date_range,
            "co_accused_links": co_accused_links,
            "repeat_offence_flag": repeat_offence,
            "modus_operandi_summary": mo_summary
        }

        # 4. Compile prompt and call LLM for narrative offender profile
        prompt = (
            f"You are a professional criminal intelligence analyst. Write a 200-word professional offender profile "
            f"in the style of a police intelligence report based on the following synthesized data:\n\n"
            f"Target Suspect(s): {', '.join(person_names)}\n"
            f"Total FIRs: {total_firs}\n"
            f"Crime Types: {', '.join(crime_types)}\n"
            f"Active Districts: {', '.join(active_districts)}\n"
            f"Date Range: {date_range}\n"
            f"Co-accused Network Size: {co_accused_links} active links\n"
            f"Repeat Offender: {'Yes' if repeat_offence else 'No'}\n"
            f"Modus Operandi Details: {mo_summary}\n\n"
            f"The narrative must be highly objective, structured, and contain actionable investigative insights. "
            f"Do not include any placeholders. Ensure the tone is formal and suitable for law enforcement officials."
        )
        
        narrative_profile = call_llm(prompt)

        # 5. Formulate risk indicators
        risk_indicators = []
        if total_firs > 2:
            risk_indicators.append("High Recidivism Risk (Multiple active FIRs)")
        if len(active_districts) > 1:
            risk_indicators.append("Multi-Jurisdictional Operator (Active in multiple districts)")
        if repeat_offence:
            risk_indicators.append("Specialized Offender (Repeat offense of identical crime type)")
        if co_accused_links > 2:
            risk_indicators.append("Syndicate Connected (Highly active network relations)")

        return AgentOutput(
            data={
                "profile_fields": profile_fields,
                "narrative_profile": narrative_profile,
                "risk_indicators": risk_indicators
            },
            chunks=all_retrieved_chunks
        )
