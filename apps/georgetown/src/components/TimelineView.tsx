import { logger } from '../utils/logger'
/**
 * TimelineView Component
 * Main timeline interface for viewing Georgetown Rotary's institutional history by year
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { RotaryYear, ServiceProject, Speaker, Photo } from '../types/database'
import { Loader2, Target, Users, Building2, Calendar, Image as ImageIcon, X, Edit } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import AppLayout from './AppLayout'
import YearOverview from './YearOverview'
import ServiceProjectCard from './ServiceProjectCard'
import ServiceProjectDetailModal from './ServiceProjectDetailModal'
import SpeakerCardSimple from './SpeakerCardSimple'
import SpeakerDetailModal from './SpeakerDetailModal'
import NarrativeEditor from './NarrativeEditor'
import PhotoUploadModal from './PhotoUploadModal'
import { getCurrentRotaryYear } from '../lib/rotary-year-utils'
import { renderSimpleMarkdown } from '../utils/simpleMarkdown'
import './timeline.css'

export default function TimelineView() {
  const [rotaryYears, setRotaryYears] = useState<RotaryYear[]>([])
  const [selectedYearData, setSelectedYearData] = useState<RotaryYear | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentRotaryYear())
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [yearProjects, setYearProjects] = useState<ServiceProject[]>([])
  const [selectedProject, setSelectedProject] = useState<ServiceProject | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [yearSpeakers, setYearSpeakers] = useState<Speaker[]>([])
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null)
  const [showSpeakerModal, setShowSpeakerModal] = useState(false)
  const [yearPhotos, setYearPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false)
  const [showNarrativeEditor, setShowNarrativeEditor] = useState(false)
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)

  useEffect(() => {
    fetchRotaryYears()
    checkEditPermissions()

    // Subscribe to real-time updates for rotary_years table
    const subscription = supabase
      .channel('rotary-years-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gt_rotary_years' },
        (payload) => {
          logger.log('Rotary year updated:', payload)
          // Refetch all years to get updated statistics
          fetchRotaryYears()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (selectedYear && rotaryYears.length > 0) {
      loadYearData(selectedYear)
    }
  }, [selectedYear, rotaryYears])

  // Subscribe to real-time speaker updates
  useEffect(() => {
    const subscription = supabase
      .channel('speakers-timeline-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gt_speakers' },
        (payload) => {
          logger.log('Speaker updated in timeline:', payload)
          // Reload year data when speakers change
          if (selectedYearData) {
            loadYearSpeakers(selectedYearData.start_date, selectedYearData.end_date)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [selectedYearData])

  const fetchRotaryYears = async () => {
    try {
      setLoading(true)
      logger.log('=== FETCHING ROTARY YEARS FROM DATABASE ===')
      const { data, error } = await supabase
        .from('gt_rotary_years')
        .select('*')
        .order('rotary_year', { ascending: false })

      if (error) {
        logger.error('Error fetching rotary years:', error)
        return
      }

      logger.log('Fetched rotary years:', data?.map(y => ({
        year: y.rotary_year,
        speakers: y.stats?.speakers,
        meetings: y.stats?.meetings
      })))
      setRotaryYears(data || [])

      // If current year doesn't exist in database, select the most recent
      if (data && data.length > 0) {
        const currentYearExists = data.some(y => y.rotary_year === selectedYear)
        if (!currentYearExists) {
          setSelectedYear(data[0].rotary_year)
        }
      }
    } catch (error) {
      logger.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadYearData = async (year: string) => {
    const yearData = rotaryYears.find(y => y.rotary_year === year)
    if (yearData) {
      setSelectedYearData(yearData)
      await loadYearProjects(yearData.id)
      await loadYearSpeakers(yearData.start_date, yearData.end_date)
      await loadYearPhotos(yearData.id)
    } else {
      // Fetch from database if not in local state
      const { data, error } = await supabase
        .from('gt_rotary_years')
        .select('*')
        .eq('rotary_year', year)
        .single()

      if (error) {
        logger.error('Error loading year data:', error)
      } else {
        setSelectedYearData(data)
        await loadYearProjects(data.id)
        await loadYearSpeakers(data.start_date, data.end_date)
        await loadYearPhotos(data.id)
      }
    }
  }

  const loadYearProjects = async (rotaryYearId: string) => {
    try {
      const { data, error } = await supabase
        .from('gt_service_projects')
        .select('*')
        .eq('rotary_year_id', rotaryYearId)
        .eq('status', 'Completed')
        .order('completion_date', { ascending: false })

      if (error) {
        logger.error('Error loading year projects:', error)
        return
      }

      setYearProjects(data || [])
    } catch (error) {
      logger.error('Error:', error)
    }
  }

  const loadYearSpeakers = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('gt_speakers')
        .select('*')
        .eq('status', 'spoken')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: false })

      if (error) {
        logger.error('Error loading year speakers:', error)
        return
      }

      setYearSpeakers(data || [])
    } catch (error) {
      logger.error('Error:', error)
    }
  }

  const loadYearPhotos = async (rotaryYearId: string) => {
    try {
      const { data, error } = await supabase
        .from('gt_photos')
        .select('*')
        .eq('rotary_year_id', rotaryYearId)
        .eq('approval_status', 'approved')
        .order('photo_date', { ascending: false })

      if (error) {
        logger.error('Error loading year photos:', error)
        return
      }

      setYearPhotos(data || [])
    } catch (error) {
      logger.error('Error:', error)
    }
  }

  const checkEditPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setCanEdit(false)
        return
      }

      // Check if user is an officer or committee chair
      const { data: member, error } = await supabase
        .from('gt_members')
        .select('roles')
        .eq('email', user.email)
        .single()

      if (error || !member) {
        setCanEdit(false)
        return
      }

      const officerChairRoles = [
        'President', 'President-Elect', 'Immediate Past President', 'Vice President',
        'Secretary', 'Treasurer', 'Sergeant-at-Arms',
        'Club Service Chair', 'Foundation Chair', 'International Service Chair',
        'Membership Chair', 'Public Image Chair', 'Service Projects Chair', 'Youth Service Chair'
      ]

      const hasPermission = member.roles?.some((role: string) =>
        officerChairRoles.includes(role)
      )

      setCanEdit(hasPermission || false)
    } catch (error) {
      logger.error('Error checking permissions:', error)
      setCanEdit(false)
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  const handleEdit = () => {
    setShowNarrativeEditor(true)
  }

  const handlePhotoUploaded = (newPhoto: Photo) => {
    setYearPhotos([newPhoto, ...yearPhotos])
    if (selectedYearData) {
      loadYearPhotos(selectedYearData.id) // Refresh to ensure we have latest data
    }
  }

  if (loading) {
    return (
      <AppLayout
        sectionName="TIMELINE"
        showAddButton={false}
        showFilters={false}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-[#0067c8] mx-auto mb-4" />
            <p className="text-gray-600">Loading timeline...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (rotaryYears.length === 0) {
    return (
      <AppLayout
        sectionName="TIMELINE"
        showAddButton={false}
        showFilters={false}
      >
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Rotary Years Found</h2>
            <p className="text-gray-600 mb-4">
              The timeline system is set up, but no Rotary year records exist yet.
            </p>
            {canEdit && (
              <p className="text-sm text-gray-500">
                Contact your system administrator to create Rotary year records.
              </p>
            )}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sectionName="TIMELINE"
      showAddButton={false}
      headerInfo={
        selectedYearData && (
          <div className="hidden md:flex flex-col gap-0.5 text-xs text-white/90 text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Building2 size={14} className="text-white/70" />
              <span>
                Club #{selectedYearData.club_number}
                {selectedYearData.district_number && ` • District ${selectedYearData.district_number}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar size={14} className="text-white/70" />
              <span>Chartered {format(parseISO(selectedYearData.charter_date), 'MMMM d, yyyy')}</span>
            </div>
          </div>
        )
      }
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Simple Year Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Rotary Year:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-[#0067c8] bg-white text-gray-900"
            >
              {rotaryYears.map((year) => (
                <option key={year.rotary_year} value={year.rotary_year}>
                  {year.rotary_year}
                  {year.rotary_year === getCurrentRotaryYear() ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year Overview */}
        {selectedYearData ? (
          <>
            <YearOverview
              rotaryYear={selectedYearData}
              onEdit={handleEdit}
              canEdit={canEdit}
              actualSpeakerCount={yearSpeakers.length}
              actualProjectCount={yearProjects.length}
              previousYearMemberCount={(() => {
                // Find the previous Rotary year
                const currentYearIndex = rotaryYears.findIndex(y => y.rotary_year === selectedYearData.rotary_year)
                if (currentYearIndex !== -1 && currentYearIndex < rotaryYears.length - 1) {
                  // Previous year is next in the array (sorted descending)
                  return rotaryYears[currentYearIndex + 1]?.member_count_year_end
                }
                return undefined
              })()}
            />

            {/* Service Projects Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-[#0067c8]" />
                <h2 className="text-xl font-bold text-gray-900">Completed Service Projects</h2>
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  {yearProjects.length}
                </span>
              </div>

              {yearProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearProjects.map((project) => (
                    <ServiceProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => {
                        setSelectedProject(project)
                        setShowProjectModal(true)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Target size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No completed projects linked to this Rotary year yet
                  </p>
                </div>
              )}
            </div>

            {/* Featured Speakers Section */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-[#0067c8]" />
                <h2 className="text-xl font-bold text-gray-900">Featured Speakers</h2>
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  {yearSpeakers.length}
                </span>
              </div>

              {yearSpeakers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearSpeakers.map((speaker) => (
                    <SpeakerCardSimple
                      key={speaker.id}
                      speaker={speaker}
                      onClick={() => {
                        setSelectedSpeaker(speaker)
                        setShowSpeakerModal(true)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Users size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No speakers have presented during this Rotary year yet
                  </p>
                </div>
              )}
            </div>

            {/* Photo Gallery Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-[#0067c8]" />
                  <h2 className="text-xl font-bold text-gray-900">Photo Gallery</h2>
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    {yearPhotos.length}
                  </span>
                </div>
                {selectedYearData && (
                  <button
                    onClick={() => setShowPhotoUploadModal(true)}
                    className="p-1.5 text-gray-400 hover:text-[#0067c8] hover:bg-gray-100 rounded transition-colors"
                    title="Add photo to this year"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>

              {yearPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {yearPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedPhoto(photo)
                        setShowPhotoLightbox(true)
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title || photo.caption || 'Rotary year photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Overlay with caption */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          {photo.title && (
                            <h3 className="font-semibold text-xs line-clamp-1">{photo.title}</h3>
                          )}
                          {photo.caption && (
                            <p className="text-xs mt-1 line-clamp-2 opacity-90">{photo.caption}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <ImageIcon size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No photos from this Rotary year yet
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-[#0067c8] mx-auto mb-4" />
            <p className="text-gray-600">Loading year data...</p>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <ServiceProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowProjectModal(false)
            setSelectedProject(null)
          }}
        />
      )}

      {/* Speaker Detail Modal */}
      {showSpeakerModal && selectedSpeaker && (
        <SpeakerDetailModal
          speaker={selectedSpeaker}
          onClose={() => {
            setShowSpeakerModal(false)
            setSelectedSpeaker(null)
          }}
        />
      )}

      {showNarrativeEditor && selectedYearData && (
        <NarrativeEditor
          rotaryYear={selectedYearData}
          onClose={() => setShowNarrativeEditor(false)}
        />
      )}

      {/* Photo Lightbox Modal */}
      {showPhotoLightbox && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowPhotoLightbox(false)
            setSelectedPhoto(null)
          }}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => {
              setShowPhotoLightbox(false)
              setSelectedPhoto(null)
            }}
          >
            <X size={32} />
          </button>

          <div className="max-w-5xl w-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title || selectedPhoto.caption || 'Rotary year photo'}
              className="w-full h-auto max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {(selectedPhoto.title || selectedPhoto.caption || selectedPhoto.photo_date) && (
              <div className="mt-4 text-white text-center" onClick={(e) => e.stopPropagation()}>
                {selectedPhoto.title && (
                  <h2 className="text-xl font-semibold mb-2">{selectedPhoto.title}</h2>
                )}
                {selectedPhoto.caption && (
                  <div className="text-gray-300">{renderSimpleMarkdown(selectedPhoto.caption)}</div>
                )}
                {selectedPhoto.photo_date && (
                  <p className="text-gray-400 text-sm mt-2">
                    {new Date(selectedPhoto.photo_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUploadModal && selectedYearData && (
        <PhotoUploadModal
          rotaryYears={[{ id: selectedYearData.id, rotary_year: selectedYearData.rotary_year }]}
          onClose={() => setShowPhotoUploadModal(false)}
          onPhotoUploaded={handlePhotoUploaded}
          preselectedYearId={selectedYearData.id}
        />
      )}
    </AppLayout>
  )
}
