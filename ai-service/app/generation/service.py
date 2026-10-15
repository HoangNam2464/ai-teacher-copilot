from typing import List, Optional, Union
import uuid
from app.generation.evidence_validator import validate_retrieval_evidence
from app.generation.lesson_planner import lesson_planner_pipeline
from app.generation.quiz_generator import QuizGeneratorPipeline, quiz_generator_pipeline
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    LessonPlanSchema,
    QuizGenerationRequest,
    QuizSchema,
)
from app.providers.factory import get_ai_provider
from app.retrieval.service import search_similar_chunks


async def generate_lesson_plan_service(
    workspace_id: Union[str, uuid.UUID],
    subject: str,
    grade_level: str,
    topic: str,
    instructions: Optional[str] = None,
    objectives: Optional[List[str]] = None,
    duration_minutes: int = 45,
    document_ids: Optional[List[uuid.UUID]] = None,
    min_similarity: float = 0.30,
) -> LessonPlanSchema:
    """
    Delegate lesson plan generation to the structured LessonPlannerPipeline.
    """
    ws_uuid = workspace_id if isinstance(workspace_id, uuid.UUID) else uuid.UUID(str(workspace_id))
    request = LessonPlanGenerationRequest(
        workspace_id=ws_uuid,
        subject=subject,
        grade_level=grade_level,
        topic=topic,
        objectives=objectives,
        duration_minutes=duration_minutes,
        instructions=instructions,
        document_ids=document_ids,
        min_similarity=min_similarity,
    )
    return await lesson_planner_pipeline.generate_lesson_plan(request)


async def generate_quiz_service(
    workspace_id: Union[str, uuid.UUID],
    subject: str,
    grade_level: str,
    topic: str,
    num_questions: int = 5,
    instructions: Optional[str] = None,
    question_types: Optional[List[str]] = None,
    difficulty: str = "MEDIUM",
    target_bloom_level: Optional[str] = None,
    document_ids: Optional[List[uuid.UUID]] = None,
    min_similarity: float = 0.30,
) -> QuizSchema:
    """
    Delegate quiz generation to the structured QuizGeneratorPipeline (BE-024).
    """
    ws_uuid = workspace_id if isinstance(workspace_id, uuid.UUID) else uuid.UUID(str(workspace_id))
    
    types = question_types or ["MCQ"]
    valid_types = [t.upper() for t in types if t.upper() in ("MCQ", "SHORT_ANSWER")]
    if not valid_types:
        valid_types = ["MCQ"]

    diff = difficulty.upper() if difficulty.upper() in ("EASY", "MEDIUM", "HARD") else "MEDIUM"

    request = QuizGenerationRequest(
        workspace_id=ws_uuid,
        subject=subject,
        grade_level=grade_level,
        topic=topic,
        num_questions=num_questions,
        question_types=valid_types,  # type: ignore[arg-type]
        difficulty=diff,  # type: ignore[arg-type]
        target_bloom_level=target_bloom_level,
        instructions=instructions,
        document_ids=document_ids,
        min_similarity=min_similarity,
    )

    # 1. Retrieve context with workspace isolation
    query = f"{subject} Lớp {grade_level} {topic} {instructions or ''}"
    retrieval_response = await search_similar_chunks(
        query=query,
        workspace_id=ws_uuid,
        document_ids=document_ids,
        subject=subject,
        grade_level=grade_level,
        top_k=max(5, num_questions * 2),
        similarity_threshold=min_similarity,
    )

    # 2. Validate evidence sufficiency to prevent ungrounded AI hallucination (Rule 7.7 & BE-017)
    validated_chunks = validate_retrieval_evidence(
        retrieval_response=retrieval_response,
        min_chunks=1,
        min_similarity=min_similarity,
        query=query,
        workspace_id=str(ws_uuid),
    )

    # 3. Call LLM provider with QuizSchema and response repair
    provider = get_ai_provider()
    pipeline = QuizGeneratorPipeline(provider=provider)
    return await pipeline.generate_quiz_from_chunks(request, validated_chunks)


