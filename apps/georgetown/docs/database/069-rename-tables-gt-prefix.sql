-- Migration 069: Rename All Georgetown Tables with gt_ Prefix
-- Purpose: Add gt_ prefix to all Georgetown tables to prevent naming collisions
--          with Pitchmasters (pm_) tables in the shared Supabase project.
-- Date: 2026-04-11
-- Author: CTO (Claude Code)
--
-- IMPORTANT: Tables are live in production.
--   - Uses ALTER TABLE ... RENAME TO (NOT drop/recreate) to preserve all data.
--   - Foreign keys and RLS policies survive table renames (PostgreSQL stores by OID).
--   - plpgsql/SQL function bodies reference tables by name at runtime → must be updated.
--   - Indexes and triggers do NOT auto-rename → renamed explicitly below.
--   - Views are dropped and recreated with gt_ names and updated table references.
--
-- Tables renamed (16):
--   events, locations, members, partners, photos, project_partners,
--   rotary_years, service_projects, speakers, user_roles, role_permissions,
--   role_change_log, attendance_records, meeting_rsvps, global_south_interest,
--   member_attendance_stats
--
-- Views renamed (5): meeting_rsvp_summary, member_rsvp_history,
--   meeting_attendance_summary, member_attendance_detail, at_risk_members

-- ============================================================================
-- STEP 0: DROP VIEWS THAT REFERENCE RENAMED TABLES
-- (views will be recreated at the end with gt_ names)
-- ============================================================================

DROP VIEW IF EXISTS at_risk_members;
DROP VIEW IF EXISTS member_attendance_detail;
DROP VIEW IF EXISTS member_rsvp_history;
DROP VIEW IF EXISTS meeting_attendance_summary;
DROP VIEW IF EXISTS meeting_rsvp_summary;

-- ============================================================================
-- STEP 1: RENAME TABLES
-- ALTER TABLE preserves: data, foreign keys, RLS policies, constraints, sequences
-- ============================================================================

ALTER TABLE events              RENAME TO gt_events;
ALTER TABLE locations           RENAME TO gt_locations;
ALTER TABLE members             RENAME TO gt_members;
ALTER TABLE partners            RENAME TO gt_partners;
ALTER TABLE photos              RENAME TO gt_photos;
ALTER TABLE project_partners    RENAME TO gt_project_partners;
ALTER TABLE rotary_years        RENAME TO gt_rotary_years;
ALTER TABLE service_projects    RENAME TO gt_service_projects;
ALTER TABLE speakers            RENAME TO gt_speakers;
ALTER TABLE user_roles          RENAME TO gt_user_roles;
ALTER TABLE role_permissions    RENAME TO gt_role_permissions;
ALTER TABLE role_change_log     RENAME TO gt_role_change_log;
ALTER TABLE attendance_records  RENAME TO gt_attendance_records;
ALTER TABLE meeting_rsvps       RENAME TO gt_meeting_rsvps;
ALTER TABLE global_south_interest RENAME TO gt_global_south_interest;
ALTER TABLE member_attendance_stats RENAME TO gt_member_attendance_stats;

-- ============================================================================
-- STEP 2: RENAME INDEXES
-- PostgreSQL does NOT auto-rename indexes when tables are renamed.
-- Using IF EXISTS throughout to skip any index that does not exist.
-- ============================================================================

-- gt_events
ALTER INDEX IF EXISTS events_pkey                  RENAME TO gt_events_pkey;
ALTER INDEX IF EXISTS idx_events_location_id       RENAME TO idx_gt_events_location_id;

-- gt_locations
ALTER INDEX IF EXISTS locations_pkey               RENAME TO gt_locations_pkey;

-- gt_members
ALTER INDEX IF EXISTS members_pkey                 RENAME TO gt_members_pkey;
ALTER INDEX IF EXISTS idx_members_social_media_links RENAME TO idx_gt_members_social_media_links;

-- gt_partners
ALTER INDEX IF EXISTS partners_pkey                    RENAME TO gt_partners_pkey;
ALTER INDEX IF EXISTS idx_partners_primary_contact     RENAME TO idx_gt_partners_primary_contact;
ALTER INDEX IF EXISTS idx_partners_next_review         RENAME TO idx_gt_partners_next_review;
ALTER INDEX IF EXISTS idx_partners_social_media_links  RENAME TO idx_gt_partners_social_media_links;

-- gt_photos
ALTER INDEX IF EXISTS photos_pkey                  RENAME TO gt_photos_pkey;
ALTER INDEX IF EXISTS idx_photos_approval_status   RENAME TO idx_gt_photos_approval_status;
ALTER INDEX IF EXISTS idx_photos_category          RENAME TO idx_gt_photos_category;
ALTER INDEX IF EXISTS idx_photos_created_at        RENAME TO idx_gt_photos_created_at;
ALTER INDEX IF EXISTS idx_photos_event             RENAME TO idx_gt_photos_event;
ALTER INDEX IF EXISTS idx_photos_featured          RENAME TO idx_gt_photos_featured;
ALTER INDEX IF EXISTS idx_photos_photo_date        RENAME TO idx_gt_photos_photo_date;
ALTER INDEX IF EXISTS idx_photos_project           RENAME TO idx_gt_photos_project;
ALTER INDEX IF EXISTS idx_photos_rotary_year       RENAME TO idx_gt_photos_rotary_year;
ALTER INDEX IF EXISTS idx_photos_search            RENAME TO idx_gt_photos_search;
ALTER INDEX IF EXISTS idx_photos_tags              RENAME TO idx_gt_photos_tags;

-- gt_project_partners
ALTER INDEX IF EXISTS project_partners_pkey            RENAME TO gt_project_partners_pkey;
ALTER INDEX IF EXISTS idx_project_partners_project     RENAME TO idx_gt_project_partners_project;
ALTER INDEX IF EXISTS idx_project_partners_partner     RENAME TO idx_gt_project_partners_partner;

-- gt_rotary_years
ALTER INDEX IF EXISTS rotary_years_pkey            RENAME TO gt_rotary_years_pkey;
ALTER INDEX IF EXISTS idx_rotary_years_year        RENAME TO idx_gt_rotary_years_year;
ALTER INDEX IF EXISTS idx_rotary_years_club        RENAME TO idx_gt_rotary_years_club;

-- gt_service_projects
ALTER INDEX IF EXISTS service_projects_pkey            RENAME TO gt_service_projects_pkey;
ALTER INDEX IF EXISTS idx_service_projects_status      RENAME TO idx_gt_service_projects_status;
ALTER INDEX IF EXISTS idx_service_projects_area_of_focus RENAME TO idx_gt_service_projects_area_of_focus;
ALTER INDEX IF EXISTS idx_service_projects_rotary_year RENAME TO idx_gt_service_projects_rotary_year;
ALTER INDEX IF EXISTS idx_service_projects_year        RENAME TO idx_gt_service_projects_year;
ALTER INDEX IF EXISTS idx_projects_funding_source      RENAME TO idx_gt_projects_funding_source;
ALTER INDEX IF EXISTS idx_projects_citation_eligible   RENAME TO idx_gt_projects_citation_eligible;
ALTER INDEX IF EXISTS idx_projects_follow_up           RENAME TO idx_gt_projects_follow_up;

-- gt_speakers
ALTER INDEX IF EXISTS speakers_pkey                    RENAME TO gt_speakers_pkey;
ALTER INDEX IF EXISTS idx_speakers_status              RENAME TO idx_gt_speakers_status;
ALTER INDEX IF EXISTS idx_speakers_position            RENAME TO idx_gt_speakers_position;
ALTER INDEX IF EXISTS idx_speakers_rotary_year         RENAME TO idx_gt_speakers_rotary_year;
ALTER INDEX IF EXISTS idx_speakers_social_media_links  RENAME TO idx_gt_speakers_social_media_links;

-- gt_user_roles
ALTER INDEX IF EXISTS user_roles_pkey              RENAME TO gt_user_roles_pkey;
ALTER INDEX IF EXISTS idx_user_roles_user          RENAME TO idx_gt_user_roles_user;
ALTER INDEX IF EXISTS idx_user_roles_member        RENAME TO idx_gt_user_roles_member;
ALTER INDEX IF EXISTS idx_user_roles_role          RENAME TO idx_gt_user_roles_role;

-- gt_role_permissions
ALTER INDEX IF EXISTS role_permissions_pkey        RENAME TO gt_role_permissions_pkey;
ALTER INDEX IF EXISTS idx_role_permissions_lookup  RENAME TO idx_gt_role_permissions_lookup;

-- gt_role_change_log
ALTER INDEX IF EXISTS role_change_log_pkey         RENAME TO gt_role_change_log_pkey;
ALTER INDEX IF EXISTS idx_role_change_log_user     RENAME TO idx_gt_role_change_log_user;
ALTER INDEX IF EXISTS idx_role_change_log_date     RENAME TO idx_gt_role_change_log_date;

-- gt_attendance_records
ALTER INDEX IF EXISTS attendance_records_pkey          RENAME TO gt_attendance_records_pkey;
ALTER INDEX IF EXISTS idx_attendance_event             RENAME TO idx_gt_attendance_event;
ALTER INDEX IF EXISTS idx_attendance_member            RENAME TO idx_gt_attendance_member;
ALTER INDEX IF EXISTS idx_attendance_type              RENAME TO idx_gt_attendance_type;
ALTER INDEX IF EXISTS idx_attendance_date              RENAME TO idx_gt_attendance_date;
ALTER INDEX IF EXISTS idx_attendance_event_member      RENAME TO idx_gt_attendance_event_member;
ALTER INDEX IF EXISTS idx_attendance_prospective       RENAME TO idx_gt_attendance_prospective;

-- gt_meeting_rsvps
ALTER INDEX IF EXISTS meeting_rsvps_pkey               RENAME TO gt_meeting_rsvps_pkey;
ALTER INDEX IF EXISTS idx_meeting_rsvps_event          RENAME TO idx_gt_meeting_rsvps_event;
ALTER INDEX IF EXISTS idx_meeting_rsvps_member         RENAME TO idx_gt_meeting_rsvps_member;
ALTER INDEX IF EXISTS idx_meeting_rsvps_status         RENAME TO idx_gt_meeting_rsvps_status;
ALTER INDEX IF EXISTS idx_meeting_rsvps_event_status   RENAME TO idx_gt_meeting_rsvps_event_status;

-- gt_global_south_interest
ALTER INDEX IF EXISTS global_south_interest_pkey               RENAME TO gt_global_south_interest_pkey;
ALTER INDEX IF EXISTS idx_global_south_interest_country        RENAME TO idx_gt_global_south_interest_country;
ALTER INDEX IF EXISTS idx_global_south_interest_submitted_at   RENAME TO idx_gt_global_south_interest_submitted_at;
ALTER INDEX IF EXISTS idx_global_south_interest_email          RENAME TO idx_gt_global_south_interest_email;

-- gt_member_attendance_stats
ALTER INDEX IF EXISTS member_attendance_stats_pkey     RENAME TO gt_member_attendance_stats_pkey;
ALTER INDEX IF EXISTS idx_member_stats_percentage      RENAME TO idx_gt_member_stats_percentage;
ALTER INDEX IF EXISTS idx_member_stats_absences        RENAME TO idx_gt_member_stats_absences;

-- ============================================================================
-- STEP 3: RENAME TRIGGERS (cosmetic — trigger functions still work after rename)
-- Table names in ALTER TRIGGER use the NEW (renamed) table name.
-- ============================================================================

ALTER TRIGGER update_speakers_updated_at
  ON gt_speakers RENAME TO update_gt_speakers_updated_at;

ALTER TRIGGER update_locations_updated_at
  ON gt_locations RENAME TO update_gt_locations_updated_at;

ALTER TRIGGER update_rotary_years_updated_at
  ON gt_rotary_years RENAME TO update_gt_rotary_years_updated_at;

ALTER TRIGGER set_photos_updated_at
  ON gt_photos RENAME TO set_gt_photos_updated_at;

ALTER TRIGGER update_user_roles_updated_at
  ON gt_user_roles RENAME TO update_gt_user_roles_updated_at;

ALTER TRIGGER trigger_create_rsvps_for_meeting
  ON gt_events RENAME TO trigger_gt_create_rsvps_for_meeting;

ALTER TRIGGER trigger_update_rsvp_responded_at
  ON gt_meeting_rsvps RENAME TO trigger_gt_update_rsvp_responded_at;

ALTER TRIGGER update_meeting_rsvps_updated_at
  ON gt_meeting_rsvps RENAME TO update_gt_meeting_rsvps_updated_at;

ALTER TRIGGER trigger_auto_refresh_attendance_stats
  ON gt_attendance_records RENAME TO trigger_gt_auto_refresh_attendance_stats;

-- ============================================================================
-- STEP 4: UPDATE FUNCTIONS
-- plpgsql and SQL function bodies reference tables by name at runtime.
-- Renaming tables breaks these functions without explicit updates.
-- ============================================================================

-- get_user_role: references gt_user_roles (was user_roles)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role FROM gt_user_roles WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_user_role IS 'Returns the role of a given user (admin, officer, chair, member, readonly)';

-- user_has_permission: references gt_role_permissions (was role_permissions)
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid UUID,
  resource_name TEXT,
  permission_type TEXT -- 'create', 'read', 'update', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  user_role := get_user_role(user_uuid);

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  CASE permission_type
    WHEN 'create' THEN
      SELECT can_create INTO has_perm FROM gt_role_permissions WHERE role = user_role AND resource = resource_name;
    WHEN 'read' THEN
      SELECT can_read INTO has_perm FROM gt_role_permissions WHERE role = user_role AND resource = resource_name;
    WHEN 'update' THEN
      SELECT can_update INTO has_perm FROM gt_role_permissions WHERE role = user_role AND resource = resource_name;
    WHEN 'delete' THEN
      SELECT can_delete INTO has_perm FROM gt_role_permissions WHERE role = user_role AND resource = resource_name;
    ELSE
      has_perm := FALSE;
  END CASE;

  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_has_permission IS 'Check if user has specific permission for a resource';

-- create_rsvps_for_new_meeting: references gt_meeting_rsvps, gt_members
CREATE OR REPLACE FUNCTION create_rsvps_for_new_meeting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'club_meeting' THEN
    INSERT INTO gt_meeting_rsvps (event_id, member_id, status)
    SELECT NEW.id, m.id, 'no_response'
    FROM gt_members m
    WHERE m.active = true
    ON CONFLICT (event_id, member_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_rsvps_for_new_meeting IS 'Auto-create RSVP records for all active members when new club meeting is created';

-- send_rsvp_reminder: references gt_members, gt_meeting_rsvps
CREATE OR REPLACE FUNCTION send_rsvp_reminder(event_uuid UUID)
RETURNS TABLE(member_id UUID, member_name TEXT, member_email TEXT) AS $$
  SELECT m.id, m.name, m.email
  FROM gt_members m
  INNER JOIN gt_meeting_rsvps r ON m.id = r.member_id
  WHERE r.event_id = event_uuid
    AND r.status = 'no_response'
    AND m.active = true
    AND m.email IS NOT NULL
  ORDER BY m.name;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION send_rsvp_reminder IS 'Get list of members who have not responded to RSVP (for email reminders)';

-- refresh_member_attendance_stats: references gt_member_attendance_stats, gt_members,
--   gt_events, gt_attendance_records
CREATE OR REPLACE FUNCTION refresh_member_attendance_stats(target_member_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  current_rotary_year INTEGER := get_rotary_year(CURRENT_DATE);
  current_rotary_quarter INTEGER := get_rotary_quarter(CURRENT_DATE);
BEGIN
  INSERT INTO gt_member_attendance_stats (
    member_id,
    current_quarter_meetings,
    current_quarter_attended,
    current_quarter_percentage,
    ytd_meetings,
    ytd_attended,
    ytd_percentage,
    lifetime_meetings,
    lifetime_attended,
    lifetime_percentage,
    last_attended_date,
    last_attended_event_id,
    consecutive_absences,
    updated_at
  )
  SELECT
    m.id,

    -- Current quarter
    COUNT(DISTINCT e.id) FILTER (WHERE
      get_rotary_year(e.date) = current_rotary_year
      AND get_rotary_quarter(e.date) = current_rotary_quarter
    ),
    COUNT(DISTINCT a.event_id) FILTER (WHERE
      get_rotary_year(e.date) = current_rotary_year
      AND get_rotary_quarter(e.date) = current_rotary_quarter
    ),
    ROUND(
      COUNT(DISTINCT a.event_id) FILTER (WHERE
        get_rotary_year(e.date) = current_rotary_year
        AND get_rotary_quarter(e.date) = current_rotary_quarter
      )::DECIMAL /
      NULLIF(COUNT(DISTINCT e.id) FILTER (WHERE
        get_rotary_year(e.date) = current_rotary_year
        AND get_rotary_quarter(e.date) = current_rotary_quarter
      ), 0) * 100,
      2
    ),

    -- Year-to-date
    COUNT(DISTINCT e.id) FILTER (WHERE get_rotary_year(e.date) = current_rotary_year),
    COUNT(DISTINCT a.event_id) FILTER (WHERE get_rotary_year(e.date) = current_rotary_year),
    ROUND(
      COUNT(DISTINCT a.event_id) FILTER (WHERE get_rotary_year(e.date) = current_rotary_year)::DECIMAL /
      NULLIF(COUNT(DISTINCT e.id) FILTER (WHERE get_rotary_year(e.date) = current_rotary_year), 0) * 100,
      2
    ),

    -- Lifetime
    COUNT(DISTINCT e.id),
    COUNT(DISTINCT a.event_id),
    ROUND(
      COUNT(DISTINCT a.event_id)::DECIMAL /
      NULLIF(COUNT(DISTINCT e.id), 0) * 100,
      2
    ),

    -- Last attended
    MAX(a.checked_in_at)::DATE,
    (SELECT event_id FROM gt_attendance_records WHERE member_id = m.id ORDER BY checked_in_at DESC LIMIT 1),

    -- Consecutive absences (meetings in last 90 days without attendance)
    (
      SELECT COUNT(*)
      FROM gt_events e2
      WHERE e2.type = 'club_meeting'
        AND e2.date <= CURRENT_DATE
        AND e2.date > CURRENT_DATE - INTERVAL '90 days'
        AND NOT EXISTS (
          SELECT 1 FROM gt_attendance_records a2
          WHERE a2.event_id = e2.id AND a2.member_id = m.id
        )
    ),

    NOW()

  FROM gt_members m
  LEFT JOIN gt_events e ON e.type = 'club_meeting' AND e.date <= CURRENT_DATE
  LEFT JOIN gt_attendance_records a ON a.event_id = e.id AND a.member_id = m.id
  WHERE m.active = true
    AND (target_member_id IS NULL OR m.id = target_member_id)
  GROUP BY m.id

  ON CONFLICT (member_id) DO UPDATE SET
    current_quarter_meetings    = EXCLUDED.current_quarter_meetings,
    current_quarter_attended    = EXCLUDED.current_quarter_attended,
    current_quarter_percentage  = EXCLUDED.current_quarter_percentage,
    ytd_meetings                = EXCLUDED.ytd_meetings,
    ytd_attended                = EXCLUDED.ytd_attended,
    ytd_percentage              = EXCLUDED.ytd_percentage,
    lifetime_meetings           = EXCLUDED.lifetime_meetings,
    lifetime_attended           = EXCLUDED.lifetime_attended,
    lifetime_percentage         = EXCLUDED.lifetime_percentage,
    last_attended_date          = EXCLUDED.last_attended_date,
    last_attended_event_id      = EXCLUDED.last_attended_event_id,
    consecutive_absences        = EXCLUDED.consecutive_absences,
    updated_at                  = EXCLUDED.updated_at;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_member_attendance_stats IS 'Recalculate attendance statistics for member(s). Call after taking attendance.';

-- trigger_refresh_stats_on_attendance: no direct table refs (calls refresh function)
CREATE OR REPLACE FUNCTION trigger_refresh_stats_on_attendance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attendee_type = 'member' AND NEW.member_id IS NOT NULL THEN
    PERFORM refresh_member_attendance_stats(NEW.member_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: RECREATE VIEWS WITH gt_ NAMES AND UPDATED TABLE REFERENCES
-- (views were dropped in STEP 0)
-- ============================================================================

-- RSVP summary per meeting (headcount for meal planning)
CREATE VIEW gt_meeting_rsvp_summary AS
SELECT
  e.id AS event_id,
  e.title AS event_title,
  e.date AS event_date,
  e.location_id AS event_location_id,
  COUNT(*) FILTER (WHERE r.status = 'attending')     AS attending_count,
  COUNT(*) FILTER (WHERE r.status = 'not_attending') AS not_attending_count,
  COUNT(*) FILTER (WHERE r.status = 'maybe')         AS maybe_count,
  COUNT(*) FILTER (WHERE r.status = 'no_response')   AS no_response_count,
  (SELECT COUNT(*) FROM gt_members WHERE active = true) AS total_active_members,
  COALESCE(SUM(r.guest_count) FILTER (WHERE r.status = 'attending'), 0) AS total_guests,
  COUNT(*) FILTER (WHERE r.status = 'attending') +
    COALESCE(SUM(r.guest_count) FILTER (WHERE r.status = 'attending'), 0) AS total_headcount,
  ROUND(
    (COUNT(*) FILTER (WHERE r.status != 'no_response')::DECIMAL /
    NULLIF(COUNT(*), 0) * 100),
    1
  ) AS response_rate_pct,
  COUNT(*) FILTER (WHERE r.dietary_notes IS NOT NULL AND r.dietary_notes != '') AS dietary_restrictions_count
FROM gt_events e
LEFT JOIN gt_meeting_rsvps r ON e.id = r.event_id
WHERE e.type = 'club_meeting'
GROUP BY e.id, e.title, e.date, e.location_id
ORDER BY e.date ASC;

COMMENT ON VIEW gt_meeting_rsvp_summary IS 'Real-time RSVP summary per meeting (headcount for meal planning)';

-- Member RSVP history across all meetings
CREATE VIEW gt_member_rsvp_history AS
SELECT
  m.id AS member_id,
  m.name AS member_name,
  e.id AS event_id,
  e.title AS event_title,
  e.date AS event_date,
  r.status AS rsvp_status,
  r.guest_count,
  r.responded_at,
  NULL::BOOLEAN AS actually_attended
FROM gt_members m
CROSS JOIN gt_events e
LEFT JOIN gt_meeting_rsvps r ON m.id = r.member_id AND e.id = r.event_id
WHERE e.type = 'club_meeting'
ORDER BY m.name, e.date DESC;

COMMENT ON VIEW gt_member_rsvp_history IS 'Member RSVP history across all meetings (for reliability analysis)';

-- Per-meeting attendance summary
CREATE VIEW gt_meeting_attendance_summary AS
SELECT
  e.id AS event_id,
  e.title AS event_title,
  e.date AS event_date,
  e.location_id AS event_location_id,
  COUNT(*) FILTER (WHERE a.attendee_type = 'member')            AS members_attended,
  COUNT(*) FILTER (WHERE a.attendee_type = 'visiting_rotarian') AS visitors_attended,
  COUNT(*) FILTER (WHERE a.attendee_type = 'guest')             AS guests_attended,
  COUNT(*) AS total_headcount,
  (SELECT COUNT(*) FROM gt_members WHERE active = true) AS total_active_members,
  ROUND(
    (COUNT(*) FILTER (WHERE a.attendee_type = 'member')::DECIMAL /
    NULLIF((SELECT COUNT(*) FROM gt_members WHERE active = true), 0) * 100),
    1
  ) AS attendance_percentage,
  COUNT(*) FILTER (WHERE a.guest_is_prospective_member = TRUE) AS prospective_members_count
FROM gt_events e
LEFT JOIN gt_attendance_records a ON e.id = a.event_id
WHERE e.type = 'club_meeting'
GROUP BY e.id, e.title, e.date, e.location_id
ORDER BY e.date DESC;

COMMENT ON VIEW gt_meeting_attendance_summary IS 'Per-meeting attendance summary (headcount, percentage, guests)';

-- Detailed member attendance with RSVP correlation
CREATE VIEW gt_member_attendance_detail AS
SELECT
  m.id AS member_id,
  m.name AS member_name,
  m.classification,
  e.id AS event_id,
  e.title AS event_title,
  e.date AS event_date,
  r.status AS rsvp_status,
  r.responded_at,
  CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END AS attended,
  a.checked_in_at,
  CASE
    WHEN r.status = 'attending'     AND a.id IS NOT NULL THEN 'showed_up'
    WHEN r.status = 'attending'     AND a.id IS NULL     THEN 'no_show'
    WHEN r.status = 'not_attending' AND a.id IS NOT NULL THEN 'surprise_attendance'
    WHEN r.status = 'not_attending' AND a.id IS NULL     THEN 'confirmed_absent'
    WHEN r.status = 'maybe'         AND a.id IS NOT NULL THEN 'maybe_yes'
    WHEN r.status = 'maybe'         AND a.id IS NULL     THEN 'maybe_no'
    WHEN r.status = 'no_response'   AND a.id IS NOT NULL THEN 'attended_no_rsvp'
    WHEN r.status = 'no_response'   AND a.id IS NULL     THEN 'absent_no_rsvp'
    ELSE 'unknown'
  END AS rsvp_accuracy
FROM gt_members m
CROSS JOIN gt_events e
LEFT JOIN gt_meeting_rsvps r ON m.id = r.member_id AND e.id = r.event_id
LEFT JOIN gt_attendance_records a ON m.id = a.member_id AND e.id = a.event_id
WHERE e.type = 'club_meeting'
  AND m.active = true
ORDER BY e.date DESC, m.name;

COMMENT ON VIEW gt_member_attendance_detail IS 'Detailed member attendance with RSVP correlation (reliability tracking)';

-- Members below 60% attendance or 4+ consecutive absences
CREATE VIEW gt_at_risk_members AS
SELECT
  m.id,
  m.name,
  m.email,
  s.ytd_percentage,
  s.consecutive_absences,
  s.last_attended_date,
  CASE
    WHEN s.consecutive_absences >= 4 THEN 'critical'
    WHEN s.ytd_percentage < 50       THEN 'high_risk'
    WHEN s.ytd_percentage < 60       THEN 'moderate_risk'
    ELSE 'low_risk'
  END AS risk_level
FROM gt_members m
LEFT JOIN gt_member_attendance_stats s ON m.id = s.member_id
WHERE m.active = true
  AND (s.ytd_percentage < 60 OR s.consecutive_absences >= 4 OR s.ytd_percentage IS NULL)
ORDER BY
  CASE
    WHEN s.consecutive_absences >= 4 THEN 1
    WHEN s.ytd_percentage < 50       THEN 2
    WHEN s.ytd_percentage < 60       THEN 3
    ELSE 4
  END,
  s.ytd_percentage ASC NULLS LAST;

COMMENT ON VIEW gt_at_risk_members IS 'Members below 60% attendance or 4+ consecutive absences (Rotary attendance requirement)';

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm success)
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'gt_%' ORDER BY tablename;
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'gt_%' ORDER BY viewname;
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%gt_%' ORDER BY indexname;
-- SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE relname LIKE 'gt_%';
-- SELECT proname FROM pg_proc WHERE proname IN ('get_user_role','user_has_permission','create_rsvps_for_new_meeting','send_rsvp_reminder','refresh_member_attendance_stats');
