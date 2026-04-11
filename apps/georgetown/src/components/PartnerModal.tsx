import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Partner } from '../types/database'
import ImageUpload from './ImageUpload'
import { FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaWhatsapp, FaYoutube, FaTiktok, FaTelegram } from 'react-icons/fa'
import { SiWechat } from 'react-icons/si'

interface PartnerModalProps {
  partner: Partner | null
  onClose: () => void
}

const PARTNER_TYPES = ['Rotary Club', 'Foundation', 'NGO', 'Corporate', 'Government'] as const
const PARTNER_STATUSES = ['Active', 'Inactive'] as const

export default function PartnerModal({ partner, onClose }: PartnerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'NGO' as typeof PARTNER_TYPES[number],
    contact_info: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    city: '',
    country: '',
    status: 'Active' as typeof PARTNER_STATUSES[number],
    relationship_since: '',
    logo_url: '',
    social_media_links: {} as Record<string, string>,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        type: partner.type as typeof PARTNER_TYPES[number],
        contact_info: partner.contact_info || '',
        contact_name: partner.contact_name || '',
        contact_email: partner.contact_email || '',
        contact_phone: partner.contact_phone || '',
        website: partner.website || '',
        city: partner.city || '',
        country: partner.country || '',
        status: (partner.status || 'Active') as typeof PARTNER_STATUSES[number],
        relationship_since: partner.relationship_since || '',
        logo_url: partner.logo_url || '',
        social_media_links: partner.social_media_links || {},
      })
    }
  }, [partner])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Partner name is required')
      return
    }

    // Email validation
    if (formData.contact_email && !formData.contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      return
    }

    // Website URL validation
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      setError('Website must start with http:// or https://')
      return
    }

    try {
      setIsSaving(true)

      // Filter out empty social media links
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(formData.social_media_links).filter(([_, url]) => url && url.trim() !== '') // eslint-disable-line @typescript-eslint/no-unused-vars
      )

      const dataToSave = {
        name: formData.name.trim(),
        type: formData.type,
        contact_info: formData.contact_info.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website: formData.website.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        status: formData.status,
        relationship_since: formData.relationship_since || null,
        logo_url: formData.logo_url || null,
        social_media_links: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null,
      }

      if (partner) {
        // Update existing partner
        const { error: updateError } = await supabase
          .from('partners')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        if (updateError) throw updateError
      } else {
        // Create new partner
        const { error: insertError } = await supabase
          .from('partners')
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      onClose()
    } catch (err) {
      console.error('Error saving partner:', err)
      setError(err instanceof Error ? err.message : 'Failed to save partner')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0067c8] p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
            {partner ? 'Edit Partner' : 'Add Partner'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

            {/* Partner Logo */}
            <ImageUpload
              label="Partner Logo"
              currentImageUrl={formData.logo_url}
              onImageChange={(url) => setFormData({ ...formData, logo_url: url || '' })}
              bucketName="partner-logos"
              filePrefix="partner-"
              aspectRatio="free"
              maxSizeMB={5}
              showPositionControl={false}
              helpText="Transparent PNG recommended • 400×200px minimum • 800×400px ideal • Max 5MB"
            />

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="e.g., Penang Rotary Club"
                required
              />
            </div>

            {/* Type and Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof PARTNER_TYPES[number] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  required
                >
                  {PARTNER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof PARTNER_STATUSES[number] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                >
                  {PARTNER_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Relationship Since */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Since
              </label>
              <input
                type="date"
                value={formData.relationship_since}
                onChange={(e) => setFormData({ ...formData, relationship_since: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>

            {/* Contact Person Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  placeholder="+60 12-345 6789"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            {/* City and Country */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  placeholder="e.g., Kuala Lumpur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  placeholder="e.g., Malaysia"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Links
              </label>

              {/* LinkedIn */}
              <div className="flex items-center gap-2">
                <span className="text-[#0A66C2] flex-shrink-0"><FaLinkedin size={18} /></span>
                <input
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={formData.social_media_links?.linkedin || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      linkedin: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-2">
                <span className="text-[#1877F2] flex-shrink-0"><FaFacebook size={18} /></span>
                <input
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.social_media_links?.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      facebook: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-2">
                <span className="text-[#E4405F] flex-shrink-0"><FaInstagram size={18} /></span>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={formData.social_media_links?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      instagram: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2">
                <span className="text-[#25D366] flex-shrink-0"><FaWhatsapp size={18} /></span>
                <input
                  type="tel"
                  placeholder="+60123456789 or https://wa.me/60123456789"
                  value={formData.social_media_links?.whatsapp || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      whatsapp: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* WeChat */}
              <div className="flex items-center gap-2">
                <span className="text-[#07C160] flex-shrink-0"><SiWechat size={18} /></span>
                <input
                  type="text"
                  placeholder="WeChat ID or QR code URL"
                  value={formData.social_media_links?.wechat || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      wechat: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Telegram */}
              <div className="flex items-center gap-2">
                <span className="text-[#0088cc] flex-shrink-0"><FaTelegram size={18} /></span>
                <input
                  type="text"
                  placeholder="https://t.me/username"
                  value={formData.social_media_links?.telegram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      telegram: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* YouTube */}
              <div className="flex items-center gap-2">
                <span className="text-[#FF0000] flex-shrink-0"><FaYoutube size={18} /></span>
                <input
                  type="url"
                  placeholder="https://youtube.com/@username"
                  value={formData.social_media_links?.youtube || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      youtube: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* Twitter/X */}
              <div className="flex items-center gap-2">
                <span className="text-[#1DA1F2] flex-shrink-0"><FaTwitter size={18} /></span>
                <input
                  type="url"
                  placeholder="https://twitter.com/... or https://x.com/..."
                  value={formData.social_media_links?.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      twitter: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-2">
                <span className="text-[#000000] flex-shrink-0"><FaTiktok size={18} /></span>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@username"
                  value={formData.social_media_links?.tiktok || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media_links: {
                      ...formData.social_media_links,
                      tiktok: e.target.value
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Legacy Contact Info (kept for backward compatibility) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="Any additional contact details or notes..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : partner ? 'Update Partner' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
