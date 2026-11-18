"""
Unit & Integration Tests for Assessment Rubric Generation Pipeline (BE-029 / ATC-94 / ATC-405).

Acceptance Criteria Verified:
1. Rubric được sinh theo schema (RubricSchema, RubricCriterion, RubricScoreLevel).
2. Criteria đầy đủ (name, description, weight, descriptors mapping L4-L1).
3. Score levels hợp lệ (L4: Xuất sắc, L3: Tốt/Khá, L2: Đạt/TB, L1: Cần cố gắng).
4. Curriculum alignment được thể hiện (GDPT 2018).
5. Weight normalization (tổng trọng số các tiêu chí luôn bằng 100%).
6. RAG Provenance & Prompt Security (<sources> boundary, source_chunk_ids).
7. Anti-hallucination / Insufficient Evidence handling (HTTP 422).
"""

from typing import Any, Dict, List
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.rubric_generator import (
    DEFAULT_RUBRIC_SYSTEM_INSTRUCTION,
    STANDARD_RUBRIC_LEVELS,
    RubricGeneratorPipeline,
)
from app.generation.schemas import (
    RubricCriterion,
    RubricGenerationRequest,
    RubricSchema,
    RubricScoreLevel,
)
from app.main import app
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError, RateLimitError
from app.retrieval.schemas import RetrievalResponse, RetrievedChunk


# ============================================================================
# Helpers & Test Fixtures
# ============================================================================

def make_sample_rubric_request(
    workspace_id: uuid.UUID = None,
    num_criteria: int = 3,
) -> RubricGenerationRequest:
    return RubricGenerationRequest(
        workspace_id=workspace_id or uuid.uuid4(),
        subject="Toán học",
        grade_level="10",
        topic="Khảo sát hàm số bậc hai và ứng dụng thực tế",
        objectives=["Vẽ parabol chính xác", "Xác định đỉnh và trục đối xứng", "Giải bài toán thực tế tối ưu hóa"],
        instructions="Đánh giá dự án mô hình chuyển động parabol",
        num_criteria=num_criteria,
        scale_type="PERCENTAGE",
    )


def make_retrieval_response(workspace_id: uuid.UUID, chunk_id: uuid.UUID = None) -> RetrievalResponse:
    cid = chunk_id or uuid.uuid4()
    doc_id = uuid.uuid4()
    return RetrievalResponse(
        chunks=[
            RetrievedChunk(
                id=cid,
                document_id=doc_id,
                content="Chủ đề Hàm số bậc hai: Yêu cầu học sinh nhận biết hình dạng parabol, xác định đỉnh (-b/2a, -delta/4a), trục đối xứng x = -b/2a và vận dụng giải quyết bài toán cực trị.",
                chunk_index=0,
                source_page=15,
                similarity_score=0.88,
                metadata={"title": "SGK Toán 10 Chân Trời Sáng Tạo"},
            )
        ],
        insufficient_evidence=False,
        query="Toán 10 Hàm số bậc hai",
        total_retrieved=1,
    )


def make_sample_rubric_response(chunk_id_str: str) -> RubricSchema:
    return RubricSchema(
        title="Ma trận Rubric Đánh giá Dự án Hàm số bậc hai",
        subject="Toán học",
        grade_level="10",
        topic="Khảo sát hàm số bậc hai và ứng dụng thực tế",
        description="Rubric đánh giá năng lực giải quyết vấn đề toán học thông qua mô hình parabol thực tế.",
        scale_type="PERCENTAGE",
        levels=STANDARD_RUBRIC_LEVELS,
        criteria=[
            RubricCriterion(
                id="crit-1",
                name="Mô hình toán học và đồ thị",
                description="Khả năng thiết lập hàm số bậc hai và vẽ đồ thị parabol chính xác.",
                weight=30,
                descriptors={
                    "L4": "Thiết lập đúng hàm số, vẽ parabol hoàn hảo với đầy đủ đỉnh, trục đối xứng và bảng giá trị.",
                    "L3": "Thiết lập đúng hàm số, vẽ parabol cơ bản đúng nhưng thiếu một số điểm đặc biệt.",
                    "L2": "Thiết lập hàm số có sai sót nhỏ, hình dạng parabol chưa thật chính xác.",
                    "L1": "Chưa thiết lập được hàm số hoặc vẽ parabol sai hoàn toàn.",
                },
                curriculum_alignment="YCCĐ: Vẽ được đồ thị hàm số bậc hai y = ax^2 + bx + c.",
            ),
            RubricCriterion(
                id="crit-2",
                name="Phân tích điểm cực trị và tối ưu",
                description="Tính toán đỉnh parabol và giải thích ý nghĩa thực tế của giá trị lớn nhất / nhỏ nhất.",
                weight=40,
                descriptors={
                    "L4": "Xác định chính xác tọa độ đỉnh và giải thích trọn vẹn ý nghĩa cực trị trong bối cảnh thực tế.",
                    "L3": "Tính đúng đỉnh nhưng phần giải thích ý nghĩa thực tế còn sơ sài.",
                    "L2": "Tính toán tọa độ đỉnh có sai số tính toán, hiểu chưa sâu ý nghĩa cực trị.",
                    "L1": "Không tính được tọa độ đỉnh parabol.",
                },
                curriculum_alignment="YCCĐ: Vận dụng được kiến thức hàm số bậc hai vào giải quyết bài toán thực tiễn.",
            ),
            RubricCriterion(
                id="crit-3",
                name="Báo cáo và trình bày kết quả",
                description="Kỹ năng thuyết minh và đối chiếu mô hình toán học với thực nghiệm.",
                weight=30,
                descriptors={
                    "L4": "Báo cáo rõ ràng, lập luận logic, trực quan sinh động và đối chiếu thực nghiệm chặt chẽ.",
                    "L3": "Báo cáo đầy đủ nội dung, lập luận hợp lý nhưng trình bày chưa cuốn hút.",
                    "L2": "Báo cáo sơ lược, lập luận còn thiếu sót.",
                    "L1": "Báo cáo cẩu thả, không hoàn thành yêu cầu tối thiểu.",
                },
                curriculum_alignment="YCCĐ: Năng lực giao tiếp và hợp tác toán học.",
            ),
        ],
        curriculum_alignment="Chương trình GDPT 2018 môn Toán cấp THPT - Chủ đề Hàm số và Đồ thị.",
        source_chunk_ids=[chunk_id_str],
    )


# ============================================================================
# Unit Tests: Rubric Generator Pipeline
# ============================================================================

@pytest.mark.asyncio
async def test_rubric_pipeline_success():
    """AC1-AC5: Successfully generate rubric conforming to schema, normalized weights, and citations."""
    ws_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    req = make_sample_rubric_request(ws_id, num_criteria=3)

    mock_provider = MagicMock(spec=BaseAIProvider)
    sample_rubric = make_sample_rubric_response(str(chunk_id))
    # Test weight normalization if raw output doesn't sum to 100
    sample_rubric.criteria[0].weight = 50
    sample_rubric.criteria[1].weight = 30
    sample_rubric.criteria[2].weight = 10  # sum = 90
    mock_provider.generate_structured_output = AsyncMock(return_value=sample_rubric)

    pipeline = RubricGeneratorPipeline(provider=mock_provider)

    with patch("app.generation.rubric_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = make_retrieval_response(ws_id, chunk_id=chunk_id)

        rubric = await pipeline.generate_rubric(req)

        # 1. Rubric Schema adherence
        assert isinstance(rubric, RubricSchema)
        assert rubric.title != ""
        assert rubric.subject == "Toán học"
        assert rubric.grade_level == "10"
        assert len(rubric.levels) == 4
        level_ids = [lvl.id for lvl in rubric.levels]
        assert level_ids == ["L4", "L3", "L2", "L1"]

        # 2. Criteria completeness
        assert len(rubric.criteria) == 3
        for crit in rubric.criteria:
            assert crit.id != ""
            assert crit.name != ""
            assert crit.description != ""
            assert len(crit.descriptors) == 4
            assert all(k in crit.descriptors for k in ("L4", "L3", "L2", "L1"))

        # 3. Weight normalization
        total_weight = sum(c.weight for c in rubric.criteria)
        assert total_weight == 100

        # 4. Curriculum alignment & citation
        assert rubric.curriculum_alignment is not None
        assert str(chunk_id) in rubric.source_chunk_ids

        # 5. Verify prompt security boundary
        call_args = mock_provider.generate_structured_output.call_args
        prompt = call_args.kwargs.get("user_prompt") or call_args.kwargs.get("prompt")
        assert prompt is not None
        assert "<sources>" in prompt
        assert "</sources>" in prompt


@pytest.mark.asyncio
async def test_rubric_pipeline_insufficient_evidence():
    """Rule 7.7: Throw InsufficientEvidenceError when RAG retrieval is empty or weak."""
    ws_id = uuid.uuid4()
    req = make_sample_rubric_request(ws_id)

    mock_provider = MagicMock(spec=BaseAIProvider)
    pipeline = RubricGeneratorPipeline(provider=mock_provider)

    with patch("app.generation.rubric_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = RetrievalResponse(
            chunks=[],
            insufficient_evidence=True,
            query="Toán 10",
            total_retrieved=0,
        )

        with pytest.raises(InsufficientEvidenceError) as exc_info:
            await pipeline.generate_rubric(req)

        assert exc_info.value.error_code == "INSUFFICIENT_EVIDENCE"
        mock_provider.generate_structured_output.assert_not_called()


@pytest.mark.asyncio
async def test_rubric_pipeline_provider_error():
    """Provider exceptions propagate cleanly."""
    ws_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    req = make_sample_rubric_request(ws_id)

    mock_provider = MagicMock(spec=BaseAIProvider)
    mock_provider.generate_structured_output = AsyncMock(
        side_effect=RateLimitError(provider="gemini", message="Quota exceeded")
    )

    pipeline = RubricGeneratorPipeline(provider=mock_provider)

    with patch("app.generation.rubric_generator.search_similar_chunks", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = make_retrieval_response(ws_id, chunk_id=chunk_id)

        with pytest.raises(AIProviderError) as exc_info:
            await pipeline.generate_rubric(req)

        assert exc_info.value.provider == "gemini"


# ============================================================================
# API Endpoint Integration Tests (POST /generation/rubric)
# ============================================================================

@pytest.mark.asyncio
async def test_api_generate_rubric_success_with_body():
    """Verify POST /generation/rubric with JSON body returns 200 and structured data."""
    ws_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    sample_rubric = make_sample_rubric_response(str(chunk_id))

    headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
    payload = {
        "workspace_id": str(ws_id),
        "subject": "Toán học",
        "grade_level": "10",
        "topic": "Hàm số bậc hai",
        "num_criteria": 3,
        "scale_type": "PERCENTAGE",
    }

    with patch("app.api.routes.generation.rubric_generator_pipeline.generate_rubric", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = sample_rubric

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/generation/rubric", json=payload, headers=headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["content_type"] == "rubric"
        assert data["data"]["title"] == sample_rubric.title
        assert len(data["data"]["criteria"]) == 3
        assert len(data["data"]["levels"]) == 4


@pytest.mark.asyncio
async def test_api_generate_rubric_insufficient_evidence():
    """Verify POST /generation/rubric returns 422 on insufficient context."""
    ws_id = uuid.uuid4()
    headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
    payload = {
        "workspace_id": str(ws_id),
        "subject": "Vật lý",
        "grade_level": "11",
        "topic": "Thuyết tương đối hẹp",
    }

    with patch(
        "app.api.routes.generation.rubric_generator_pipeline.generate_rubric",
        new_callable=AsyncMock,
        side_effect=InsufficientEvidenceError("No curriculum materials found"),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/generation/rubric", json=payload, headers=headers)

        assert resp.status_code == 422
        assert resp.json()["detail"]["error_code"] == "INSUFFICIENT_EVIDENCE"


@pytest.mark.asyncio
async def test_api_generate_rubric_missing_fields_query_params():
    """Verify missing required fields in query params returns 400."""
    headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # No payload and no params
        resp = await client.post("/generation/rubric", headers=headers)

    assert resp.status_code == 400
    assert "Missing required fields" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_api_generate_rubric_unauthorized():
    """Verify request without valid API key returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/generation/rubric", json={})

    assert resp.status_code == 401
