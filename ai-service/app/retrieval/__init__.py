"""
Retrieval package for AI Teacher Copilot.
Provides vector similarity search with strict workspace isolation.
"""

from app.retrieval.schemas import RetrievalRequest, RetrievalResponse, RetrievedChunk
from app.retrieval.service import search_similar_chunks

__all__ = [
    "search_similar_chunks",
    "RetrievalRequest",
    "RetrievedChunk",
    "RetrievalResponse",
]
