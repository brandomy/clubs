import { logger } from '../../utils/logger'
import { useToast } from '../../contexts/ToastContext'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAttendance } from '../../hooks/useAttendance'
import { supabase } from '../../lib/supabase'

/**
 * GuestForm Component
 * Purpose: Quick add for non-Rotarian guests (prospective members)
 *
 * Requirements:
 * - Fields: Guest name (required), Hosted by (required), Prospective member checkbox,
 *   Contact info (optional), Notes (optional)
 * - "Save & Add Another" button
 * - "Save & Close" button
 *
 * Usage:
 * <GuestForm eventId="uuid" isOpen={true} onClose={() => setIsOpen(false)} />
 */

interface GuestFormProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
}

export function GuestForm({ eventId, isOpen, onClose }: GuestFormProps) {
  const { showToast } = useToast()
  const { checkInGuest } = useAttendance(eventId)

  const [name, setName] = useState('')
  const [hostedBy, setHostedBy] = useState('')
  const [isProspective, setIsProspective] = useState(false)
  const [contactInfo, setContactInfo] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])

  // Fetch active members for host dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('gt_members')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (!error && data) {
        setMembers(data)
      }
    }

    if (isOpen) {
      fetchMembers()
    }
  }, [isOpen])

  const resetForm = () => {
    setName('')
    setHostedBy('')
    setIsProspective(false)
    setContactInfo('')
    setNotes('')
  }

  const handleSave = async (closeAfter = true) => {
    if (!name.trim() || !hostedBy) {
      showToast('Please enter guest name and select a host', 'warning')
      return
    }

    setIsSaving(true)
    try {
      await checkInGuest(
        name.trim(),
        hostedBy,
        isProspective,
        contactInfo.trim() || undefined,
        notes.trim() || undefined
      )

      if (closeAfter) {
        onClose()
      } else {
        resetForm()
      }
    } catch (error) {
      logger.error('Failed to add guest:', error)
      showToast('Failed to add guest. Please try again.', 'error')
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
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Guest</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Jane Smith"
              autoFocus
            />
          </div>

          {/* Hosted By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hosted By <span className="text-red-500">*</span>
            </label>
            <select
              value={hostedBy}
              onChange={(e) => setHostedBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Which member is hosting this guest?
            </p>
          </div>

          {/* Prospective Member */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="prospective"
              checked={isProspective}
              onChange={(e) => setIsProspective(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="prospective" className="block text-sm font-medium text-gray-900 cursor-pointer">
                Prospective Member
              </label>
              <p className="text-sm text-gray-600">
                Flag this guest as a potential new Rotary member for follow-up
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Info (optional)
            </label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email or phone number"
            />
            <p className="mt-1 text-sm text-gray-500">
              For prospective member follow-up
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any additional notes..."
            />
          </div>
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
            onClick={() => handleSave(false)}
            disabled={isSaving || !name.trim() || !hostedBy}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Add Another
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !name.trim() || !hostedBy}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
