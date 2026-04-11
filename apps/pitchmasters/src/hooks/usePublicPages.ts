import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PublicPage } from '../types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function usePublicPages(clubId: string | null) {
  const [pages, setPages] = useState<PublicPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    if (!clubId) {
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
        .eq('club_id', clubId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPages(data ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const getPage = useCallback(async (slug: string): Promise<PublicPage | null> => {
    if (!clubId) return null;

    const { data, error: fetchError } = await supabase
      .from('pm_public_pages')
      .select('*')
      .eq('club_id', clubId)
      .eq('slug', slug)
      .single();

    if (fetchError) return null;
    return data;
  }, [clubId]);

  const savePage = useCallback(async (
    page: Partial<PublicPage> & { title: string; content: any }
  ): Promise<PublicPage | null> => {
    if (!clubId) return null;

    const slug = page.slug || generateSlug(page.title);

    try {
      if (page.id) {
        // Update existing page
        const { data, error: updateError } = await supabase
          .from('pm_public_pages')
          .update({
            title: page.title,
            slug,
            content: page.content,
            published: page.published ?? false,
          })
          .eq('id', page.id)
          .select()
          .single();

        if (updateError) throw updateError;
        await fetchPages();
        return data;
      } else {
        // Insert new page
        const { data, error: insertError } = await supabase
          .from('pm_public_pages')
          .insert({
            club_id: clubId,
            title: page.title,
            slug,
            content: page.content,
            published: page.published ?? false,
            author_id: page.author_id ?? null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        await fetchPages();
        return data;
      }
    } catch (err: any) {
      throw new Error(err.message ?? 'Failed to save page');
    }
  }, [clubId, fetchPages]);

  const publishPage = useCallback(async (pageId: string, published: boolean): Promise<void> => {
    const { error: updateError } = await supabase
      .from('pm_public_pages')
      .update({ published })
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
    publishPage,
    deletePage,
    refetch: fetchPages,
  };
}
