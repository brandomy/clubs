-- ============================================================
-- Migration: 009-lms-schema.sql
-- Purpose: Custom Learning Management System (LMS)
-- Created: 2026-04-11
-- Prerequisites: 007-rebuild-schema.sql (pm_clubs, pm_members, get_current_user_club_id)
--                008-public-pages.sql (pm_public_pages)
-- ============================================================

-- ============================================================
-- TABLE 1: pm_learning_paths
-- A complete curriculum (e.g., "Pitchmasters Fundamentals")
-- ============================================================
CREATE TABLE pm_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  slug text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  cover_image_url text,
  created_by uuid REFERENCES pm_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, slug)
);

CREATE INDEX idx_pm_learning_paths_club_id ON pm_learning_paths (club_id);
CREATE INDEX idx_pm_learning_paths_club_published ON pm_learning_paths (club_id, published);

-- ============================================================
-- TABLE 2: pm_learning_levels
-- A level within a path (e.g., "Level 1: Foundations")
-- club_id is denormalized here — do NOT derive through JOINs in RLS
-- ============================================================
CREATE TABLE pm_learning_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES pm_learning_paths(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  required_projects integer NOT NULL DEFAULT 1
);

CREATE INDEX idx_pm_learning_levels_path_id ON pm_learning_levels (path_id);
CREATE INDEX idx_pm_learning_levels_club_id ON pm_learning_levels (club_id);

-- ============================================================
-- TABLE 3: pm_evaluation_templates
-- Reusable evaluation form schemas
-- (created before learning_projects — projects FK to this)
-- ============================================================
CREATE TABLE pm_evaluation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pm_eval_templates_club_id ON pm_evaluation_templates (club_id);

-- ============================================================
-- TABLE 4: pm_learning_projects
-- A single project within a level
-- club_id and path_id are denormalized for RLS and performance
-- ============================================================
CREATE TABLE pm_learning_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES pm_learning_levels(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES pm_learning_paths(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_type text NOT NULL DEFAULT 'speech'
    CHECK (project_type IN ('speech', 'assignment', 'evaluation_exercise', 'elective')),
  evaluation_template_id uuid REFERENCES pm_evaluation_templates(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_elective boolean NOT NULL DEFAULT false,
  time_estimate_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pm_learning_projects_level_id ON pm_learning_projects (level_id);
CREATE INDEX idx_pm_learning_projects_path_id ON pm_learning_projects (path_id);
CREATE INDEX idx_pm_learning_projects_club_id ON pm_learning_projects (club_id);

-- ============================================================
-- TABLE 5: pm_member_path_enrollments
-- Which path each member is enrolled in
-- ============================================================
CREATE TABLE pm_member_path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES pm_learning_paths(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  current_level_id uuid REFERENCES pm_learning_levels(id) ON DELETE SET NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (member_id, path_id)
);

CREATE INDEX idx_pm_enrollments_member_id ON pm_member_path_enrollments (member_id);
CREATE INDEX idx_pm_enrollments_path_id ON pm_member_path_enrollments (path_id);
CREATE INDEX idx_pm_enrollments_club_id ON pm_member_path_enrollments (club_id);

-- ============================================================
-- TABLE 6: pm_member_project_completions
-- Records each project a member has completed
-- speech_id links to pm_speeches — the key meeting integration point
-- ============================================================
CREATE TABLE pm_member_project_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES pm_learning_projects(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES pm_learning_paths(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  speech_id uuid REFERENCES pm_speeches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_evaluation'
    CHECK (status IN ('pending_evaluation', 'completed', 'approved_by_officer')),
  evaluation_data jsonb,
  evaluator_id uuid REFERENCES pm_members(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  notes text,
  UNIQUE (member_id, project_id)
);

CREATE INDEX idx_pm_completions_member_id ON pm_member_project_completions (member_id);
CREATE INDEX idx_pm_completions_project_id ON pm_member_project_completions (project_id);
CREATE INDEX idx_pm_completions_path_id ON pm_member_project_completions (path_id);
CREATE INDEX idx_pm_completions_club_id ON pm_member_project_completions (club_id);
CREATE INDEX idx_pm_completions_status ON pm_member_project_completions (club_id, status);

-- ============================================================
-- TABLE 7: pm_learning_badges
-- Badge definitions — what triggers a badge
-- ============================================================
CREATE TABLE pm_learning_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  trigger_type text NOT NULL
    CHECK (trigger_type IN ('project_complete', 'level_complete', 'path_complete')),
  trigger_ref_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pm_learning_badges_club_id ON pm_learning_badges (club_id);
CREATE INDEX idx_pm_learning_badges_trigger ON pm_learning_badges (trigger_type, trigger_ref_id);

-- ============================================================
-- TABLE 8: pm_member_badges
-- Badges earned by members
-- ============================================================
CREATE TABLE pm_member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES pm_learning_badges(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  speech_id uuid REFERENCES pm_speeches(id) ON DELETE SET NULL,
  UNIQUE (member_id, badge_id)
);

CREATE INDEX idx_pm_member_badges_member_id ON pm_member_badges (member_id);
CREATE INDEX idx_pm_member_badges_club_id ON pm_member_badges (club_id);

-- ============================================================
-- updated_at Triggers
-- ============================================================
CREATE TRIGGER pm_learning_paths_set_updated_at
  BEFORE UPDATE ON pm_learning_paths
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER pm_eval_templates_set_updated_at
  BEFORE UPDATE ON pm_evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER pm_learning_projects_set_updated_at
  BEFORE UPDATE ON pm_learning_projects
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- Row Level Security — pm_learning_paths
-- ============================================================
ALTER TABLE pm_learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_learning_paths_read_published"
  ON pm_learning_paths FOR SELECT
  USING (published = true);

CREATE POLICY "pm_learning_paths_read_own_club"
  ON pm_learning_paths FOR SELECT
  USING (club_id = get_current_user_club_id());

CREATE POLICY "pm_learning_paths_write"
  ON pm_learning_paths FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  )
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- ============================================================
-- Row Level Security — pm_learning_levels
-- ============================================================
ALTER TABLE pm_learning_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_learning_levels_read"
  ON pm_learning_levels FOR SELECT
  USING (club_id = get_current_user_club_id());

CREATE POLICY "pm_learning_levels_write"
  ON pm_learning_levels FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  )
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- ============================================================
-- Row Level Security — pm_learning_projects
-- ============================================================
ALTER TABLE pm_learning_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_learning_projects_read"
  ON pm_learning_projects FOR SELECT
  USING (club_id = get_current_user_club_id());

CREATE POLICY "pm_learning_projects_write"
  ON pm_learning_projects FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  )
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- ============================================================
-- Row Level Security — pm_evaluation_templates
-- ============================================================
ALTER TABLE pm_evaluation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_eval_templates_read"
  ON pm_evaluation_templates FOR SELECT
  USING (club_id = get_current_user_club_id());

CREATE POLICY "pm_eval_templates_write"
  ON pm_evaluation_templates FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  )
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- ============================================================
-- Row Level Security — pm_member_path_enrollments
-- ============================================================
ALTER TABLE pm_member_path_enrollments ENABLE ROW LEVEL SECURITY;

-- Members can read/manage their own enrollments; officers see all in club
CREATE POLICY "pm_enrollments_read"
  ON pm_member_path_enrollments FOR SELECT
  USING (
    member_id = auth.uid()
    OR club_id = get_current_user_club_id()
  );

CREATE POLICY "pm_enrollments_insert"
  ON pm_member_path_enrollments FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND club_id = get_current_user_club_id()
  );

CREATE POLICY "pm_enrollments_update"
  ON pm_member_path_enrollments FOR UPDATE
  USING (
    member_id = auth.uid()
    OR (
      club_id = get_current_user_club_id()
      AND EXISTS (
        SELECT 1 FROM pm_members
        WHERE pm_members.id = auth.uid()
        AND pm_members.role IN ('officer', 'admin')
      )
    )
  );

-- ============================================================
-- Row Level Security — pm_member_project_completions
-- ============================================================
ALTER TABLE pm_member_project_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_completions_read"
  ON pm_member_project_completions FOR SELECT
  USING (
    member_id = auth.uid()
    OR club_id = get_current_user_club_id()
  );

CREATE POLICY "pm_completions_insert"
  ON pm_member_project_completions FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND club_id = get_current_user_club_id()
  );

CREATE POLICY "pm_completions_update"
  ON pm_member_project_completions FOR UPDATE
  USING (
    member_id = auth.uid()
    OR (
      club_id = get_current_user_club_id()
      AND EXISTS (
        SELECT 1 FROM pm_members
        WHERE pm_members.id = auth.uid()
        AND pm_members.role IN ('officer', 'admin')
      )
    )
  );

-- ============================================================
-- Row Level Security — pm_learning_badges
-- ============================================================
ALTER TABLE pm_learning_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_learning_badges_read"
  ON pm_learning_badges FOR SELECT
  USING (club_id = get_current_user_club_id());

CREATE POLICY "pm_learning_badges_write"
  ON pm_learning_badges FOR ALL
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role = 'admin'
    )
  )
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role = 'admin'
    )
  );

-- ============================================================
-- Row Level Security — pm_member_badges
-- ============================================================
ALTER TABLE pm_member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_member_badges_read"
  ON pm_member_badges FOR SELECT
  USING (
    member_id = auth.uid()
    OR club_id = get_current_user_club_id()
  );

-- Badge inserts happen server-side via badge engine (service role)
-- Members cannot award themselves badges
CREATE POLICY "pm_member_badges_officer_insert"
  ON pm_member_badges FOR INSERT
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );
