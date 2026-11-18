"""
QA Automated Test Suite for [QA-023 / ATC-78]:
Test Quiz Question Completeness, Options and Answer Keys (Master: ATC-401).

Acceptance Criteria:
1. 100% câu hỏi trắc nghiệm (MCQ) có đúng 1 đáp án chính xác (A, B, C, D) và lời giải thích hợp lý.
2. Kiểm thử sinh đề thi với các mức số lượng câu hỏi khác nhau từ cận dưới đến cận trên (3 - 20 câu).
3. 100% câu hỏi MCQ có đúng 4 phương án lựa chọn phân biệt (không trùng lặp, không rỗng).
4. Câu hỏi tự luận (SHORT_ANSWER) có câu trả lời mẫu chuẩn xác và hướng dẫn giải thích.
5. Kiểm tra tính duy nhất của đáp án (không có đáp án mơ hồ hoặc chỉ số ngoài phạm vi).
"""

import json
from typing import Any, Dict, List
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
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
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


# ============================================================================
# Helpers & Test Data Generators
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


def make_sample_mcq(
    q_num: int,
    text: str = None,
    options: List[str] = None,
    correct_answer: str = "A",
    explanation: str = None,
    bloom_level: str = "Understand",
    chunk_id: str = None,
) -> Dict[str, Any]:
    return {
        "question_number": q_num,
        "type": "MCQ",
        "question_text": text or f"Câu hỏi trắc nghiệm số {q_num}: Khái niệm cơ bản trong SGK?",
        "options": options or ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
        "correct_answer": correct_answer,
        "explanation": explanation or f"Lời giải thích chi tiết cho câu {q_num}: Phương án {correct_answer} chính xác vì căn cứ theo mục I SGK.",
        "bloom_taxonomy_level": bloom_level,
        "source_chunk_ids": [chunk_id or str(uuid.uuid4())],
    }


def make_sample_short_answer(
    q_num: int,
    text: str = None,
    correct_answer: str = None,
    explanation: str = None,
    bloom_level: str = "Apply",
    chunk_id: str = None,
) -> Dict[str, Any]:
    return {
        "question_number": q_num,
        "type": "SHORT_ANSWER",
        "question_text": text or f"Câu hỏi tự luận số {q_num}: Hãy giải thích định lý cơ bản.",
        "options": None,
        "correct_answer": correct_answer or f"Đáp án mẫu: Định lý phát biểu rằng mọi đối tượng thỏa mãn điều kiện P thì suy ra Q.",
        "explanation": explanation or f"Thang điểm và tiêu chí chấm cho câu {q_num}: Nêu đúng giả thiết (0.5đ), nêu đúng kết luận (0.5đ).",
        "bloom_taxonomy_level": bloom_level,
        "source_chunk_ids": [chunk_id or str(uuid.uuid4())],
    }


def make_full_quiz_dict(num_questions: int, ratio_mcq: float = 0.8) -> Dict[str, Any]:
    questions = []
    chunk_id = str(uuid.uuid4())
    correct_letters = ["A", "B", "C", "D"]

    for i in range(1, num_questions + 1):
        if i <= int(num_questions * ratio_mcq) or num_questions < 3:
            chosen_letter = correct_letters[(i - 1) % 4]
            questions.append(
                make_sample_mcq(
                    q_num=i,
                    correct_answer=chosen_letter,
                    chunk_id=chunk_id,
                )
            )
        else:
            questions.append(
                make_sample_short_answer(
                    q_num=i,
                    chunk_id=chunk_id,
                )
            )

    return {
        "title": f"Đề kiểm tra đánh giá năng lực học sinh ({num_questions} câu)",
        "subject": "Toán học",
        "grade_level": "10",
        "topic": "Hàm số bậc hai",
        "difficulty": "MEDIUM",
        "questions": questions,
        "source_chunk_ids": [chunk_id],
        "insufficient_evidence": False,
    }


# ============================================================================
# Test Class 1: Scalability Across Question Counts (3 to 20 Questions) [QA-023]
# ============================================================================

class TestQuizQuestionCountScalability:
    """Verifies that quiz generation and validation scale accurately across 3 to 20 questions."""

    @pytest.mark.parametrize("count", [3, 5, 8, 10, 15, 20])
    def test_quiz_scales_across_supported_question_counts(self, count: int):
        req = make_sample_request(num_questions=count)
        quiz_data = make_full_quiz_dict(num_questions=count)

        schema = validate_and_repair_quiz(quiz_data, req)

        assert len(schema.questions) == count
        assert schema.title is not None
        for idx, q in enumerate(schema.questions, start=1):
            assert q.question_number == idx
            assert len(q.question_text.strip()) > 10

    def test_minimum_bound_3_questions(self):
        """Tests minimum acceptable boundary: 3 questions."""
        req = make_sample_request(num_questions=3)
        quiz_data = make_full_quiz_dict(num_questions=3)
        schema = validate_and_repair_quiz(quiz_data, req)
        assert len(schema.questions) == 3
        assert [q.question_number for q in schema.questions] == [1, 2, 3]

    def test_maximum_bound_20_questions(self):
        """Tests maximum acceptable boundary: 20 questions."""
        req = make_sample_request(num_questions=20)
        quiz_data = make_full_quiz_dict(num_questions=20)
        schema = validate_and_repair_quiz(quiz_data, req)
        assert len(schema.questions) == 20
        for q in schema.questions:
            assert q.bloom_taxonomy_level in ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]


# ============================================================================
# Test Class 2: MCQ 100% Single Answer & Explanation Completeness [QA-023]
# ============================================================================

class TestMCQSingleAnswerAndExplanationCompleteness:
    """AC: 100% câu hỏi trắc nghiệm có đúng 1 đáp án chính xác và lời giải thích hợp lý."""

    def test_every_mcq_has_single_valid_answer_key_and_index(self):
        req = make_sample_request(num_questions=10)
        quiz_data = make_full_quiz_dict(num_questions=10, ratio_mcq=1.0)
        schema = validate_and_repair_quiz(quiz_data, req)

        valid_letters = {"A", "B", "C", "D"}
        for q in schema.questions:
            assert q.type == "MCQ"
            # Exactly 1 valid letter
            assert q.correct_answer in valid_letters
            # Exact index within [0, 1, 2, 3]
            assert q.correct_answer_index is not None
            assert 0 <= q.correct_answer_index <= 3
            # Index must point to the correct option matching the answer letter
            expected_index = ord(q.correct_answer) - ord("A")
            assert q.correct_answer_index == expected_index
            # Options list must contain exactly 4 distinct items
            assert len(q.options) == 4
            assert len(set(q.options)) == 4

    def test_every_mcq_has_meaningful_non_empty_explanation(self):
        req = make_sample_request(num_questions=10)
        quiz_data = make_full_quiz_dict(num_questions=10, ratio_mcq=1.0)
        schema = validate_and_repair_quiz(quiz_data, req)

        for q in schema.questions:
            assert q.explanation is not None
            assert len(q.explanation.strip()) >= 15
            assert not any(placeholder in q.explanation.lower() for placeholder in ["todo", "n/a", "none"])

    def test_reject_mcq_when_options_have_fewer_than_two_distinct(self):
        """Ensures questions with less than 2 distinct options cannot form valid multiple-choice."""
        req = make_sample_request(num_questions=3)
        quiz_data = make_full_quiz_dict(num_questions=3, ratio_mcq=1.0)
        quiz_data["questions"][0]["options"] = ["Chỉ có 1 phương án duy nhất"]

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(quiz_data, req)
        assert "fewer than 2 valid options" in str(exc_info.value)


# ============================================================================
# Test Class 3: Short Answer Question Completeness [QA-023]
# ============================================================================

class TestShortAnswerQuestionCompleteness:
    """Verifies that short answer questions adhere to completeness standards."""

    def test_short_answer_has_model_answer_and_guidance(self):
        req = make_sample_request(num_questions=5)
        quiz_data = make_full_quiz_dict(num_questions=5, ratio_mcq=0.0)
        schema = validate_and_repair_quiz(quiz_data, req)

        for q in schema.questions:
            assert q.type == "SHORT_ANSWER"
            assert q.options is None
            assert q.correct_answer_index is None
            assert q.correct_answer is not None
            assert len(q.correct_answer.strip()) >= 10
            assert q.explanation is not None
            assert len(q.explanation.strip()) >= 10

    def test_reject_short_answer_when_model_answer_is_missing(self):
        req = make_sample_request(num_questions=3)
        quiz_data = make_full_quiz_dict(num_questions=3, ratio_mcq=0.0)
        quiz_data["questions"][0]["correct_answer"] = ""
        quiz_data["questions"][0]["explanation"] = ""

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(quiz_data, req)
        assert "lacks a valid model answer" in str(exc_info.value)


# ============================================================================
# Test Class 4: Answer Key Unambiguity & Bounds Integrity [QA-023]
# ============================================================================

class TestAnswerKeyIntegrity:
    """Ensures answer keys are unambiguously mapped to 0..3 and never out-of-bounds."""

    def test_answer_key_mapped_from_exact_option_text(self):
        """When LLM returns option text instead of letter, pipeline resolves exact index."""
        req = make_sample_request(num_questions=3)
        quiz_data = make_full_quiz_dict(num_questions=3, ratio_mcq=1.0)
        target_option = quiz_data["questions"][0]["options"][2]
        quiz_data["questions"][0]["correct_answer"] = target_option

        schema = validate_and_repair_quiz(quiz_data, req)
        q1 = schema.questions[0]
        assert q1.correct_answer == "C"
        assert q1.correct_answer_index == 2

    def test_reject_when_answer_key_does_not_match_any_option(self):
        req = make_sample_request(num_questions=3)
        quiz_data = make_full_quiz_dict(num_questions=3, ratio_mcq=1.0)
        quiz_data["questions"][0]["correct_answer"] = "Option Hoàn Toàn Không Tồn Tại"

        with pytest.raises(QuizValidationError) as exc_info:
            validate_and_repair_quiz(quiz_data, req)
        assert "lacks a valid answer key" in str(exc_info.value)


# ============================================================================
# Test Class 5: End-to-End Pipeline & HTTP Route Verification [QA-023]
# ============================================================================

class TestQuizPipelineCompletenessEndToEnd:
    """Verifies end-to-end pipeline execution with 100% completeness metrics."""

    @pytest.mark.asyncio
    async def test_pipeline_produces_fully_compliant_quiz(self):
        chunk_id = uuid.uuid4()
        mock_retrieval = RetrievalResponse(
            chunks=[
                RetrievedChunk(
                    id=chunk_id,
                    document_id=uuid.uuid4(),
                    chunk_index=0,
                    content="Định lý cosin: trong tam giác ABC bất kỳ, bình phương một cạnh bằng tổng bình phương hai cạnh kia trừ hai lần tích của chúng nhân với cosin góc xen giữa. a^2 = b^2 + c^2 - 2bc*cos(A).",
                    similarity_score=0.92,
                    metadata={"subject": "Toán", "grade_level": "10"},
                ),
            ],
            insufficient_evidence=False,
        )

        quiz_dict = make_full_quiz_dict(num_questions=5, ratio_mcq=0.8)
        chunk_str_id = str(chunk_id)
        for q in quiz_dict["questions"]:
            q["source_chunk_ids"] = [chunk_str_id]
        quiz_dict["source_chunk_ids"] = [chunk_str_id]

        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.provider_name = "mock"
        mock_provider.generate_structured_output = AsyncMock(return_value=quiz_dict)

        pipeline = QuizGeneratorPipeline(provider=mock_provider)

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval

            request = QuizGenerationRequest(
                workspace_id=uuid.uuid4(),
                subject="Toán học",
                grade_level="10",
                topic="Hàm số bậc hai",
                num_questions=5,
                question_types=["MCQ", "SHORT_ANSWER"],
                difficulty="MEDIUM",
            )

            result = await pipeline.generate_quiz(request)

            assert result.title is not None
            assert len(result.questions) == 5
            mcq_questions = [q for q in result.questions if q.type == "MCQ"]
            assert len(mcq_questions) >= 3

            # 100% MCQ completeness check
            for mcq in mcq_questions:
                assert mcq.correct_answer in ["A", "B", "C", "D"]
                assert 0 <= mcq.correct_answer_index <= 3
                assert len(mcq.options) == 4
                assert len(mcq.explanation.strip()) >= 15
                assert chunk_str_id in [str(cid) for cid in mcq.source_chunk_ids]

    @pytest.mark.asyncio
    async def test_http_endpoint_returns_200_and_structured_quiz(self):
        ws_id = str(uuid.uuid4())
        chunk_id = uuid.uuid4()

        quiz_dict = make_full_quiz_dict(num_questions=4, ratio_mcq=1.0)
        for q in quiz_dict["questions"]:
            q["source_chunk_ids"] = [str(chunk_id)]
        quiz_dict["source_chunk_ids"] = [str(chunk_id)]

        mock_retrieval = RetrievalResponse(
            chunks=[
                RetrievedChunk(
                    id=chunk_id,
                    document_id=uuid.uuid4(),
                    chunk_index=0,
                    content="Định lý cosin và ứng dụng trong tam giác: bình phương độ dài một cạnh tam giác bất kỳ bằng tổng bình phương hai cạnh còn lại trừ hai lần tích của hai cạnh đó nhân với cosin của góc xen giữa hai cạnh đó. a^2 = b^2 + c^2 - 2bc*cos(A).",
                    similarity_score=0.9,
                    metadata={"subject": "Toán học", "grade_level": "10"},
                )
            ],
            insufficient_evidence=False,
        )

        with patch("app.generation.quiz_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search, \
             patch("app.generation.quiz_generator.get_ai_provider") as mock_get_provider:

            mock_search.return_value = mock_retrieval
            mock_prov = MagicMock()
            mock_prov.provider_name = "mock"
            mock_prov.generate_structured_output = AsyncMock(return_value=quiz_dict)
            mock_get_provider.return_value = mock_prov

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                payload = {
                    "workspace_id": ws_id,
                    "subject": "Toán học",
                    "grade_level": "10",
                    "topic": "Hàm số bậc hai",
                    "num_questions": 4,
                    "question_types": ["MCQ"],
                    "difficulty": "MEDIUM",
                }
                response = await client.post(
                    "/generation/quiz",
                    json=payload,
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "success"
                assert data["content_type"] == "quiz"
                questions = data["data"]["questions"]
                assert len(questions) == 4
                for q in questions:
                    assert q["type"] == "MCQ"
                    assert q["correct_answer"] in ["A", "B", "C", "D"]
                    assert 0 <= q["correct_answer_index"] <= 3
                    assert len(q["explanation"].strip()) >= 15
