---
description: >-
  Rules for implementing Quiz Generator in AI Teacher Copilot.
  Teacher inputs topic + KB. System retrieves context, generates structured
  quiz (MCQ + short answer) grounded in source documents, with citations.
trigger: model_decision
---

# Feature Rules: Quiz Generator

## Scope

**Includes:**
- Generate quiz (MCQ + short answer) from Knowledge Base
- Teacher specifies: topic, number of questions, question types, difficulty
- Structured output with correct answers and citations
- Save to generation history

**Excludes:**
- True/False questions (SHOULD-HAVE, add after MCQ works)
- Essay questions (DEFERRED)
- Adaptive difficulty (DEFERRED)
- Auto-grading of student submissions (OUT OF SCOPE)

---

## Files Involved

### Spring Boot
```
backend/src/main/java/com/aiteachercopilot/generation/
    ├── GenerationController.java    ← POST /api/generation/quiz
    └── GenerationService.java       ← calls FastAPI + saves history
```

### FastAPI
```
ai-service/app/
├── api/routes/generation.py         ← POST /generation/quiz
└── generation/
    ├── service.py                   ← retrieve → prompt → parse → return
    └── schemas.py                   ← QuizSchema, QuestionSchema
```

---

## QuizSchema (Pydantic — Structured Output)

```python
class MCQOption(BaseModel):
    label: str          # "A", "B", "C", "D"
    text: str

class QuestionSchema(BaseModel):
    questionNumber: int
    type: Literal["MCQ", "SHORT_ANSWER"]
    question: str
    options: list[MCQOption] | None      # MCQ only
    correctAnswer: str                   # "A" for MCQ, sample answer for short
    explanation: str                     # why this is correct, grounded in source
    sourceChunkIds: list[str]           # which chunks support this question

class QuizSchema(BaseModel):
    title: str
    subject: str
    gradeLevel: str
    topic: str
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    questions: list[QuestionSchema]
    insufficientEvidence: bool
```

---

## Implementation Rules

### Generation Rules
1. EACH question must have `sourceChunkIds` — questions not grounded in source chunks are INVALID
2. If retrieved chunks insufficient for requested number of questions → reduce question count and note it, OR return `insufficientEvidence: true`
3. NEVER generate questions from LLM's general knowledge — only from retrieved `<sources>`
4. `correctAnswer` for MCQ: label only ("A", "B", "C", "D") — not full text
5. Distractors (wrong MCQ options) must be plausible but clearly wrong per source material
6. `explanation` must cite the source material, not just restate the question

### Question Count Rules
- Minimum: 3 questions (if fewer chunks available, return what's possible)
- Maximum: 20 questions per request
- Default: 5 questions

### Difficulty Mapping (for prompt engineering)
- `EASY`: recall questions (what, who, when)
- `MEDIUM`: comprehension questions (explain, describe)
- `HARD`: application/analysis questions (apply, compare, evaluate)

---

## API Contract

```
POST /api/generation/quiz
Body: {
  workspaceId: UUID,
  knowledgeBaseId: UUID,
  topic: str,
  questionCount: int = 5,
  questionTypes: ["MCQ", "SHORT_ANSWER"],
  difficulty: "EASY" | "MEDIUM" | "HARD"
}
Response 200: {
  id: UUID,
  quiz: QuizSchema,
  generatedAt: datetime
}
Response 422: { message: "INSUFFICIENT_EVIDENCE" }
```

---

## Definition of Done
- [ ] Quiz generated in structured format (not raw text)
- [ ] MCQ options are labelled A/B/C/D
- [ ] Each question has `sourceChunkIds` (non-empty)
- [ ] `correctAnswer` populated
- [ ] `explanation` references source material
- [ ] Insufficient evidence returns 422 instead of hallucinated quiz
- [ ] Max 20 questions per request enforced
- [ ] Quiz saved to history
- [ ] CI passes
