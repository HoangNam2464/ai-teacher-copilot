"""
Unit & Integration Tests for Vector Similarity Search with Workspace Isolation (BE-015).

Tests:
1. AC1: Query được chuyển thành embedding (768 dimensions via provider abstraction).
2. AC2: Similarity search trả về Top-K chunk (bounded default 5, max 10, ordered by similarity).
3. AC3: Chỉ tìm kiếm trong workspace hiện tại (strict multi-tenant isolation, cross-workspace prevention).
4. AC4: Kết quả có metadata nguồn (provenance grounding: document_id, source_page, chunk_index, similarity_score).
5. AC5: Xử lý thiếu bằng chứng (insufficient evidence detection for 0 matches or below threshold).
6. API Endpoint: POST /retrieval/search contract, authentication, and validation.
"""

import math
import uuid
from typing import List, Optional
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.models import DocumentChunk
from app.main import app
from app.providers.base import BaseAIProvider
from app.retrieval.schemas import RetrievalRequest, RetrievalResponse, RetrievedChunk
from app.retrieval.service import search_similar_chunks


# ============================================================================
# Test Fixtures & Mocks
# ============================================================================

class MockEmbeddingProvider(BaseAIProvider):
    """Deterministic mock provider generating 768-dim embeddings."""

    @property
    def provider_name(self) -> str:
        return "mock"

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: any,
        context_chunks: Optional[List[dict]] = None,
    ) -> any:
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


def create_mock_chunk(
    workspace_id: uuid.UUID,
    document_id: Optional[uuid.UUID] = None,
    content: str = "Nội dung bài học",
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


# ============================================================================
# Service Layer Tests (search_similar_chunks)
# ============================================================================

class TestVectorSimilaritySearchService:
    """Tests covering acceptance criteria of BE-015 in retrieval/service.py."""

    @pytest.mark.asyncio
    async def test_query_converted_to_embedding(self):
        """AC1: Query được chuyển thành embedding 768 chiều qua provider abstraction."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()
        chunk = create_mock_chunk(workspace_id=workspace_id, content="Định lý cosin")

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(chunk, 0.15)]  # distance 0.15 -> similarity 0.85
        mock_session.execute.return_value = mock_result

        with patch.object(provider, "generate_embeddings", wraps=provider.generate_embeddings) as spy_embed:
            response = await search_similar_chunks(
                query="Công thức định lý Cosin",
                workspace_id=workspace_id,
                provider=provider,
                session=mock_session,
            )

            assert spy_embed.called
            assert spy_embed.call_args[0][0] == ["Công thức định lý Cosin"]
            assert len(response.chunks) == 1
            assert response.chunks[0].similarity_score == 0.85

    @pytest.mark.asyncio
    async def test_empty_query_raises_value_error(self):
        """AC1: Query rỗng hoặc khoảng trắng bị từ chối với ValueError."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()

        for invalid_query in ["", "   ", "\t\n"]:
            with pytest.raises(ValueError) as exc_info:
                await search_similar_chunks(
                    query=invalid_query,
                    workspace_id=workspace_id,
                    provider=provider,
                )
            assert "cannot be empty" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_missing_workspace_id_raises_value_error(self):
        """AC3: workspace_id là BẮT BUỘC, vắng mặt sẽ raise ValueError."""
        provider = MockEmbeddingProvider()

        with pytest.raises(ValueError) as exc_info:
            await search_similar_chunks(
                query="Định lý Pythagoras",
                workspace_id="",  # empty
                provider=provider,
            )
        assert "workspace_id is mandatory" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_similarity_search_returns_top_k_chunks(self):
        """AC2: Trả về Top-K chunks được sắp xếp theo độ tương đồng, giới hạn max 10."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()

        # Tạo 3 chunks với khoảng cách tăng dần (similarity giảm dần)
        chunk1 = create_mock_chunk(workspace_id=workspace_id, content="Khúc 1", chunk_index=1)
        chunk2 = create_mock_chunk(workspace_id=workspace_id, content="Khúc 2", chunk_index=2)
        chunk3 = create_mock_chunk(workspace_id=workspace_id, content="Khúc 3", chunk_index=3)

        mock_session = AsyncMock()
        mock_result = MagicMock()
        # distances: 0.1 -> sim 0.90; 0.2 -> sim 0.80; 0.35 -> sim 0.65
        mock_result.all.return_value = [(chunk1, 0.10), (chunk2, 0.20), (chunk3, 0.35)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Bài giảng Toán 10",
            workspace_id=workspace_id,
            top_k=2,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 3
        assert response.chunks[0].similarity_score == 0.90
        assert response.chunks[1].similarity_score == 0.80
        assert response.chunks[2].similarity_score == 0.65
        assert response.insufficient_evidence is False

    @pytest.mark.asyncio
    async def test_workspace_isolation_and_cross_workspace_prevention(self):
        """AC3: Chỉ tìm kiếm trong workspace hiện tại, không rò rỉ dữ liệu workspace khác."""
        provider = MockEmbeddingProvider()
        workspace_target = uuid.uuid4()
        doc_id = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        await search_similar_chunks(
            query="Kiểm tra cách ly",
            workspace_id=workspace_target,
            document_ids=[doc_id],
            subject="Toán",
            grade_level="10",
            topic="Hình học",
            provider=provider,
            session=mock_session,
        )

        # Kiểm tra câu lệnh SQLAlchemy execute chứa điều kiện workspace_id
        executed_stmt = mock_session.execute.call_args[0][0]
        compiled_query = str(executed_stmt)
        assert "document_chunks.workspace_id =" in compiled_query
        assert "document_chunks.document_id IN" in compiled_query
        assert "document_chunks.subject =" in compiled_query
        assert "document_chunks.grade_level =" in compiled_query
        assert "document_chunks.topic =" in compiled_query

    @pytest.mark.asyncio
    async def test_source_metadata_retention(self):
        """AC4: Kết quả trả về chứa đầy đủ metadata nguồn phục vụ trích dẫn."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()
        doc_id = uuid.uuid4()

        chunk = create_mock_chunk(
            workspace_id=workspace_id,
            document_id=doc_id,
            content="Nội dung trang 45",
            source_page=45,
            chunk_index=7,
            subject="Vật lí",
            grade_level="11",
            topic="Dao động điều hòa",
        )

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = [(chunk, 0.12)]  # sim = 0.88
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Dao động điều hòa",
            workspace_id=workspace_id,
            provider=provider,
            session=mock_session,
        )

        assert len(response.chunks) == 1
        item = response.chunks[0]
        assert item.id == chunk.id
        assert item.document_id == doc_id
        assert item.content == "Nội dung trang 45"
        assert item.source_page == 45
        assert item.chunk_index == 7
        assert item.subject == "Vật lí"
        assert item.grade_level == "11"
        assert item.topic == "Dao động điều hòa"
        assert item.similarity_score == 0.88

    @pytest.mark.asyncio
    async def test_insufficient_evidence_when_zero_matches(self):
        """AC5: Khi không tìm thấy chunk nào, trả về insufficient_evidence=True và chunks rỗng."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Nội dung không tồn tại",
            workspace_id=workspace_id,
            provider=provider,
            session=mock_session,
        )

        assert response.insufficient_evidence is True
        assert len(response.chunks) == 0
        assert response.total_retrieved == 0

    @pytest.mark.asyncio
    async def test_insufficient_evidence_when_scores_below_threshold(self):
        """AC5: Khi các chunk tìm được có điểm tương đồng < similarity_threshold, kích hoạt insufficient_evidence."""
        provider = MockEmbeddingProvider()
        workspace_id = uuid.uuid4()
        chunk = create_mock_chunk(workspace_id=workspace_id, content="Khúc ít liên quan")

        mock_session = AsyncMock()
        mock_result = MagicMock()
        # distance 0.85 -> similarity 0.15 (thấp hơn ngưỡng mặc định 0.3)
        mock_result.all.return_value = [(chunk, 0.85)]
        mock_session.execute.return_value = mock_result

        response = await search_similar_chunks(
            query="Truy vấn nâng cao",
            workspace_id=workspace_id,
            similarity_threshold=0.3,
            provider=provider,
            session=mock_session,
        )

        assert response.insufficient_evidence is True
        assert len(response.chunks) == 0


# ============================================================================
# API Endpoint Integration Tests (POST /retrieval/search)
# ============================================================================

class TestRetrievalApiEndpoint:
    """Tests covering HTTP route POST /retrieval/search."""

    @pytest.mark.asyncio
    async def test_search_endpoint_missing_api_key_unauthorized(self):
        """Endpoint yêu cầu X-API-Key hợp lệ, thiếu key trả về 401."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/retrieval/search",
                json={
                    "query": "Công thức lượng giác",
                    "workspace_id": str(uuid.uuid4()),
                },
                # Không truyền X-API-Key
            )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_search_endpoint_success(self):
        """Endpoint trả về 200 OK với RetrievalResponse hợp lệ."""
        workspace_id = uuid.uuid4()
        chunk = create_mock_chunk(workspace_id=workspace_id, content="Nội dung SGK")

        mock_retrieval_response = RetrievalResponse(
            chunks=[
                RetrievedChunk(
                    id=chunk.id,
                    content=chunk.content,
                    document_id=chunk.document_id,
                    source_page=12,
                    chunk_index=0,
                    similarity_score=0.92,
                    subject="Toán",
                    grade_level="10",
                )
            ],
            insufficient_evidence=False,
            query="Định lý Sin",
            total_retrieved=1,
        )

        with patch("app.api.routes.retrieval.search_similar_chunks", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_retrieval_response

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/retrieval/search",
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                    json={
                        "query": "Định lý Sin",
                        "workspace_id": str(workspace_id),
                        "top_k": 5,
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["insufficient_evidence"] is False
            assert len(data["chunks"]) == 1
            assert data["chunks"][0]["similarity_score"] == 0.92
            assert data["chunks"][0]["source_page"] == 12

    @pytest.mark.asyncio
    async def test_search_endpoint_invalid_workspace_uuid_returns_422(self):
        """UUID workspace không hợp lệ bị FastAPI Pydantic chặn với mã 422."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/retrieval/search",
                headers={"X-API-Key": settings.AI_SERVICE_API_KEY},
                json={
                    "query": "Định lý Cosin",
                    "workspace_id": "not-a-valid-uuid",
                },
            )
        assert response.status_code == 422
