"""
Content generation routes — lesson plans, quizzes.
Orchestrates RAG retrieval + LLM structured generation.
"""

from fastapi import APIRouter, Depends

from app.core.security import verify_api_key

router = APIRouter()


@router.post("/lesson-plan")
async def generate_lesson_plan(
    workspace_id: str,
    subject: str,
    grade_level: str,
    topic: str,
    instructions: str | None = None,
    _api_key: str = Depends(verify_api_key),
):
    """
    Generate a structured lesson plan using RAG.

    TODO: Implement in Phase 5 (RAG + Lesson Planner)
    - Retrieve relevant chunks
    - Build prompt with context + instructions
    - Call LLM with structured output schema
    - Attach citations
    - Return structured lesson plan
    """
    return {
        "status": "accepted",
        "content_type": "lesson_plan",
        "message": "Lesson plan generation — implementation in Phase 5",
    }


@router.post("/quiz")
async def generate_quiz(
    workspace_id: str,
    subject: str,
    grade_level: str,
    topic: str,
    num_questions: int = 5,
    instructions: str | None = None,
    _api_key: str = Depends(verify_api_key),
):
    """
    Generate quiz questions with Bloom taxonomy tagging.

    TODO: Implement in Phase 6 (Content Generation)
    - Retrieve relevant chunks
    - Build prompt with Bloom taxonomy requirements
    - Call LLM with quiz schema
    - Attach citations and Bloom tags
    - Return structured quiz
    """
    return {
        "status": "accepted",
        "content_type": "quiz",
        "message": "Quiz generation — implementation in Phase 6",
    }
