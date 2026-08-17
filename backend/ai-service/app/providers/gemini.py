import google.generativeai as genai
from app.core.config import settings
import json

genai.configure(api_key=settings.GEMINI_API_KEY.strip())

async def get_embedding(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return result['embedding']

async def generate_structured_output(prompt: str, response_format_model):
    # Using gemini-1.5-flash for fast and cheap inference
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    # We pass the pydantic model to response_schema
    # google.generativeai >= 0.7.1 supports pydantic models
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=response_format_model
        )
    )
    
    # Parse the json string back to the pydantic model instance
    return response_format_model.model_validate_json(response.text)
