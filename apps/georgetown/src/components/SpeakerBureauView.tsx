import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Speaker, Member } from '../types/database'
import { Calendar, Mail, Phone, Building, FileText, ExternalLink, User, Download, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import LinkedInIcon from './LinkedInIcon'
import { AVAILABLE_FIELDS } from '../lib/database-config'
import AppLayout from './AppLayout'

export default function SpeakerBureauView() {
  const navigate = useNavigate()
  const [recommendedSpeakers, setRecommendedSpeakers] = useState<Speaker[]>([])
  const [members, setMembers] = useState<Record<string, Member>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchRecommendedSpeakers(), fetchMembers()])
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('active', true)

      if (error) {
        logger.error('Error fetching members:', error)
        return
      }

      const membersMap = (data || []).reduce((acc, member) => {
        acc[member.id] = member
        return acc
      }, {} as Record<string, Member>)

      setMembers(membersMap)
    } catch (error) {
      logger.error('Error:', error)
    }
  }

  const fetchRecommendedSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .eq('recommend', true)
        .eq('status', 'spoken')
        .order('recommendation_date', { ascending: false })

      if (error) {
        logger.error('Error fetching recommended speakers:', error)
        return
      }

      setRecommendedSpeakers(data || [])
    } catch (error) {
      logger.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const csvHeaders = [
      'Name',
      'Job Title',
      'Organization',
      'Email',
      'Phone',
      'Topic',
      'Description',
      'Website',
      'LinkedIn',
      'Is Rotarian',
      'Rotary Club',
      'Proposed by',
      'Proposer Role',
      'Presentation Date',
      'Recommendation Date',
      'Recommendation Notes',
      'Notes'
    ]

    const csvRows = recommendedSpeakers.map(speaker => {
      const proposer = speaker.proposer_id ? members[speaker.proposer_id] : null
      return [
        speaker.name,
        speaker.job_title || '',
        speaker.organization || '',
        speaker.email || '',
        speaker.phone || '',
        speaker.topic,
        speaker.description || '',
        speaker.primary_url || '',
        speaker.linkedin_url || '',
        speaker.is_rotarian ? 'Yes' : 'No',
        speaker.rotary_club || '',
        proposer ? `${proposer.prefix ? `${proposer.prefix} ` : ''}${proposer.name}` : 'Unknown',
        proposer?.roles && proposer.roles.length > 0 ? proposer.roles.join(', ') : '',
        speaker.scheduled_date ? format(new Date(speaker.scheduled_date), 'yyyy-MM-dd') : '',
        speaker.recommendation_date ? format(new Date(speaker.recommendation_date), 'yyyy-MM-dd') : '',
        speaker.recommendation_notes || '',
        speaker.notes || ''
      ]
    })

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `georgetown-rotary-speaker-bureau-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <AppLayout
        sectionName="Speakers Bureau"
        showAddButton={false}
        showBottomNav={true}
        showSecondaryNav={true}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 text-lg">Loading Speakers Bureau...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sectionName="Speakers Bureau"
      showAddButton={false}
      showBottomNav={true}
      showSecondaryNav={true}
    >
      {/* Action Buttons Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-gray-700 text-sm font-medium">
            <span className="text-[#0067c8] font-bold">{recommendedSpeakers.length}</span> recommended speaker{recommendedSpeakers.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#0067c8] hover:bg-[#004a8a] text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => navigate('/speakers')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
            >
              <ArrowLeft size={16} />
              Back to Speakers
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {recommendedSpeakers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <div className="text-6xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recommended Speakers Yet</h3>
              <p className="text-gray-600">
                Speakers will appear here after they complete their presentations and are marked as recommended.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedSpeakers.map((speaker) => (
              <div
                key={speaker.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200"
              >
                {/* Header with Name and Recommendation Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Portrait Photo or Initials Fallback */}
                    {speaker.portrait_url ? (
                      <img
                        src={speaker.portrait_url}
                        alt={`${speaker.name} portrait`}
                        className="w-12 h-12 rounded-full object-cover shadow-sm flex-shrink-0"
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
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0067c8] to-[#004080] text-white flex items-center justify-center text-sm font-semibold shadow-sm flex-shrink-0"
                      style={{ display: speaker.portrait_url ? 'none' : 'flex' }}
                    >
                      {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                          {speaker.name}
                        </h3>
                        <span className="text-[#f7a81b] text-lg" title="Recommended speaker">🗣️</span>
                      </div>
                      {AVAILABLE_FIELDS.job_title && speaker.job_title && (
                        <p className="text-sm text-gray-600 mt-1">
                          {speaker.job_title}{speaker.organization ? ` at ${speaker.organization}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic - Primary Focus */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-[#0067c8] mb-2">
                    {speaker.topic}
                  </h4>
                  {AVAILABLE_FIELDS.description && speaker.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {speaker.description}
                    </p>
                  )}
                </div>

                {/* Organization */}
                {speaker.organization && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Building size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{speaker.organization}</span>
                  </div>
                )}

                {/* Proposer Information */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <span>
                    {(() => {
                      const proposer = speaker.proposer_id ? members[speaker.proposer_id] : null
                      return proposer ? (
                        <>
                          Proposed by: <span className="font-medium text-gray-700">
                            {proposer.prefix ? `${proposer.prefix} ` : ''}
                            {proposer.name}
                            {proposer.roles && proposer.roles.length > 0 && !proposer.roles.includes('Member')
                              ? ` (${proposer.roles[0]})` : ''}
                          </span>
                        </>
                      ) : (
                        'Proposed by: Unknown'
                      )
                    })()}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {speaker.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} className="text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${speaker.email}`} className="hover:text-[#0067c8] transition-colors">
                        {speaker.email}
                      </a>
                    </div>
                  )}
                  {speaker.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <a href={`tel:${speaker.phone}`} className="hover:text-[#0067c8] transition-colors">
                        {speaker.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Professional Links */}
                {AVAILABLE_FIELDS.primary_url && (speaker.linkedin_url || speaker.primary_url) && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_FIELDS.linkedin_url && speaker.linkedin_url && (
                        <a
                          href={speaker.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-white bg-[#0077B5] hover:bg-[#005885] px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
                        >
                          <LinkedInIcon size={12} />
                          LinkedIn
                        </a>
                      )}
                      {speaker.primary_url && (
                        <a
                          href={speaker.primary_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[#0067c8] hover:text-[#004a8a] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          <ExternalLink size={10} />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Presentation Details */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {speaker.scheduled_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={12} className="text-gray-400" />
                      <span>Presented: {format(new Date(speaker.scheduled_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {speaker.recommendation_date && (
                    <div className="flex items-center gap-2 text-xs text-[#f7a81b] font-medium">
                      <span>🗣️</span>
                      <span>Recommended: {format(new Date(speaker.recommendation_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {speaker.recommendation_notes && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 mt-2">
                      <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="italic">{speaker.recommendation_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}