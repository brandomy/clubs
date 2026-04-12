-- Migration: Change pm_learning_levels.content from text to jsonb
-- Allows Supabase to auto-parse the JSON on read rather than returning a raw string.
-- Safe if column is NULL or contains valid JSON strings (which BlockNote always produces).

ALTER TABLE pm_learning_levels
  ALTER COLUMN content TYPE jsonb
  USING CASE
    WHEN content IS NULL THEN NULL
    ELSE content::jsonb
  END;

-- Verify:
--   SELECT column_name, data_type FROM information_schema.columns
--     WHERE table_name = 'pm_learning_levels' AND column_name = 'content';
