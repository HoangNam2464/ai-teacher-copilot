from typing import Any, Dict, List
from app.providers.base import BaseAIProvider

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Dict[str, Any],
        context_chunks: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {"status": "Not implemented"}

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return []
