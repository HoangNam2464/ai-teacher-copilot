"""
Retrieval routes — vector search with metadata filtering.
Used by generation endpoints to fetch relevant document chunks.
"""

from fastapi import APIRouter, Depends

from app.core.security import verify_api_key

router = APIRouter()


@router.post("/search")
async def search_chunks(
    query: str,
    workspace_id: str,
    subject: str | None = None,
    grade_level: str | None = None,
    topic: str | None = None,
    top_k: int = 10,
    _api_key: str = Depends(verify_api_key),
):
    """
    Retrieve relevant document chunks via vector similarity search
    with optional metadata filtering.

    TODO: Implement in Phase 5 (RAG + Lesson Planner)
    - Embed the query
    - Metadata filtering (workspace, subject, grade, topic)
    - pgvector cosine similarity search
    - Return top-K chunks with scores
    """
    return {
        "status": "accepted",
        "query": query,
        "workspace_id": workspace_id,
        "chunks": [],
        "message": "Retrieval endpoint — implementation in Phase 5",
    }
