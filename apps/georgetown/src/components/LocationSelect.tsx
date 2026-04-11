import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import { Plus, MapPin, X, Edit2, Trash2, Settings, Phone, Mail, MessageCircle, Globe, Facebook, Instagram, Youtube, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Location } from '../types/database'

interface LocationSelectProps {
  value?: string
  onChange: (locationId: string | undefined) => void
  required?: boolean
  className?: string
}

export default function LocationSelect({ value, onChange, required = false, className = '' }: LocationSelectProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    key_contact: '',
    notes: ''
  })
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  useEffect(() => {
    fetchLocations()

    const subscription = supabase
      .channel('locations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gt_locations' },
        handleRealtimeUpdate
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('gt_locations')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching locations:', error)
    } else {
      setLocations(data || [])
    }
    setLoading(false)
  }

  const handleRealtimeUpdate = (payload: { eventType: string; new: unknown; old: unknown }) => {
    if (payload.eventType === 'INSERT') {
      setLocations((prev) => [...prev, payload.new as Location].sort((a, b) => a.name.localeCompare(b.name)))
    } else if (payload.eventType === 'UPDATE') {
      setLocations((prev) =>
        prev.map((location) =>
          location.id === (payload.new as Location).id ? (payload.new as Location) : location
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
    } else if (payload.eventType === 'DELETE') {
      setLocations((prev) =>
        prev.filter((location) => location.id !== (payload.old as Location).id)
      )
    }
  }

  const handleAddLocation = async () => {
    if (!formData.name.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('gt_locations')
      .insert({
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        website: formData.website.trim() || null,
        facebook: formData.facebook.trim() || null,
        instagram: formData.instagram.trim() || null,
        youtube: formData.youtube.trim() || null,
        key_contact: formData.key_contact.trim() || null,
        notes: formData.notes.trim() || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error adding location:', error)
      if (error.code === '23505') {
        showToast('A location with this name already exists. Please use a different name.', 'warning')
      } else {
        showToast('Failed to add location. Please try again.', 'error')
      }
    } else {
      onChange(data.id)
      setShowAddModal(false)
      setFormData({ name: '', address: '', phone: '', email: '', whatsapp: '', website: '', facebook: '', instagram: '', youtube: '', key_contact: '', notes: '' })
    }
    setSaving(false)
  }

  const handleEditClick = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      whatsapp: location.whatsapp || '',
      website: location.website || '',
      facebook: location.facebook || '',
      instagram: location.instagram || '',
      youtube: location.youtube || '',
      key_contact: location.key_contact || '',
      notes: location.notes || ''
    })
    setShowEditModal(true)
    setShowManageModal(false)
  }

  const handleUpdateLocation = async () => {
    if (!editingLocation || !formData.name.trim()) return

    setSaving(true)
    const { error } = await supabase
      .from('gt_locations')
      .update({
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        website: formData.website.trim() || null,
        facebook: formData.facebook.trim() || null,
        instagram: formData.instagram.trim() || null,
        youtube: formData.youtube.trim() || null,
        key_contact: formData.key_contact.trim() || null,
        notes: formData.notes.trim() || null
      })
      .eq('id', editingLocation.id)

    if (error) {
      logger.error('Error updating location:', error)
      if (error.code === '23505') {
        showToast('A location with this name already exists. Please use a different name.', 'warning')
      } else {
        showToast('Failed to update location. Please try again.', 'error')
      }
    } else {
      setShowEditModal(false)
      setEditingLocation(null)
      setFormData({ name: '', address: '', phone: '', email: '', whatsapp: '', website: '', facebook: '', instagram: '', youtube: '', key_contact: '', notes: '' })
    }
    setSaving(false)
  }

  const handleDeleteLocation = (location: Location) => {
    if (value === location.id) {
      showToast('Cannot delete the currently selected location. Please select a different location first.', 'warning')
      return
    }
    setDeleteTarget(location)
  }

  const handleDeleteLocationConfirmed = async () => {
    if (!deleteTarget) return
    const location = deleteTarget
    setDeleteTarget(null)
    setSaving(true)

    const { error } = await supabase
      .from('gt_locations')
      .delete()
      .eq('id', location.id)

    if (error) {
      logger.error('Error deleting location:', error)
      showToast('Failed to delete location. It may be in use by existing events.', 'error')
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingLocation(null)
    setFormData({ name: '', address: '', phone: '', email: '', whatsapp: '', website: '', facebook: '', instagram: '', youtube: '', key_contact: '', notes: '' })
  }

  const renderLocationCard = (location: Location) => {
    const hasContact = location.phone || location.email || location.whatsapp
    const hasSocial = location.website || location.facebook || location.instagram || location.youtube

    return (
      <div className="space-y-2">
        <div className="font-medium text-gray-900">{location.name}</div>

        {location.address && (
          <div className="text-sm text-gray-600">{location.address}</div>
        )}

        {location.key_contact && (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <User size={14} className="text-[#0067c8]" />
            <span>{location.key_contact}</span>
          </div>
        )}

        {hasContact && (
          <div className="flex flex-wrap gap-2">
            {location.phone && (
              <a
                href={`tel:${location.phone}`}
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={12} />
                <span>Call</span>
              </a>
            )}
            {location.email && (
              <a
                href={`mailto:${location.email}`}
                className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={12} />
                <span>Email</span>
              </a>
            )}
            {location.whatsapp && (
              <a
                href={`https://wa.me/${location.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}

        {hasSocial && (
          <div className="flex flex-wrap gap-2">
            {location.website && (
              <a
                href={location.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe size={12} />
                <span>Website</span>
              </a>
            )}
            {location.facebook && (
              <a
                href={location.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Facebook size={12} />
                <span>FB</span>
              </a>
            )}
            {location.instagram && (
              <a
                href={location.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded hover:bg-pink-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Instagram size={12} />
                <span>IG</span>
              </a>
            )}
            {location.youtube && (
              <a
                href={location.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Youtube size={12} />
                <span>YT</span>
              </a>
            )}
          </div>
        )}

        {location.notes && (
          <div className="text-xs text-gray-500 italic">{location.notes}</div>
        )}
      </div>
    )
  }

  const renderFormFields = () => (
    <div className="p-6 space-y-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2">Basic Information</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Nona Bali Restaurant"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            disabled={saving}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="e.g., 3, Lintang Burma, Pulau Tikus, 10350 Penang, Malaysia"
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent resize-none"
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Key Contact Person
          </label>
          <input
            type="text"
            value={formData.key_contact}
            onChange={(e) => setFormData(prev => ({ ...prev, key_contact: e.target.value }))}
            placeholder="e.g., Peter"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            disabled={saving}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2">Contact Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+60 19 308 5983"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              placeholder="+60 19 308 5983"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="nonabalipinang@gmail.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            disabled={saving}
          />
        </div>
      </div>

      {/* Social Media & Web */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b pb-2">Online Presence</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://nonabalirestaurant.com/"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={formData.facebook}
              onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
              placeholder="Facebook URL"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={formData.instagram}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
              placeholder="Instagram URL"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              YouTube
            </label>
            <input
              type="url"
              value={formData.youtube}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
              placeholder="YouTube URL"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional information about this location"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent resize-none"
          disabled={saving}
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0067c8]"></div>
        <span className="text-sm text-gray-600">Loading locations...</span>
      </div>
    )
  }

  const selectedLocation = value ? locations.find(l => l.id === value) : null

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <div className="flex gap-2">
          <div className="flex-1">
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value || undefined)}
              required={required}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Select a location...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-3 bg-white border-2 border-[#0067c8] text-[#0067c8] rounded-lg hover:bg-[#0067c8] hover:text-white transition-colors flex items-center gap-2 font-semibold min-w-[44px] min-h-[44px]"
            title="Add new location"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            onClick={() => setShowManageModal(true)}
            className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold min-w-[44px] min-h-[44px]"
            title="Manage locations"
          >
            <Settings size={20} />
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>

        {selectedLocation && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <MapPin size={16} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {renderLocationCard(selectedLocation)}
            </div>
            <button
              type="button"
              onClick={() => handleEditClick(selectedLocation)}
              className="p-2 text-gray-400 hover:text-[#0067c8] hover:bg-white rounded transition-colors flex-shrink-0"
              title="Edit location"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0067c8] rounded-lg">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Location</h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={saving}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {renderFormFields()}

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLocation}
                className="flex-1 px-6 py-3 bg-[#0067c8] text-white rounded-lg hover:bg-[#004080] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || !formData.name.trim()}
              >
                {saving ? 'Adding...' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditModal && editingLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0067c8] rounded-lg">
                    <Edit2 className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Location</h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={saving}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {renderFormFields()}

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLocation}
                className="flex-1 px-6 py-3 bg-[#0067c8] text-white rounded-lg hover:bg-[#004080] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || !formData.name.trim()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Locations Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0067c8] rounded-lg">
                    <Settings className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Manage Locations</h2>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {locations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No locations yet. Click "Add New" to create your first location.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <MapPin size={20} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {renderLocationCard(location)}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditClick(location)}
                          className="p-2 text-gray-400 hover:text-[#0067c8] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit location"
                          disabled={saving}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete location"
                          disabled={saving}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowManageModal(false)
                  setShowAddModal(true)
                }}
                className="flex-1 px-6 py-3 bg-[#0067c8] text-white rounded-lg hover:bg-[#004080] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add New Location
              </button>
              <button
                onClick={() => setShowManageModal(false)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete Location"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? Events using this location will have their location cleared. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        isLoading={saving}
        onConfirm={handleDeleteLocationConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
