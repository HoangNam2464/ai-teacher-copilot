"""
Evidence Validator & Insufficient Evidence Detection (BE-017).

Enforces Rule 7.7, Rule 9.5, and Anti-Hallucination guidelines:
1. Detects inadequate, empty, or low-similarity retrieved context.
2. Halts LLM generation to prevent fabrication / hallucination of ungrounded content.
3. Provides standardized HTTP 422 response payload with INSUFFICIENT_EVIDENCE error code.
4. Generates clear, user-friendly guidance for teachers to upload materials or adjust topics.
"""

from typing import Any, Dict, List, Optional, Union
import structlog

from app.retrieval.schemas import RetrievalResponse, RetrievedChunk

logger = structlog.get_logger()

DEFAULT_USER_FRIENDLY_MESSAGE = (
    "Không tìm thấy đủ tài liệu học tập phù hợp trong không gian làm việc (workspace) để tạo nội dung chính xác. "
    "Vui lòng tải lên thêm tài liệu giáo án / sách giáo khoa hoặc điều chỉnh từ khóa chủ đề bài học."
)


class InsufficientEvidenceError(Exception):
    """
    Raised when retrieved document context is missing, empty, or below relevance threshold.
    Halts LLM invocation to prevent ungrounded AI hallucination.
    """

    def __init__(
        self,
        message: str = DEFAULT_USER_FRIENDLY_MESSAGE,
        error_code: str = "INSUFFICIENT_EVIDENCE",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        """Format as standardized error response dictionary for HTTP 422."""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }


def validate_retrieval_evidence(
    retrieval_response: Union[RetrievalResponse, List[Any]],
    min_chunks: int = 1,
    min_similarity: float = 0.30,
    min_total_chars: int = 40,
    query: Optional[str] = None,
    workspace_id: Optional[str] = None,
    custom_message: Optional[str] = None,
) -> List[Any]:
    """
    Validate that retrieved context contains sufficient evidence for AI generation.

    Args:
        retrieval_response: RetrievalResponse instance or list of retrieved chunks.
        min_chunks: Minimum number of relevant chunks required (default 1).
        min_similarity: Minimum cosine similarity score threshold (default 0.30).
        min_total_chars: Minimum total character length of all chunks combined.
        query: Search query string for telemetry logging.
        workspace_id: Workspace identifier for telemetry logging.
        custom_message: Optional custom user-friendly error message.

    Returns:
        List of validated chunks meeting quality criteria.

    Raises:
        InsufficientEvidenceError: If evidence is absent, insufficient, or of low relevance.
    """
    # 1. Inspect retrieval response flag
    if isinstance(retrieval_response, RetrievalResponse):
        if retrieval_response.insufficient_evidence:
            logger.warn(
                "insufficient_evidence_detected",
                reason="retrieval_flag_set",
                workspace_id=workspace_id,
                query=query,
                total_retrieved=0,
            )
            raise InsufficientEvidenceError(
                message=custom_message or DEFAULT_USER_FRIENDLY_MESSAGE,
                details={
                    "reason": "NO_MATCHING_CHUNKS",
                    "workspace_id": str(workspace_id) if workspace_id else None,
                    "query": query,
                    "chunks_found": 0,
                    "min_required_chunks": min_chunks,
                    "suggestion": "Tải thêm tài liệu liên quan đến chủ đề vào workspace trước khi tạo bài giảng.",
                },
            )
        chunks = retrieval_response.chunks
    else:
        chunks = retrieval_response or []

    # 2. Check chunk count
    if not chunks or len(chunks) < min_chunks:
        logger.warn(
            "insufficient_evidence_detected",
            reason="below_minimum_chunk_count",
            workspace_id=workspace_id,
            query=query,
            chunks_found=len(chunks),
            min_required=min_chunks,
        )
        raise InsufficientEvidenceError(
            message=custom_message or DEFAULT_USER_FRIENDLY_MESSAGE,
            details={
                "reason": "INSUFFICIENT_CHUNK_COUNT",
                "workspace_id": str(workspace_id) if workspace_id else None,
                "query": query,
                "chunks_found": len(chunks),
                "min_required_chunks": min_chunks,
                "suggestion": "Tải thêm tài liệu bài giảng hoặc mở rộng phạm vi chủ đề tìm kiếm.",
            },
        )

    # 3. Check similarity scores
    top_score = 0.0
    qualifying_chunks = []
    for c in chunks:
        score = getattr(c, "similarity_score", None)
        if score is None and isinstance(c, dict):
            score = c.get("similarity_score")
        if score is not None:
            top_score = max(top_score, float(score))
            if float(score) >= min_similarity:
                qualifying_chunks.append(c)
        else:
            # If no score attribute (legacy chunk), accept chunk
            qualifying_chunks.append(c)

    if not qualifying_chunks:
        logger.warn(
            "insufficient_evidence_detected",
            reason="low_relevance_scores",
            workspace_id=workspace_id,
            query=query,
            top_score=top_score,
            min_similarity=min_similarity,
        )
        raise InsufficientEvidenceError(
            message=custom_message or (
                "Tài liệu tìm thấy có độ liên quan quá thấp đối với chủ đề này. "
                "Hệ thống từ chối tự suy diễn để bảo đảm tính chuẩn xác của giáo trình."
            ),
            details={
                "reason": "LOW_SIMILARITY_SCORE",
                "workspace_id": str(workspace_id) if workspace_id else None,
                "query": query,
                "top_similarity_score": round(top_score, 4),
                "required_threshold": min_similarity,
                "suggestion": "Kiểm tra lại tên chủ đề hoặc thêm sách giáo khoa có chương bài học tương ứng.",
            },
        )

    # 4. Check total content substance (character count)
    total_length = sum(
        len(getattr(c, "content", None) or (c.get("content") if isinstance(c, dict) else str(c)))
        for c in qualifying_chunks
    )

    if total_length < min_total_chars:
        logger.warn(
            "insufficient_evidence_detected",
            reason="context_too_short",
            workspace_id=workspace_id,
            query=query,
            total_chars=total_length,
            min_required_chars=min_total_chars,
        )
        raise InsufficientEvidenceError(
            message=custom_message or (
                "Nội dung tài liệu tham khảo quá ngắn, không cung cấp đủ chi tiết kiến thức để xây dựng bài giảng."
            ),
            details={
                "reason": "CONTEXT_TOO_BRIEF",
                "workspace_id": str(workspace_id) if workspace_id else None,
                "query": query,
                "total_characters": total_length,
                "min_required_characters": min_total_chars,
                "suggestion": "Tải lên bản tài liệu đầy đủ các mục tiêu và nội dung chi tiết.",
            },
        )

    logger.info(
        "evidence_validation_passed",
        workspace_id=workspace_id,
        query=query,
        valid_chunks_count=len(qualifying_chunks),
        top_score=top_score,
        total_chars=total_length,
    )
    return qualifying_chunks
