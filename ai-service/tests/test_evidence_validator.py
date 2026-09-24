"""
Unit & Integration Tests for Insufficient Evidence Detection and Handling (BE-017).

Tests:
1. Detection of insufficient evidence (empty chunks, low similarity, brief content).
2. Halting generation to prevent AI hallucinations (LLM provider is not called).
3. HTTP 422 Unprocessable Entity status code and INSUFFICIENT_EVIDENCE error response.
4. Clear user-friendly messaging and teacher guidance.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.evidence_validator import (
    DEFAULT_USER_FRIENDLY_MESSAGE,
    InsufficientEvidenceError,
    validate_retrieval_evidence,
)
from app.generation.schemas import LessonPlan, Quiz
from app.generation.service import generate_lesson_plan_service, generate_quiz_service
from app.main import app
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


class TestEvidenceValidatorUnit:
    """Unit tests for validate_retrieval_evidence and InsufficientEvidenceError."""

    def test_raises_when_retrieval_flag_is_true(self):
        """AC1: Kích hoạt InsufficientEvidenceError khi retrieval response có cờ insufficient_evidence=True."""
        response = RetrievalResponse(
            chunks=[],
            insufficient_evidence=True,
            query="Toán 10",
            total_retrieved=0,
        )

        with pytest.raises(InsufficientEvidenceError) as exc_info:
            validate_retrieval_evidence(response, query="Toán 10", workspace_id="ws-1")

        err = exc_info.value
        assert err.error_code == "INSUFFICIENT_EVIDENCE"
        assert err.details["reason"] == "NO_MATCHING_CHUNKS"
        assert "Không tìm thấy đủ tài liệu" in err.message

    def test_raises_when_chunks_list_is_empty(self):
        """AC1: Kích hoạt lỗi khi danh sách chunk rỗng."""
        with pytest.raises(InsufficientEvidenceError) as exc_info:
            validate_retrieval_evidence([], min_chunks=1)
        assert exc_info.value.details["reason"] == "INSUFFICIENT_CHUNK_COUNT"

    def test_raises_when_scores_below_similarity_threshold(self):
        """AC1: Kích hoạt lỗi khi điểm tương đồng của mọi chunk đều dưới ngưỡng tối thiểu."""
        chunks = [
            {"chunk_id": "1", "content": "Bài đọc tổng quan", "similarity_score": 0.15},
            {"chunk_id": "2", "content": "Tài liệu môn khác", "similarity_score": 0.20},
        ]

        with pytest.raises(InsufficientEvidenceError) as exc_info:
            validate_retrieval_evidence(chunks, min_similarity=0.35)

        err = exc_info.value
        assert err.details["reason"] == "LOW_SIMILARITY_SCORE"
        assert err.details["top_similarity_score"] == 0.20
        assert err.details["required_threshold"] == 0.35

    def test_raises_when_content_substance_too_brief(self):
        """AC1: Kích hoạt lỗi khi nội dung trích xuất quá ngắn để làm bài giảng."""
        chunks = [
            {"chunk_id": "1", "content": "Tiết 1.", "similarity_score": 0.85},
        ]

        with pytest.raises(InsufficientEvidenceError) as exc_info:
            validate_retrieval_evidence(chunks, min_total_chars=50)

        err = exc_info.value
        assert err.details["reason"] == "CONTEXT_TOO_BRIEF"
        assert err.details["total_characters"] < 50

    def test_passes_when_evidence_is_sufficient(self):
        """AC1: Trả về danh sách chunk hợp lệ khi đáp ứng đủ điều kiện bằng chứng."""
        chunks = [
            RetrievedChunk(
                id=uuid.uuid4(),
                document_id=uuid.uuid4(),
                content="Nội dung bài học đầy đủ chi tiết về định lý Pythagoras trong tam giác vuông.",
                chunk_index=0,
                source_page=12,
                similarity_score=0.88,
            )
        ]
        retrieval_response = RetrievalResponse(
            chunks=chunks,
            insufficient_evidence=False,
            total_retrieved=1,
        )

        valid_chunks = validate_retrieval_evidence(retrieval_response, min_similarity=0.30)
        assert len(valid_chunks) == 1
        assert valid_chunks[0].similarity_score == 0.88


class TestAntiHallucinationGenerationHalting:
    """AC2: AI không tự bịa thông tin khi thiếu nguồn — Không gọi tới LLM."""

    @pytest.mark.asyncio
    async def test_lesson_planner_halts_without_calling_llm(self):
        """Khi thiếu bằng chứng, pipeline soạn giáo án ngắt trước khi gọi LLM."""
        empty_retrieval = RetrievalResponse(chunks=[], insufficient_evidence=True)

        with patch("app.generation.service.search_similar_chunks", new_callable=AsyncMock) as mock_retrieval:
            mock_retrieval.return_value = empty_retrieval

            with patch("app.generation.service.get_ai_provider") as mock_get_provider:
                mock_provider = MagicMock()
                mock_provider.generate_structured_output = AsyncMock()
                mock_get_provider.return_value = mock_provider

                with pytest.raises(InsufficientEvidenceError):
                    await generate_lesson_plan_service(
                        workspace_id=str(uuid.uuid4()),
                        subject="Toán",
                        grade_level="10",
                        topic="Chủ đề chưa có tài liệu",
                    )

                # Đảm bảo LLM hoàn toàn KHÔNG được gọi
                assert not mock_provider.generate_structured_output.called

    @pytest.mark.asyncio
    async def test_quiz_generator_halts_without_calling_llm(self):
        """Khi thiếu bằng chứng, pipeline tạo trắc nghiệm ngắt trước khi gọi LLM."""
        low_sim_chunk = RetrievedChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Nội dung xa lạ",
            chunk_index=0,
            similarity_score=0.12,  # Thấp hơn ngưỡng
        )
        low_sim_response = RetrievalResponse(chunks=[low_sim_chunk], insufficient_evidence=False)

        with patch("app.generation.service.search_similar_chunks", new_callable=AsyncMock) as mock_retrieval:
            mock_retrieval.return_value = low_sim_response

            with patch("app.generation.service.get_ai_provider") as mock_get_provider:
                mock_provider = MagicMock()
                mock_provider.generate_structured_output = AsyncMock()
                mock_get_provider.return_value = mock_provider

                with pytest.raises(InsufficientEvidenceError):
                    await generate_quiz_service(
                        workspace_id=str(uuid.uuid4()),
                        subject="Lịch sử",
                        grade_level="12",
                        topic="Chiến tranh thế giới",
                        min_similarity=0.30,
                    )

                # LLM hoàn toàn không bị gọi để tránh bịa đặt câu hỏi
                assert not mock_provider.generate_structured_output.called


class TestGenerationHttpErrorMapping:
    """AC3 & AC4: Response có trạng thái HTTP 422 và user nhận được thông báo rõ ràng."""

    @pytest.mark.asyncio
    async def test_lesson_plan_route_returns_422_on_insufficient_evidence(self):
        """POST /generation/lesson-plan trả về HTTP 422 Unprocessable Entity khi thiếu nguồn."""
        with patch("app.api.routes.generation.generate_lesson_plan_service", new_callable=AsyncMock) as mock_service:
            mock_service.side_effect = InsufficientEvidenceError(
                message=DEFAULT_USER_FRIENDLY_MESSAGE,
                details={"reason": "NO_MATCHING_CHUNKS"},
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/generation/lesson-plan",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    params={
                        "workspace_id": str(uuid.uuid4()),
                        "subject": "Vật lí",
                        "grade_level": "11",
                        "topic": "Thuyết tương đối hẹp",
                    },
                )

            assert response.status_code == 422
            data = response.json()
            assert "detail" in data
            detail = data["detail"]
            assert detail["error_code"] == "INSUFFICIENT_EVIDENCE"
            assert "Không tìm thấy đủ tài liệu" in detail["message"]
            assert detail["details"]["reason"] == "NO_MATCHING_CHUNKS"

    @pytest.mark.asyncio
    async def test_quiz_route_returns_422_on_insufficient_evidence(self):
        """POST /generation/quiz trả về HTTP 422 Unprocessable Entity khi thiếu nguồn."""
        with patch("app.api.routes.generation.generate_quiz_service", new_callable=AsyncMock) as mock_service:
            mock_service.side_effect = InsufficientEvidenceError(
                message="Tài liệu có độ liên quan quá thấp",
                details={"reason": "LOW_SIMILARITY_SCORE", "top_similarity_score": 0.18},
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/generation/quiz",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    params={
                        "workspace_id": str(uuid.uuid4()),
                        "subject": "Toán",
                        "grade_level": "10",
                        "topic": "Hàm số lượng giác",
                    },
                )

            assert response.status_code == 422
            data = response.json()
            assert data["detail"]["error_code"] == "INSUFFICIENT_EVIDENCE"
            assert "độ liên quan quá thấp" in data["detail"]["message"]
            assert data["detail"]["details"]["reason"] == "LOW_SIMILARITY_SCORE"
