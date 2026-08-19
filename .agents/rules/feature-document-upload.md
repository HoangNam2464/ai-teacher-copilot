---
description: >-
  Rules for implementing Document Upload in AI Teacher Copilot.
  Handles file upload (PDF, DOCX), MinIO storage, and document metadata
  persistence in Spring Boot. Does NOT handle parsing or embedding.
trigger: model_decision
---

# Feature Rules: Document Upload

## Scope

**Includes:**
- Upload file (PDF, DOCX) via multipart/form-data
- Store file in MinIO bucket
- Save document metadata to PostgreSQL (Spring Boot)
- List documents per workspace
- Delete document (MinIO object + DB record)

**Excludes:**
- Document parsing / chunking (→ feature-document-processing)
- Embedding (→ feature-document-processing)
- Version history (DEFERRED)

---

## Files Involved

### Spring Boot
```
backend/src/main/java/com/aiteachercopilot/
├── document/
│   ├── Document.java               ← JPA entity
│   ├── DocumentController.java     ← upload, list, delete endpoints
│   ├── DocumentService.java        ← MinIO upload + DB save
│   ├── DocumentDto.java            ← UploadResponse, DocumentResponse
│   └── DocumentRepository.java
└── config/
    └── MinioConfig.java            ← MinIO client bean
```

### FastAPI (does NOT handle upload — receives processing requests only)
```
ai-service/app/api/routes/ingestion.py  ← triggered AFTER upload completes
```

---

## Implementation Rules

### Spring Boot
1. File validation BEFORE upload: accept only `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
2. Reject files larger than **50MB** (configurable via `app.upload.max-size`)
3. MinIO object key pattern: `{workspaceId}/{documentId}/{originalFilename}`
4. `Document` entity fields: `id` (UUID), `workspaceId`, `fileName`, `fileType`, `fileSize`, `minioKey`, `status`, `uploadedAt`
5. `status` enum: `UPLOADED` → `PROCESSING` → `READY` | `FAILED`
6. `DocumentService` must verify workspace ownership before upload
7. On delete: remove MinIO object FIRST, then DB record (not reversed)
8. MinIO credentials loaded from env vars (`app.minio.*`) — NEVER hardcoded

### Workflow After Upload
```
POST /api/documents/upload
    → Spring Boot saves to MinIO + DB (status=UPLOADED)
    → Spring Boot calls FastAPI POST /ingestion/process (async, fire-and-forget)
    → FastAPI updates status to PROCESSING → READY|FAILED
```

Spring Boot does NOT wait for FastAPI to finish. Status polling is client responsibility.

---

## API Contract

```
POST /api/documents/upload
Content-Type: multipart/form-data
Body: file (binary), workspaceId (UUID)
Response 201: { id, fileName, fileType, fileSize, status, uploadedAt }
Response 400: { message: "Unsupported file type" }
Response 413: { message: "File too large" }

GET /api/workspaces/{workspaceId}/documents
Response 200: [ { id, fileName, fileType, fileSize, status, uploadedAt }, ... ]

DELETE /api/documents/{id}
Response 204
Response 403: if not owner
```

---

## Definition of Done
- [ ] PDF and DOCX files upload successfully to MinIO
- [ ] Document metadata saved with status=UPLOADED
- [ ] Files > 50MB rejected with 413
- [ ] Unsupported file types rejected with 400
- [ ] Delete removes MinIO object and DB record
- [ ] List returns only documents belonging to caller's workspace
- [ ] CI passes (backend-ci.yml)
