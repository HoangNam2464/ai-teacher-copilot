"""
Document ingestion routes — parsing, chunking, embedding.
Called by Spring Boot after a document is uploaded to MinIO.
"""

from fastapi import APIRouter, Depends

from app.core.security import verify_api_key

router = APIRouter()


@router.post("/process")
async def process_document(
    document_id: str,
    workspace_id: str,
    minio_object_key: str,
    _api_key: str = Depends(verify_api_key),
):
    """
    Process a document: parse → chunk → embed → store vectors.
    Called internally by Spring Boot after file upload.

    TODO: Implement in Phase 4 (Document Knowledge Base)
    - Parse PDF/DOCX/TXT
    - Structure-aware chunking
    - Generate embeddings
    - Store chunks + vectors in pgvector
    """
    return {
        "status": "accepted",
        "document_id": document_id,
        "message": "Document processing endpoint — implementation in Phase 4",
    }
