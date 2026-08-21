import os
from dotenv import load_dotenv
import google.generativeai as genai
from app.core.config import settings

def _ensure_configured():
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        load_dotenv("../.env", override=True)
        load_dotenv(".env", override=True)
        api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY chưa được cấu hình trong file .env. Vui lòng thêm GEMINI_API_KEY vào .env.")
    genai.configure(api_key=api_key)

import asyncio

async def get_embedding(text: str) -> list[float]:
    _ensure_configured()
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return result['embedding']

async def get_embeddings_batch(texts: list[str], batch_size: int = 2) -> list[list[float]]:
    _ensure_configured()
    if not texts:
        return []

    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        max_retries = 5
        for attempt in range(max_retries):
            try:
                result = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=batch if len(batch) > 1 else batch[0],
                    task_type="retrieval_document",
                    output_dimensionality=768
                )
                embeddings = result['embedding']
                # If single string was sent, embeddings is a single float list
                if len(batch) == 1 and isinstance(embeddings, list) and len(embeddings) > 0 and isinstance(embeddings[0], (int, float)):
                    all_embeddings.append(embeddings)
                else:
                    all_embeddings.extend(embeddings)
                break
            except Exception as e:
                if ("429" in str(e) or "ResourceExhausted" in str(e)) and attempt < max_retries - 1:
                    wait_time = 3 * (attempt + 1)
                    await asyncio.sleep(wait_time)
                else:
                    raise e
        if i + batch_size < len(texts):
            await asyncio.sleep(1.2)

    return all_embeddings

import json

async def generate_structured_output(prompt: str, response_format_model):
    _ensure_configured()
    model = genai.GenerativeModel(
        model_name='gemini-3.5-flash-lite',
        system_instruction="You are a professional AI teaching assistant for K-12 teachers in Vietnam. Always generate detailed, high-quality structured content in Vietnamese according to the requested JSON schema."
    )

    schema_json = json.dumps(response_format_model.model_json_schema(), ensure_ascii=False)
    structured_prompt = f"""{prompt}

IMPORTANT: You MUST respond ONLY with a valid JSON object matching this schema:
{schema_json}
"""

    max_retries = 4
    last_err = None
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                structured_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            return response_format_model.model_validate_json(response.text)
        except Exception as e:
            last_err = e
            if ("429" in str(e) or "ResourceExhausted" in str(e)) and attempt < max_retries - 1:
                await asyncio.sleep(6 * (attempt + 1))
            else:
                raise e
    raise last_err
