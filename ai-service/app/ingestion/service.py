"""
Document Processing & Ingestion Pipeline Service [BE-035].

Handles downloading from MinIO, parsing via DocumentParser, structure-aware chunking,
generating embeddings with provider abstraction, and vector persistence in pgvector.
Resiliently catches corrupt files and empty text without crashing the ingestion service.
"""

import asyncio
import io
import uuid
import structlog
from minio import Minio
from sqlalchemy import text as sa_text

from app.core.config import settings
from app.core.database import async_session
from app.core.models import DocumentChunk
from app.ingestion.parser import DocumentParser
from app.ingestion.chunker import StructureAwareChunker
from app.ingestion.exceptions import (
    CorruptFileError,
    EmptyTextError,
    UnsupportedFileFormatError,
    DocumentIngestionError,
)
from app.providers.factory import get_ai_provider

logger = structlog.get_logger()

# Setup MinIO client
minio_client = Minio(
    settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_ENDPOINT.startswith("https")
)


async def _mark_document_failed(doc_uuid: uuid.UUID, error_message: str) -> None:
    """Safely updates document status to FAILED with error message in database."""
    try:
        async with async_session() as session:
            try:
                await session.execute(
                    sa_text(
                        "UPDATE documents SET processing_status = 'FAILED', error_message = :msg, updated_at = NOW() "
                        "WHERE id = :doc_id"
                    ),
                    {"doc_id": doc_uuid, "msg": error_message[:1000]}
                )
            except Exception:
                # Fallback if error_message column is not present in legacy test schema
                await session.execute(
                    sa_text("UPDATE documents SET processing_status = 'FAILED', updated_at = NOW() WHERE id = :doc_id"),
                    {"doc_id": doc_uuid}
                )
            await session.commit()
            logger.info("document_status_updated_failed", doc_id=str(doc_uuid), error=error_message)
    except Exception as db_err:
        logger.error("failed_to_update_status_failed", doc_id=str(doc_uuid), error=str(db_err))


async def process_document_pipeline(document_id: str, workspace_id: str, minio_key: str) -> dict:
    """
    Executes the end-to-end document ingestion pipeline.

    Guarantees:
    1. Corrupt files are detected and rejected.
    2. Empty text files (scanned images without text) are handled and rejected.
    3. Document status in database is updated to FAILED with detailed message.
    4. Does NOT crash the ingestion service worker (AC-4).

    Returns:
        dict: Ingestion summary with status ("SUCCESS" | "FAILED").
    """
    logger.info("pipeline_started", doc_id=document_id, workspace_id=workspace_id, minio_key=minio_key)
    try:
        doc_uuid = uuid.UUID(str(document_id))
        ws_uuid = uuid.UUID(str(workspace_id))
    except (ValueError, TypeError) as id_err:
        err_msg = f"Mã định danh không hợp lệ: {id_err}"
        logger.error("invalid_identifier", doc_id=document_id, error=err_msg)
        return {"status": "FAILED", "error": err_msg, "error_code": "INVALID_UUID"}

    try:
        # 1. Fetch file bytes from MinIO
        try:
            response = minio_client.get_object(settings.MINIO_BUCKET_DOCUMENTS, minio_key)
            file_bytes = response.read()
            response.close()
            response.release_conn()
        except Exception as minio_err:
            err_msg = f"Không thể tải tập tin từ MinIO storage: {minio_err}"
            logger.error("minio_fetch_failed", doc_id=document_id, error=err_msg)
            await _mark_document_failed(doc_uuid, err_msg)
            return {"status": "FAILED", "error": err_msg, "error_code": "STORAGE_ERROR"}

        # 2. Parse text with corruption & empty text detection
        try:
            text = DocumentParser.parse(file_bytes, minio_key, allow_empty=False)
        except CorruptFileError as cfe:
            err_msg = f"Tập tin bị hỏng hoặc lỗi định dạng: {cfe.message}"
            logger.warn("pipeline_corrupt_file_detected", doc_id=document_id, error=err_msg)
            await _mark_document_failed(doc_uuid, err_msg)
            return {"status": "FAILED", "error": err_msg, "error_code": "CORRUPT_FILE"}
        except EmptyTextError as ete:
            err_msg = f"Tài liệu không chứa nội dung văn bản: {ete.message}"
            logger.warn("pipeline_empty_text_detected", doc_id=document_id, error=err_msg)
            await _mark_document_failed(doc_uuid, err_msg)
            return {"status": "FAILED", "error": err_msg, "error_code": "EMPTY_TEXT"}
        except UnsupportedFileFormatError as ufe:
            err_msg = f"Định dạng không hỗ trợ: {ufe.message}"
            logger.warn("pipeline_unsupported_format", doc_id=document_id, error=err_msg)
            await _mark_document_failed(doc_uuid, err_msg)
            return {"status": "FAILED", "error": err_msg, "error_code": "UNSUPPORTED_FORMAT"}

        # 3. Structure-aware Chunking
        from app.ingestion.models import DocumentMetadata
        metadata = DocumentMetadata(
            workspace_id=ws_uuid,
            document_id=doc_uuid
        )
        chunker = StructureAwareChunker()
        chunks = chunker.chunk(text, metadata)

        if not chunks:
            err_msg = "Không thể phân đoạn văn bản (nội dung rỗng sau khi xử lý)."
            logger.warn("pipeline_no_chunks_generated", doc_id=document_id)
            await _mark_document_failed(doc_uuid, err_msg)
            return {"status": "FAILED", "error": err_msg, "error_code": "EMPTY_CHUNKS"}

        # 4. Generate Embeddings & Persist to pgvector
        ai_provider = get_ai_provider()

        async with async_session() as session:
            # Delete any existing chunks for this document (idempotency)
            await session.execute(
                sa_text("DELETE FROM document_chunks WHERE document_id = :doc_id"),
                {"doc_id": doc_uuid}
            )

            for c in chunks:
                if not c.text.strip():
                    continue

                try:
                    embeddings = await ai_provider.generate_embeddings([c.text])
                    if not embeddings:
                        raise ValueError("Provider returned empty embeddings")
                    embedding = embeddings[0]
                except Exception as e:
                    err_msg = f"Lỗi tạo vector embedding cho đoạn {c.chunk_index}: {e}"
                    logger.error("chunk_embedding_failed", doc_id=document_id, chunk_index=c.chunk_index, error=str(e))
                    await _mark_document_failed(doc_uuid, err_msg)
                    return {"status": "FAILED", "error": err_msg, "error_code": "EMBEDDING_FAILED"}

                doc_chunk = DocumentChunk(
                    id=uuid.uuid4(),
                    document_id=doc_uuid,
                    workspace_id=ws_uuid,
                    content=c.text,
                    chunk_index=c.chunk_index,
                    embedding=embedding
                )
                session.add(doc_chunk)

            # Update document status to READY and save chunk count
            try:
                await session.execute(
                    sa_text(
                        "UPDATE documents SET processing_status = 'READY', chunk_count = :count, "
                        "error_message = NULL, updated_at = NOW() WHERE id = :doc_id"
                    ),
                    {"doc_id": doc_uuid, "count": len(chunks)}
                )
            except Exception:
                await session.execute(
                    sa_text("UPDATE documents SET processing_status = 'READY', chunk_count = :count, updated_at = NOW() WHERE id = :doc_id"),
                    {"doc_id": doc_uuid, "count": len(chunks)}
                )
            await session.commit()

        logger.info("pipeline_completed", doc_id=document_id, total_chunks=len(chunks))
        return {"status": "SUCCESS", "chunk_count": len(chunks), "document_id": document_id}

    except Exception as e:
        err_msg = f"Lỗi không xác định trong quá trình xử lý tài liệu: {str(e)}"
        logger.error("pipeline_unexpected_error", doc_id=document_id, error=err_msg)
        await _mark_document_failed(doc_uuid, err_msg)
        return {"status": "FAILED", "error": err_msg, "error_code": "INTERNAL_ERROR"}
