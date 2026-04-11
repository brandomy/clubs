import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface UseRealtimeSubscriptionOptions<T> {
  table: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
  filter?: string // e.g., 'status=eq.active'
}

export function useRealtimeSubscription<T = any>({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter,
}: UseRealtimeSubscriptionOptions<T>) {
  useEffect(() => {
    // Create subscription channel
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload: { eventType: string; new: T; old: T }) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new)
              break
            case 'UPDATE':
              onUpdate?.(payload.new)
              break
            case 'DELETE':
              onDelete?.(payload.old)
              break
          }
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [table, filter, onInsert, onUpdate, onDelete])
}
