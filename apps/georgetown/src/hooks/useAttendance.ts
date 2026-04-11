import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { AttendanceRecord, MemberAttendanceStats, MeetingAttendanceSummary } from '../types/database'

/**
 * useAttendance Hook
 * Purpose: Manage attendance records for club meetings
 *
 * Usage:
 * const { records, summary, checkIn, isLoading } = useAttendance(eventId)
 */

interface UseAttendanceReturn {
  records: AttendanceRecord[]
  summary: MeetingAttendanceSummary | null
  checkInMember: (memberId: string, notes?: string) => Promise<void>
  checkOutMember: (memberId: string) => Promise<void>
  checkInVisitor: (name: string, club: string, district?: string, notes?: string) => Promise<void>
  checkInGuest: (name: string, hostedBy: string, isProspective?: boolean, contactInfo?: string, notes?: string) => Promise<void>
  bulkCheckIn: (memberIds: string[]) => Promise<void>
  isLoading: boolean
  error: Error | null
}

export function useAttendance(eventId: string): UseAttendanceReturn {
  const { user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<MeetingAttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch attendance records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!eventId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('event_id', eventId)
          .order('checked_in_at', { ascending: false })

        if (fetchError) throw fetchError

        setRecords(data || [])
      } catch (err) {
        console.error('Error fetching attendance records:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [eventId])

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      if (!eventId) return

      try {
        const { data, error: summaryError } = await supabase
          .from('meeting_attendance_summary')
          .select('*')
          .eq('event_id', eventId)
          .single()

        if (summaryError && summaryError.code !== 'PGRST116') {
          throw summaryError
        }

        setSummary(data || null)
      } catch (err) {
        console.error('Error fetching attendance summary:', err)
      }
    }

    fetchSummary()
  }, [eventId])

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return

    const subscription = supabase
      .channel(`attendance-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Attendance update received:', payload)

          if (payload.eventType === 'INSERT') {
            setRecords(prev => [payload.new as AttendanceRecord, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setRecords(prev =>
              prev.map(r => r.id === payload.new.id ? payload.new as AttendanceRecord : r)
            )
          } else if (payload.eventType === 'DELETE') {
            setRecords(prev => prev.filter(r => r.id !== payload.old.id))
          }

          // Refresh summary
          ;(async () => {
            try {
              const { data, error } = await supabase
                .from('meeting_attendance_summary')
                .select('*')
                .eq('event_id', eventId)
                .single()

              if (error && error.code !== 'PGRST116') {
                console.error('Failed to refresh attendance summary:', error)
                return
              }

              if (data) setSummary(data)
            } catch (err) {
              console.error('Unexpected error refreshing summary:', err)
            }
          })()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId])

  const checkInMember = useCallback(
    async (memberId: string, notes?: string) => {
      if (!eventId || !user?.id) {
        throw new Error('Event ID or User ID is missing')
      }

      setError(null)

      try {
        const { data: _data, error: insertError } = await supabase // eslint-disable-line @typescript-eslint/no-unused-vars
          .from('attendance_records')
          .insert({
            event_id: eventId,
            attendee_type: 'member',
            member_id: memberId,
            checked_in_by: user.id,
            notes: notes || null
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Records will update via real-time subscription
      } catch (err) {
        console.error('Error checking in member:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId, user?.id]
  )

  const checkInVisitor = useCallback(
    async (name: string, club: string, district?: string, notes?: string) => {
      if (!eventId || !user?.id) {
        throw new Error('Event ID or User ID is missing')
      }

      setError(null)

      try {
        const { data: _data, error: insertError } = await supabase // eslint-disable-line @typescript-eslint/no-unused-vars
          .from('attendance_records')
          .insert({
            event_id: eventId,
            attendee_type: 'visiting_rotarian',
            visitor_name: name,
            visitor_club: club,
            visitor_district: district || null,
            checked_in_by: user.id,
            notes: notes || null
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Records will update via real-time subscription
      } catch (err) {
        console.error('Error checking in visitor:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId, user?.id]
  )

  const checkInGuest = useCallback(
    async (
      name: string,
      hostedBy: string,
      isProspective = false,
      contactInfo?: string,
      notes?: string
    ) => {
      if (!eventId || !user?.id) {
        throw new Error('Event ID or User ID is missing')
      }

      setError(null)

      try {
        const { data: _data, error: insertError } = await supabase // eslint-disable-line @typescript-eslint/no-unused-vars
          .from('attendance_records')
          .insert({
            event_id: eventId,
            attendee_type: 'guest',
            guest_name: name,
            guest_hosted_by: hostedBy,
            guest_is_prospective_member: isProspective,
            guest_contact_info: contactInfo || null,
            checked_in_by: user.id,
            notes: notes || null
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Records will update via real-time subscription
      } catch (err) {
        console.error('Error checking in guest:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId, user?.id]
  )

  const bulkCheckIn = useCallback(
    async (memberIds: string[]) => {
      if (!eventId || !user?.id) {
        throw new Error('Event ID or User ID is missing')
      }

      setError(null)

      try {
        const records = memberIds.map(memberId => ({
          event_id: eventId,
          attendee_type: 'member' as const,
          member_id: memberId,
          checked_in_by: user.id
        }))

        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert(records)

        if (insertError) throw insertError

        // Records will update via real-time subscription
      } catch (err) {
        console.error('Error bulk checking in members:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId, user?.id]
  )

  const checkOutMember = useCallback(
    async (memberId: string) => {
      if (!eventId) {
        throw new Error('Event ID is missing')
      }

      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('attendance_records')
          .delete()
          .eq('event_id', eventId)
          .eq('member_id', memberId)

        if (deleteError) throw deleteError

        // Records will update via real-time subscription
      } catch (err) {
        console.error('Error checking out member:', err)
        setError(err as Error)
        throw err
      }
    },
    [eventId]
  )

  return {
    records,
    summary,
    checkInMember,
    checkOutMember,
    checkInVisitor,
    checkInGuest,
    bulkCheckIn,
    isLoading,
    error
  }
}

/**
 * useMemberAttendanceStats Hook
 * Purpose: Get attendance statistics for a member
 *
 * Usage:
 * const { stats, isLoading } = useMemberAttendanceStats(memberId)
 */
interface UseMemberAttendanceStatsReturn {
  stats: MemberAttendanceStats | null
  isLoading: boolean
  error: Error | null
}

export function useMemberAttendanceStats(memberId: string | null): UseMemberAttendanceStatsReturn {
  const [stats, setStats] = useState<MemberAttendanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!memberId) {
        setStats(null)
        setIsLoading(false)
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('member_attendance_stats')
          .select('*')
          .eq('member_id', memberId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        setStats(data || null)
      } catch (err) {
        console.error('Error fetching attendance stats:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [memberId])

  // Real-time subscription for stats updates
  useEffect(() => {
    if (!memberId) return

    const subscription = supabase
      .channel(`stats-${memberId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_attendance_stats',
          filter: `member_id=eq.${memberId}`
        },
        (payload) => {
          console.log('Stats update received:', payload)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setStats(payload.new as MemberAttendanceStats)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [memberId])

  return {
    stats,
    isLoading,
    error
  }
}
