import { memo } from 'react'
import { BadgeCheck, Pencil, Link, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import type { Speaker } from '../types/database'
import LinkedInIcon from './LinkedInIcon'
import SocialMediaIcons from './SocialMediaIcons'
import ShareButton from './ShareButton'
import { trackInteraction } from '../utils/analytics'

interface SpeakerCardExpandedProps {
  speaker: Speaker
  onView: (speaker: Speaker) => void
  onEdit: (speaker: Speaker) => void
}

const SpeakerCardExpanded = memo(function SpeakerCardExpanded({ speaker, onView, onEdit }: SpeakerCardExpandedProps) {
  return (
    <div
      onClick={() => {
        trackInteraction('speaker-card-clicked', 'kanban-cards-view', speaker.id)
        onView(speaker)
      }}
      className="relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg cursor-pointer transition-shadow group"
    >
      {/* Header with Portrait and Status Badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          {/* Portrait Photo or Initials Fallback */}
          {speaker.portrait_url ? (
            <img
              src={speaker.portrait_url}
              alt={`${speaker.name} portrait`}
              className="w-20 h-20 rounded-full object-cover shadow-md flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0067c8] to-[#004080] text-white flex items-center justify-center text-lg font-semibold shadow-md flex-shrink-0"
            style={{ display: speaker.portrait_url ? 'none' : 'flex' }}
          >
            {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {/* Status Badge and Edit Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(speaker)
              }}
              className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-[#0067c8] hover:bg-gray-100 rounded transition-colors inline-flex items-center justify-center"
              aria-label={`Edit ${speaker.name}`}
              title="Edit speaker"
            >
              <Pencil size={16} />
            </button>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              speaker.status === 'spoken' ? 'bg-gray-100 text-gray-700' :
              speaker.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
              speaker.status === 'agreed' ? 'bg-emerald-100 text-emerald-700' :
              speaker.status === 'approached' ? 'bg-blue-100 text-blue-700' :
              speaker.status === 'ideas' ? 'bg-slate-100 text-slate-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {speaker.status.charAt(0).toUpperCase() + speaker.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Name with Icon Badges */}
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#0067c8] transition-colors">
            {speaker.name}
          </h3>
          {speaker.is_rotarian && (
            <div className="flex-shrink-0" title={`Rotarian${speaker.rotary_club ? ` - ${speaker.rotary_club}` : ''}`}>
              <BadgeCheck size={14} className="text-[#0067c8]" />
            </div>
          )}
          {speaker.recommend && (
            <div className="flex-shrink-0" title="Recommended Speaker - Speakers Bureau">
              <span className="text-[#f7a81b] text-sm">🗣️</span>
            </div>
          )}
        </div>

        {speaker.job_title && (
          <p className="text-sm text-gray-600 line-clamp-1">{speaker.job_title}</p>
        )}
        {speaker.organization && (
          <p className="text-sm text-gray-500 line-clamp-1">{speaker.organization}</p>
        )}
      </div>

      {/* Topic */}
      {speaker.topic && (
        <div className="px-4 py-3 bg-gray-50">
          <p className="text-sm font-medium text-[#0067c8] line-clamp-2">{speaker.topic}</p>
        </div>
      )}

      {/* Contact Info */}
      <div className="px-4 py-3 space-y-1 text-sm text-gray-600">
        {speaker.email && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{speaker.email}</span>
          </div>
        )}
        {speaker.phone && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{speaker.phone}</span>
          </div>
        )}
        {speaker.primary_url && (
          <div className="flex items-center gap-2">
            <Link size={16} className="text-gray-400 flex-shrink-0" />
            <a
              href={speaker.primary_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[#0067c8] hover:text-[#004080] inline-flex items-center gap-1 transition-colors text-sm"
            >
              <span className="truncate">
                {speaker.primary_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </span>
              <ExternalLink size={12} className="flex-shrink-0" />
            </a>
          </div>
        )}

        {speaker.social_media_links && Object.keys(speaker.social_media_links).length > 0 && (
          <div className="pt-1">
            <SocialMediaIcons socialMediaLinks={speaker.social_media_links} size={16} />
          </div>
        )}

        {speaker.is_rotarian && speaker.rotary_club && (
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-[#0067c8] flex-shrink-0" />
            <span className="text-[#0067c8] font-medium truncate">{speaker.rotary_club}</span>
          </div>
        )}
        {speaker.scheduled_date && (
          <div className="flex items-center gap-2 font-medium text-[#f7a81b] pt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{format(new Date(speaker.scheduled_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {speaker.linkedin_url && (
          <div className="pt-2">
            <a
              href={speaker.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-white bg-[#0077B5] hover:bg-[#005885] px-2 py-1 rounded transition-colors text-xs"
              title="View LinkedIn Profile"
              aria-label={`View ${speaker.name}'s LinkedIn profile`}
            >
              <LinkedInIcon size={12} />
              LinkedIn
            </a>
          </div>
        )}
      </div>

      {/* Share Button */}
      <div className="absolute bottom-2 right-2">
        <ShareButton
          speaker={speaker}
          variant="icon-only"
          className="min-h-[36px] min-w-[36px] p-2 hover:bg-gray-50 rounded transition-colors !border-0 !shadow-none !bg-transparent opacity-60 hover:opacity-100"
        />
      </div>
    </div>
  )
})

export default SpeakerCardExpanded
