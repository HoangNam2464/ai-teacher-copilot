---
description: >-
  Global project rules for AI Teacher Copilot. Always loaded when working
  in this repository. Enforces architecture, coding standards, Git workflow,
  CI/CD constraints, and engineering principles.
trigger: always_on
---

# AI Teacher Copilot — Global Project Rules

## Project Identity

- **Stack**: Spring Boot 3 (Java 17) + FastAPI (Python 3.12) + React 18 (Vite)
- **Database**: PostgreSQL 16 + pgvector | MinIO (object storage) | Flyway (migrations)
- **AI**: Gemini / OpenAI via provider abstraction
- **Developer model**: Solo developer, 6-month MVP timeline

---

## Repository Structure (Source of Truth)

```
ai-teacher-copilot/
├── backend/                    ← Spring Boot ONLY
│   ├── src/                    ← Java source
│   ├── mvnw                    ← Unix (chmod +x, committed)
│   └── mvnw.cmd                ← Windows only
├── ai-service/                 ← FastAPI (Python) — at ROOT level
│   ├── app/
│   └── tests/
├── frontend/                   ← React + Vite
├── docs/                       ← Documentation
├── infrastructure/             ← Docker, infra configs
├── scripts/                    ← Dev automation scripts
└── .github/workflows/          ← CI/CD
```

**CRITICAL**: AI Service path is `ai-service/` at ROOT, NOT `backend/ai-service/`.

---

## Architecture Boundaries (NEVER cross these)

| Boundary | Spring Boot owns | FastAPI owns |
|---|---|---|
| Business Logic | ✅ | ❌ |
| Authentication / JWT | ✅ | ❌ |
| User, Workspace, Document metadata | ✅ | ❌ |
| AI/RAG pipeline, LLM calls | ❌ | ✅ |
| Embedding, vector search | ❌ | ✅ |
| Document parsing/chunking | ❌ | ✅ |

---

## Git Workflow Rules

```
feature/*  →  develop  →  (CI pass)  →  PR  →  main
```

1. NEVER commit directly to `main`
2. NEVER commit directly to `develop` (use feature/* branches)
3. Branch naming: `feature/<name>`, `fix/<name>`, `docs/<name>`
4. All PRs must have CI passing before merge
5. Commit message format: `type(scope): description`
   - Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

---

## CI/CD Rules

| Workflow | Trigger | Working Directory |
|---|---|---|
| `backend-ci.yml` | push/PR feature/**, fix/**, develop (backend/** paths) | `backend/` |
| `ai-service-ci.yml` | push/PR feature/**, fix/**, develop (backend/ai-service/** paths) | `backend/ai-service/` |
| `frontend-ci.yml` | push/PR feature/**, fix/**, develop (frontend/** paths) | `frontend/` |
| `ci.yml` | push/PR → `main` ONLY | All three |

- Spring Boot tests use H2 in-memory (profile=test) — NO PostgreSQL service needed
- FastAPI tests require `pgvector/pgvector:pg16` service container (init_db in lifespan)

---

## Coding Standards

### Java / Spring Boot
- Package by feature, NOT by layer: `auth/`, `workspace/`, `document/`, `generation/`
- Use `@ActiveProfiles("test")` in all test classes
- `application-test.yml` is source of truth for test config (H2, Flyway disabled)
- Never expose internal service URLs or secrets via API responses

### Python / FastAPI
- Package by domain: `ingestion/`, `retrieval/`, `generation/`, `evaluation/`, `providers/`
- Use provider abstraction (`providers/base.py`) — never hardcode OpenAI/Gemini logic in routes
- Pydantic models for ALL request/response schemas
- Structured output (schema) for ALL AI-generated content

### React / Frontend
- Axios client centralized in `src/api/client.js`
- State management via Zustand
- React Query for server state
- Never store secrets in frontend env vars

---

## Security Rules (NON-NEGOTIABLE)

1. `.env` files NEVER committed (`.gitignore` enforced)
2. Only `.env.example` committed
3. Uploaded documents treated as UNTRUSTED DATA — never as system instructions
4. Workspace isolation: users can only access their own workspace data
5. JWT validation on every protected endpoint

---

## Scope Rules

Before implementing anything, classify it:
- `MUST-HAVE` → implement now
- `SHOULD-HAVE` → plan but not block MVP
- `DEFERRED` → explicitly note, do not implement
- `OUT OF SCOPE` → do not implement, do not propose

Current MVP must-haves: Auth, Workspace, Document Upload, Document Processing,
Knowledge Base, RAG Retrieval, Lesson Planner, Quiz Generator, Review/Edit, Citation, Export

---

## Engineering Principles

1. **Evidence-driven**: Only add technology/complexity when there is evidence it's needed
2. **Vertical slice first**: Complete one full flow before moving to the next feature
3. **Baseline before optimization**: Establish working baseline, then measure, then optimize
4. **Documentation drift is technical debt**: Keep docs in sync with actual code
5. **Audit before fix**: symptom → root cause → impact → solution
6. **Evaluation-driven RAG**: Never choose retrieval strategy based on popularity alone
