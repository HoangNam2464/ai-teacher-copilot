---
description: >-
  Rules for implementing RAG Retrieval in AI Teacher Copilot.
  Covers query embedding, metadata-filtered vector search via pgvector,
  insufficient evidence handling, and retrieval quality logging.
trigger: model_decision
---

# Feature Rules: RAG Retrieval

## 1. Scope

### Includes (MVP Baseline)
- Embedding query text using the configured provider abstraction
- Metadata-filtered vector search in pgvector (`workspace_id`, `document_id`, `subject`, `grade_level`)
- Cosine distance similarity ordering (`<=>` operator using HNSW index)
- Returning top-k chunks with metadata for citation grounding
- Explicit `insufficient_evidence` detection when context is missing

### Excludes (Evaluation Path / Deferred)
- Hybrid Retrieval / BM25 (Evaluate only if baseline evaluation shows necessity)
- Cross-encoder Reranking (Evaluate only if baseline evaluation shows necessity)
- Multi-step retrieval and query expansion

---

## 2. Architecture & Responsibility

- **Owner Service**: FastAPI AI Service (`ai-service/`)
- **Package**: `app.retrieval`
- **Internal Service**: Called internally by generation routes or Spring Boot.

---

## 3. Implementation & Security Constraints

1. **Workspace Isolation**: The `workspace_id` filter is **mandatory** in all database queries. Vector search must never match chunks across workspace boundaries.
2. **Embedding Consistency**: Query embeddings must use the same provider and dimension (768) as ingestion embeddings.
3. **Retrieval Constraints**:
   - `top_k`: Default is **5**, maximum is **10** (unbounded retrieval prohibited).
   - Filter by document IDs / subject / grade level when provided by the teacher's request context.
4. **Insufficient Evidence Handling**:
   - If 0 chunks match the query, or relevance score falls below threshold, return `insufficient_evidence: true` and empty chunk list.
   - Generation layers must inspect this flag and return an explicit `insufficient_evidence` response rather than proceeding to LLM generation.
5. **Evaluation Logging**: Log query metrics (query length, result count, top similarity score) to support offline retrieval quality evaluation.

---

## 4. API Contract (Internal FastAPI)

```text
POST /retrieval/search
Request:  { query: string, workspace_id: UUID, document_ids?: UUID[], subject?: string, grade_level?: string, top_k?: number }
Response: 200 OK {
  chunks: [
    {
      id: UUID,
      content: string,
      document_id: UUID,
      source_page: number,
      chunk_index: number,
      similarity_score: number
    }
  ],
  insufficient_evidence: boolean
}
```

---

## 5. Definition of Done

- [ ] Query embedding generated with 768 dimensions via provider abstraction.
- [ ] Vector search filtered by workspace and optional document metadata.
- [ ] Returns top-k chunks with source page and document IDs for citation.
- [ ] Empty retrieval correctly sets `insufficient_evidence: true`.
- [ ] No cross-workspace data leakage.
- [ ] CI tests pass (`ai-service-ci.yml`).
