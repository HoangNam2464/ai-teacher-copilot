---
description: >-
  Rules for implementing Document Processing in AI Teacher Copilot.
  Handles PDF/DOCX parsing, structure-aware chunking, embedding generation,
  and vector persistence in pgvector within FastAPI (ai-service/).
trigger: model_decision
---

# Feature Rules: Document Processing

## 1. Scope

### Includes
- Downloading uploaded files from MinIO via object key
- Parsing PDF (`pypdf`) and DOCX (`python-docx`) into structured text blocks
- Structure-aware chunking preserving document hierarchy (headings, sections, paragraphs)
- Embedding generation using configured provider abstraction (Gemini / OpenAI)
- Bulk vector insertion into `document_chunks` table with pgvector indexing
- Updating document status (`PROCESSING` → `READY` | `FAILED`) and chunk count

### Excludes (Deferred / Out of Scope)
- OCR for scanned image PDFs
- Complex image extraction and diagram processing

---

## 2. Architecture & Responsibility

- **Owner Service**: FastAPI AI Service (`ai-service/`)
- **Package**: `app.ingestion`, `app.providers`, `app.core`
- **Internal Execution**: Triggered via `POST /ingestion/process` using `BackgroundTasks` for asynchronous, non-blocking execution.

---

## 3. Implementation & Security Constraints

1. **Untrusted Input**: Document text extracted during parsing is untrusted. Parsing must not execute embedded macros or scripts.
2. **Provenance Metadata**: Every chunk must carry metadata for citation tracking: `workspace_id`, `document_id`, `chunk_index`, `source_page`, `subject`, `grade_level`, `topic`.
3. **Chunking Rules**:
   - Structure-aware: Bind headings to their subordinate paragraphs where possible.
   - Size limit: Max **512 tokens** per chunk with **50-token overlap** (using `tiktoken`).
4. **Provider Abstraction**: Embedding calls must use `providers/base.py` abstraction. Direct vendor SDK calls in business services are prohibited.
5. **Vector Specification**: Dimension must match `vector(768)` defined in PostgreSQL schema.
6. **Idempotency**: Re-processing a document must delete any existing chunks for that `document_id` before inserting new vectors.
7. **Failure Isolation**: An embedding or parsing error for a single chunk must log details and set document status to `FAILED` without crashing the FastAPI service.

---

## 4. API Contract (Internal FastAPI)

```text
POST /ingestion/process
Request:  { document_id: UUID, workspace_id: UUID, minio_object_key: string }
Response: 202 Accepted { status: "accepted", document_id: UUID }
Note:     Runs asynchronously via FastAPI BackgroundTasks. Updates document status upon completion.
```

---

## 5. Definition of Done

- [ ] PDF and DOCX files parse successfully into structured text with page numbers.
- [ ] Chunks respect 512-token limit with overlap and contain full metadata.
- [ ] Chunks and 768-dimensional embeddings are stored in `document_chunks`.
- [ ] Processing status transitions correctly (`PROCESSING` → `READY` / `FAILED`).
- [ ] Re-indexing deletes obsolete chunks for the document.
- [ ] Automated tests pass in CI (`ai-service-ci.yml` with pgvector).
