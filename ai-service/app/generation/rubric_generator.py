"""
Structured Assessment Rubric Generation Pipeline (BE-029 / ATC-405 / ATC-94).

Implements:
1. End-to-end RAG pipeline for competency-based K-12 Assessment Rubrics.
2. Anti-hallucination validation with InsufficientEvidenceError.
3. Secure prompt formulation with untrusted <sources>...</sources> boundary.
4. Structured LLM generation enforcing strict RubricSchema.
5. Dynamic criteria weight normalization (sum = 100%).
6. Provenance citation binding (source_chunk_ids).
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
    RubricCriterion,
    RubricGenerationRequest,
    RubricSchema,
    RubricScoreLevel,
)
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError
from app.providers.factory import get_ai_provider
from app.retrieval.service import search_similar_chunks

logger = structlog.get_logger()

DEFAULT_RUBRIC_SYSTEM_INSTRUCTION = """
You are an expert pedagogical and educational assessment specialist for K-12 education in Vietnam.
You design competency-based grading rubrics (Ma trận Rubric đánh giá năng lực) conforming strictly to
Thông tư 22/2021/TT-BGDĐT and the Vietnam K-12 General Education Curriculum (Chương trình GDPT 2018).
You MUST output valid structured JSON matching the provided RubricSchema.
Ground all criteria, performance descriptors, and scoring expectations strictly in the verified reference sources provided.
Do NOT invent ungrounded curriculum goals or hallucinate facts outside the provided reference texts.
""".strip()

STANDARD_RUBRIC_LEVELS = [
    RubricScoreLevel(id="L4", name="Xuất sắc", points=4.0, label="Mức 4 (Giỏi)", color="emerald"),
    RubricScoreLevel(id="L3", name="Tốt / Khá", points=3.0, label="Mức 3 (Khá)", color="blue"),
    RubricScoreLevel(id="L2", name="Đạt / TB", points=2.0, label="Mức 2 (Đạt)", color="amber"),
    RubricScoreLevel(id="L1", name="Cần cố gắng", points=1.0, label="Mức 1 (Chưa đạt)", color="rose"),
]


class RubricGeneratorPipeline:
    """
    RAG-powered assessment rubric generation pipeline enforcing schema validation,
    curriculum alignment, and source citation provenance (BE-029).
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self._provider = provider

    @property
    def provider(self) -> BaseAIProvider:
        """Resolve active AI provider."""
        return self._provider or get_ai_provider()

    async def generate_rubric(
        self,
        request: Union[RubricGenerationRequest, dict],
    ) -> RubricSchema:
        """
        Execute the end-to-end rubric generation pipeline:
        1. Parse and validate input request.
        2. Retrieve relevant document chunks from pgvector with workspace isolation.
        3. Validate evidence sufficiency to prevent ungrounded AI hallucinations.
        4. Assemble structured prompt with secure <sources> boundary.
        5. Invoke LLM provider enforcing RubricSchema.
        6. Post-process criteria weights to sum to 100% and bind source_chunk_ids.

        Args:
            request: Validated RubricGenerationRequest or payload dict.

        Returns:
            RubricSchema: Fully structured, grounded assessment rubric.

        Raises:
            InsufficientEvidenceError: If retrieved context is inadequate.
            AIProviderError: If underlying LLM provider fails.
        """
        if isinstance(request, dict):
            req = RubricGenerationRequest(**request)
        else:
            req = request

        logger.info(
            "rubric_generator_pipeline_started",
            workspace_id=str(req.workspace_id),
            subject=req.subject,
            grade_level=req.grade_level,
            topic=req.topic,
            num_criteria=req.num_criteria,
        )

        # 1. Formulate RAG query and retrieve chunks
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
            top_k=max(5, req.num_criteria * 2),
            similarity_threshold=req.min_similarity,
        )

        # 2. Evidence sufficiency validation (Rule 7.7 & BE-017)
        validated_chunks = validate_retrieval_evidence(
            retrieval_response=retrieval_response,
            min_chunks=1,
            min_similarity=req.min_similarity,
            query=search_query,
            workspace_id=str(req.workspace_id),
        )

        # 3. Assemble prompt with <sources> boundary
        objectives_hint = (
            f"\nMục tiêu học tập cần đánh giá: {', '.join(req.objectives)}"
            if req.objectives
            else ""
        )
        user_instruction = (
            f"Thiết kế Ma trận Rubric đánh giá năng lực học sinh (Assessment Rubric) hoàn chỉnh cho:\n"
            f"- Môn học: {req.subject}\n"
            f"- Khối lớp: {req.grade_level}\n"
            f"- Chủ đề / Bài học: {req.topic}\n"
            f"- Số lượng tiêu chí đánh giá: {req.num_criteria} tiêu chí{objectives_hint}\n"
            f"- Định dạng thang điểm: {req.scale_type}\n\n"
            f"Yêu cầu kỹ thuật bắt buộc:\n"
            f"1. Cung cấp đúng 4 mức điểm: L4 (Xuất sắc / Giỏi), L3 (Tốt / Khá), L2 (Đạt / TB), L1 (Cần cố gắng).\n"
            f"2. Mỗi tiêu chí trong criteria phải có mô tả hành vi/biểu hiện chi tiết cho đủ 4 mức: 'L4', 'L3', 'L2', 'L1'.\n"
            f"3. Trọng số (weight) của từng tiêu chí phải là số nguyên dương (%) và tổng trọng số của tất cả các tiêu chí phải đúng bằng 100%.\n"
            f"4. Thể hiện rõ curriculum_alignment theo Yêu cầu cần đạt của Chương trình GDPT 2018."
        )

        system_prompt, user_prompt = build_grounded_generation_prompt(
            system_instruction=DEFAULT_RUBRIC_SYSTEM_INSTRUCTION,
            user_instruction=user_instruction,
            context_chunks=validated_chunks,
            custom_instructions=req.instructions,
        )

        # 4. Invoke LLM provider
        try:
            result = await self.provider.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=RubricSchema,
                context_chunks=validated_chunks,
            )
        except AIProviderError as e:
            logger.error("rubric_llm_provider_error", provider=e.provider, error=str(e))
            raise
        except Exception as e:
            logger.error("rubric_generation_unexpected_error", error=str(e))
            raise AIProviderError(
                f"Unexpected rubric generation failure: {str(e)}",
                provider=self.provider.provider_name,
                original_error=e,
            )

        # 5. Post-process & validate criteria, weights, and levels
        self._normalize_and_validate_rubric(result, req)

        # 6. Bind source chunk citations
        source_chunk_ids = extract_source_chunk_ids(validated_chunks)
        result.source_chunk_ids = source_chunk_ids

        logger.info(
            "rubric_generator_pipeline_completed",
            workspace_id=str(req.workspace_id),
            title=result.title,
            criteria_count=len(result.criteria),
            citations_count=len(result.source_chunk_ids),
        )

        return result

    def _normalize_and_validate_rubric(self, rubric: RubricSchema, req: RubricGenerationRequest) -> None:
        """
        Ensures rubric levels are populated, criteria weights sum to 100%,
        and every criterion has valid level descriptors.
        """
        # Ensure metadata is filled
        if not rubric.subject:
            rubric.subject = req.subject
        if not rubric.grade_level:
            rubric.grade_level = req.grade_level
        if not rubric.topic:
            rubric.topic = req.topic

        # Fallback to standard 4 levels if missing
        if not rubric.levels or len(rubric.levels) < 2:
            rubric.levels = list(STANDARD_RUBRIC_LEVELS)

        # Level IDs list
        level_ids = [lvl.id for lvl in rubric.levels]

        # Validate & normalize criteria
        if not rubric.criteria:
            # Create a default fallback criterion if none returned
            rubric.criteria = [
                RubricCriterion(
                    id="crit-1",
                    name="Nắm vững kiến thức trọng tâm",
                    description=f"Hiểu và vận dụng kiến thức bài học {req.topic}",
                    weight=100,
                    descriptors={
                        "L4": "Nắm vững toàn diện và giải thích xuất sắc các khái niệm trọng tâm.",
                        "L3": "Hiểu đúng các khái niệm chính và vận dụng độc lập.",
                        "L2": "Hiểu ở mức cơ bản nhưng còn lúng túng khi giải thích.",
                        "L1": "Chưa nắm được các khái niệm cốt lõi của bài học.",
                    },
                    curriculum_alignment=f"Chuẩn kiến thức môn {req.subject} lớp {req.grade_level}",
                )
            ]

        # Ensure all level descriptors exist in each criterion
        for idx, crit in enumerate(rubric.criteria):
            if not crit.id:
                crit.id = f"crit-{idx + 1}"
            if not crit.descriptors:
                crit.descriptors = {}
            for lvl_id in level_ids:
                if lvl_id not in crit.descriptors or not crit.descriptors[lvl_id].strip():
                    crit.descriptors[lvl_id] = f"Mức thể hiện {lvl_id} cho tiêu chí {crit.name}."

        # Normalize weights so sum == 100
        total_weight = sum(c.weight for c in rubric.criteria)
        if total_weight != 100 and total_weight > 0:
            assigned = 0
            n = len(rubric.criteria)
            for i, c in enumerate(rubric.criteria):
                if i == n - 1:
                    c.weight = max(1, 100 - assigned)
                else:
                    norm_w = max(1, round((c.weight / total_weight) * 100))
                    c.weight = norm_w
                    assigned += norm_w
        elif total_weight == 0:
            equal_w = 100 // len(rubric.criteria)
            rem = 100 % len(rubric.criteria)
            for i, c in enumerate(rubric.criteria):
                c.weight = equal_w + (rem if i == len(rubric.criteria) - 1 else 0)

        # Ensure curriculum alignment is populated
        if not rubric.curriculum_alignment:
            rubric.curriculum_alignment = (
                f"Đáp ứng Yêu cầu cần đạt (YCCĐ) chương trình GDPT 2018 môn {req.subject} lớp {req.grade_level} "
                f"đối với chủ đề '{req.topic}'."
            )


# Singleton instance
rubric_generator_pipeline = RubricGeneratorPipeline()
