-- ============================================================
-- Migration: 009-fix-rls-recursion.sql
-- Purpose: Fix RLS infinite recursion in pm_members and pm_public_pages policies
-- Created: 2026-04-11
-- Problem: EXISTS (SELECT 1 FROM pm_members ...) inside pm_members RLS policies
--          creates infinite recursion when evaluated. This causes Supabase INSERT/
--          UPDATE/DELETE requests to hang indefinitely (Promise never resolves).
--          Same pattern was fixed in 006-fix-users-rls-recursion.sql but 007/008
--          re-introduced it.
-- Fix: Add get_current_user_role() SECURITY DEFINER function (runs as postgres,
--      bypasses RLS) and replace all recursive EXISTS subqueries with it.
-- Prerequisites: 008-public-pages.sql
-- ============================================================

-- ============================================================
-- Step 1: Add get_current_user_role() SECURITY DEFINER function
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM pm_members WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- Step 2: Fix pm_members "Officers can manage members" policy
-- The FOR ALL policy had EXISTS (SELECT 1 FROM pm_members ...) which recursed
-- when pm_members was queried in any context.
-- ============================================================
DROP POLICY IF EXISTS "Officers can manage members" ON pm_members;

CREATE POLICY "Officers can manage members" ON pm_members
    FOR ALL USING (
        club_id = get_current_user_club_id()
        AND get_current_user_role() IN ('officer', 'admin')
    );

-- ============================================================
-- Step 3: Fix pm_guests "Officers can manage guests" policy
-- Same recursion pattern via EXISTS subquery.
-- ============================================================
DROP POLICY IF EXISTS "Officers can manage guests" ON pm_guests;

CREATE POLICY "Officers can manage guests" ON pm_guests
    FOR ALL USING (
        club_id = get_current_user_club_id()
        AND get_current_user_role() IN ('officer', 'admin')
    );

-- ============================================================
-- Step 4: Fix pm_meetings "Officers can manage meetings" policy
-- ============================================================
DROP POLICY IF EXISTS "Officers can manage meetings" ON pm_meetings;

CREATE POLICY "Officers can manage meetings" ON pm_meetings
    FOR ALL USING (
        club_id = get_current_user_club_id()
        AND get_current_user_role() IN ('officer', 'admin')
    );

-- ============================================================
-- Step 5: Fix pm_meeting_roles "Officers can manage meeting roles" policy
-- ============================================================
DROP POLICY IF EXISTS "Officers can manage meeting roles" ON pm_meeting_roles;

CREATE POLICY "Officers can manage meeting roles" ON pm_meeting_roles
    FOR ALL USING (
        meeting_id IN (SELECT id FROM pm_meetings WHERE club_id = get_current_user_club_id())
        AND get_current_user_role() IN ('officer', 'admin')
    );

-- ============================================================
-- Step 6: Fix pm_public_pages policies (the immediate blocker)
-- These all had EXISTS (SELECT 1 FROM pm_members ...) subqueries that
-- triggered the recursion in Step 2 above.
-- ============================================================
DROP POLICY IF EXISTS "pm_public_pages_insert" ON pm_public_pages;
DROP POLICY IF EXISTS "pm_public_pages_update" ON pm_public_pages;
DROP POLICY IF EXISTS "pm_public_pages_delete" ON pm_public_pages;

CREATE POLICY "pm_public_pages_insert"
  ON pm_public_pages FOR INSERT
  WITH CHECK (
    club_id = get_current_user_club_id()
    AND get_current_user_role() IN ('officer', 'admin')
  );

CREATE POLICY "pm_public_pages_update"
  ON pm_public_pages FOR UPDATE
  USING (
    club_id = get_current_user_club_id()
    AND get_current_user_role() IN ('officer', 'admin')
  );

CREATE POLICY "pm_public_pages_delete"
  ON pm_public_pages FOR DELETE
  USING (
    club_id = get_current_user_club_id()
    AND get_current_user_role() = 'admin'
  );

-- ============================================================
-- Step 7: Verify — these should all return without error
-- ============================================================
SELECT get_current_user_role();
SELECT get_current_user_club_id();
