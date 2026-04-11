import { logger } from '../utils/logger'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { MeetingRSVP, MeetingRSVPSummary } from '../types/database'

/**
 * useRSVP Hook
 * Purpose: Manage RSVP data for club meetings
 *
 * Usage:
 * const { rsvp, summary, updateRSVP, isLoading, error } = useRSVP(eventId)
 */

interface UseRSVPReturn {
  rsvp: MeetingRSVP | null
  summary: MeetingRSVPSummary | null
  updateRSVP: (status: MeetingRSVP['status'], data?: Partial<MeetingRSVP>) => Promise<void>
  isLoading: boolean
  error: Error | null
}

export function useRSVP(eventId: string): UseRSVPReturn {
  const { memberId } = useAuth()
  const [rsvp, setRsvp] = useState<MeetingRSVP | null>(null)
  const [summary, setSummary] = useState<MeetingRSVPSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch member's RSVP
  useEffect(() => {
    const fetchRSVP = async () => {
      if (!memberId || !eventId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('meeting_rsvps')
          .select('*')
          .eq('event_id', eventId)
          .eq('member_id', memberId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (not an error, just no RSVP yet)
          throw fetchError
        }

        setRsvp(data || null)
      } catch (err) {
        logger.error('Error fetching RSVP:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRSVP()
  }, [eventId, memberId])

  // Fetch summary (for officers/admins)
  useEffect(() => {
    const fetchSummary = async () => {
      if (!eventId) return

      try {
        const { data, error: summaryError } = await supabase
          .from('meeting_rsvp_summary')
          .select('*')
          .eq('event_id', eventId)
          .single()

        if (summaryError && summaryError.code !== 'PGRST116') {
          throw summaryError
        }

        setSummary(data || null)
      } catch (err) {
        logger.error('Error fetching RSVP summary:', err)
      }
    }

    fetchSummary()
  }, [eventId])

  // Real-time subscription for RSVP changes
  useEffect(() => {
    if (!eventId || !memberId) return

    const subscription = supabase
      .channel(`rsvp-${eventId}-${memberId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_rsvps',
          filter: `event_id=eq.${eventId},member_id=eq.${memberId}`
        },
        (payload) => {
          logger.log('RSVP update received:', payload)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setRsvp(payload.new as MeetingRSVP)
          } else if (payload.eventType === 'DELETE') {
            setRsvp(null)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId, memberId])

  // Real-time subscription for summary changes
  useEffect(() => {
    if (!eventId) return

    const subscription = supabase
      .channel(`rsvp-summary-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_rsvps',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          // Refresh summary when any RSVP changes for this event
          supabase
            .from('meeting_rsvp_summary')
            .select('*')
            .eq('event_id', eventId)
            .single()
            .then(({ data }) => {
              if (data) setSummary(data)
            })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId])

  const updateRSVP = useCallback(
    async (status: MeetingRSVP['status'], data?: Partial<MeetingRSVP>) => {
      if (!memberId || !eventId) {
        throw new Error('Member ID or Event ID is missing')
      }

      setError(null)

      try {
        const rsvpData = {
          event_id: eventId,
          member_id: memberId,
          status,
          guest_count: data?.guest_count ?? 0,
          guest_names: data?.guest_names ?? null,
          dietary_notes: data?.dietary_notes ?? null,
          special_requests: data?.special_requests ?? null
        }

        const { data: result, error: upsertError } = await supabase
          .from('meeting_rsvps')
          .upsert(rsvpData, {
            onConflict: 'event_id,member_id'
          })
          .select()
          .single()

        if (upsertError) throw upsertError

        setRsvp(result)
      } catch (err) {
        logger.error('Error updating RSVP:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId, memberId]
  )

  return {
    rsvp,
    summary,
    updateRSVP,
    isLoading,
    error
  }
}

/**
 * useEventRSVPList Hook
 * Purpose: Get list of all RSVPs for an event (for officers/admins)
 *
 * Usage:
 * const { rsvps, isLoading } = useEventRSVPList(eventId)
 */
interface UseEventRSVPListReturn {
  rsvps: (MeetingRSVP & { member_name: string })[]
  isLoading: boolean
  error: Error | null
}

export function useEventRSVPList(eventId: string): UseEventRSVPListReturn {
  const [rsvps, setRsvps] = useState<(MeetingRSVP & { member_name: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchRSVPs = async () => {
      if (!eventId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('meeting_rsvps')
          .select(`
            *,
            members!inner(name)
          `)
          .eq('event_id', eventId)
          .order('status', { ascending: false }) // attending first

        if (fetchError) throw fetchError

        const formatted = data.map(r => ({
          ...r,
          member_name: (r.members as any).name
        }))

        setRsvps(formatted)
      } catch (err) {
        logger.error('Error fetching RSVP list:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRSVPs()
  }, [eventId])

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return

    const subscription = supabase
      .channel(`rsvp-list-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_rsvps',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          // Refresh list on any change
          supabase
            .from('meeting_rsvps')
            .select(`
              *,
              members!inner(name)
            `)
            .eq('event_id', eventId)
            .order('status', { ascending: false })
            .then(({ data }) => {
              if (data) {
                const formatted = data.map(r => ({
                  ...r,
                  member_name: (r.members as any).name
                }))
                setRsvps(formatted)
              }
            })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId])

  return {
    rsvps,
    isLoading,
    error
  }
}
