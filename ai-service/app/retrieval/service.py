from sqlalchemy import select
from app.core.database import async_session
from app.core.models import DocumentChunk
from app.providers.factory import get_ai_provider

async def search_similar_chunks(query: str, workspace_id: str, top_k: int = 5):
    provider = get_ai_provider()
    embeddings = await provider.generate_embeddings([query])
    query_embedding = embeddings[0]
    
    async with async_session() as session:
        # L2 distance <-> operator for pgvector
        stmt = (
            select(DocumentChunk)
            .filter(DocumentChunk.workspace_id == workspace_id)
            .order_by(DocumentChunk.embedding.l2_distance(query_embedding))
            .limit(top_k)
        )
        result = await session.execute(stmt)
        chunks = result.scalars().all()
        return chunks
