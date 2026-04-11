import { logger } from '../../utils/logger'
import { useState } from 'react'
import { Check, X, HelpCircle } from 'lucide-react'
import { useRSVP } from '../../hooks/useRSVP'
import { usePermissions } from '../../hooks/usePermissions'
import type { MeetingRSVP } from '../../types/database'

/**
 * RSVPButton Component
 * Purpose: Quick RSVP toggle (attending/not attending) on event cards
 *
 * Requirements:
 * - Mobile touch-friendly (44px minimum)
 * - 3 states: Attending (green), Not Attending (gray), No Response (blue outline), Maybe (yellow)
 * - One-tap toggle (no modal for quick RSVP)
 * - Real-time update via Supabase subscription
 * - Permission check: members can RSVP, readonly cannot
 *
 * Usage:
 * <RSVPButton eventId="uuid" onDetailsClick={() => setShowModal(true)} />
 */

interface RSVPButtonProps {
  eventId: string
  onDetailsClick?: () => void
  className?: string
}

export function RSVPButton({ eventId, onDetailsClick, className = '' }: RSVPButtonProps) {
  const { rsvp, updateRSVP, isLoading: rsvpLoading } = useRSVP(eventId)
  const { canUpdate } = usePermissions()
  const [isUpdating, setIsUpdating] = useState(false)

  const canRSVP = canUpdate('events')

  const handleStatusToggle = async (newStatus: MeetingRSVP['status']) => {
    if (!canRSVP || isUpdating) return

    setIsUpdating(true)
    try {
      await updateRSVP(newStatus)
    } catch (error) {
      logger.error('Failed to update RSVP:', error)
      // TODO: Show toast notification
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStatus = rsvp?.status || 'no_response'

  if (!canRSVP) {
    return null // Don't show RSVP buttons for readonly users
  }

  return (
    <div className={`rsvp-button-group ${className}`}>
      {/* Mobile: Stack vertically | Desktop: Inline buttons */}
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        {/* Attending Button */}
        <button
          onClick={() => handleStatusToggle('attending')}
          disabled={isUpdating || rsvpLoading}
          className={`
            rsvp-button
            flex items-center justify-center gap-2
            min-h-[44px] px-4 py-2
            rounded-lg font-medium
            transition-all duration-200
            w-full md:w-auto
            ${currentStatus === 'attending'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-600'
            }
            ${(isUpdating || rsvpLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          `}
          aria-label="RSVP Attending"
        >
          <Check className="w-5 h-5" />
          <span>Attending</span>
        </button>

        {/* Maybe Button */}
        <button
          onClick={() => handleStatusToggle('maybe')}
          disabled={isUpdating || rsvpLoading}
          className={`
            rsvp-button
            flex items-center justify-center gap-2
            min-h-[44px] px-4 py-2
            rounded-lg font-medium
            transition-all duration-200
            w-full md:w-auto
            ${currentStatus === 'maybe'
              ? 'bg-yellow-500 text-white shadow-md'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-yellow-500'
            }
            ${(isUpdating || rsvpLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          `}
          aria-label="RSVP Maybe"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Maybe</span>
        </button>

        {/* Not Attending Button */}
        <button
          onClick={() => handleStatusToggle('not_attending')}
          disabled={isUpdating || rsvpLoading}
          className={`
            rsvp-button
            flex items-center justify-center gap-2
            min-h-[44px] px-4 py-2
            rounded-lg font-medium
            transition-all duration-200
            w-full md:w-auto
            ${currentStatus === 'not_attending'
              ? 'bg-gray-500 text-white shadow-md'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500'
            }
            ${(isUpdating || rsvpLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          `}
          aria-label="RSVP Not Attending"
        >
          <X className="w-5 h-5" />
          <span>Not Going</span>
        </button>

        {/* Add Details Link */}
        {onDetailsClick && (
          <button
            onClick={onDetailsClick}
            disabled={isUpdating || rsvpLoading}
            className={`
              rsvp-button
              flex items-center justify-center gap-2
              min-h-[44px] px-4 py-2
              rounded-lg font-medium
              transition-all duration-200
              w-full md:w-auto
              ${currentStatus === 'no_response'
                ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-md'
                : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
              }
              ${(isUpdating || rsvpLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
            `}
            aria-label="Add RSVP Details"
          >
            <span>+ Add Details</span>
          </button>
        )}
      </div>

      {/* Status indicator for screen readers */}
      <span className="sr-only">
        Current RSVP status: {currentStatus.replace('_', ' ')}
      </span>
    </div>
  )
}
