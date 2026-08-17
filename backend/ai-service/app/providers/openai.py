from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.strip())

async def get_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

async def generate_structured_output(prompt: str, response_format_model):
    completion = await client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful AI assistant for teachers. You must output JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format=response_format_model
    )
    return completion.choices[0].message.parsed
