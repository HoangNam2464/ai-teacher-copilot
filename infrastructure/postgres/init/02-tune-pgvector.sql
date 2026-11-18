-- ==============================================================================
-- AI Teacher Copilot — Database Configuration & pgvector Tuning [OPS-006]
-- ==============================================================================
-- This script applies optimal memory and worker configurations via ALTER SYSTEM.
-- Settings persist into postgresql.auto.conf and guarantee optimal retrieval
-- performance even if PostgreSQL is executed without explicit config_file flag.
-- ==============================================================================

-- 1. Memory Optimization for pgvector
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET effective_cache_size = '768MB';

-- 2. Worker Parallelization for Vector Cosine Computations
ALTER SYSTEM SET max_worker_processes = '8';
ALTER SYSTEM SET max_parallel_workers = '4';
ALTER SYSTEM SET max_parallel_workers_per_gather = '2';
ALTER SYSTEM SET max_parallel_maintenance_workers = '2';

-- 3. Query Planner Cost Heuristics (SSD Optimized)
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';

-- 4. Connection Safety & Stability Caps
ALTER SYSTEM SET max_connections = '100';

-- 5. pgvector Runtime Tuning
-- Reload configuration to apply parameters that do not require server restart
SELECT pg_reload_conf();
