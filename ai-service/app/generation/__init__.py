"""
Generation package for AI Teacher Copilot.
Provides structured LLM output generation and prompt boundary encapsulation.
"""

from app.generation.prompt_builder import (
    UNTRUSTED_SOURCES_SECURITY_DIRECTIVE,
    build_grounded_generation_prompt,
    build_sources_boundary,
    escape_boundary_tags,
    extract_source_chunk_ids,
    format_single_source,
    wrap_sources_boundary,
)
from app.generation.schemas import LessonPlan, LessonSection, Quiz, QuizQuestion

__all__ = [
    "LessonPlan",
    "LessonSection",
    "Quiz",
    "QuizQuestion",
    "UNTRUSTED_SOURCES_SECURITY_DIRECTIVE",
    "build_grounded_generation_prompt",
    "build_sources_boundary",
    "escape_boundary_tags",
    "extract_source_chunk_ids",
    "format_single_source",
    "wrap_sources_boundary",
]
