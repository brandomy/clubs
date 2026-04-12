-- Migration: Add content column to pm_learning_levels
-- Stores BlockNote JSON for learning materials members review before projects.
-- Run in Supabase SQL editor.

ALTER TABLE pm_learning_levels
  ADD COLUMN IF NOT EXISTS content text;

-- Verify:
--   SELECT column_name, data_type FROM information_schema.columns
--     WHERE table_name = 'pm_learning_levels' AND column_name = 'content';
