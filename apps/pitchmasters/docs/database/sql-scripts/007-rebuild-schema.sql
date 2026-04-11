-- ============================================================
-- Migration: 007-rebuild-schema.sql
-- Purpose: Complete schema rebuild with pm_ prefix convention
-- Updated: 2026-04-11 — renamed all tables to pm_ prefix to prevent
--          collision with Georgetown (gt_) tables in shared Supabase project.
--          users → pm_members, clubs → pm_clubs, added pm_guests.
--          member_profiles synced to match TypeScript MemberProfile interface.
-- Prerequisites: Shared Supabase project (Georgetown tables unaffected)
-- WARNING: Drops all Pitchmasters tables — use for complete rebuild only
-- ============================================================

-- Drop all Pitchmasters tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS partner_reviews CASCADE;
DROP TABLE IF EXISTS pm_partner_reviews CASCADE;
DROP TABLE IF EXISTS ecosystem_partners CASCADE;
DROP TABLE IF EXISTS pm_ecosystem_partners CASCADE;
DROP TABLE IF EXISTS pathways_progress CASCADE;
DROP TABLE IF EXISTS pm_pathways_progress CASCADE;
DROP TABLE IF EXISTS speech_evaluations CASCADE;
DROP TABLE IF EXISTS pm_speech_evaluations CASCADE;
DROP TABLE IF EXISTS privacy_settings CASCADE;
DROP TABLE IF EXISTS pm_privacy_settings CASCADE;
DROP TABLE IF EXISTS member_profiles CASCADE;
DROP TABLE IF EXISTS pm_member_profiles CASCADE;
DROP TABLE IF EXISTS meeting_roles CASCADE;
DROP TABLE IF EXISTS pm_meeting_roles CASCADE;
DROP TABLE IF EXISTS speeches CASCADE;
DROP TABLE IF EXISTS pm_speeches CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS pm_meetings CASCADE;
DROP TABLE IF EXISTS pm_guests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS pm_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS pm_clubs CASCADE;
DROP TABLE IF EXISTS pm_public_pages CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Clubs table (top-level tenant isolation)
CREATE TABLE pm_clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    charter_number VARCHAR(50) UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table (Toastmasters club members, scoped to clubs)
-- Note: "member" is the domain term — not "user"
CREATE TABLE pm_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('member', 'officer', 'admin')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, club_id)
);

-- Helper function used by RLS policies (security definer — runs as owner)
-- Defined here, after pm_members exists, since SQL functions validate at creation time
CREATE OR REPLACE FUNCTION get_current_user_club_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT club_id FROM pm_members WHERE id = auth.uid() LIMIT 1;
$$;

-- Guests table (visitors who attend meetings, potential new members)
CREATE TABLE pm_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    company VARCHAR(200),
    job_title VARCHAR(100),
    invited_by UUID REFERENCES pm_members(id) ON DELETE SET NULL,
    visit_date DATE,
    meeting_id UUID,  -- FK added after pm_meetings is created
    status VARCHAR(20) CHECK (status IN ('visited', 'interested', 'joined', 'declined')) DEFAULT 'visited',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meetings table
CREATE TABLE pm_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_type VARCHAR(20) CHECK (meeting_type IN ('regular', 'special', 'demo')) DEFAULT 'regular',
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wire up pm_guests.meeting_id FK now that pm_meetings exists
ALTER TABLE pm_guests
    ADD CONSTRAINT fk_guests_meeting
    FOREIGN KEY (meeting_id) REFERENCES pm_meetings(id) ON DELETE SET NULL;

-- Speeches table
CREATE TABLE pm_speeches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES pm_meetings(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    manual VARCHAR(100) NOT NULL,
    project_number INTEGER NOT NULL,
    objectives TEXT[] DEFAULT '{}',
    duration_minutes INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting roles table
CREATE TABLE pm_meeting_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES pm_meetings(id) ON DELETE CASCADE,
    member_id UUID REFERENCES pm_members(id) ON DELETE SET NULL,
    role_type VARCHAR(30) CHECK (role_type IN ('toastmaster', 'evaluator', 'timer', 'grammarian', 'ah_counter', 'table_topics_master')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, role_type)
);

-- =====================================================
-- EXTENDED PROFILE TABLES
-- =====================================================

-- Member profiles with multi-tier data structure
-- Fields synced to TypeScript MemberProfile interface
CREATE TABLE pm_member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE UNIQUE,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,

    -- Public tier data
    photo_url VARCHAR(500),
    path_level VARCHAR(50) DEFAULT 'Level 1',
    current_path VARCHAR(100) DEFAULT 'Dynamic Leadership',
    venture_name VARCHAR(200),
    venture_description TEXT,
    venture_stage VARCHAR(50) CHECK (venture_stage IN ('idea', 'mvp', 'growth', 'scale', 'exit')),
    industry VARCHAR(100),
    expertise_areas TEXT[] DEFAULT '{}',
    bio TEXT,

    -- Location and demographics
    city VARCHAR(100),
    country VARCHAR(100),
    citizenship VARCHAR(100),

    -- Member-only tier data
    phone VARCHAR(30),
    linkedin_url VARCHAR(500),
    website_url VARCHAR(500),
    networking_interests TEXT[] DEFAULT '{}',
    looking_for TEXT[] DEFAULT '{}',
    offering TEXT[] DEFAULT '{}',
    speech_count INTEGER DEFAULT 0,
    evaluation_count INTEGER DEFAULT 0,
    leadership_roles TEXT[] DEFAULT '{}',

    -- Toastmasters-specific fields
    tm_member_number VARCHAR(50),
    member_type VARCHAR(20) CHECK (member_type IN ('New', 'Dual', 'Transfer', 'Reinstated')),
    officer_role VARCHAR(100),
    team VARCHAR(100),
    level VARCHAR(50),
    completed_pathways TEXT[] DEFAULT '{}',
    dtm BOOLEAN DEFAULT false,

    -- Professional / founder fields
    organization VARCHAR(200),
    job_title VARCHAR(100),
    is_founder BOOLEAN DEFAULT false,
    is_rotarian BOOLEAN DEFAULT false,

    -- Administrative fields
    joining_date DATE,
    birthday_month VARCHAR(20),
    birthday_day INTEGER CHECK (birthday_day BETWEEN 1 AND 31),
    age_bracket VARCHAR(20),
    introducer VARCHAR(255),
    mentor VARCHAR(255),

    -- Private tier data
    personal_goals TEXT,
    communication_goals TEXT,
    leadership_goals TEXT,
    next_speech_plan TEXT,
    feedback_preferences JSONB DEFAULT '{}',
    officer_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy settings table (granular visibility controls)
CREATE TABLE pm_privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE UNIQUE,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,

    -- Public tier visibility controls
    show_photo BOOLEAN DEFAULT true,
    show_venture_info BOOLEAN DEFAULT true,
    show_expertise BOOLEAN DEFAULT true,
    show_bio BOOLEAN DEFAULT true,

    -- Member-only tier visibility controls
    show_contact_info BOOLEAN DEFAULT true,
    show_social_links BOOLEAN DEFAULT true,
    show_networking_interests BOOLEAN DEFAULT true,
    show_speech_progress BOOLEAN DEFAULT true,
    show_looking_for BOOLEAN DEFAULT true,
    show_offering BOOLEAN DEFAULT true,

    -- Private tier controls
    allow_officer_notes BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Speech evaluations with privacy controls
CREATE TABLE pm_speech_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    speech_id UUID NOT NULL REFERENCES pm_speeches(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,

    -- Public evaluation data
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    public_feedback TEXT,

    -- Private evaluation data
    detailed_feedback TEXT,
    strengths TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    specific_recommendations TEXT,

    -- Evaluation settings
    is_public BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(speech_id, evaluator_id)
);

-- Pathways progress tracking
CREATE TABLE pm_pathways_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,

    path_name VARCHAR(100) NOT NULL,
    level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 5),
    project_number INTEGER NOT NULL CHECK (project_number BETWEEN 1 AND 11),
    project_title VARCHAR(200) NOT NULL,
    completion_date DATE,
    speech_id UUID REFERENCES pm_speeches(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, path_name, level_number, project_number)
);

-- Ecosystem partners (member-only access)
CREATE TABLE pm_ecosystem_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Partner company information
    company_name VARCHAR(200) NOT NULL,
    company_description TEXT,
    company_website VARCHAR(500),
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),

    -- Contact information
    contact_name VARCHAR(200),
    contact_title VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(30),

    -- Partnership details
    partnership_type VARCHAR(50) CHECK (partnership_type IN ('investor', 'accelerator', 'service_provider', 'vendor', 'client', 'mentor', 'advisor')) NOT NULL,
    services_offered TEXT[] DEFAULT '{}',
    location VARCHAR(200),

    -- Rating and verification
    average_rating DECIMAL(2,1) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verification_date DATE,

    -- Metadata
    added_by UUID REFERENCES pm_members(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending_review')) DEFAULT 'pending_review',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner reviews (member feedback)
CREATE TABLE pm_partner_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES pm_ecosystem_partners(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES pm_members(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES pm_clubs(id) ON DELETE CASCADE,

    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    would_recommend BOOLEAN,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partner_id, reviewer_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_pm_members_club_id ON pm_members(club_id);
CREATE INDEX idx_pm_guests_club_id ON pm_guests(club_id);
CREATE INDEX idx_pm_guests_meeting_id ON pm_guests(meeting_id);
CREATE INDEX idx_pm_guests_invited_by ON pm_guests(invited_by);
CREATE INDEX idx_pm_meetings_club_id ON pm_meetings(club_id);
CREATE INDEX idx_pm_meetings_date ON pm_meetings(date);
CREATE INDEX idx_pm_speeches_meeting_id ON pm_speeches(meeting_id);
CREATE INDEX idx_pm_speeches_member_id ON pm_speeches(member_id);
CREATE INDEX idx_pm_meeting_roles_meeting_id ON pm_meeting_roles(meeting_id);

CREATE INDEX idx_pm_member_profiles_club_id ON pm_member_profiles(club_id);
CREATE INDEX idx_pm_member_profiles_member_id ON pm_member_profiles(member_id);
CREATE INDEX idx_pm_member_profiles_industry ON pm_member_profiles(industry);
CREATE INDEX idx_pm_member_profiles_venture_stage ON pm_member_profiles(venture_stage);
CREATE INDEX idx_pm_member_profiles_path_level ON pm_member_profiles(path_level);

CREATE INDEX idx_pm_privacy_settings_member_id ON pm_privacy_settings(member_id);
CREATE INDEX idx_pm_privacy_settings_club_id ON pm_privacy_settings(club_id);

CREATE INDEX idx_pm_speech_evaluations_speech_id ON pm_speech_evaluations(speech_id);
CREATE INDEX idx_pm_speech_evaluations_club_id ON pm_speech_evaluations(club_id);

CREATE INDEX idx_pm_pathways_progress_member_id ON pm_pathways_progress(member_id);
CREATE INDEX idx_pm_pathways_progress_club_id ON pm_pathways_progress(club_id);

CREATE INDEX idx_pm_ecosystem_partners_industry ON pm_ecosystem_partners(industry);
CREATE INDEX idx_pm_ecosystem_partners_type ON pm_ecosystem_partners(partnership_type);
CREATE INDEX idx_pm_ecosystem_partners_status ON pm_ecosystem_partners(status);

CREATE INDEX idx_pm_partner_reviews_partner_id ON pm_partner_reviews(partner_id);
CREATE INDEX idx_pm_partner_reviews_club_id ON pm_partner_reviews(club_id);

-- =====================================================
-- TRIGGERS (auto-update updated_at)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pm_clubs_updated_at BEFORE UPDATE ON pm_clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_members_updated_at BEFORE UPDATE ON pm_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_guests_updated_at BEFORE UPDATE ON pm_guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_meetings_updated_at BEFORE UPDATE ON pm_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_speeches_updated_at BEFORE UPDATE ON pm_speeches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_meeting_roles_updated_at BEFORE UPDATE ON pm_meeting_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_member_profiles_updated_at BEFORE UPDATE ON pm_member_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_privacy_settings_updated_at BEFORE UPDATE ON pm_privacy_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_speech_evaluations_updated_at BEFORE UPDATE ON pm_speech_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_pathways_progress_updated_at BEFORE UPDATE ON pm_pathways_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_ecosystem_partners_updated_at BEFORE UPDATE ON pm_ecosystem_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_partner_reviews_updated_at BEFORE UPDATE ON pm_partner_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE pm_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_speeches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_meeting_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_speech_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_pathways_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_ecosystem_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_partner_reviews ENABLE ROW LEVEL SECURITY;

-- Club isolation
CREATE POLICY "Members can view own club" ON pm_clubs
    FOR SELECT USING (id = get_current_user_club_id());

CREATE POLICY "Members can view club members" ON pm_members
    FOR SELECT USING (club_id = get_current_user_club_id());

CREATE POLICY "Officers can manage members" ON pm_members
    FOR ALL USING (
        club_id = get_current_user_club_id() AND
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role IN ('officer', 'admin'))
    );

-- Guests (officers and admins manage; members can view)
CREATE POLICY "Members can view guests" ON pm_guests
    FOR SELECT USING (club_id = get_current_user_club_id());

CREATE POLICY "Officers can manage guests" ON pm_guests
    FOR ALL USING (
        club_id = get_current_user_club_id() AND
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role IN ('officer', 'admin'))
    );

-- Meetings
CREATE POLICY "Members can view club meetings" ON pm_meetings
    FOR SELECT USING (club_id = get_current_user_club_id());

CREATE POLICY "Officers can manage meetings" ON pm_meetings
    FOR ALL USING (
        club_id = get_current_user_club_id() AND
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role IN ('officer', 'admin'))
    );

-- Speeches
CREATE POLICY "Members can view club speeches" ON pm_speeches
    FOR SELECT USING (
        meeting_id IN (SELECT id FROM pm_meetings WHERE club_id = get_current_user_club_id())
    );

CREATE POLICY "Members can create speeches" ON pm_speeches
    FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members update own speeches" ON pm_speeches
    FOR UPDATE USING (member_id = auth.uid());

-- Meeting roles
CREATE POLICY "Members can view meeting roles" ON pm_meeting_roles
    FOR SELECT USING (
        meeting_id IN (SELECT id FROM pm_meetings WHERE club_id = get_current_user_club_id())
    );

CREATE POLICY "Officers can manage meeting roles" ON pm_meeting_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role IN ('officer', 'admin'))
    );

-- Member profiles (multi-tier)
CREATE POLICY "Public profile access" ON pm_member_profiles
    FOR SELECT USING (
        member_id = auth.uid() OR
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Members can create own profile" ON pm_member_profiles
    FOR INSERT WITH CHECK (
        member_id = auth.uid() AND
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Members update own profile" ON pm_member_profiles
    FOR UPDATE USING (member_id = auth.uid());

-- Privacy settings
CREATE POLICY "Member controls own privacy" ON pm_privacy_settings
    FOR ALL USING (member_id = auth.uid());

-- Ecosystem partners (members-only)
CREATE POLICY "Members can view partners" ON pm_ecosystem_partners
    FOR SELECT USING (EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid()));

CREATE POLICY "Members can add partners" ON pm_ecosystem_partners
    FOR INSERT WITH CHECK (added_by = auth.uid());

CREATE POLICY "Admins can manage partners" ON pm_ecosystem_partners
    FOR UPDATE USING (
        added_by = auth.uid() OR
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role = 'admin')
    );

-- Partner reviews
CREATE POLICY "Members can view reviews" ON pm_partner_reviews
    FOR SELECT USING (club_id = get_current_user_club_id());

CREATE POLICY "Members can submit reviews" ON pm_partner_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Reviewers update own reviews" ON pm_partner_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- Speech evaluations
CREATE POLICY "Speech evaluation access" ON pm_speech_evaluations
    FOR SELECT USING (
        speech_id IN (SELECT id FROM pm_speeches WHERE member_id = auth.uid()) OR
        evaluator_id = auth.uid() OR
        (is_public = true AND club_id = get_current_user_club_id()) OR
        EXISTS (SELECT 1 FROM pm_members WHERE id = auth.uid() AND role IN ('officer', 'admin'))
    );

CREATE POLICY "Members can create evaluations" ON pm_speech_evaluations
    FOR INSERT WITH CHECK (
        evaluator_id = auth.uid() AND
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Evaluators update own evaluations" ON pm_speech_evaluations
    FOR UPDATE USING (evaluator_id = auth.uid());

-- Pathways progress
CREATE POLICY "Members can view pathways" ON pm_pathways_progress
    FOR SELECT USING (
        member_id = auth.uid() OR
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Members can track own pathways" ON pm_pathways_progress
    FOR INSERT WITH CHECK (
        member_id = auth.uid() AND
        club_id = get_current_user_club_id()
    );

CREATE POLICY "Members update own pathways" ON pm_pathways_progress
    FOR UPDATE USING (member_id = auth.uid());

-- =====================================================
-- SAMPLE DATA
-- =====================================================

INSERT INTO pm_clubs (name, charter_number, timezone) VALUES
    ('Pitchmasters Toastmasters', '12345', 'Asia/Singapore')
ON CONFLICT DO NOTHING;

-- Schema rebuild complete!
-- Next: run 008-public-pages.sql
