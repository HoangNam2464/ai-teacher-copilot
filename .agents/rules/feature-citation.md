---
description: >-
  Rules for implementing Citation Traceability in AI Teacher Copilot.
  Guarantees grounding provenance from generated learning materials
  back to original source documents, chunks, and page numbers.
trigger: model_decision
---

# Feature Rules: Citation Traceability

## 1. Scope

### Includes
- Capturing `source_chunk_ids` during lesson plan and quiz generation
- Storing citation relations in `content_citations` table
- Resolving chunk IDs to document metadata (file name, page number, content excerpt)
- Frontend citation badges and provenance inspection panel

### Excludes (Deferred / Evaluation Path)
- APA/MLA/Chicago automated bibliography style formatting
- Real-time automated citation grounding scoring (evaluated offline)

---

## 2. Architecture & Responsibility

- **Core Backend (`backend/`)**:
  - Manages `content_citations` database table.
  - Exposes public endpoint for frontend to resolve chunk IDs to document references.
- **AI Service (`ai-service/`)**:
  - Emits chunk IDs alongside structured generation output.
  - Provides internal endpoint to fetch chunk details by IDs from pgvector.

---

## 3. Implementation & Security Constraints

1. **Provenance Integrity**: `source_chunk_ids` must only contain IDs of chunks actually retrieved and provided to the LLM. Synthesizing or fabricating citations is prohibited.
2. **Generation-Time Capture**: Citations must be recorded at generation time; they cannot be reliably reconstructed post-hoc.
3. **Workspace Isolation**: Citation resolution endpoints must verify that all requested chunk IDs belong to the caller's workspace.
4. **Excerpt Sanitization**: Citation excerpts display a safe preview (first 200 characters) of the source chunk to assist teacher verification.

---

## 4. API Contract

```text
GET /api/workspaces/{workspaceId}/citations/resolve?chunkIds=UUID1,UUID2
Response: 200 OK [
  {
    chunkId: UUID,
    documentId: UUID,
    fileName: string,
    sourcePage: number,
    excerpt: string
  }
]
Errors:   403 Forbidden (cross-workspace chunk access)
```

---

## 5. Definition of Done

- [ ] Generated lesson plans and quizzes contain non-empty `source_chunk_ids` when evidence is present.
- [ ] Citation relations saved in `content_citations` table.
- [ ] Resolution endpoint returns document name, page number, and text excerpt.
- [ ] Cross-workspace citation queries return 403 Forbidden.
- [ ] Frontend displays citation badges that open the source reference panel.
- [ ] CI tests pass (`backend-ci.yml`).
