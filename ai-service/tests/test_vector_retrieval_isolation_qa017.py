"""
QA Automated Test Suite for [QA-017 / ATC-53 / ATC-302]:
Test Top-K Vector Retrieval & Workspace Data Isolation.

Sprint: Sprint 3 - RAG & Lesson
Acceptance Criteria:
1. Top-K trả về đúng số lượng cấu hình (Configurable Top-K: default 5, bounded min 1, max 10 per Rule 3.3).
2. Chunk liên quan được ưu tiên (Cosine similarity ranking, highest similarity first, threshold filtering).
3. Không trả dữ liệu workspace khác (STRICT SQL workspace isolation, cross-workspace leakage prevention).
4. Empty result được xử lý đúng (insufficient_evidence flag, zero matches, below-threshold handling, input validation).
"""

import math
from typing import List, Optional
from unittest.mock import AsyncMock, MagicMock, patch
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.models import DocumentChunk
from app.main import app
from app.providers.base import BaseAIProvider
from app.retrieval.schemas import RetrievalRequest, RetrievalResponse, RetrievedChunk
from app.retrieval.service import search_similar_chunks


# ------------------------------------------------------------------------------
# Test Fixtures & Mocks
# ------------------------------------------------------------------------------
class MockDeterministicEmbeddingProvider(BaseAIProvider):
    """Deterministic mock provider generating 768-dim embeddings for retrieval tests."""

    @property
    def provider_name(self) -> str:
        return "mock_deterministic"

    async def generate_structured_output(self, system_prompt, user_prompt, response_schema, context_chunks=None):
        return {}

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        results = []
        for text in texts:
            if not text.strip():
                raise ValueError("Cannot generate embedding for empty text")
            seed = sum(ord(c) for c in text) % 1000
            vector = [round(math.sin(seed + i * 0.05), 4) for i in range(768)]
            results.append(vector)
        return results


def make_chunk(
    workspace_id: uuid.UUID,
    document_id: Optional[uuid.UUID] = None,
    content: str = "Tài liệu giảng dạy",
    chunk_index: int = 0,
    source_page: int = 1,
    subject: str = "Toán",
    grade_level: str = "10",
    topic: str = "Hình học",
) -> DocumentChunk:
    """Helper to instantiate DocumentChunk model."""
    return DocumentChunk(
        id=uuid.uuid4(),
        workspace_id=workspace_id,
        document_id=document_id or uuid.uuid4(),
        content=content,
        chunk_index=chunk_index,
        source_page=source_page,
        subject=subject,
        grade_level=grade_level,
        topic=topic,
        embedding=[0.1] * 768,
        token_count=50,
    )


# ==============================================================================
# GROUP 1: Configurable Top-K Retrieval (AC-1)
# ==============================================================================
class TestTopKConfigurableRetrievalQA017:
    """AC-1: Top-K trả về đúng số lượng cấu hình"""

    @pytest.mark.asyncio
    async def test_top_k_default_returns_five_chunks(self):
        """TC-RET-01: Top-K mặc định là 5 khi không chỉ định top_k."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        chunks = [make_chunk(workspace_id=ws_id, chunk_index=i) for i in range(10)]

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(c, 0.1 * (i + 1)) for i, c in enumerate(chunks[:5])]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Định lý cosin tam giác",
            workspace_id=ws_id,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 5
        assert response.total_retrieved == 5
        assert not response.insufficient_evidence

    @pytest.mark.asyncio
    async def test_top_k_custom_parameter_honored(self):
        """TC-RET-02: Top-K trả về đúng số lượng cấu hình tuỳ chỉnh (top_k=3)."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        chunks = [make_chunk(workspace_id=ws_id, chunk_index=i) for i in range(5)]

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(c, 0.1 * (i + 1)) for i, c in enumerate(chunks[:3])]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Hàm số bậc hai",
            workspace_id=ws_id,
            top_k=3,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 3
        assert response.total_retrieved == 3

    @pytest.mark.asyncio
    async def test_top_k_bounded_to_minimum_one(self):
        """TC-RET-03: Giới hạn dưới của top_k là 1 (khi truyền 0 hoặc số âm)."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        chunk = make_chunk(workspace_id=ws_id)

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(chunk, 0.2)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Véc tơ không gian",
            workspace_id=ws_id,
            top_k=0,
            provider=provider,
            session=mock_session,
        )

        stmt = mock_session.execute.call_args[0][0]
        # SQL limit clause should be 1
        assert stmt._limit == 1
        assert len(response.chunks) == 1

    @pytest.mark.asyncio
    async def test_top_k_bounded_to_maximum_ten(self):
        """TC-RET-04: Giới hạn trên của top_k là 10 (theo Rule 3.3)."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        await search_similar_chunks(
            query="Phương trình đường tròn",
            workspace_id=ws_id,
            top_k=50,
            provider=provider,
            session=mock_session,
        )

        stmt = mock_session.execute.call_args[0][0]
        # SQL limit clause should be capped at 10
        assert stmt._limit == 10


# ==============================================================================
# GROUP 2: Relevance Prioritization & Provenance Retention (AC-2)
# ==============================================================================
class TestRelevancePrioritizationQA017:
    """AC-2: Chunk liên quan được ưu tiên"""

    @pytest.mark.asyncio
    async def test_chunks_ordered_by_descending_similarity(self):
        """TC-RET-05: Chunks được sắp xếp theo độ tương đồng giảm dần (khoảng cách tăng dần)."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()

        c1 = make_chunk(workspace_id=ws_id, content="Khớp nhất", chunk_index=1)
        c2 = make_chunk(workspace_id=ws_id, content="Khớp vừa", chunk_index=2)
        c3 = make_chunk(workspace_id=ws_id, content="Khớp ít", chunk_index=3)

        mock_session = AsyncMock()
        mock_result = MagicMock()
        # Cosine distance: 0.1 (sim 0.9), 0.25 (sim 0.75), 0.4 (sim 0.6)
        mock_result.all.return_value = [(c1, 0.1), (c2, 0.25), (c3, 0.4)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Toán giải tích",
            workspace_id=ws_id,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 3
        assert response.chunks[0].similarity_score == 0.90
        assert response.chunks[1].similarity_score == 0.75
        assert response.chunks[2].similarity_score == 0.60
        assert response.chunks[0].content == "Khớp nhất"

    @pytest.mark.asyncio
    async def test_similarity_threshold_filters_out_low_relevance_chunks(self):
        """TC-RET-06: Ngưỡng tương đồng (similarity_threshold) lọc bỏ các chunk không đạt yêu cầu."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()

        c_high = make_chunk(workspace_id=ws_id, content="Rất liên quan", chunk_index=1)
        c_low = make_chunk(workspace_id=ws_id, content="Không liên quan", chunk_index=2)

        mock_session = AsyncMock()
        mock_result = MagicMock()
        # distance 0.2 -> sim 0.8; distance 0.8 -> sim 0.2
        mock_result.all.return_value = [(c_high, 0.2), (c_low, 0.8)]
        mock_session.execute.return_value = mock_result

        # Ngưỡng 0.5: c_high (0.8 >= 0.5) giữ lại, c_low (0.2 < 0.5) bị loại bỏ
        response = await search_similar_chunks(
            query="Tích phân",
            workspace_id=ws_id,
            similarity_threshold=0.5,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 1
        assert response.chunks[0].content == "Rất liên quan"
        assert response.chunks[0].similarity_score == 0.8

    @pytest.mark.asyncio
    async def test_retrieved_chunk_preserves_full_grounding_metadata(self):
        """TC-RET-07: Chunk trả về lưu giữ đầy đủ metadata trích dẫn (document_id, source_page, index)."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        doc_id = uuid.uuid4()

        chunk = make_chunk(
            workspace_id=ws_id,
            document_id=doc_id,
            content="Đoạn văn trang 42",
            chunk_index=7,
            source_page=42,
            subject="Vật lý",
            grade_level="11",
            topic="Điện từ học",
        )

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(chunk, 0.15)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Từ trường",
            workspace_id=ws_id,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 1
        item = response.chunks[0]
        assert item.id == chunk.id
        assert item.document_id == doc_id
        assert item.source_page == 42
        assert item.chunk_index == 7
        assert item.subject == "Vật lý"
        assert item.grade_level == "11"
        assert item.topic == "Điện từ học"
        assert item.similarity_score == 0.85

    @pytest.mark.asyncio
    async def test_query_embedding_dense_vector_generated(self):
        """TC-RET-08: Query embedding được tạo thành công với đúng kích thước vector 768."""
        provider = MockDeterministicEmbeddingProvider()
        embeddings = await provider.generate_embeddings(["Định luật Ôm"])

        assert len(embeddings) == 1
        assert len(embeddings[0]) == 768
        assert all(isinstance(val, float) for val in embeddings[0])


# ==============================================================================
# GROUP 3: Strict Multi-Tenant Workspace Data Isolation (AC-3)
# ==============================================================================
class TestWorkspaceDataIsolationQA017:
    """AC-3: Không trả dữ liệu workspace khác"""

    @pytest.mark.asyncio
    async def test_sql_filter_strictly_enforces_workspace_id(self):
        """TC-RET-09: Câu lệnh SQL luôn bắt buộc lọc theo workspace_id."""
        provider = MockDeterministicEmbeddingProvider()
        target_ws = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        await search_similar_chunks(
            query="Quang hợp",
            workspace_id=target_ws,
            provider=provider,
            session=mock_session,
        )

        stmt = mock_session.execute.call_args[0][0]
        where_sql = str(stmt.whereclause)
        assert "document_chunks.workspace_id = :workspace_id_1" in where_sql

    @pytest.mark.asyncio
    async def test_cross_workspace_data_never_leaked(self):
        """TC-RET-10: Tuyệt đối không trả về chunk thuộc workspace khác kể cả khi độ tương đồng cao."""
        provider = MockDeterministicEmbeddingProvider()
        ws_a = uuid.uuid4()
        ws_b = uuid.uuid4()

        # Chunk ở Workspace B (nội dung trùng khớp hoàn toàn)
        chunk_b = make_chunk(workspace_id=ws_b, content="Tài liệu bí mật của trường B")

        async def fake_execute(stmt):
            # Mô phỏng database chỉ trả về rows khớp workspace_id của truy vấn
            ws_param = stmt.compile().params.get("workspace_id_1")
            mock_res = MagicMock()
            if ws_param == ws_a:
                mock_res.all.return_value = []  # Không có dữ liệu ở Workspace A
            else:
                mock_res.all.return_value = [(chunk_b, 0.05)]
            return mock_res

        mock_session = AsyncMock()
        mock_session.execute.side_effect = fake_execute

        # Giáo viên trường A tìm kiếm
        response_a = await search_similar_chunks(
            query="Tài liệu bí mật",
            workspace_id=ws_a,
            provider=provider,
            session=mock_session,
        )

        # Giáo viên A nhận kết quả rỗng, KHÔNG lộ dữ liệu trường B
        assert len(response_a.chunks) == 0
        assert response_a.insufficient_evidence

    @pytest.mark.asyncio
    async def test_multi_tenant_concurrent_isolation(self):
        """TC-RET-11: Cách ly đồng thời giữa nhiều tenant truy vấn song song."""
        provider = MockDeterministicEmbeddingProvider()
        ws_1 = uuid.uuid4()
        ws_2 = uuid.uuid4()

        c1 = make_chunk(workspace_id=ws_1, content="Giáo án Lịch sử Trường 1")
        c2 = make_chunk(workspace_id=ws_2, content="Giáo án Lịch sử Trường 2")

        async def dynamic_execute(stmt):
            ws_val = stmt.compile().params.get("workspace_id_1")
            mock_res = MagicMock()
            if ws_val == ws_1:
                mock_res.all.return_value = [(c1, 0.1)]
            elif ws_val == ws_2:
                mock_res.all.return_value = [(c2, 0.1)]
            else:
                mock_res.all.return_value = []
            return mock_res

        session_1 = AsyncMock()
        session_1.execute.side_effect = dynamic_execute
        session_2 = AsyncMock()
        session_2.execute.side_effect = dynamic_execute

        resp_1 = await search_similar_chunks("Lịch sử", workspace_id=ws_1, provider=provider, session=session_1)
        resp_2 = await search_similar_chunks("Lịch sử", workspace_id=ws_2, provider=provider, session=session_2)

        assert resp_1.chunks[0].content == "Giáo án Lịch sử Trường 1"
        assert resp_2.chunks[0].content == "Giáo án Lịch sử Trường 2"

    @pytest.mark.asyncio
    async def test_metadata_filtering_within_isolated_workspace(self):
        """TC-RET-12: Lọc thêm metadata (document_ids, subject, grade, topic) trong ranh giới workspace."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        doc_1 = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        await search_similar_chunks(
            query="Phương trình ion",
            workspace_id=ws_id,
            document_ids=[doc_1],
            subject="Hóa học",
            grade_level="11",
            topic="Sự điện li",
            provider=provider,
            session=mock_session,
        )

        stmt = mock_session.execute.call_args[0][0]
        where_sql = str(stmt.whereclause)
        assert "document_chunks.workspace_id = :workspace_id_1" in where_sql
        assert "document_chunks.document_id IN" in where_sql
        assert "document_chunks.subject = :subject_1" in where_sql
        assert "document_chunks.grade_level = :grade_level_1" in where_sql
        assert "document_chunks.topic = :topic_1" in where_sql


# ==============================================================================
# GROUP 4: Empty Result Handling & Input Validation (AC-4)
# ==============================================================================
class TestEmptyResultAndInputValidationQA017:
    """AC-4: Empty result được xử lý đúng"""

    @pytest.mark.asyncio
    async def test_zero_matches_sets_insufficient_evidence_flag(self):
        """TC-RET-13: Khi không có chunk nào khớp, trả về chunks=[] và insufficient_evidence=True."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Kiến thức chưa tải lên",
            workspace_id=ws_id,
            provider=provider,
            session=mock_session,
        )

        assert response.insufficient_evidence is True
        assert len(response.chunks) == 0
        assert response.total_retrieved == 0
        assert response.query == "Kiến thức chưa tải lên"

    @pytest.mark.asyncio
    async def test_all_chunks_below_threshold_sets_insufficient_evidence(self):
        """TC-RET-14: Khi tất cả chunk có điểm dưới ngưỡng, loại bỏ toàn bộ và báo insufficient_evidence=True."""
        provider = MockDeterministicEmbeddingProvider()
        ws_id = uuid.uuid4()
        chunk = make_chunk(workspace_id=ws_id, content="Nội dung không liên quan")

        mock_session = AsyncMock()
        mock_result = MagicMock()
        # Cosine distance 0.85 -> similarity = 0.15 (rất thấp)
        mock_result.all.return_value = [(chunk, 0.85)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Chủ đề khác biệt",
            workspace_id=ws_id,
            similarity_threshold=0.30,
            provider=provider,
            session=mock_session,
        )

        assert response.insufficient_evidence is True
        assert len(response.chunks) == 0
        assert response.total_retrieved == 0

    @pytest.mark.asyncio
    async def test_empty_query_raises_value_error(self):
        """TC-RET-15: Truy vấn rỗng hoặc toàn khoảng trắng ném ValueError."""
        ws_id = uuid.uuid4()
        with pytest.raises(ValueError) as exc:
            await search_similar_chunks(query="   ", workspace_id=ws_id)
        assert "Query string cannot be empty" in str(exc.value)

    @pytest.mark.asyncio
    async def test_invalid_workspace_uuid_raises_value_error(self):
        """TC-RET-16: workspace_id không phải UUID hợp lệ ném ValueError."""
        with pytest.raises(ValueError) as exc:
            await search_similar_chunks(query="Toán", workspace_id="invalid-uuid-string")
        assert "Invalid workspace_id UUID" in str(exc.value)

    @pytest.mark.asyncio
    async def test_api_endpoint_retrieval_search_contract_success(self):
        """TC-RET-17: API POST /retrieval/search trả về JSON chuẩn theo schema RetrievalResponse."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
            payload = {
                "query": "Hàm số lượng giác",
                "workspace_id": "11111111-1111-1111-1111-111111111111",
                "top_k": 5,
                "similarity_threshold": 0.3,
            }

            fake_response = RetrievalResponse(
                chunks=[],
                insufficient_evidence=True,
                query="Hàm số lượng giác",
                total_retrieved=0,
            )

            with patch("app.api.routes.retrieval.search_similar_chunks", new_callable=AsyncMock) as mock_search:
                mock_search.return_value = fake_response

                resp = await client.post("/retrieval/search", json=payload, headers=headers)
                assert resp.status_code == 200
                data = resp.json()
                assert data["insufficient_evidence"] is True
                assert data["total_retrieved"] == 0
                assert data["query"] == "Hàm số lượng giác"
                assert "chunks" in data

    @pytest.mark.asyncio
    async def test_api_endpoint_retrieval_search_missing_auth_returns_401(self):
        """TC-RET-18: API POST /retrieval/search thiếu X-API-Key bị từ chối HTTP 401 Unauthorized."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "query": "Toán 10",
                "workspace_id": "11111111-1111-1111-1111-111111111111",
            }
            resp = await client.post("/retrieval/search", json=payload)
            assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_api_endpoint_retrieval_search_invalid_uuid_returns_422(self):
        """TC-RET-19: API POST /retrieval/search workspace_id không đúng định dạng UUID trả về HTTP 422."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
            payload = {
                "query": "Đạo hàm",
                "workspace_id": "not-a-valid-uuid",
            }
            resp = await client.post("/retrieval/search", json=payload, headers=headers)
            assert resp.status_code == 422
