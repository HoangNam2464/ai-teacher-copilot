from pydantic import BaseModel, Field

class LessonSection(BaseModel):
    title: str = Field(description="Title of the section, e.g., 'Introduction', 'Main Activity'")
    duration_minutes: int = Field(description="Estimated duration in minutes")
    content: str = Field(description="Detailed instructions or content for this section")

class LessonPlan(BaseModel):
    title: str
    objective: str = Field(description="Main learning objective")
    sections: list[LessonSection]
    materials_needed: list[str] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    question_text: str
    options: list[str] = Field(description="List of exactly 4 options")
    correct_answer_index: int = Field(description="Index of the correct option (0-3)")
    bloom_taxonomy_level: str = Field(description="Bloom's taxonomy level (e.g., Remember, Understand, Apply, Analyze, Evaluate, Create)")
    explanation: str

class Quiz(BaseModel):
    title: str
    questions: list[QuizQuestion]
