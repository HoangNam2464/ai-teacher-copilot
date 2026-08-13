-- =============================================
-- V1 — Initial Schema
-- AI Teacher Copilot
-- =============================================
-- Tables: users, workspaces, documents,
--         document_chunks, generated_contents,
--         content_citations
-- =============================================

-- ==================
-- USERS
-- ==================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'TEACHER',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ==================
-- WORKSPACES
-- ==================
CREATE TABLE workspaces (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    subject         VARCHAR(100),
    grade_level     VARCHAR(50),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- ==================
-- DOCUMENTS
-- ==================
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    uploaded_by     UUID         NOT NULL REFERENCES users(id),
    file_name       VARCHAR(500) NOT NULL,
    file_type       VARCHAR(50)  NOT NULL,
    file_size       BIGINT       NOT NULL,
    minio_object_key VARCHAR(1000) NOT NULL,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    subject         VARCHAR(100),
    grade_level     VARCHAR(50),
    topic           VARCHAR(255),
    chunk_count     INTEGER      DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_status ON documents(processing_status);

-- ==================
-- DOCUMENT CHUNKS (with pgvector)
-- ==================
CREATE TABLE document_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    chunk_index     INTEGER      NOT NULL,
    content         TEXT         NOT NULL,
    token_count     INTEGER,
    embedding       vector(1536),
    -- Metadata for filtering and traceability
    subject         VARCHAR(100),
    grade_level     VARCHAR(50),
    topic           VARCHAR(255),
    source_page     INTEGER,
    source_location TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_workspace ON document_chunks(workspace_id);
CREATE INDEX idx_chunks_subject ON document_chunks(subject);
CREATE INDEX idx_chunks_grade ON document_chunks(grade_level);

-- HNSW index for vector similarity search
CREATE INDEX idx_chunks_embedding ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ==================
-- GENERATED CONTENTS
-- ==================
CREATE TABLE generated_contents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id    UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by      UUID         NOT NULL REFERENCES users(id),
    content_type    VARCHAR(50)  NOT NULL,
    title           VARCHAR(500),
    subject         VARCHAR(100),
    grade_level     VARCHAR(50),
    topic           VARCHAR(255),
    -- The structured generated content as JSON
    content_data    JSONB        NOT NULL,
    -- Teacher input/request
    prompt_input    TEXT,
    -- Review state
    review_status   VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    -- Version tracking
    version         INTEGER      NOT NULL DEFAULT 1,
    parent_id       UUID         REFERENCES generated_contents(id),
    -- AI metadata
    model_used      VARCHAR(100),
    generation_time_ms INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contents_workspace ON generated_contents(workspace_id);
CREATE INDEX idx_contents_type ON generated_contents(content_type);
CREATE INDEX idx_contents_created_by ON generated_contents(created_by);
CREATE INDEX idx_contents_review_status ON generated_contents(review_status);
CREATE INDEX idx_contents_parent ON generated_contents(parent_id);

-- ==================
-- CONTENT CITATIONS
-- ==================
CREATE TABLE content_citations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id      UUID         NOT NULL REFERENCES generated_contents(id) ON DELETE CASCADE,
    chunk_id        UUID         NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    document_id     UUID         NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    citation_text   TEXT,
    relevance_score DOUBLE PRECISION,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citations_content ON content_citations(content_id);
CREATE INDEX idx_citations_document ON content_citations(document_id);
