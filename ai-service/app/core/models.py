import uuid
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    workspace_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    content = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Vector(768))
    token_count = Column(Integer)
    subject = Column(String(100))
    grade_level = Column(String(50))
    topic = Column(String(255))
    source_page = Column(Integer)
    source_location = Column(String)
