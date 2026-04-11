export type Member = {
  id: string
  prefix?: string
  name: string
  job_title?: string
  birth_month?: number
  birth_day?: number
  gender?: string
  citizenship?: string
  rotary_id?: string
  rotary_profile_url?: string
  rotary_resume?: string
  roles?: string[]  // Changed from single role to array of roles
  type?: string
  rotary_join_date?: string  // When they first joined any Rotary club (original join date)
  member_since?: string  // When they joined Georgetown Rotary Club (current club join date)
  email?: string
  mobile?: string
  phf?: string
  charter_member?: boolean
  classification?: string
  linkedin?: string
  company_name?: string
  company_url?: string
  portrait_url?: string  // Member portrait photo URL (migration 025)
  social_media_links?: Record<string, string>  // Social media platform links (migration 045)
  active: boolean
  created_at: string
  updated_at: string
}

export type Location = {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  whatsapp?: string
  website?: string
  google_maps_link?: string
  facebook?: string
  instagram?: string
  youtube?: string
  key_contact?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ClubEvent = {
  id: string
  date: string
  start_time?: string
  end_time?: string
  type: 'club_meeting' | 'club_assembly' | 'board_meeting' | 'committee_meeting' | 'club_social' | 'service_project' | 'holiday' | 'observance'
  title: string
  description?: string
  agenda?: string
  location_id?: string
  location?: Location
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export type Speaker = {
  id: string
  name: string
  job_title?: string
  email?: string
  phone?: string
  organization?: string
  topic: string
  description?: string
  primary_url?: string
  additional_urls?: string[]
  linkedin_url?: string
  portrait_url?: string
  notes?: string
  status: 'ideas' | 'approached' | 'agreed' | 'scheduled' | 'spoken' | 'dropped'
  scheduled_date?: string
  is_rotarian?: boolean
  rotary_club?: string
  recommend?: boolean
  recommendation_date?: string
  recommendation_notes?: string
  proposer_id?: string
  position: number
  rotary_year_id?: string  // Links speaker to Rotary year when status = 'spoken'
  social_media_links?: Record<string, string>  // Social media platform links (migration 044)
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export type Partner = {
  id: string
  name: string
  type: 'Rotary Club' | 'Foundation' | 'NGO' | 'Corporate' | 'Government'
  contact_info?: string          // Legacy field (keep for backward compatibility)
  contact_name?: string           // Primary contact person name (migration 026)
  contact_email?: string          // Primary contact email (migration 026)
  contact_phone?: string          // Primary contact phone (migration 026)
  contact_title?: string          // Contact person role/title (migration 041)
  website?: string                // Partner organization website (migration 026)
  status?: 'Active' | 'Inactive' // Partner relationship status (migration 026)
  relationship_since?: string     // Date when partnership began (migration 026)
  logo_url?: string               // Partner logo URL (migration 026)
  description?: string            // Partner mission and background (migration 041)
  primary_contact_rotarian_id?: string  // Club liaison member ID (migration 041)
  collaboration_areas?: string[]  // Rotary Areas of Focus alignment (migration 041)
  next_review_date?: string       // Partnership review date (migration 041)
  mou_signed_date?: string        // MOU signed date (migration 041)
  partnership_value_rm?: number   // Total partnership value in RM (migration 041)
  city?: string                   // Partner city location (migration 042)
  country?: string                // Partner country location (migration 042)
  social_media_links?: Record<string, string>  // Social media platform links (migration 043)
  created_at: string
  updated_at: string
}

// Social media platform types
export type SocialMediaPlatform =
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'whatsapp'
  | 'wechat'
  | 'telegram'
  | 'youtube'
  | 'tiktok'
  | 'line'
  | 'kakaotalk'

export type ServiceProject = {
  id: string
  project_name: string
  description?: string
  area_of_focus: 'Peace' | 'Disease' | 'Water' | 'Maternal/Child' | 'Education' | 'Economy' | 'Environment'
  status: 'Idea' | 'Planning' | 'Approved' | 'Execution' | 'Completed' | 'Dropped'
  type: 'Global Grant' | 'Club' | 'Joint'
  champion: string
  project_value_rm?: number
  start_date: string
  end_date?: string
  project_year: number
  grant_number?: string
  district_grant_number?: string  // District grant tracking (migration 041)
  beneficiary_count?: number
  location?: string
  image_url?: string
  image_position?: string
  impact?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  partners?: Partner[]
  // Timeline system fields
  rotary_year_id?: string
  completion_date?: string
  lessons_learned?: string
  would_repeat?: 'yes' | 'no' | 'modified'
  repeat_recommendations?: string
  // Enhanced tracking fields (migration 041)
  volunteer_hours?: number        // Total volunteer hours contributed
  funding_source?: 'Club Funds' | 'Global Grant' | 'District Grant' | 'Fundraising' | 'Corporate Sponsor' | 'Mixed Funding'
  matching_grant_value_rm?: number  // Matching funds received
  project_committee_members?: string[]  // Team members beyond champion
  sustainability_plan?: string    // Post-project sustainability strategy
  publicity_urls?: string[]       // Media coverage and PR links
  collaboration_type?: 'Club-Led' | 'Joint (Multi-Club)' | 'Partner-Led (Club Support)' | 'District-Wide'
  beneficiary_demographics?: Record<string, any>  // Detailed impact data (JSONB)
  rotary_citation_eligible?: boolean  // Presidential Citation eligibility
  follow_up_date?: string         // Post-completion impact assessment date
  risk_assessment?: string        // Identified risks and challenges
}

export type Photo = {
  id: string

  // Storage reference
  url: string
  storage_path?: string
  thumbnail_url?: string

  // Photo metadata
  title?: string
  caption?: string
  photo_date?: string
  photographer_name?: string
  location?: string

  // Relationships (nullable)
  rotary_year_id?: string
  event_id?: string
  project_id?: string

  // Organization
  category: 'event' | 'fellowship' | 'service' | 'community' | 'members' | 'general'
  tags: string[]
  is_featured: boolean
  display_order: number

  // Permissions
  visibility: 'public' | 'members_only' | 'officers_only' | 'private'
  approval_status: 'pending' | 'approved' | 'rejected'
  approval_notes?: string

  // Technical metadata
  width?: number
  height?: number
  file_size?: number
  mime_type?: string

  // Audit
  uploaded_by?: string
  approved_by?: string
  created_at: string
  updated_at: string
}

export type RotaryYear = {
  id: string
  rotary_year: string
  start_date: string
  end_date: string

  // Club information
  club_name: string
  club_number: number
  district_number: number
  charter_date: string

  // Club president theme
  club_president_name: string
  club_president_theme?: string
  club_president_theme_logo_url?: string
  club_president_photo_url?: string

  // Rotary International president theme
  ri_president_name?: string
  ri_president_theme?: string
  ri_president_theme_logo_url?: string

  // District governor theme
  dg_name?: string
  dg_theme?: string
  dg_theme_logo_url?: string
  district_governor_photo_url?: string

  // Annual documentation
  summary?: string
  narrative?: string
  highlights: { title: string; description: string }[]
  challenges: { issue: string; resolution: string }[]
  member_count_year_end?: number
  stats: {
    meetings?: number
    speakers?: number
    projects?: number
    beneficiaries?: number
    project_value_rm?: number
    volunteer_hours?: number
  }
  photos: { url: string; caption: string }[]
  created_at: string
  updated_at: string
}

// Migration 054: User Roles and Permissions
export type UserRole = {
  id: string
  user_id: string
  member_id?: string
  role: 'admin' | 'officer' | 'chair' | 'member' | 'readonly'
  club_id?: string
  granted_by?: string
  granted_at: string
  created_at: string
  updated_at: string
}

export type RolePermission = {
  id: string
  role: 'admin' | 'officer' | 'chair' | 'member' | 'readonly'
  resource: 'speakers' | 'members' | 'events' | 'attendance' | 'projects' | 'partners' | 'timeline' | 'settings'
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  notes?: string
  created_at: string
}

// Migration 055: Meeting RSVP System
export type MeetingRSVP = {
  id: string
  event_id: string
  member_id: string
  status: 'attending' | 'not_attending' | 'maybe' | 'no_response'
  guest_count: number
  guest_names?: string[]
  dietary_notes?: string
  special_requests?: string
  responded_at?: string
  created_at: string
  updated_at: string
}

export type MeetingRSVPSummary = {
  event_id: string
  event_title: string
  event_date: string
  event_location_id?: string
  attending_count: number
  not_attending_count: number
  maybe_count: number
  no_response_count: number
  total_active_members: number
  total_guests: number
  total_headcount: number
  response_rate_pct: number
  dietary_restrictions_count: number
}

// Migration 056: Attendance Records and Statistics
export type AttendanceRecord = {
  id: string
  event_id: string
  attendee_type: 'member' | 'visiting_rotarian' | 'guest'
  member_id?: string
  visitor_name?: string
  visitor_club?: string
  visitor_district?: string
  guest_name?: string
  guest_hosted_by?: string
  guest_is_prospective_member?: boolean
  guest_contact_info?: string
  checked_in_at: string
  checked_in_by?: string
  notes?: string
  created_at: string
}

export type MemberAttendanceStats = {
  member_id: string
  current_quarter_meetings: number
  current_quarter_attended: number
  current_quarter_percentage?: number
  ytd_meetings: number
  ytd_attended: number
  ytd_percentage?: number
  lifetime_meetings: number
  lifetime_attended: number
  lifetime_percentage?: number
  makeups_credited: number
  last_attended_date?: string
  last_attended_event_id?: string
  consecutive_absences: number
  longest_attendance_streak: number
  updated_at: string
}

export type MeetingAttendanceSummary = {
  event_id: string
  event_title: string
  event_date: string
  event_location_id?: string
  members_attended: number
  visitors_attended: number
  guests_attended: number
  total_headcount: number
  total_active_members: number
  attendance_percentage: number
  prospective_members_count: number
}

export type Database = {
  public: {
    Tables: {
      gt_speakers: {
        Row: Speaker
        Insert: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Speaker, 'id' | 'created_at'>>
      }
      gt_members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      gt_events: {
        Row: ClubEvent
        Insert: Omit<ClubEvent, 'id' | 'created_at' | 'updated_at' | 'location'>
        Update: Partial<Omit<ClubEvent, 'id' | 'created_at' | 'location'>>
      }
      gt_locations: {
        Row: Location
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Location, 'id' | 'created_at'>>
      }
      gt_partners: {
        Row: Partner
        Insert: Omit<Partner, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Partner, 'id' | 'created_at'>>
      }
      gt_service_projects: {
        Row: ServiceProject
        Insert: Omit<ServiceProject, 'id' | 'created_at' | 'updated_at' | 'project_year' | 'partners'>
        Update: Partial<Omit<ServiceProject, 'id' | 'created_at' | 'project_year' | 'partners'>>
      }
      gt_rotary_years: {
        Row: RotaryYear
        Insert: Omit<RotaryYear, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<RotaryYear, 'id' | 'created_at'>>
      }
      gt_user_roles: {
        Row: UserRole
        Insert: Omit<UserRole, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserRole, 'id' | 'created_at'>>
      }
      gt_role_permissions: {
        Row: RolePermission
        Insert: Omit<RolePermission, 'id' | 'created_at'>
        Update: Partial<Omit<RolePermission, 'id' | 'created_at'>>
      }
      gt_meeting_rsvps: {
        Row: MeetingRSVP
        Insert: Omit<MeetingRSVP, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MeetingRSVP, 'id' | 'created_at'>>
      }
      gt_attendance_records: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id' | 'created_at' | 'checked_in_at'>
        Update: Partial<Omit<AttendanceRecord, 'id' | 'created_at' | 'checked_in_at'>>
      }
      gt_member_attendance_stats: {
        Row: MemberAttendanceStats
        Insert: Omit<MemberAttendanceStats, 'updated_at'>
        Update: Partial<Omit<MemberAttendanceStats, 'member_id' | 'updated_at'>>
      }
    }
  }
}