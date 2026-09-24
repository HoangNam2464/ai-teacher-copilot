import json
from typing import Any, Dict, List, Optional
import google.generativeai as genai

from app.providers.base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str = "", model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        if api_key and api_key.strip():
            genai.configure(api_key=api_key.strip())

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Any:
        # Using gemini-1.5-flash for fast and cheap inference
        model = genai.GenerativeModel(self.model_name)
        
        # Combine system and user prompt with context if available inside <sources> tags
        base_prompt = f"{system_prompt}\n\n{user_prompt}"
        full_prompt = self.format_prompt_with_sources(base_prompt, context_chunks)
            
        response = model.generate_content(
            full_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        return response_schema.model_validate_json(response.text)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        # For gemini, embed_content can take a list of strings
        embeddings = []
        for text in texts:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            embeddings.append(result['embedding'])
        return embeddings
