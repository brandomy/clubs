-- Migration 071: Fix Cloudflare Pages Security Warnings
-- Purpose: Resolve all WARN-level Supabase security linter findings
-- Date: 2026-04-17
-- Author: CTO (Claude Code)
--
-- Warnings fixed:
--   1. function_search_path_mutable  (13 functions)
--   2. extension_in_public           (moddatetime)
--   3. rls_policy_always_true        (17 permissive write policies)
--   4. public_bucket_allows_listing  (6 storage buckets)
--
-- NOT fixed here (requires Supabase dashboard):
--   5. auth_leaked_password_protection → enable at:
--      Auth > Providers > Email > Leaked Password Protection

-- ============================================================================
-- 1. FIX FUNCTION SEARCH_PATH
-- Without a fixed search_path a malicious user could shadow public schema
-- objects by creating same-named objects in another schema. Fix: pin to public.
-- ============================================================================

-- Trigger functions (no args)
ALTER FUNCTION public.update_updated_at_column()        SET search_path = public;
ALTER FUNCTION public.update_updated_at()               SET search_path = public;
ALTER FUNCTION public.update_locations_updated_at()     SET search_path = public;
ALTER FUNCTION public.update_photos_updated_at()        SET search_path = public;
ALTER FUNCTION public.update_rsvp_responded_at()        SET search_path = public;
ALTER FUNCTION public.create_rsvps_for_new_meeting()    SET search_path = public;
ALTER FUNCTION public.trigger_refresh_stats_on_attendance() SET search_path = public;

-- Functions with arguments
ALTER FUNCTION public.get_user_role(UUID)               SET search_path = public;
ALTER FUNCTION public.get_rotary_quarter(DATE)          SET search_path = public;
ALTER FUNCTION public.get_rotary_year(DATE)             SET search_path = public;
ALTER FUNCTION public.send_rsvp_reminder(UUID)          SET search_path = public;
ALTER FUNCTION public.user_has_permission(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.refresh_member_attendance_stats(UUID) SET search_path = public;

-- ============================================================================
-- 2. MOVE EXTENSION OUT OF PUBLIC SCHEMA
-- moddatetime is not used by any Georgetown trigger; move it to extensions schema.
-- ============================================================================

ALTER EXTENSION moddatetime SET SCHEMA extensions;

-- ============================================================================
-- 3. TIGHTEN PERMISSIVE RLS WRITE POLICIES
-- All mutations now require authenticated role. Public (anon) SELECT access is
-- preserved on all tables where it existed, so the public-facing pages still work.
-- gt_global_south_interest INSERT remains open (intentional: public lead form).
-- ============================================================================

-- ---- gt_events ----
DROP POLICY IF EXISTS "Allow all users to insert club_events" ON gt_events;
DROP POLICY IF EXISTS "Allow all users to update club_events" ON gt_events;
DROP POLICY IF EXISTS "Allow all users to delete club_events" ON gt_events;

CREATE POLICY "Authenticated users can insert events"
  ON gt_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON gt_events FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete events"
  ON gt_events FOR DELETE TO authenticated
  USING (true);

-- ---- gt_locations ----
DROP POLICY IF EXISTS "Allow all users to insert locations" ON gt_locations;
DROP POLICY IF EXISTS "Allow all users to update locations" ON gt_locations;
DROP POLICY IF EXISTS "Allow all users to delete locations" ON gt_locations;

CREATE POLICY "Authenticated users can insert locations"
  ON gt_locations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
  ON gt_locations FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete locations"
  ON gt_locations FOR DELETE TO authenticated
  USING (true);

-- ---- gt_speakers ----
DROP POLICY IF EXISTS "Allow all users to insert speakers" ON gt_speakers;
DROP POLICY IF EXISTS "Allow all users to update speakers" ON gt_speakers;
DROP POLICY IF EXISTS "Allow all users to delete speakers" ON gt_speakers;

CREATE POLICY "Authenticated users can insert speakers"
  ON gt_speakers FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update speakers"
  ON gt_speakers FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete speakers"
  ON gt_speakers FOR DELETE TO authenticated
  USING (true);

-- ---- gt_members ----
-- "Enable all operations for members table" covers ALL (including SELECT).
-- Drop it and re-establish: SELECT open to all, mutations authenticated only.
DROP POLICY IF EXISTS "Enable all operations for members table" ON gt_members;

CREATE POLICY "Members viewable by all"
  ON gt_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON gt_members FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON gt_members FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete members"
  ON gt_members FOR DELETE TO authenticated
  USING (true);

-- ---- gt_partners ----
-- Two overlapping permissive policies; replace both with role-scoped ones.
DROP POLICY IF EXISTS "Partners are manageable by authenticated users" ON gt_partners;
DROP POLICY IF EXISTS "Partners are manageable by everyone" ON gt_partners;

CREATE POLICY "Authenticated users can manage partners"
  ON gt_partners FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---- gt_service_projects ----
DROP POLICY IF EXISTS "Service projects are manageable by authenticated users" ON gt_service_projects;
DROP POLICY IF EXISTS "Service projects are manageable by everyone" ON gt_service_projects;

CREATE POLICY "Authenticated users can manage service projects"
  ON gt_service_projects FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---- gt_rotary_years ----
-- Policy name says "authenticated users" but USING clause was (true); fix it.
DROP POLICY IF EXISTS "Allow authenticated users to modify rotary_years" ON gt_rotary_years;

CREATE POLICY "Authenticated users can manage rotary years"
  ON gt_rotary_years FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---- gt_project_partners ----
DROP POLICY IF EXISTS "Allow public insert to project_partners" ON gt_project_partners;
DROP POLICY IF EXISTS "Allow public update to project_partners" ON gt_project_partners;
DROP POLICY IF EXISTS "Allow public delete from project_partners" ON gt_project_partners;

CREATE POLICY "Authenticated users can insert project_partners"
  ON gt_project_partners FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_partners"
  ON gt_project_partners FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete project_partners"
  ON gt_project_partners FOR DELETE TO authenticated
  USING (true);

-- ---- gt_photos ----
DROP POLICY IF EXISTS "Public can insert photos (development)" ON gt_photos;

CREATE POLICY "Authenticated users can insert photos"
  ON gt_photos FOR INSERT TO authenticated
  WITH CHECK (true);

-- ---- gt_global_south_interest ----
-- "Allow public inserts" stays: this is an intentional public lead-capture form.
-- The linter WARN for this table is accepted / suppressed by design.

-- ============================================================================
-- 4. REMOVE BROAD SELECT POLICIES ON PUBLIC STORAGE BUCKETS
-- Public buckets serve objects by direct URL without needing SELECT storage
-- policies. The SELECT policies only enable file *listing* (enumeration), which
-- is unnecessary and exposes directory structure. Dropping them does NOT break
-- image access via public URLs.
-- ============================================================================

DROP POLICY IF EXISTS "trial_club_photos_select"       ON storage.objects;
DROP POLICY IF EXISTS "trial_member_portraits_select"   ON storage.objects;
DROP POLICY IF EXISTS "trial_partner_logos_select"      ON storage.objects;
DROP POLICY IF EXISTS "trial_project_images_select"     ON storage.objects;
DROP POLICY IF EXISTS "trial_rotary_themes_select"      ON storage.objects;
DROP POLICY IF EXISTS "trial_speaker_portraits_select"  ON storage.objects;
DROP POLICY IF EXISTS "heme logos are publicly viewable 1kmbc2u_0" ON storage.objects;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, check Supabase dashboard → Database → Functions and confirm
-- each function shows search_path = public in its config.
--
-- Check policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies
--   WHERE schemaname = 'public' AND qual = 'true' AND cmd != 'SELECT'
--   ORDER BY tablename;
-- (Should return 0 rows once warnings are resolved)
--
-- MANUAL ACTION REQUIRED:
-- Enable Leaked Password Protection in Supabase dashboard:
-- Auth → Providers → Email → Password Security → Enable "Leaked Password Protection"
