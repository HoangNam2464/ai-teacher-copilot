from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class BaseAIProvider(ABC):
    """
    Abstract Base Class for AI Providers (Gemini, OpenAI, Mock, etc.).
    Ensures all LLM providers adhere to a unified interface for the AI Teacher Copilot,
    decoupling core business workflows from vendor-specific SDK implementations.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Base constructor accepting variable parameters for provider implementations."""
        pass

    @property
    def provider_name(self) -> str:
        """Return the unique identifier for the provider (e.g. 'gemini', 'openai', 'mock')."""
        return getattr(self, "_provider_name", "base")

    @abstractmethod
    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T] | Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> T:
        """
        Generate structured output validated against a Pydantic schema.
        Context chunks must be encapsulated within <sources>...</sources> boundaries.
        """
        pass

    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate dense vector embeddings for a list of text strings.
        """
        pass

    def format_prompt_with_sources(
        self,
        base_prompt: str,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        Helper method to strictly enforce prompt boundary convention (Rule 7.3):
        Retrieved context chunks MUST be passed inside dedicated <sources>...</sources> boundaries
        and treated strictly as untrusted reference data.
        """
        if not context_chunks:
            return base_prompt

        sources_text = "\n".join(
            f"[Chunk {chunk.get('chunk_id', i+1)}]: {chunk.get('content', '')}"
            for i, chunk in enumerate(context_chunks)
        )
        return f"{base_prompt}\n\n<sources>\n{sources_text}\n</sources>"
