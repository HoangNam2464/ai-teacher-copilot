"""
Standardized exceptions for AI Provider Adapters (BE-014).
Ensures unified error handling across Gemini, OpenAI, and any future LLM providers.
"""

from typing import Optional


class AIProviderError(Exception):
    """Base exception for all AI provider adapter errors."""

    def __init__(
        self,
        message: str,
        provider: str = "unknown",
        original_error: Optional[Exception] = None,
    ):
        super().__init__(message)
        self.message = message
        self.provider = provider
        self.original_error = original_error

    def __str__(self) -> str:
        return f"[{self.provider.upper()}] {self.message}"


class AuthenticationError(AIProviderError):
    """Raised when an API key is missing, invalid, or unauthorized."""
    pass


class RateLimitError(AIProviderError):
    """Raised when request quota or rate limits are exceeded."""
    pass


class InvalidRequestError(AIProviderError):
    """Raised when invalid parameters, context length, or schema validation errors occur."""
    pass


class ServiceUnavailableError(AIProviderError):
    """Raised when the AI provider service is down or unreachable."""
    pass
