import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MemberWithProfile } from '../types';

interface UseMembersDataResult {
  members: MemberWithProfile[];
  isLoading: boolean;
  error: string | null;
}

export function useMembersData(): UseMembersDataResult {
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        setIsLoading(true);
        setError(null);

        const { data: usersData, error: usersError } = await supabase
          .from('pm_members')
          .select(`
            *,
            profile:member_profiles(*),
            privacy_settings:privacy_settings(*)
          `);

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
  }, []);

  return { members, isLoading, error };
}
