import json
from typing import Any, Dict, List, Optional
import openai
from openai import AsyncOpenAI
import pydantic

from app.providers.base import BaseAIProvider
from app.providers.exceptions import (
    AIProviderError,
    AuthenticationError,
    InvalidRequestError,
    RateLimitError,
    ServiceUnavailableError,
)


class OpenAIProvider(BaseAIProvider):
    """
    Adapter for OpenAI LLM and Embedding models.
    Supports asynchronous structured generation and dense vector embeddings.
    """

    def __init__(self, api_key: str = "", model_name: str = "gpt-4o-mini"):
        super().__init__()
        self.api_key = api_key.strip() if api_key else ""
        self.model_name = model_name
        self.client: Optional[AsyncOpenAI] = None
        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)

    @property
    def provider_name(self) -> str:
        return "openai"

    def _ensure_authenticated(self) -> None:
        """Validate that API key is configured before making requests."""
        if not self.api_key:
            raise AuthenticationError(
                "OpenAI API key is not configured. Please set OPENAI_API_KEY in environment or .env.",
                provider="openai",
            )
        if not self.client:
            self.client = AsyncOpenAI(api_key=self.api_key)

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> Any:
        self._ensure_authenticated()

        try:
            full_system_prompt = self.format_prompt_with_sources(system_prompt, context_chunks)

            completion = await self.client.beta.chat.completions.parse(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format=response_schema,
            )

            parsed = completion.choices[0].message.parsed
            if parsed is None:
                raise InvalidRequestError("OpenAI returned null parsed structured output.", provider="openai")

            return parsed

        except openai.AuthenticationError as e:
            raise AuthenticationError(f"OpenAI authentication failed: {e}", provider="openai", original_error=e)
        except openai.RateLimitError as e:
            raise RateLimitError(f"OpenAI quota/rate limit exceeded: {e}", provider="openai", original_error=e)
        except openai.BadRequestError as e:
            raise InvalidRequestError(f"OpenAI invalid request: {e}", provider="openai", original_error=e)
        except (openai.APIConnectionError, openai.APIStatusError) as e:
            raise ServiceUnavailableError(f"OpenAI service connectivity error: {e}", provider="openai", original_error=e)
        except (json.JSONDecodeError, pydantic.ValidationError) as e:
            raise InvalidRequestError(
                f"Failed to validate OpenAI structured output against schema: {e}",
                provider="openai",
                original_error=e,
            )
        except Exception as e:
            if isinstance(e, AIProviderError):
                raise
            raise AIProviderError(f"Unexpected error in OpenAI provider: {e}", provider="openai", original_error=e)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        self._ensure_authenticated()

        if not texts:
            return []

        try:
            for text in texts:
                if not text.strip():
                    raise InvalidRequestError("Cannot generate embedding for empty text", provider="openai")

            response = await self.client.embeddings.create(
                input=texts,
                model="text-embedding-3-small",
            )
            return [data.embedding for data in response.data]

        except openai.AuthenticationError as e:
            raise AuthenticationError(f"OpenAI authentication failed: {e}", provider="openai", original_error=e)
        except openai.RateLimitError as e:
            raise RateLimitError(f"OpenAI quota/rate limit exceeded: {e}", provider="openai", original_error=e)
        except openai.BadRequestError as e:
            raise InvalidRequestError(f"OpenAI invalid request: {e}", provider="openai", original_error=e)
        except (openai.APIConnectionError, openai.APIStatusError) as e:
            raise ServiceUnavailableError(f"OpenAI service connectivity error: {e}", provider="openai", original_error=e)
        except Exception as e:
            if isinstance(e, AIProviderError):
                raise
            raise AIProviderError(
                f"Unexpected error in OpenAI embedding generation: {e}",
                provider="openai",
                original_error=e,
            )
