"""
Evaluation routes — RAG retrieval quality metrics, telemetry traces, and benchmark summaries [BE-033].
Exposes internal endpoints for monitoring and offline evaluation (QA-031, QA-032, QA-033).
"""

from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import verify_api_key
from app.evaluation.evaluation_logger import (
    RetrievalMetricsSummary,
    RetrievalQualityMetric,
    evaluation_logger,
)

router = APIRouter()


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Evaluation module health check",
)
async def evaluation_health(_api_key: str = Depends(verify_api_key)):
    """Health check for AI evaluation and metrics logging subsystem."""
    summary = evaluation_logger.get_metrics_summary()
    return {
        "status": "healthy",
        "service": "evaluation-metrics",
        "buffered_queries_count": summary.total_queries,
    }


@router.get(
    "/metrics/retrieval",
    response_model=List[RetrievalQualityMetric],
    status_code=status.HTTP_200_OK,
    summary="List recent retrieval quality metrics traces",
    description=(
        "Returns recent retrieval evaluation telemetry records including latency, "
        "similarity scores, and chunk provenance. All sensitive query content is sanitized."
    ),
)
async def get_retrieval_metrics(
    workspace_id: Optional[uuid.UUID] = Query(
        default=None,
        description="Optional filter by workspace UUID for tenant-isolated evaluation",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of metric traces to return",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Pagination offset",
    ),
    _api_key: str = Depends(verify_api_key),
) -> List[RetrievalQualityMetric]:
    """Retrieve filtered list of retrieval metrics."""
    try:
        return evaluation_logger.get_metrics(
            workspace_id=workspace_id,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch retrieval metrics: {str(e)}",
        )


@router.get(
    "/metrics/retrieval/summary",
    response_model=RetrievalMetricsSummary,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated RAG retrieval benchmark metrics",
    description=(
        "Returns aggregated quality metrics including latency percentiles (P50, P90, P95), "
        "mean cosine similarity score, and insufficient evidence rate."
    ),
)
async def get_retrieval_metrics_summary(
    workspace_id: Optional[uuid.UUID] = Query(
        default=None,
        description="Optional workspace UUID filter for workspace-specific summary",
    ),
    _api_key: str = Depends(verify_api_key),
) -> RetrievalMetricsSummary:
    """Compute and return aggregated benchmark summary."""
    try:
        return evaluation_logger.get_metrics_summary(workspace_id=workspace_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate retrieval metrics summary: {str(e)}",
        )


@router.post(
    "/metrics/retrieval/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset retrieval metrics buffer",
    description="Clears in-memory retrieval telemetry buffer for isolated benchmark testing.",
)
async def reset_retrieval_metrics(_api_key: str = Depends(verify_api_key)):
    """Reset evaluation metrics buffer."""
    evaluation_logger.reset()
    return {
        "status": "reset_successful",
        "message": "Retrieval metrics buffer successfully cleared",
    }
