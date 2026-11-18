"""
Unit & Integration Tests for Automated Bloom's Taxonomy Question Classification (BE-026 / ATC-82).

Acceptance Criteria:
1. AC1: Question được phân loại Bloom level (Remember, Understand, Apply, Analyze, Evaluate, Create).
2. AC2: Classification được lưu (Gắn nhãn vào từng câu hỏi và tính ma trận phân bổ).
3. AC3: Output chỉ sử dụng level hợp lệ (Chỉ chấp nhận 6 cấp độ Bloom chuẩn, chuẩn hóa từ đồng nghĩa).
4. AC4: Classification failure được xử lý (Xử lý lỗi an toàn, fallback về Understand, không làm sập pipeline).
"""

from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.bloom_classifier import (
    BLOOM_LEVEL_METADATA,
    BloomClassificationResult,
    BloomLevel,
    BloomTaxonomyClassifier,
    bloom_classifier,
    classify_by_heuristic,
    classify_by_llm,
    normalize_bloom_level_code,
    normalize_to_titlecase,
)
from app.main import app
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError


# ============================================================================
# Test Suite 1: Level Normalization & Valid Output Enforcement (AC3)
# ============================================================================

class TestBloomLevelNormalization:
    """AC3: Output chỉ sử dụng 6 cấp độ Bloom hợp lệ, chuẩn hóa từ đồng nghĩa tiếng Việt/Anh."""

    @pytest.mark.parametrize(
        "input_str,expected_enum,expected_title",
        [
            ("REMEMBER", BloomLevel.REMEMBER, "Remember"),
            ("remember", BloomLevel.REMEMBER, "Remember"),
            ("Nhận biết", BloomLevel.REMEMBER, "Remember"),
            ("ghi nhớ", BloomLevel.REMEMBER, "Remember"),
            ("nhớ", BloomLevel.REMEMBER, "Remember"),
            ("UNDERSTAND", BloomLevel.UNDERSTAND, "Understand"),
            ("thông hiểu", BloomLevel.UNDERSTAND, "Understand"),
            ("hiểu", BloomLevel.UNDERSTAND, "Understand"),
            ("comprehension", BloomLevel.UNDERSTAND, "Understand"),
            ("APPLY", BloomLevel.APPLY, "Apply"),
            ("vận dụng", BloomLevel.APPLY, "Apply"),
            ("áp dụng", BloomLevel.APPLY, "Apply"),
            ("ANALYZE", BloomLevel.ANALYZE, "Analyze"),
            ("phân tích", BloomLevel.ANALYZE, "Analyze"),
            ("vận dụng cao", BloomLevel.ANALYZE, "Analyze"),
            ("EVALUATE", BloomLevel.EVALUATE, "Evaluate"),
            ("đánh giá", BloomLevel.EVALUATE, "Evaluate"),
            ("CREATE", BloomLevel.CREATE, "Create"),
            ("sáng tạo", BloomLevel.CREATE, "Create"),
            ("thiết kế", BloomLevel.CREATE, "Create"),
        ],
    )
    def test_synonyms_normalize_to_valid_bloom_levels(self, input_str, expected_enum, expected_title):
        assert normalize_bloom_level_code(input_str) == expected_enum
        assert normalize_to_titlecase(input_str) == expected_title

    def test_invalid_and_unknown_strings_fallback_to_understand(self):
        """Khi gặp chuỗi không hợp lệ, hệ thống đảm bảo trả về cấp độ an toàn (UNDERSTAND)."""
        assert normalize_bloom_level_code("unknown_level_123") == BloomLevel.UNDERSTAND
        assert normalize_to_titlecase("random_garbage_text") == "Understand"
        assert normalize_bloom_level_code(None) == BloomLevel.UNDERSTAND
        assert normalize_to_titlecase("") == "Understand"

    def test_all_metadata_contains_valid_fields(self):
        """Xác thực siêu dữ liệu sư phạm của toàn bộ 6 cấp độ Bloom."""
        assert len(BLOOM_LEVEL_METADATA) == 6
        for level, meta in BLOOM_LEVEL_METADATA.items():
            assert "titlecase" in meta
            assert "display_vi" in meta
            assert "description" in meta
            assert "order" in meta
            assert 1 <= meta["order"] <= 6


# ============================================================================
# Test Suite 2: Question Classification by Cognitive Verbs (AC1)
# ============================================================================

class TestQuestionCognitiveVerbsClassification:
    """AC1: Question được phân loại Bloom level chính xác dựa trên động từ nhận thức."""

    def test_classify_remember_questions(self):
        samples = [
            "Nêu định nghĩa đoạn thẳng có hướng trong mặt phẳng tọa độ?",
            "Hãy liệt kê các tính chất cơ bản của hàm số bậc nhất.",
            "Đâu là công thức tính diện tích hình tròn có bán kính R?",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.REMEMBER.value
            assert res.level_titlecase == "Remember"
            assert res.display_vi == "Nhận biết"
            assert res.confidence >= 0.70

    def test_classify_understand_questions(self):
        samples = [
            "Hãy giải thích vì sao đồ thị hàm số y = ax^2 có đỉnh nằm trên trục tung?",
            "Mô tả ý nghĩa hình học của hệ số góc trong phương trình đường thẳng.",
            "Tại sao hai véc tơ cùng phương không nhất thiết phải cùng hướng?",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.UNDERSTAND.value
            assert res.level_titlecase == "Understand"
            assert res.display_vi == "Thông hiểu"

    def test_classify_apply_questions(self):
        samples = [
            "Tính giá trị của biểu thức P = sin^2(30) + cos^2(60).",
            "Giải phương trình bậc hai 2x^2 - 5x + 2 = 0.",
            "Tìm tọa độ giao điểm của parabol y = x^2 và đường thẳng y = 2x + 3.",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.APPLY.value
            assert res.level_titlecase == "Apply"
            assert res.display_vi == "Vận dụng"

    def test_classify_analyze_questions(self):
        samples = [
            "Hãy phân tích mối quan hệ giữa biệt thức Delta và số nghiệm của phương trình.",
            "So sánh tính biến thiên của hai hàm số bậc nhất trên cùng tập xác định.",
            "Chứng minh rằng tổng ba góc trong một tam giác luôn bằng 180 độ.",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.ANALYZE.value
            assert res.level_titlecase == "Analyze"

    def test_classify_evaluate_questions(self):
        samples = [
            "Hãy đánh giá lời giải của học sinh An và chỉ ra bước suy luận chưa chính xác.",
            "Nhận xét về tính tối ưu của phương pháp giải bằng đồ thị so với phương pháp đại số.",
            "Theo em, cách giải của bạn Bình có hợp lý không? Vì sao?",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.EVALUATE.value
            assert res.level_titlecase == "Evaluate"
            assert res.display_vi == "Đánh giá"

    def test_classify_create_questions(self):
        samples = [
            "Hãy thiết kế một bài toán thực tế sử dụng hệ bất phương trình bậc nhất hai ẩn.",
            "Hãy đề xuất giải pháp đo chiều cao của một tòa tháp bằng giác kế và thước dây.",
            "Xây dựng một thuật toán kiểm tra tính nguyên tố của số nguyên dương N.",
        ]
        for q in samples:
            res = bloom_classifier.classify_question(q)
            assert res.level == BloomLevel.CREATE.value
            assert res.level_titlecase == "Create"
            assert res.display_vi == "Sáng tạo"


# ============================================================================
# Test Suite 3: Classification Persistence & Batch Tagging (AC2)
# ============================================================================

class TestClassificationPersistenceAndDistribution:
    """AC2: Classification được lưu và tính ma trận phân bổ ma trận đề thi."""

    def test_tag_and_normalize_questions_adds_level_and_code(self):
        raw_questions = [
            {
                "question_number": 1,
                "question_text": "Liệt kê các số chẵn nhỏ hơn 10.",
                "options": ["A", "B", "C", "D"],
            },
            {
                "question_number": 2,
                "question_text": "Tính nghiệm của 3x - 6 = 0.",
                "options": ["1", "2", "3", "4"],
            },
            {
                "question_number": 3,
                "question_text": "Hãy thiết kế thí nghiệm minh họa định luật II Newton.",
                "options": None,
            },
        ]

        tagged = bloom_classifier.tag_and_normalize_questions(raw_questions)

        assert len(tagged) == 3
        # Question 1
        assert tagged[0]["bloom_taxonomy_level"] == "Remember"
        assert tagged[0]["bloom_level_code"] == "REMEMBER"
        # Question 2
        assert tagged[1]["bloom_taxonomy_level"] == "Apply"
        assert tagged[1]["bloom_level_code"] == "APPLY"
        # Question 3
        assert tagged[2]["bloom_taxonomy_level"] == "Create"
        assert tagged[2]["bloom_level_code"] == "CREATE"

    def test_calculate_bloom_distribution_computes_exact_counts(self):
        questions = [
            {"bloom_taxonomy_level": "Remember"},
            {"bloom_taxonomy_level": "Remember"},
            {"bloom_taxonomy_level": "Understand"},
            {"bloom_taxonomy_level": "Apply"},
            {"bloom_taxonomy_level": "Apply"},
            {"bloom_taxonomy_level": "Apply"},
            {"bloom_taxonomy_level": "Analyze"},
            {"bloom_taxonomy_level": "Evaluate"},
            {"bloom_taxonomy_level": "Create"},
            {"bloom_taxonomy_level": "Create"},
        ]

        dist = bloom_classifier.calculate_bloom_distribution(questions)

        assert dist["Remember"] == 2
        assert dist["Understand"] == 1
        assert dist["Apply"] == 3
        assert dist["Analyze"] == 1
        assert dist["Evaluate"] == 1
        assert dist["Create"] == 2
        # Sum of all levels must equal total questions
        assert sum(dist.values()) == 10


# ============================================================================
# Test Suite 4: Failure Handling & Graceful Degradation (AC4)
# ============================================================================

class TestClassificationFailureHandling:
    """AC4: Classification failure được xử lý an toàn, không gián đoạn hệ thống."""

    def test_empty_or_whitespace_question_handled_safely(self):
        res1 = bloom_classifier.classify_question("")
        assert res1.level == "UNDERSTAND"
        assert res1.method == "fallback"
        assert res1.confidence == 0.0

        res2 = bloom_classifier.classify_question("    \t\n  ")
        assert res2.level == "UNDERSTAND"
        assert res2.method == "fallback"

    def test_exception_in_heuristic_returns_fallback_gracefully(self):
        with patch("app.generation.bloom_classifier.classify_by_heuristic", side_effect=RuntimeError("Simulated error")):
            res = bloom_classifier.classify_question("Một câu hỏi bất kỳ")
            assert res.level == "UNDERSTAND"
            assert res.method == "fallback"
            assert "error_handled" in res.matched_indicators

    @pytest.mark.asyncio
    async def test_llm_failure_falls_back_to_heuristic(self):
        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.generate_content = AsyncMock(side_effect=AIProviderError("API Quota exceeded", provider="gemini"))

        classifier = BloomTaxonomyClassifier(provider=mock_provider)
        res = await classifier.classify_question_async(
            question_text="Hãy tính diện tích hình chữ nhật cạnh 4 và 5.",
            use_llm=True,
        )

        # Should fall back to heuristic (detected 'tính' -> Apply)
        assert res.level == BloomLevel.APPLY.value
        assert res.confidence == 0.50

    @pytest.mark.asyncio
    async def test_llm_malformed_json_falls_back_to_heuristic(self):
        mock_provider = MagicMock(spec=BaseAIProvider)
        mock_provider.generate_content = AsyncMock(return_value="Not a JSON text at all")

        classifier = BloomTaxonomyClassifier(provider=mock_provider)
        res = await classifier.classify_question_async(
            question_text="Liệt kê 3 kim loại kiềm phổ biến.",
            use_llm=True,
        )

        assert res.level == BloomLevel.REMEMBER.value


# ============================================================================
# Test Suite 5: HTTP Endpoints for Bloom Classification (BE-026)
# ============================================================================

class TestBloomClassificationHttpRoutes:
    """Verifies FastAPI HTTP endpoints for single and batch Bloom classification."""

    @pytest.mark.asyncio
    async def test_single_question_classify_endpoint_success(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "question_text": "Tính bán kính đường tròn ngoại tiếp tam giác đều cạnh a.",
                "options": ["a*sqrt(3)/3", "a/2", "a*sqrt(3)/6", "a"],
                "explanation": "Áp dụng định lý Sin: R = a / (2*sin(60)).",
            }
            res = await client.post(
                "/generation/bloom/classify",
                json=payload,
                headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
            )

            assert res.status_code == 200
            data = res.json()
            assert data["level"] == "APPLY"
            assert data["level_titlecase"] == "Apply"
            assert data["display_vi"] == "Vận dụng"
            assert data["confidence"] > 0

    @pytest.mark.asyncio
    async def test_batch_classify_endpoint_success(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "questions": [
                    {
                        "question_text": "Nêu định lý Pytago.",
                    },
                    {
                        "question_text": "Giải thích ý nghĩa định lý Pytago.",
                    },
                    {
                        "question_text": "Tính cạnh huyền tam giác vuông có hai cạnh góc vuông là 3 và 4.",
                    },
                ]
            }
            res = await client.post(
                "/generation/bloom/batch-classify",
                json=payload,
                headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
            )

            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "success"
            assert data["count"] == 3
            assert len(data["results"]) == 3
            assert data["distribution"]["Remember"] == 1
            assert data["distribution"]["Understand"] == 1
            assert data["distribution"]["Apply"] == 1

    @pytest.mark.asyncio
    async def test_unauthorized_request_rejected(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/generation/bloom/classify",
                json={"question_text": "Nêu định nghĩa véc tơ"},
                # No X-API-Key header
            )
            assert res.status_code in [401, 403]
