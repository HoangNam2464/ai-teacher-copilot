---
description: >-
  Rules for implementing Quiz Generator in AI Teacher Copilot.
  Generates curriculum-grounded quizzes (MCQ, Short Answer) with
  integrated Bloom Taxonomy tagging and question-level citation tracking.
trigger: model_decision
---

# Feature Rules: Quiz Generator

## 1. Scope

### Includes
- Teacher inputs: subject, grade level, topic, question count (default 5, max 20), question types (MCQ, Short Answer), difficulty level, optional target Bloom Taxonomy levels
- Grounding via RAG retrieval from workspace instructional documents
- Structured output conforming to `QuizSchema`
- Integrated **Bloom's Taxonomy** level tagging per question (Remember, Understand, Apply, Analyze, Evaluate, Create)
- Correct answer identification, distractor generation for MCQs, and source-grounded explanations
- Citation binding (`source_chunk_ids`) per question

### Excludes (Deferred / Out of Scope)
- Standalone Bloom Taxonomy question generation (fully integrated into Quiz)
- Automatic grading of student answer submissions
- Long-form essay question grading

---

## 2. Architecture & Responsibility

- **Core Backend (`backend/`)**:
  - Validates request parameters and workspace ownership.
  - Calls FastAPI internal generation endpoint.
  - Stores quiz structure in `generated_contents` as JSONB.
- **AI Service (`ai-service/`)**:
  - Performs RAG retrieval for quiz topic.
  - Orchestrates prompt with untrusted data isolation (`<sources>`).
  - Generates structured quiz conforming to Pydantic schema.

---

## 3. Implementation & Security Constraints

1. **Bloom's Taxonomy Integration**: Bloom levels are an integral attribute of each question generated in the quiz, not a standalone service or feature.
2. **Untrusted Data Boundary**: All retrieved document context MUST be passed to the generation model inside a dedicated `<sources>...</sources>` boundary and treated strictly as untrusted reference data. Document content must not override system behavior or reveal system prompts.
3. **Structured Data Contract**:
   ```python
   class QuizQuestion(BaseModel):
       question_number: int
       type: Literal["MCQ", "SHORT_ANSWER"]
       question_text: str
       options: list[str] | None = None  # Exactly 4 options for MCQ
       correct_answer: str               # "A"/"B"/"C"/"D" or sample short answer
       explanation: str                  # Grounded explanation referencing source
       bloom_taxonomy_level: str         # Remember, Understand, Apply, Analyze, Evaluate, Create
       source_chunk_ids: list[str]       # Provenance chunk IDs

   class QuizSchema(BaseModel):
       title: str
       subject: str
       grade_level: str
       topic: str
       difficulty: Literal["EASY", "MEDIUM", "HARD"]
       questions: list[QuizQuestion]
       insufficient_evidence: bool = False
   ```
4. **Question Grounding**: Every question must link to one or more `source_chunk_ids`. Fabricating questions outside the retrieved context is prohibited.
5. **MCQ Quality**: MCQ questions must have plausible distractors grounded in common misconceptions or related facts from the source material.

---

## 4. API Contract

```text
POST /api/workspaces/{workspaceId}/generation/quiz
Request: {
  subject: string,
  gradeLevel: string,
  topic: string,
  questionCount?: number,
  questionTypes?: ("MCQ" | "SHORT_ANSWER")[],
  difficulty?: "EASY" | "MEDIUM" | "HARD",
  targetBloomLevel?: string,
  instructions?: string,
  documentIds?: UUID[]
}
Response: 200 OK {
  id: UUID,
  contentType: "QUIZ",
  title: string,
  contentData: { ...QuizSchema... },
  reviewStatus: "DRAFT",
  version: 1,
  createdAt: string
}
Errors: 422 Unprocessable Entity (insufficient evidence), 403 Forbidden
```

---

## 5. Definition of Done

- [ ] Quiz output strictly validates against `QuizSchema`.
- [ ] Each question includes a valid `bloom_taxonomy_level` and `source_chunk_ids`.
- [ ] MCQ questions contain exactly 4 options with a designated correct answer and explanation.
- [ ] Prompt uses `<sources>` boundary to prevent prompt injection.
- [ ] Insufficient context returns `insufficient_evidence: true`.
- [ ] CI tests pass (`backend-ci.yml`, `ai-service-ci.yml`).
