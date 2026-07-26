import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever
from backend.rag.graph_retriever import GraphRetriever
from backend.rag.vector_retriever import VectorRetriever

logger = logging.getLogger("CrimeQueryAgent")

class CrimeQueryAgent(BaseAgent):
    """
    Agent that executes hybrid retrieval across relational, graph, and vector repositories
    to ingest case files, network associations, and semantic intelligence briefs.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()
        self.graph_retriever = GraphRetriever()
        self.vector_retriever = VectorRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        query = message.query.lower()
        person_names = message.entities.get("person_names", [])
        logger.info(f"Hybrid retrieval for: '{message.query}'")

        # 1. SQL retrieval for structured case records
        sql_query = "SELECT * FROM firs"
        params = ()
        if "burglary" in query:
            sql_query = "SELECT * FROM firs WHERE LOWER(crime_type) = ?"
            params = ("burglary",)
        elif "cyber" in query:
            sql_query = "SELECT * FROM firs WHERE LOWER(crime_type) = ?"
            params = ("cyber crime",)
        elif "extortion" in query:
            sql_query = "SELECT * FROM firs WHERE LOWER(crime_type) = ?"
            params = ("extortion",)
        elif "theft" in query:
            sql_query = "SELECT * FROM firs WHERE LOWER(crime_type) = ?"
            params = ("theft",)
        elif "assault" in query:
            sql_query = "SELECT * FROM firs WHERE LOWER(crime_type) = ?"
            params = ("assault",)

        sql_chunks = self.sql_retriever.retrieve(sql_query, params)
        firs = [chunk["data"] for chunk in sql_chunks]

        # 2. Graph retrieval when suspect names are available
        graph_chunks = []
        if person_names:
            graph_chunks = self.graph_retriever.retrieve(person_names)

        # 3. Vector retrieval for semantic intelligence enrichment (lightweight k=2)
        vector_chunks = []
        if not firs or person_names:
            vector_chunks = self.vector_retriever.retrieve(message.query, k=2)

        # Combine all chunks from hybrid retrieval
        all_chunks = sql_chunks + graph_chunks + vector_chunks

        # Generate hybrid summary
        parts = []
        if firs:
            parts.append(f"{len(firs)} SQL case record(s)")
        if graph_chunks:
            graph_data = graph_chunks[0]["data"]
            parts.append(f"{len(graph_data.get('nodes', []))} graph node(s) and {len(graph_data.get('edges', []))} edge(s)")
        if vector_chunks:
            parts.append(f"{len(vector_chunks)} vector intelligence document(s)")

        if parts:
            summary = "Hybrid retrieval complete: " + "; ".join(parts) + "."
        else:
            summary = "No matching records found across SQL, Graph, or Vector indexes."

        return AgentOutput(
            data={
                "firs": firs,
                "summary": summary
            },
            chunks=all_chunks
        )
