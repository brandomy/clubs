import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PublicPage, PageVisibility } from '../types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

// Fall back to the env-configured club ID so unauthenticated visitors can
// still read public pages via the RLS "pm_public_pages_read_public" policy.
const FALLBACK_CLUB_ID = import.meta.env.VITE_DEMO_CLUB_ID as string | undefined;

export function usePublicPages(clubId: string | null) {
  const resolvedClubId = clubId ?? FALLBACK_CLUB_ID ?? null;
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!resolvedClubId) {
      setPages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pm_public_pages')
        .select('*')
        .eq('club_id', resolvedClubId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPages(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [resolvedClubId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const getPage = useCallback(async (slug: string): Promise<PublicPage | null> => {
    if (!resolvedClubId) return null;

    const fetchPromise = supabase
      .from('pm_public_pages')
      .select('*')
      .eq('club_id', resolvedClubId)
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => (error ? null : (data as PublicPage)));

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );

    return Promise.race([fetchPromise, timeoutPromise]);
  }, [resolvedClubId]);

  const savePage = useCallback(async (
    page: Partial<PublicPage> & { title: string; content: any }
  ): Promise<PublicPage | null> => {
    // Write operations require an authenticated club member — don't use fallback
    if (!clubId) return null;

    const slug = page.slug || generateSlug(page.title);

    try {
      if (page.id) {
        const { data, error: updateError } = await supabase
          .from('pm_public_pages')
          .update({
            title: page.title,
            slug,
            content: page.content,
            visibility: page.visibility ?? 'draft',
          })
          .eq('id', page.id)
          .select()
          .single();

        if (updateError) throw updateError;
        await fetchPages();
        return data;
      } else {
        const { data, error: insertError } = await supabase
          .from('pm_public_pages')
          .insert({
            club_id: clubId,
            title: page.title,
            slug,
            content: page.content,
            visibility: page.visibility ?? 'draft',
            author_id: page.author_id ?? null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        await fetchPages();
        return data;
      }
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save page');
    }
  }, [clubId, fetchPages]);

  const setVisibility = useCallback(async (pageId: string, visibility: PageVisibility): Promise<void> => {
    const { error: updateError } = await supabase
      .from('pm_public_pages')
      .update({ visibility })
      .eq('id', pageId);

    if (updateError) throw new Error(updateError.message);
    await fetchPages();
  }, [fetchPages]);

  const deletePage = useCallback(async (pageId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('pm_public_pages')
      .delete()
      .eq('id', pageId);

    if (deleteError) throw new Error(deleteError.message);
    await fetchPages();
  }, [fetchPages]);

  return {
    pages,
    isLoading,
    error,
    getPage,
    savePage,
    setVisibility,
    deletePage,
    refetch: fetchPages,
  };
}
