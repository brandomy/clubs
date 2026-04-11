-- ============================================================
-- Migration: 008-public-pages.sql
-- Purpose: Browser-based CMS with BlockNote editor
-- Created: 2026-04-11
-- Updated: 2026-04-11 — renamed to pm_public_pages, references pm_clubs/pm_members
-- Prerequisites: 007-rebuild-schema.sql (pm_clubs, pm_members, get_current_user_club_id)
-- ============================================================

-- pm_public_pages: CMS content pages per club (About Us, How to Visit, etc.)
CREATE TABLE pm_public_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES pm_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, slug)
);

-- Index for fast listing of published pages per club
CREATE INDEX idx_pm_public_pages_club_published ON pm_public_pages (club_id, published);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE pm_public_pages ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read published pages
CREATE POLICY "pm_public_pages_read_published"
  ON pm_public_pages FOR SELECT
  USING (published = true);

-- Any authenticated club member can read all pages (including drafts) for their club
CREATE POLICY "pm_public_pages_read_all_own_club"
  ON pm_public_pages FOR SELECT
  USING (club_id = get_current_user_club_id());

-- Officers and admins can insert pages for their club
CREATE POLICY "pm_public_pages_insert"
  ON pm_public_pages FOR INSERT
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- Officers and admins can update pages for their club
CREATE POLICY "pm_public_pages_update"
  ON pm_public_pages FOR UPDATE
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );

-- Only admins can delete pages
CREATE POLICY "pm_public_pages_delete"
  ON pm_public_pages FOR DELETE
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role = 'admin'
    )
  );

-- Auto-update updated_at on every UPDATE
CREATE TRIGGER pm_public_pages_set_updated_at
  BEFORE UPDATE ON pm_public_pages
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
