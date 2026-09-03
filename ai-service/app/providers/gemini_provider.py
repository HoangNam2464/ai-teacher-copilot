import json
from typing import Any, Dict, List
import google.generativeai as genai

from app.providers.base import BaseAIProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        if api_key.strip():
            genai.configure(api_key=api_key.strip())

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: List[Dict[str, Any]] = None
    ) -> Any:
        # Using gemini-1.5-flash for fast and cheap inference
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Combine system and user prompt with context if available
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        if context_chunks:
            full_prompt += "\n\n<sources>\n"
            for chunk in context_chunks:
                full_prompt += f"{chunk.get('content', '')}\n"
            full_prompt += "</sources>"
            
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
