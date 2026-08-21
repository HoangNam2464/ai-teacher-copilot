import uuid
from sqlalchemy import select
from app.core.database import async_session
from app.core.models import DocumentChunk
from app.providers.gemini import get_embedding

async def search_similar_chunks(query: str, workspace_id: str, top_k: int = 5):
    query_embedding = await get_embedding(query)
    ws_uuid = uuid.UUID(str(workspace_id))

    async with async_session() as session:
        stmt = (
            select(DocumentChunk)
            .filter(DocumentChunk.workspace_id == ws_uuid)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        result = await session.execute(stmt)
        chunks = result.scalars().all()
        return chunks
