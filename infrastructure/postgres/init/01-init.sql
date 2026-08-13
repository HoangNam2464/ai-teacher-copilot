-- =============================================
-- AI Teacher Copilot — PostgreSQL Initialization
-- =============================================
-- This script runs once when the Postgres container
-- is first created. It enables pgvector and creates
-- the application database schema baseline.
-- Flyway (in Spring Boot) manages all subsequent
-- schema migrations.
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
