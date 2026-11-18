import json
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
import pydantic

from app.providers.base import BaseAIProvider
from app.providers.exceptions import (
    AIProviderError,
    AuthenticationError,
    InvalidRequestError,
    RateLimitError,
    ServiceUnavailableError,
)


class GeminiProvider(BaseAIProvider):
    """
    Adapter for Google Gemini LLM and Embedding models.
    Supports asynchronous structured generation and dense vector embeddings.
    """

    def __init__(self, api_key: str = "", model_name: str = "gemini-1.5-flash"):
        super().__init__()
        self.api_key = api_key.strip() if api_key else ""
        self.model_name = model_name
        if self.api_key:
            genai.configure(api_key=self.api_key)

    @property
    def provider_name(self) -> str:
        return "gemini"

    def _ensure_authenticated(self) -> None:
        """Validate that API key is configured before making requests."""
        if not self.api_key:
            raise AuthenticationError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in environment or .env.",
                provider="gemini",
            )

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> Any:
        self._ensure_authenticated()

        try:
            model = genai.GenerativeModel(self.model_name)

            # Combine system and user prompt with context if available inside <sources> tags (Rule 7.3)
            base_prompt = f"{system_prompt}\n\n{user_prompt}"
            full_prompt = self.format_prompt_with_sources(base_prompt, context_chunks)

            # Use asynchronous generation to prevent blocking the event loop
            response = await model.generate_content_async(
                full_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )

            if not response.text:
                raise InvalidRequestError("Gemini returned empty response text.", provider="gemini")

            return response_schema.model_validate_json(response.text)

        except google_exceptions.PermissionDenied as e:
            raise AuthenticationError(f"Gemini authentication failed: {e}", provider="gemini", original_error=e)
        except google_exceptions.ResourceExhausted as e:
            raise RateLimitError(f"Gemini quota/rate limit exceeded: {e}", provider="gemini", original_error=e)
        except google_exceptions.InvalidArgument as e:
            raise InvalidRequestError(f"Gemini invalid argument: {e}", provider="gemini", original_error=e)
        except google_exceptions.GoogleAPIError as e:
            raise ServiceUnavailableError(f"Gemini API service error: {e}", provider="gemini", original_error=e)
        except (json.JSONDecodeError, pydantic.ValidationError) as e:
            raise InvalidRequestError(
                f"Failed to validate Gemini structured output against schema: {e}",
                provider="gemini",
                original_error=e,
            )
        except Exception as e:
            if isinstance(e, AIProviderError):
                raise
            raise AIProviderError(f"Unexpected error in Gemini provider: {e}", provider="gemini", original_error=e)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        self._ensure_authenticated()

        if not texts:
            return []

        try:
            embeddings = []
            for text in texts:
                if not text.strip():
                    raise InvalidRequestError("Cannot generate embedding for empty text", provider="gemini")
                result = await genai.embed_content_async(
                    model="models/gemini-embedding-001",
                    content=text,
                    task_type="retrieval_document",
                    output_dimensionality=768,
                )
                embeddings.append(result["embedding"])
            return embeddings

        except google_exceptions.PermissionDenied as e:
            raise AuthenticationError(f"Gemini authentication failed: {e}", provider="gemini", original_error=e)
        except google_exceptions.ResourceExhausted as e:
            raise RateLimitError(f"Gemini quota/rate limit exceeded: {e}", provider="gemini", original_error=e)
        except google_exceptions.InvalidArgument as e:
            raise InvalidRequestError(f"Gemini invalid argument: {e}", provider="gemini", original_error=e)
        except google_exceptions.GoogleAPIError as e:
            raise ServiceUnavailableError(f"Gemini API service error: {e}", provider="gemini", original_error=e)
        except Exception as e:
            if isinstance(e, AIProviderError):
                raise
            raise AIProviderError(
                f"Unexpected error in Gemini embedding generation: {e}",
                provider="gemini",
                original_error=e,
            )
