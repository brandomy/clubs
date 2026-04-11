import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { X, Edit, User, Mail, Phone, Calendar, ExternalLink, Settings, FileText, Award } from 'lucide-react'
import type { Speaker, Member } from '../types/database'
import { format } from 'date-fns'
import SpeakerModal from './SpeakerModal'
import LinkedInIcon from './LinkedInIcon'
import ShareButton from './ShareButton'
import { supabase } from '../lib/supabase'
import { trackModal } from '../utils/analytics'

interface SpeakerDetailModalProps {
  speaker: Speaker
  onClose: () => void
  onEdit?: () => void  // Optional: called when Edit button clicked (for URL routing)
}

export default function SpeakerDetailModal({ speaker, onClose, onEdit }: SpeakerDetailModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [proposer, setProposer] = useState<Member | null>(null)

  // Track modal open on mount
  useEffect(() => {
    trackModal.open('speaker-detail-modal', 'kanban-board')
  }, [])

  useEffect(() => {
    if (speaker.proposer_id) {
      loadProposer()
    }
  }, [speaker.proposer_id])

  const loadProposer = async () => {
    if (!speaker.proposer_id) return

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', speaker.proposer_id)
        .single()

      if (error) {
        logger.error('Error loading proposer:', error)
      } else {
        setProposer(data)
      }
    } catch (error) {
      logger.error('Error loading proposer:', error)
    }
  }

  const handleEdit = () => {
    // If onEdit prop provided (URL routing), use it
    // Otherwise fall back to local modal state (backwards compatibility)
    if (onEdit) {
      onEdit()
    } else {
      setIsEditModalOpen(true)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'spoken': { bg: 'bg-gray-100', text: 'text-gray-700' },
      'scheduled': { bg: 'bg-amber-100', text: 'text-amber-700' },
      'agreed': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      'approached': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'ideas': { bg: 'bg-slate-100', text: 'text-slate-700' },
      'dropped': { bg: 'bg-rose-100', text: 'text-rose-700' },
    } as const

    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800' }
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isEditModalOpen) {
    return <SpeakerModal speaker={speaker} onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto touch-manipulation">
        {/* Header */}
        <div className="bg-[#0067c8] text-white px-6 py-4 rounded-t-lg flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {speaker.portrait_url ? (
              <img
                src={speaker.portrait_url}
                alt={`${speaker.name} portrait`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-12 h-12 rounded-full bg-white bg-opacity-20 text-white flex items-center justify-center text-lg font-bold"
              style={{ display: speaker.portrait_url ? 'none' : 'flex' }}
            >
              {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{speaker.name}</h2>
              {speaker.job_title && (
                <p className="text-blue-200 text-sm font-medium">{speaker.job_title}</p>
              )}
              {speaker.organization && (
                <p className="text-blue-100 text-sm">{speaker.organization}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              speaker={speaker}
              variant="default"
              className="!bg-white/10 hover:!bg-white/20 !border-0 !text-white !min-h-0"
            />
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Edit speaker"
            >
              <Edit size={18} />
              <span className="text-sm font-medium hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={() => {
                trackModal.close('speaker-detail-modal')
                onClose()
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* SECTION 1: HEADER & IDENTITY (Status Badges) */}
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(speaker.status)}
            {speaker.is_rotarian && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f7a81b]/10 text-[#f7a81b] rounded-full text-sm font-medium">
                <Settings size={14} />
                <span>Rotarian</span>
                {speaker.rotary_club && <span className="text-xs">• {speaker.rotary_club}</span>}
              </span>
            )}
            {speaker.recommend && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f7a81b]/10 text-[#f7a81b] rounded-full text-sm font-medium">
                <Award size={14} />
                <span>Recommended Speaker</span>
              </span>
            )}
          </div>

          {/* SECTION 2: SPEAKING ENGAGEMENT DETAILS */}
          {/* Topic */}
          {speaker.topic && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1.5" />
                Topic
              </label>
              <p className="text-lg font-medium text-[#0067c8]">{speaker.topic}</p>
            </div>
          )}

          {/* Scheduled Date - MOVED UP from position 10 */}
          {speaker.scheduled_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1.5" />
                Scheduled Date
              </label>
              <p className="text-gray-900 font-medium">
                {format(new Date(speaker.scheduled_date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Description */}
          {speaker.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{speaker.description}</p>
            </div>
          )}

          {/* SECTION 3: CONTACT & PROFESSIONAL */}
          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            {speaker.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1.5" />
                  Email
                </label>
                <a href={`mailto:${speaker.email}`} className="text-[#0067c8] hover:underline">
                  {speaker.email}
                </a>
              </div>
            )}
            {speaker.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1.5" />
                  Phone
                </label>
                <a href={`tel:${speaker.phone}`} className="text-[#0067c8] hover:underline">
                  {speaker.phone}
                </a>
              </div>
            )}
          </div>

          {/* Proposer - MOVED DOWN from position 5 to after contact */}
          {proposer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1.5" />
                Proposed By
              </label>
              <p className="text-gray-900">
                {proposer.prefix ? `${proposer.prefix} ` : ''}{proposer.name}
                {proposer.roles && proposer.roles.length > 0 && !proposer.roles.includes('Member') && (
                  <span className="text-gray-600"> ({proposer.roles[0]})</span>
                )}
              </p>
            </div>
          )}

          {/* SECTION 4: PROFESSIONAL LINKS (Grouped) */}
          {/* LinkedIn */}
          {speaker.linkedin_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <a
                href={speaker.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#005885] transition-colors"
              >
                <LinkedInIcon size={16} />
                <span className="text-sm font-medium">View Profile</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Primary URL */}
          {speaker.primary_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <a
                href={speaker.primary_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#0067c8] hover:underline"
              >
                {speaker.primary_url}
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Additional URLs */}
          {speaker.additional_urls && speaker.additional_urls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Links</label>
              <div className="space-y-2">
                {speaker.additional_urls.map((url, index) => (
                  <div key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#0067c8] hover:underline"
                    >
                      {url}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: RECOMMENDATIONS & NOTES */}

          {/* Recommendation Info */}
          {speaker.recommend && speaker.recommendation_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation Notes</label>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-amber-50 p-4 rounded-lg border border-amber-200">
                {speaker.recommendation_notes}
              </p>
              {speaker.recommendation_date && (
                <p className="text-sm text-gray-500 mt-2">
                  Recommended on {format(new Date(speaker.recommendation_date), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}

          {/* Internal Notes */}
          {speaker.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                {speaker.notes}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Created:</span> {format(new Date(speaker.created_at), 'MMM d, yyyy')}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Updated:</span> {format(new Date(speaker.updated_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
