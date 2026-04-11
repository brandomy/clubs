import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from './ConfirmModal'
import { X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AVAILABLE_FIELDS } from '../lib/database-config'
import type { Speaker, Member } from '../types/database'
import ImageUpload from './ImageUpload'
import { FaFacebook, FaLinkedin, FaInstagram, FaTwitter, FaWhatsapp, FaYoutube, FaTiktok, FaTelegram } from 'react-icons/fa'
import { SiWechat } from 'react-icons/si'
import { trackForm, trackInteraction, trackModal } from '../utils/analytics'

interface SpeakerModalProps {
  speaker: Speaker | null  // null = Add mode, object = Edit mode
  onClose: () => void
  defaultStatus?: Speaker['status']
  defaultScheduledDate?: string
}

export default function SpeakerModal({ speaker, onClose, defaultStatus, defaultScheduledDate }: SpeakerModalProps) {
  const isEditing = !!speaker

  const [formData, setFormData] = useState({
    name: speaker?.name || '',
    job_title: speaker?.job_title || '',
    email: speaker?.email || '',
    phone: speaker?.phone || '',
    organization: speaker?.organization || '',
    topic: speaker?.topic || '',
    description: speaker?.description || '',
    primary_url: speaker?.primary_url || '',
    additional_urls: speaker?.additional_urls || [''],
    linkedin_url: speaker?.linkedin_url || '',
    portrait_url: speaker?.portrait_url || '',
    notes: speaker?.notes || '',
    status: speaker?.status || defaultStatus || 'ideas',
    scheduled_date: speaker?.scheduled_date || defaultScheduledDate || '',
    is_rotarian: speaker?.is_rotarian || false,
    rotary_club: speaker?.rotary_club || '',
    recommend: speaker?.recommend || false,
    recommendation_notes: speaker?.recommendation_notes || '',
    proposer_id: speaker?.proposer_id || '',
    social_media_links: speaker?.social_media_links || {} as Record<string, string>,
  })
  const { showToast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  // Track modal open
  useEffect(() => {
    const modalName = isEditing ? 'speaker-edit-modal' : 'speaker-add-modal'
    trackModal.open(modalName, 'kanban-board')
  }, [])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('gt_members')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) {
        logger.error('Error loading members:', error)
      } else {
        setMembers(data || [])
      }
    } catch (error) {
      logger.error('Error loading members:', error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Track form submit attempt (user intent, before API call)
    const formName = isEditing ? 'speaker-edit-form' : 'speaker-add-form'
    trackForm.attempt(formName)

    // Build database object with only available fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      organization: formData.organization,
      topic: formData.topic,
      notes: formData.notes,
      status: formData.status,
      scheduled_date: formData.scheduled_date || null,
      proposer_id: formData.proposer_id || null,
    }

    // Only include marketing fields if database has been migrated
    if (AVAILABLE_FIELDS.job_title) {
      dbData.job_title = formData.job_title
      dbData.description = formData.description
      dbData.primary_url = formData.primary_url
      dbData.additional_urls = formData.additional_urls.filter(url => url.trim() !== '')
      dbData.linkedin_url = formData.linkedin_url
      dbData.portrait_url = formData.portrait_url
      dbData.is_rotarian = formData.is_rotarian
      dbData.rotary_club = formData.rotary_club

      // Clean and add social media links (only non-empty values)
      const cleanedSocialLinks = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Object.entries(formData.social_media_links).filter(([_, url]) => url && url.trim() !== '')
      )
      dbData.social_media_links = Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : null
    }

    // Handle recommendation fields
    if (formData.status === 'spoken') {
      dbData.recommend = formData.recommend
      if (formData.recommend) {
        dbData.recommendation_notes = formData.recommendation_notes
        if (isEditing && !speaker.recommendation_date && formData.recommend) {
          dbData.recommendation_date = new Date().toISOString()
        }
      } else {
        dbData.recommendation_notes = null
        dbData.recommendation_date = null
      }
    }

    try {
      if (isEditing) {
        // UPDATE operation
        dbData.updated_by = 'current_user'

        const { error } = await supabase
          .from('gt_speakers')
          .update(dbData)
          .eq('id', speaker.id)

        if (error) {
          logger.error('Error updating speaker:', error)
          trackForm.error(formName, error.message)
          showToast('Error updating speaker. Please try again.', 'error')
          return
        }
      } else {
        // INSERT operation
        dbData.created_by = 'current_user'
        dbData.updated_by = 'current_user'

        const { error } = await supabase
          .from('gt_speakers')
          .insert(dbData)

        if (error) {
          logger.error('Error creating speaker:', error)
          trackForm.error(formName, error.message)
          showToast('Error creating speaker. Please try again.', 'error')
          return
        }
      }

      // Track successful form submission
      trackForm.success(formName, {
        action: isEditing ? 'update' : 'create',
        status: formData.status,
      })

      onClose()
    } catch (error) {
      logger.error('Error saving speaker:', error)
      trackForm.error(formName, error instanceof Error ? error.message : 'Unknown error')
      showToast(`Error ${isEditing ? 'updating' : 'creating'} speaker. Please try again.`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!speaker) return
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!speaker) return
    setShowDeleteConfirm(false)
    trackInteraction('speaker-delete-attempt', 'speaker-modal', speaker.id)

    const { error } = await supabase
      .from('gt_speakers')
      .delete()
      .eq('id', speaker.id)

    if (error) {
      logger.error('Error deleting speaker:', error)
      trackInteraction('speaker-delete-error', 'speaker-modal', error.message)
      showToast('Error deleting speaker. Please try again.', 'error')
    } else {
      trackInteraction('speaker-delete-success', 'speaker-modal', speaker.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#0067c8] p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Speaker' : 'Add Speaker'}
            </h2>
            <button
              onClick={() => {
                const modalName = isEditing ? 'speaker-edit-modal' : 'speaker-add-modal'
                trackModal.close(modalName)
                onClose()
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* SECTION 1: VISUAL IDENTITY */}
          {/* Speaker Portrait - At top for visual prominence */}
          <ImageUpload
            label="Speaker Portrait"
            currentImageUrl={formData.portrait_url}
            onImageChange={(url) => setFormData({ ...formData, portrait_url: url || '' })}
            bucketName="speaker-portraits"
            filePrefix="speaker-"
            aspectRatio="1:1"
            maxSizeMB={5}
            showPositionControl={false}
            helpText="Square headshot recommended • 400×400px minimum • 800×800px ideal • Max 5MB"
          />

          {/* SECTION 2: CORE IDENTITY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              placeholder="The compelling topic that attracted this speaker"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            {AVAILABLE_FIELDS.job_title ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* SECTION 3: OPERATIONAL TRACKING */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Speaker['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              >
                <option value="ideas">Ideas</option>
                <option value="approached">Approached</option>
                <option value="agreed">Agreed</option>
                <option value="scheduled">Scheduled</option>
                <option value="spoken">Spoken</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
                {formData.scheduled_date && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduled_date: '' })}
                    className="px-3 py-2 text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors"
                    title="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation Section - Shows immediately when status is "Spoken" */}
          {formData.status === 'spoken' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={formData.recommend}
                  onChange={(e) => setFormData({ ...formData, recommend: e.target.checked })}
                  className="w-4 h-4 text-[#f7a81b] border-gray-300 rounded focus:ring-[#f7a81b] focus:ring-2"
                />
                <label htmlFor="recommend" className="text-sm font-medium text-gray-700">
                  Recommend this speaker
                </label>
              </div>

              {formData.recommend && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.recommendation_notes}
                    onChange={(e) => setFormData({ ...formData, recommendation_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7a81b] focus:border-transparent"
                    placeholder="Why do you recommend this speaker? Any specific strengths or topics?"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed by
            </label>
            <select
              value={formData.proposer_id}
              onChange={(e) => setFormData({ ...formData, proposer_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              disabled={isLoadingMembers}
            >
              <option value="">
                {isLoadingMembers ? 'Loading members...' : 'Unknown / Select member'}
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.prefix ? `${member.prefix} ` : ''}{member.name}
                  {member.roles && member.roles.length > 0 && !member.roles.includes('Member') ? ` (${member.roles[0]})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 4: CONTACT INFORMATION */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              />
            </div>
          </div>

          {/* SECTION 5: MARKETING & PROFESSIONAL PROFILE */}
          {AVAILABLE_FIELDS.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="Speaker background, expertise, key messages for marketing materials..."
              />
            </div>
          )}

          {/* URL Section - Only show if database supports it */}
          {AVAILABLE_FIELDS.primary_url && (
            <div className="space-y-4">
              {/* LinkedIn URL - Dedicated field */}
              {AVAILABLE_FIELDS.linkedin_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                    placeholder="https://www.linkedin.com/in/username"
                    pattern="https?:\/\/(www\.)?linkedin\.com\/.*"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website/Profile URL
              </label>
              <input
                type="url"
                value={formData.primary_url}
                onChange={(e) => setFormData({ ...formData, primary_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                placeholder="Company website or other profile"
              />
            </div>

            {/* Additional URLs */}
            {formData.additional_urls.map((url, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional URL {index + 1}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...formData.additional_urls]
                      newUrls[index] = e.target.value
                      setFormData({ ...formData, additional_urls: newUrls })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                    placeholder="Additional website or profile"
                  />
                </div>
                {formData.additional_urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newUrls = formData.additional_urls.filter((_, i) => i !== index)
                      setFormData({ ...formData, additional_urls: newUrls })
                    }}
                    className="p-3 md:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    title="Remove URL"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {formData.additional_urls.length < 4 && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, additional_urls: [...formData.additional_urls, ''] })
                }}
                className="flex items-center gap-2 p-3 md:p-2 text-[#0067c8] hover:text-[#004a8a] hover:bg-blue-50 rounded-lg transition-colors touch-manipulation text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another URL
              </button>
            )}
            </div>
          )}

          {/* Social Media Links */}
          {AVAILABLE_FIELDS.primary_url && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Links
              </label>

              {/* LinkedIn */}
              <div className="flex items-center gap-2">
                <span className="text-[#0A66C2] flex-shrink-0"><FaLinkedin size={18} /></span>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
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
                  type="url"
                  placeholder="https://wa.me/..."
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
                  placeholder="WeChat ID"
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
                  type="url"
                  placeholder="https://t.me/..."
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
                  placeholder="https://youtube.com/@..."
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
                  placeholder="https://tiktok.com/@..."
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
          )}

          {/* SECTION 6: ROTARY AFFILIATION */}

          {AVAILABLE_FIELDS.is_rotarian && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_rotarian"
                checked={formData.is_rotarian}
                onChange={(e) => setFormData({ ...formData, is_rotarian: e.target.checked, rotary_club: e.target.checked ? formData.rotary_club : '' })}
                className="w-4 h-4 text-[#0067c8] border-gray-300 rounded focus:ring-[#0067c8] focus:ring-2"
              />
              <label htmlFor="is_rotarian" className="text-sm font-medium text-gray-700">
                This speaker is a Rotarian
              </label>
            </div>

            {formData.is_rotarian && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotary Club Name
                </label>
                <input
                  type="text"
                  value={formData.rotary_club}
                  onChange={(e) => setFormData({ ...formData, rotary_club: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  placeholder="e.g., Georgetown Rotary Club"
                />
              </div>
            )}
            </div>
          )}

          {/* SECTION 7: INTERNAL OPERATIONS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              placeholder="Internal coordination notes, follow-up reminders, special requirements..."
            />
          </div>

          <div className="flex justify-between items-center pt-4 gap-4">
            {/* Delete Button - Only in Edit Mode */}
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 size={16} />
                Delete Speaker
              </button>
            )}

            {/* Spacer for Add mode */}
            {!isEditing && <div></div>}

            {/* Save/Cancel Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const modalName = isEditing ? 'speaker-edit-modal' : 'speaker-add-modal'
                  trackModal.close(modalName)
                  onClose()
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? (isEditing ? 'Updating...' : 'Adding...')
                  : (isEditing ? 'Update Speaker' : 'Add Speaker')
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remove Speaker"
        message={`Remove ${speaker?.name} from speakers? This action cannot be undone.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
