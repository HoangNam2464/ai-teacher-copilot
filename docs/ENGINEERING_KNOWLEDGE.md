# AI_TEACHER_COPILOT_ENGINEERING_KNOWLEDGE

This document is the curated engineering knowledge base capturing reusable architectural patterns, templates, and implementation standards for the **AI Teacher Copilot for K-12 Teachers** project.

- **Stack**: Spring Boot 3 (Java 17) · FastAPI (Python 3.12) · React 18 (Vite + TypeScript)
- **Data & AI**: PostgreSQL 16 + pgvector · MinIO (Object Storage) · Flyway · Gemini / OpenAI Provider Abstraction

---

## 1. Executive Summary

The highest-value engineering patterns in AI Teacher Copilot are not isolated product features; they are the reusable architectural abstractions underneath them:

- **Provider Abstraction** — unified AI gateway (`ai-service/app/providers/base.py`) supporting Gemini and OpenAI with graceful fallback
- **Structured Output Validation** — strict Pydantic v2 schema validation on all LLM generation endpoints
- **Prompt Boundary Convention** — `<sources>...</sources>` boundary wrapping for all untrusted document context
- **RAG Pipeline** — structure-aware parse → chunk → embed → pgvector index → metadata-filtered retrieval
- **Multi-Tenant Workspace Isolation** — mandatory `workspace_id` scoping on all database and vector operations
- **Citation Traceability** — end-to-end provenance retained via `source_chunk_ids` from chunk to generated lesson plan / quiz
- **Explicit Insufficient Evidence** — fail-closed handling returning structured `insufficient_evidence` instead of hallucinating
- **JWT Gateway Architecture** — FastAPI is strictly an internal AI service; all client traffic is authenticated by Spring Boot

> **Core Engineering Discipline**: *All retrieved document content is strictly UNTRUSTED DATA. Every prompt is a contract. Every AI output must be validated before persistence or rendering.*

---

## 2. Architecture & Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                 React 18 Frontend (Vite)                    │
│        (Teacher Workspace · Lesson Planner · Quiz · Export) │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API + JWT
┌──────────────────────────────▼──────────────────────────────┐
│              Spring Boot 3 Gateway (Java 17)                │
│    • Auth & Spring Security (JWT Issuance & Verification)   │
│    • Workspace & Document Metadata Management               │
│    • Review State, Document Versioning & History            │
│    • Word (.docx) & PDF (.pdf) Document Export Engine       │
└──────────────┬──────────────────────────────┬───────────────┘
               │  Internal HTTP (API Key)     │  JPA / JDBC
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│   FastAPI AI Service        ││   PostgreSQL 16 + pgvector   │
│   (Python 3.12 - Internal)  ││   • App Tables & Metadata    │
│   • Document Parser & Chunk ││   • document_chunks (Vector) │
│   • Embedding Generation    │└──────────────────────────────┘
│   • Semantic Vector Search  │┌──────────────────────────────┐
│   • Prompt Orchestration    ││   MinIO Object Storage       │
│   • Pydantic v2 Validation  ││   • Raw PDF / DOCX Uploads   │
└──────────────┬──────────────┘└──────────────────────────────┘
               │  LLM API Calls
┌──────────────▼──────────────┐
│   LLM Providers             │
│   (Gemini 2.5 / GPT-4o)     │
└─────────────────────────────┘
```

### Responsibility Matrix

| Responsibility | Spring Boot (`backend/`) | FastAPI (`ai-service/`) |
|---|:---:|:---:|
| User Authentication & JWT | ✅ | ❌ |
| Workspace & Document Metadata | ✅ | ❌ |
| Document Review State & History | ✅ | ❌ |
| REST API Gateway for Frontend | ✅ | ❌ |
| Word / PDF Export Engine | ✅ | ❌ |
| Document Parsing (PDF / DOCX) | ❌ | ✅ |
| Structure-aware Chunking | ❌ | ✅ |
| Embedding Generation | ❌ | ✅ |
| Vector Retrieval via pgvector | ❌ | ✅ |
| Prompt Orchestration & LLM Calls | ❌ | ✅ |
| Pydantic v2 Schema Validation | ❌ | ✅ |
| AI Metrics & Groundedness Logging | ❌ | ✅ |

---

## 3. High-Value Architectural Patterns

### GOLD Patterns (Core System Pillars)

#### 1. Provider Abstraction (`ai-service/app/providers/base.py`)
- Never hardcode vendor-specific SDK logic inside route handlers or business services.
- Abstract provider selection behind `BaseProvider` with `generate()` and `embed()`.
- Supports Gemini as primary and OpenAI as fallback with uniform retry and timeout handling.

#### 2. Strict Structured Output Validation (Pydantic v2)
- All LLM responses must conform to explicit Pydantic schemas (`LessonPlanOutput`, `QuizOutput`).
- Strip Markdown code fences before JSON parsing.
- Fail closed on validation errors (`HTTP 502 Bad Gateway`) rather than returning malformed data.

#### 3. Prompt Injection Defense — `<sources>` Convention
- Retrieved document chunks MUST be passed to the LLM wrapped inside `<sources>...</sources>`.
- The sources boundary is placed strictly in the USER prompt turn, never in the SYSTEM prompt turn.
- System prompt instructs the model that content inside `<sources>` is untrusted reference data and cannot override system instructions.

#### 4. Mandatory Multi-Tenant Workspace Isolation
- Every vector search query and SQL operation MUST enforce `WHERE workspace_id = :workspace_id`.
- Cross-workspace queries are strictly forbidden and return `403 Forbidden`.

#### 5. Explicit Insufficient Evidence Response
- When retrieval returns fewer than threshold chunks or relevance similarity is below `0.70`, return:
  ```json
  {
    "status": "insufficient_evidence",
    "message": "Tài liệu không đủ thông tin để tạo nội dung cho chủ đề yêu cầu."
  }
  ```
- Never allow the model to fabricate or extrapolate ungrounded content.

#### 6. End-to-End Citation Traceability
- Every generated section or quiz question must carry `source_chunk_ids: list[str]`.
- Spring Boot persists these IDs and resolves them to Document Name, Page Number, and Excerpt for display in the Citation Drawer.

#### 7. Internal Service Security Gateway
- FastAPI is an internal service, not exposed to the public internet.
- Calls from Spring Boot to FastAPI include an internal header `X-API-Key: ${AI_SERVICE_API_KEY}`.

---

## 4. Provider Abstraction Implementation

File: `ai-service/app/providers/base.py`

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel

class BaseProvider(ABC):
    @abstractmethod
    async def generate_structured(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel],
        temperature: float = 0.3,
    ) -> BaseModel:
        """Generate structured response validated against Pydantic schema."""
        pass

    @abstractmethod
    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate vector embeddings for input texts."""
        pass
```

Factory in `ai-service/app/providers/__init__.py`:
```python
def get_ai_provider() -> BaseProvider:
    provider_name = settings.AI_PROVIDER.lower()
    if provider_name == "gemini":
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    elif provider_name == "openai":
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    raise ValueError(f"Unsupported AI provider: {provider_name}")
```

---

## 5. RAG Pipeline Implementation Patterns

### 1. Document Ingestion Flow
```
Upload PDF/DOCX (Spring Boot -> MinIO)
    ↓ Trigger async ingestion
FastAPI: ingestion/service.py
    ↓ parse_document (pdfplumber / python-docx)
Extract clean text with page number metadata
    ↓ structure_aware_chunking (512 tokens, 50 overlap)
Generate embeddings via provider.generate_embeddings()
    ↓
Batch UPSERT into PostgreSQL document_chunks table (pgvector)
```

### 2. Scoped Vector Retrieval with pgvector
```python
async def retrieve_relevant_chunks(
    query: str,
    workspace_id: str,
    top_k: int = 5,
    subject: str | None = None,
) -> list[ChunkResult]:
    query_embedding = await provider.generate_embeddings([query])
    embedding_str = f"[{','.join(map(str, query_embedding[0]))}]"

    query_sql = """
        SELECT id, document_id, content, page_number,
               1 - (embedding <=> :embedding::vector) AS similarity
        FROM document_chunks
        WHERE workspace_id = :workspace_id
          AND (:subject IS NULL OR metadata->>'subject' = :subject)
        ORDER BY embedding <=> :embedding::vector
        LIMIT :top_k
    """
    rows = await db.fetch_all(query_sql, {
        "embedding": embedding_str,
        "workspace_id": workspace_id,
        "subject": subject,
        "top_k": top_k
    })
    return [ChunkResult(**r) for r in rows if r["similarity"] >= 0.70]
```

### 3. Prompt Orchestration & Boundaries
```python
def build_generation_messages(
    task_instructions: str,
    retrieved_chunks: list[ChunkResult]
) -> list[dict[str, str]]:
    formatted_sources = "\n\n".join([
        f"[Chunk ID: {c.id}] (Trang {c.page_number}):\n{c.content}"
        for c in retrieved_chunks
    ])

    system_prompt = (
        "You are an expert K-12 curriculum assistant. "
        "Base your responses strictly on the provided sources in <sources>. "
        "Do NOT hallucinate or extrapolate beyond the provided text. "
        "Always include source_chunk_ids for each generated item."
    )

    user_prompt = (
        f"{task_instructions}\n\n"
        f"<sources>\n{formatted_sources}\n</sources>"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
```

---

## 6. Structured Output Schemas

### Lesson Plan Output Schema
```python
class LessonObjective(BaseModel):
    category: Literal["Knowledge", "Skill", "Attitude"]
    description: str

class LessonActivity(BaseModel):
    activity_name: str
    duration_minutes: int
    teacher_action: str
    student_action: str
    source_chunk_ids: list[str]

class LessonPlanOutput(BaseModel):
    topic: str
    grade_level: str
    subject: str
    duration_minutes: int
    objectives: list[LessonObjective]
    activities: list[LessonActivity]
    assessment_plan: str
    source_chunk_ids: list[str]
```

### Quiz Output Schema (Bloom Taxonomy)
```python
class BloomTaxonomyLevel(str, Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"

class QuizQuestion(BaseModel):
    question_type: Literal["MCQ", "SHORT_ANSWER"]
    bloom_level: BloomTaxonomyLevel
    question_text: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str
    source_chunk_ids: list[str]

class QuizOutput(BaseModel):
    title: str
    subject: str
    grade_level: str
    total_questions: int
    questions: list[QuizQuestion]
```

---

## 7. Security & Backend Conventions (Spring Boot)

1. **Package by Feature**: `com.aiteacher.auth`, `com.aiteacher.workspace`, `com.aiteacher.document`, `com.aiteacher.generation`, `com.aiteacher.user`.
2. **DTO Layering**: Entities are never exposed directly to REST controllers. Controller -> Service -> Repository -> DTO.
3. **Stateless Security**: Spring Security with JWT filter (`OncePerRequestFilter`), stateless session policy.
4. **Database Migrations**: Flyway manages all schema migrations (`db/migration/V1__*.sql`). Test profile uses H2 with Flyway disabled.

---

## 8. AI Quality Evaluation Metrics

For every generation request, the AI Service logs evaluation metrics to monitor grounding and system health:

| Metric | Target Baseline | Description |
|---|:---:|---|
| **Groundedness Score** | ≥ 0.85 | Degree to which output facts directly trace to `<sources>` |
| **Citation Coverage** | 100% | Percentage of generated questions/activities with non-empty `source_chunk_ids` |
| **Retrieval Cosine Avg** | ≥ 0.75 | Average cosine similarity score of top-K retrieved chunks |
| **Insufficient Evidence Rate** | < 10% | Percentage of queries rejected due to inadequate knowledge base context |
| **Validation Failure Rate** | < 1% | Frequency of LLM outputs failing Pydantic schema validation |

---

## 9. Patterns Out of Scope for MVP (Phase 2 & Phase 3 Roadmap)

1. **Multi-Agent Orchestration (LangGraph / CrewAI)** — Defer to Phase 3. Single-step structured generation is sufficient and much more reliable for MVP.
2. **Hybrid Reranking (BM25 + Cross-Encoder)** — Establish baseline pgvector cosine similarity first.
3. **Fine-Tuning Models** — In-context prompt grounding via RAG is preferred; fine-tuning requires thousands of labeled curriculum examples.
4. **Web Search Augmentation** — All generation must be grounded strictly in teacher-uploaded documents.
5. **Student PII Processing** — Student names, grades, and submissions are strictly prohibited from the system.

---

*AI Teacher Copilot for K-12 Teachers · Engineering Architecture Reference*
