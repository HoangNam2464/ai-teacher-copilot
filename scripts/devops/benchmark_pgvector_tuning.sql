-- ==============================================================================
-- AI Teacher Copilot — pgvector Tuning Benchmark SQL Script [OPS-006]
-- ==============================================================================
-- Purpose: Validates active configuration parameters and benchmarks vector
-- cosine similarity search execution plan and latency on document_chunks.
-- ==============================================================================

-- 1. Configuration Verification
SELECT name, setting, unit, context, source 
FROM pg_settings 
WHERE name IN (
    'shared_buffers',
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size',
    'max_worker_processes',
    'max_parallel_workers',
    'max_parallel_workers_per_gather',
    'max_parallel_maintenance_workers',
    'random_page_cost',
    'effective_io_concurrency',
    'checkpoint_completion_target',
    'hnsw.ef_search'
)
ORDER BY name;

-- 2. Buffer & Memory Status Check
SELECT 
    pg_size_pretty(pg_relation_size('document_chunks')) AS chunks_table_size,
    pg_size_pretty(pg_relation_size('idx_chunks_embedding')) AS hnsw_index_size;

-- 3. Execution Plan & Buffer Analysis for Vector Cosine Distance (<=>)
-- Evaluates whether the planner chooses HNSW index scan or parallel gather
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, TIMING)
SELECT 
    id,
    document_id,
    source_page,
    chunk_index,
    1 - (embedding <=> (SELECT embedding FROM document_chunks LIMIT 1)) AS similarity_score
FROM document_chunks
WHERE workspace_id IS NOT NULL
ORDER BY embedding <=> (SELECT embedding FROM document_chunks LIMIT 1)
LIMIT 5;

-- 4. Temporary Disk File Usage Verification (Must be 0 bytes in tuned state)
SELECT 
    temp_files AS temp_files_count,
    pg_size_pretty(temp_bytes) AS temp_disk_bytes_spilled
FROM pg_stat_database 
WHERE datname = current_database();
