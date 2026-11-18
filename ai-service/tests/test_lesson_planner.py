"""
Unit & Integration Tests for Structured Lesson Plan Generation Pipeline (BE-018).

Tests:
1. AC1: Request được xử lý qua RAG pipeline (search_similar_chunks called with workspace isolation).
2. AC2: LLM nhận structured prompt (Grounding prompt with <sources> container).
3. AC3: Output tuân thủ JSON schema (Matches LessonPlanSchema & populates source_chunk_ids).
4. AC4: Generation failure được xử lý (Insufficient evidence -> 422, Provider errors -> 502).
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.lesson_planner import LessonPlannerPipeline
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    LessonPlanSchema,
    LessonSection,
)
from app.main import app
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AuthenticationError, RateLimitError
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


# ============================================================================
# Helpers & Mocks
# ============================================================================

def make_sample_lesson_plan(
    source_chunk_ids: list = None,
) -> LessonPlanSchema:
    return LessonPlanSchema(
        title="Định lý Cosin trong tam giác",
        subject="Toán",
        grade_level="10",
        duration_minutes=45,
        objectives=[
            "Nắm vững công thức định lý Cosin",
            "Vận dụng tính độ dài cạnh và góc trong tam giác",
        ],
        sections=[
            LessonSection(
                title="Khởi động",
                duration_minutes=5,
                content="Giáo viên chiếu hình ảnh thực tế tam giác khảo sát.",
            ),
            LessonSection(
                title="Hình thành kiến thức mới",
                duration_minutes=20,
                content="Xây dựng công thức a^2 = b^2 + c^2 - 2bc*cos(A).",
            ),
            LessonSection(
                title="Luyện tập & Vận dụng",
                duration_minutes=20,
                content="Học sinh giải bài tập tính cạnh đối diện.",
            ),
        ],
        materials_needed=["Thước kẻ", "Máy tính cầm tay", "SGK Toán 10 Tập 1"],
        source_chunk_ids=source_chunk_ids or [],
        insufficient_evidence=False,
    )


def make_retrieval_response(workspace_id: uuid.UUID) -> RetrievalResponse:
    chunk_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    return RetrievalResponse(
        chunks=[
            RetrievedChunk(
                id=chunk_id,
                document_id=doc_id,
                content="Định lý cosin: Trong tam giác ABC, ta có a^2 = b^2 + c^2 - 2bc*cos(A).",
                chunk_index=0,
                source_page=65,
                similarity_score=0.92,
                subject="Toán",
                grade_level="10",
                topic="Hệ thức lượng trong tam giác",
            )
        ],
        insufficient_evidence=False,
        query="Toán Lớp 10 Định lý Cosin",
        total_retrieved=1,
    )


# ============================================================================
# Pipeline Unit Tests
# ============================================================================

class TestLessonPlannerPipelineUnit:
    """Unit tests for LessonPlannerPipeline execution flow."""

    @pytest.mark.asyncio
    async def test_request_processed_through_rag_pipeline(self):
        """AC1: Request được xử lý qua RAG pipeline với đúng workspace_id."""
        workspace_id = uuid.uuid4()
        mock_retrieval = make_retrieval_response(workspace_id)
        mock_plan = make_sample_lesson_plan()

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock(return_value=mock_plan)

        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=workspace_id,
            subject="Toán",
            grade_level="10",
            topic="Định lý Cosin",
            duration_minutes=45,
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval

            result = await pipeline.generate_lesson_plan(request)

            # Kiểm tra gọi search_similar_chunks với đúng workspace_id
            assert mock_search.called
            call_kwargs = mock_search.call_args[1]
            assert call_kwargs["workspace_id"] == workspace_id
            assert "Toán" in call_kwargs["query"]
            assert "10" in call_kwargs["query"]

            # Kiểm tra provider được gọi
            assert mock_provider.generate_structured_output.called

    @pytest.mark.asyncio
    async def test_llm_receives_structured_prompt_with_sources(self):
        """AC2: LLM nhận structured prompt được bao bọc an toàn trong <sources>."""
        workspace_id = uuid.uuid4()
        mock_retrieval = make_retrieval_response(workspace_id)
        mock_plan = make_sample_lesson_plan()

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock(return_value=mock_plan)

        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=workspace_id,
            subject="Toán",
            grade_level="10",
            topic="Định lý Cosin",
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval

            await pipeline.generate_lesson_plan(request)

            call_kwargs = mock_provider.generate_structured_output.call_args[1]
            sys_prompt = call_kwargs["system_prompt"]
            user_prompt = call_kwargs["user_prompt"]
            schema_passed = call_kwargs["response_schema"]

            # Prompt tuân thủ prompt boundary <sources> (Rule 7.3)
            assert schema_passed == LessonPlanSchema
            assert "<sources>" in user_prompt
            assert "</sources>" in user_prompt
            assert "UNTRUSTED REFERENCE DATA" in user_prompt
            assert "Định lý cosin" in user_prompt

    @pytest.mark.asyncio
    async def test_output_complies_with_schema_and_binds_citations(self):
        """AC3: Output khớp 100% với LessonPlanSchema và giữ lại mảng source_chunk_ids."""
        workspace_id = uuid.uuid4()
        mock_retrieval = make_retrieval_response(workspace_id)
        expected_chunk_id = str(mock_retrieval.chunks[0].id)
        mock_plan = make_sample_lesson_plan()

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock(return_value=mock_plan)

        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=workspace_id,
            subject="Toán",
            grade_level="10",
            topic="Định lý Cosin",
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval

            result = await pipeline.generate_lesson_plan(request)

            # Kiểm tra schema output
            assert isinstance(result, LessonPlanSchema)
            assert result.title == "Định lý Cosin trong tam giác"
            assert result.subject == "Toán"
            assert result.grade_level == "10"
            assert result.duration_minutes == 45
            assert len(result.objectives) == 2
            assert len(result.sections) == 3

            # Kiểm tra gắn mã chunk nguồn (Citation Traceability)
            assert result.source_chunk_ids == [expected_chunk_id]

    @pytest.mark.asyncio
    async def test_insufficient_evidence_halts_before_llm(self):
        """AC4: Thiếu bằng chứng sẽ ngắt pipeline trước khi gọi LLM."""
        workspace_id = uuid.uuid4()
        empty_retrieval = RetrievalResponse(chunks=[], insufficient_evidence=True)

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.generate_structured_output = AsyncMock()

        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=workspace_id,
            subject="Toán",
            grade_level="10",
            topic="Chủ đề rỗng",
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = empty_retrieval

            with pytest.raises(InsufficientEvidenceError):
                await pipeline.generate_lesson_plan(request)

            assert not mock_provider.generate_structured_output.called


# ============================================================================
# API Endpoint Integration Tests (POST /generation/lesson-plan)
# ============================================================================

class TestLessonPlanApiEndpoint:
    """Integration tests for POST /generation/lesson-plan HTTP route."""

    @pytest.mark.asyncio
    async def test_endpoint_with_valid_body_returns_200(self):
        """Gọi endpoint với JSON body hợp lệ trả về HTTP 200 và LessonPlan data."""
        workspace_id = uuid.uuid4()
        plan = make_sample_lesson_plan(source_chunk_ids=["chunk-123"])

        with patch("app.generation.lesson_planner.lesson_planner_pipeline.generate_lesson_plan", new_callable=AsyncMock) as mock_pipe:
            mock_pipe.return_value = plan

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/generation/lesson-plan",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    json={
                        "workspace_id": str(workspace_id),
                        "subject": "Toán",
                        "grade_level": "10",
                        "topic": "Định lý Cosin",
                        "duration_minutes": 45,
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["content_type"] == "lesson_plan"
            assert data["data"]["title"] == "Định lý Cosin trong tam giác"
            assert data["data"]["source_chunk_ids"] == ["chunk-123"]

    @pytest.mark.asyncio
    async def test_endpoint_provider_error_mapped_to_502(self):
        """Lỗi từ LLM provider (Rate limit / Quota) được map thành HTTP 502 Bad Gateway."""
        workspace_id = uuid.uuid4()

        with patch("app.generation.lesson_planner.lesson_planner_pipeline.generate_lesson_plan", new_callable=AsyncMock) as mock_pipe:
            mock_pipe.side_effect = RateLimitError("Gemini quota exceeded", provider="gemini")

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/generation/lesson-plan",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    json={
                        "workspace_id": str(workspace_id),
                        "subject": "Toán",
                        "grade_level": "10",
                        "topic": "Định lý Cosin",
                    },
                )

            assert response.status_code == 502
            data = response.json()
            assert data["detail"]["error_code"] == "AI_PROVIDER_ERROR"
            assert data["detail"]["provider"] == "gemini"
