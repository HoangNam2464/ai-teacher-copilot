---
description: >-
  Rules for implementing Review & Edit/Regenerate in AI Teacher Copilot.
  Teacher reviews AI-generated content (lesson plan or quiz), edits inline,
  or requests regeneration with updated instructions.
trigger: model_decision
---

# Feature Rules: Review & Edit / Regenerate

## Scope

**Includes:**
- Display generated content (lesson plan or quiz) in editable UI
- Teacher edits content inline (free-text edit of any field)
- Teacher requests regeneration with optional additional instructions
- Save edited version to history
- Track version number (original = v1, regenerated = v2, v3, ...)

**Excludes:**
- Real-time collaborative editing (OUT OF SCOPE)
- Diff view between versions (DEFERRED)
- Automatic AI review/scoring of teacher edits (DEFERRED)

---

## Files Involved

### Spring Boot
```
backend/src/main/java/com/aiteachercopilot/generation/
    ├── GenerationController.java
    │   ├── PUT /api/generation/{id}          ← save manual edit
    │   └── POST /api/generation/{id}/regenerate ← regenerate with instructions
    └── GenerationService.java
```

### Database
```
generation_history table:
  id (UUID), workspace_id, type (LESSON_PLAN|QUIZ), content (JSONB),
  version (int), parent_id (UUID nullable), source_chunk_ids (UUID[]),
  instructions (text nullable), created_at
```

### FastAPI
```
ai-service/app/api/routes/generation.py
    └── POST /generation/regenerate     ← regenerate with previous context + new instructions
```

### React Frontend
```
frontend/src/pages/lesson/LessonPlanner.jsx  ← editable fields
frontend/src/pages/quiz/QuizGenerator.jsx    ← editable fields
```

---

## Implementation Rules

### Edit (Manual)
1. Teacher edits content in UI → `PUT /api/generation/{id}` with full updated content JSON
2. Server saves as SAME record (no new version created for manual edits at MVP)
3. Frontend sends entire content object (not diff/patch)
4. No re-retrieval, no LLM call for manual edits

### Regenerate
1. `POST /api/generation/{id}/regenerate` with optional `additionalInstructions: str`
2. Creates a NEW history record with `version = parent.version + 1` and `parent_id = original.id`
3. Spring Boot retrieves original `source_chunk_ids` and re-uses them (no new retrieval) unless teacher explicitly changes KB
4. FastAPI receives: original content + original context + `additionalInstructions`
5. LLM instructed: "Revise the following content based on these instructions: {additionalInstructions}"
6. Response follows same schema as original generation (LessonPlanSchema or QuizSchema)

### Version History Rules
- `version` starts at 1 (original generation)
- Each regeneration creates new record: `version++`, `parent_id = previous.id`
- Endpoint `GET /api/generation/history?workspaceId={id}` returns flat list sorted by `created_at` desc
- Client groups by `parent_id` to show version chains (frontend responsibility)

### UI Rules
1. Each field in LessonPlanSchema/QuizSchema must be individually editable
2. "Regenerate" button opens instruction input modal — instruction is OPTIONAL
3. After regeneration, show new version — do NOT auto-delete previous version
4. "Save" triggers `PUT`, "Regenerate" triggers `POST .../regenerate`

---

## API Contract

```
PUT /api/generation/{id}
Body: { content: { ...full LessonPlanSchema or QuizSchema... } }
Response 200: { id, content, version, updatedAt }

POST /api/generation/{id}/regenerate
Body: { additionalInstructions?: str }
Response 200: {
  id: UUID,           ← new record id
  parentId: UUID,
  version: int,
  content: { ... },
  generatedAt: datetime
}
```

---

## Definition of Done
- [ ] Teacher can edit any field in lesson plan / quiz inline
- [ ] Manual edits saved via PUT without LLM call
- [ ] Regenerate creates new version record with `parent_id`
- [ ] Version number increments correctly
- [ ] Regenerate with instructions produces updated content
- [ ] History list shows previous versions
- [ ] CI passes
