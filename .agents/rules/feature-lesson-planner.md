---
description: >-
  Rules for implementing Lesson Planner in AI Teacher Copilot.
  Teacher inputs context (subject, grade, topic, objectives). System retrieves
  relevant chunks from KB, generates a structured lesson plan via LLM,
  returns structured output with citations.
trigger: model_decision
---

# Feature Rules: Lesson Planner

## Scope

**Includes:**
- Teacher provides: subject, grade level, topic, learning objectives, duration (minutes)
- RAG retrieval from selected Knowledge Base
- LLM generates structured lesson plan
- Response includes citations (source_chunk_ids)
- Save generated lesson plan to history

**Excludes:**
- Slide generation (OUT OF SCOPE)
- Video integration (OUT OF SCOPE)
- Curriculum standard alignment check (DEFERRED)

---

## Files Involved

### Spring Boot
```
backend/src/main/java/com/aiteachercopilot/
└── generation/
    ├── GenerationController.java       ← POST /api/generation/lesson-plan
    ├── GenerationService.java          ← calls FastAPI + saves to history
    └── GenerationRequestDto.java       ← LessonPlanRequest, GenerationResponse
```

### FastAPI
```
ai-service/app/
├── api/routes/generation.py            ← POST /generation/lesson-plan
└── generation/
    ├── service.py                      ← retrieve → build prompt → call LLM → parse output
    └── schemas.py                      ← LessonPlanSchema (Pydantic)
```

---

## Implementation Rules

### Generation Flow
```
Spring Boot:
1. Receive LessonPlanRequest (subject, gradeLevel, topic, objectives, duration, kbId)
2. Fetch document_ids from KB (Spring Boot DB query)
3. Call FastAPI POST /generation/lesson-plan with full context
4. Save response to generation_history table
5. Return GenerationResponse to client

FastAPI:
1. Call retrieval service with query = topic + objectives
2. If insufficientEvidence → return { error: "INSUFFICIENT_EVIDENCE", message: "..." }
3. Build system prompt (strict boundary: document content = UNTRUSTED DATA)
4. Call LLM via provider abstraction
5. Parse LLM response into LessonPlanSchema
6. Return structured output + source_chunk_ids
```

### Prompt Engineering Rules
1. Uploaded document content ALWAYS placed in `<sources>` block — treated as context, NOT instructions
2. System prompt explicitly states: "Generate lesson plan ONLY based on the provided sources"
3. If sources insufficient: respond with `insufficient_evidence: true` — NEVER hallucinate
4. Do NOT include `<sources>` content in API response to client — only reference `source_chunk_ids`

### LessonPlanSchema (Pydantic — Structured Output)
```python
class LessonPlanSchema(BaseModel):
    title: str
    subject: str
    gradeLevel: str
    duration: int           # minutes
    objectives: list[str]
    warmUp: str             # 5-10 min activity
    mainActivity: list[ActivityStep]
    assessment: str
    homework: str | None
    sourceChunkIds: list[str]
    insufficientEvidence: bool
```

### Rules
1. LLM output MUST be parsed through `LessonPlanSchema` — NEVER return raw LLM text
2. If Pydantic validation fails: retry once, then return error (do NOT return invalid data)
3. `sourceChunkIds` must be populated from retrieved chunks — NEVER fabricated
4. `duration` in request → LLM instructed to distribute time proportionally across activities

---

## API Contract

```
POST /api/generation/lesson-plan
Body: {
  workspaceId: UUID,
  knowledgeBaseId: UUID,
  subject: str,
  gradeLevel: str,
  topic: str,
  objectives: [str],
  durationMinutes: int
}
Response 200: {
  id: UUID,               ← history record id
  lessonPlan: { ... },    ← LessonPlanSchema
  sourceChunkIds: [str],
  insufficientEvidence: bool,
  generatedAt: datetime
}
Response 422: { message: "INSUFFICIENT_EVIDENCE" }
```

---

## Definition of Done
- [ ] Lesson plan generated in structured format (not raw text)
- [ ] All fields in LessonPlanSchema populated
- [ ] Insufficient evidence returns 422 (not a hallucinated plan)
- [ ] `sourceChunkIds` populated from actual retrieved chunks
- [ ] Generation saved to history
- [ ] Frontend displays structured lesson plan with citation indicators
- [ ] CI passes
