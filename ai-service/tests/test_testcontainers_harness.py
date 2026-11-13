"""
Testcontainers Integration Test Harness for FastAPI AI Service [BE-032].

Verifies Acceptance Criteria:
1. Testcontainers khởi tạo được dependency (PostgreSQL 16 with pgvector + MinIO S3 object storage).
2. FastAPI integration test chạy được với dependencies thực tế.
3. Database test được isolation giữa các test (tự động dọn dẹp hoặc table truncation giữa các test, không rò rỉ dữ liệu).
"""

import io
import math
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from minio import Minio

from app.core.models import Base, DocumentChunk
from app.main import app
from app.core.database import get_db

# Helper to check if Docker daemon is available
def is_docker_available() -> bool:
    try:
        from testcontainers.core.docker_client import DockerClient
        client = DockerClient()
        return bool(client.client.ping())
    except Exception:
        return False


DOCKER_AVAILABLE = is_docker_available()

# Global container references
_pg_container = None
_minio_container = None


@pytest.fixture(scope="module")
def postgres_harness():
    """Starts a PostgreSQL 16 container with pgvector extension."""
    if not DOCKER_AVAILABLE:
        pytest.skip("Docker daemon not available on this host. Skipping Testcontainers harness.")

    from testcontainers.community.postgres import PostgresContainer

    global _pg_container
    container = PostgresContainer(
        image="pgvector/pgvector:pg16",
        username="testuser",
        password="testpassword",
        dbname="aiteachercopilot_test",
    )
    container.start()
    _pg_container = container
    yield container
    container.stop()


@pytest.fixture(scope="module")
def minio_harness():
    """Starts a MinIO container for object storage integration."""
    if not DOCKER_AVAILABLE:
        pytest.skip("Docker daemon not available on this host. Skipping Testcontainers harness.")

    from testcontainers.community.minio import MinioContainer

    global _minio_container
    container = MinioContainer(image="minio/minio:latest")
    container.start()
    _minio_container = container
    yield container
    container.stop()


def get_postgres_async_url(postgres_harness) -> str:
    host = postgres_harness.get_container_host_ip()
    port = postgres_harness.get_exposed_port(5432)
    user = postgres_harness.username
    password = postgres_harness.password
    dbname = postgres_harness.dbname
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{dbname}"


@pytest_asyncio.fixture
async def db_session(postgres_harness):
    """Provides an isolated database session with NullPool to prevent event loop mismatch (AC-4)."""
    async_url = get_postgres_async_url(postgres_harness)
    engine = create_async_engine(
        async_url,
        echo=False,
        poolclass=NullPool,
    )

    # Initialize pgvector extension and create tables
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
        # Clean before test (AC-4: isolation)
        await conn.execute(text("TRUNCATE TABLE document_chunks CASCADE;"))

    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_maker() as session:
        yield session

    # Clean after test (AC-4: isolation)
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE document_chunks CASCADE;"))

    await engine.dispose()


# ------------------------------------------------------------------------------
# Test Cases
# ------------------------------------------------------------------------------

class TestTestcontainersFastAPIHarness:
    """Suite verifying AC-1, AC-3, and AC-4."""

    @pytest.mark.asyncio
    async def test_ac1_dependency_initialization(self, postgres_harness, minio_harness):
        """AC-1: Testcontainers khởi tạo được dependency (Postgres + pgvector, MinIO)."""
        assert postgres_harness is not None
        assert postgres_harness.get_wrapped_container().status in ["running", "created"]

        assert minio_harness is not None
        assert minio_harness.get_wrapped_container().status in ["running", "created"]

        # Check MinIO client connectivity
        config = minio_harness.get_config()
        client = Minio(
            config["endpoint"].replace("http://", "").replace("https://", ""),
            access_key=config["access_key"],
            secret_key=config["secret_key"],
            secure=False,
        )
        assert client.list_buckets() is not None

    @pytest.mark.asyncio
    async def test_ac3_fastapi_pgvector_similarity_search(self, db_session):
        """AC-3: FastAPI integration test with pgvector vector operations."""
        workspace_id = uuid.uuid4()
        doc_id = uuid.uuid4()

        # Generate a test 768-dim vector embedding
        test_vector = [round(math.sin(i * 0.1), 4) for i in range(768)]

        # Insert a DocumentChunk into the real PostgreSQL container
        chunk = DocumentChunk(
            id=uuid.uuid4(),
            document_id=doc_id,
            workspace_id=workspace_id,
            content="Toán 10: Định lý Cosin trong tam giác ABC và ứng dụng thực tiễn.",
            chunk_index=0,
            embedding=test_vector,
            token_count=18,
            subject="Toán học",
            grade_level="10",
            topic="Hình học",
            source_page=12,
            source_location="Trang 12, Phần II"
        )
        db_session.add(chunk)
        await db_session.commit()

        # Query back using pgvector cosine distance <=>
        result = await db_session.execute(
            select(DocumentChunk)
            .where(DocumentChunk.workspace_id == workspace_id)
            .order_by(DocumentChunk.embedding.cosine_distance(test_vector))
            .limit(1)
        )
        retrieved_chunk = result.scalar_one_or_none()

        assert retrieved_chunk is not None
        assert retrieved_chunk.workspace_id == workspace_id
        assert "Định lý Cosin" in retrieved_chunk.content
        assert retrieved_chunk.source_page == 12

    @pytest.mark.asyncio
    async def test_ac1_ac3_minio_s3_upload_and_download(self, minio_harness):
        """AC-1 & AC-3: MinIO S3 object storage operations."""
        config = minio_harness.get_config()
        client = Minio(
            config["endpoint"].replace("http://", "").replace("https://", ""),
            access_key=config["access_key"],
            secret_key=config["secret_key"],
            secure=False,
        )

        bucket_name = "testcontainers-docs"
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)

        object_name = "test_lesson_plan.txt"
        file_data = b"AI Teacher Copilot: Testcontainers MinIO Storage Integration Test."
        client.put_object(
            bucket_name,
            object_name,
            io.BytesIO(file_data),
            length=len(file_data),
            content_type="text/plain",
        )

        response = client.get_object(bucket_name, object_name)
        downloaded_bytes = response.read()
        response.close()
        response.release_conn()

        assert downloaded_bytes == file_data

    @pytest.mark.asyncio
    async def test_ac4_database_isolation_part_1(self, db_session):
        """AC-4: Database test isolation part 1 — insert record and verify count."""
        # Database should be empty due to fixture truncation
        result_empty = await db_session.execute(select(DocumentChunk))
        assert len(result_empty.scalars().all()) == 0

        # Insert one record
        dummy_vector = [0.0] * 768
        chunk = DocumentChunk(
            id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            workspace_id=uuid.uuid4(),
            content="Dữ liệu kiểm thử isolation part 1",
            chunk_index=0,
            embedding=dummy_vector,
            token_count=10,
        )
        db_session.add(chunk)
        await db_session.commit()

        result_after = await db_session.execute(select(DocumentChunk))
        assert len(result_after.scalars().all()) == 1

    @pytest.mark.asyncio
    async def test_ac4_database_isolation_part_2(self, db_session):
        """AC-4: Database test isolation part 2 — verify clean slate from previous test."""
        # Proves that Part 1's inserted chunk was truncated and does not pollute this test
        result = await db_session.execute(select(DocumentChunk))
        chunks = result.scalars().all()
        assert len(chunks) == 0

    @pytest.mark.asyncio
    async def test_ac3_fastapi_endpoint_integration(self, postgres_harness):
        """AC-3: FastAPI endpoint invocation with test database engine."""
        from unittest.mock import patch

        async_url = get_postgres_async_url(postgres_harness)
        engine = create_async_engine(async_url, poolclass=NullPool)

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.api.routes.health.engine", engine):
                response = await client.get("/health")
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "healthy"
                assert data["database"] == "connected"
                assert data["service"] == "ai-service"

        await engine.dispose()
