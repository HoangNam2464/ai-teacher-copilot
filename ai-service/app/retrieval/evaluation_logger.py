"""
Re-export of RAG Retrieval Quality Metrics Logger [BE-033].
Enables access from app.retrieval.evaluation_logger and app.evaluation.evaluation_logger.
"""

from app.evaluation.evaluation_logger import (
    ChunkTrace,
    EvaluationLogger,
    RetrievalMetricsSummary,
    RetrievalQualityMetric,
    compute_query_hash,
    evaluation_logger,
    sanitize_query_text,
)

__all__ = [
    "ChunkTrace",
    "EvaluationLogger",
    "RetrievalMetricsSummary",
    "RetrievalQualityMetric",
    "compute_query_hash",
    "evaluation_logger",
    "sanitize_query_text",
]
