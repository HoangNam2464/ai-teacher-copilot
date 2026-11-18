"""
RAG Retrieval Quality Metrics Logger [BE-033].

Provides structured evaluation telemetry, query & top-k result traceability,
sensitive PII masking, and metric aggregation for RAG retrieval benchmarking.

Acceptance Criteria:
1. Retrieval metrics recorded: Cosine similarity, latency_ms, chunk counts.
2. Query and Top-K results traceable via trace_id and chunk provenance metadata.
3. Sensitive information redacted (emails, phone numbers, credentials, PII masked; raw text omitted).
4. Aggregated benchmark metrics calculation (P50, P90, P95 latency, mean similarity, insufficient evidence rate).
"""

from collections import deque
from datetime import datetime, timezone
import hashlib
import math
import re
import threading
from typing import Any, Dict, List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field
import structlog

logger = structlog.get_logger("retrieval.evaluation")


# ==============================================================================
# Pydantic Schemas for Evaluation Telemetry
# ==============================================================================

class ChunkTrace(BaseModel):
    """Traceable provenance details for a retrieved document chunk."""
    model_config = ConfigDict(from_attributes=True)

    chunk_id: str = Field(..., description="UUID string of the document chunk")
    document_id: str = Field(..., description="Parent document UUID string")
    source_page: Optional[int] = Field(default=None, description="Page number in source document")
    chunk_index: int = Field(..., description="Index of chunk within parent document")
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")


class RetrievalQualityMetric(BaseModel):
    """Structured telemetry record for a single RAG retrieval execution."""
    model_config = ConfigDict(from_attributes=True)

    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique trace identifier")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of retrieval execution",
    )
    workspace_id: str = Field(..., description="Workspace UUID for multi-tenant isolation tracking")
    query_hash: str = Field(..., description="SHA-256 hash of query string for deduplication & auditing")
    query_preview: str = Field(..., description="Sanitized, truncated query preview with PII redacted")
    query_length: int = Field(..., description="Length of query string in characters")
    latency_ms: float = Field(..., description="End-to-end retrieval latency in milliseconds")
    top_k: int = Field(..., description="Requested top-k chunk count")
    similarity_threshold: float = Field(..., description="Configured minimum cosine similarity threshold")
    raw_matches_count: int = Field(..., description="Total candidate chunk rows retrieved from pgvector")
    relevant_chunks_count: int = Field(..., description="Number of chunks meeting or exceeding similarity threshold")
    top_similarity_score: float = Field(..., description="Highest cosine similarity score among results")
    avg_similarity_score: float = Field(..., description="Average cosine similarity score among relevant chunks")
    min_similarity_score: float = Field(..., description="Lowest cosine similarity score among relevant chunks")
    insufficient_evidence: bool = Field(..., description="True if no chunks met similarity threshold")
    filters_applied: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata filters applied (subject, grade_level, topic, document_ids_count)",
    )
    top_k_results: List[ChunkTrace] = Field(
        default_factory=list,
        description="Provenance traces of top-k retrieved chunks",
    )


class RetrievalMetricsSummary(BaseModel):
    """Aggregated benchmark metrics summary across multiple retrieval queries."""
    model_config = ConfigDict(from_attributes=True)

    total_queries: int = Field(..., description="Total number of evaluated retrieval queries")
    avg_latency_ms: float = Field(..., description="Mean latency across all queries in milliseconds")
    min_latency_ms: float = Field(..., description="Minimum recorded latency in milliseconds")
    max_latency_ms: float = Field(..., description="Maximum recorded latency in milliseconds")
    p50_latency_ms: float = Field(..., description="50th percentile (median) latency in milliseconds")
    p90_latency_ms: float = Field(..., description="90th percentile latency in milliseconds")
    p95_latency_ms: float = Field(..., description="95th percentile latency in milliseconds")
    avg_similarity_score: float = Field(..., description="Mean top cosine similarity score across queries")
    min_similarity_score: float = Field(..., description="Minimum recorded similarity score")
    max_similarity_score: float = Field(..., description="Maximum recorded similarity score")
    insufficient_evidence_count: int = Field(..., description="Number of queries resulting in insufficient evidence")
    insufficient_evidence_rate: float = Field(..., description="Percentage of queries with insufficient evidence")
    avg_chunks_per_query: float = Field(..., description="Average relevant chunks retrieved per query")
    total_chunks_retrieved: int = Field(..., description="Total count of relevant chunks returned")
    time_range_start: Optional[str] = Field(default=None, description="Earliest query timestamp in sample")
    time_range_end: Optional[str] = Field(default=None, description="Latest query timestamp in sample")


# ==============================================================================
# Sensitive Information Masking & PII Redaction
# ==============================================================================

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(?:\+?84|0)(?:3|5|7|8|9)\d{8}\b")
BEARER_AUTH_REGEX = re.compile(r"(?i)(bearer|token|apikey|password|secret)[\s:=]+[\w\-.]+")
NUMERIC_ID_REGEX = re.compile(r"\b\d{9,12}\b")  # Citizen ID / student ID pattern


def sanitize_query_text(query: str, max_length: int = 100) -> str:
    """
    Sanitize and redact sensitive information from query text.
    Ensures metrics never log PII, credentials, or student identifiers.
    """
    if not query:
        return ""

    sanitized = query.strip()
    sanitized = EMAIL_REGEX.sub("[EMAIL_REDACTED]", sanitized)
    sanitized = PHONE_REGEX.sub("[PHONE_REDACTED]", sanitized)
    sanitized = BEARER_AUTH_REGEX.sub(r"\1 [CREDENTIAL_REDACTED]", sanitized)
    sanitized = NUMERIC_ID_REGEX.sub("[ID_REDACTED]", sanitized)

    # Truncate to prevent accidental bulk context exposure
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length].rstrip() + "..."

    return sanitized


def compute_query_hash(query: str) -> str:
    """Compute SHA-256 hash for query auditing without storing raw sensitive text."""
    if not query:
        return ""
    return hashlib.sha256(query.strip().encode("utf-8")).hexdigest()


# ==============================================================================
# Evaluation Logger Implementation
# ==============================================================================

class EvaluationLogger:
    """
    Thread-safe collector for RAG retrieval quality metrics.
    Maintains an in-memory ring-buffer for benchmarking and emits structured logs.
    """

    def __init__(self, max_buffer_size: int = 5000):
        self._max_buffer_size = max_buffer_size
        self._buffer: deque[RetrievalQualityMetric] = deque(maxlen=max_buffer_size)
        self._lock = threading.Lock()

    def log_retrieval(
        self,
        query: str,
        workspace_id: Union[uuid.UUID, str],
        latency_ms: float,
        top_k: int,
        similarity_threshold: float,
        raw_matches_count: int,
        retrieved_chunks: List[Any],
        insufficient_evidence: bool,
        filters_applied: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ) -> RetrievalQualityMetric:
        """
        Record retrieval evaluation metrics for a single query execution.

        Args:
            query: User search query.
            workspace_id: Workspace UUID.
            latency_ms: Retrieval latency in milliseconds.
            top_k: Requested top_k chunks.
            similarity_threshold: Cosine similarity cutoff.
            raw_matches_count: Raw database candidates found.
            retrieved_chunks: List of RetrievedChunk objects.
            insufficient_evidence: Boolean flag.
            filters_applied: Dictionary of applied query filters.
            trace_id: Optional trace UUID string.

        Returns:
            The generated RetrievalQualityMetric object.
        """
        w_id = str(workspace_id)
        t_id = trace_id or str(uuid.uuid4())
        q_len = len(query) if query else 0
        q_hash = compute_query_hash(query)
        q_preview = sanitize_query_text(query)

        # Extract chunk scores and provenance traces
        chunk_traces: List[ChunkTrace] = []
        scores: List[float] = []

        for chunk in retrieved_chunks:
            # Supports both Pydantic models and dict objects
            c_id = str(getattr(chunk, "id", None) or chunk.get("id", ""))
            d_id = str(getattr(chunk, "document_id", None) or chunk.get("document_id", ""))
            s_page = getattr(chunk, "source_page", None) if hasattr(chunk, "source_page") else chunk.get("source_page")
            c_idx = getattr(chunk, "chunk_index", 0) if hasattr(chunk, "chunk_index") else chunk.get("chunk_index", 0)
            score = float(getattr(chunk, "similarity_score", 0.0) if hasattr(chunk, "similarity_score") else chunk.get("similarity_score", 0.0))

            scores.append(score)
            chunk_traces.append(
                ChunkTrace(
                    chunk_id=c_id,
                    document_id=d_id,
                    source_page=s_page,
                    chunk_index=c_idx,
                    similarity_score=score,
                )
            )

        top_score = round(max(scores), 4) if scores else 0.0
        min_score = round(min(scores), 4) if scores else 0.0
        avg_score = round(sum(scores) / len(scores), 4) if scores else 0.0

        metric = RetrievalQualityMetric(
            trace_id=t_id,
            workspace_id=w_id,
            query_hash=q_hash,
            query_preview=q_preview,
            query_length=q_len,
            latency_ms=round(float(latency_ms), 2),
            top_k=int(top_k),
            similarity_threshold=round(float(similarity_threshold), 4),
            raw_matches_count=int(raw_matches_count),
            relevant_chunks_count=len(retrieved_chunks),
            top_similarity_score=top_score,
            avg_similarity_score=avg_score,
            min_similarity_score=min_score,
            insufficient_evidence=bool(insufficient_evidence),
            filters_applied=filters_applied or {},
            top_k_results=chunk_traces,
        )

        with self._lock:
            self._buffer.append(metric)

        # Emit structured log via structlog
        logger.info(
            "rag_retrieval_quality_metric",
            trace_id=metric.trace_id,
            workspace_id=metric.workspace_id,
            query_hash=metric.query_hash,
            query_length=metric.query_length,
            latency_ms=metric.latency_ms,
            top_k=metric.top_k,
            relevant_chunks=metric.relevant_chunks_count,
            top_similarity_score=metric.top_similarity_score,
            insufficient_evidence=metric.insufficient_evidence,
        )

        return metric

    def get_metrics(
        self,
        workspace_id: Optional[Union[uuid.UUID, str]] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[RetrievalQualityMetric]:
        """Retrieve recent evaluation metrics filtered by workspace."""
        target_ws = str(workspace_id) if workspace_id else None

        with self._lock:
            records = list(self._buffer)

        if target_ws:
            records = [r for r in records if r.workspace_id == target_ws]

        # Order descending by timestamp (newest first)
        records.reverse()
        return records[offset : offset + limit]

    def get_metrics_summary(
        self,
        workspace_id: Optional[Union[uuid.UUID, str]] = None,
    ) -> RetrievalMetricsSummary:
        """
        Aggregate benchmark metrics across recorded retrieval queries.
        Computes latency percentiles (P50, P90, P95), mean similarity, and insufficient evidence rate.
        """
        target_ws = str(workspace_id) if workspace_id else None

        with self._lock:
            records = [r for r in self._buffer if not target_ws or r.workspace_id == target_ws]

        total = len(records)
        if total == 0:
            return RetrievalMetricsSummary(
                total_queries=0,
                avg_latency_ms=0.0,
                min_latency_ms=0.0,
                max_latency_ms=0.0,
                p50_latency_ms=0.0,
                p90_latency_ms=0.0,
                p95_latency_ms=0.0,
                avg_similarity_score=0.0,
                min_similarity_score=0.0,
                max_similarity_score=0.0,
                insufficient_evidence_count=0,
                insufficient_evidence_rate=0.0,
                avg_chunks_per_query=0.0,
                total_chunks_retrieved=0,
                time_range_start=None,
                time_range_end=None,
            )

        latencies = sorted(r.latency_ms for r in records)
        top_scores = [r.top_similarity_score for r in records if r.relevant_chunks_count > 0]
        insufficient_count = sum(1 for r in records if r.insufficient_evidence)
        total_chunks = sum(r.relevant_chunks_count for r in records)

        def _percentile(data: List[float], p: float) -> float:
            if not data:
                return 0.0
            k = (len(data) - 1) * p
            f = math.floor(k)
            c = math.ceil(k)
            if f == c:
                return data[int(k)]
            d0 = data[int(f)] * (c - k)
            d1 = data[int(c)] * (k - f)
            return round(d0 + d1, 2)

        p50 = _percentile(latencies, 0.50)
        p90 = _percentile(latencies, 0.90)
        p95 = _percentile(latencies, 0.95)

        avg_lat = round(sum(latencies) / total, 2)
        min_lat = round(latencies[0], 2)
        max_lat = round(latencies[-1], 2)

        avg_sim = round(sum(top_scores) / len(top_scores), 4) if top_scores else 0.0
        min_sim = round(min(top_scores), 4) if top_scores else 0.0
        max_sim = round(max(top_scores), 4) if top_scores else 0.0

        insufficient_rate = round((insufficient_count / total) * 100.0, 2)
        avg_chunks = round(total_chunks / total, 2)

        timestamps = [r.timestamp for r in records]

        return RetrievalMetricsSummary(
            total_queries=total,
            avg_latency_ms=avg_lat,
            min_latency_ms=min_lat,
            max_latency_ms=max_lat,
            p50_latency_ms=p50,
            p90_latency_ms=p90,
            p95_latency_ms=p95,
            avg_similarity_score=avg_sim,
            min_similarity_score=min_sim,
            max_similarity_score=max_sim,
            insufficient_evidence_count=insufficient_count,
            insufficient_evidence_rate=insufficient_rate,
            avg_chunks_per_query=avg_chunks,
            total_chunks_retrieved=total_chunks,
            time_range_start=min(timestamps) if timestamps else None,
            time_range_end=max(timestamps) if timestamps else None,
        )

    def reset(self) -> None:
        """Clear all metrics from buffer (used for benchmark test resets)."""
        with self._lock:
            self._buffer.clear()

    def export_benchmark_report(self, filepath: Optional[str] = None) -> Dict[str, Any]:
        """Export benchmark summary and raw traces as JSON-compatible dictionary."""
        summary = self.get_metrics_summary()
        metrics = self.get_metrics(limit=self._max_buffer_size)

        report = {
            "title": "AI Teacher Copilot — RAG Retrieval Quality Benchmark Report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary.model_dump(),
            "query_count": len(metrics),
            "traces": [m.model_dump() for m in metrics],
        }

        if filepath:
            import json
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

        return report


# Global evaluation logger singleton
evaluation_logger = EvaluationLogger()
