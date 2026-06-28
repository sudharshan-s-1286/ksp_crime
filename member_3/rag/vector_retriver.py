"""
rag/vector_retriver.py

Pure-Python Vector Retriever utilizing a lightweight TF-IDF / Cosine Similarity engine.
No external database or heavy dependency required. All outputs are JSON-serializable.
"""

from __future__ import annotations

import logging
import math
import re
from typing import Any

logger = logging.getLogger(__name__)


class VectorRetriever:
    """
    RAG retriever that queries a lightweight TF-IDF vector index of criminal records,
    intelligence briefs, and offender profiles.
    """

    def __init__(self) -> None:
        self.documents: list[dict[str, Any]] = []
        self._seed_sample_data()
        self._build_index()

    def _seed_sample_data(self) -> None:
        """Seeds the retriever with mock intelligence records."""
        self.documents = [
            {
                "id": "doc_001",
                "title": "Intelligence Briefing: Ramesh Kumar",
                "text": (
                    "Ramesh Kumar is a prominent organizer of illicit financial operations "
                    "in Bangalore Central. He is suspected of running a hawala network "
                    "routing black market funds through multiple front companies in the "
                    "textile sector. Known links to local property syndicates and smuggling hubs. "
                    "Operates under the alias 'Ramesh Anna'."
                ),
                "metadata": {
                    "suspect_name": "Ramesh Kumar",
                    "category": "financial_crime",
                    "district": "Bangalore Central",
                },
            },
            {
                "id": "doc_002",
                "title": "FIR Summary: Case 142/2025 - Suresh Patil",
                "text": (
                    "Suresh Patil, an active offender in Mysore, was arrested for a series "
                    "of high-end residential burglaries. He employs a distinctive modus operandi: "
                    "conducting surveillance on houses disguised as a cable technician during "
                    "the day, and executing burglaries between 01:00 and 04:00 using specialized "
                    "lockpicking tools. Relies heavily on a network of fencing agents in neighboring districts."
                ),
                "metadata": {
                    "suspect_name": "Suresh Patil",
                    "category": "burglary",
                    "district": "Mysore",
                },
            },
            {
                "id": "doc_003",
                "title": "Syndicate Profile: Mangalore Harbor Smuggling",
                "text": (
                    "Investigation into contraband movements at Mangalore Harbor highlights "
                    "the involvement of a tightly-knit syndicate. Key operators include Suresh Patil "
                    "and Dinesh Gowda. The network leverages bribed port officials and utilizes "
                    "modified fishing trawlers to transport undocumented cargo. Transactions are "
                    "primarily settled in cash or gold, bypassing standard banking channels."
                ),
                "metadata": {
                    "suspect_name": "Suresh Patil",
                    "category": "smuggling",
                    "district": "Mangalore",
                },
            },
            {
                "id": "doc_004",
                "title": "Sociological Area Report: Shivajinagar Hub",
                "text": (
                    "Shivajinagar district has exhibited a high crime density. The community "
                    "features high rates of juvenile unemployment and high density of temporary migrant "
                    "laborers. Recidivism rates here are 35% higher than the state average, particularly "
                    "among youth aged 18-25 involved in petty theft and narcotics distribution."
                ),
                "metadata": {"category": "sociological_profile", "district": "Shivajinagar"},
            },
            {
                "id": "doc_005",
                "title": "Intelligence Briefing: Dinesh Gowda",
                "text": (
                    "Dinesh Gowda, operating in Bangalore East, is linked to illegal sand mining "
                    "and extortion syndicates. He controls multiple local transport agencies that "
                    "move sand without valid permits. He coordinates a large gang of enforcers and "
                    "has been named in three active FIRs regarding intimidation of public officials."
                ),
                "metadata": {
                    "suspect_name": "Dinesh Gowda",
                    "category": "extortion",
                    "district": "Bangalore East",
                },
            },
        ]

    def _tokenize(self, text: str) -> list[str]:
        """Convert text into lowercase alphabetic tokens."""
        return [w.lower() for w in re.findall(r"\w+", text) if len(w) > 2]

    def _build_index(self) -> None:
        """Build inverse document frequencies for cosine similarity matching."""
        num_docs = len(self.documents)
        if num_docs == 0:
            return

        df: dict[str, int] = {}
        for doc in self.documents:
            tokens = set(self._tokenize(doc.get("text", "")))
            for word in tokens:
                df[word] = df.get(word, 0) + 1

        self.idf = {
            word: math.log(1 + num_docs / (1 + count)) for word, count in df.items()
        }

    def retrieve(self, query: str, k: int = 3) -> list[dict[str, Any]]:
        """
        Retrieves the top k document chunks relevant to the query based on cosine similarity.

        Args:
            query: User search text query.
            k: Number of documents to return.

        Returns:
            A list of dictionary records containing matched documents.
        """
        logger.info("VectorRetriever: search query='%s', k=%d", query, k)
        query_tokens = self._tokenize(query)
        if not query_tokens or not self.documents:
            # Fallback to returning top documents if no query overlap
            return [
                {
                    "source": "vector_retriever",
                    "doc_id": doc["id"],
                    "title": doc["title"],
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                    "similarity_score": 0.0,
                }
                for doc in self.documents[:k]
            ]

        # Calculate query TF-IDF vector
        from collections import Counter

        query_tf = Counter(query_tokens)
        query_vec: dict[str, float] = {}
        query_norm = 0.0
        for word, count in query_tf.items():
            if word in self.idf:
                val = count * self.idf[word]
                query_vec[word] = val
                query_norm += val * val
        query_norm = math.sqrt(query_norm)

        if query_norm == 0:
            return [
                {
                    "source": "vector_retriever",
                    "doc_id": doc["id"],
                    "title": doc["title"],
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                    "similarity_score": 0.0,
                }
                for doc in self.documents[:k]
            ]

        results = []
        for doc in self.documents:
            doc_tokens = self._tokenize(doc.get("text", ""))
            doc_tf = Counter(doc_tokens)

            dot_product = 0.0
            doc_norm = 0.0
            for word, count in doc_tf.items():
                if word in self.idf:
                    val = count * self.idf[word]
                    doc_norm += val * val
                    if word in query_vec:
                        dot_product += val * query_vec[word]

            doc_norm = math.sqrt(doc_norm)
            score = dot_product / (query_norm * doc_norm) if doc_norm > 0 else 0.0
            results.append((doc, score))

        results.sort(key=lambda x: x[1], reverse=True)

        retrieved_chunks = []
        for doc, score in results[:k]:
            retrieved_chunks.append(
                {
                    "source": "vector_retriever",
                    "doc_id": doc["id"],
                    "title": doc["title"],
                    "text": doc["text"],
                    "metadata": doc["metadata"],
                    "similarity_score": round(float(score), 4),
                }
            )

        return retrieved_chunks
