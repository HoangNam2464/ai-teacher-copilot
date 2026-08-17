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
from app.providers.gemini import get_embedding

logger = structlog.get_logger()

# Setup MinIO client
minio_client = Minio(
    settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_ENDPOINT.startswith("https")
)

async def process_document_pipeline(document_id: str, workspace_id: str, minio_key: str):
    logger.info("pipeline_started", doc_id=document_id)
    try:
        # 1. Fetch from MinIO
        response = minio_client.get_object(settings.MINIO_BUCKET_DOCUMENTS, minio_key)
        file_bytes = response.read()
        response.close()
        response.release_conn()
        
        # 2. Parse
        text = DocumentParser.parse(file_bytes, minio_key)
        
        # 3. Chunk
        chunker = StructureAwareChunker()
        chunks = chunker.chunk(text)
        
        # 4. Embed & Save
        async with async_session() as session:
            for idx, chunk_text in enumerate(chunks):
                if not chunk_text.strip():
                    continue
                embedding = await get_embedding(chunk_text)
                
                doc_chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    workspace_id=workspace_id,
                    content=chunk_text,
                    chunk_index=idx,
                    embedding=embedding
                )
                session.add(doc_chunk)
                
            await session.commit()
        
        logger.info("pipeline_completed", doc_id=document_id, total_chunks=len(chunks))
    except Exception as e:
        logger.error("pipeline_failed", doc_id=document_id, error=str(e))
        raise e
