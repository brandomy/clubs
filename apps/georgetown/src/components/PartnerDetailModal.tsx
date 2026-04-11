import { logger } from '../utils/logger'
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { X, Edit, Trash2, Building2, Calendar, Mail, Phone, Globe, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Partner } from '../types/database'
import { format } from 'date-fns'

interface PartnerDetailModalProps {
  partner: Partner
  onClose: () => void
  onEdit: () => void
}

export default function PartnerDetailModal({ partner, onClose, onEdit }: PartnerDetailModalProps) {
  const { showToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partner.id)

      if (error) throw error
      onClose()
    } catch (err) {
      logger.error('Error deleting partner:', err)
      showToast('Failed to delete partner. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const getPartnerTypeColor = (type: string) => {
    const colors = {
      'Rotary Club': '#0067c8',      // Rotary Azure (primary)
      'Foundation': '#901f93',       // Violet (official Rotary secondary)
      'NGO': '#009739',              // Grass Green (official Rotary)
      'Corporate': '#e02927',        // Cardinal (official Rotary)
      'Government': '#17458f',       // Rotary Royal Blue (official Rotary)
    }
    return colors[type as keyof typeof colors] || '#6b7280'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0067c8] text-white px-6 py-4 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-white" />
            <h2 className="text-xl font-bold">Partner Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Edit partner"
            >
              <Edit size={18} />
              <span className="text-sm font-medium">Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logo and Name Section */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            {partner.logo_url ? (
              <div className="w-24 h-24 border-2 border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                <img
                  src={partner.logo_url}
                  alt={`${partner.name} logo`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
                <Building2 size={32} className="text-gray-400" />
              </div>
            )}

            {/* Name and Type */}
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{partner.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: getPartnerTypeColor(partner.type) }}
                >
                  <span>{partner.type}</span>
                </span>
                {partner.status && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      partner.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {partner.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Partnership Since */}
          {partner.relationship_since && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Calendar size={16} />
                <span className="font-medium">Partnership Since:</span>
                <span>{format(new Date(partner.relationship_since), 'MMMM d, yyyy')}</span>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
              Contact Information
            </h4>
            <div className="space-y-3">
              {partner.contact_name && (
                <div className="flex items-center gap-3 text-gray-700">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <span className="text-xs text-gray-500 block">Contact Person</span>
                    <span className="font-medium">{partner.contact_name}</span>
                  </div>
                </div>
              )}

              {partner.contact_email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={18} className="text-gray-400" />
                  <div>
                    <span className="text-xs text-gray-500 block">Email</span>
                    <a
                      href={`mailto:${partner.contact_email}`}
                      className="font-medium text-[#0067c8] hover:underline"
                    >
                      {partner.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {partner.contact_phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-gray-400" />
                  <div>
                    <span className="text-xs text-gray-500 block">Phone</span>
                    <a
                      href={`tel:${partner.contact_phone}`}
                      className="font-medium text-[#0067c8] hover:underline"
                    >
                      {partner.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {partner.website && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Globe size={18} className="text-gray-400" />
                  <div>
                    <span className="text-xs text-gray-500 block">Website</span>
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#0067c8] hover:underline"
                    >
                      {partner.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes (Legacy contact_info field) */}
          {partner.contact_info && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                Additional Notes
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{partner.contact_info}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Created: {format(new Date(partner.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Updated: {format(new Date(partner.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              disabled={isDeleting}
            >
              <Trash2 size={18} />
              <span>Delete Partner</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Partner?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{partner.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Partner'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
