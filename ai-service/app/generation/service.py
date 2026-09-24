from typing import List, Optional, Union
import uuid
from app.generation.evidence_validator import validate_retrieval_evidence
from app.generation.lesson_planner import lesson_planner_pipeline
from app.generation.prompt_builder import (
    build_grounded_generation_prompt,
    extract_source_chunk_ids,
)
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    LessonPlanSchema,
    Quiz,
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
    workspace_id: str,
    subject: str,
    grade_level: str,
    topic: str,
    num_questions: int = 5,
    instructions: Optional[str] = None,
    min_similarity: float = 0.30,
):
    # 1. Retrieve context with workspace isolation
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    retrieval_response = await search_similar_chunks(query, workspace_id, top_k=5)

    # 2. Validate evidence sufficiency to prevent ungrounded AI hallucination (Rule 7.7 & BE-017)
    validated_chunks = validate_retrieval_evidence(
        retrieval_response=retrieval_response,
        min_chunks=1,
        min_similarity=min_similarity,
        query=query,
        workspace_id=workspace_id,
    )

    # 3. Build structured prompt with prompt boundary
    system_instruction = (
        f"You are an expert educational assessment specialist for K-12 teachers. "
        f"Create a quiz with {num_questions} questions covering various Bloom's Taxonomy levels. "
        f"You must output structured JSON conforming exactly to the provided schema."
    )
    user_instruction = (
        f"Create a quiz for:\n"
        f"Subject: {subject}\n"
        f"Grade Level: {grade_level}\n"
        f"Topic: {topic}"
    )

    system_prompt, user_prompt = build_grounded_generation_prompt(
        system_instruction=system_instruction,
        user_instruction=user_instruction,
        context_chunks=validated_chunks,
        custom_instructions=instructions,
    )

    # 4. Call LLM via provider abstraction
    provider = get_ai_provider()
    result = await provider.generate_structured_output(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_schema=Quiz,
        context_chunks=validated_chunks,
    )
    return result
