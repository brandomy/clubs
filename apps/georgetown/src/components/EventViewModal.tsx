import { logger } from '../utils/logger'
import { useState, useEffect, lazy, Suspense } from 'react'
import DOMPurify from 'dompurify'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import { X, Edit, Calendar, Info, Trash2, MapPin, UserCheck, ChevronDown, ChevronUp, Phone, Mail, Globe, Facebook, Instagram, Youtube, MessageCircle, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LocationSelect from './LocationSelect'
const RichTextEditor = lazy(() => import('./RichTextEditor'))
import type { Location } from '../types/database'

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
  type: 'club_meeting' | 'club_assembly' | 'board_meeting' | 'committee_meeting' | 'club_social' | 'service_project' | 'holiday' | 'observance'
  title: string
  description?: string
  agenda?: string
  location_id?: string
}

interface EventViewModalProps {
  event: Event
  onClose: () => void
  onEventUpdated?: () => void
  onOpenRSVP?: () => void
}

export default function EventViewModal({ event, onClose, onEventUpdated, onOpenRSVP }: EventViewModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: event.title,
    description: event.description || '',
    agenda: event.agenda || '',
    date: event.date,
    start_time: event.start_time || '19:00',
    end_time: event.end_time || '',
    type: event.type,
    location_id: event.location_id
  })
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)
  const [showLocationDetails, setShowLocationDetails] = useState(false)

  useEffect(() => {
    if (event.location_id) {
      fetchLocation(event.location_id)
    }
  }, [event.location_id])

  const fetchLocation = async (locationId: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (error) {
      logger.error('Error fetching location:', error)
    } else {
      setLocation(data)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleEditClose = () => {
    setIsEditing(false)
    setEditData({
      title: event.title,
      description: event.description || '',
      agenda: event.agenda || '',
      date: event.date,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      type: event.type,
      location_id: event.location_id
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editData.title,
          description: editData.description || null,
          agenda: editData.agenda || null,
          date: editData.date,
          start_time: editData.start_time || null,
          end_time: editData.end_time || null,
          type: editData.type,
          location_id: editData.location_id || null,
          updated_by: 'system'
        })
        .eq('id', event.id)

      if (error) throw error

      logger.log('Event updated successfully')
      onEventUpdated?.()
      setIsEditing(false)
      onClose()
    } catch (error) {
      logger.error('Error updating event:', error)
      showToast('Failed to update event. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteEventConfirmed = async () => {
    setShowDeleteConfirm(false)
    setLoading(true)

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (error) throw error

      logger.log('Event deleted successfully')
      onEventUpdated?.()
      onClose()
    } catch (error) {
      logger.error('Error deleting event:', error)
      showToast('Failed to delete event. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeInfo = () => {
    if (event.type === 'club_meeting') {
      return {
        label: 'Club Meeting',
        description: 'Regular club meeting for business and speakers',
        bg: 'bg-[#0067c8]',
        bgLight: 'bg-blue-50',
        text: 'text-white',
        textLight: 'text-blue-900',
        border: 'border-blue-400'
      }
    } else if (event.type === 'club_assembly') {
      return {
        label: 'Club Assembly',
        description: 'Business meeting for club matters and voting',
        bg: 'bg-green-600',
        bgLight: 'bg-green-50',
        text: 'text-white',
        textLight: 'text-green-900',
        border: 'border-green-400'
      }
    } else if (event.type === 'board_meeting') {
      return {
        label: 'Board Meeting',
        description: 'Board of Directors meeting for governance and leadership',
        bg: 'bg-purple-600',
        bgLight: 'bg-purple-50',
        text: 'text-white',
        textLight: 'text-purple-900',
        border: 'border-purple-400'
      }
    } else if (event.type === 'committee_meeting') {
      return {
        label: 'Committee Meeting',
        description: 'Committee meeting for specific club activities',
        bg: 'bg-orange-600',
        bgLight: 'bg-orange-50',
        text: 'text-white',
        textLight: 'text-orange-900',
        border: 'border-orange-400'
      }
    } else if (event.type === 'service_project') {
      return {
        label: 'Service Project',
        description: 'Community service activity',
        bg: 'bg-[#00adbb]',
        bgLight: 'bg-cyan-50',
        text: 'text-white',
        textLight: 'text-[#006666]',
        border: 'border-cyan-400'
      }
    } else if (event.type === 'observance') {
      return {
        label: 'Observance',
        description: 'Rotary International observance or club milestone',
        bg: 'bg-[#f7a81b]',
        bgLight: 'bg-orange-50',
        text: 'text-white',
        textLight: 'text-[#b8680f]',
        border: 'border-[#f7a81b]'
      }
    } else if (event.type === 'holiday') {
      return {
        label: 'Holiday',
        description: 'Malaysia holiday or special observance',
        bg: 'bg-[#d41367]',
        bgLight: 'bg-pink-50',
        text: 'text-white',
        textLight: 'text-[#901046]',
        border: 'border-pink-400'
      }
    } else {
      return {
        label: 'Club Social',
        description: 'Fellowship event or social gathering',
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        text: 'text-white',
        textLight: 'text-purple-900',
        border: 'border-purple-400'
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return null
    // timeString is in HH:MM:SS or HH:MM format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const minute = minutes
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute} ${ampm}`
  }

  const formatTimeRange = () => {
    if (!event.start_time) return null
    const start = formatTime(event.start_time)
    if (event.end_time) {
      const end = formatTime(event.end_time)
      return `${start} - ${end}`
    }
    return start
  }

  const eventTypeInfo = getEventTypeInfo()

  if (isEditing) {
    const editTypeInfo = getEventTypeInfo()
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto touch-manipulation">
          <form onSubmit={handleSaveEdit}>
            <div className={`${editTypeInfo.bg} ${editTypeInfo.text} px-6 py-4 rounded-t-lg flex items-center justify-between`}>
              <div className="flex items-center">
                <Calendar className="mr-3" size={24} />
                <h2 className="text-xl font-semibold">Edit Event</h2>
              </div>
              <button
                type="button"
                onClick={handleEditClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={editData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <select
                    id="start_time"
                    name="start_time"
                    value={editData.start_time}
                    onChange={handleInputChange}
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
                    value={editData.end_time}
                    onChange={handleInputChange}
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <LocationSelect
                  value={editData.location_id}
                  onChange={(locationId) => setEditData(prev => ({ ...prev, location_id: locationId }))}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={editData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
                >
                  <option value="club_meeting">Club Meeting</option>
                  <option value="club_assembly">Club Assembly</option>
                  <option value="club_social">Club Social</option>
                  <option value="service_project">Service Project</option>
                  <option value="observance">Observance</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8]"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={editData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8] resize-vertical"
                />
              </div>

              {/* Agenda - For meetings with structured agendas */}
              {(editData.type === 'club_meeting' || editData.type === 'club_assembly' || editData.type === 'board_meeting' || editData.type === 'committee_meeting') && (
                <div className="mb-6">
                  <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Agenda
                  </label>
                  <Suspense fallback={<div className="h-32 bg-gray-50 rounded border border-gray-200 animate-pulse" />}>
                    <RichTextEditor
                      content={editData.agenda}
                      onChange={(html) => setEditData({ ...editData, agenda: html })}
                      placeholder="Enter meeting agenda (use toolbar for formatting)..."
                    />
                  </Suspense>
                  <p className="mt-1 text-xs text-gray-500">
                    Use the toolbar buttons to format your agenda with headings, lists, and emphasis.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Calendar Preview</h4>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">
                    {new Date(editData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    editData.type === 'club_meeting' ? 'bg-[#0067c8] text-white' :
                    editData.type === 'club_assembly' ? 'bg-green-600 text-white' :
                    editData.type === 'service_project' ? 'bg-[#00adbb] text-white' :
                    editData.type === 'observance' ? 'bg-[#f7a81b] text-white' :
                    editData.type === 'holiday' ? 'bg-[#d41367] text-white' :
                    'bg-purple-500 text-white'
                  }`}>
                    {editData.type === 'club_meeting' ? 'Meeting' :
                     editData.type === 'club_assembly' ? 'Assembly' :
                     editData.type === 'service_project' ? 'Service' :
                     editData.type === 'observance' ? 'Observance' :
                     editData.type === 'holiday' ? 'Holiday' : 'Event'}
                  </div>
                </div>
                {editData.title && (
                  <div className="text-sm text-gray-700 mt-2">{editData.title}</div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={loading}
                className="px-4 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Event
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleEditClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !editData.title.trim()}
                  className={`px-4 py-2 ${editTypeInfo.bg} ${editTypeInfo.text} rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto touch-manipulation">
        {/* Header */}
        <div className={`${eventTypeInfo.bg} ${eventTypeInfo.text} px-6 py-4 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 text-white flex items-center justify-center mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-opacity-90 text-sm">{eventTypeInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* RSVP Button - Only for meeting types */}
            {onOpenRSVP && ['club_meeting', 'club_assembly', 'club_social', 'board_meeting', 'committee_meeting', 'service_project'].includes(event.type) && (
              <button
                onClick={onOpenRSVP}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm shadow-md"
              >
                <UserCheck size={16} />
                RSVP
              </button>
            )}
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors text-sm"
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date, Time, and Type */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>{formatDate(event.date)}</span>
              </div>
              {formatTimeRange() && (
                <div className="flex items-center gap-2 text-lg font-semibold text-[#0067c8] ml-5">
                  <span>{formatTimeRange()}</span>
                </div>
              )}
            </div>
            <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${eventTypeInfo.bgLight} ${eventTypeInfo.textLight}`}>
              {eventTypeInfo.label}
            </div>
          </div>

          {/* Description */}
          <div className={`p-4 ${eventTypeInfo.bgLight} rounded-lg border-l-4 ${eventTypeInfo.border} mb-6`}>
            <div className="flex items-start">
              <Info size={16} className={`${eventTypeInfo.textLight} mt-0.5 mr-2 flex-shrink-0`} />
              <div>
                <p className={`text-sm font-medium mb-1 ${eventTypeInfo.textLight}`}>
                  {eventTypeInfo.description}
                </p>
                {event.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Event Type</h4>
              <p className="text-gray-600">{eventTypeInfo.label}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Date</h4>
              <p className="text-gray-600">{formatDate(event.date)}</p>
            </div>

            {location && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-[#0067c8]" />
                  Location
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  {/* Basic Info (Always Visible) */}
                  <p className="font-medium text-gray-900">{location.name}</p>
                  {location.address && (
                    <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                  )}

                  {/* Expandable Details */}
                  {showLocationDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                      {/* Contact Information */}
                      {(location.phone || location.email || location.website || location.whatsapp) && (
                        <div className="space-y-2">
                          {location.phone && (
                            <a
                              href={`tel:${location.phone}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0067c8] transition-colors"
                            >
                              <Phone size={14} className="text-[#0067c8]" />
                              {location.phone}
                            </a>
                          )}
                          {location.email && (
                            <a
                              href={`mailto:${location.email}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0067c8] transition-colors break-all"
                            >
                              <Mail size={14} className="text-[#0067c8]" />
                              {location.email}
                            </a>
                          )}
                          {location.whatsapp && (
                            <a
                              href={`https://wa.me/${location.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0067c8] transition-colors"
                            >
                              <MessageCircle size={14} className="text-[#0067c8]" />
                              WhatsApp
                            </a>
                          )}
                          {location.website && (
                            <a
                              href={location.website.startsWith('http') ? location.website : `https://${location.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#0067c8] transition-colors break-all"
                            >
                              <Globe size={14} className="text-[#0067c8]" />
                              {location.website}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Social Media Links */}
                      {(location.facebook || location.instagram || location.youtube) && (
                        <div className="flex items-center gap-3 pt-2">
                          {location.facebook && (
                            <a
                              href={location.facebook.startsWith('http') ? location.facebook : `https://facebook.com/${location.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1877F2] hover:bg-[#0d5dbe] text-white transition-colors"
                              aria-label="Facebook"
                            >
                              <Facebook size={16} />
                            </a>
                          )}
                          {location.instagram && (
                            <a
                              href={location.instagram.startsWith('http') ? location.instagram : `https://instagram.com/${location.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] hover:opacity-90 text-white transition-opacity"
                              aria-label="Instagram"
                            >
                              <Instagram size={16} />
                            </a>
                          )}
                          {location.youtube && (
                            <a
                              href={location.youtube.startsWith('http') ? location.youtube : `https://youtube.com/${location.youtube}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF0000] hover:bg-[#cc0000] text-white transition-colors"
                              aria-label="YouTube"
                            >
                              <Youtube size={16} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Key Contact */}
                      {location.key_contact && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 pt-2">
                          <User size={14} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Contact: </span>
                            {location.key_contact}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {location.notes && (
                        <div className="text-sm text-gray-600 bg-white rounded p-2 border border-gray-200">
                          <span className="font-medium text-gray-700">Note: </span>
                          {location.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toggle Button */}
                  <button
                    onClick={() => setShowLocationDetails(!showLocationDetails)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-[#0067c8] hover:text-[#004d99] transition-colors w-full justify-center py-2 rounded hover:bg-blue-50"
                  >
                    {showLocationDetails ? (
                      <>
                        Hide Details
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Show Details
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Agenda - For meetings with structured agendas */}
          {event.agenda && (event.type === 'club_meeting' || event.type === 'club_assembly' || event.type === 'board_meeting' || event.type === 'committee_meeting') && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Meeting Agenda</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div
                  className="agenda-content text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.agenda) }}
                />
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {event.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Notes</h4>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={loading}
        onConfirm={handleDeleteEventConfirmed}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}