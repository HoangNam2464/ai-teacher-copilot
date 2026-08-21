from fastapi import APIRouter, Depends
from app.core.security import verify_api_key
from app.generation.service import generate_lesson_plan_service, generate_quiz_service

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
    plan, citations = await generate_lesson_plan_service(workspace_id, subject, grade_level, topic, instructions)
    return {
        "status": "success",
        "content_type": "lesson_plan",
        "data": plan.model_dump(),
        "citations": citations
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
    quiz, citations = await generate_quiz_service(workspace_id, subject, grade_level, topic, num_questions, instructions)
    return {
        "status": "success",
        "content_type": "quiz",
        "data": quiz.model_dump(),
        "citations": citations
    }
