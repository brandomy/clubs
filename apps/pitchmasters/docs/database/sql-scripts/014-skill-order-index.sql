-- Migration: Add order_index to pm_learning_skills for drag-and-drop ordering.

ALTER TABLE pm_learning_skills
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- Seed existing rows with sequential order per club, by created_at.
UPDATE pm_learning_skills s
SET order_index = sub.rn
FROM (
  SELECT id,
         row_number() OVER (PARTITION BY club_id ORDER BY created_at) - 1 AS rn
  FROM pm_learning_skills
) sub
WHERE s.id = sub.id;

-- Verify:
--   SELECT title, order_index FROM pm_learning_skills ORDER BY club_id, order_index;
