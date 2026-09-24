"""
Pydantic schemas for AI Content Generation (BE-018).
Defines contracts for Lesson Plans, Quizzes, and Generation Requests.
"""

from typing import List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class LessonSection(BaseModel):
    """A distinct pedagogical section within a structured lesson plan."""
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(
        ...,
        description="Title of the section (e.g. 'Khởi động', 'Hình thành kiến thức', 'Luyện tập', 'Vận dụng')",
    )
    duration_minutes: int = Field(
        default=10,
        description="Estimated duration in minutes for this section",
    )
    content: str = Field(
        ...,
        description="Detailed pedagogical instructions, teacher/student activities, and content breakdown",
    )


class LessonPlanSchema(BaseModel):
    """
    Standardized curriculum-grounded Lesson Plan schema conforming to Rule 3.3.
    Guarantees structured pedagogical output with strict citation traceability.
    """
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., description="Title of the lesson plan")
    subject: str = Field(..., description="Subject name (e.g. Toán, Vật lí, Hóa học)")
    grade_level: str = Field(..., description="Target grade level (e.g. 10, 11, 12)")
    duration_minutes: int = Field(default=45, description="Total lesson duration in minutes")
    objectives: List[str] = Field(
        ...,
        description="List of specific learning objectives (Kiến thức, Năng lực, Phẩm chất)",
    )
    sections: List[LessonSection] = Field(
        ...,
        description="Chronological sections of the lesson plan",
    )
    materials_needed: List[str] = Field(
        default_factory=list,
        description="List of required equipment, textbooks, or instructional materials",
    )
    source_chunk_ids: List[str] = Field(
        default_factory=list,
        description="Provenance chunk IDs from pgvector used to ground this lesson plan",
    )
    insufficient_evidence: bool = Field(
        default=False,
        description="Flag indicating if generation had insufficient context",
    )

    @property
    def objective(self) -> str:
        """Backward-compatibility property returning combined objectives."""
        return "; ".join(self.objectives) if self.objectives else ""


# Alias for backward compatibility
LessonPlan = LessonPlanSchema


class LessonPlanGenerationRequest(BaseModel):
    """Request payload for lesson plan generation pipeline."""
    model_config = ConfigDict(extra="ignore")

    workspace_id: uuid.UUID = Field(..., description="Workspace ID for multi-tenant data isolation")
    subject: str = Field(..., min_length=1, description="Subject (e.g. Toán, Vật lí)")
    grade_level: str = Field(..., min_length=1, description="Grade level (e.g. 10, 11)")
    topic: str = Field(..., min_length=1, description="Topic or lesson title")
    objectives: Optional[List[str]] = Field(default=None, description="Optional custom learning objectives")
    duration_minutes: int = Field(default=45, ge=15, le=180, description="Total lesson duration in minutes")
    instructions: Optional[str] = Field(default=None, description="Additional custom instructions from teacher")
    document_ids: Optional[List[uuid.UUID]] = Field(default=None, description="Optional document IDs to restrict RAG search")
    min_similarity: float = Field(default=0.30, ge=0.0, le=1.0, description="Minimum cosine similarity threshold")


class QuizQuestion(BaseModel):
    """A curriculum-grounded quiz question with Bloom's taxonomy tagging."""
    model_config = ConfigDict(from_attributes=True)

    question_text: str = Field(..., description="The question text")
    options: List[str] = Field(..., min_length=4, max_length=4, description="List of exactly 4 options")
    correct_answer_index: int = Field(..., ge=0, le=3, description="Index of the correct option (0-3)")
    bloom_taxonomy_level: str = Field(
        default="Understand",
        description="Bloom's taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)",
    )
    explanation: str = Field(..., description="Detailed explanation of why the correct answer is right")
    source_chunk_ids: List[str] = Field(default_factory=list, description="Source chunk IDs supporting this question")


class Quiz(BaseModel):
    """Quiz containing multiple grounded assessment questions."""
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., description="Quiz title")
    questions: List[QuizQuestion] = Field(..., description="List of questions")
    source_chunk_ids: List[str] = Field(default_factory=list, description="All source chunk IDs cited across the quiz")
