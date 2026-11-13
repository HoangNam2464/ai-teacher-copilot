-- =============================================
-- AI Teacher Copilot — Migration V4
-- Optimize pgvector Query Plans & Composite Retrieval Indexes [BE-034]
-- =============================================

-- 1. Composite index for tenant workspace + document filtering
CREATE INDEX IF NOT EXISTS idx_chunks_workspace_doc
    ON document_chunks(workspace_id, document_id);

-- 2. Composite index for tenant workspace + curriculum metadata filtering
CREATE INDEX IF NOT EXISTS idx_chunks_workspace_curriculum
    ON document_chunks(workspace_id, subject, grade_level);

-- 3. Composite index for document provenance and page traceability
CREATE INDEX IF NOT EXISTS idx_chunks_doc_page
    ON document_chunks(document_id, source_page, chunk_index);

-- 4. Planner statistics tuning for accurate cost estimation on vector table
ALTER TABLE document_chunks ALTER COLUMN workspace_id SET STATISTICS 500;
ALTER TABLE document_chunks ALTER COLUMN document_id SET STATISTICS 500;
