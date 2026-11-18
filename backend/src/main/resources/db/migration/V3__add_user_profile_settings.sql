-- =============================================
-- V3 — Add User Profile and Settings Columns
-- AI Teacher Copilot
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'FREE';
