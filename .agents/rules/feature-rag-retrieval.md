---
description: >-
  Rules for implementing RAG Retrieval in AI Teacher Copilot.
  Baseline retrieval: metadata filter + cosine similarity vector search via pgvector.
  Runs in FastAPI. No Hybrid Retrieval or Reranker at MVP.
trigger: model_decision
---

# Feature Rules: RAG Retrieval

## Scope

**Includes (CURRENT — Baseline):**
- Query embedding via AI provider
- Metadata filter: `workspace_id`, `document_ids` (from KB)
- Cosine similarity search via pgvector (`<=>` operator)
- Return top-K chunks with metadata

**Excludes:**
- Hybrid Retrieval / BM25 (EVALUATE — only if baseline proves insufficient)
- Reranking / Cross-encoder (EVALUATE)
- Query expansion (DEFERRED)
- Multi-step retrieval (DEFERRED)

---

## Files Involved

### FastAPI
```
ai-service/app/
├── api/routes/retrieval.py         ← POST /retrieval/search
└── retrieval/
    └── service.py                  ← embed query + pgvector search
```

---

## Implementation Rules

### Retrieval Pipeline
```
1. Receive query text + knowledgeBaseId + top_k
2. Embed query using same provider as ingestion (settings.AI_PROVIDER)
3. Build pgvector query:
   SELECT * FROM document_chunks
   WHERE workspace_id = :workspace_id
     AND document_id = ANY(:document_ids)
   ORDER BY embedding <=> :query_embedding
   LIMIT :top_k
4. Return chunks with: id, content, source_page, document_id, chunk_index, subject, grade_level, topic
```

### Rules
1. Query embedding MUST use the same provider/model as ingestion embedding (dimension must match: 768)
2. `top_k` default: **5**, max: **10** — do NOT allow unbounded retrieval
3. NEVER return chunks from a different workspace — `workspace_id` filter is MANDATORY
4. `document_ids` filter comes from KB document list — do NOT allow caller to pass arbitrary document IDs
5. If no chunks found: return empty list `[]` — do NOT call LLM (insufficient evidence path)
6. Minimum relevance: if top chunk score > threshold (TBD after baseline eval) → consider insufficient
7. Log retrieval metrics: `query_length`, `num_results`, `top_score` — for future evaluation

### Insufficient Evidence Handling
```python
if len(chunks) == 0:
    return RetrievalResult(chunks=[], insufficient_evidence=True)
```
Generation layer MUST check `insufficient_evidence` before calling LLM.

---

## API Contract (FastAPI internal)

```
POST /retrieval/search
Body: {
  query: str,
  knowledgeBaseId: UUID,
  workspaceId: UUID,
  documentIds: [UUID],   ← populated by Spring Boot from KB
  topK: int = 5
}
Response 200: {
  chunks: [
    {
      id: str,
      content: str,
      documentId: UUID,
      sourcePage: int,
      chunkIndex: int,
      subject: str,
      gradeLevel: str,
      topic: str
    }
  ],
  insufficientEvidence: bool
}
```

---

## Definition of Done
- [ ] Retrieval returns top-K chunks filtered by workspace + document_ids
- [ ] Empty result returns `insufficientEvidence: true` instead of calling LLM
- [ ] `top_k` capped at 10
- [ ] Retrieval uses same embedding provider/dimension as ingestion
- [ ] Workspace isolation: no cross-workspace chunks returned
- [ ] Retrieval metrics logged for future evaluation
- [ ] CI passes (ai-service-ci.yml)
