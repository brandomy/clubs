export interface Club {
  id: string;
  name: string;
  charter_number?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  club_id: string;
  role: 'member' | 'officer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  club_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_type: 'regular' | 'special' | 'demo';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Speech {
  id: string;
  meeting_id: string;
  user_id: string;
  title: string;
  manual: string;
  project_number: number;
  objectives: string[];
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingRole {
  id: string;
  meeting_id: string;
  user_id?: string;
  role_type: 'toastmaster' | 'evaluator' | 'timer' | 'grammarian' | 'ah_counter' | 'table_topics_master';
  created_at: string;
  updated_at: string;
}

export interface MemberProfile {
  id: string;
  user_id: string;
  club_id: string;
  // Public tier data
  photo_url?: string;
  skill_level: string;
  current_skill: string;
  venture_name?: string;
  venture_description?: string;
  venture_stage?: 'idea' | 'mvp' | 'growth' | 'scale' | 'exit';
  industry?: string;
  expertise_areas: string[];
  bio?: string;
  // Member-only tier data
  phone?: string;
  linkedin_url?: string;
  website_url?: string;
  networking_interests: string[];
  looking_for: string[];
  offering: string[];
  speech_count: number;
  evaluation_count: number;
  leadership_roles: string[];
  // Location and demographics
  city?: string;
  country?: string;
  citizenship?: string;
  // Toastmasters-specific fields
  tm_member_number?: string;
  member_type?: 'New' | 'Dual' | 'Transfer' | 'Reinstated';
  officer_role?: string;
  team?: string;
  level?: string;
  completed_skills: string[];
  dtm: boolean;
  // Professional/founder fields
  organization?: string;
  job_title?: string;
  is_founder: boolean;
  is_rotarian: boolean;
  // Administrative fields
  joining_date?: string;
  birthday_month?: string;
  birthday_day?: number;
  age_bracket?: string;
  introducer?: string;
  mentor?: string;
  // Private tier data
  personal_goals?: string;
  communication_goals?: string;
  leadership_goals?: string;
  next_speech_plan?: string;
  feedback_preferences: Record<string, any>;
  officer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacySettings {
  id: string;
  user_id: string;
  club_id: string;
  // Public tier visibility controls
  show_photo: boolean;
  show_venture_info: boolean;
  show_expertise: boolean;
  show_bio: boolean;
  // Member-only tier visibility controls
  show_contact_info: boolean;
  show_social_links: boolean;
  show_networking_interests: boolean;
  show_speech_progress: boolean;
  show_looking_for: boolean;
  show_offering: boolean;
  // Private tier controls
  allow_officer_notes: boolean;
  created_at: string;
  updated_at: string;
}

export interface EcosystemPartner {
  id: string;
  company_name: string;
  company_description?: string;
  company_website?: string;
  industry: string;
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  contact_name?: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  partnership_type: 'investor' | 'accelerator' | 'service_provider' | 'vendor' | 'client' | 'mentor' | 'advisor';
  services_offered: string[];
  location?: string;
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  verification_date?: string;
  added_by?: string;
  status: 'active' | 'inactive' | 'pending_review';
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends User {
  profile?: MemberProfile;
  privacy_settings?: PrivacySettings;
}

export interface PublicPage {
  id: string;
  club_id: string;
  slug: string;
  title: string;
  content: any; // BlockNote JSON document
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// LMS Types
// ============================================================

export type ProjectType = 'speech' | 'assignment' | 'evaluation_exercise' | 'elective';
export type CompletionStatus = 'pending_evaluation' | 'completed' | 'approved_by_officer';
export type BadgeTriggerType = 'project_complete' | 'level_complete' | 'skill_complete';

export interface EvaluationField {
  id: string;
  type: 'rating' | 'textarea' | 'text' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  max?: number;           // for rating fields
  options?: string[];     // for select fields
  placeholder?: string;
}

export interface LearningSkill {
  id: string;
  club_id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  cover_image_url: string | null;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningLevel {
  id: string;
  skill_id: string;
  club_id: string;
  title: string;
  description: string;
  order_index: number;
  required_projects: number;
  content?: any | null; // BlockNote JSON — learning materials for this level
}

export interface EvaluationTemplate {
  id: string;
  club_id: string;
  name: string;
  description: string;
  fields: EvaluationField[];
  created_at: string;
  updated_at: string;
}

export interface LearningProject {
  id: string;
  level_id: string;
  skill_id: string;
  club_id: string;
  title: string;
  description: string;
  content: any; // BlockNote JSON document
  project_type: ProjectType;
  evaluation_template_id: string | null;
  order_index: number;
  is_elective: boolean;
  time_estimate_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface MemberSkillEnrollment {
  id: string;
  member_id: string;
  skill_id: string;
  club_id: string;
  current_level_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface EvaluationSubmission {
  [fieldId: string]: string | number | boolean;
}

export interface MemberProjectCompletion {
  id: string;
  member_id: string;
  project_id: string;
  skill_id: string;
  club_id: string;
  speech_id: string | null;
  status: CompletionStatus;
  evaluation_data: EvaluationSubmission | null;
  evaluator_id: string | null;
  completed_at: string;
  approved_at: string | null;
  notes: string | null;
}

export interface LearningBadge {
  id: string;
  club_id: string;
  name: string;
  description: string;
  image_url: string | null;
  trigger_type: BadgeTriggerType;
  trigger_ref_id: string;
  created_at: string;
}

export interface MemberBadge {
  id: string;
  member_id: string;
  badge_id: string;
  club_id: string;
  earned_at: string;
  speech_id: string | null;
}