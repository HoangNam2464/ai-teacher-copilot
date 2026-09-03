import json
from typing import Any, Dict, List
from openai import AsyncOpenAI

from app.providers.base import BaseAIProvider

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key.strip():
            self.client = AsyncOpenAI(api_key=api_key.strip())

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: List[Dict[str, Any]] = None
    ) -> Any:
        
        full_system_prompt = system_prompt
        if context_chunks:
            full_system_prompt += "\n\n<sources>\n"
            for chunk in context_chunks:
                full_system_prompt += f"{chunk.get('content', '')}\n"
            full_system_prompt += "</sources>"
            
        completion = await self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": full_system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format=response_schema
        )
        return completion.choices[0].message.parsed

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [data.embedding for data in response.data]
