"""
Pydantic schemas for RAG Retrieval (BE-015).
Defines contracts for similarity search requests, chunk metadata, and evidence evaluation.
"""

from typing import Any, Iterator, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class RetrievalRequest(BaseModel):
    """
    Request payload for vector similarity search with workspace isolation.
    """
    model_config = ConfigDict(extra="ignore")

    query: str = Field(
        ...,
        min_length=1,
        description="Search query string to find relevant document chunks",
        examples=["Định lý Cosin và ứng dụng giải tam giác"],
    )
    workspace_id: uuid.UUID = Field(
        ...,
        description="Mandatory workspace ID to ensure multi-tenant data isolation",
    )
    document_ids: Optional[List[uuid.UUID]] = Field(
        default=None,
        description="Optional list of document IDs to restrict search within",
    )
    subject: Optional[str] = Field(
        default=None,
        description="Optional filter by curriculum subject (e.g. Toán, Vật lí)",
    )
    grade_level: Optional[str] = Field(
        default=None,
        description="Optional filter by grade level (e.g. 10, 11, 12)",
    )
    topic: Optional[str] = Field(
        default=None,
        description="Optional filter by pedagogical topic",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of top chunks to retrieve (default: 5, max: 10 per Rule 3.3)",
    )
    similarity_threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity threshold to consider evidence relevant",
    )


class RetrievedChunk(BaseModel):
    """
    Retrieved document chunk with provenance metadata for citation grounding.
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique identifier of the document chunk")
    content: str = Field(..., description="Text content of the retrieved chunk")
    document_id: uuid.UUID = Field(..., description="Parent document UUID for citation traceability")
    source_page: Optional[int] = Field(default=None, description="Source page number in original document")
    chunk_index: int = Field(..., description="Sequential index of the chunk in the document")
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 - 1.0)")
    subject: Optional[str] = Field(default=None, description="Curriculum subject")
    grade_level: Optional[str] = Field(default=None, description="Grade level")
    topic: Optional[str] = Field(default=None, description="Pedagogical topic")


class RetrievalResponse(BaseModel):
    """
    Response returned by vector similarity search.
    Implements sequence protocols for backward compatibility with generation pipelines.
    """
    model_config = ConfigDict(from_attributes=True)

    chunks: List[RetrievedChunk] = Field(
        default_factory=list,
        description="List of top-k retrieved chunks meeting the similarity threshold",
    )
    insufficient_evidence: bool = Field(
        default=False,
        description="True if 0 chunks matched or top similarity score fell below threshold",
    )
    query: Optional[str] = Field(default=None, description="Original query text")
    total_retrieved: int = Field(default=0, description="Number of relevant chunks returned")

    def __iter__(self) -> Iterator[RetrievedChunk]:
        return iter(self.chunks)

    def __len__(self) -> int:
        return len(self.chunks)

    def __getitem__(self, index: int) -> RetrievedChunk:
        return self.chunks[index]
