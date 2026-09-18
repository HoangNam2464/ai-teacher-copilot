"""
QA-013: Test Vector Embedding Generation & pgvector Storage

Test vector embedding generation, dimension validation, pgvector persistence,
and workspace-document mapping integrity.
"""

import pytest
import numpy as np
from sqlalchemy import text
from unittest.mock import patch, MagicMock

from app.generation.embedding.embedder import EmbedderService
from app.ingestion.chunk import ChunkService
from app.retrieval.vectordb import VectorDBService


@pytest.fixture
async def embedding_service():
    """Provide embedding service instance."""
    return EmbedderService()


@pytest.fixture
async def vector_db():
    """Provide vector database service."""
    return VectorDBService()


@pytest.fixture
async def chunk_service():
    """Provide chunk service."""
    return ChunkService()


class TestVectorEmbeddingGeneration:
    """AC1: Embedding được tạo thành công / Embedding generated successfully"""
    
    @pytest.mark.asyncio
    async def test_embedding_generation_success(self, embedding_service):
        """Test: Vector embedding created successfully for input text."""
        # Arrange
        input_text = "Lập kế hoạch bài học về lịch sử Việt Nam"
        expected_embedding_type = list  # or np.ndarray
        
        # Act
        embedding = await embedding_service.generate_embedding(input_text)
        
        # Assert
        assert embedding is not None, "Embedding should not be None"
        assert isinstance(embedding, (list, np.ndarray)), f"Embedding should be list or ndarray, got {type(embedding)}"
        assert len(embedding) > 0, "Embedding should not be empty"
        # Check embedding values are floats
        assert all(isinstance(val, (int, float)) for val in embedding), "All embedding values should be numeric"
    
    @pytest.mark.asyncio
    async def test_embedding_consistency(self, embedding_service):
        """Test: Same input text produces same embedding (deterministic)."""
        # Arrange
        text = "Tạo bài tập trắc nghiệm"
        
        # Act
        embedding1 = await embedding_service.generate_embedding(text)
        embedding2 = await embedding_service.generate_embedding(text)
        
        # Assert
        embeddings_match = np.allclose(embedding1, embedding2, rtol=1e-5)
        assert embeddings_match, "Same input should produce identical embeddings"
    
    @pytest.mark.asyncio
    async def test_embedding_for_empty_text(self, embedding_service):
        """Test: Embedding generation handles empty/whitespace text."""
        # Arrange
        empty_texts = ["", "   ", "\n\t"]
        
        # Act & Assert
        for text in empty_texts:
            with pytest.raises((ValueError, RuntimeError)):
                await embedding_service.generate_embedding(text)
    
    @pytest.mark.asyncio
    async def test_embedding_for_long_text(self, embedding_service):
        """Test: Embedding generation handles long text correctly."""
        # Arrange
        long_text = "Bài học " * 500  # Create a long text
        
        # Act
        embedding = await embedding_service.generate_embedding(long_text)
        
        # Assert
        assert embedding is not None, "Long text should produce valid embedding"
        assert len(embedding) > 0, "Embedding dimension should be > 0"


class TestEmbeddingDimension:
    """AC2: Dimension đúng cấu hình / Correct embedding dimension"""
    
    @pytest.mark.asyncio
    async def test_embedding_dimension_matches_config(self, embedding_service):
        """Test: Embedding dimension matches configured size."""
        # Arrange
        expected_dimension = 1536  # Common dimension for embeddings (can be adjusted)
        input_text = "Kiểm tra kích thước vector embedding"
        
        # Act
        embedding = await embedding_service.generate_embedding(input_text)
        actual_dimension = len(embedding)
        
        # Assert
        assert actual_dimension == expected_dimension, \
            f"Embedding dimension should be {expected_dimension}, got {actual_dimension}"
    
    @pytest.mark.asyncio
    async def test_embedding_dimension_consistency_across_texts(self, embedding_service):
        """Test: All embeddings have same dimension regardless of input length."""
        # Arrange
        texts = [
            "Ngắn",
            "Văn bản trung bình có độ dài bình thường",
            "Văn bản rất dài " * 100
        ]
        
        # Act
        embeddings = [await embedding_service.generate_embedding(text) for text in texts]
        dimensions = [len(emb) for emb in embeddings]
        
        # Assert
        assert len(set(dimensions)) == 1, "All embeddings should have same dimension"
        assert dimensions[0] == 1536, "Dimension should be 1536"


class TestVectorPgvectorStorage:
    """AC3: Vector được lưu dụng chunk / Vectors stored with chunks"""
    
    @pytest.mark.asyncio
    async def test_chunk_vector_persistence(self, vector_db, db_session):
        """Test: Chunk with vector is persisted to pgvector."""
        # Arrange
        chunk_id = "chunk_001"
        workspace_id = "workspace_123"
        document_id = "doc_456"
        chunk_text = "Nội dung khúc văn bản"
        embedding = np.random.rand(1536).tolist()
        
        # Act - Insert chunk with vector
        await vector_db.store_chunk_vector(
            chunk_id=chunk_id,
            workspace_id=workspace_id,
            document_id=document_id,
            text=chunk_text,
            vector=embedding,
            chunk_metadata={"page": 1, "position": 0}
        )
        
        # Assert - Retrieve and verify
        retrieved = await vector_db.get_chunk_by_id(chunk_id)
        assert retrieved is not None, f"Chunk {chunk_id} should be stored"
        assert retrieved["text"] == chunk_text, "Chunk text should match"
        assert len(retrieved["vector"]) == 1536, "Vector should have correct dimension"
    
    @pytest.mark.asyncio
    async def test_vector_similarity_search(self, vector_db, db_session):
        """Test: Vector similarity search returns relevant chunks."""
        # Arrange
        workspace_id = "workspace_test"
        chunks_data = [
            {
                "id": "chunk_1",
                "text": "Quản lý lớp học hiệu quả",
                "vector": np.random.rand(1536).tolist()
            },
            {
                "id": "chunk_2",
                "text": "Kỹ năng giảng dạy tương tác",
                "vector": np.random.rand(1536).tolist()
            },
            {
                "id": "chunk_3",
                "text": "Đánh giá hiệu suất học sinh",
                "vector": np.random.rand(1536).tolist()
            }
        ]
        
        # Act - Store all chunks
        for chunk in chunks_data:
            await vector_db.store_chunk_vector(
                chunk_id=chunk["id"],
                workspace_id=workspace_id,
                document_id="doc_001",
                text=chunk["text"],
                vector=chunk["vector"],
                chunk_metadata={}
            )
        
        # Create a query embedding similar to first chunk
        query_embedding = chunks_data[0]["vector"]
        
        # Act - Search for similar chunks
        results = await vector_db.search_similar_chunks(
            workspace_id=workspace_id,
            query_vector=query_embedding,
            limit=2
        )
        
        # Assert
        assert results is not None, "Search should return results"
        assert len(results) > 0, "Should find similar chunks"
        assert results[0]["id"] == "chunk_1", "Most similar should be chunk_1"
    
    @pytest.mark.asyncio
    async def test_vector_dimension_validation_on_insert(self, vector_db):
        """Test: Vector with wrong dimension is rejected."""
        # Arrange
        wrong_dimension_vector = np.random.rand(384).tolist()  # Wrong dimension
        
        # Act & Assert
        with pytest.raises(ValueError) as exc_info:
            await vector_db.store_chunk_vector(
                chunk_id="chunk_bad",
                workspace_id="workspace_123",
                document_id="doc_123",
                text="Test text",
                vector=wrong_dimension_vector,
                chunk_metadata={}
            )
        assert "dimension" in str(exc_info.value).lower()


class TestMetadataAndWorkspaceMapping:
    """AC4: Metadata và workspace mapping chính xác / Correct metadata and workspace mapping"""
    
    @pytest.mark.asyncio
    async def test_chunk_metadata_persistence(self, vector_db):
        """Test: Chunk metadata is correctly stored."""
        # Arrange
        chunk_id = "chunk_meta_001"
        workspace_id = "workspace_map"
        metadata = {
            "page": 3,
            "section": "Introduction",
            "position": 42,
            "source_type": "student-submission"
        }
        
        # Act
        await vector_db.store_chunk_vector(
            chunk_id=chunk_id,
            workspace_id=workspace_id,
            document_id="doc_001",
            text="Sample text",
            vector=np.random.rand(1536).tolist(),
            chunk_metadata=metadata
        )
        
        # Assert
        retrieved = await vector_db.get_chunk_by_id(chunk_id)
        assert retrieved is not None
        assert retrieved["metadata"]["page"] == 3
        assert retrieved["metadata"]["section"] == "Introduction"
        assert retrieved["metadata"]["position"] == 42
    
    @pytest.mark.asyncio
    async def test_workspace_isolation_in_vectors(self, vector_db):
        """Test: Vectors are properly isolated by workspace."""
        # Arrange
        workspace1_id = "workspace_1"
        workspace2_id = "workspace_2"
        shared_text = "Nội dung giống nhau"
        
        # Create same text in two different workspaces
        vector1 = np.random.rand(1536).tolist()
        vector2 = np.random.rand(1536).tolist()
        
        # Act
        await vector_db.store_chunk_vector(
            chunk_id="chunk_ws1",
            workspace_id=workspace1_id,
            document_id="doc_ws1",
            text=shared_text,
            vector=vector1,
            chunk_metadata={}
        )
        
        await vector_db.store_chunk_vector(
            chunk_id="chunk_ws2",
            workspace_id=workspace2_id,
            document_id="doc_ws2",
            text=shared_text,
            vector=vector2,
            chunk_metadata={}
        )
        
        # Assert - Search in workspace1 should not return workspace2 chunks
        results_ws1 = await vector_db.search_chunks_in_workspace(
            workspace_id=workspace1_id,
            query_vector=vector1,
            limit=10
        )
        
        workspace_ids_in_results = [r["workspace_id"] for r in results_ws1]
        assert all(ws_id == workspace1_id for ws_id in workspace_ids_in_results), \
            "Only workspace_1 chunks should be returned"
    
    @pytest.mark.asyncio
    async def test_document_chunk_relationship(self, vector_db):
        """Test: Chunks are correctly associated with documents and workspaces."""
        # Arrange
        workspace_id = "workspace_rel"
        document_id = "doc_rel_001"
        chunks = [
            ("chunk_rel_1", "Content 1"),
            ("chunk_rel_2", "Content 2"),
            ("chunk_rel_3", "Content 3")
        ]
        
        # Act - Store all chunks
        for chunk_id, text in chunks:
            await vector_db.store_chunk_vector(
                chunk_id=chunk_id,
                workspace_id=workspace_id,
                document_id=document_id,
                text=text,
                vector=np.random.rand(1536).tolist(),
                chunk_metadata={"doc": document_id}
            )
        
        # Assert
        retrieved_chunks = await vector_db.get_chunks_by_document(
            workspace_id=workspace_id,
            document_id=document_id
        )
        
        assert len(retrieved_chunks) == 3, "Should retrieve all 3 chunks"
        retrieved_ids = [c["id"] for c in retrieved_chunks]
        for chunk_id, _ in chunks:
            assert chunk_id in retrieved_ids, f"{chunk_id} should be in results"


class TestEmbeddingProviderIntegration:
    """Test embedding provider integration (Gemini/OpenAI placeholder)"""
    
    @pytest.mark.asyncio
    async def test_embedding_provider_abstraction(self, embedding_service):
        """Test: Embedding service uses abstract provider interface."""
        # Act
        embedding = await embedding_service.generate_embedding("Test content")
        
        # Assert
        assert embedding is not None
        assert isinstance(embedding, (list, np.ndarray))
        # Verify provider is called correctly
        assert hasattr(embedding_service, 'provider'), "Service should have provider attribute"
    
    @pytest.mark.asyncio
    async def test_embedding_provider_fallback(self, embedding_service):
        """Test: Embedding service handles provider failure gracefully."""
        # Arrange
        with patch.object(embedding_service, 'provider') as mock_provider:
            mock_provider.generate.side_effect = Exception("Provider unavailable")
            
            # Act & Assert
            with pytest.raises(Exception) as exc_info:
                await embedding_service.generate_embedding("Test")
            assert "Provider unavailable" in str(exc_info.value)


class TestEmbeddingPerformance:
    """Performance and reliability tests for embeddings"""
    
    @pytest.mark.asyncio
    async def test_batch_embedding_generation(self, embedding_service):
        """Test: Batch embedding generation is efficient."""
        # Arrange
        texts = [f"Văn bản {i}" for i in range(10)]
        
        # Act
        embeddings = await embedding_service.generate_embeddings_batch(texts)
        
        # Assert
        assert len(embeddings) == 10, "Should generate 10 embeddings"
        assert all(len(emb) == 1536 for emb in embeddings), "All embeddings should have correct dimension"
    
    @pytest.mark.asyncio
    async def test_embedding_with_unicode_text(self, embedding_service):
        """Test: Embedding handles Vietnamese and Unicode text."""
        # Arrange
        unicode_texts = [
            "Tiếng Việt: Tạo bài giảng sáng tạo",
            "Chinese: 創建創意課程",
            "Mixed: Hello Xin chào 你好",
            "Emoji: 📚 Giáo dục 🎓"
        ]
        
        # Act & Assert
        for text in unicode_texts:
            embedding = await embedding_service.generate_embedding(text)
            assert embedding is not None, f"Should handle: {text}"
            assert len(embedding) == 1536, "Unicode text should produce valid embedding"
