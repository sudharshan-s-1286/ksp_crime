"""
db/faiss_client.py
Singleton FAISS vector index client for semantic similarity search.
Used by agents that retrieve embedded documents, case summaries, or profiles.
"""

import json
import logging
import os
from typing import Any, Dict, List

import faiss
import numpy as np
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class FAISSClient:
    """
    Singleton wrapper around a FAISS index and its associated metadata.

    Loads the index and metadata once at startup and exposes a simple
    search() interface. All agents import the module-level `faiss_client`
    rather than instantiating this class directly.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        index_path = os.getenv("FAISS_INDEX_PATH")
        metadata_path = os.getenv("FAISS_METADATA_PATH")

        if not index_path or not metadata_path:
            raise EnvironmentError(
                "FAISS_INDEX_PATH and FAISS_METADATA_PATH environment variables must be set."
            )

        try:
            self._index = faiss.read_index(index_path)
            logger.info(
                f"FAISSClient: Index loaded from {index_path}. "
                f"Dimension={self._index.d}, Total vectors={self._index.ntotal}."
            )
        except Exception as e:
            logger.error(f"FAISSClient: Failed to load FAISS index: {e}", exc_info=True)
            raise

        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                raw_metadata = json.load(f)
            # Store keyed by integer ID for O(1) lookup during search
            self._metadata: Dict[int, Any] = {int(k): v for k, v in raw_metadata.items()}
            logger.info(f"FAISSClient: Metadata loaded. {len(self._metadata)} entries.")
        except Exception as e:
            logger.error(f"FAISSClient: Failed to load metadata: {e}", exc_info=True)
            raise

    def search(self, query_vector: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search the FAISS index for the top_k most similar vectors.

        Args:
            query_vector: 1-D numpy array of floats with dimension == index.d.
            top_k: Number of nearest neighbours to return.

        Returns:
            List of dicts, each with keys:
                - 'id'       (int): The FAISS internal vector ID.
                - 'score'    (float): L2 or inner-product distance score.
                - 'metadata' (dict): Associated metadata for this vector.
        """
        try:
            # FAISS expects shape (n_queries, d)
            query = query_vector.astype(np.float32).reshape(1, -1)
            scores, ids = self._index.search(query, top_k)

            results = []
            for score, vec_id in zip(scores[0], ids[0]):
                if vec_id == -1:
                    # FAISS returns -1 when fewer than top_k results exist
                    continue
                results.append({
                    "id": int(vec_id),
                    "score": float(score),
                    "metadata": self._metadata.get(int(vec_id), {})
                })
            return results
        except Exception as e:
            logger.error(f"FAISSClient.search failed: {e}", exc_info=True)
            raise

    def get_dimension(self) -> int:
        """
        Return the vector dimension of the loaded index.

        Returns:
            Integer dimension (e.g. 768 for BERT, 1536 for Ada-002).
        """
        return self._index.d

    def health_check(self) -> bool:
        """
        Verify the FAISS index is loaded and accessible.

        Returns:
            True if index is loaded and has at least 1 vector, False otherwise.
        """
        try:
            return self._index is not None and self._index.ntotal >= 0
        except Exception as e:
            logger.error(f"FAISSClient.health_check failed: {e}", exc_info=True)
            return False


# ── Module-level singleton ─────────────────────────────────────────────────────
# All agents import this directly:  from db.faiss_client import faiss_client
faiss_client = FAISSClient()
