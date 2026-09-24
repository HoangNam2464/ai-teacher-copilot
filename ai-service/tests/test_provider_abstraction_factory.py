"""
Unit & Integration Tests for AI Provider Abstraction Interface & Factory (BE-013)

Tests interface enforcement, factory resolution, configuration-driven switching,
dynamic provider registration, error handling, and business logic decoupling.
"""

import pytest
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.factory import (
    AIProviderFactory,
    UnsupportedProviderError,
    get_ai_provider,
    provider_factory,
)
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.mock_provider import MockAIProvider


# Sample Pydantic model for structured output validation
class SampleLessonPlanSchema(BaseModel):
    title: str
    duration_minutes: int
    objectives: List[str]


class TestBaseAIProviderInterface:
    """AC1: Có AI provider interface & Abstract Base Class enforcement"""

    def test_cannot_instantiate_base_class_directly(self):
        """Test that BaseAIProvider cannot be instantiated directly without implementing abstract methods."""
        with pytest.raises(TypeError):
            BaseAIProvider()

    def test_subclass_must_implement_all_abstract_methods(self):
        """Test that a subclass missing abstract methods cannot be instantiated."""
        class IncompleteProvider(BaseAIProvider):
            async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
                return [[0.1] * 768]

        with pytest.raises(TypeError):
            IncompleteProvider()

    def test_prompt_sources_boundary_convention(self):
        """Test Rule 7.3: format_prompt_with_sources encloses context in <sources>...</sources> tags."""
        provider = MockAIProvider()
        base_prompt = "Soạn giáo án về định lý Cosin"
        chunks = [
            {"chunk_id": "c1", "content": "Định lý cosin: a^2 = b^2 + c^2 - 2bc*cos(A)"},
            {"chunk_id": "c2", "content": "Áp dụng định lý cosin trong bài toán tam giác"},
        ]

        formatted = provider.format_prompt_with_sources(base_prompt, chunks)

        assert "<sources>" in formatted
        assert "</sources>" in formatted
        assert "[Chunk c1]: Định lý cosin" in formatted
        assert "[Chunk c2]: Áp dụng định lý cosin" in formatted

    def test_prompt_without_sources_returns_base_prompt(self):
        """Test that empty or None context chunks return the base prompt unchanged."""
        provider = MockAIProvider()
        base_prompt = "Soạn giáo án"
        assert provider.format_prompt_with_sources(base_prompt, None) == base_prompt
        assert provider.format_prompt_with_sources(base_prompt, []) == base_prompt


class TestAIProviderFactory:
    """AC2: Có factory/provider resolver & AC3: Thay đổi bằng configuration"""

    def setup_method(self):
        """Reset factory cache before each test."""
        provider_factory.clear_cache()

    def test_resolve_default_configured_provider(self):
        """Test resolving the default provider configured in settings."""
        provider = get_ai_provider()
        assert provider is not None
        assert isinstance(provider, BaseAIProvider)
        assert provider.provider_name == settings.AI_PROVIDER.lower()

    def test_resolve_gemini_provider(self):
        """Test explicitly resolving Gemini provider."""
        provider = provider_factory.resolve("gemini")
        assert isinstance(provider, GeminiProvider)
        assert provider.provider_name == "gemini"

    def test_resolve_openai_provider(self):
        """Test explicitly resolving OpenAI provider."""
        provider = provider_factory.resolve("openai")
        assert isinstance(provider, OpenAIProvider)
        assert provider.provider_name == "openai"

    def test_resolve_mock_provider(self):
        """Test explicitly resolving Mock provider."""
        provider = provider_factory.resolve("mock")
        assert isinstance(provider, MockAIProvider)
        assert provider.provider_name == "mock"

    def test_case_insensitive_resolution(self):
        """Test that provider names are case-insensitive (e.g., 'Gemini', 'OPENAI')."""
        p1 = provider_factory.resolve("GEMINI")
        p2 = provider_factory.resolve("OpenAI")
        p3 = provider_factory.resolve("Mock")

        assert isinstance(p1, GeminiProvider)
        assert isinstance(p2, OpenAIProvider)
        assert isinstance(p3, MockAIProvider)

    def test_instance_caching_singleton_behavior(self):
        """Test that factory caches instances to reuse client connections."""
        instance1 = provider_factory.resolve("mock")
        instance2 = provider_factory.resolve("mock")
        assert instance1 is instance2

        provider_factory.clear_cache()
        instance3 = provider_factory.resolve("mock")
        assert instance3 is not instance1

    def test_unsupported_provider_raises_informative_error(self):
        """Test that requesting an invalid provider raises UnsupportedProviderError with available options."""
        with pytest.raises(UnsupportedProviderError) as exc_info:
            provider_factory.resolve("unsupported_anthropic_v9")

        err_msg = str(exc_info.value)
        assert "Unsupported AI Provider: 'unsupported_anthropic_v9'" in err_msg
        assert "'gemini'" in err_msg
        assert "'openai'" in err_msg
        assert "'mock'" in err_msg

    def test_dynamic_custom_provider_registration(self):
        """Test registering a custom provider class at runtime."""
        class CustomTestProvider(BaseAIProvider):
            @property
            def provider_name(self) -> str:
                return "custom_llm"

            async def generate_structured_output(self, system_prompt, user_prompt, response_schema, context_chunks=None):
                return {"custom": True}

            async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
                return [[0.99] * 768]

        factory = AIProviderFactory()
        factory.register_provider("custom_llm", CustomTestProvider)

        assert "custom_llm" in factory.list_supported_providers()
        resolved = factory.resolve("custom_llm")
        assert isinstance(resolved, CustomTestProvider)
        assert resolved.provider_name == "custom_llm"

    def test_register_invalid_class_raises_type_error(self):
        """Test that registering a class not inheriting from BaseAIProvider raises TypeError."""
        factory = AIProviderFactory()
        class NotAnAIProvider:
            pass

        with pytest.raises(TypeError):
            factory.register_provider("invalid", NotAnAIProvider)


class TestMockAIProviderExecution:
    """AC4: Business logic không phụ thuộc implementation cụ thể"""

    @pytest.mark.asyncio
    async def test_mock_provider_embeddings(self):
        """Test generating mock embeddings with custom dimension."""
        provider = MockAIProvider(embedding_dimension=768)
        texts = ["Bài học Toán lớp 10", "Bài học Vật lý lớp 11"]
        embeddings = await provider.generate_embeddings(texts)

        assert len(embeddings) == 2
        assert len(embeddings[0]) == 768
        assert len(embeddings[1]) == 768
        assert all(isinstance(val, float) for val in embeddings[0])

    @pytest.mark.asyncio
    async def test_mock_provider_structured_output_validation(self):
        """Test generating structured output conforming to a Pydantic schema."""
        provider = MockAIProvider()
        system_prompt = "Bạn là trợ lý soạn giáo án."
        user_prompt = "Soạn giáo án về Tam thức bậc hai."

        result = await provider.generate_structured_output(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=SampleLessonPlanSchema,
        )

        assert isinstance(result, SampleLessonPlanSchema)
        assert result.title is not None
        assert isinstance(result.duration_minutes, int)
        assert isinstance(result.objectives, list)
        assert len(result.objectives) > 0

    @pytest.mark.asyncio
    async def test_business_logic_decoupling_via_interface(self):
        """
        Test that higher-level business logic operates identically
        regardless of which AI provider is injected.
        """
        async def mock_lesson_planner_service(provider: BaseAIProvider, topic: str):
            """Simulates business logic in generation/service.py."""
            return await provider.generate_structured_output(
                system_prompt="Soạn giáo án chuẩn sư phạm",
                user_prompt=f"Chủ đề: {topic}",
                response_schema=SampleLessonPlanSchema,
            )

        provider = MockAIProvider()
        output = await mock_lesson_planner_service(provider, "Định lý Pytago")

        assert isinstance(output, SampleLessonPlanSchema)
        assert provider.last_user_prompt == "Chủ đề: Định lý Pytago"
