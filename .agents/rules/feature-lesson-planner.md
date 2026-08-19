---
description: >-
  Rules for implementing AI Lesson Planner in AI Teacher Copilot.
  Generates curriculum-grounded structured lesson plans with citation
  traceability and strict prompt security boundaries.
trigger: model_decision
---

# Feature Rules: AI Lesson Planner

## 1. Scope

### Includes
- Teacher inputs: subject, grade level, topic, learning objectives, duration (minutes), custom instructions
- Grounding via RAG retrieval from workspace instructional documents
- Structured output generation via LLM using strict Pydantic schemas
- Citation binding (`source_chunk_ids`) linked to retrieved source chunks
- Persisting generated draft to `generated_contents` in PostgreSQL

### Excludes (Deferred / Out of Scope)
- Slide generation
- Automatic curriculum standard alignment verification
- Direct distribution to student learning management systems

---

## 2. Architecture & Responsibility

- **Core Backend (`backend/`)**:
  - Validates teacher input and workspace authorization.
  - Invokes internal FastAPI generation endpoint with context.
  - Persists result, metadata, and citations in `generated_contents`.
- **AI Service (`ai-service/`)**:
  - Performs RAG retrieval.
  - Formulates prompt with untrusted data isolation (`<sources>` block).
  - Calls LLM via provider abstraction (`providers/base.py`).
  - Validates and returns structured `LessonPlanSchema`.

---

## 3. Implementation & Security Constraints

1. **Untrusted Data Boundary**: All retrieved document context MUST be passed to the generation model inside a dedicated `<sources>...</sources>` boundary and treated strictly as untrusted reference data. Document content must not override system behavior or reveal system prompts.
2. **Anti-Hallucination & Insufficient Evidence**:
   - System prompt mandates generation strictly from provided sources.
   - If retrieval returns 0 chunks or insufficient context, return `insufficient_evidence: true` rather than generating an ungrounded lesson plan.
3. **Structured Data Contract**: Output must conform to `LessonPlanSchema`:
   ```python
   class LessonSection(BaseModel):
       title: str
       duration_minutes: int
       content: str

   class LessonPlanSchema(BaseModel):
       title: str
       subject: str
       grade_level: str
       duration_minutes: int
       objectives: list[str]
       sections: list[LessonSection]
       materials_needed: list[str]
       source_chunk_ids: list[str]
       insufficient_evidence: bool = False
   ```
4. **Citation Binding**: `source_chunk_ids` in the schema must be populated with the IDs of chunks actually used during generation.
5. **Draft Paradigm**: Generated output is a draft for teacher review and editing, not a finalized production artifact.

---

## 4. API Contract

```text
POST /api/workspaces/{workspaceId}/generation/lesson-plan
Request: {
  subject: string,
  gradeLevel: string,
  topic: string,
  objectives?: string[],
  durationMinutes?: number,
  instructions?: string,
  documentIds?: UUID[]
}
Response: 200 OK {
  id: UUID,
  contentType: "LESSON_PLAN",
  title: string,
  contentData: { ...LessonPlanSchema... },
  reviewStatus: "DRAFT",
  version: 1,
  createdAt: string
}
Errors: 422 Unprocessable Entity (insufficient evidence), 403 Forbidden
```

---

## 5. Definition of Done

- [ ] Lesson plan generated conforming to `LessonPlanSchema`.
- [ ] Document content safely delimited in prompt without prompt injection risks.
- [ ] `source_chunk_ids` populated and saved to database.
- [ ] Insufficient evidence triggers explicit `insufficient_evidence` response.
- [ ] Generated record saved in `generated_contents` table with `DRAFT` status.
- [ ] CI tests pass (`backend-ci.yml`, `ai-service-ci.yml`).
