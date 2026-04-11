import { supabase } from './supabase'
import { retryWithBackoff } from './retry-with-backoff'

// Wrapper for SELECT queries with retry
export async function fetchWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
) {
  return retryWithBackoff(async () => {
    const { data, error } = await queryFn()
    if (error) throw error
    return data
  })
}

// Example usage for common queries
export const queries = {
  // Fetch all speakers
  fetchSpeakers: async () =>
    await fetchWithRetry(async () =>
      await supabase
        .from('speakers')
        .select('*')
        .order('position', { ascending: true })
    ),

  // Fetch all members
  fetchMembers: async () =>
    await fetchWithRetry(async () =>
      await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })
    ),

  // Fetch service projects
  fetchProjects: async () =>
    await fetchWithRetry(async () =>
      await supabase
        .from('service_projects')
        .select('*')
        .order('start_date', { ascending: false })
    ),

  // Fetch rotary years
  fetchRotaryYears: async () =>
    await fetchWithRetry(async () =>
      await supabase
        .from('rotary_years')
        .select('*')
        .order('rotary_year', { ascending: false })
    ),

  // Fetch photos
  fetchPhotos: async (rotaryYearId?: string) =>
    await fetchWithRetry(async () => {
      let query = supabase
        .from('photos')
        .select('*')
        .eq('approval_status', 'approved')

      if (rotaryYearId) {
        query = query.eq('rotary_year_id', rotaryYearId)
      }

      return await query.order('photo_date', { ascending: false })
    }),
}

// For mutations (INSERT, UPDATE, DELETE), use retry sparingly
export async function mutateWithRetry<T>(
  mutateFn: () => Promise<{ data: T | null; error: unknown }>,
  options?: { maxRetries?: number }
) {
  return retryWithBackoff(
    async () => {
      const { data, error } = await mutateFn()
      if (error) throw error
      return data
    },
    { ...options, maxRetries: options?.maxRetries ?? 1 } // Only 1 retry for mutations
  )
}
