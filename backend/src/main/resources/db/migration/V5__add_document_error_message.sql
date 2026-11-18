-- ==============================================================================
-- Migration V5: Add error_message column to documents table [BE-035]
-- Supports detailed error reporting for corrupt files and empty text handling.
-- ==============================================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_message VARCHAR(1000);
