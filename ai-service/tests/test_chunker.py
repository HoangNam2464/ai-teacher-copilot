import pytest
import uuid
import tiktoken
from app.ingestion.chunker import StructureAwareChunker
from app.ingestion.models import DocumentMetadata

def test_structure_aware_chunker():
    chunker = StructureAwareChunker(chunk_size=50, overlap=10)
    
    # 50 tokens is a small chunk size to test functionality
    text = "Paragraph 1: This is a short paragraph.\n\n" \
           "Paragraph 2: This is another paragraph that should hopefully fit in the same chunk if chunk size allows.\n\n" \
           "Paragraph 3: " + "word "*100 + "\n\n" \
           "Paragraph 4: End."
           
    metadata = DocumentMetadata(
        workspace_id=uuid.uuid4(),
        document_id=uuid.uuid4()
    )
    
    chunks = chunker.chunk(text, metadata)
    
    assert len(chunks) > 0
    
    encoder = tiktoken.get_encoding("cl100k_base")
    for c in chunks:
        # Check if any chunk exceeds chunk size significantly
        # Note: due to structural paragraph boundaries, it should strictly not exceed except if a single word is huge, 
        # but our logic hard-splits if para_tokens > chunk_size, so it should be strictly <= 50 tokens.
        assert c.token_count <= 50
        assert c.metadata.document_id == metadata.document_id
        
    # Check if text is completely captured
    total_text = " ".join([c.text for c in chunks])
    assert "Paragraph 1" in total_text
    assert "Paragraph 4" in total_text
