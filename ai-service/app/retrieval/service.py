"""
Retrieval Service — Vector similarity search with workspace isolation (BE-015).

Implements:
1. Query embedding generation using configured provider abstraction (768 dimensions).
2. Metadata-filtered vector similarity search on pgvector via cosine distance (<=>).
3. Strict multi-tenant workspace isolation (workspace_id filter mandatory).
4. Top-K ranking (default: 5, max: 10 per Rule 3.3).
5. Grounding metadata retention (document_id, source_page, chunk_index) for citations.
6. Explicit insufficient evidence detection when context is missing or below threshold.
7. Structured telemetry logging for retrieval evaluation metrics.
"""

from typing import List, Optional, Union
import time
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import async_session
from app.core.models import DocumentChunk
from app.evaluation.evaluation_logger import evaluation_logger
from app.providers.base import BaseAIProvider
from app.providers.factory import get_ai_provider
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk

logger = structlog.get_logger()


async def search_similar_chunks(
    query: str,
    workspace_id: Union[uuid.UUID, str],
    document_ids: Optional[List[Union[uuid.UUID, str]]] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    topic: Optional[str] = None,
    top_k: int = 5,
    similarity_threshold: float = 0.3,
    ef_search: int = 100,
    provider: Optional[BaseAIProvider] = None,
    session: Optional[AsyncSession] = None,
) -> RetrievalResponse:
    """
    Search for the most relevant document chunks for a query within a specific workspace.

    Args:
        query: Search string from teacher.
        workspace_id: Workspace UUID (mandatory for tenant isolation).
        document_ids: Optional list of document UUIDs to filter results.
        subject: Optional curriculum subject filter.
        grade_level: Optional grade level filter.
        topic: Optional pedagogical topic filter.
        top_k: Number of chunks to retrieve (1 to 10, default 5).
        similarity_threshold: Minimum cosine similarity score (0.0 to 1.0, default 0.3).
        provider: Optional AI provider instance (defaults to configured provider).
        session: Optional SQLAlchemy async session (defaults to new session).

    Returns:
        RetrievalResponse containing filtered top-k chunks and insufficient_evidence flag.
    """
    # 1. Validation & Input Sanitization
    start_time = time.perf_counter()
    if not workspace_id:
        raise ValueError("workspace_id is mandatory for workspace-isolated retrieval")

    try:
        workspace_uuid = workspace_id if isinstance(workspace_id, uuid.UUID) else uuid.UUID(str(workspace_id))
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid workspace_id UUID: {workspace_id}") from e

    clean_query = query.strip() if query else ""
    if not clean_query:
        raise ValueError("Query string cannot be empty or whitespace only")

    # Enforce Rule 3.3: top_k default 5, max 10
    bounded_top_k = min(max(int(top_k), 1), 10)
    bounded_threshold = max(0.0, min(1.0, float(similarity_threshold)))

    # 2. Embedding Generation via configured AI Provider
    active_provider = provider or get_ai_provider()
    embeddings = await active_provider.generate_embeddings([clean_query])
    if not embeddings or not embeddings[0]:
        raise ValueError("Failed to generate embedding for query")
    query_vector = embeddings[0]

    # 3. Vector Similarity Search with pgvector and Mandatory Workspace Isolation
    async def _execute_search(db_session: AsyncSession) -> RetrievalResponse:
        # Dynamically tune HNSW index exploration depth factor (BE-034)
        if ef_search:
            try:
                from sqlalchemy import text
                bounded_ef = min(max(int(ef_search), 10), 1000)
                await db_session.execute(text(f"SET hnsw.ef_search = {bounded_ef}"))
            except Exception:
                pass

        # Distance calculation via pgvector cosine distance (<=> operator)
        distance_col = DocumentChunk.embedding.cosine_distance(query_vector).label("distance")

        # Base query with STRICT workspace isolation (Rule 3.1 & 7.4)
        stmt = (
            select(DocumentChunk, distance_col)
            .filter(DocumentChunk.workspace_id == workspace_uuid)
        )

        # Optional metadata filtering
        if document_ids:
            doc_uuids = [
                d if isinstance(d, uuid.UUID) else uuid.UUID(str(d))
                for d in document_ids
            ]
            stmt = stmt.filter(DocumentChunk.document_id.in_(doc_uuids))

        if subject and subject.strip():
            stmt = stmt.filter(DocumentChunk.subject == subject.strip())

        if grade_level and grade_level.strip():
            stmt = stmt.filter(DocumentChunk.grade_level == grade_level.strip())

        if topic and topic.strip():
            stmt = stmt.filter(DocumentChunk.topic == topic.strip())

        # Order by ascending distance (closest match first)
        stmt = stmt.order_by(distance_col.asc()).limit(bounded_top_k)

        result = await db_session.execute(stmt)
        rows = result.all()

        retrieved_chunks: List[RetrievedChunk] = []
        for chunk, dist in rows:
            dist_val = float(dist) if dist is not None else 1.0
            # Convert cosine distance to cosine similarity: s = 1.0 - distance
            sim_score = round(max(0.0, min(1.0, 1.0 - dist_val)), 4)

            # Apply relevance threshold filter
            if sim_score >= bounded_threshold:
                retrieved_chunks.append(
                    RetrievedChunk(
                        id=chunk.id,
                        content=chunk.content,
                        document_id=chunk.document_id,
                        source_page=chunk.source_page,
                        chunk_index=chunk.chunk_index,
                        similarity_score=sim_score,
                        subject=chunk.subject,
                        grade_level=chunk.grade_level,
                        topic=chunk.topic,
                    )
                )

        # 4. Insufficient Evidence Detection (Rule 3.4)
        insufficient_evidence = len(retrieved_chunks) == 0

        # 5. Telemetry & Evaluation Logging (Rule 3.5 & BE-033)
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        applied_filters = {}
        if document_ids:
            applied_filters["document_ids_count"] = len(document_ids)
        if subject:
            applied_filters["subject"] = subject
        if grade_level:
            applied_filters["grade_level"] = grade_level
        if topic:
            applied_filters["topic"] = topic

        metric = evaluation_logger.log_retrieval(
            query=clean_query,
            workspace_id=workspace_uuid,
            latency_ms=latency_ms,
            top_k=bounded_top_k,
            similarity_threshold=bounded_threshold,
            raw_matches_count=len(rows),
            retrieved_chunks=retrieved_chunks,
            insufficient_evidence=insufficient_evidence,
            filters_applied=applied_filters,
        )

        return RetrievalResponse(
            chunks=retrieved_chunks,
            insufficient_evidence=insufficient_evidence,
            query=clean_query,
            total_retrieved=len(retrieved_chunks),
            trace_id=metric.trace_id,
            latency_ms=metric.latency_ms,
        )

    if session is not None:
        return await _execute_search(session)

    async with async_session() as db_session:
        return await _execute_search(db_session)
