-- Migration 070: Fix Cloudflare Pages Security Errors
-- Purpose: Resolve Supabase security linter errors flagged during deployment
-- Date: 2026-04-17
-- Author: CTO (Claude Code)
-- Errors fixed:
--   1. policy_exists_rls_disabled  → gt_meeting_rsvps (RLS disabled in migration 063)
--   2. rls_disabled_in_public      → gt_meeting_rsvps, gt_role_change_log
--   3. security_definer_view       → 5 views created in migration 069

-- ============================================================================
-- 1. ENABLE RLS ON gt_meeting_rsvps
-- Policies already exist from migrations 059. Migration 063 disabled RLS for
-- testing with a note to re-enable before production. That time is now.
-- ============================================================================

ALTER TABLE gt_meeting_rsvps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ENABLE RLS ON gt_role_change_log + ADD POLICIES
-- This audit log table was never given RLS. Officers/admins read-only;
-- writes happen via system functions using service role only.
-- ============================================================================

ALTER TABLE gt_role_change_log ENABLE ROW LEVEL SECURITY;

-- Officers and admins can read the audit log
CREATE POLICY "Officers can view role change log"
  ON gt_role_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gt_user_roles
      WHERE user_id = auth.uid()
        AND role IN ('officer', 'admin')
    )
  );

-- No user-level INSERT/UPDATE/DELETE — writes happen via service role functions only

-- ============================================================================
-- 3. FIX SECURITY DEFINER VIEWS
-- PostgreSQL views default to SECURITY DEFINER (owner's permissions), which
-- bypasses the querying user's RLS. Setting security_invoker = on makes the
-- view execute with the querying user's permissions, enforcing their RLS.
-- Requires PostgreSQL 15+ (Supabase default since 2023).
-- ============================================================================

ALTER VIEW gt_meeting_rsvp_summary    SET (security_invoker = on);
ALTER VIEW gt_member_rsvp_history     SET (security_invoker = on);
ALTER VIEW gt_meeting_attendance_summary SET (security_invoker = on);
ALTER VIEW gt_member_attendance_detail SET (security_invoker = on);
ALTER VIEW gt_at_risk_members         SET (security_invoker = on);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these after migration to confirm success:
--
-- Check RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--   AND tablename IN ('gt_meeting_rsvps', 'gt_role_change_log');
--
-- Check view security_invoker:
-- SELECT viewname, definition FROM pg_views
--   WHERE schemaname = 'public'
--   AND viewname LIKE 'gt_%';
--
-- Check policies on gt_role_change_log:
-- SELECT policyname, cmd FROM pg_policies
--   WHERE tablename = 'gt_role_change_log';
