import logging
import math
from collections import Counter
from typing import List, Dict, Any
from backend.db.faiss_client import FaissClient

logger = logging.getLogger("VectorRetriever")

class VectorRetriever:
    """
    RAG retriever that queries a FAISS vector index of criminal records,
    intelligence briefs, and offender profiles.
    """
    _client_instance = None

    def __init__(self, index_path: str = "backend/db/faiss_index"):
        # Merged from Pratheeka branch: Setup TF-IDF index structures
        self.tfidf_index = []
        self.idf = {}
        self.vocab = set()

        if VectorRetriever._client_instance is None:
            VectorRetriever._client_instance = FaissClient(index_path=index_path)
            self.client = VectorRetriever._client_instance
            # Self-seed if the index is empty
            if not VectorRetriever._client_instance.documents:
                self._seed_sample_data()
        else:
            self.client = VectorRetriever._client_instance

        self._build_tfidf_index()

    def _tokenize(self, text: str) -> List[str]:
        # Merged from Pratheeka branch: text tokenization
        return text.lower().replace(".", "").replace(",", "").split()

    def _build_tfidf_index(self):
        # Merged from Pratheeka branch: build index and compute IDF
        docs = self.client.documents if hasattr(self.client, 'documents') else []
        if not docs:
            return
            
        N = len(docs)
        doc_freqs = Counter()
        self.tfidf_index = []
        
        for doc in docs:
            tokens = self._tokenize(doc.get("text", ""))
            tf = Counter(tokens)
            self.tfidf_index.append({"id": doc.get("id"), "tf": tf, "doc": doc})
            for token in set(tokens):
                doc_freqs[token] += 1
                self.vocab.add(token)
                
        self.idf = {token: math.log(N / (df + 1)) for token, df in doc_freqs.items()}

    def _compute_cosine_similarity(self, query: str, k: int) -> List[Dict[str, Any]]:
        # Merged from Pratheeka branch: compute cosine similarity
        query_tokens = self._tokenize(query)
        query_tf = Counter(query_tokens)
        
        scores = []
        for item in self.tfidf_index:
            doc_tf = item["tf"]
            score = 0.0
            for token in query_tokens:
                if token in self.idf:
                    q_weight = query_tf[token] * self.idf[token]
                    d_weight = doc_tf.get(token, 0) * self.idf[token]
                    score += q_weight * d_weight
            scores.append((score, item["doc"]))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        return scores[:k]

    def _seed_sample_data(self):
        """
        Seeds the FAISS index with realistic law enforcement intelligence briefs.
        """
        logger.info("Vector index is empty. Seeding with mock intelligence records.")
        sample_docs = [
            {
                "id": "doc_001",
                "title": "Intelligence Briefing: Ramesh Kumar",
                "text": (
                    "Ramesh Kumar is a prominent organizer of illicit financial operations "
                    "in Bangalore Central. He is suspected of runnning a hawala network "
                    "routing black market funds through multiple front companies in the "
                    "textile sector. Known links to local property syndicates and smuggling hubs. "
                    "Operates under the alias 'Ramesh Anna'."
                ),
                "metadata": {"suspect_name": "Ramesh Kumar", "category": "financial_crime", "district": "Bangalore Central"}
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
                "metadata": {"suspect_name": "Suresh Patil", "category": "burglary", "district": "Mysore"}
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
                "metadata": {"suspect_name": "Suresh Patil", "category": "smuggling", "district": "Mangalore"}
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
                "metadata": {"category": "sociological_profile", "district": "Shivajinagar"}
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
                "metadata": {"suspect_name": "Dinesh Gowda", "category": "extortion", "district": "Bangalore East"}
            }
        ]
        self.client.add_documents(sample_docs)
        self._build_tfidf_index()

    def retrieve(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves the top k document chunks relevant to the query.
        Converts the FAISS search results to a list of structured source chunks.
        """
        results = self.client.search(query, k=k)
        retrieved_chunks = []
        
        # Merged from Pratheeka branch: Use TF-IDF ranking if FAISS results are empty or as an ensemble
        if not results and self.tfidf_index:
            tfidf_results = self._compute_cosine_similarity(query, k)
            results = [{"score": score, **doc} for score, doc in tfidf_results if score > 0]
            
        for doc in results:
            retrieved_chunks.append({
                "source": "vector_retriever",
                "doc_id": doc.get("id"),
                "title": doc.get("title"),
                "text": doc.get("text"),
                "metadata": doc.get("metadata", {}),
                "similarity_score": doc.get("score", 0.0)
            })
        return retrieved_chunks
