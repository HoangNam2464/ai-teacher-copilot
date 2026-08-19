---
description: >-
  Rules for implementing Review, Edit, Regenerate and Document History in AI Teacher Copilot.
  Supports inline teacher revisions, instruction-based regeneration, versioning,
  and historical record retrieval.
trigger: model_decision
---

# Feature Rules: Review, Edit & Document History

## 1. Scope

### Includes
- Interactive review of generated drafts (Lesson Plans, Quizzes) in the frontend
- Inline manual editing of any field in the structured content
- Saving edited content directly to PostgreSQL (`generated_contents`) without invoking LLM
- Regenerating content with optional refinement instructions (creating a new version record)
- Tracking document history, version lineage (`version`, `parent_id`), and review status (`DRAFT`, `REVIEWED`, `APPROVED`)

### Excludes (Deferred / Out of Scope)
- Real-time multi-teacher collaborative editing
- Visual diffing tool between historical versions

---

## 2. Architecture & Responsibility

- **Core Backend (`backend/`)**:
  - Owns `generated_contents` table lifecycle and version tracking.
  - Handles manual updates (`PUT`), regeneration triggers (`POST`), and history queries (`GET`).
  - Enforces workspace ownership on all history modifications.
- **AI Service (`ai-service/`)**:
  - Handles regeneration requests when refinement instructions require LLM re-prompting.

---

## 3. Implementation & Security Constraints

1. **Teacher Authority**: AI output is strictly a draft. The teacher retains final editorial authority before exporting or finalizing materials.
2. **Manual Edits vs Regeneration**:
   - **Manual Edit**: Updates `content_data` on the current record directly. No LLM or RAG pipeline is executed.
   - **Regeneration**: Creates a **new** record in `generated_contents` with `version = parent.version + 1` and `parent_id = original.id`. Reuses original source chunks unless teacher explicitly requests new retrieval.
3. **Review Status Lifecycle**: `DRAFT` → `REVIEWED` → `APPROVED`.
4. **History Isolation**: History queries must strictly filter by `workspace_id` and authenticate the requesting user.

---

## 4. API Contract

```text
GET /api/workspaces/{workspaceId}/generation/history
Response: 200 OK [
  {
    id: UUID,
    contentType: "LESSON_PLAN" | "QUIZ",
    title: string,
    version: number,
    parentId: UUID | null,
    reviewStatus: string,
    createdAt: string
  }
]

GET /api/workspaces/{workspaceId}/generation/{id}
Response: 200 OK {
  id: UUID,
  contentType: string,
  title: string,
  contentData: object,
  version: number,
  parentId: UUID | null,
  reviewStatus: string,
  createdAt: string
}

PUT /api/workspaces/{workspaceId}/generation/{id}
Request:  { contentData: object, reviewStatus?: string }
Response: 200 OK { id: UUID, contentData: object, reviewStatus: string, updatedAt: string }

POST /api/workspaces/{workspaceId}/generation/{id}/regenerate
Request:  { instructions?: string }
Response: 201 Created { id: UUID, parentId: UUID, version: number, contentData: object, createdAt: string }
```

---

## 5. Definition of Done

- [ ] Teacher can view, edit, and save structured drafts inline.
- [ ] Manual edits save immediately without invoking LLM endpoints.
- [ ] Regeneration creates a new versioned entry linked via `parent_id`.
- [ ] History list displays version lineage within the workspace.
- [ ] Cross-workspace history access returns 403 Forbidden.
- [ ] CI tests pass (`backend-ci.yml`).
