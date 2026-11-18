"""
Unit Tests for Gemini & OpenAI LLM Provider Adapters (BE-014)

Tests:
1. Gemini adapter functionality (structured output, embeddings).
2. OpenAI adapter functionality (structured output, embeddings).
3. BaseAIProvider interface compliance for both adapters.
4. Comprehensive API error handling & exception mapping.
5. No hard-coded API keys (validation of authentication check when key is missing).
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List
from pydantic import BaseModel

import openai
from google.api_core import exceptions as google_exceptions

from app.providers.base import BaseAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.exceptions import (
    AIProviderError,
    AuthenticationError,
    InvalidRequestError,
    RateLimitError,
    ServiceUnavailableError,
)
from app.providers.factory import get_ai_provider


class SampleLessonPlan(BaseModel):
    title: str
    grade: str
    duration_minutes: int
    objectives: List[str]


# ============================================================================
# GeminiProvider Tests
# ============================================================================

class TestGeminiProvider:
    """Acceptance criteria testing for Google Gemini LLM Adapter."""

    def test_gemini_provider_inherits_base_provider(self):
        """AC3: Cùng tuân thủ provider interface."""
        provider = GeminiProvider(api_key="test-key")
        assert isinstance(provider, BaseAIProvider)
        assert provider.provider_name == "gemini"

    def test_gemini_missing_api_key_raises_auth_error(self):
        """AC5: API key không hard-code; vắng API key báo AuthenticationError."""
        provider = GeminiProvider(api_key="")
        
        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_structured_output(
                system_prompt="System",
                user_prompt="User",
                response_schema=SampleLessonPlan,
            ))
        assert "Gemini API key is not configured" in str(exc_info.value)
        assert exc_info.value.provider == "gemini"

        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_embeddings(["Sample text"]))
        assert "Gemini API key is not configured" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_gemini_generate_structured_output_success(self):
        """AC1: Gemini adapter hoạt động generate structured output."""
        provider = GeminiProvider(api_key="test-key-gemini")

        mock_response = MagicMock()
        mock_response.text = (
            '{"title": "Định lý Cosin", "grade": "10", "duration_minutes": 45, '
            '"objectives": ["Hiểu công thức", "Vận dụng tính cạnh"]}'
        )

        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(return_value=mock_response)
            mock_model_cls.return_value = mock_model_instance

            context = [{"chunk_id": "c1", "content": "Tài liệu Toán 10"}]
            result = await provider.generate_structured_output(
                system_prompt="Bạn là trợ lý giáo viên",
                user_prompt="Soạn giáo án Toán",
                response_schema=SampleLessonPlan,
                context_chunks=context,
            )

            assert isinstance(result, SampleLessonPlan)
            assert result.title == "Định lý Cosin"
            assert result.duration_minutes == 45
            assert len(result.objectives) == 2

            # Verify prompt boundary contains <sources> (Rule 7.3)
            call_args = mock_model_instance.generate_content_async.call_args
            prompt_passed = call_args[0][0]
            assert "<sources>" in prompt_passed
            assert "Tài liệu Toán 10" in prompt_passed

    @pytest.mark.asyncio
    async def test_gemini_empty_response_raises_invalid_request(self):
        """AC4: Gemini trả về text rỗng được xử lý thành InvalidRequestError."""
        provider = GeminiProvider(api_key="test-key-gemini")
        mock_response = MagicMock()
        mock_response.text = ""

        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(return_value=mock_response)
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(InvalidRequestError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="System",
                    user_prompt="User",
                    response_schema=SampleLessonPlan,
                )
            assert "empty response" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_gemini_schema_validation_error_mapped(self):
        """AC4: Output sai schema Pydantic được map thành InvalidRequestError."""
        provider = GeminiProvider(api_key="test-key-gemini")
        mock_response = MagicMock()
        mock_response.text = '{"wrong_field": "invalid"}'

        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(return_value=mock_response)
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(InvalidRequestError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="System",
                    user_prompt="User",
                    response_schema=SampleLessonPlan,
                )
            assert "validate Gemini structured output" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_gemini_api_exceptions_mapped(self):
        """AC4: Các ngoại lệ của Google API SDK được chuẩn hóa thành AIProviderError subclasses."""
        provider = GeminiProvider(api_key="test-key-gemini")

        # PermissionDenied -> AuthenticationError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=google_exceptions.PermissionDenied("Invalid API key")
            )
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(AuthenticationError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # ResourceExhausted -> RateLimitError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=google_exceptions.ResourceExhausted("Quota exceeded")
            )
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(RateLimitError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # InvalidArgument -> InvalidRequestError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=google_exceptions.InvalidArgument("Token limit reached")
            )
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(InvalidRequestError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # GoogleAPIError -> ServiceUnavailableError
        with patch("google.generativeai.GenerativeModel") as mock_model_cls:
            mock_model_instance = MagicMock()
            mock_model_instance.generate_content_async = AsyncMock(
                side_effect=google_exceptions.GoogleAPIError("Service down")
            )
            mock_model_cls.return_value = mock_model_instance

            with pytest.raises(ServiceUnavailableError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

    @pytest.mark.asyncio
    async def test_gemini_generate_embeddings_success(self):
        """AC1: Gemini adapter tạo dense embeddings 768 chiều."""
        provider = GeminiProvider(api_key="test-key-gemini")

        mock_embedding = [0.05] * 768
        with patch("google.generativeai.embed_content_async", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = {"embedding": mock_embedding}

            embeddings = await provider.generate_embeddings(["Đoạn văn 1", "Đoạn văn 2"])
            assert len(embeddings) == 2
            assert len(embeddings[0]) == 768
            assert embeddings[0] == mock_embedding
            assert mock_embed.call_count == 2

    @pytest.mark.asyncio
    async def test_gemini_generate_embeddings_empty_inputs(self):
        """AC1 & AC4: Xử lý input rỗng cho embeddings."""
        provider = GeminiProvider(api_key="test-key-gemini")

        # Empty list -> return empty list
        assert await provider.generate_embeddings([]) == []

        # Empty string element -> raise InvalidRequestError
        with pytest.raises(InvalidRequestError):
            await provider.generate_embeddings(["   "])


# ============================================================================
# OpenAIProvider Tests
# ============================================================================

class TestOpenAIProvider:
    """Acceptance criteria testing for OpenAI LLM Adapter."""

    def test_openai_provider_inherits_base_provider(self):
        """AC3: Cùng tuân thủ provider interface."""
        provider = OpenAIProvider(api_key="test-key-openai")
        assert isinstance(provider, BaseAIProvider)
        assert provider.provider_name == "openai"

    def test_openai_missing_api_key_raises_auth_error(self):
        """AC5: API key không hard-code; vắng API key báo AuthenticationError."""
        provider = OpenAIProvider(api_key="")

        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_structured_output(
                system_prompt="System",
                user_prompt="User",
                response_schema=SampleLessonPlan,
            ))
        assert "OpenAI API key is not configured" in str(exc_info.value)
        assert exc_info.value.provider == "openai"

        with pytest.raises(AuthenticationError) as exc_info:
            import asyncio
            asyncio.run(provider.generate_embeddings(["Sample text"]))
        assert "OpenAI API key is not configured" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_openai_generate_structured_output_success(self):
        """AC2: OpenAI adapter hoạt động parse structured output theo Pydantic schema."""
        provider = OpenAIProvider(api_key="sk-test-key")

        expected_plan = SampleLessonPlan(
            title="Phương trình bậc hai",
            grade="9",
            duration_minutes=45,
            objectives=["Giải phương trình bằng biệt thức Delta"],
        )

        mock_choice = MagicMock()
        mock_choice.message.parsed = expected_plan
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(return_value=mock_completion)

            context = [{"chunk_id": "c1", "content": "SGK Toán 9 Tập 2"}]
            result = await provider.generate_structured_output(
                system_prompt="Bạn là chuyên gia sư phạm",
                user_prompt="Tạo giáo án Toán 9",
                response_schema=SampleLessonPlan,
                context_chunks=context,
            )

            assert result == expected_plan
            assert result.title == "Phương trình bậc hai"

            # Check sources boundary in system message (Rule 7.3)
            call_kwargs = mock_client.beta.chat.completions.parse.call_args[1]
            system_msg = call_kwargs["messages"][0]["content"]
            assert "<sources>" in system_msg
            assert "SGK Toán 9 Tập 2" in system_msg

    @pytest.mark.asyncio
    async def test_openai_null_parsed_raises_invalid_request(self):
        """AC4: OpenAI trả về parsed null được xử lý thành InvalidRequestError."""
        provider = OpenAIProvider(api_key="sk-test-key")

        mock_choice = MagicMock()
        mock_choice.message.parsed = None
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(return_value=mock_completion)

            with pytest.raises(InvalidRequestError) as exc_info:
                await provider.generate_structured_output(
                    system_prompt="System",
                    user_prompt="User",
                    response_schema=SampleLessonPlan,
                )
            assert "null parsed structured output" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_openai_api_exceptions_mapped(self):
        """AC4: Các ngoại lệ của OpenAI SDK được chuẩn hóa thành AIProviderError subclasses."""
        provider = OpenAIProvider(api_key="sk-test-key")

        # AuthenticationError -> AuthenticationError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.AuthenticationError(
                    message="Invalid API Key", response=MagicMock(status_code=401), body=None
                )
            )
            with pytest.raises(AuthenticationError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # RateLimitError -> RateLimitError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.RateLimitError(
                    message="Rate limit exceeded", response=MagicMock(status_code=429), body=None
                )
            )
            with pytest.raises(RateLimitError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # BadRequestError -> InvalidRequestError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.BadRequestError(
                    message="Max tokens exceeded", response=MagicMock(status_code=400), body=None
                )
            )
            with pytest.raises(InvalidRequestError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

        # APIConnectionError -> ServiceUnavailableError
        with patch.object(provider, "client") as mock_client:
            mock_client.beta.chat.completions.parse = AsyncMock(
                side_effect=openai.APIConnectionError(request=MagicMock())
            )
            with pytest.raises(ServiceUnavailableError):
                await provider.generate_structured_output(
                    system_prompt="S", user_prompt="U", response_schema=SampleLessonPlan
                )

    @pytest.mark.asyncio
    async def test_openai_generate_embeddings_success(self):
        """AC2: OpenAI adapter tạo dense embeddings."""
        provider = OpenAIProvider(api_key="sk-test-key")

        mock_item1 = MagicMock()
        mock_item1.embedding = [0.1, 0.2, 0.3]
        mock_item2 = MagicMock()
        mock_item2.embedding = [0.4, 0.5, 0.6]

        mock_response = MagicMock()
        mock_response.data = [mock_item1, mock_item2]

        with patch.object(provider, "client") as mock_client:
            mock_client.embeddings.create = AsyncMock(return_value=mock_response)

            embeddings = await provider.generate_embeddings(["Đoạn 1", "Đoạn 2"])
            assert len(embeddings) == 2
            assert embeddings[0] == [0.1, 0.2, 0.3]
            assert embeddings[1] == [0.4, 0.5, 0.6]

    @pytest.mark.asyncio
    async def test_openai_generate_embeddings_empty_inputs(self):
        """AC2 & AC4: Xử lý input rỗng cho OpenAI embeddings."""
        provider = OpenAIProvider(api_key="sk-test-key")

        # Empty list -> return empty list
        assert await provider.generate_embeddings([]) == []

        # Empty string element -> raise InvalidRequestError
        with pytest.raises(InvalidRequestError):
            await provider.generate_embeddings(["   "])
