"""
Unit & Integration Tests for Structured MCQ & Short Answer Quiz Generation (BE-024 / ATC-77).

Acceptance Criteria Verified:
1. AC1: MCQ được sinh đúng schema (type='MCQ', 4 options, correct_answer letter, correct_answer_index 0-3).
2. AC2: Short-answer được sinh đúng schema (type='SHORT_ANSWER', options=None, correct_answer model text).
3. AC3: MCQ có options hợp lệ (đủ 4 options A, B, C, D, làm sạch prefix và deduplicate).
4. AC4: Answer key tồn tại (xác thực và ánh xạ đáp án đúng với options hoặc câu trả lời mẫu).
5. AC5: Invalid LLM output được reject hoặc repair (sửa lỗi dict options, chuẩn hóa Bloom, reject lỗi nghiêm trọng).
6. Pipeline RAG & Security: Bọc ngữ cảnh bằng thẻ <sources>, truy vấn pgvector theo workspace, ngắt khi thiếu chứng cứ.
"""

from typing import Any, Dict, List
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.quiz_generator import (
    QuizGeneratorPipeline,
    QuizValidationError,
    normalize_bloom_level,
    repair_and_clean_options,
    validate_and_repair_quiz,
)
from app.generation.schemas import (
    QuizGenerationRequest,
    QuizQuestion,
    QuizSchema,
)
from app.main import app
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError, RateLimitError
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


# ============================================================================
# Helpers & Test Fixtures
# ============================================================================

def make_sample_request(
    workspace_id: uuid.UUID = None,
    num_questions: int = 5,
    question_types: List[str] = None,
) -> QuizGenerationRequest:
    return QuizGenerationRequest(
        workspace_id=workspace_id or uuid.uuid4(),
        subject="Toán học",
        grade_level="10",
        topic="Hàm số bậc hai",
        num_questions=num_questions,
        question_types=question_types or ["MCQ", "SHORT_ANSWER"],
        difficulty="MEDIUM",
        target_bloom_level="Apply",
        instructions="Tập trung vào đồ thị parabol và tọa độ đỉnh",
    )


def make_retrieval_response(workspace_id: uuid.UUID) -> RetrievalResponse:
    chunk_id = uuid.uuid4()
    doc_id = uuid.uuid4()
    return RetrievalResponse(
        chunks=[
            RetrievedChunk(
                id=chunk_id,
                document_id=doc_id,
                content="Hàm số bậc hai có dạng y = ax^2 + bx + c (a khác 0). Đỉnh Parabol có tọa độ I(-b/2a; -delta/4a).",
                chunk_index=0,
                source_page=42,
                similarity_score=0.91,
                metadata={"title": "Đại số 10"},
            )
        ],
        insufficient_evidence=False,
        query="Toán 10 Hàm số bậc hai",
        total_retrieved=1,
    )


def make_valid_raw_quiz_dict(chunk_id: str = "chunk-1") -> Dict[str, Any]:
    return {
        "title": "Đề kiểm tra Hàm số bậc hai",
        "subject": "Toán học",
        "grade_level": "10",
        "topic": "Hàm số bậc hai",
        "difficulty": "MEDIUM",
        "questions": [
            {
                "question_number": 1,
                "type": "MCQ",
                "question_text": "Tọa độ đỉnh I của parabol y = ax^2 + bx + c là gì?",
                "options": [
                    "I(-b/2a; -delta/4a)",
                    "I(b/2a; delta/4a)",
                    "I(-b/a; -delta/2a)",
                    "I(b/a; delta/2a)",
                ],
                "correct_answer": "A",
                "correct_answer_index": 0,
                "explanation": "Theo công thức sách giáo khoa, đỉnh parabol có tọa độ I(-b/2a; -delta/4a).",
                "bloom_taxonomy_level": "Remember",
                "source_chunk_ids": [chunk_id],
            },
            {
                "question_number": 2,
                "type": "SHORT_ANSWER",
                "question_text": "Nêu điều kiện để parabol y = ax^2 + bx + c có bề lõm quay lên trên.",
                "options": None,
                "correct_answer": "Hệ số a > 0",
                "correct_answer_index": None,
                "explanation": "Khi a > 0, hàm số đạt giá trị nhỏ nhất tại đỉnh và bề lõm quay lên trên.",
                "bloom_taxonomy_level": "Understand",
                "source_chunk_ids": [chunk_id],
            },
        ],
        "source_chunk_ids": [chunk_id],
        "insufficient_evidence": False,
    }


# ============================================================================
# Test Suite 1: MCQ & Short Answer Schema Adherence (AC1, AC2)
# ============================================================================

class TestQuizSchemaAdherence:
    """Verifies that generated MCQs and Short Answer questions conform strictly to QuizSchema."""

    def test_mcq_has_valid_schema_attributes(self):
        """AC1: MCQ có đủ 4 options, correct_answer là ký tự A/B/C/D và correct_answer_index 0-3."""
        q = QuizQuestion(
            question_number=1,
            type="MCQ",
            question_text="Đỉnh của parabol có hoành độ là gì?",
            options=["-b/2a", "b/2a", "-b/a", "b/a"],
            correct_answer="A",
            correct_answer_index=0,
            explanation="Hoành độ đỉnh parabol là -b/(2a).",
            bloom_taxonomy_level="Remember",
            source_chunk_ids=["chunk-1"],
        )
        assert q.type == "MCQ"
        assert len(q.options) == 4
        assert q.correct_answer == "A"
        assert q.correct_answer_index == 0
        assert q.bloom_taxonomy_level == "Remember"

    def test_short_answer_has_valid_schema_attributes(self):
        """AC2: Short-answer có options=None, correct_answer_index=None và correct_answer không rỗng."""
        q = QuizQuestion(
            question_number=2,
            type="SHORT_ANSWER",
            question_text="Viết trục đối xứng của đồ thị hàm số y = ax^2 + bx + c.",
            options=None,
            correct_answer="Đường thẳng x = -b/(2a)",
            correct_answer_index=None,
            explanation="Trục đối xứng đi qua đỉnh parabol và vuông góc với trục Ox.",
            bloom_taxonomy_level="Understand",
            source_chunk_ids=["chunk-1"],
        )
        assert q.type == "SHORT_ANSWER"
        assert q.options is None
        assert q.correct_answer_index is None
        assert q.correct_answer == "Đường thẳng x = -b/(2a)"


# ============================================================================
# Test Suite 2: Options Validity & Cleaning (AC3)
# ============================================================================

class TestOptionsCleaningAndValidity:
    """AC3: MCQ có options hợp lệ."""

    def test_repair_options_from_dictionary(self):
        """Chuyển đổi options từ dạng dict {'A': '...', 'B': '...'} sang list."""
        raw_dict = {
            "B": "Phương án B",
            "A": "Phương án A",
            "D": "Phương án D",
            "C": "Phương án C",
        }
        cleaned = repair_and_clean_options(raw_dict)
        assert cleaned == ["Phương án A", "Phương án B", "Phương án C", "Phương án D"]

    def test_strip_letter_and_number_prefixes(self):
        """Loại bỏ tiền tố 'A. ', 'B) ', '1: ' khi LLM vô tình sinh kèm."""
        raw_list = [
            "A. Định lý Cosin",
            "B) Định lý Sin",
            "C: Công thức Heron",
            "D - Bán kính đường tròn",
        ]
        cleaned = repair_and_clean_options(raw_list)
        assert cleaned == [
            "Định lý Cosin",
            "Định lý Sin",
            "Công thức Heron",
            "Bán kính đường tròn",
        ]

    def test_repair_when_options_have_more_than_four_items(self):
        """Khi LLM sinh hơn 4 options, tự động loại bỏ trùng lặp và lấy đúng 4 options đầu."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        raw["questions"][0]["options"] = ["Opt 1", "Opt 2", "Opt 3", "Opt 4", "Opt 5", "Opt 1"]

        repaired = validate_and_repair_quiz(raw, req)
        assert len(repaired.questions[0].options) == 4
        assert repaired.questions[0].options == ["Opt 1", "Opt 2", "Opt 3", "Opt 4"]

    def test_reject_when_mcq_has_fewer_than_two_options(self):
        """Khi MCQ chỉ có dưới 2 options, không thể sửa an toàn và phải REJECT."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        raw["questions"][0]["options"] = ["Chỉ có 1 phương án duy nhất"]

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(raw, req)
        assert "fewer than 2 valid options" in str(exc_info.value)


# ============================================================================
# Test Suite 3: Answer Key Existence & Mapping (AC4)
# ============================================================================

class TestAnswerKeyValidation:
    """AC4: Answer key tồn tại và hợp lệ."""

    def test_resolve_answer_key_from_letter(self):
        """Map correct_answer='C' thành correct_answer_index=2."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        raw["questions"][0]["correct_answer"] = "C"
        raw["questions"][0]["correct_answer_index"] = None

        repaired = validate_and_repair_quiz(raw, req)
        assert repaired.questions[0].correct_answer == "C"
        assert repaired.questions[0].correct_answer_index == 2

    def test_resolve_answer_key_from_option_text(self):
        """Map correct_answer bằng nội dung chữ trùng với option thứ 2 -> index 1 và letter B."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        target_text = raw["questions"][0]["options"][1]
        raw["questions"][0]["correct_answer"] = target_text
        raw["questions"][0]["correct_answer_index"] = None

        repaired = validate_and_repair_quiz(raw, req)
        assert repaired.questions[0].correct_answer == "B"
        assert repaired.questions[0].correct_answer_index == 1

    def test_reject_when_mcq_answer_key_out_of_bounds(self):
        """Khi correct_answer_index vượt ngoài 0-3 và không khớp option nào -> REJECT."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        raw["questions"][0]["correct_answer"] = "Z"
        raw["questions"][0]["correct_answer_index"] = 99

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(raw, req)
        assert "lacks a valid answer key" in str(exc_info.value)

    def test_reject_when_short_answer_has_empty_model_answer(self):
        """Khi câu hỏi tự luận không có đáp án mẫu và không có lời giải -> REJECT."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict()
        raw["questions"][1]["correct_answer"] = ""
        raw["questions"][1]["explanation"] = ""

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(raw, req)
        assert "lacks a valid model answer" in str(exc_info.value)


# ============================================================================
# Test Suite 4: Invalid LLM Output Repair & Rejection (AC5)
# ============================================================================

class TestOutputRepairAndRejection:
    """AC5: Invalid LLM output được reject hoặc repair."""

    def test_repair_markdown_code_block_json(self):
        """Sửa chuỗi JSON bọc trong markdown code fence ```json ... ```."""
        req = make_sample_request()
        raw_dict = make_valid_raw_quiz_dict()
        import json
        raw_markdown = f"```json\n{json.dumps(raw_dict)}\n```"

        repaired = validate_and_repair_quiz(raw_markdown, req)
        assert isinstance(repaired, QuizSchema)
        assert len(repaired.questions) == 2

    def test_reject_malformed_non_json_string(self):
        """Khi LLM trả về văn bản không phải JSON -> REJECT."""
        req = make_sample_request()
        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz("Xin lỗi tôi không thể tạo câu hỏi", req)
        assert "Invalid JSON output" in str(exc_info.value)

    def test_normalize_bloom_taxonomy_levels(self):
        """Chuẩn hóa các cấp độ Bloom viết thường hoặc từ đồng nghĩa tiếng Việt."""
        assert normalize_bloom_level("remember") == "Remember"
        assert normalize_bloom_level("hiểu") == "Understand"
        assert normalize_bloom_level("vận dụng") == "Apply"
        assert normalize_bloom_level("phân tích") == "Analyze"
        assert normalize_bloom_level("đánh giá") == "Evaluate"
        assert normalize_bloom_level("sáng tạo") == "Create"
        assert normalize_bloom_level("invalid_level") == "Understand"

    def test_auto_fill_citations_from_context_when_missing(self):
        """Tự động kế thừa source_chunk_ids từ context nếu LLM không điền ở cấp câu hỏi."""
        req = make_sample_request()
        raw = make_valid_raw_quiz_dict(chunk_id="context-chunk-99")
        raw["questions"][0]["source_chunk_ids"] = []
        raw["questions"][1]["source_chunk_ids"] = []

        context_chunk = RetrievedChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Nội dung context",
            chunk_index=0,
            similarity_score=0.9,
        )

        repaired = validate_and_repair_quiz(raw, req, context_chunks=[context_chunk])
        assert str(context_chunk.id) in repaired.questions[0].source_chunk_ids
        assert str(context_chunk.id) in repaired.source_chunk_ids


# ============================================================================
# Test Suite 5: End-to-End Pipeline & Security Boundaries
# ============================================================================

class TestQuizGeneratorPipeline:
    """Verifies end-to-end pipeline execution, <sources> boundary encapsulation, and evidence halting."""

    @pytest.mark.asyncio
    async def test_end_to_end_quiz_generation_success(self):
        """Pipeline RAG sinh đề thi hoàn chỉnh với Mock provider."""
        ws_id = uuid.uuid4()
        req = make_sample_request(workspace_id=ws_id, num_questions=2)
        retrieval_res = make_retrieval_response(ws_id)

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock(
            return_value=make_valid_raw_quiz_dict(chunk_id=str(retrieval_res.chunks[0].id))
        )

        pipeline = QuizGeneratorPipeline(provider=mock_provider)

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = retrieval_res

            quiz = await pipeline.generate_quiz(req)

            assert isinstance(quiz, QuizSchema)
            assert quiz.subject == req.subject
            assert quiz.topic == req.topic
            assert len(quiz.questions) == 2
            assert str(retrieval_res.chunks[0].id) in quiz.source_chunk_ids

            # Verify prompt boundary <sources> was used
            call_kwargs = mock_provider.generate_structured_output.call_args.kwargs
            system_prompt = call_kwargs["system_prompt"]
            user_prompt = call_kwargs["user_prompt"]
            assert "<sources>" in user_prompt or "<sources>" in system_prompt

    @pytest.mark.asyncio
    async def test_pipeline_halts_on_insufficient_evidence(self):
        """Pipeline ngắt và ném InsufficientEvidenceError khi độ tương đồng thấp."""
        ws_id = uuid.uuid4()
        req = make_sample_request(workspace_id=ws_id)
        low_sim_chunk = RetrievedChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            content="Nội dung không liên quan",
            chunk_index=0,
            similarity_score=0.10,  # Dưới ngưỡng 0.30
        )
        empty_res = RetrievalResponse(chunks=[low_sim_chunk], insufficient_evidence=False)

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock()

        pipeline = QuizGeneratorPipeline(provider=mock_provider)

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = empty_res

            with pytest.raises(InsufficientEvidenceError):
                await pipeline.generate_quiz(req)

            # LLM không được gọi khi thiếu chứng cứ
            assert not mock_provider.generate_structured_output.called


# ============================================================================
# Test Suite 6: FastAPI Route Integration (/generation/quiz)
# ============================================================================

class TestQuizGenerationHttpRoutes:
    """Verifies FastAPI HTTP endpoints for quiz generation."""

    @pytest.mark.asyncio
    async def test_quiz_route_with_json_body(self):
        """POST /generation/quiz với JSON body trả về 200 OK và QuizSchema data."""
        ws_id = str(uuid.uuid4())
        retrieval_res = make_retrieval_response(uuid.UUID(ws_id))
        raw_quiz = make_valid_raw_quiz_dict(chunk_id=str(retrieval_res.chunks[0].id))

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search, \
             patch("app.generation.quiz_generator.get_ai_provider") as mock_get_provider:

            mock_search.return_value = retrieval_res
            mock_prov = MagicMock()
            mock_prov.provider_name = "mock"
            mock_prov.generate_structured_output = AsyncMock(return_value=raw_quiz)
            mock_get_provider.return_value = mock_prov

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.post(
                    "/generation/quiz",
                    json={
                        "workspace_id": ws_id,
                        "subject": "Toán học",
                        "grade_level": "10",
                        "topic": "Hàm số bậc hai",
                        "num_questions": 2,
                        "question_types": ["MCQ", "SHORT_ANSWER"],
                    },
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                )

                assert res.status_code == 200
                body = res.json()
                assert body["status"] == "success"
                assert body["content_type"] == "quiz"
                assert len(body["data"]["questions"]) == 2

    @pytest.mark.asyncio
    async def test_quiz_route_maps_validation_error_to_422(self):
        """POST /generation/quiz trả về HTTP 422 khi LLM output vi phạm schema không sửa được."""
        ws_id = str(uuid.uuid4())
        retrieval_res = make_retrieval_response(uuid.UUID(ws_id))
        invalid_quiz = {
            "title": "Đề lỗi",
            "questions": [
                {
                    "question_text": "Câu hỏi rỗng phương án",
                    "type": "MCQ",
                    "options": [],  # 0 options -> unrepairable
                    "correct_answer": "A",
                }
            ],
        }

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search, \
             patch("app.generation.quiz_generator.get_ai_provider") as mock_get_provider:

            mock_search.return_value = retrieval_res
            mock_prov = MagicMock()
            mock_prov.provider_name = "mock"
            mock_prov.generate_structured_output = AsyncMock(return_value=invalid_quiz)
            mock_get_provider.return_value = mock_prov

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.post(
                    "/generation/quiz",
                    json={
                        "workspace_id": ws_id,
                        "subject": "Toán học",
                        "grade_level": "10",
                        "topic": "Hàm số bậc hai",
                    },
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                )

                assert res.status_code == 422
                body = res.json()
                assert body["detail"]["error_code"] == "QUIZ_VALIDATION_ERROR"
