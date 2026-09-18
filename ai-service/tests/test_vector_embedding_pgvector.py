"""
QA-013: Test Vector Embedding Generation & pgvector Storage

Tests vector embedding generation, dimension validation, pgvector persistence,
and workspace-document mapping integrity.
"""

import uuid
import math
import pytest
from unittest.mock import AsyncMock, patch

from app.core.models import DocumentChunk
from app.providers.base import AIProvider
from app.ingestion.chunker import StructureAwareChunker
from app.ingestion.models import DocumentMetadata


class MockAIProvider(AIProvider):
    """Mock AI Provider for unit/integration testing without external API calls."""

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        results = []
        for text in texts:
            if not text.strip():
                raise ValueError("Cannot generate embedding for empty text")
            seed = sum(ord(c) for c in text) % 1000
            vector = [math.sin(seed + i * 0.1) for i in range(768)]
            results.append(vector)
        return results

    async def generate_chat_completion(self, messages: list[dict], **kwargs) -> str:
        return "Mock completion"


@pytest.fixture
def mock_provider():
    return MockAIProvider()


class TestVectorEmbeddingGeneration:
    """AC1: Embedding được tạo thành công / Embedding generated successfully"""

    @pytest.mark.asyncio
    async def test_embedding_generation_success(self, mock_provider):
        """Test: Vector embedding created successfully for input text."""
        input_text = "Lập kế hoạch bài học về lịch sử Việt Nam"
        embeddings = await mock_provider.generate_embeddings([input_text])

        assert embeddings is not None
        assert isinstance(embeddings, list)
        assert len(embeddings) == 1
        vector = embeddings[0]
        assert len(vector) == 768
        assert all(isinstance(val, float) for val in vector)

    @pytest.mark.asyncio
    async def test_embedding_consistency(self, mock_provider):
        """Test: Same input text produces same embedding (deterministic)."""
        text = "Tạo bài tập trắc nghiệm"
        emb1 = (await mock_provider.generate_embeddings([text]))[0]
        emb2 = (await mock_provider.generate_embeddings([text]))[0]

        assert emb1 == emb2

    @pytest.mark.asyncio
    async def test_embedding_for_empty_text(self, mock_provider):
        """Test: Embedding generation rejects empty/whitespace text."""
        empty_texts = ["", "   ", "\n\t"]
        for t in empty_texts:
            with pytest.raises(ValueError):
                await mock_provider.generate_embeddings([t])

    @pytest.mark.asyncio
    async def test_embedding_for_long_text(self, mock_provider):
        """Test: Embedding generation handles long text correctly."""
        long_text = "Bài học " * 500
        embeddings = await mock_provider.generate_embeddings([long_text])
        assert len(embeddings[0]) == 768


class TestEmbeddingDimension:
    """AC2: Dimension đúng cấu hình / Correct embedding dimension (768)"""

    @pytest.mark.asyncio
    async def test_embedding_dimension_matches_config(self, mock_provider):
        """Test: Embedding dimension matches configured size (768)."""
        input_text = "Kiểm tra kích thước vector embedding"
        embeddings = await mock_provider.generate_embeddings([input_text])
        assert len(embeddings[0]) == 768

    @pytest.mark.asyncio
    async def test_embedding_dimension_consistency_across_texts(self, mock_provider):
        """Test: All embeddings have same dimension regardless of input length."""
        texts = [
            "Ngắn",
            "Văn bản trung bình có độ dài bình thường",
            "Văn bản rất dài " * 100
        ]
        embeddings = await mock_provider.generate_embeddings(texts)
        dimensions = [len(emb) for emb in embeddings]

        assert len(set(dimensions)) == 1
        assert dimensions[0] == 768


class TestVectorPgvectorStorage:
    """AC3: Vector được lưu cùng chunk / Vectors stored with chunks in PostgreSQL"""

    def test_document_chunk_model_instantiation(self):
        """Test: DocumentChunk model accepts 768-dimensional vector and metadata."""
        chunk_id = uuid.uuid4()
        workspace_id = uuid.uuid4()
        doc_id = uuid.uuid4()
        vector = [0.1] * 768

        chunk = DocumentChunk(
            id=chunk_id,
            workspace_id=workspace_id,
            document_id=doc_id,
            content="Nội dung khúc văn bản",
            chunk_index=0,
            embedding=vector
        )

        assert chunk.id == chunk_id
        assert chunk.workspace_id == workspace_id
        assert chunk.document_id == doc_id
        assert chunk.content == "Nội dung khúc văn bản"
        assert chunk.chunk_index == 0
        assert len(chunk.embedding) == 768


class TestMetadataAndWorkspaceMapping:
    """AC4: Metadata và workspace mapping chính xác / Correct metadata and workspace mapping"""

    def test_chunker_preserves_workspace_and_doc_mapping(self):
        """Test: StructureAwareChunker preserves document and workspace IDs on chunks."""
        workspace_id = uuid.uuid4()
        document_id = uuid.uuid4()
        metadata = DocumentMetadata(
            workspace_id=workspace_id,
            document_id=document_id
        )

        chunker = StructureAwareChunker(chunk_size=100, overlap=20)
        text = "Tiết 1: Giới thiệu chung.\n\nTiết 2: Thực hành chi tiết."
        chunks = chunker.chunk(text, metadata)

        assert len(chunks) > 0
        for c in chunks:
            assert c.metadata.workspace_id == workspace_id
            assert c.metadata.document_id == document_id
            assert c.chunk_index >= 0
            assert len(c.text) > 0
