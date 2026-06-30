import logging
from typing import List, Dict, Any
from backend.agents.base_agent import BaseAgent
from backend.contracts.agent_schemas import AgentInput, AgentOutput
from backend.rag.sql_retriever import SQLRetriever

logger = logging.getLogger("CrimeQueryAgent")

class CrimeQueryAgent(BaseAgent):
    """
    Agent that executes relational database queries to ingest case files,
    incident records, and legal statuses matching the query parameters.
    """
    def __init__(self, name: str = None):
        super().__init__(name)
        self.sql_retriever = SQLRetriever()

    def _execute(self, message: AgentInput) -> AgentOutput:
        query = message.query.lower()
        logger.info(f"Querying database for case records matching: '{message.query}'")

        # Select matching crime records based on keywords
        sql_query = "SELECT * FROM firs"
        params = ()
        
        # Simple semantic filtering for demo/testing
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

        # Generate summary
        if firs:
            summary = f"Retrieved {len(firs)} active case records matching your query criteria."
        else:
            summary = "No matching case records found in the relational database."

        return AgentOutput(
            data={
                "firs": firs,
                "summary": summary
            },
            chunks=sql_chunks
        )
