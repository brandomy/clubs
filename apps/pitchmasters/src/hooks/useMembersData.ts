import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { MemberWithProfile } from '../types';

interface UseMembersDataResult {
  members: MemberWithProfile[];
  isLoading: boolean;
  error: string | null;
}

export function useMembersData(): UseMembersDataResult {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers(): Promise<void> {
      if (!user?.club_id) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data: usersData, error: usersError } = await supabase
          .from('pm_members')
          .select(`
            *,
            profile:pm_member_profiles(*),
            privacy_settings:pm_privacy_settings(*)
          `)
          .eq('club_id', user.club_id);

        if (usersError) throw usersError;

        const membersWithProfiles: MemberWithProfile[] = (usersData || []).map((user: MemberWithProfile) => ({
          ...user,
          profile: user.profile ?? undefined,
          privacy_settings: user.privacy_settings ?? undefined,
        }));

        setMembers(membersWithProfiles);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load members';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, [user?.club_id]);

  return { members, isLoading, error };
}
