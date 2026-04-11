-- ============================================================
-- Migration: 010-fix-security-definer-search-path.sql
-- Purpose: Add SET search_path = public to SECURITY DEFINER functions
-- Created: 2026-04-11
-- Problem: get_current_user_club_id() was created in 007 without
--          SET search_path = public. Without this, SECURITY DEFINER
--          functions can execute in an unpredictable search_path context,
--          causing intermittent hangs on page reload (the pm_members
--          SELECT inside the function never resolves).
--          This manifested as: fresh login works, but page refresh hangs.
-- Fix: Re-create both SECURITY DEFINER functions with SET search_path = public
-- Prerequisites: 009-fix-rls-recursion.sql
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_user_club_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT club_id FROM pm_members WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM pm_members WHERE id = auth.uid() LIMIT 1;
$$;

-- Verify both functions exist and are callable
SELECT
  proname AS function_name,
  prosecdef AS security_definer,
  proconfig AS config
FROM pg_proc
WHERE proname IN ('get_current_user_club_id', 'get_current_user_role')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
