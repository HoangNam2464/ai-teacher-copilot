import asyncio
import io
import uuid
import structlog
from minio import Minio

from app.core.config import settings
from app.core.database import async_session
from app.core.models import DocumentChunk
from app.ingestion.parser import DocumentParser
from app.ingestion.chunker import StructureAwareChunker
from app.providers.gemini import get_embeddings_batch

logger = structlog.get_logger()

minio_client = Minio(
    settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_ENDPOINT.startswith("https")
)

async def process_document_pipeline(document_id: str, workspace_id: str, minio_key: str):
    logger.info("pipeline_started", doc_id=document_id)
    doc_uuid = uuid.UUID(str(document_id))
    ws_uuid = uuid.UUID(str(workspace_id))
    try:
        response = minio_client.get_object(settings.MINIO_BUCKET_DOCUMENTS, minio_key)
        file_bytes = response.read()
        response.close()
        response.release_conn()

        text = DocumentParser.parse(file_bytes, minio_key)

        chunker = StructureAwareChunker()
        raw_chunks = chunker.chunk(text)
        chunks = [c for c in raw_chunks if c.strip()]
        if not chunks:
            chunks = [text[:1000]] if text.strip() else ["Tài liệu học liệu."]

        logger.info("generating_embeddings", doc_id=document_id, total_chunks=len(chunks))
        embeddings = await get_embeddings_batch(chunks)

        async with async_session() as session:
            for idx, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                doc_chunk = DocumentChunk(
                    id=uuid.uuid4(),
                    document_id=doc_uuid,
                    workspace_id=ws_uuid,
                    content=chunk_text,
                    chunk_index=idx,
                    embedding=embedding
                )
                session.add(doc_chunk)

            from sqlalchemy import text
            await session.execute(
                text("UPDATE documents SET processing_status = 'READY', chunk_count = :cnt, updated_at = NOW() WHERE id = :doc_id"),
                {"cnt": len(chunks), "doc_id": doc_uuid}
            )
            await session.commit()

        logger.info("pipeline_completed", doc_id=document_id, total_chunks=len(chunks))
    except Exception as e:
        logger.error("pipeline_failed", doc_id=document_id, error=str(e))
        try:
            async with async_session() as session:
                from sqlalchemy import text
                await session.execute(
                    text("UPDATE documents SET processing_status = 'FAILED', updated_at = NOW() WHERE id = :doc_id"),
                    {"doc_id": doc_uuid}
                )
                await session.commit()
        except Exception:
            pass
        raise e
