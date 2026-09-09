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
from app.providers.factory import get_ai_provider

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
        from app.ingestion.models import DocumentMetadata
        metadata = DocumentMetadata(
            workspace_id=uuid.UUID(workspace_id),
            document_id=uuid.UUID(document_id)
        )
        chunker = StructureAwareChunker()
        chunks = chunker.chunk(text, metadata)
        
        # 4. Embed & Save
        ai_provider = get_ai_provider()
        
        async with async_session() as session:
            for c in chunks:
                if not c.text.strip():
                    continue
                
                try:
                    embeddings = await ai_provider.generate_embeddings([c.text])
                    if not embeddings:
                        raise ValueError("Provider returned empty embeddings")
                    embedding = embeddings[0]
                except Exception as e:
                    logger.error("chunk_embedding_failed", doc_id=document_id, chunk_index=c.chunk_index, error=str(e))
                    raise Exception(f"Failed to generate embedding for chunk {c.chunk_index}: {e}")
                
                doc_chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=uuid.UUID(document_id),
                    workspace_id=uuid.UUID(workspace_id),
                    content=c.text,
                    chunk_index=c.chunk_index,
                    embedding=embedding
                )
                session.add(doc_chunk)
                
            await session.commit()
        
        logger.info("pipeline_completed", doc_id=document_id, total_chunks=len(chunks))
    except Exception as e:
        logger.error("pipeline_failed", doc_id=document_id, error=str(e))
        raise e
