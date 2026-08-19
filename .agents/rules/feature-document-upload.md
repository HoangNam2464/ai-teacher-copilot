---
description: >-
  Rules for implementing Document Upload in AI Teacher Copilot.
  Handles file upload (PDF, DOCX), MinIO storage, document metadata
  persistence in Spring Boot, and triggering async AI ingestion.
trigger: model_decision
---

# Feature Rules: Document Upload

## 1. Scope

### Includes
- Uploading instructional materials (PDF, DOCX, TXT) via multipart/form-data
- Storing raw files in MinIO object storage (`documents` bucket)
- Persisting document metadata and processing status in PostgreSQL
- Asynchronously dispatching processing requests to FastAPI AI Service
- Listing and deleting documents within a workspace

### Excludes (Handled by Document Processing)
- Document parsing, text extraction, chunking, and embedding generation
- OCR for scanned images / image extraction (Deferred / Out of Scope)

---

## 2. Architecture & Responsibility

- **Owner Service**: Spring Boot (`backend/`)
- **Package**: `com.aiteachercopilot.document`
- **Object Storage**: MinIO (`documents` bucket)
- **Handoff**: Dispatches async non-blocking HTTP request to FastAPI (`POST /ingestion/process`) upon successful upload and metadata persistence.

---

## 3. Implementation & Security Constraints

1. **Untrusted Data**: Uploaded files are strictly treated as **untrusted data**. File names must be sanitized (`sanitizeFileName()`) to prevent path traversal attacks.
2. **File Validation**: Allowed content types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`. Maximum file size: 50MB (`app.upload.max-size`).
3. **Storage Path**: MinIO object keys follow the pattern: `{workspaceId}/{userId}/{documentId}_{filename}`.
4. **Processing Status Lifecycle**: `PENDING` → `PROCESSING` → `READY` | `FAILED`.
5. **Ownership Check**: Upload and delete operations must verify workspace ownership before accessing storage or database.
6. **Deletion Ordering**: On document deletion, remove the MinIO object first, then delete database records (cascading to chunks).

---

## 4. API Contract

```text
POST /api/workspaces/{workspaceId}/documents/upload
Content-Type: multipart/form-data
Form Fields:  file (binary), subject (string), gradeLevel (string), topic (string)
Response:     201 Created { id: UUID, fileName: string, fileType: string, fileSize: number, processingStatus: string, uploadedAt: string }
Errors:       400 Bad Request (invalid type/empty), 413 Payload Too Large (>50MB), 403 Forbidden

GET /api/workspaces/{workspaceId}/documents
Response:     200 OK [ { id: UUID, fileName: string, fileType: string, fileSize: number, processingStatus: string, chunkCount: number, createdAt: string } ]

DELETE /api/workspaces/{workspaceId}/documents/{documentId}
Response:     204 No Content
```

---

## 5. Definition of Done

- [ ] PDF, DOCX, and TXT files under 50MB upload successfully to MinIO.
- [ ] Document record created with `PENDING` status.
- [ ] Unsupported formats and files > 50MB are rejected with clear error messages.
- [ ] FastAPI ingestion endpoint is triggered asynchronously without blocking client upload response.
- [ ] Deletion removes file from MinIO and metadata from PostgreSQL.
- [ ] CI tests pass (`backend-ci.yml`).
