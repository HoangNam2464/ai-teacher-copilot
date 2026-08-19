from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.security import verify_api_key
from app.ingestion.service import process_document_pipeline
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.post("/process", status_code=202)
async def process_document(
    document_id: str,
    workspace_id: str,
    minio_object_key: str,
    background_tasks: BackgroundTasks,
    _api_key: str = Depends(verify_api_key),
):
    background_tasks.add_task(process_document_pipeline, document_id, workspace_id, minio_object_key)
    return {"status": "accepted", "document_id": document_id}
