"""
Generation package for AI Teacher Copilot.
Provides structured LLM output generation, prompt boundary encapsulation,
and insufficient evidence validation.
"""

from app.generation.evidence_validator import (
    DEFAULT_USER_FRIENDLY_MESSAGE,
    InsufficientEvidenceError,
    validate_retrieval_evidence,
)
from app.generation.lesson_planner import (
    LessonPlannerPipeline,
    lesson_planner_pipeline,
)
from app.generation.prompt_builder import (
    UNTRUSTED_SOURCES_SECURITY_DIRECTIVE,
    build_grounded_generation_prompt,
    build_sources_boundary,
    escape_boundary_tags,
    extract_source_chunk_ids,
    format_single_source,
    wrap_sources_boundary,
)
from app.generation.schemas import (
    LessonPlan,
    LessonPlanGenerationRequest,
    LessonPlanSchema,
    LessonSection,
    Quiz,
    QuizQuestion,
)

__all__ = [
    "LessonPlan",
    "LessonPlanSchema",
    "LessonSection",
    "LessonPlanGenerationRequest",
    "LessonPlannerPipeline",
    "lesson_planner_pipeline",
    "Quiz",
    "QuizQuestion",
    "UNTRUSTED_SOURCES_SECURITY_DIRECTIVE",
    "DEFAULT_USER_FRIENDLY_MESSAGE",
    "InsufficientEvidenceError",
    "validate_retrieval_evidence",
    "build_grounded_generation_prompt",
    "build_sources_boundary",
    "escape_boundary_tags",
    "extract_source_chunk_ids",
    "format_single_source",
    "wrap_sources_boundary",
]
