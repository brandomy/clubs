import { logger } from '../utils/logger'
import { useState, lazy, Suspense } from 'react'
import { useToast } from '../contexts/ToastContext'
import { X, Calendar, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LocationSelect from './LocationSelect'
const RichTextEditor = lazy(() => import('./RichTextEditor'))

interface AddEventModalProps {
  onClose: () => void
  onEventAdded?: () => void
  defaultDate?: string
}

export default function AddEventModal({ onClose, onEventAdded, defaultDate }: AddEventModalProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    start_time: '19:00',
    end_time: '',
    type: 'club_meeting' as 'club_meeting' | 'club_assembly' | 'board_meeting' | 'committee_meeting' | 'club_social' | 'service_project' | 'holiday' | 'observance',
    title: '',
    description: '',
    agenda: '',
    location_id: undefined as string | undefined
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            date: formData.date,
            start_time: formData.start_time || null,
            end_time: formData.end_time || null,
            type: formData.type,
            title: formData.title,
            description: formData.description || null,
            agenda: formData.agenda || null,
            location_id: formData.location_id || null,
            created_by: 'system',
            updated_by: 'system'
          }
        ])
        .select()

      if (error) throw error

      logger.log('Event created successfully:', data)
      onEventAdded?.()
      onClose()
    } catch (error) {
      logger.error('Error creating event:', error)
      showToast('Failed to create event. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getEventTypeInfo = () => {
    if (formData.type === 'club_meeting') {
      return {
        description: 'Regular club meetings for business and speakers',
        examples: 'Club meeting, Board meeting, Committee meeting',
        color: 'text-blue-600'
      }
    } else if (formData.type === 'club_assembly') {
      return {
        description: 'Business meeting for club matters and voting',
        examples: 'Monthly assembly, Business assembly, General assembly',
        color: 'text-green-600'
      }
    } else if (formData.type === 'board_meeting') {
      return {
        description: 'Board of Directors meeting for governance and leadership',
        examples: 'Monthly BOD meeting, Board planning session, Executive meeting',
        color: 'text-purple-600'
      }
    } else if (formData.type === 'committee_meeting') {
      return {
        description: 'Committee meetings for specific club activities',
        examples: 'Membership committee, Service committee, PR committee',
        color: 'text-orange-600'
      }
    } else if (formData.type === 'service_project') {
      return {
        description: 'Community service activities and projects',
        examples: 'Food bank volunteering, Community cleanup, School project',
        color: 'text-[#00adbb]'
      }
    } else if (formData.type === 'holiday') {
      return {
        description: 'Malaysia holidays and special observances',
        examples: 'Chinese New Year, Hari Raya, Deepavali, Federal holidays',
        color: 'text-[#d41367]'
      }
    } else if (formData.type === 'observance') {
      return {
        description: 'Rotary International observances and club milestones',
        examples: 'World Polio Day (Oct 24), Rotary Anniversary (Feb 23), Club Anniversary',
        color: 'text-[#f7a81b]'
      }
    } else {
      return {
        description: 'Fellowship events and social gatherings',
        examples: 'Birthday parties, Casual dinners, Social outings, Celebrations',
        color: 'text-purple-600'
      }
    }
  }

  const eventTypeInfo = getEventTypeInfo()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto touch-manipulation">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-[#0067c8] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="mr-3" size={24} />
              <h2 className="text-xl font-semibold">Add Club Event</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Date Selection */}
            <div className="mb-6">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
              />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <select
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 * 4 }, (_, i) => {
                    const hour = Math.floor(i / 4).toString().padStart(2, '0')
                    const minute = ((i % 4) * 15).toString().padStart(2, '0')
                    return `${hour}:${minute}`
                  }).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <select
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 * 4 }, (_, i) => {
                    const hour = Math.floor(i / 4).toString().padStart(2, '0')
                    const minute = ((i % 4) * 15).toString().padStart(2, '0')
                    return `${hour}:${minute}`
                  }).map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <LocationSelect
                value={formData.location_id}
                onChange={(locationId) => setFormData(prev => ({ ...prev, location_id: locationId }))}
              />
            </div>

            {/* Event Type Selection */}
            <div className="mb-6">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
              >
                <option value="club_meeting">Club Meeting</option>
                <option value="club_assembly">Club Assembly</option>
                <option value="board_meeting">Board Meeting</option>
                <option value="committee_meeting">Committee Meeting</option>
                <option value="club_social">Club Social</option>
                <option value="service_project">Service Project</option>
                <option value="observance">Observance</option>
                <option value="holiday">Holiday</option>
              </select>

              {/* Event Type Info */}
              <div className={`mt-2 p-3 bg-gray-50 rounded-lg border-l-4 ${
                formData.type === 'club_meeting' ? 'border-blue-400' :
                formData.type === 'club_assembly' ? 'border-green-400' :
                formData.type === 'board_meeting' ? 'border-purple-400' :
                formData.type === 'committee_meeting' ? 'border-orange-400' :
                formData.type === 'service_project' ? 'border-cyan-400' :
                formData.type === 'observance' ? 'border-[#f7a81b]' :
                formData.type === 'holiday' ? 'border-pink-400' :
                'border-purple-400'
              }`}>
                <div className="flex items-start">
                  <Info size={16} className={`${eventTypeInfo.color} mt-0.5 mr-2 flex-shrink-0`} />
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      {eventTypeInfo.description}
                    </p>
                    <p className="text-xs text-gray-600">
                      Examples: {eventTypeInfo.examples}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={
                  formData.type === 'club_meeting' ? 'e.g., Club Meeting' :
                  formData.type === 'club_assembly' ? 'e.g., Monthly Club Assembly' :
                  formData.type === 'board_meeting' ? 'e.g., Board of Directors Meeting' :
                  formData.type === 'committee_meeting' ? 'e.g., Membership Committee Meeting' :
                  formData.type === 'service_project' ? 'e.g., Food Bank Volunteering' :
                  formData.type === 'observance' ? 'e.g., World Polio Day' :
                  formData.type === 'holiday' ? 'e.g., Chinese New Year' :
                  'e.g., Annual Induction Ceremony'
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional details about the event..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8] resize-vertical"
              />
            </div>

            {/* Agenda - For meetings with structured agendas */}
            {(formData.type === 'club_meeting' || formData.type === 'club_assembly' || formData.type === 'board_meeting' || formData.type === 'committee_meeting') && (
              <div className="mb-6">
                <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Agenda
                </label>
                <Suspense fallback={<div className="h-32 bg-gray-50 rounded border border-gray-200 animate-pulse" />}>
                  <RichTextEditor
                    content={formData.agenda}
                    onChange={(html) => setFormData({ ...formData, agenda: html })}
                    placeholder="Enter meeting agenda (use toolbar for formatting)..."
                  />
                </Suspense>
                <p className="mt-1 text-xs text-gray-500">
                  Use the toolbar buttons to format your agenda with headings, lists, and emphasis.
                </p>
              </div>
            )}

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Calendar Preview</h4>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">
                  {new Date(formData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${
                  formData.type === 'club_meeting' ? 'bg-[#0067c8] text-white' :
                  formData.type === 'club_assembly' ? 'bg-green-600 text-white' :
                  formData.type === 'service_project' ? 'bg-[#00adbb] text-white' :
                  formData.type === 'observance' ? 'bg-[#f7a81b] text-white' :
                  formData.type === 'holiday' ? 'bg-[#d41367] text-white' :
                  'bg-purple-500 text-white'
                }`}>
                  {formData.type === 'club_meeting' ? 'Meeting' :
                   formData.type === 'club_assembly' ? 'Assembly' :
                   formData.type === 'service_project' ? 'Service' :
                   formData.type === 'observance' ? 'Observance' :
                   formData.type === 'holiday' ? 'Holiday' : 'Event'}
                </div>
              </div>
              {formData.title && (
                <div className="text-sm text-gray-700 mt-2">{formData.title}</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Add Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}