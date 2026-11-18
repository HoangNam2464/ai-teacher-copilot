"""
Document Ingestion & Validation API Routes [BE-035].

Provides endpoints for asynchronous processing pipeline dispatch
and synchronous document integrity & text-content validation.
"""

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field
import structlog

from app.core.security import verify_api_key
from app.core.config import settings
from app.ingestion.service import process_document_pipeline, minio_client
from app.ingestion.parser import DocumentParser
from app.ingestion.exceptions import (
    CorruptFileError,
    EmptyTextError,
    UnsupportedFileFormatError,
)

logger = structlog.get_logger()
router = APIRouter()


class ValidationRequest(BaseModel):
    minio_object_key: str = Field(..., description="MinIO storage key for uploaded file")


class ValidationResponse(BaseModel):
    valid: bool
    status: str
    message: str
    character_count: int = 0
    error_code: str | None = None


@router.post("/process", status_code=status.HTTP_202_ACCEPTED)
async def process_document(
    document_id: str,
    workspace_id: str,
    minio_object_key: str,
    background_tasks: BackgroundTasks,
    _api_key: str = Depends(verify_api_key),
):
    """
    Triggers asynchronous document processing pipeline.
    Errors are caught gracefully and persisted to document metadata.
    """
    background_tasks.add_task(process_document_pipeline, document_id, workspace_id, minio_object_key)
    return {"status": "accepted", "document_id": document_id}


@router.post("/validate", response_model=ValidationResponse)
async def validate_document(
    request: ValidationRequest,
    _api_key: str = Depends(verify_api_key),
):
    """
    Synchronously inspects a document stored in MinIO for corrupt structure or empty text (AC-3).
    Returns clear, human-readable diagnostic messages without running full embedding/indexing.
    """
    try:
        response = minio_client.get_object(settings.MINIO_BUCKET_DOCUMENTS, request.minio_object_key)
        file_bytes = response.read()
        response.close()
        response.release_conn()
    except Exception as e:
        logger.error("validation_minio_read_failed", key=request.minio_object_key, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy tập tin trong kho lưu trữ MinIO: {e}"
        )

    try:
        text = DocumentParser.parse(file_bytes, request.minio_object_key, allow_empty=False)
        return ValidationResponse(
            valid=True,
            status="VALID",
            message="Tập tin hợp lệ và chứa nội dung văn bản có thể xử lý.",
            character_count=len(text)
        )
    except CorruptFileError as cfe:
        return ValidationResponse(
            valid=False,
            status="CORRUPT_FILE",
            message=cfe.message,
            error_code=cfe.error_code
        )
    except EmptyTextError as ete:
        return ValidationResponse(
            valid=False,
            status="EMPTY_TEXT",
            message=ete.message,
            error_code=ete.error_code
        )
    except UnsupportedFileFormatError as ufe:
        return ValidationResponse(
            valid=False,
            status="UNSUPPORTED_FORMAT",
            message=ufe.message,
            error_code=ufe.error_code
        )
