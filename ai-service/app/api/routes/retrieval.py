"""
Retrieval routes — vector similarity search with workspace isolation (BE-015).
Used by generation endpoints and Spring Boot to fetch grounded document chunks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_api_key
from app.retrieval.schemas import RetrievalRequest, RetrievalResponse
from app.retrieval.service import search_similar_chunks

router = APIRouter()


@router.post(
    "/search",
    response_model=RetrievalResponse,
    status_code=status.HTTP_200_OK,
    summary="Vector similarity search with workspace isolation",
    description=(
        "Retrieves the top-k most relevant document chunks for a query within a teacher's workspace "
        "using pgvector cosine similarity (<=>). Automatically sets insufficient_evidence=True if "
        "no matching context meets the relevance threshold."
    ),
)
async def search_chunks(
    request: RetrievalRequest,
    db: AsyncSession = Depends(get_db),
    _api_key: str = Depends(verify_api_key),
) -> RetrievalResponse:
    """
    Execute vector similarity search across document chunks.
    Ensures strict tenant isolation through workspace_id filtering.
    """
    try:
        response = await search_similar_chunks(
            query=request.query,
            workspace_id=request.workspace_id,
            document_ids=request.document_ids,
            subject=request.subject,
            grade_level=request.grade_level,
            topic=request.topic,
            top_k=request.top_k,
            similarity_threshold=request.similarity_threshold,
            session=db,
        )
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {str(e)}",
        )
