"""
Generation routes — AI Lesson Plan and Quiz generation.
Guarantees evidence grounding and maps insufficient evidence to HTTP 422 (BE-017).
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.service import generate_lesson_plan_service, generate_quiz_service

router = APIRouter()


@router.post("/lesson-plan")
async def generate_lesson_plan(
    workspace_id: str,
    subject: str,
    grade_level: str,
    topic: str,
    instructions: Optional[str] = None,
    _api_key: str = Depends(verify_api_key),
):
    try:
        plan = await generate_lesson_plan_service(
            workspace_id=workspace_id,
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            instructions=instructions,
        )
        return {
            "status": "success",
            "content_type": "lesson_plan",
            "data": plan.model_dump(),
        }
    except InsufficientEvidenceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lesson plan generation failed: {str(e)}",
        )


@router.post("/quiz")
async def generate_quiz(
    workspace_id: str,
    subject: str,
    grade_level: str,
    topic: str,
    num_questions: int = 5,
    instructions: Optional[str] = None,
    _api_key: str = Depends(verify_api_key),
):
    try:
        quiz = await generate_quiz_service(
            workspace_id=workspace_id,
            subject=subject,
            grade_level=grade_level,
            topic=topic,
            num_questions=num_questions,
            instructions=instructions,
        )
        return {
            "status": "success",
            "content_type": "quiz",
            "data": quiz.model_dump(),
        }
    except InsufficientEvidenceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}",
        )
