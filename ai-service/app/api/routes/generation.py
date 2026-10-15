"""
Generation routes — AI Lesson Plan and Quiz generation (BE-018).
Guarantees evidence grounding, schema enforcement, and maps failures to appropriate HTTP status codes.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.generation.bloom_classifier import (
    BatchClassifyRequest,
    BloomClassificationResult,
    SingleQuestionClassifyRequest,
    bloom_classifier,
)
from app.generation.evidence_validator import InsufficientEvidenceError
from app.generation.lesson_planner import lesson_planner_pipeline
from app.generation.quiz_generator import QuizValidationError, quiz_generator_pipeline
from app.generation.schemas import (
    LessonPlanGenerationRequest,
    QuizGenerationRequest,
)
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
    request: Optional[QuizGenerationRequest] = None,
    workspace_id: Optional[str] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    topic: Optional[str] = None,
    num_questions: int = 5,
    instructions: Optional[str] = None,
    difficulty: str = "MEDIUM",
    target_bloom_level: Optional[str] = None,
    _api_key: str = Depends(verify_api_key),
):
    """
    Generate curriculum-grounded structured assessment quiz (MCQ and Short Answer) (BE-024).
    Supports JSON body payload or query parameters.
    """
    try:
        if request is not None:
            quiz = await quiz_generator_pipeline.generate_quiz(request)
        else:
            if not workspace_id or not subject or not grade_level or not topic:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing required fields: workspace_id, subject, grade_level, topic",
                )
            quiz = await generate_quiz_service(
                workspace_id=workspace_id,
                subject=subject,
                grade_level=grade_level,
                topic=topic,
                num_questions=num_questions,
                instructions=instructions,
                difficulty=difficulty,
                target_bloom_level=target_bloom_level,
            )
        return {
            "status": "success",
            "content_type": "quiz",
            "data": quiz.model_dump(),
        }
    except HTTPException:
        raise
    except InsufficientEvidenceError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.to_dict(),
        )
    except QuizValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "QUIZ_VALIDATION_ERROR",
                "message": e.message,
                "details": e.details,
            },
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


@router.post("/bloom/classify", response_model=BloomClassificationResult)
async def classify_question_bloom(
    request: SingleQuestionClassifyRequest,
    _api_key: str = Depends(verify_api_key),
):
    """
    Automated Bloom's Taxonomy Question Classification endpoint (BE-026 / ATC-82).
    Classifies a question into REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE.
    """
    try:
        result = bloom_classifier.classify_question(
            question_text=request.question_text,
            options=request.options,
            explanation=request.explanation,
            suggested_level=request.suggested_level,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bloom classification failed: {str(e)}",
        )


@router.post("/bloom/batch-classify")
async def batch_classify_questions_bloom(
    request: BatchClassifyRequest,
    _api_key: str = Depends(verify_api_key),
):
    """
    Batch classification of multiple questions and computation of cognitive distribution (BE-026 / ATC-82).
    """
    try:
        results = [
            bloom_classifier.classify_question(
                question_text=q.question_text,
                options=q.options,
                explanation=q.explanation,
                suggested_level=q.suggested_level,
            )
            for q in request.questions
        ]
        distribution = bloom_classifier.calculate_bloom_distribution(
            [{"bloom_taxonomy_level": r.level_titlecase} for r in results]
        )
        return {
            "status": "success",
            "count": len(results),
            "results": [r.model_dump() for r in results],
            "distribution": distribution,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch Bloom classification failed: {str(e)}",
        )
