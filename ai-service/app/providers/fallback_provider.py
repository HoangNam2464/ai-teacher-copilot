"""
Transparent Fallback AI Provider Adapter (BE-014 / QA-016).
Provides resilience by falling back to a secondary provider if the primary provider
encounters an AIProviderError (rate limits, service outages, authentication failures).
"""

from typing import Any, Dict, List, Optional, Type, TypeVar
import structlog
from pydantic import BaseModel

from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError

logger = structlog.get_logger()
T = TypeVar("T", bound=BaseModel)


class FallbackAIProvider(BaseAIProvider):
    """
    Composite AI provider implementing transparent error fallback.
    Dispatches generation and embedding requests to the primary provider.
    If the primary provider raises an AIProviderError, automatically falls back
    to the designated fallback provider.
    """

    def __init__(self, primary: BaseAIProvider, fallback: BaseAIProvider):
        super().__init__()
        self.primary = primary
        self.fallback = fallback

    @property
    def provider_name(self) -> str:
        return f"{self.primary.provider_name}_fallback_{self.fallback.provider_name}"

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T] | Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> T:
        """
        Attempt structured generation with primary provider.
        On AIProviderError, seamlessly switch to fallback provider.
        """
        try:
            return await self.primary.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=response_schema,
                context_chunks=context_chunks,
            )
        except AIProviderError as primary_err:
            logger.warning(
                "primary_provider_failed_triggering_fallback",
                primary=self.primary.provider_name,
                fallback=self.fallback.provider_name,
                error=str(primary_err),
            )
            try:
                return await self.fallback.generate_structured_output(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    response_schema=response_schema,
                    context_chunks=context_chunks,
                )
            except Exception as fallback_err:
                logger.error(
                    "fallback_provider_also_failed",
                    fallback=self.fallback.provider_name,
                    error=str(fallback_err),
                )
                raise AIProviderError(
                    f"Primary provider '{self.primary.provider_name}' failed ({primary_err}), "
                    f"and fallback provider '{self.fallback.provider_name}' also failed ({fallback_err}).",
                    provider=self.provider_name,
                    original_error=fallback_err,
                )

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Attempt embedding generation with primary provider.
        On AIProviderError, seamlessly switch to fallback provider.
        """
        try:
            return await self.primary.generate_embeddings(texts)
        except AIProviderError as primary_err:
            logger.warning(
                "primary_embedding_failed_triggering_fallback",
                primary=self.primary.provider_name,
                fallback=self.fallback.provider_name,
                error=str(primary_err),
            )
            try:
                return await self.fallback.generate_embeddings(texts)
            except Exception as fallback_err:
                logger.error(
                    "fallback_embedding_also_failed",
                    fallback=self.fallback.provider_name,
                    error=str(fallback_err),
                )
                raise AIProviderError(
                    f"Primary provider '{self.primary.provider_name}' embedding failed ({primary_err}), "
                    f"and fallback provider '{self.fallback.provider_name}' also failed ({fallback_err}).",
                    provider=self.provider_name,
                    original_error=fallback_err,
                )
