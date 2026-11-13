"""
Unit & Integration Tests for RAG Retrieval Quality Metrics Logging [BE-033].

Validates:
1. AC1: Retrieval metrics recording (Cosine similarity, latency_ms, chunk counts).
2. AC2: Query & Top-K result traceability (trace_id, timestamps, chunk provenance metadata).
3. AC3: Sensitive information protection & PII redaction (emails, phones, credentials masked).
4. AC4: Benchmark aggregation & summary calculation (P50, P90, P95, mean similarity, insufficient evidence rate).
5. API endpoints: /evaluation/metrics/retrieval, /evaluation/metrics/retrieval/summary, /evaluation/metrics/retrieval/reset.
6. End-to-end integration: search_similar_chunks automatically feeds evaluation telemetry.
"""

import math
import uuid
from typing import List, Optional
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.models import DocumentChunk
from app.evaluation.evaluation_logger import (
    ChunkTrace,
    EvaluationLogger,
    RetrievalMetricsSummary,
    RetrievalQualityMetric,
    compute_query_hash,
    evaluation_logger,
    sanitize_query_text,
)
from app.main import app
from app.providers.base import BaseAIProvider
from app.retrieval.schemas import RetrievedChunk
from app.retrieval.service import search_similar_chunks


# ==============================================================================
# Unit Tests: PII Redaction & Sanitization
# ==============================================================================

class TestSanitizationAndHashing:
    """Tests for AC3: Sensitive information protection and redaction."""

    def test_sanitize_emails(self):
        text = "Tài liệu cho học sinh email: nguyen.van.a@school.edu.vn và giao.vien@k12.vn"
        sanitized = sanitize_query_text(text)
        assert "nguyen.van.a@school.edu.vn" not in sanitized
        assert "giao.vien@k12.vn" not in sanitized
        assert "[EMAIL_REDACTED]" in sanitized

    def test_sanitize_phone_numbers(self):
        text = "Liên hệ phụ huynh số 0912345678 hoặc +84987654321 khi cần"
        sanitized = sanitize_query_text(text)
        assert "0912345678" not in sanitized
        assert "[PHONE_REDACTED]" in sanitized

    def test_sanitize_credentials(self):
        text = "Query test with Bearer sk-antigravity-secret-key-12345 and password changeme"
        sanitized = sanitize_query_text(text)
        assert "sk-antigravity-secret-key-12345" not in sanitized
        assert "[CREDENTIAL_REDACTED]" in sanitized

    def test_sanitize_student_numeric_id(self):
        text = "Học sinh số báo danh 001201004567 kiểm tra môn Toán"
        sanitized = sanitize_query_text(text)
        assert "001201004567" not in sanitized
        assert "[ID_REDACTED]" in sanitized

    def test_query_truncation_boundary(self):
        long_query = "Từ khóa tìm kiếm bài giảng " * 20
        sanitized = sanitize_query_text(long_query, max_length=50)
        assert len(sanitized) <= 55
        assert sanitized.endswith("...")

    def test_query_hashing_consistency(self):
        query = "Định lý Pytago và ứng dụng"
        hash1 = compute_query_hash(query)
        hash2 = compute_query_hash(query)
        hash_diff = compute_query_hash("Định lý Cosin")
        assert len(hash1) == 64
        assert hash1 == hash2
        assert hash1 != hash_diff

    def test_query_hashing_empty(self):
        assert compute_query_hash("") == ""
        assert compute_query_hash(None) == ""


# ==============================================================================
# Unit Tests: EvaluationLogger Core & Traceability
# ==============================================================================

class TestEvaluationLoggerCore:
    """Tests for AC1, AC2, and AC4: Logging, Traceability, and Aggregations."""

    def setup_method(self):
        self.logger = EvaluationLogger(max_buffer_size=100)

    def test_log_retrieval_with_results(self):
        workspace_id = uuid.uuid4()
        chunk_id = uuid.uuid4()
        doc_id = uuid.uuid4()

        chunks = [
            RetrievedChunk(
                id=chunk_id,
                content="Nội dung bài học",
                document_id=doc_id,
                source_page=12,
                chunk_index=3,
                similarity_score=0.85,
                subject="Toán",
                grade_level="10",
                topic="Hàm số",
            )
        ]

        metric = self.logger.log_retrieval(
            query="Tìm kiếm hàm số bậc hai giáo viên: nam@gmail.com",
            workspace_id=workspace_id,
            latency_ms=45.2,
            top_k=5,
            similarity_threshold=0.3,
            raw_matches_count=10,
            retrieved_chunks=chunks,
            insufficient_evidence=False,
            filters_applied={"subject": "Toán", "grade_level": "10"},
        )

        # AC1: Retrieval metrics recorded
        assert metric.latency_ms == 45.2
        assert metric.top_similarity_score == 0.85
        assert metric.avg_similarity_score == 0.85
        assert metric.min_similarity_score == 0.85
        assert metric.relevant_chunks_count == 1
        assert metric.raw_matches_count == 10
        assert metric.insufficient_evidence is False

        # AC2: Traceability
        assert uuid.UUID(metric.trace_id)
        assert metric.workspace_id == str(workspace_id)
        assert len(metric.top_k_results) == 1
        trace = metric.top_k_results[0]
        assert trace.chunk_id == str(chunk_id)
        assert trace.document_id == str(doc_id)
        assert trace.source_page == 12
        assert trace.chunk_index == 3
        assert trace.similarity_score == 0.85

        # AC3: Redacted preview
        assert "nam@gmail.com" not in metric.query_preview
        assert "[EMAIL_REDACTED]" in metric.query_preview
        assert len(metric.query_hash) == 64

    def test_log_retrieval_insufficient_evidence(self):
        workspace_id = uuid.uuid4()
        metric = self.logger.log_retrieval(
            query="Chủ đề hoàn toàn không tồn tại trong giáo trình",
            workspace_id=workspace_id,
            latency_ms=22.1,
            top_k=5,
            similarity_threshold=0.5,
            raw_matches_count=2,
            retrieved_chunks=[],
            insufficient_evidence=True,
        )

        assert metric.relevant_chunks_count == 0
        assert metric.insufficient_evidence is True
        assert metric.top_similarity_score == 0.0
        assert metric.avg_similarity_score == 0.0
        assert len(metric.top_k_results) == 0

    def test_metrics_summary_aggregation(self):
        ws_id = uuid.uuid4()
        # Log 5 queries with known latencies: [10, 20, 30, 40, 50]
        latencies = [10.0, 20.0, 30.0, 40.0, 50.0]
        scores = [0.90, 0.80, 0.70, 0.60, 0.50]

        for i in range(5):
            chunk = RetrievedChunk(
                id=uuid.uuid4(),
                content="Chunk content",
                document_id=uuid.uuid4(),
                source_page=i + 1,
                chunk_index=i,
                similarity_score=scores[i],
            )
            self.logger.log_retrieval(
                query=f"Query {i}",
                workspace_id=ws_id,
                latency_ms=latencies[i],
                top_k=5,
                similarity_threshold=0.3,
                raw_matches_count=5,
                retrieved_chunks=[chunk],
                insufficient_evidence=(i == 4),  # 1 out of 5 insufficient
            )

        summary = self.logger.get_metrics_summary(workspace_id=ws_id)

        assert summary.total_queries == 5
        assert summary.avg_latency_ms == 30.0
        assert summary.min_latency_ms == 10.0
        assert summary.max_latency_ms == 50.0
        assert summary.p50_latency_ms == 30.0
        assert summary.p90_latency_ms == 46.0  # 90th percentile
        assert summary.p95_latency_ms == 48.0  # 95th percentile
        assert summary.insufficient_evidence_count == 1
        assert summary.insufficient_evidence_rate == 20.0
        assert summary.avg_chunks_per_query == 1.0
        assert summary.total_chunks_retrieved == 5

    def test_workspace_isolation_in_metrics(self):
        ws1 = uuid.uuid4()
        ws2 = uuid.uuid4()

        self.logger.log_retrieval("Query ws1", ws1, 10.0, 5, 0.3, 1, [], True)
        self.logger.log_retrieval("Query ws2", ws2, 20.0, 5, 0.3, 1, [], True)

        m_ws1 = self.logger.get_metrics(workspace_id=ws1)
        assert len(m_ws1) == 1
        assert m_ws1[0].workspace_id == str(ws1)

        m_ws2 = self.logger.get_metrics(workspace_id=ws2)
        assert len(m_ws2) == 1
        assert m_ws2[0].workspace_id == str(ws2)

        summary_ws1 = self.logger.get_metrics_summary(workspace_id=ws1)
        assert summary_ws1.total_queries == 1
        assert summary_ws1.avg_latency_ms == 10.0

    def test_reset_and_export_report(self, tmp_path):
        ws_id = uuid.uuid4()
        self.logger.log_retrieval("Query export", ws_id, 15.0, 5, 0.3, 1, [], False)

        report_file = tmp_path / "benchmark_report.json"
        report = self.logger.export_benchmark_report(filepath=str(report_file))

        assert report["title"] == "AI Teacher Copilot — RAG Retrieval Quality Benchmark Report"
        assert report["query_count"] == 1
        assert report_file.exists()

        # Test reset
        self.logger.reset()
        assert len(self.logger.get_metrics()) == 0
        summary = self.logger.get_metrics_summary()
        assert summary.total_queries == 0


# ==============================================================================
# Integration Tests: FastAPI Endpoints (/evaluation)
# ==============================================================================

class TestEvaluationAPIEndpoints:
    """Tests for REST endpoints exposed by FastAPI."""

    @pytest.fixture(autouse=True)
    def clean_evaluation_logger(self):
        evaluation_logger.reset()
        yield
        evaluation_logger.reset()

    @pytest.mark.asyncio
    async def test_evaluation_health(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
            resp = await client.get("/evaluation/health", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "healthy"
            assert data["service"] == "evaluation-metrics"

    @pytest.mark.asyncio
    async def test_get_retrieval_metrics_and_summary(self):
        ws_id = str(uuid.uuid4())
        # Populate metric
        evaluation_logger.log_retrieval(
            query="Định lý hàm số sin liên hệ admin@copilot.vn",
            workspace_id=ws_id,
            latency_ms=35.0,
            top_k=5,
            similarity_threshold=0.3,
            raw_matches_count=3,
            retrieved_chunks=[
                RetrievedChunk(
                    id=uuid.uuid4(),
                    content="Nội dung định lý sin",
                    document_id=uuid.uuid4(),
                    source_page=1,
                    chunk_index=0,
                    similarity_score=0.88,
                )
            ],
            insufficient_evidence=False,
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}

            # 1. Fetch metrics list
            resp = await client.get(f"/evaluation/metrics/retrieval?workspace_id={ws_id}", headers=headers)
            assert resp.status_code == 200
            metrics = resp.json()
            assert len(metrics) == 1
            assert metrics[0]["workspace_id"] == ws_id
            assert metrics[0]["latency_ms"] == 35.0
            assert "[EMAIL_REDACTED]" in metrics[0]["query_preview"]

            # 2. Fetch metrics summary
            resp_summary = await client.get(f"/evaluation/metrics/retrieval/summary?workspace_id={ws_id}", headers=headers)
            assert resp_summary.status_code == 200
            summary = resp_summary.json()
            assert summary["total_queries"] == 1
            assert summary["avg_latency_ms"] == 35.0
            assert summary["avg_similarity_score"] == 0.88
            assert summary["insufficient_evidence_rate"] == 0.0

            # 3. Reset metrics buffer
            resp_reset = await client.post("/evaluation/metrics/retrieval/reset", headers=headers)
            assert resp_reset.status_code == 200
            assert resp_reset.json()["status"] == "reset_successful"

            # 4. Verify empty after reset
            resp_after = await client.get(f"/evaluation/metrics/retrieval?workspace_id={ws_id}", headers=headers)
            assert resp_after.status_code == 200
            assert len(resp_after.json()) == 0

    @pytest.mark.asyncio
    async def test_authentication_required(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Missing API Key
            resp = await client.get("/evaluation/metrics/retrieval")
            assert resp.status_code == 401

            # Invalid API Key
            resp_invalid = await client.get("/evaluation/metrics/retrieval", headers={"X-API-Key": "invalid_key"})
            assert resp_invalid.status_code == 401


# ==============================================================================
# End-to-End Integration: search_similar_chunks automatically records telemetry
# ==============================================================================

class MockProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    async def generate_structured_output(self, *args, **kwargs) -> any:
        return {}

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [[0.1] * 768 for _ in texts]


@pytest.mark.asyncio
async def test_search_similar_chunks_emits_evaluation_metrics():
    """Verify that calling search_similar_chunks logs telemetry to evaluation_logger."""
    evaluation_logger.reset()
    ws_id = uuid.uuid4()
    chunk_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    mock_chunk = DocumentChunk(
        id=chunk_id,
        document_id=doc_id,
        workspace_id=ws_id,
        content="Định lý hàm số Cosin trong tam giác ABC",
        chunk_index=1,
        source_page=5,
        token_count=15,
        subject="Toán",
        grade_level="10",
        topic="Lượng giác",
    )

    mock_result = MagicMock()
    mock_result.all.return_value = [(mock_chunk, 0.15)]  # cosine_distance = 0.15 -> similarity = 0.85

    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(return_value=mock_result)

    response = await search_similar_chunks(
        query="Công thức tính định lý Cosin học sinh SĐT 0987654321",
        workspace_id=ws_id,
        top_k=5,
        similarity_threshold=0.3,
        provider=MockProvider(),
        session=mock_session,
    )

    # Response has trace_id and latency_ms
    assert response.trace_id is not None
    assert response.latency_ms is not None
    assert response.latency_ms >= 0.0
    assert len(response.chunks) == 1

    # Check that evaluation_logger recorded the event
    metrics = evaluation_logger.get_metrics(workspace_id=ws_id)
    assert len(metrics) == 1
    m = metrics[0]
    assert m.trace_id == response.trace_id
    assert m.workspace_id == str(ws_id)
    assert m.top_similarity_score == 0.85
    assert "[PHONE_REDACTED]" in m.query_preview
    assert "0987654321" not in m.query_preview
    assert len(m.top_k_results) == 1
    assert m.top_k_results[0].chunk_id == str(chunk_id)
