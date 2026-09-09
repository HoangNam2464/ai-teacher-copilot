from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider

def get_ai_provider() -> BaseAIProvider:
    provider_name = settings.AI_PROVIDER.lower()
    
    if provider_name == "openai":
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    elif provider_name == "gemini":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        raise ValueError(f"Unsupported AI Provider: {provider_name}")
