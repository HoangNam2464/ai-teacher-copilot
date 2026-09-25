"""
QA Automated Test Suite for [QA-019 / ATC-61]:
Test Lesson Plan JSON Schema & Source Citation Traceability (ATC-304).

Acceptance Criteria:
1. JSON output hợp lệ (Valid JSON structure conforming to LessonPlanSchema).
2. Required fields đầy đủ (title, subject, grade_level, duration_minutes, objectives, materials_needed, sections, assessment).
3. Citation tồn tại với source hợp lệ (source_chunk_ids list non-empty and correctly populated from retrieved chunks).
4. Citation có thể truy ngược tới document/chunk (Citation provenance traceability down to chunk ID, document ID, and page).
"""

import json
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from pydantic import ValidationError
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.lesson_planner import LessonPlannerPipeline
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    LessonPlanSchema,
    LessonSection,
)
from app.main import app
from app.providers.mock_provider import MockAIProvider
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


# ============================================================================
# Test Data Fixtures
# ============================================================================

def make_valid_lesson_plan_dict(source_chunk_ids=None):
    return {
        "title": "Kế hoạch bài dạy: Khái niệm Véc tơ và các phép toán",
        "subject": "Toán",
        "grade_level": "10",
        "duration_minutes": 45,
        "objectives": [
            "Hiểu định nghĩa đoạn thẳng có hướng và véc tơ.",
            "Biết xác định phương, hướng và độ dài của một véc tơ.",
            "Phát triển năng lực tư duy toán học và giải quyết vấn đề.",
        ],
        "materials_needed": [
            "Sách giáo khoa Toán 10 Tập 1 (Chân trời sáng tạo)",
            "Thước kẻ, compa, bảng phụ phục vụ hoạt động nhóm",
            "Máy chiếu hoặc tranh minh họa hướng chuyển động",
        ],
        "sections": [
            {
                "title": "1. Khởi động và tạo tình huống",
                "duration_minutes": 5,
                "content": "Giáo viên trình chiếu hình ảnh máy bay cất cánh, yêu cầu học sinh thảo luận về vận tốc có hướng.",
            },
            {
                "title": "2. Hình thành kiến thức mới: Khái niệm véc tơ",
                "duration_minutes": 20,
                "content": "Giáo viên định nghĩa đoạn thẳng có hướng AB; ký hiệu véc tơ; điểm đầu, điểm cuối và độ dài.",
            },
            {
                "title": "3. Luyện tập và củng cố",
                "duration_minutes": 15,
                "content": "Học sinh thực hiện bài tập nhóm nhận biết hai véc tơ cùng phương, cùng hướng và bằng nhau.",
            },
        ],
        "assessment": "Đánh giá qua phiếu bài tập ngắn 3 câu trắc nghiệm và quan sát hoạt động thảo luận nhóm.",
        "source_chunk_ids": source_chunk_ids or [str(uuid.uuid4()), str(uuid.uuid4())],
        "insufficient_evidence": False,
    }


# ============================================================================
# AC-1 & AC-2: JSON Schema Validation & Required Fields Completeness
# ============================================================================

class TestLessonPlanJsonSchemaValidationQA019:
    """
    AC-1 & AC-2: Kiểm tra tính hợp lệ của JSON Output và tính đầy đủ của các Required Fields.
    """

    def test_valid_lesson_plan_schema_passes_validation(self):
        """TC-LP-01: Valid lesson plan dictionary parses into LessonPlanSchema successfully."""
        data = make_valid_lesson_plan_dict()
        plan = LessonPlanSchema(**data)

        assert plan.title == data["title"]
        assert plan.subject == "Toán"
        assert plan.grade_level == "10"
        assert plan.duration_minutes == 45
        assert len(plan.objectives) == 3
        assert len(plan.materials_needed) == 3
        assert len(plan.sections[0].content) > 0
        assert len(plan.source_chunk_ids) == 2
        assert plan.insufficient_evidence is False

    def test_json_serialization_round_trip(self):
        """TC-LP-02: Serialize to JSON string and deserialize preserves all fields."""
        data = make_valid_lesson_plan_dict()
        plan = LessonPlanSchema(**data)
        json_str = plan.model_dump_json()

        parsed = json.loads(json_str)
        assert parsed["title"] == data["title"]
        assert parsed["subject"] == data["subject"]
        assert parsed["duration_minutes"] == 45
        assert isinstance(parsed["objectives"], list)
        assert isinstance(parsed["sections"], list)

    def test_missing_title_raises_validation_error(self):
        """TC-LP-03: Required field 'title' missing raises ValidationError."""
        data = make_valid_lesson_plan_dict()
        del data["title"]
        with pytest.raises(ValidationError) as exc:
            LessonPlanSchema(**data)
        assert "title" in str(exc.value)

    def test_missing_subject_raises_validation_error(self):
        """TC-LP-04: Required field 'subject' missing raises ValidationError."""
        data = make_valid_lesson_plan_dict()
        del data["subject"]
        with pytest.raises(ValidationError) as exc:
            LessonPlanSchema(**data)
        assert "subject" in str(exc.value)

    def test_missing_grade_level_raises_validation_error(self):
        """TC-LP-05: Required field 'grade_level' missing raises ValidationError."""
        data = make_valid_lesson_plan_dict()
        del data["grade_level"]
        with pytest.raises(ValidationError) as exc:
            LessonPlanSchema(**data)
        assert "grade_level" in str(exc.value)

    def test_missing_objectives_raises_validation_error(self):
        """TC-LP-06: Required field 'objectives' missing raises ValidationError."""
        data = make_valid_lesson_plan_dict()
        del data["objectives"]
        with pytest.raises(ValidationError) as exc:
            LessonPlanSchema(**data)
        assert "objectives" in str(exc.value)

    def test_missing_sections_raises_validation_error(self):
        """TC-LP-07: Required field 'sections' missing raises ValidationError."""
        data = make_valid_lesson_plan_dict()
        del data["sections"]
        with pytest.raises(ValidationError) as exc:
            LessonPlanSchema(**data)
        assert "sections" in str(exc.value)

    def test_section_missing_required_fields_raises_validation_error(self):
        """TC-LP-08: LessonSection missing required fields (title, duration_minutes, content) raises ValidationError."""
        # Missing content in section
        invalid_section = {
            "title": "Hoạt động khởi động",
            "duration_minutes": 10,
        }
        with pytest.raises(ValidationError) as exc:
            LessonSection(**invalid_section)
        assert "content" in str(exc.value)

        # Missing title in section
        invalid_section_2 = {
            "duration_minutes": 10,
            "content": "Nội dung khởi động",
        }
        with pytest.raises(ValidationError) as exc:
            LessonSection(**invalid_section_2)
        assert "title" in str(exc.value)


# ============================================================================
# AC-3: Source Citation Validity & source_chunk_ids Population
# ============================================================================

class TestSourceCitationValidityQA019:
    """
    AC-3: Citation tồn tại với source hợp lệ.
    source_chunk_ids được trích xuất từ các retrieved chunks và gán vào bài học.
    """

    def test_source_chunk_ids_populated_from_retrieved_chunks(self):
        """TC-LP-09: source_chunk_ids is properly populated from retrieval response."""
        chunk_id_1 = str(uuid.uuid4())
        chunk_id_2 = str(uuid.uuid4())

        plan = LessonPlanSchema(**make_valid_lesson_plan_dict(
            source_chunk_ids=[chunk_id_1, chunk_id_2]
        ))

        assert len(plan.source_chunk_ids) == 2
        assert chunk_id_1 in plan.source_chunk_ids
        assert chunk_id_2 in plan.source_chunk_ids

    def test_source_chunk_ids_can_be_empty_when_no_sources(self):
        """TC-LP-10: source_chunk_ids defaults to empty list when no sources available."""
        data = make_valid_lesson_plan_dict()
        data["source_chunk_ids"] = []
        plan = LessonPlanSchema(**data)
        assert plan.source_chunk_ids == []

    @pytest.mark.asyncio
    async def test_pipeline_binds_retrieved_chunk_ids_to_generated_plan(self):
        """TC-LP-11: LessonPlannerPipeline binds retrieved chunk IDs into final output."""
        expected_chunk_id = uuid.uuid4()
        doc_id = uuid.uuid4()
        workspace_id = uuid.uuid4()

        mock_retrieval = RetrievalResponse(
            chunks=[
                RetrievedChunk(
                    id=expected_chunk_id,
                    document_id=doc_id,
                    content="Định nghĩa véc tơ và các tính chất cơ bản trong hình học 10.",
                    chunk_index=0,
                    source_page=12,
                    similarity_score=0.91,
                    subject="Toán",
                    grade_level="10",
                    topic="Véc tơ",
                )
            ],
            insufficient_evidence=False,
            query="Toán Lớp 10 Véc tơ",
            total_retrieved=1,
        )

        mock_provider = MockAIProvider()
        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=workspace_id,
            subject="Toán",
            grade_level="10",
            topic="Khái niệm Véc tơ",
            duration_minutes=45,
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval

            result = await pipeline.generate_lesson_plan(request)

            assert isinstance(result, LessonPlanSchema)
            assert str(expected_chunk_id) in result.source_chunk_ids
            assert len(result.source_chunk_ids) >= 1


# ============================================================================
# AC-4: Citation Traceability & Provenance to Document Chunk
# ============================================================================

class TestCitationTraceabilityEndToEndQA019:
    """
    AC-4: Citation có thể truy ngược tới document/chunk gốc.
    Đảm bảo tính liên kết xuyên suốt từ Lesson Plan -> Chunk ID -> Document ID & Metadata.
    """

    @pytest.mark.asyncio
    async def test_provenance_link_from_lesson_plan_to_document_metadata(self):
        """TC-LP-12: Every chunk ID in source_chunk_ids resolves back to document and page."""
        chunk_1 = RetrievedChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Mục 1: Véc tơ là đoạn thẳng có hướng.",
            chunk_index=0,
            source_page=14,
            similarity_score=0.95,
            subject="Toán",
            grade_level="10",
        )
        chunk_2 = RetrievedChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Mục 2: Hai véc tơ cùng phương khi giá của chúng song song hoặc trùng nhau.",
            chunk_index=1,
            source_page=15,
            similarity_score=0.88,
            subject="Toán",
            grade_level="10",
        )

        retrieval = RetrievalResponse(
            chunks=[chunk_1, chunk_2],
            insufficient_evidence=False,
            query="Toán Véc tơ",
            total_retrieved=2,
        )

        mock_provider = MockAIProvider()
        pipeline = LessonPlannerPipeline(provider=mock_provider)

        request = LessonPlanGenerationRequest(
            workspace_id=uuid.uuid4(),
            subject="Toán",
            grade_level="10",
            topic="Véc tơ",
            duration_minutes=45,
        )

        with patch("app.generation.lesson_planner.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = retrieval
            lesson_plan = await pipeline.generate_lesson_plan(request)

            # Assert all retrieved chunks are traceable in source_chunk_ids
            assert str(chunk_1.id) in lesson_plan.source_chunk_ids
            assert str(chunk_2.id) in lesson_plan.source_chunk_ids

            # Verify chunk metadata can be accurately matched back
            chunk_map = {str(c.id): c for c in retrieval.chunks}
            for cid in lesson_plan.source_chunk_ids:
                matched_chunk = chunk_map.get(cid)
                assert matched_chunk is not None
                assert matched_chunk.document_id is not None
                assert matched_chunk.source_page in [14, 15]

    @pytest.mark.asyncio
    async def test_api_route_lesson_plan_returns_valid_schema_with_citations(self):
        """TC-LP-13: API route /generation/lesson-plan returns HTTP 200 with valid schema and source_chunk_ids."""
        chunk_id = uuid.uuid4()
        doc_id = uuid.uuid4()

        mock_plan = make_valid_lesson_plan_dict(source_chunk_ids=[str(chunk_id)])
        sample_plan = LessonPlanSchema(**mock_plan)

        with patch("app.api.routes.generation.lesson_planner_pipeline.generate_lesson_plan", new_callable=AsyncMock) as mock_pipe:
            mock_pipe.return_value = sample_plan

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/generation/lesson-plan",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    json={
                        "workspace_id": str(uuid.uuid4()),
                        "subject": "Toán",
                        "grade_level": "10",
                        "topic": "Khái niệm Véc tơ",
                        "duration_minutes": 45,
                    },
                )

            assert response.status_code == 200
            body = response.json()
            assert body["status"] == "success"
            assert body["content_type"] == "lesson_plan"

            data = body["data"]
            assert data["title"] == sample_plan.title
            assert data["subject"] == "Toán"
            assert data["grade_level"] == "10"
            assert data["duration_minutes"] == 45
            assert isinstance(data["objectives"], list)
            assert isinstance(data["sections"], list)
            assert str(chunk_id) in data["source_chunk_ids"]
