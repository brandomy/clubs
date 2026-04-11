import { logger } from '../utils/logger'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Speaker, Member } from '../types/database'
import { Calendar, Mail, Phone, Building, FileText, Pencil, BadgeCheck, ExternalLink, User, Link } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SpeakerModal from './SpeakerModal'
import LinkedInIcon from './LinkedInIcon'
import SocialMediaIcons from './SocialMediaIcons'
import ShareButton from './ShareButton'
import { AVAILABLE_FIELDS } from '../lib/database-config'
import { supabase } from '../lib/supabase'

interface SpeakerCardProps {
  speaker: Speaker
  isDragging?: boolean
}

export default function SpeakerCard({ speaker, isDragging = false }: SpeakerCardProps) {
  const navigate = useNavigate()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [proposer, setProposer] = useState<Member | null>(null)

  useEffect(() => {
    if (speaker.proposer_id) {
      loadProposer()
    }
  }, [speaker.proposer_id])

  const loadProposer = async () => {
    if (!speaker.proposer_id) return

    try {
      const { data, error } = await supabase
        .from('gt_members')
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: speaker.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }


  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditModalOpen(true)
  }

  const handleCardClick = () => {
    // Navigate to detail view (URL routing)
    navigate(`/speakers/${speaker.id}`)
  }

  const handleCloseModals = () => {
    setIsEditModalOpen(false)
  }


  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={`group relative bg-white rounded-lg shadow-sm border border-gray-200/60 p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${
          isDragging ? 'shadow-xl ring-2 ring-[#0067c8] ring-opacity-30 rotate-1' : 'hover:border-gray-300 hover:-translate-y-0.5'
        }`}
      >
        {/* Header with Name and Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {/* Portrait Photo or Initials Fallback */}
            {speaker.portrait_url ? (
              <img
                src={speaker.portrait_url}
                alt={`${speaker.name} portrait`}
                className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0067c8] to-[#004080] text-white flex items-center justify-center text-xs font-semibold shadow-sm flex-shrink-0"
              style={{ display: speaker.portrait_url ? 'none' : 'flex' }}
            >
              {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm truncate" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {speaker.name}
                </h4>
                {AVAILABLE_FIELDS.is_rotarian && speaker.is_rotarian && (
                  <div className="flex-shrink-0" title={`Rotarian${speaker.rotary_club ? ` - ${speaker.rotary_club}` : ''}`}>
                    <BadgeCheck size={14} className="text-[#0067c8]" />
                  </div>
                )}
                {speaker.recommend && (
                  <div className="flex-shrink-0" title="Recommended speaker">
                    <span className="text-[#f7a81b] text-sm">🗣️</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="min-h-[44px] min-w-[44px] p-3 hover:bg-blue-50 rounded-md transition-colors touch-manipulation inline-flex items-center justify-center"
              title="Edit speaker"
              aria-label="Edit speaker"
            >
              <Pencil size={16} className="text-gray-400 hover:text-[#0067c8] transition-colors" />
            </button>
          </div>
        </div>

        {/* Topic - Primary Focus */}
        {speaker.topic && (
          <div className="mb-2">
            <div className="text-sm font-medium text-[#0067c8] line-clamp-1">{speaker.topic}</div>
          </div>
        )}

        {/* Proposer Information */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <span>
              {proposer ? (
                <>
                  Proposed by: <span className="font-medium text-gray-700">
                    {proposer.prefix ? `${proposer.prefix} ` : ''}{proposer.name}
                    {proposer.roles && proposer.roles.length > 0 && !proposer.roles.includes('Member') ? ` (${proposer.roles[0]})` : ''}
                  </span>
                </>
              ) : (
                speaker.proposer_id ? 'Loading proposer...' : 'Proposed by: Unknown'
              )}
            </span>
          </div>
        </div>

        {/* Description */}
        {AVAILABLE_FIELDS.description && speaker.description && (
          <div className="mb-2">
            <div className="text-sm text-gray-600 line-clamp-2">{speaker.description}</div>
          </div>
        )}

        {/* Organization */}
        {speaker.organization && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
            <Building size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{speaker.organization}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1">
          {speaker.email && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Mail size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{speaker.email}</span>
            </div>
          )}

          {speaker.phone && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <span>{speaker.phone}</span>
            </div>
          )}
        </div>

        {/* URLs - Website Links (plain text like Partners) */}
        <div className="space-y-1">
          {/* Primary Website */}
          {AVAILABLE_FIELDS.primary_url && speaker.primary_url && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Link size={14} className="text-gray-400 flex-shrink-0" />
              <a
                href={speaker.primary_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0067c8] hover:text-[#004080] inline-flex items-center gap-1 transition-colors min-h-[44px] py-2"
                onClick={(e) => e.stopPropagation()}
                title={speaker.primary_url}
              >
                <span className="truncate max-w-[180px]">
                  {speaker.primary_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </span>
                <ExternalLink size={12} className="flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Additional URLs */}
          {speaker.additional_urls && speaker.additional_urls.map((url, index) => (
            url.trim() && (
              <div key={index} className="flex items-center gap-1.5 text-sm text-gray-600">
                <Link size={14} className="text-gray-400 flex-shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0067c8] hover:text-[#004080] inline-flex items-center gap-1 transition-colors min-h-[44px] py-2"
                  onClick={(e) => e.stopPropagation()}
                  title={url}
                >
                  <span className="truncate max-w-[180px]">
                    {url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </span>
                  <ExternalLink size={12} className="flex-shrink-0" />
                </a>
              </div>
            )
          ))}
        </div>

        {/* Social Media Links (above divider) */}
        {speaker.social_media_links && Object.keys(speaker.social_media_links).length > 0 && (
          <div className="mt-2">
            <SocialMediaIcons socialMediaLinks={speaker.social_media_links} size={16} />
          </div>
        )}

        {/* Personal LinkedIn Badge - Blue Button (below divider) */}
        {AVAILABLE_FIELDS.linkedin_url && speaker.linkedin_url && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <a
              href={speaker.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white bg-[#0077B5] hover:bg-[#005885] px-3 py-2 rounded transition-colors touch-manipulation shadow-sm min-h-[44px]"
              title="View Personal LinkedIn Profile"
              aria-label={`View ${speaker.name}'s LinkedIn profile`}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkedInIcon size={14} />
              <span className="text-sm font-medium">LinkedIn</span>
            </a>
          </div>
        )}

        {/* Scheduled Date - Highlighted */}
        {speaker.scheduled_date && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#f7a81b]">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{format(new Date(speaker.scheduled_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}

        {/* Notes - Collapsible */}
        {speaker.notes && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-1.5 text-sm text-gray-500">
              <FileText size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-2">{speaker.notes}</span>
            </div>
          </div>
        )}

        {/* Share Button - Bottom Right (subtle, no extra spacing) */}
        <div className="absolute bottom-2 right-2">
          <ShareButton
            speaker={speaker}
            variant="icon-only"
            className="min-h-[36px] min-w-[36px] p-2 hover:bg-blue-50 rounded-md transition-colors !border-0 !shadow-none !bg-transparent opacity-60 hover:opacity-100"
          />
        </div>
      </div>

      {/* Edit modal - still using local state for now */}
      {isEditModalOpen && (
        <SpeakerModal
          speaker={speaker}
          onClose={handleCloseModals}
        />
      )}
    </>
  )
}