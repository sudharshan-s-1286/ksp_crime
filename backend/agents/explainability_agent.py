import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.config.settings import call_llm

logger = logging.getLogger("ExplainabilityAgent")

class ExplainabilityAgent(BaseAgent):
    """
    Explainability agent that maps pipeline conclusions back to specific retrieved
    source chunks, providing transparent citations and justifications.
    Citations are generated dynamically from actual upstream retriever outputs.
    """
    def __init__(self, name: str = None):
        super().__init__(name)

    def _execute(self, message: AgentInput) -> AgentOutput:
        agent_results = message.agent_results
        retrieved_chunks = message.context.get("retrieved_chunks", [])
        logger.info("Executing explainability and source attribution audit.")

        citations = []

        # 1. Attribute SQL/FIR sources dynamically from profiling and crime_query agent results
        profiling_res = agent_results.get("profiling_agent", {})
        crime_query_res = agent_results.get("crime_query_agent", {})
        
        sql_fir_ids = []
        if profiling_res and profiling_res.get("status") != "error":
            fields = profiling_res.get("profile_fields", {})
            target_persons = fields.get("target_persons", [])
            if target_persons:
                person = target_persons[0]
                total_firs = fields.get("total_firs", 0)
                if total_firs > 0:
                    sql_fir_ids.append(f"{total_firs} FIR(s) for {person}")
        
        if crime_query_res and crime_query_res.get("status") != "error":
            firs = crime_query_res.get("firs", [])
            for fir in firs[:5]:
                fir_id = fir.get("fir_id", "UNKNOWN")
                suspect = fir.get("suspect_name", "Unknown")
                sql_fir_ids.append(f"{fir_id} ({suspect})")

        if sql_fir_ids:
            citations.append({
                "source_type": "Relational Database (SQLite)",
                "reference_id": ", ".join(sql_fir_ids[:5]),
                "claim_attributed": "Case records, suspect histories, and crime classifications retrieved from the relational database."
            })

        # 2. Attribute Graph/Network sources dynamically from network agent results
        network_res = agent_results.get("network_agent", {})
        if network_res and network_res.get("status") != "error":
            edges = network_res.get("edges", [])
            nodes = network_res.get("nodes", [])
            if edges or nodes:
                edge_ids = [e.get("case_ids", [])[0] if e.get("case_ids") else f"edge-{i}" for i, e in enumerate(edges[:5])]
                citations.append({
                    "source_type": "Entity Graph Database (Neo4j)",
                    "reference_id": f"{len(nodes)} nodes, {len(edges)} edges" + (f" (Cases: {', '.join(edge_ids)})" if edge_ids else ""),
                    "claim_attributed": "Co-accused associations, syndicate structures, and suspect network linkages retrieved from the graph database."
                })

        # 3. Attribute Vector/FAISS sources dynamically from retrieved chunks
        vector_chunks = [c for c in retrieved_chunks if c.get("source") == "vector_retriever"]
        if vector_chunks:
            doc_ids = [c.get("doc_id", c.get("title", "unknown")) for c in vector_chunks[:5]]
            citations.append({
                "source_type": "Vector Search Index (FAISS)",
                "reference_id": ", ".join(doc_ids),
                "claim_attributed": "Semantic intelligence briefings and offender profiles retrieved via vector similarity search."
            })

        # 4. Attribute Analytics sources dynamically from analytics agent results
        analytics_res = agent_results.get("analytics_agent", {})
        if analytics_res and analytics_res.get("status") != "error":
            metrics = analytics_res.get("metrics", {})
            hotspots = analytics_res.get("hotspots", [])
            refs = []
            if hotspots:
                refs.append(f"{len(hotspots)} hotspot(s)")
            if metrics.get("district_crime_rates"):
                refs.append(f"{len(metrics['district_crime_rates'])} district rate(s)")
            if refs:
                citations.append({
                    "source_type": "Analytics Data Warehouse",
                    "reference_id": ", ".join(refs),
                    "claim_attributed": "Pre-computed crime trends, seasonal indices, and district vulnerability scores retrieved from the analytics repository."
                })

        # 5. Prompt LLM to write an explainability justification using actual citations
        prompt = (
            f"You are the Director of Transparency and Audit for a police intelligence division. "
            f"Write a 150-word plain-English explainability report justifying the system's conclusions "
            f"using these dynamically generated source citations:\n\n"
            f"Attributed Citations: {citations}\n"
            f"Upstream Agent Metrics: {list(agent_results.keys())}\n\n"
            f"Explain why the system flagged these risks, how the data sources validate the conclusions, "
            f"and why the recommendations are legally sound based on these documented records. "
            f"If evidence is missing for a claim, explicitly state that it is unsupported. Do not use placeholders."
        )

        explanations_text = call_llm(prompt)

        return AgentOutput(
            data={
                "explanations": explanations_text,
                "citations": citations
            },
            chunks=[]
        )
