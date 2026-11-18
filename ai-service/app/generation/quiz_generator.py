"""
Structured MCQ & Short Answer Quiz Generation Pipeline (BE-024 / ATC-77).

Implements:
1. End-to-end RAG pipeline for assessment: Query formulation -> pgvector retrieval with workspace isolation.
2. Anti-hallucination validation: Halts generation on insufficient evidence (Rule 7.7 & BE-017).
3. Secure prompt formulation: Encapsulates sources within <sources>...</sources> boundary (Rule 7.3 & BE-016).
4. Dual question-type support: MCQ (exactly 4 options, answer key, distractors) and SHORT_ANSWER (model answer).
5. Integrated Bloom's Taxonomy cognitive level tagging per question.
6. Robust schema validation, repair, and rejection engine for LLM outputs.
7. End-to-end citation provenance: Binds source_chunk_ids to each question and the quiz.
"""

from typing import Any, Dict, List, Optional, Union
import json
import re
import structlog

from app.generation.bloom_classifier import (
    BloomLevel,
    bloom_classifier,
    normalize_to_titlecase,
)
from app.generation.evidence_validator import (
    InsufficientEvidenceError,
    validate_retrieval_evidence,
)
from app.generation.prompt_builder import (
    build_grounded_generation_prompt,
    extract_source_chunk_ids,
)
from app.generation.schemas import (
    QuizGenerationRequest,
    QuizQuestion,
    QuizSchema,
)
from app.providers.base import BaseAIProvider
from app.providers.exceptions import AIProviderError
from app.providers.factory import get_ai_provider
from app.retrieval.service import search_similar_chunks

logger = structlog.get_logger()

VALID_BLOOM_LEVELS = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
]

BLOOM_SYNONYMS = {
    "nhớ": "Remember",
    "recall": "Remember",
    "memorize": "Remember",
    "hiểu": "Understand",
    "comprehend": "Understand",
    "vận dụng": "Apply",
    "áp dụng": "Apply",
    "application": "Apply",
    "phân tích": "Analyze",
    "analysis": "Analyze",
    "đánh giá": "Evaluate",
    "evaluation": "Evaluate",
    "sáng tạo": "Create",
    "creation": "Create",
}

DEFAULT_QUIZ_SYSTEM_INSTRUCTION = """
You are an expert assessment specialist and curriculum developer for K-12 education in Vietnam.
Your mission is to generate a comprehensive, curriculum-grounded assessment quiz with both Multiple Choice Questions (MCQ) and Short Answer questions based STRICTLY on the provided reference sources.

Strict Generation Rules:
1. Output Format: You MUST output valid structured JSON matching the provided QuizSchema.
2. Question Types:
   - MCQ: 'type' MUST be 'MCQ'. 'options' MUST contain exactly 4 distinct choices (A, B, C, D). 'correct_answer' MUST specify the correct option ('A', 'B', 'C', or 'D'). 'correct_answer_index' MUST be the 0-based integer index (0 for A, 1 for B, 2 for C, 3 for D). Distractors must be plausible and grounded in curriculum misconceptions.
   - SHORT_ANSWER: 'type' MUST be 'SHORT_ANSWER'. 'options' MUST be null. 'correct_answer' MUST contain a clear, concise sample model answer or key grading criteria. 'correct_answer_index' MUST be null.
3. Bloom's Taxonomy: Assign each question an appropriate cognitive level: 'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', or 'Create'.
4. Grounding & Citations: Every question MUST be grounded in the reference sources. Include the supporting source chunk IDs in 'source_chunk_ids'. Never fabricate facts or questions outside the provided context.
5. Pedagogical Explanations: Provide a detailed, clear explanation for why the answer is correct and why other options are incorrect.
""".strip()


class QuizValidationError(ValueError):
    """Raised when generated quiz fails validation and cannot be repaired."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


def normalize_bloom_level(level: Optional[str]) -> str:
    """Normalize Bloom's taxonomy level to standard Titlecase name (delegates to bloom_classifier)."""
    return normalize_to_titlecase(level)


def repair_and_clean_options(raw_options: Any) -> List[str]:
    """
    Repair and normalize MCQ options:
    - Converts dict format (e.g. {"A": "...", "B": "..."}) to list.
    - Strips redundant letter prefixes like 'A. ', 'B) ', 'C: '.
    - Removes empty or duplicate items.
    """
    if isinstance(raw_options, dict):
        # Extract options ordered by key
        sorted_keys = sorted(raw_options.keys())
        items = [str(raw_options[k]).strip() for k in sorted_keys if str(raw_options[k]).strip()]
    elif isinstance(raw_options, (list, tuple)):
        items = [str(opt).strip() for opt in raw_options if str(opt).strip()]
    else:
        return []

    # Strip leading option prefixes (e.g. "A. ", "B) ", "1. ", "D - ")
    cleaned_options = []
    prefix_pattern = re.compile(r"^(?:[A-D]|[1-4])\s*[\.\)\:\-]\s*", re.IGNORECASE)
    for opt in items:
        clean_text = prefix_pattern.sub("", opt).strip()
        cleaned_options.append(clean_text or opt)

    return cleaned_options


def validate_and_repair_quiz(
    raw_output: Any,
    request: QuizGenerationRequest,
    context_chunks: Optional[List[Any]] = None,
) -> QuizSchema:
    """
    Validates and repairs LLM generated quiz output.
    Enforces Acceptance Criteria for BE-024:
    - MCQ schema adherence & exactly 4 valid options.
    - Short-answer schema adherence.
    - Answer key existence and valid mapping.
    - Rejection of irreparable invalid output.

    Args:
        raw_output: QuizSchema object, Pydantic model, or dict from LLM.
        request: Original QuizGenerationRequest.
        context_chunks: Retrieved evidence chunks for citation fallback.

    Returns:
        QuizSchema: Fully validated and repaired quiz.

    Raises:
        QuizValidationError: If output is invalid and cannot be repaired.
    """
    fallback_chunk_ids = extract_source_chunk_ids(context_chunks) if context_chunks else []

    # Convert to dict if model instance
    if hasattr(raw_output, "model_dump"):
        data = raw_output.model_dump()
    elif isinstance(raw_output, str):
        try:
            # Strip possible markdown code blocks
            cleaned = re.sub(r"^```(?:json)?\s*", "", raw_output.strip())
            cleaned = re.sub(r"\s*```$", "", cleaned.strip())
            data = json.loads(cleaned)
        except Exception as e:
            raise QuizValidationError(
                f"Invalid JSON output from LLM: {str(e)}",
                details={"raw_output": raw_output[:200]},
            )
    elif isinstance(raw_output, dict):
        data = dict(raw_output)
    else:
        raise QuizValidationError(
            f"Unsupported raw output type: {type(raw_output)}",
            details={"raw_output": str(raw_output)},
        )

    # 1. Validate top-level quiz structure
    title = str(data.get("title") or f"Đề kiểm tra {request.subject} - {request.topic}").strip()
    raw_questions = data.get("questions")
    if not raw_questions or not isinstance(raw_questions, list):
        raise QuizValidationError(
            "Quiz output must contain a non-empty 'questions' list",
            details={"data": data},
        )

    validated_questions: List[QuizQuestion] = []
    option_letters = ["A", "B", "C", "D"]

    for idx, q_data in enumerate(raw_questions, start=1):
        if not isinstance(q_data, dict):
            if hasattr(q_data, "model_dump"):
                q_data = q_data.model_dump()
            else:
                continue

        # Determine and normalize question type
        raw_type = str(q_data.get("type", "MCQ")).strip().upper()
        if "SHORT" in raw_type or "LUAN" in raw_type or "ESSAY" in raw_type:
            q_type = "SHORT_ANSWER"
        else:
            q_type = "MCQ"

        q_text = str(q_data.get("question_text") or q_data.get("question") or "").strip()
        if not q_text:
            raise QuizValidationError(
                f"Question {idx} is missing required 'question_text'",
                details={"question_index": idx, "question_data": q_data},
            )

        raw_explanation = str(q_data.get("explanation") or "").strip()
        explanation = raw_explanation or "Giải thích dựa trên tài liệu tham khảo bài học."
        classification = bloom_classifier.classify_question(
            question_text=q_text,
            options=q_data.get("options"),
            explanation=raw_explanation,
            suggested_level=q_data.get("bloom_taxonomy_level"),
        )
        bloom_level = classification.level_titlecase

        # Resolve citations
        q_chunk_ids = q_data.get("source_chunk_ids") or []
        if not isinstance(q_chunk_ids, list) or len(q_chunk_ids) == 0:
            q_chunk_ids = fallback_chunk_ids

        if q_type == "MCQ":
            # 2. Validate & Repair MCQ
            cleaned_options = repair_and_clean_options(q_data.get("options"))

            # Check option validity: must be exactly 4 non-empty options
            if len(cleaned_options) < 4:
                # If less than 2 distinct options, question cannot be repaired safely
                if len(cleaned_options) < 2:
                    raise QuizValidationError(
                        f"MCQ Question {idx} has fewer than 2 valid options, cannot repair",
                        details={"question_index": idx, "options": cleaned_options},
                    )

                # Attempt repair by filling missing distractors if we have at least 2 distinct options
                existing_set = set(cleaned_options)
                fallback_distractors = [
                    "Phương án không chính xác theo bài học",
                    "Không có đủ dữ kiện để kết luận",
                    "Tất cả các phương án trên đều sai",
                ]
                for distractor in fallback_distractors:
                    if distractor not in existing_set and len(cleaned_options) < 4:
                        cleaned_options.append(distractor)
                        existing_set.add(distractor)

            elif len(cleaned_options) > 4:
                # Deduplicate and trim to exactly 4 options
                seen = set()
                deduped = []
                for opt in cleaned_options:
                    if opt not in seen:
                        seen.add(opt)
                        deduped.append(opt)
                cleaned_options = deduped[:4]

            if len(cleaned_options) != 4:
                raise QuizValidationError(
                    f"MCQ Question {idx} must have exactly 4 valid options, found {len(cleaned_options)}",
                    details={"question_index": idx, "options": cleaned_options},
                )

            # 3. Validate & Repair MCQ Answer Key
            raw_answer = q_data.get("correct_answer")
            raw_index = q_data.get("correct_answer_index")

            correct_index: Optional[int] = None
            correct_letter: str = "A"

            # Check if index is already valid (0, 1, 2, 3)
            if raw_index is not None:
                try:
                    idx_val = int(raw_index)
                    if 0 <= idx_val < 4:
                        correct_index = idx_val
                        correct_letter = option_letters[idx_val]
                except (ValueError, TypeError):
                    pass

            # If index not resolved, check correct_answer string
            if correct_index is None and raw_answer is not None:
                ans_str = str(raw_answer).strip()

                # Check if matches 'A', 'B', 'C', 'D'
                upper_ans = ans_str.upper()
                if upper_ans in option_letters:
                    correct_index = option_letters.index(upper_ans)
                    correct_letter = upper_ans
                elif upper_ans.startswith("A") or "ĐÁP ÁN A" in upper_ans:
                    correct_index, correct_letter = 0, "A"
                elif upper_ans.startswith("B") or "ĐÁP ÁN B" in upper_ans:
                    correct_index, correct_letter = 1, "B"
                elif upper_ans.startswith("C") or "ĐÁP ÁN C" in upper_ans:
                    correct_index, correct_letter = 2, "C"
                elif upper_ans.startswith("D") or "ĐÁP ÁN D" in upper_ans:
                    correct_index, correct_letter = 3, "D"
                else:
                    # Match by option text content
                    for opt_idx, opt_text in enumerate(cleaned_options):
                        if opt_text.lower() == ans_str.lower() or ans_str.lower() in opt_text.lower():
                            correct_index = opt_idx
                            correct_letter = option_letters[opt_idx]
                            break

            # If answer key cannot be found or resolved, reject the question
            if correct_index is None or not (0 <= correct_index < 4):
                raise QuizValidationError(
                    f"MCQ Question {idx} lacks a valid answer key matching the 4 options",
                    details={
                        "question_index": idx,
                        "raw_answer": raw_answer,
                        "raw_index": raw_index,
                        "options": cleaned_options,
                    },
                )

            validated_questions.append(
                QuizQuestion(
                    question_number=idx,
                    type="MCQ",
                    question_text=q_text,
                    options=cleaned_options,
                    correct_answer=correct_letter,
                    correct_answer_index=correct_index,
                    explanation=explanation,
                    bloom_taxonomy_level=bloom_level,
                    source_chunk_ids=q_chunk_ids,
                )
            )

        else:
            # 4. Validate & Repair Short-Answer Question
            raw_answer = str(q_data.get("correct_answer") or "").strip()
            if not raw_answer:
                # Fallback to raw explanation if provided as model response
                if raw_explanation and len(raw_explanation) > 10:
                    raw_answer = raw_explanation
                else:
                    raise QuizValidationError(
                        f"Short-answer Question {idx} lacks a valid model answer in 'correct_answer'",
                        details={"question_index": idx, "question_data": q_data},
                    )

            validated_questions.append(
                QuizQuestion(
                    question_number=idx,
                    type="SHORT_ANSWER",
                    question_text=q_text,
                    options=None,
                    correct_answer=raw_answer,
                    correct_answer_index=None,
                    explanation=explanation,
                    bloom_taxonomy_level=bloom_level,
                    source_chunk_ids=q_chunk_ids,
                )
            )

    if not validated_questions:
        raise QuizValidationError(
            "Failed to validate any questions in quiz output",
            details={"raw_output": raw_output},
        )

    # Gather all unique source chunks
    all_chunks: List[str] = []
    seen_chunks = set()
    for q in validated_questions:
        for cid in q.source_chunk_ids:
            if cid not in seen_chunks:
                seen_chunks.add(cid)
                all_chunks.append(cid)

    if not all_chunks and fallback_chunk_ids:
        all_chunks = fallback_chunk_ids

    return QuizSchema(
        title=title,
        subject=request.subject,
        grade_level=request.grade_level,
        topic=request.topic,
        difficulty=request.difficulty,
        questions=validated_questions,
        source_chunk_ids=all_chunks,
        insufficient_evidence=False,
    )


class QuizGeneratorPipeline:
    """
    RAG-powered quiz generation pipeline enforcing structured MCQ and Short Answer
    generation, prompt injection defense, and schema validation.
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self._provider = provider

    @property
    def provider(self) -> BaseAIProvider:
        """Resolve the active AI provider."""
        return self._provider or get_ai_provider()

    async def generate_quiz(
        self,
        request: Union[QuizGenerationRequest, dict],
    ) -> QuizSchema:
        """
        Execute the end-to-end quiz generation pipeline:
        1. Parse and validate request.
        2. Retrieve relevant context chunks from pgvector within teacher's workspace.
        3. Validate evidence sufficiency to prevent hallucination.
        4. Assemble structured prompt with secure <sources> boundary.
        5. Invoke LLM provider with QuizSchema response enforcement.
        6. Validate & repair structured output (options, answer key, bloom levels, citations).

        Args:
            request: Validated QuizGenerationRequest or payload dict.

        Returns:
            QuizSchema: Grounded, validated quiz.

        Raises:
            InsufficientEvidenceError: If retrieved context is inadequate.
            QuizValidationError: If LLM output fails schema validation and cannot be repaired.
            AIProviderError: If the underlying LLM provider encounters an error.
        """
        # 1. Parse request
        if isinstance(request, dict):
            req = QuizGenerationRequest(**request)
        else:
            req = request

        logger.info(
            "quiz_generator_pipeline_started",
            workspace_id=str(req.workspace_id),
            subject=req.subject,
            grade_level=req.grade_level,
            topic=req.topic,
            num_questions=req.num_questions,
            question_types=req.question_types,
            difficulty=req.difficulty,
        )

        # 2. Formulate RAG query and perform workspace-isolated retrieval
        query_parts = [req.subject, f"Lớp {req.grade_level}", req.topic]
        if req.target_bloom_level:
            query_parts.append(f"Mức độ nhận thức: {req.target_bloom_level}")
        if req.instructions:
            query_parts.append(req.instructions)
        search_query = " ".join(query_parts)

        retrieval_response = await search_similar_chunks(
            query=search_query,
            workspace_id=req.workspace_id,
            document_ids=req.document_ids,
            subject=req.subject,
            grade_level=req.grade_level,
            top_k=max(5, req.num_questions * 2),
            similarity_threshold=req.min_similarity,
        )

        # 3. Evidence sufficiency validation (Rule 7.7 & BE-017)
        validated_chunks = validate_retrieval_evidence(
            retrieval_response=retrieval_response,
            min_chunks=1,
            min_similarity=req.min_similarity,
            query=search_query,
            workspace_id=str(req.workspace_id),
        )

        # 4. Generate quiz from validated chunks
        return await self.generate_quiz_from_chunks(req, validated_chunks)

    async def generate_quiz_from_chunks(
        self,
        request: QuizGenerationRequest,
        validated_chunks: List[Any],
    ) -> QuizSchema:
        """
        Generate structured assessment quiz from pre-validated reference chunks.
        """
        req = request
        types_desc = ", ".join(req.question_types)
        bloom_hint = (
            f"\nƯu tiên mức độ nhận thức Bloom: {req.target_bloom_level}."
            if req.target_bloom_level
            else "\nPhân bổ hài hòa các mức độ nhận thức Bloom (Remember, Understand, Apply, Analyze)."
        )

        user_instruction = (
            f"Thiết kế đề kiểm tra / bài đánh giá cho:\n"
            f"- Môn học: {req.subject}\n"
            f"- Khối lớp: {req.grade_level}\n"
            f"- Chủ đề / Bài học: {req.topic}\n"
            f"- Tổng số câu hỏi: {req.num_questions} câu\n"
            f"- Các dạng câu hỏi cần sinh: {types_desc}\n"
            f"- Mức độ khó: {req.difficulty}{bloom_hint}\n"
            f"Yêu cầu:\n"
            f"1. Với câu hỏi trắc nghiệm (MCQ): Đảm bảo đúng 4 lựa chọn (A, B, C, D) không trùng lặp, "
            f"chỉ định rõ đáp án đúng và giải thích cặn kẽ dựa vào tài liệu.\n"
            f"2. Với câu hỏi tự luận ngắn (SHORT_ANSWER): Đưa ra câu hỏi súc tích và đáp án mẫu chuẩn xác.\n"
            f"3. Tất cả các câu hỏi phải gắn mã nguồn trích dẫn từ tài liệu tham khảo."
        )

        system_prompt, user_prompt = build_grounded_generation_prompt(
            system_instruction=DEFAULT_QUIZ_SYSTEM_INSTRUCTION,
            user_instruction=user_instruction,
            context_chunks=validated_chunks,
            custom_instructions=req.instructions,
        )

        # 5. LLM structured generation
        try:
            raw_output = await self.provider.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=QuizSchema,
                context_chunks=validated_chunks,
            )
        except AIProviderError as e:
            logger.error("quiz_llm_provider_error", provider=e.provider, error=str(e))
            raise
        except Exception as e:
            logger.error("quiz_generation_unexpected_error", error=str(e))
            raise AIProviderError(
                f"Unexpected generation failure: {str(e)}",
                provider=self.provider.provider_name,
                original_error=e,
            )

        # 6. Schema validation & repair pipeline (AC: reject hoặc repair)
        try:
            validated_quiz = validate_and_repair_quiz(
                raw_output=raw_output,
                request=req,
                context_chunks=validated_chunks,
            )
        except QuizValidationError as val_err:
            logger.warning(
                "quiz_validation_failed_repair_impossible",
                error=val_err.message,
                details=val_err.details,
            )
            raise

        logger.info(
            "quiz_generator_pipeline_completed",
            workspace_id=str(req.workspace_id),
            title=validated_quiz.title,
            questions_count=len(validated_quiz.questions),
            citations_count=len(validated_quiz.source_chunk_ids),
        )

        return validated_quiz


# Singleton pipeline instance
quiz_generator_pipeline = QuizGeneratorPipeline()
