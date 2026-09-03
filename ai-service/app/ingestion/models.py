from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID

class DocumentMetadata(BaseModel):
    workspace_id: UUID
    document_id: UUID
    source_page: Optional[int] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    
class Chunk(BaseModel):
    text: str
    metadata: DocumentMetadata
    chunk_index: int
    token_count: int
