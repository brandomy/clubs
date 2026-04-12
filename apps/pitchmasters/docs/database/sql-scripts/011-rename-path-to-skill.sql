-- Migration: Rename "path" to "skill" throughout the LMS schema
-- This aligns the database with the UI/code terminology change.
-- Run this against your Supabase project via the SQL editor.
--
-- IMPORTANT: Run the RLS policy drops/recreates at the end.
-- This migration is idempotent-safe if run once on a clean schema.

-- ============================================================
-- 1. Rename main table
-- ============================================================
ALTER TABLE pm_learning_paths RENAME TO pm_learning_skills;

-- ============================================================
-- 2. Rename path_id columns in child tables
-- ============================================================
ALTER TABLE pm_learning_levels
  RENAME COLUMN path_id TO skill_id;

ALTER TABLE pm_learning_projects
  RENAME COLUMN path_id TO skill_id;

ALTER TABLE pm_member_path_enrollments
  RENAME COLUMN path_id TO skill_id;

ALTER TABLE pm_member_project_completions
  RENAME COLUMN path_id TO skill_id;

-- ============================================================
-- 3. Rename enrollment table
-- ============================================================
ALTER TABLE pm_member_path_enrollments RENAME TO pm_member_skill_enrollments;

-- ============================================================
-- 4. Rename member profile columns
-- ============================================================
ALTER TABLE pm_member_profiles
  RENAME COLUMN path_level TO skill_level;

ALTER TABLE pm_member_profiles
  RENAME COLUMN current_path TO current_skill;

ALTER TABLE pm_member_profiles
  RENAME COLUMN completed_pathways TO completed_skills;

-- ============================================================
-- 5. Update trigger_type value in badges
--    (existing 'path_complete' badges → 'skill_complete')
-- ============================================================
UPDATE pm_learning_badges
  SET trigger_type = 'skill_complete'
  WHERE trigger_type = 'path_complete';

-- ============================================================
-- 6. Rename indexes (drop old, recreate with new names)
-- ============================================================

-- pm_learning_levels
DROP INDEX IF EXISTS idx_pm_learning_levels_path_id;
CREATE INDEX IF NOT EXISTS idx_pm_learning_levels_skill_id
  ON pm_learning_levels(skill_id);

-- pm_learning_projects
DROP INDEX IF EXISTS idx_pm_learning_projects_path_id;
CREATE INDEX IF NOT EXISTS idx_pm_learning_projects_skill_id
  ON pm_learning_projects(skill_id);

-- pm_member_skill_enrollments (was pm_member_path_enrollments)
DROP INDEX IF EXISTS idx_pm_member_path_enrollments_member_id;
DROP INDEX IF EXISTS idx_pm_member_path_enrollments_path_id;
CREATE INDEX IF NOT EXISTS idx_pm_member_skill_enrollments_member_id
  ON pm_member_skill_enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_pm_member_skill_enrollments_skill_id
  ON pm_member_skill_enrollments(skill_id);

-- pm_member_project_completions
DROP INDEX IF EXISTS idx_pm_member_project_completions_path_id;
CREATE INDEX IF NOT EXISTS idx_pm_member_project_completions_skill_id
  ON pm_member_project_completions(skill_id);

-- ============================================================
-- 7. Recreate RLS policies for renamed tables/columns
-- ============================================================

-- pm_learning_skills (was pm_learning_paths)
DROP POLICY IF EXISTS "Officers can manage learning paths" ON pm_learning_skills;
DROP POLICY IF EXISTS "Members can view published learning paths" ON pm_learning_skills;

CREATE POLICY "Officers can manage learning skills"
  ON pm_learning_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
        AND pm_members.club_id = pm_learning_skills.club_id
        AND pm_members.role IN ('officer', 'admin')
    )
  );

CREATE POLICY "Members can view published learning skills"
  ON pm_learning_skills FOR SELECT
  USING (
    published = true
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
        AND pm_members.club_id = pm_learning_skills.club_id
    )
  );

-- pm_member_skill_enrollments (was pm_member_path_enrollments)
DROP POLICY IF EXISTS "Members can view their own enrollments" ON pm_member_skill_enrollments;
DROP POLICY IF EXISTS "Members can enroll themselves" ON pm_member_skill_enrollments;
DROP POLICY IF EXISTS "Officers can view all enrollments" ON pm_member_skill_enrollments;
DROP POLICY IF EXISTS "Officers can update enrollments" ON pm_member_skill_enrollments;

ALTER TABLE pm_member_skill_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own skill enrollments"
  ON pm_member_skill_enrollments FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Members can enroll in skills"
  ON pm_member_skill_enrollments FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Officers can view all skill enrollments"
  ON pm_member_skill_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
        AND pm_members.club_id = pm_member_skill_enrollments.club_id
        AND pm_members.role IN ('officer', 'admin')
    )
  );

CREATE POLICY "Officers can update skill enrollments"
  ON pm_member_skill_enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
        AND pm_members.club_id = pm_member_skill_enrollments.club_id
        AND pm_members.role IN ('officer', 'admin')
    )
  );

-- ============================================================
-- Done. Verify with:
--   SELECT table_name FROM information_schema.tables
--     WHERE table_schema = 'public' AND table_name LIKE 'pm_%';
-- ============================================================
