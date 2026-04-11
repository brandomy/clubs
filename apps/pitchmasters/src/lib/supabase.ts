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
    };
  };
};