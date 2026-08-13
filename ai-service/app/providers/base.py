from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseAIProvider(ABC):
    """
    Abstract base class for AI Providers (OpenAI, Gemini).
    Ensures all providers implement the same interface for the Copilot.
    """

    @abstractmethod
    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Dict[str, Any],
        context_chunks: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate structured output based on a JSON schema.
        """
        pass

    @abstractmethod
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate vector embeddings for a list of strings.
        """
        pass
