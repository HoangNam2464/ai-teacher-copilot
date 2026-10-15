"""
Pydantic schemas for AI Content Generation (BE-018).
Defines contracts for Lesson Plans, Quizzes, and Generation Requests.
"""

from typing import List, Literal, Optional
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
    """
    A curriculum-grounded quiz question supporting MCQ and SHORT_ANSWER types (BE-024 / ATC-77).
    Conforms to Rule 3.3 and feature-quiz-generator.md.
    """
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    question_number: int = Field(
        default=1,
        ge=1,
        description="Sequential 1-based question number within the quiz",
    )
    type: Literal["MCQ", "SHORT_ANSWER"] = Field(
        default="MCQ",
        description="Question format: 'MCQ' for multiple choice or 'SHORT_ANSWER' for constructed response",
    )
    question_text: str = Field(
        ...,
        description="The question prompt, problem, or assessment task text",
    )
    options: Optional[List[str]] = Field(
        default=None,
        description="List of exactly 4 choices for MCQ (A, B, C, D). None or omitted for SHORT_ANSWER.",
    )
    correct_answer: str = Field(
        ...,
        description="For MCQ: 'A', 'B', 'C', or 'D' (or option text). For SHORT_ANSWER: sample model answer or key grading points.",
    )
    correct_answer_index: Optional[int] = Field(
        default=None,
        ge=0,
        le=3,
        description="0-based index of correct option for MCQ (0=A, 1=B, 2=C, 3=D). None for SHORT_ANSWER.",
    )
    explanation: str = Field(
        ...,
        description="Detailed pedagogical explanation and reasoning grounded in the source reference material.",
    )
    bloom_taxonomy_level: str = Field(
        default="Understand",
        description="Bloom's taxonomy cognitive level: Remember, Understand, Apply, Analyze, Evaluate, Create",
    )
    source_chunk_ids: List[str] = Field(
        default_factory=list,
        description="Provenance chunk IDs from pgvector grounding this question",
    )


class QuizSchema(BaseModel):
    """
    Standardized curriculum-grounded Quiz schema conforming to feature-quiz-generator.md and BE-024.
    """
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    title: str = Field(..., description="Descriptive title of the quiz assessment")
    subject: str = Field(..., description="Subject name (e.g. Toán học, Vật lí, Hóa học)")
    grade_level: str = Field(..., description="Target grade level (e.g. 10, 11, 12)")
    topic: str = Field(..., description="Curriculum topic or chapter")
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = Field(
        default="MEDIUM",
        description="Assessment difficulty level",
    )
    questions: List[QuizQuestion] = Field(..., description="List of assessment questions")
    source_chunk_ids: List[str] = Field(
        default_factory=list,
        description="All provenance chunk IDs cited across the quiz",
    )
    insufficient_evidence: bool = Field(
        default=False,
        description="Flag indicating if generation had insufficient context",
    )


# Alias for backward compatibility
Quiz = QuizSchema


class QuizGenerationRequest(BaseModel):
    """Request payload for quiz generation pipeline (BE-024)."""
    model_config = ConfigDict(extra="ignore")

    workspace_id: uuid.UUID = Field(..., description="Workspace ID for multi-tenant data isolation")
    subject: str = Field(..., min_length=1, description="Subject (e.g. Toán, Tiếng Anh)")
    grade_level: str = Field(..., min_length=1, description="Grade level (e.g. 10, 11)")
    topic: str = Field(..., min_length=1, description="Quiz topic or unit name")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate (1-20)")
    question_types: List[Literal["MCQ", "SHORT_ANSWER"]] = Field(
        default_factory=lambda: ["MCQ"],
        description="Types of questions to generate: MCQ and/or SHORT_ANSWER",
    )
    difficulty: Literal["EASY", "MEDIUM", "HARD"] = Field(
        default="MEDIUM",
        description="Target difficulty level",
    )
    target_bloom_level: Optional[str] = Field(
        default=None,
        description="Target Bloom Taxonomy cognitive level (e.g. Remember, Understand, Apply, etc.)",
    )
    instructions: Optional[str] = Field(
        default=None,
        description="Additional teacher guidance, formatting requests, or focus areas",
    )
    document_ids: Optional[List[uuid.UUID]] = Field(
        default=None,
        description="Optional list of document IDs to restrict RAG search",
    )
    min_similarity: float = Field(
        default=0.30,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity threshold for vector retrieval",
    )
