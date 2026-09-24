from typing import Dict, List, Optional, Type
from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.mock_provider import MockAIProvider

class UnsupportedProviderError(ValueError):
    """Raised when an unrecognized AI provider is requested."""
    pass

class AIProviderFactory:
    """
    Factory & Resolver for AI Providers.
    Supports dynamic registration, configuration-driven resolution,
    and client instance caching.
    """

    def __init__(self):
        self._registry: Dict[str, Type[BaseAIProvider]] = {
            "gemini": GeminiProvider,
            "openai": OpenAIProvider,
            "mock": MockAIProvider,
        }
        self._instances: Dict[str, BaseAIProvider] = {}

    def register_provider(self, name: str, provider_cls: Type[BaseAIProvider]) -> None:
        """
        Register a new or custom AI provider class at runtime.
        Enables business logic and test suites to inject alternative providers
        without modifying core code.
        """
        normalized = name.strip().lower()
        if not issubclass(provider_cls, BaseAIProvider):
            raise TypeError(f"Provider class {provider_cls} must inherit from BaseAIProvider")
        self._registry[normalized] = provider_cls
        if normalized in self._instances:
            del self._instances[normalized]

    def resolve(self, provider_name: Optional[str] = None) -> BaseAIProvider:
        """
        Resolve an AI provider instance based on an explicit provider_name
        or the application settings (settings.AI_PROVIDER).
        """
        target = (provider_name or settings.AI_PROVIDER).strip().lower()

        if target in self._instances:
            return self._instances[target]

        if target not in self._registry:
            supported = ", ".join(f"'{k}'" for k in self._registry.keys())
            raise UnsupportedProviderError(
                f"Unsupported AI Provider: '{target}'. Supported providers are: {supported}."
            )

        provider_cls = self._registry[target]

        if target == "openai":
            instance = provider_cls(
                api_key=settings.OPENAI_API_KEY,
                model_name=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            )
        elif target == "gemini":
            instance = provider_cls(
                api_key=settings.GEMINI_API_KEY,
                model_name=getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash"),
            )
        elif target == "mock":
            instance = provider_cls(
                embedding_dimension=getattr(settings, "EMBEDDING_DIMENSION", 768),
            )
        else:
            instance = provider_cls()

        self._instances[target] = instance
        return instance

    def list_supported_providers(self) -> List[str]:
        """Return list of all registered provider names."""
        return list(self._registry.keys())

    def clear_cache(self) -> None:
        """Clear cached provider instances."""
        self._instances.clear()

# Global factory singleton
provider_factory = AIProviderFactory()

def get_ai_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
    """
    Convenience resolver function for services, ingestion, retrieval, and route handlers.
    Resolves provider from config or explicit parameter.
    """
    return provider_factory.resolve(provider_name)
