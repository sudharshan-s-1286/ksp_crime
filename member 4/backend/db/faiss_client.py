import os
import logging
import pickle
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("FaissClient")

# Try to import faiss and sentence-transformers
HAS_FAISS = False
try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
    HAS_FAISS = True
except ImportError:
    logger.warning("faiss-cpu or sentence-transformers not available. Falling back to Pure-Python Vector Store.")

class PurePythonVectorStore:
    """
    A lightweight, pure-Python fallback vector store that implements
    cosine similarity for text search. Ideal for offline/test environments.
    """
    def __init__(self):
        self.documents = []
        self.vocab = {}
        self.idf = {}
        
    def add_documents(self, docs: List[Dict[str, Any]]):
        self.documents = docs
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r"\w+", text) if len(w) > 2]

    def _build_index(self):
        import math
        from collections import Counter
        
        # Count document frequency
        df = Counter()
        tfs = []
        for doc in self.documents:
            tokens = self._tokenize(doc.get("text", ""))
            tf = Counter(tokens)
            tfs.append(tf)
            for word in tf.keys():
                df[word] += 1
                
        num_docs = len(self.documents)
        if num_docs == 0:
            return
            
        self.vocab = list(df.keys())
        self.idf = {word: math.log(1 + num_docs / (1 + count)) for word, count in df.items()}

    def search(self, query: str, k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        import math
        from collections import Counter
        
        query_tokens = self._tokenize(query)
        query_tf = Counter(query_tokens)
        
        # Calculate query vector
        query_vec = {}
        query_norm = 0.0
        for word, tf in query_tf.items():
            if word in self.idf:
                val = tf * self.idf[word]
                query_vec[word] = val
                query_norm += val * val
        query_norm = math.sqrt(query_norm)
        
        if query_norm == 0:
            # Return top k documents arbitrarily if query is empty/has no overlap
            return [(doc, 0.0) for doc in self.documents[:k]]
            
        results = []
        for doc in self.documents:
            doc_tokens = self._tokenize(doc.get("text", ""))
            doc_tf = Counter(doc_tokens)
            
            # Calculate doc vector and cosine similarity
            dot_product = 0.0
            doc_norm = 0.0
            for word, tf in doc_tf.items():
                if word in self.idf:
                    val = tf * self.idf[word]
                    doc_norm += val * val
                    if word in query_vec:
                        dot_product += val * query_vec[word]
            
            doc_norm = math.sqrt(doc_norm)
            if doc_norm > 0:
                score = dot_product / (query_norm * doc_norm)
            else:
                score = 0.0
            results.append((doc, score))
            
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:k]

# Import re for PurePythonVectorStore tokenization
import re

class FaissClient:
    """
    Manages a vector database index using FAISS.
    Automatically falls back to PurePythonVectorStore if dependencies are missing.
    """
    def __init__(self, index_path: str = "backend/db/faiss_index"):
        self.index_path = index_path
        self.has_faiss = HAS_FAISS
        self.model = None
        self.index = None
        self.documents = []
        
        if self.has_faiss:
            try:
                # Load a small, fast model
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer: {str(e)}. Falling back to pure Python.")
                self.has_faiss = False
                
        if not self.has_faiss:
            self.index = PurePythonVectorStore()
            
        # Load index if it exists
        self.load()

    def add_documents(self, docs: List[Dict[str, Any]]):
        """
        Adds a list of documents. Each document should be a dict containing at least a 'text' key.
        """
        self.documents.extend(docs)
        if self.has_faiss:
            texts = [doc.get("text", "") for doc in docs]
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            dimension = embeddings.shape[1]
            
            if self.index is None:
                self.index = faiss.IndexFlatIP(dimension)  # Inner Product for cosine similarity (with normalized vectors)
                
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            self.index.add(embeddings)
        else:
            self.index.add_documents(self.documents)
            
        self.save()

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches for the top k documents matching the query.
        """
        if not self.documents:
            return []
            
        if self.has_faiss and self.index is not None:
            query_embedding = self.model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_embedding)
            distances, indices = self.index.search(query_embedding, k)
            
            results = []
            for idx, dist in zip(indices[0], distances[0]):
                if idx != -1 and idx < len(self.documents):
                    doc_copy = self.documents[idx].copy()
                    doc_copy["score"] = float(dist)
                    results.append(doc_copy)
            return results
        else:
            # Pure Python Search
            fallback_results = self.index.search(query, k)
            results = []
            for doc, score in fallback_results:
                doc_copy = doc.copy()
                doc_copy["score"] = score
                results.append(doc_copy)
            return results

    def save(self):
        """
        Persists the index and documents metadata.
        """
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        try:
            # Save documents list
            with open(f"{self.index_path}_docs.pkl", "wb") as f:
                pickle.dump(self.documents, f)
                
            if self.has_faiss and self.index is not None:
                faiss.write_index(self.index, f"{self.index_path}.index")
        except Exception as e:
            logger.error(f"Error saving FAISS index: {str(e)}")

    def load(self):
        """
        Loads the index and documents metadata if they exist.
        """
        docs_path = f"{self.index_path}_docs.pkl"
        if os.path.exists(docs_path):
            try:
                with open(docs_path, "rb") as f:
                    self.documents = pickle.load(f)
                    
                if self.has_faiss:
                    idx_file = f"{self.index_path}.index"
                    if os.path.exists(idx_file):
                        self.index = faiss.read_index(idx_file)
                else:
                    self.index.add_documents(self.documents)
            except Exception as e:
                logger.error(f"Error loading FAISS index: {str(e)}")
