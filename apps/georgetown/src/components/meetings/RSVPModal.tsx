import { logger } from '../../utils/logger'
import { useToast } from '../../contexts/ToastContext'
import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useRSVP } from '../../hooks/useRSVP'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { MeetingRSVP } from '../../types/database'

/**
 * RSVPModal Component
 * Purpose: Detailed RSVP with guest count and dietary notes
 *
 * Requirements:
 * - Opens from "Add Details" link on RSVPButton
 * - Fields: RSVP status, guest count, guest names, dietary notes, special requests
 * - Auto-save on blur (2-second debounce)
 * - Close button + click outside to close
 * - Mobile-optimized form layout
 *
 * Usage:
 * <RSVPModal eventId="uuid" isOpen={true} onClose={() => setIsOpen(false)} />
 */

interface RSVPModalProps {
  eventId: string
  eventType?: string
  eventDate?: string
  isOpen: boolean
  onClose: () => void
}

const getEventTypeDisplayName = (type?: string): string => {
  switch (type) {
    case 'club_meeting':
      return 'Club Meeting'
    case 'club_assembly':
      return 'Club Assembly'
    case 'board_meeting':
      return 'Board Meeting'
    case 'committee_meeting':
      return 'Committee Meeting'
    case 'club_social':
      return 'Club Social'
    case 'service_project':
      return 'Service Project'
    default:
      return 'Meeting'
  }
}

export function RSVPModal({ eventId, eventType, eventDate, isOpen, onClose }: RSVPModalProps) {
  const { showToast } = useToast()
  const { rsvp, updateRSVP, isLoading } = useRSVP(eventId)
  const { memberId } = useAuth()

  const [status, setStatus] = useState<MeetingRSVP['status']>('no_response')
  const [guestCount, setGuestCount] = useState(0)
  const [guestNames, setGuestNames] = useState('')
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [memberName, setMemberName] = useState<string | null>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  // Fetch member name
  useEffect(() => {
    const fetchMemberName = async () => {
      if (memberId && !memberName) {
        const { data, error } = await supabase
          .from('members')
          .select('name')
          .eq('id', memberId)
          .single()

        if (data && !error) {
          setMemberName(data.name)
        }
      }
    }
    fetchMemberName()
  }, [memberId, memberName])

  // Load existing RSVP data when modal opens
  useEffect(() => {
    if (isOpen && rsvp) {
      setStatus(rsvp.status)
      setGuestCount(rsvp.guest_count || 0)
      setGuestNames(rsvp.guest_names?.join('\n') || '')
      setDietaryNotes(rsvp.dietary_notes || '')
      setSpecialRequests(rsvp.special_requests || '')
    }
  }, [isOpen, rsvp])

  // Prevent dropdown from auto-opening
  useEffect(() => {
    if (isOpen && selectRef.current) {
      // Blur the select element to keep it closed
      selectRef.current.blur()
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!memberId) {
      logger.error('Cannot save RSVP: memberId is missing')
      showToast('Authentication error. Please refresh the page and try again.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const guestNamesArray = guestNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)

      await updateRSVP(status, {
        guest_count: guestCount,
        guest_names: guestNamesArray.length > 0 ? guestNamesArray : undefined,
        dietary_notes: dietaryNotes.trim() || undefined,
        special_requests: specialRequests.trim() || undefined
      })

      onClose()
    } catch (error) {
      logger.error('Failed to save RSVP:', error)
      showToast('Failed to save RSVP. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {memberName ? `${memberName}'s RSVP` : 'RSVP Details'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getEventTypeDisplayName(eventType)}
              {eventDate && ` - ${new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* RSVP Status - Prominent */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Will you attend? <span className="text-red-500">*</span>
            </label>
            <select
              ref={selectRef}
              value={status}
              onChange={(e) => setStatus(e.target.value as MeetingRSVP['status'])}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="no_response">Select your response...</option>
              <option value="attending">✓ Yes, I'll attend</option>
              <option value="maybe">? Maybe / Tentative</option>
              <option value="not_attending">✗ Regrets</option>
            </select>
          </div>

          {/* Optional Details - Only show if attending */}
          {(status === 'attending' || status === 'maybe') && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Optional Details</h3>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum 10 guests per member
            </p>
          </div>

          {/* Guest Names */}
          {guestCount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest Names (optional)
              </label>
              <textarea
                value={guestNames}
                onChange={(e) => setGuestNames(e.target.value)}
                rows={Math.min(guestCount, 5)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="One name per line&#10;John Doe&#10;Jane Smith"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter one guest name per line for nametags
              </p>
            </div>
          )}

          {/* Dietary Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions / Preferences
            </label>
            <textarea
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="E.g., vegetarian, vegan, gluten-free, allergies..."
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="E.g., wheelchair access, parking assistance..."
            />
          </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save RSVP'}
          </button>
        </div>
      </div>
    </div>
  )
}
