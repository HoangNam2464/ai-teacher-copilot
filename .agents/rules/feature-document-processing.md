---
description: >-
  Rules for implementing Document Processing in AI Teacher Copilot.
  Handles PDF/DOCX parsing, structure-aware chunking, embedding generation,
  and pgvector storage. Runs entirely within FastAPI (ai-service/).
trigger: model_decision
---

# Feature Rules: Document Processing

## Scope

**Includes:**
- Download file from MinIO
- Parse PDF/DOCX → structured text + metadata
- Chunk by structure (heading → section → paragraph)
- Generate embeddings via AI provider
- Store chunks + embeddings in pgvector
- Update document status in Spring Boot (via HTTP callback or direct)

**Excludes:**
- OCR for scanned PDFs (DEFERRED)
- Table extraction as structured data (DEFERRED)
- Image extraction (OUT OF SCOPE)

---

## Files Involved

### FastAPI
```
ai-service/app/
├── api/routes/ingestion.py         ← POST /ingestion/process
├── ingestion/
│   ├── service.py                  ← orchestrates parse → chunk → embed → store
│   ├── parser.py                   ← PDF (pypdf) + DOCX (python-docx) → StructuredText
│   └── chunker.py                  ← structure-aware chunking
├── providers/
│   ├── base.py                     ← AbstractEmbeddingProvider
│   ├── gemini_provider.py          ← Gemini embeddings
│   └── openai_provider.py          ← OpenAI embeddings
└── core/
    ├── models.py                   ← DocumentChunk SQLAlchemy model
    └── database.py                 ← async session
```

---

## Implementation Rules

### Parsing
1. Use `pypdf` for PDF, `python-docx` for DOCX — already in `requirements.txt`
2. Parser output: list of `StructuredBlock(type, content, page, heading_level)`
3. Types: `HEADING`, `PARAGRAPH`, `TABLE`, `LIST`
4. Preserve page number in each block for citation traceability

### Chunking
1. Chunk by structure: keep `HEADING` with its following `PARAGRAPH` blocks
2. Max chunk size: **512 tokens** (use `tiktoken` — already in `requirements.txt`)
3. Overlap: **50 tokens** between consecutive chunks
4. Each chunk must carry metadata: `workspace_id`, `document_id`, `chunk_index`, `source_page`, `subject`, `grade_level`, `topic`
5. `topic` auto-extracted from nearest heading — NOT from LLM (too slow at ingestion)

### Embedding
1. Always use provider abstraction (`providers/base.py`) — NEVER call Gemini/OpenAI SDK directly in `ingestion/service.py`
2. Provider selected from `settings.AI_PROVIDER` env var
3. Embedding dimension: **768** (matches `Vector(768)` in `models.py`)
4. If embedding fails for a chunk: log error, mark chunk as failed, continue (do NOT abort entire document)

### Storage
1. Use `async_session` from `core/database.py` — NOT sync session
2. Bulk insert chunks (not one-by-one) for performance
3. On re-processing same document: DELETE existing chunks for that `document_id` first, then re-insert

### Status Update
1. After processing completes: call Spring Boot `PATCH /api/documents/{id}/status`
   - Body: `{ status: "READY", chunkCount: N }`
2. On failure: call same endpoint with `{ status: "FAILED", error: "..." }`
3. If Spring Boot is unreachable: log warning, do NOT crash FastAPI

---

## API Contract (FastAPI internal)

```
POST /ingestion/process
Body: { documentId (UUID), workspaceId (UUID), minioKey (str), subject (str), gradeLevel (str) }
Response 202: { message: "Processing started", documentId }

Note: Processing is async — status checked via Spring Boot GET /api/documents/{id}
```

---

## Definition of Done
- [ ] PDF parsing extracts text with page numbers
- [ ] DOCX parsing extracts text with heading structure
- [ ] Chunks respect max 512 tokens with 50-token overlap
- [ ] Each chunk has full metadata (workspaceId, documentId, sourceId, sourcePage, subject, gradeLevel)
- [ ] Embeddings stored in pgvector via `DocumentChunk.embedding` (Vector 768)
- [ ] Document status updated to READY or FAILED in Spring Boot
- [ ] Re-processing deletes old chunks before inserting new ones
- [ ] CI passes (ai-service-ci.yml with pgvector service container)
