"""
Structured Lesson Plan Generation Pipeline (BE-018).

Implements:
1. End-to-end RAG pipeline: Query formulation -> pgvector retrieval with workspace isolation.
2. Anti-hallucination validation: Halts generation on insufficient evidence.
3. Secure prompt formulation: Encapsulates sources within <sources>...</sources> boundary.
4. Structured LLM generation: Enforces strict adherence to LessonPlanSchema.
5. End-to-end citation provenance: Binds source_chunk_ids to the generated lesson plan.
6. Robust failure handling for provider and schema errors.
"""

from typing import List, Optional, Union
import uuid
import structlog

from app.generation.evidence_validator import (
    InsufficientEvidenceError,
    validate_retrieval_evidence,
)
from app.generation.prompt_builder import (
    build_grounded_generation_prompt,
    extract_source_chunk_ids,
)
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    LessonPlanSchema,
)
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError
from app.providers.factory import get_ai_provider
from app.retrieval.service import search_similar_chunks

logger = structlog.get_logger()

DEFAULT_LESSON_SYSTEM_INSTRUCTION = """
You are an expert pedagogical assistant for K-12 teachers in Vietnam.
You design comprehensive, engaging, and standards-compliant lesson plans based on official curriculum guidelines (e.g. Công văn 5512/BGDĐT-GDTrH).
You MUST output valid structured JSON matching the provided LessonPlanSchema.
Ground all learning activities, pedagogical methods, and content strictly in the verified reference sources provided.
""".strip()


class LessonPlannerPipeline:
    """
    RAG-powered lesson plan generation pipeline enforcing schema validation
    and source citation provenance.
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self._provider = provider

    @property
    def provider(self) -> BaseAIProvider:
        """Resolve the active AI provider (injected or default factory)."""
        return self._provider or get_ai_provider()

    async def generate_lesson_plan(
        self,
        request: Union[LessonPlanGenerationRequest, dict],
    ) -> LessonPlanSchema:
        """
        Execute the end-to-end lesson planner generation pipeline:
        1. Parse and validate input request.
        2. Retrieve relevant document chunks from pgvector within teacher's workspace.
        3. Validate evidence sufficiency to prevent ungrounded AI hallucinations.
        4. Assemble structured prompt with secure <sources> boundary.
        5. Invoke LLM provider with LessonPlanSchema response enforcement.
        6. Bind source_chunk_ids for end-to-end citation provenance.

        Args:
            request: Validated LessonPlanGenerationRequest or payload dict.

        Returns:
            LessonPlanSchema: Fully structured, grounded lesson plan.

        Raises:
            InsufficientEvidenceError: If retrieved context is inadequate or irrelevant.
            AIProviderError: If the underlying LLM provider encounters an error.
            ValueError: If input request validation fails.
        """
        # 1. Parse request
        if isinstance(request, dict):
            req = LessonPlanGenerationRequest(**request)
        else:
            req = request

        logger.info(
            "lesson_planner_pipeline_started",
            workspace_id=str(req.workspace_id),
            subject=req.subject,
            grade_level=req.grade_level,
            topic=req.topic,
            duration_minutes=req.duration_minutes,
        )

        # 2. Formulate RAG query and perform workspace-isolated retrieval
        query_parts = [req.subject, f"Lớp {req.grade_level}", req.topic]
        if req.objectives:
            query_parts.extend(req.objectives)
        if req.instructions:
            query_parts.append(req.instructions)
        search_query = " ".join(query_parts)

        retrieval_response = await search_similar_chunks(
            query=search_query,
            workspace_id=req.workspace_id,
            document_ids=req.document_ids,
            subject=req.subject,
            grade_level=req.grade_level,
            top_k=5,
            similarity_threshold=req.min_similarity,
        )

        # 3. Evidence sufficiency validation (BE-017)
        validated_chunks = validate_retrieval_evidence(
            retrieval_response=retrieval_response,
            min_chunks=1,
            min_similarity=req.min_similarity,
            query=search_query,
            workspace_id=str(req.workspace_id),
        )

        # 4. Prompt construction with untrusted sources boundary (BE-016)
        objectives_hint = (
            f"\nMục tiêu cần đạt: {', '.join(req.objectives)}"
            if req.objectives
            else ""
        )
        user_instruction = (
            f"Thiết kế kế hoạch bài dạy (Giáo án) hoàn chỉnh cho:\n"
            f"- Môn học: {req.subject}\n"
            f"- Khối lớp: {req.grade_level}\n"
            f"- Tên bài học / Chủ đề: {req.topic}\n"
            f"- Thời lượng bài dạy: {req.duration_minutes} phút{objectives_hint}\n"
            f"Yêu cầu các phần trong sections phải rõ ràng các bước: Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng."
        )

        system_prompt, user_prompt = build_grounded_generation_prompt(
            system_instruction=DEFAULT_LESSON_SYSTEM_INSTRUCTION,
            user_instruction=user_instruction,
            context_chunks=validated_chunks,
            custom_instructions=req.instructions,
        )

        # 5. LLM structured generation with schema validation
        try:
            result = await self.provider.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=LessonPlanSchema,
                context_chunks=validated_chunks,
            )
        except AIProviderError as e:
            logger.error("lesson_plan_llm_provider_error", provider=e.provider, error=str(e))
            raise
        except Exception as e:
            logger.error("lesson_plan_generation_unexpected_error", error=str(e))
            raise AIProviderError(f"Unexpected generation failure: {str(e)}", provider=self.provider.provider_name, original_error=e)

        # 6. Provenance & citation binding (AC: giữ lại mảng source_chunk_ids)
        source_chunk_ids = extract_source_chunk_ids(validated_chunks)
        
        # Ensure source_chunk_ids is bound and metadata matches request
        result.source_chunk_ids = source_chunk_ids
        if not result.subject:
            result.subject = req.subject
        if not result.grade_level:
            result.grade_level = req.grade_level
        if not result.duration_minutes:
            result.duration_minutes = req.duration_minutes

        logger.info(
            "lesson_planner_pipeline_completed",
            workspace_id=str(req.workspace_id),
            title=result.title,
            sections_count=len(result.sections),
            citations_count=len(result.source_chunk_ids),
        )

        return result


# Singleton pipeline instance for convenient module-level usage
lesson_planner_pipeline = LessonPlannerPipeline()
