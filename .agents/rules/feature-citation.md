---
description: >-
  Rules for implementing Citation Traceability in AI Teacher Copilot.
  Every AI-generated content item must be traceable back to its source chunks,
  source document, and source page. Citation is a core trust mechanism.
trigger: model_decision
---

# Feature Rules: Citation

## Scope

**Includes:**
- Every generation response includes `sourceChunkIds`
- API endpoint to resolve chunk IDs → citation detail (document name, page, excerpt)
- Frontend citation panel: highlights which chunks were used
- Citation indicator on each generated section/question

**Excludes:**
- APA/MLA formatted citations (DEFERRED — display raw source reference at MVP)
- Inline footnote numbering in export (→ feature-export concern)
- Citation quality scoring / grounding score (EVALUATE)

---

## Core Principle

```
Generated Content
      │
      ▼
sourceChunkIds: ["chunk-abc", "chunk-def", ...]
      │
      ▼
GET /api/citations/resolve?chunkIds=...
      │
      ▼
[
  { chunkId, documentName, sourcePage, excerpt, documentId }
]
```

Citation is provenance, not just display. It MUST be computed at generation time
and stored. It CANNOT be reconstructed after the fact.

---

## Files Involved

### Spring Boot
```
backend/src/main/java/com/aiteachercopilot/
└── citation/                           (NEW package)
    ├── CitationController.java         ← GET /api/citations/resolve
    └── CitationService.java            ← calls FastAPI to resolve chunk metadata
```

### FastAPI
```
ai-service/app/
├── api/routes/retrieval.py             ← GET /retrieval/chunks?ids=...
└── retrieval/service.py                ← fetch chunks by id from pgvector table
```

### Database (pgvector)
```
document_chunks table (already defined in models.py):
  id, document_id, workspace_id, content, chunk_index,
  embedding, source_page, subject, grade_level, topic
```

---

## Implementation Rules

### At Generation Time
1. Every generation MUST save `source_chunk_ids` to `generation_history.source_chunk_ids`
2. `sourceChunkIds` in API response MUST match what was actually retrieved — NEVER fabricated
3. If retrieval returns 0 chunks → `sourceChunkIds = []`, `insufficientEvidence = true`

### Citation Resolution
1. `GET /api/citations/resolve?chunkIds=id1,id2,...`
2. Spring Boot calls FastAPI `GET /retrieval/chunks?ids=id1,id2,...`
3. FastAPI queries pgvector table for those chunk IDs
4. Returns: `chunkId`, `documentId`, `documentName` (joined from Spring Boot doc table), `sourcePage`, `excerpt` (first 200 chars of chunk content)
5. Workspace isolation: NEVER return chunks from a different workspace

### Excerpt Rules
1. Excerpt = first 200 characters of chunk content
2. Excerpt is display-only — do NOT use for re-retrieval
3. Excerpt must NOT expose personally identifiable information (unlikely in curriculum docs, but validate)

### Frontend Citation Panel
1. Each generated section/question shows a citation badge (number of sources)
2. Click badge → expand citation panel showing: document name, page number, excerpt
3. Citation panel is READ-ONLY — no editing from here

---

## API Contract

```
GET /api/citations/resolve?chunkIds=uuid1,uuid2,...&workspaceId=uuid
Response 200: [
  {
    chunkId: str,
    documentId: UUID,
    documentName: str,
    sourcePage: int,
    excerpt: str        ← first 200 chars
  }
]
Response 403: if any chunkId belongs to different workspace
```

---

## Definition of Done
- [ ] Every generation response includes non-empty `sourceChunkIds` (when evidence exists)
- [ ] `sourceChunkIds` stored in `generation_history`
- [ ] Citation resolve endpoint returns document name, page, excerpt per chunk ID
- [ ] Workspace isolation: cross-workspace chunk access returns 403
- [ ] Frontend citation panel shows source details on click
- [ ] CI passes
