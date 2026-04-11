import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      pm_clubs: {
        Row: {
          id: string;
          name: string;
          charter_number: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          charter_number?: string | null;
          timezone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          charter_number?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pm_members: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          club_id: string;
          role: 'member' | 'officer' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          club_id: string;
          role?: 'member' | 'officer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          club_id?: string;
          role?: 'member' | 'officer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      pm_meetings: {
        Row: {
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
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          meeting_type?: 'regular' | 'special' | 'demo';
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          title?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          meeting_type?: 'regular' | 'special' | 'demo';
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      pm_speeches: {
        Row: {
          id: string;
          meeting_id: string;
          member_id: string;
          title: string;
          manual: string;
          project_number: number;
          objectives: string[];
          duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          member_id: string;
          title: string;
          manual: string;
          project_number: number;
          objectives: string[];
          duration_minutes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          member_id?: string;
          title?: string;
          manual?: string;
          project_number?: number;
          objectives?: string[];
          duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      pm_meeting_roles: {
        Row: {
          id: string;
          meeting_id: string;
          member_id: string | null;
          role_type: 'toastmaster' | 'evaluator' | 'timer' | 'grammarian' | 'ah_counter' | 'table_topics_master';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          member_id?: string | null;
          role_type: 'toastmaster' | 'evaluator' | 'timer' | 'grammarian' | 'ah_counter' | 'table_topics_master';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_id?: string;
          member_id?: string | null;
          role_type?: 'toastmaster' | 'evaluator' | 'timer' | 'grammarian' | 'ah_counter' | 'table_topics_master';
          created_at?: string;
          updated_at?: string;
        };
      };
      pm_public_pages: {
        Row: {
          id: string;
          club_id: string;
          slug: string;
          title: string;
          content: any;
          published: boolean;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          slug: string;
          title: string;
          content?: any;
          published?: boolean;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          content?: any;
          published?: boolean;
          author_id?: string | null;
          updated_at?: string;
        };
      };
      pm_learning_paths: {
        Row: {
          id: string;
          club_id: string;
          title: string;
          description: string;
          slug: string;
          published: boolean;
          cover_image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          title: string;
          description?: string;
          slug: string;
          published?: boolean;
          cover_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          slug?: string;
          published?: boolean;
          cover_image_url?: string | null;
          updated_at?: string;
        };
      };
      pm_learning_levels: {
        Row: {
          id: string;
          path_id: string;
          club_id: string;
          title: string;
          description: string;
          order_index: number;
          required_projects: number;
        };
        Insert: {
          id?: string;
          path_id: string;
          club_id: string;
          title: string;
          description?: string;
          order_index?: number;
          required_projects?: number;
        };
        Update: {
          title?: string;
          description?: string;
          order_index?: number;
          required_projects?: number;
        };
      };
      pm_evaluation_templates: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          description: string;
          fields: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          description?: string;
          fields?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          fields?: any;
          updated_at?: string;
        };
      };
      pm_learning_projects: {
        Row: {
          id: string;
          level_id: string;
          path_id: string;
          club_id: string;
          title: string;
          description: string;
          content: any;
          project_type: 'speech' | 'assignment' | 'evaluation_exercise' | 'elective';
          evaluation_template_id: string | null;
          order_index: number;
          is_elective: boolean;
          time_estimate_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          level_id: string;
          path_id: string;
          club_id: string;
          title: string;
          description?: string;
          content?: any;
          project_type?: 'speech' | 'assignment' | 'evaluation_exercise' | 'elective';
          evaluation_template_id?: string | null;
          order_index?: number;
          is_elective?: boolean;
          time_estimate_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          content?: any;
          project_type?: 'speech' | 'assignment' | 'evaluation_exercise' | 'elective';
          evaluation_template_id?: string | null;
          order_index?: number;
          is_elective?: boolean;
          time_estimate_minutes?: number | null;
          updated_at?: string;
        };
      };
      pm_member_path_enrollments: {
        Row: {
          id: string;
          member_id: string;
          path_id: string;
          club_id: string;
          current_level_id: string | null;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          path_id: string;
          club_id: string;
          current_level_id?: string | null;
          enrolled_at?: string;
          completed_at?: string | null;
        };
        Update: {
          current_level_id?: string | null;
          completed_at?: string | null;
        };
      };
      pm_member_project_completions: {
        Row: {
          id: string;
          member_id: string;
          project_id: string;
          path_id: string;
          club_id: string;
          speech_id: string | null;
          status: 'pending_evaluation' | 'completed' | 'approved_by_officer';
          evaluation_data: any | null;
          evaluator_id: string | null;
          completed_at: string;
          approved_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          project_id: string;
          path_id: string;
          club_id: string;
          speech_id?: string | null;
          status?: 'pending_evaluation' | 'completed' | 'approved_by_officer';
          evaluation_data?: any | null;
          evaluator_id?: string | null;
          completed_at?: string;
          approved_at?: string | null;
          notes?: string | null;
        };
        Update: {
          speech_id?: string | null;
          status?: 'pending_evaluation' | 'completed' | 'approved_by_officer';
          evaluation_data?: any | null;
          evaluator_id?: string | null;
          approved_at?: string | null;
          notes?: string | null;
        };
      };
      pm_learning_badges: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          description: string;
          image_url: string | null;
          trigger_type: 'project_complete' | 'level_complete' | 'path_complete';
          trigger_ref_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          description?: string;
          image_url?: string | null;
          trigger_type: 'project_complete' | 'level_complete' | 'path_complete';
          trigger_ref_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          image_url?: string | null;
        };
      };
      pm_member_badges: {
        Row: {
          id: string;
          member_id: string;
          badge_id: string;
          club_id: string;
          earned_at: string;
          speech_id: string | null;
        };
        Insert: {
          id?: string;
          member_id: string;
          badge_id: string;
          club_id: string;
          earned_at?: string;
          speech_id?: string | null;
        };
        Update: {
          speech_id?: string | null;
        };
      };
    };
  };
};