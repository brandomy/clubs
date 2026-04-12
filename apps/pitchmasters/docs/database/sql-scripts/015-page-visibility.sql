-- ============================================================
-- Migration: 015-page-visibility.sql
-- Purpose: Replace published boolean with three-state visibility
--          draft    → officers/admins only (not yet ready)
--          members  → authenticated club members only
--          public   → anyone on the internet
-- Created: 2026-04-12
-- Prerequisites: 008-public-pages.sql
-- ============================================================

-- 1. Add visibility column (default draft so existing rows are safe)
ALTER TABLE pm_public_pages
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'draft'
  CONSTRAINT pm_public_pages_visibility_check
    CHECK (visibility IN ('draft', 'members', 'public'));

-- 2. Migrate existing data from published boolean → visibility
UPDATE pm_public_pages
  SET visibility = CASE WHEN published = true THEN 'public' ELSE 'draft' END
  WHERE visibility = 'draft';

-- ============================================================
-- Update RLS policies (must drop before dropping the published column)
-- ============================================================

-- Drop old policies (pm_public_pages_read_published depends on published column)
DROP POLICY IF EXISTS "pm_public_pages_read_published" ON pm_public_pages;
DROP POLICY IF EXISTS "pm_public_pages_read_all_own_club" ON pm_public_pages;

-- 3. Drop the now-redundant published column (safe after policies are gone)
ALTER TABLE pm_public_pages DROP COLUMN IF EXISTS published;

-- Anyone (including unauthenticated) can read public pages
CREATE POLICY "pm_public_pages_read_public"
  ON pm_public_pages FOR SELECT
  USING (visibility = 'public');

-- Authenticated club members can read members + public pages for their club
CREATE POLICY "pm_public_pages_read_members"
  ON pm_public_pages FOR SELECT
  USING (
    club_id = get_current_user_club_id()
    AND visibility IN ('members', 'public')
  );

-- Officers and admins can read all pages (including drafts) for their club
CREATE POLICY "pm_public_pages_read_drafts"
  ON pm_public_pages FOR SELECT
  USING (
    club_id = get_current_user_club_id()
    AND EXISTS (
      SELECT 1 FROM pm_members
      WHERE pm_members.id = auth.uid()
      AND pm_members.role IN ('officer', 'admin')
    )
  );
