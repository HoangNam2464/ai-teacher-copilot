"""
QA Automated Test Suite for [QA-016 / ATC-51 / ATC-301]:
Test AI Provider Dynamic Switching & API Error Fallback.

Sprint: Sprint 3 - RAG & Lesson
Acceptance Criteria:
1. Có thể chuyển provider bằng configuration (Config-driven dynamic switching & factory resolution).
2. Gemini generation hoạt động (Structured generation, JSON schema validation, embeddings, sources boundary).
3. OpenAI generation hoạt động (Structured generation via parse, JSON schema validation, embeddings, sources boundary).
4. Provider failure được xử lý đúng (SDK exception mapping, HTTP 502 Bad Gateway response, transparent error fallback).
"""

import json
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

import openai
from google.api_core import exceptions as google_exceptions

from app.core.config import settings
from app.main import app
from app.providers.base import BaseAIProvider
from app.providers.exceptions import (
    AIProviderError,
    AuthenticationError,
    InvalidRequestError,
    RateLimitError,
    ServiceUnavailableError,
)
from app.providers.factory import (
    AIProviderFactory,
    UnsupportedProviderError,
    get_ai_provider,
    provider_factory,
)
from app.providers.fallback_provider import FallbackAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.mock_provider import MockAIProvider
from app.providers.openai_provider import OpenAIProvider


# ------------------------------------------------------------------------------
# Test Models
# ------------------------------------------------------------------------------
class SampleLessonPlanSchema(BaseModel):
    title: str
    grade: str
    duration_minutes: int
    objectives: List[str]


# ==============================================================================
# GROUP 1: Config-Driven Dynamic Switching (AC-1)
# ==============================================================================
class TestConfigDrivenProviderSwitchingQA016:
    """AC-1: Có thể chuyển provider bằng configuration"""

    def setup_method(self):
        provider_factory.clear_cache()

    def test_switch_provider_via_configuration_setting(self):
        """TC-PROV-01: Factory resolves target provider strictly according to settings.AI_PROVIDER."""
        # 1. Switch config to gemini
        with patch.object(settings, "AI_PROVIDER", "gemini"):
            provider_factory.clear_cache()
            provider = provider_factory.resolve()
            assert isinstance(provider, GeminiProvider)
            assert provider.provider_name == "gemini"

        # 2. Switch config to openai
        with patch.object(settings, "AI_PROVIDER", "openai"):
            provider_factory.clear_cache()
            provider = provider_factory.resolve()
            assert isinstance(provider, OpenAIProvider)
            assert provider.provider_name == "openai"

        # 3. Switch config to mock
        with patch.object(settings, "AI_PROVIDER", "mock"):
            provider_factory.clear_cache()
            provider = provider_factory.resolve()
            assert isinstance(provider, MockAIProvider)
            assert provider.provider_name == "mock"

    def test_switch_provider_case_insensitivity_and_whitespace(self):
        """TC-PROV-02: Provider switching supports mixed casing and trims whitespace."""
        p_gemini = provider_factory.resolve("  GeMiNi  ")
        p_openai = provider_factory.resolve("OPENAI\t")
        p_mock = provider_factory.resolve("\nMock ")

        assert isinstance(p_gemini, GeminiProvider)
        assert isinstance(p_openai, OpenAIProvider)
        assert isinstance(p_mock, MockAIProvider)

    def test_unsupported_provider_raises_informative_error(self):
        """TC-PROV-03: Unsupported provider name raises UnsupportedProviderError with available options."""
        with pytest.raises(UnsupportedProviderError) as exc_info:
            provider_factory.resolve("claude-3-opus")

        error_msg = str(exc_info.value)
        assert "Unsupported AI Provider: 'claude-3-opus'" in error_msg
        assert "'gemini'" in error_msg
        assert "'openai'" in error_msg
        assert "'mock'" in error_msg

    def test_dynamic_custom_provider_registration_and_switching(self):
        """TC-PROV-04: Dynamic runtime provider registration and switching without modifying business logic."""
        class CustomProvider(BaseAIProvider):
            @property
            def provider_name(self) -> str:
                return "custom_engine"

            async def generate_structured_output(self, system_prompt, user_prompt, response_schema, context_chunks=None):
                return {"custom": "ok"}

            async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
                return [[0.77] * 768]

        factory = AIProviderFactory()
        factory.register_provider("custom_engine", CustomProvider)

        assert "custom_engine" in factory.list_supported_providers()
        resolved = factory.resolve("custom_engine")
        assert isinstance(resolved, CustomProvider)
        assert resolved.provider_name == "custom_engine"

    def test_provider_instance_caching_and_cache_clearing(self):
        """TC-PROV-05: Factory caches provider instances and invalidates them upon clear_cache()."""
        inst1 = provider_factory.resolve("mock")
        inst2 = provider_factory.resolve("mock")
        assert inst1 is inst2

        provider_factory.clear_cache()
        inst3 = provider_factory.resolve("mock")
        assert inst3 is not inst1


# ==============================================================================
# GROUP 2: Gemini Generation & Embeddings (AC-2)
# ==============================================================================
class TestGeminiGenerationQA016:
    """AC-2: Gemini generation hoạt động"""

    @pytest.mark.asyncio
    async def test_gemini_structured_generation_with_schema(self):
        """TC-PROV-06: Gemini provider generates structured output conforming to Pydantic schema."""
        provider = GeminiProvider(api_key="valid-test-key-gemini")
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "title": "Hàm số bậc hai",
            "grade": "10",
            "duration_minutes": 45,
            "objectives": ["Khảo sát sự biến thiên", "Vẽ đồ thị parabol"],
        })

        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_model_cls.return_value = mock_model

            result = await provider.generate_structured_output(
                system_prompt="Bạn là giáo viên chuyên nghiệp",
                user_prompt="Soạn bài Hàm số bậc hai",
                response_schema=SampleLessonPlanSchema,
            )

            assert isinstance(result, SampleLessonPlanSchema)
            assert result.title == "Hàm số bậc hai"
            assert result.duration_minutes == 45
            assert len(result.objectives) == 2

    @pytest.mark.asyncio
    async def test_gemini_sources_boundary_enforcement(self):
        """TC-PROV-07: Gemini prompt strictly encloses context in <sources>...</sources> boundary."""
        provider = GeminiProvider(api_key="valid-test-key-gemini")
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "title": "Tích vô hướng",
            "grade": "10",
            "duration_minutes": 45,
            "objectives": ["Định nghĩa tích vô hướng"],
        })

        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_model_cls.return_value = mock_model

            context = [{"chunk_id": "c100", "content": "Tài liệu Hình học 10 chương Véc-tơ"}]
            await provider.generate_structured_output(
                system_prompt="System instructions",
                user_prompt="User instructions",
                response_schema=SampleLessonPlanSchema,
                context_chunks=context,
            )

            prompt_arg = mock_model.generate_content_async.call_args[0][0]
            assert "<sources>" in prompt_arg
            assert "</sources>" in prompt_arg
            assert "Tài liệu Hình học 10 chương Véc-tơ" in prompt_arg

    @pytest.mark.asyncio
    async def test_gemini_embedding_generation_success(self):
        """TC-PROV-08: Gemini provider produces dense vector embeddings."""
        provider = GeminiProvider(api_key="valid-test-key-gemini")
        mock_vec = [0.123] * 768

        with patch("google.generativeai.embed_content_async", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = {"embedding": mock_vec}
            embeddings = await provider.generate_embeddings(["Khái niệm đạo hàm", "Quy tắc tính đạo hàm"])

            assert len(embeddings) == 2
            assert len(embeddings[0]) == 768
            assert embeddings[0] == mock_vec
            assert mock_embed.call_count == 2

    def test_gemini_missing_api_key_raises_auth_error(self):
        """TC-PROV-09: Gemini raises AuthenticationError before request if API key is unconfigured."""
        provider = GeminiProvider(api_key="")
        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_structured_output(
                system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
            ))
        assert "Gemini API key is not configured" in str(exc_info.value)
        assert exc_info.value.provider == "gemini"


# ==============================================================================
# GROUP 3: OpenAI Generation & Embeddings (AC-3)
# ==============================================================================
class TestOpenAIGenerationQA016:
    """AC-3: OpenAI generation hoạt động"""

    @pytest.mark.asyncio
    async def test_openai_structured_generation_with_schema(self):
        """TC-PROV-10: OpenAI provider generates structured output using beta parse."""
        provider = OpenAIProvider(api_key="valid-test-key-openai")
        expected_output = SampleLessonPlanSchema(
            title="Định luật II Newton",
            grade="10",
            duration_minutes=45,
            objectives=["Phát biểu định luật F = m*a"],
        )

        mock_choice = MagicMock()
        mock_choice.message.parsed = expected_output
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(return_value=mock_completion)

            result = await provider.generate_structured_output(
                system_prompt="Bạn là giáo viên Vật lý",
                user_prompt="Soạn bài Định luật II Newton",
                response_schema=SampleLessonPlanSchema,
            )

            assert result == expected_output
            assert result.title == "Định luật II Newton"
            assert result.duration_minutes == 45

    @pytest.mark.asyncio
    async def test_openai_sources_boundary_enforcement(self):
        """TC-PROV-11: OpenAI prompt strictly encloses context in <sources>...</sources> boundary."""
        provider = OpenAIProvider(api_key="valid-test-key-openai")
        expected_output = SampleLessonPlanSchema(
            title="Quang hợp ở thực vật",
            grade="11",
            duration_minutes=45,
            objectives=["Hiểu phương trình quang hợp"],
        )

        mock_choice = MagicMock()
        mock_choice.message.parsed = expected_output
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(return_value=mock_completion)

            context = [{"chunk_id": "c200", "content": "SGK Sinh học 11 bài 8"}]
            await provider.generate_structured_output(
                system_prompt="System prompt",
                user_prompt="User prompt",
                response_schema=SampleLessonPlanSchema,
                context_chunks=context,
            )

            call_kwargs = mock_client.beta.chat.completions.parse.call_args[1]
            sys_content = call_kwargs["messages"][0]["content"]
            assert "<sources>" in sys_content
            assert "</sources>" in sys_content
            assert "SGK Sinh học 11 bài 8" in sys_content

    @pytest.mark.asyncio
    async def test_openai_embedding_generation_success(self):
        """TC-PROV-12: OpenAI provider produces dense vector embeddings."""
        provider = OpenAIProvider(api_key="valid-test-key-openai")
        mock_item = MagicMock()
        mock_item.embedding = [0.456] * 768
        mock_resp = MagicMock()
        mock_resp.data = [mock_item]

        with patch.object(provider, "client") as mock_client:
            mock_client.embeddings.create = AsyncMock(return_value=mock_resp)
            embeddings = await provider.generate_embeddings(["Cấu tạo nguyên tử"])

            assert len(embeddings) == 1
            assert len(embeddings[0]) == 768
            assert embeddings[0] == [0.456] * 768

    def test_openai_missing_api_key_raises_auth_error(self):
        """TC-PROV-13: OpenAI raises AuthenticationError before request if API key is unconfigured."""
        provider = OpenAIProvider(api_key="")
        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_structured_output(
                system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
            ))
        assert "OpenAI API key is not configured" in str(exc_info.value)
        assert exc_info.value.provider == "openai"


# ==============================================================================
# GROUP 4: Provider Failure Handling & API Error Fallback (AC-4)
# ==============================================================================
class TestProviderFailureAndFallbackQA016:
    """AC-4: Provider failure được xử lý đúng & API Error Fallback"""

    @pytest.mark.asyncio
    async def test_gemini_sdk_exceptions_mapped_to_unified_errors(self):
        """TC-PROV-14: Gemini SDK exceptions mapped to RateLimitError and ServiceUnavailableError."""
        provider = GeminiProvider(api_key="valid-test-key")

        # Quota exceeded -> RateLimitError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(
                side_effect=google_exceptions.ResourceExhausted("Rate limit exceeded")
            )
            mock_model_cls.return_value = mock_model

            with pytest.raises(RateLimitError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
                )
            assert exc_info.value.provider == "gemini"

        # Service down -> ServiceUnavailableError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(
                side_effect=google_exceptions.GoogleAPIError("Service temporarily unavailable")
            )
            mock_model_cls.return_value = mock_model

            with pytest.raises(ServiceUnavailableError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
                )
            assert exc_info.value.provider == "gemini"

    @pytest.mark.asyncio
    async def test_openai_sdk_exceptions_mapped_to_unified_errors(self):
        """TC-PROV-15: OpenAI SDK exceptions mapped to RateLimitError and ServiceUnavailableError."""
        provider = OpenAIProvider(api_key="valid-test-key")

        # Rate limit -> RateLimitError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.RateLimitError(
                    message="OpenAI TPM quota reached", response=MagicMock(status_code=429), body=None
                )
            )
            with pytest.raises(RateLimitError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
                )
            assert exc_info.value.provider == "openai"

        # Connection error -> ServiceUnavailableError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.APIConnectionError(request=MagicMock())
            )
            with pytest.raises(ServiceUnavailableError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
                )
            assert exc_info.value.provider == "openai"

    @pytest.mark.asyncio
    async def test_api_route_generation_returns_502_on_provider_error(self):
        """TC-PROV-16: POST /generation/lesson-plan returns HTTP 502 Bad Gateway when provider fails."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
            payload = {
                "workspace_id": "11111111-1111-1111-1111-111111111111",
                "subject": "Toán học",
                "grade_level": "10",
                "topic": "Hàm số bậc hai",
                "duration_minutes": 45,
            }

            with patch("app.generation.lesson_planner.lesson_planner_pipeline.generate_lesson_plan", new_callable=AsyncMock) as mock_gen:
                mock_gen.side_effect = RateLimitError("Gemini quota exhausted", provider="gemini")

                resp = await client.post("/generation/lesson-plan", json=payload, headers=headers)
                assert resp.status_code == 502
                data = resp.json()
                assert data["detail"]["error_code"] == "AI_PROVIDER_ERROR"
                assert data["detail"]["provider"] == "gemini"
                assert "Gemini quota exhausted" in data["detail"]["message"]

    @pytest.mark.asyncio
    async def test_api_route_quiz_returns_502_on_provider_error(self):
        """TC-PROV-17: POST /generation/quiz returns HTTP 502 Bad Gateway when provider fails."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-API-Key": settings.AI_SERVICE_API_KEY}
            params = {
                "workspace_id": "11111111-1111-1111-1111-111111111111",
                "subject": "Vật lý",
                "grade_level": "11",
                "topic": "Định luật Ôm",
                "num_questions": 5,
            }

            with patch("app.api.routes.generation.generate_quiz_service", new_callable=AsyncMock) as mock_quiz:
                mock_quiz.side_effect = ServiceUnavailableError("OpenAI connection timeout", provider="openai")

                resp = await client.post("/generation/quiz", params=params, headers=headers)
                assert resp.status_code == 502
                data = resp.json()
                assert data["detail"]["error_code"] == "AI_PROVIDER_ERROR"
                assert data["detail"]["provider"] == "openai"
                assert "OpenAI connection timeout" in data["detail"]["message"]

    @pytest.mark.asyncio
    async def test_transparent_provider_fallback_execution(self):
        """TC-PROV-18: FallbackAIProvider automatically routes to fallback provider when primary fails."""
        primary_mock = MagicMock(spec=BaseAIProvider)
        primary_mock.provider_name = "primary_gemini"
        primary_mock.generate_structured_output = AsyncMock(
            side_effect=RateLimitError("Primary Gemini rate limit reached", provider="gemini")
        )
        primary_mock.generate_embeddings = AsyncMock(
            side_effect=ServiceUnavailableError("Primary Gemini down", provider="gemini")
        )

        expected_plan = SampleLessonPlanSchema(
            title="Kế hoạch dự phòng",
            grade="10",
            duration_minutes=45,
            objectives=["Mục tiêu dự phòng"],
        )
        fallback_mock = MagicMock(spec=BaseAIProvider)
        fallback_mock.provider_name = "fallback_openai"
        fallback_mock.generate_structured_output = AsyncMock(return_value=expected_plan)
        fallback_mock.generate_embeddings = AsyncMock(return_value=[[0.99] * 768])

        composite_provider = FallbackAIProvider(primary=primary_mock, fallback=fallback_mock)
        assert "primary_gemini" in composite_provider.provider_name
        assert "fallback_openai" in composite_provider.provider_name

        # 1. Structured generation fallback
        result = await composite_provider.generate_structured_output(
            system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
        )
        assert result == expected_plan
        assert primary_mock.generate_structured_output.call_count == 1
        assert fallback_mock.generate_structured_output.call_count == 1

        # 2. Embedding generation fallback
        embeddings = await composite_provider.generate_embeddings(["Đoạn văn"])
        assert len(embeddings) == 1
        assert len(embeddings[0]) == 768
        assert primary_mock.generate_embeddings.call_count == 1
        assert fallback_mock.generate_embeddings.call_count == 1

    @pytest.mark.asyncio
    async def test_dual_failure_in_fallback_raises_chained_error(self):
        """TC-PROV-19: If both primary and fallback providers fail, raise chained AIProviderError."""
        primary_mock = MagicMock(spec=BaseAIProvider)
        primary_mock.provider_name = "primary"
        primary_mock.generate_structured_output = AsyncMock(
            side_effect=RateLimitError("Primary limit reached", provider="primary")
        )

        fallback_mock = MagicMock(spec=BaseAIProvider)
        fallback_mock.provider_name = "fallback"
        fallback_mock.generate_structured_output = AsyncMock(
            side_effect=ServiceUnavailableError("Fallback also down", provider="fallback")
        )

        composite = FallbackAIProvider(primary=primary_mock, fallback=fallback_mock)

        with pytest.raises(AIProviderError) as exc_info:
            await composite.generate_structured_output(
                system_prompt="S", user_prompt="U", response_schema=SampleLessonPlanSchema
            )

        err_msg = str(exc_info.value)
        assert "Primary provider 'primary' failed" in err_msg
        assert "fallback provider 'fallback' also failed" in err_msg
