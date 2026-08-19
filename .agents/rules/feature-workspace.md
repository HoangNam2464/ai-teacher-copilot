---
description: >-
  Rules for implementing Teacher Workspace in AI Teacher Copilot.
  Workspace is the core container for organizing teaching materials,
  knowledge bases, and generated content.
trigger: model_decision
---

# Feature Rules: Teacher Workspace

## 1. Scope

### Includes
- Workspace creation (name, description, subject, grade level)
- Listing workspaces belonging to the authenticated teacher
- Retrieving, updating, and deleting workspace metadata
- Enforcing workspace data isolation across all child resources

### Excludes (Deferred / Out of Scope)
- Multi-teacher collaborative workspaces
- Public / shared workspace templates
- Real-time multi-user editing

---

## 2. Architecture & Responsibility

- **Owner Service**: Spring Boot (`backend/`)
- **Package**: `com.aiteachercopilot.workspace`
- **Isolation Scope**: All downstream entities (`documents`, `document_chunks`, `generated_contents`, `content_citations`) are strictly bound to a `workspace_id`.

---

## 3. Implementation & Security Constraints

1. **Ownership Enforcement**: `owner_id` is extracted from the authenticated JWT security context, never accepted from user input.
2. **Access Control**: Every request operating on a workspace or its child resources must verify that the requesting user is the workspace owner via `findAndAuthorize(workspaceId, userId)`. Unauthorized access returns `403 Forbidden`.
3. **Cascading Delete**: Deleting a workspace removes all associated documents (including MinIO files), vector chunks in pgvector, and generation history.
4. **Context Propagation**: The active `workspaceId` is stored on the frontend client and sent as a required parameter on all document and generation requests.

---

## 4. API Contract

```text
POST /api/workspaces
Request:  { name: string, description?: string, subject?: string, gradeLevel?: string }
Response: 201 Created { id: UUID, name: string, subject: string, gradeLevel: string, createdAt: string }

GET /api/workspaces
Response: 200 OK [ { id: UUID, name: string, subject: string, gradeLevel: string, createdAt: string } ]

GET /api/workspaces/{id}
Response: 200 OK { id: UUID, name: string, description: string, subject: string, gradeLevel: string, createdAt: string }
Errors:   403 Forbidden (not owner), 404 Not Found

PUT /api/workspaces/{id}
Request:  { name?: string, description?: string, subject?: string, gradeLevel?: string }
Response: 200 OK { id: UUID, name: string, subject: string, gradeLevel: string }

DELETE /api/workspaces/{id}
Response: 204 No Content
```

---

## 5. Definition of Done

- [ ] Teacher can create, read, update, and delete workspaces.
- [ ] List query returns only workspaces owned by the authenticated teacher.
- [ ] Accessing another teacher's workspace returns 403 Forbidden.
- [ ] Deletion cascades cleanly across database tables.
- [ ] Automated tests pass in CI (`backend-ci.yml`).
