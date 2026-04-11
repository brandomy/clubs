import { logger } from '../utils/logger'
/**
 * PhotoGallery Component
 * Displays club photos in responsive grid with filtering and lightbox view
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types/database'
import { Image as ImageIcon, Calendar, Tag, Search, X } from 'lucide-react'
import AppLayout from './AppLayout'
import { renderSimpleMarkdown } from '../utils/simpleMarkdown'
import PhotoUploadModal from './PhotoUploadModal'

type YearOption = {
  id: string
  rotary_year: string
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [rotaryYears, setRotaryYears] = useState<YearOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchPhotos()
    fetchRotaryYears()
    checkEditPermissions()

    // Subscribe to real-time photo updates
    const subscription = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gt_photos' },
        () => {
          logger.log('Photo updated, refetching...')
          fetchPhotos()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gt_photos')
        .select('*')
        .eq('approval_status', 'approved')
        .order('photo_date', { ascending: false })

      if (error) {
        logger.error('Error fetching photos:', error)
        return
      }

      setPhotos(data || [])
    } catch (error) {
      logger.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRotaryYears = async () => {
    try {
      const { data, error } = await supabase
        .from('gt_rotary_years')
        .select('id, rotary_year')
        .order('rotary_year', { ascending: false })

      if (error) {
        logger.error('Error fetching rotary years:', error)
        return
      }

      setRotaryYears(data || [])
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

  // Filter photos based on search and filters
  const filteredPhotos = photos.filter(photo => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    // Year filter
    const matchesYear = selectedYear === 'all' || photo.rotary_year_id === selectedYear

    // Category filter
    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory

    return matchesSearch && matchesYear && matchesCategory
  })

  const handleAddPhoto = () => {
    setShowUploadModal(true)
  }

  const handlePhotoUploaded = (newPhoto: Photo) => {
    setPhotos([newPhoto, ...photos])
    fetchPhotos() // Refresh to ensure we have latest data
  }

  if (loading) {
    return (
      <AppLayout
        sectionName="PHOTOS"
        showAddButton={false}
        showFilters={false}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ImageIcon className="animate-pulse h-12 w-12 text-[#0067c8] mx-auto mb-4" />
            <p className="text-gray-600">Loading photos...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sectionName="PHOTOS"
      onAddClick={handleAddPhoto}
      addButtonLabel="Photo"
      showAddButton={true}
      showFilters={false}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search photos by title, caption, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                />
              </div>
            </div>

            {/* Year filter */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              >
                <option value="all">All Years</option>
                {rotaryYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.rotary_year}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="event">Events</option>
                <option value="fellowship">Fellowship</option>
                <option value="service">Service</option>
                <option value="community">Community</option>
                <option value="members">Members</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredPhotos.length} of {photos.length} photos
          </div>
        </div>

        {/* Photo grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.title || photo.caption || 'Club photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Overlay with caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    {photo.title && (
                      <h3 className="font-semibold text-sm line-clamp-1">{photo.title}</h3>
                    )}
                    {photo.caption && (
                      <p className="text-xs mt-1 line-clamp-2">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedYear !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : canEdit
                ? 'Upload your first photo to get started'
                : 'Check back soon for club photos'}
            </p>
          </div>
        )}

        {/* Lightbox modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={32} />
            </button>

            <div className="max-w-5xl w-full">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || selectedPhoto.caption || 'Club photo'}
                className="w-full h-auto max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {(selectedPhoto.title || selectedPhoto.caption) && (
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

        {/* Upload Modal */}
        {showUploadModal && (
          <PhotoUploadModal
            rotaryYears={rotaryYears}
            onClose={() => setShowUploadModal(false)}
            onPhotoUploaded={handlePhotoUploaded}
          />
        )}
      </div>
    </AppLayout>
  )
}
