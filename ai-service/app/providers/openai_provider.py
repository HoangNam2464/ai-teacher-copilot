import json
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI

from app.providers.base import BaseAIProvider

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str = "", model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self.client = None
        if api_key and api_key.strip():
            self.client = AsyncOpenAI(api_key=api_key.strip())

    @property
    def provider_name(self) -> str:
        return "openai"

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Any:
        if not self.client:
            self.client = AsyncOpenAI(api_key=self.api_key.strip())

        full_system_prompt = self.format_prompt_with_sources(system_prompt, context_chunks)
            
        completion = await self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[
                {"role": "system", "content": full_system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=response_schema
        )
        return completion.choices[0].message.parsed

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not self.client:
            self.client = AsyncOpenAI(api_key=self.api_key.strip())

        response = await self.client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [data.embedding for data in response.data]
