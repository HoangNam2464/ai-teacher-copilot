import tiktoken
from typing import List
from app.ingestion.models import Chunk, DocumentMetadata

class StructureAwareChunker:
    def __init__(self, chunk_size=512, overlap=50):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def chunk(self, text: str, metadata: DocumentMetadata) -> List[Chunk]:
        # Split into paragraphs by \n\n
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        
        chunks = []
        current_chunk_text = ""
        current_chunk_tokens = 0
        chunk_index = 0
        
        for para in paragraphs:
            para_tokens = len(self.encoder.encode(para))
            
            # Force split large paragraphs
            if para_tokens > self.chunk_size:
                # Flush current chunk if any
                if current_chunk_text:
                    chunks.append(Chunk(
                        text=current_chunk_text.strip(),
                        metadata=metadata,
                        chunk_index=chunk_index,
                        token_count=current_chunk_tokens
                    ))
                    chunk_index += 1
                    current_chunk_text = ""
                    current_chunk_tokens = 0
                
                # Split large paragraph by sliding window token overlap
                para_token_ids = self.encoder.encode(para)
                start = 0
                while start < len(para_token_ids):
                    end = start + self.chunk_size
                    slice_token_ids = para_token_ids[start:end]
                    slice_text = self.encoder.decode(slice_token_ids)
                    chunks.append(Chunk(
                        text=slice_text.strip(),
                        metadata=metadata,
                        chunk_index=chunk_index,
                        token_count=len(slice_token_ids)
                    ))
                    chunk_index += 1
                    start += (self.chunk_size - self.overlap)
                continue
            
            # Start a new chunk if paragraph exceeds limit
            if current_chunk_tokens + para_tokens > self.chunk_size:
                chunks.append(Chunk(
                    text=current_chunk_text.strip(),
                    metadata=metadata,
                    chunk_index=chunk_index,
                    token_count=current_chunk_tokens
                ))
                chunk_index += 1
                
                # Create overlap for the next chunk
                current_tokens_ids = self.encoder.encode(current_chunk_text)
                if len(current_tokens_ids) > self.overlap:
                    overlap_ids = current_tokens_ids[-self.overlap:]
                    overlap_text = self.encoder.decode(overlap_ids)
                else:
                    overlap_text = current_chunk_text
                
                current_chunk_text = overlap_text + "\n\n" + para
                current_chunk_tokens = len(self.encoder.encode(current_chunk_text))
            else:
                if current_chunk_text:
                    current_chunk_text += "\n\n" + para
                else:
                    current_chunk_text = para
                current_chunk_tokens = len(self.encoder.encode(current_chunk_text))
        
        # Add the last chunk
        if current_chunk_text:
            chunks.append(Chunk(
                text=current_chunk_text.strip(),
                metadata=metadata,
                chunk_index=chunk_index,
                token_count=current_chunk_tokens
            ))
            
        return chunks
