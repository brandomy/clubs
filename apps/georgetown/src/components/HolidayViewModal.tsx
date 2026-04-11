import { logger } from '../utils/logger'
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { X, Calendar, Edit, MapPin, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HolidayViewModalProps {
  holiday: {
    id: string
    date: string
    title: string
    description?: string
    type: 'holiday'
  }
  onClose: () => void
  onHolidayUpdated?: () => void
}

export default function HolidayViewModal({ holiday, onClose, onHolidayUpdated }: HolidayViewModalProps) {
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: holiday.title,
    description: holiday.description || '',
    date: holiday.date
  })
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({
      title: holiday.title,
      description: holiday.description || '',
      date: holiday.date
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if this is a static holiday (starts with 'static-holiday-')
      if (holiday.id.startsWith('static-holiday-')) {
        // Convert static holiday to database holiday
        const { error } = await supabase
          .from('events')
          .insert([{
            date: editData.date,
            type: 'holiday',
            title: editData.title,
            description: editData.description || null,
            created_by: 'system',
            updated_by: 'system'
          }])
          .select()

        if (error) throw error
      } else {
        // Update existing database holiday
        const { error } = await supabase
          .from('events')
          .update({
            title: editData.title,
            description: editData.description || null,
            date: editData.date,
            updated_by: 'system'
          })
          .eq('id', holiday.id)

        if (error) throw error
      }

      logger.log('Holiday updated successfully')
      onHolidayUpdated?.()
      setIsEditing(false)
      onClose()
    } catch (error) {
      logger.error('Error updating holiday:', error)
      showToast('Failed to update holiday. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getHolidayTypeInfo = () => {
    return {
      label: 'Malaysia Holiday',
      color: 'text-[#d41367]',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  }

  const typeInfo = getHolidayTypeInfo()

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveEdit}>
            {/* Header */}
            <div className="bg-[#d41367] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-3" size={24} />
                <h2 className="text-xl font-semibold">Edit Holiday</h2>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
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
                  value={editData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d41367] focus:border-[#d41367]"
                />
              </div>

              {/* Holiday Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Chinese New Year"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d41367] focus:border-[#d41367]"
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
                  value={editData.description}
                  onChange={handleInputChange}
                  placeholder="Optional details about the holiday observance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d41367] focus:border-[#d41367] resize-vertical"
                />
              </div>

              {/* Preview */}
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
                  <div className="text-xs px-2 py-1 rounded bg-[#d41367] text-white">
                    Holiday
                  </div>
                </div>
                {editData.title && (
                  <div className="text-sm text-gray-700 mt-2">{editData.title}</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !editData.title.trim()}
                className="px-4 py-2 bg-[#d41367] text-white rounded-lg hover:bg-[#b01549] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Save Holiday
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#d41367] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="mr-3" size={24} />
            <h2 className="text-xl font-semibold">Holiday Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Holiday Type Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.borderColor} border`}>
            <Calendar size={16} className="mr-2" />
            {typeInfo.label}
          </div>

          {/* Holiday Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {holiday.title}
          </h1>

          {/* Date Information */}
          <div className="flex items-center text-gray-600 mb-6">
            <Clock size={18} className="mr-2" />
            <span className="text-lg">
              {formatDate(holiday.date)}
            </span>
          </div>

          {/* Description */}
          {holiday.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {holiday.description}
              </p>
            </div>
          )}

          {/* Malaysia Holiday Context */}
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#d41367] mb-2">Malaysia Holiday Information</h3>
            <p className="text-sm text-[#b01549]">
              This is a recognized holiday in Malaysia. Georgetown Rotary Club meetings and activities may be adjusted to accommodate this observance.
            </p>
          </div>

          {/* Edit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleEdit}
              className="flex items-center px-6 py-3 bg-[#d41367] text-white rounded-lg hover:bg-[#b01549] transition-colors font-medium"
            >
              <Edit size={18} className="mr-2" />
              Edit Holiday
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Holiday ID: {holiday.id}
            </div>
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              Georgetown, Penang, Malaysia
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}