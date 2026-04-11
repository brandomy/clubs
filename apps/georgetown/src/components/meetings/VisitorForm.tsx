import { logger } from '../../utils/logger'
import { useState } from 'react'
import { X } from 'lucide-react'
import { useAttendance } from '../../hooks/useAttendance'

/**
 * VisitorForm Component
 * Purpose: Quick add for visiting Rotarians
 *
 * Requirements:
 * - Fields: Visitor name (required), Club name (required), District (optional), Notes (optional)
 * - "Save & Add Another" button (for multiple visitors)
 * - "Save & Close" button
 *
 * Usage:
 * <VisitorForm eventId="uuid" isOpen={true} onClose={() => setIsOpen(false)} />
 */

interface VisitorFormProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
}

export function VisitorForm({ eventId, isOpen, onClose }: VisitorFormProps) {
  const { checkInVisitor } = useAttendance(eventId)

  const [name, setName] = useState('')
  const [club, setClub] = useState('')
  const [district, setDistrict] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setClub('')
    setDistrict('')
    setNotes('')
  }

  const handleSave = async (closeAfter = true) => {
    if (!name.trim() || !club.trim()) {
      alert('Please enter visitor name and club name')
      return
    }

    setIsSaving(true)
    try {
      await checkInVisitor(
        name.trim(),
        club.trim(),
        district.trim() || undefined,
        notes.trim() || undefined
      )

      if (closeAfter) {
        onClose()
      } else {
        resetForm()
      }
    } catch (error) {
      logger.error('Failed to add visitor:', error)
      alert('Failed to add visitor. Please try again.')
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
          <h2 className="text-xl font-semibold text-gray-900">Add Visiting Rotarian</h2>
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
          {/* Visitor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visitor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              autoFocus
            />
          </div>

          {/* Club Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotary Club <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rotary Club of Singapore"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District (optional)
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="District 3310"
            />
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
            disabled={isSaving || !name.trim() || !club.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Add Another
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !name.trim() || !club.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
