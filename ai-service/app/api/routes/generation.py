"""
Generation routes — AI Lesson Plan and Quiz generation (BE-018).
Guarantees evidence grounding, schema enforcement, and maps failures to appropriate HTTP status codes.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.lesson_planner import lesson_planner_pipeline
from app.generation.schemas import LessonPlanGenerationRequest
from app.generation.service import generate_lesson_plan_service, generate_quiz_service
from app.providers.exceptions import AIProviderError

router = APIRouter()


@router.post("/lesson-plan")
async def generate_lesson_plan(
    request: Optional[LessonPlanGenerationRequest] = None,
    workspace_id: Optional[str] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    topic: Optional[str] = None,
    instructions: Optional[str] = None,
    _api_key: str = Depends(verify_api_key),
):
    """
    Generate a curriculum-grounded structured lesson plan using RAG and LLM.
    Supports JSON body payload or query parameters.
    """
    try:
        if request is not None:
            plan = await lesson_planner_pipeline.generate_lesson_plan(request)
        else:
            if not workspace_id or not subject or not grade_level or not topic:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields: workspace_id, subject, grade_level, topic",
                )
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
    except HTTPException:
        raise
    except InsufficientEvidenceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "AI_PROVIDER_ERROR",
                "message": str(e),
                "provider": e.provider,
            },
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
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "AI_PROVIDER_ERROR",
                "message": str(e),
                "provider": e.provider,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}",
        )
