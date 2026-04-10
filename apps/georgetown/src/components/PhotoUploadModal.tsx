/**
 * PhotoUploadModal Component
 * Modal for uploading photos to the club photo gallery
 * Officers and chairs only
 */

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImage, isValidImageType, formatFileSize } from '../utils/imageCompression'
import type { Photo } from '../types/database'

type PhotoUploadModalProps = {
  rotaryYears: { id: string; rotary_year: string }[]
  onClose: () => void
  onPhotoUploaded: (photo: Photo) => void
  preselectedYearId?: string // Optional preselected year for Timeline view
}

export default function PhotoUploadModal({
  rotaryYears,
  onClose,
  onPhotoUploaded,
  preselectedYearId,
}: PhotoUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    photo_date: new Date().toISOString().split('T')[0], // Today's date
    photographer_name: '',
    location: '',
    rotary_year_id: preselectedYearId || '', // Use preselected year if provided
    category: 'general' as Photo['category'],
    tags: [] as string[],
    visibility: 'public' as Photo['visibility'],
  })

  const [tagInput, setTagInput] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!isValidImageType(file)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large (max 10MB)')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setError('Please select an image to upload')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for the photo')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // DEVELOPMENT MODE: Skip authentication check
      // TODO: Re-enable authentication when auth system is implemented
      // Get current user (optional during development)
      const { data: { user } } = await supabase.auth.getUser()

      // Get member ID (optional during development)
      let member = null
      if (user?.email) {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('email', user.email)
          .single()

        // Handle "no rows found" error gracefully - optional field during development
        if (memberError && memberError.code !== 'PGRST116') {
          console.error('Error fetching member:', memberError)
          throw memberError
        }

        member = memberData
      }

      // Compress image
      const compressedBlob = await compressImage(selectedFile)
      console.log(`Compressed: ${formatFileSize(selectedFile.size)} → ${formatFileSize(compressedBlob.size)}`)

      // Generate file name with timestamp and sanitized title
      const timestamp = Date.now()
      const sanitizedTitle = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const fileName = `${formData.category}/${new Date().getFullYear()}/${sanitizedTitle}-${timestamp}.jpg`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('club-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload image. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('club-photos')
        .getPublicUrl(uploadData.path)

      // Get image dimensions
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = previewUrl!
      })

      // Create photo database record
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          url: publicUrl,
          storage_path: fileName,
          title: formData.title.trim(),
          caption: formData.caption.trim() || null,
          photo_date: formData.photo_date || null,
          photographer_name: formData.photographer_name.trim() || null,
          location: formData.location.trim() || null,
          rotary_year_id: formData.rotary_year_id || null,
          category: formData.category,
          tags: formData.tags,
          visibility: formData.visibility,
          approval_status: 'approved', // Auto-approve for officers/chairs
          width: img.width,
          height: img.height,
          file_size: compressedBlob.size,
          mime_type: 'image/jpeg',
          uploaded_by: member?.id || null,
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to clean up uploaded file
        await supabase.storage.from('club-photos').remove([fileName])
        setError('Failed to save photo details. Please try again.')
        return
      }

      // Success!
      onPhotoUploaded(photoData)
      onClose()
    } catch (err) {
      console.error('Photo upload error:', err)
      setError('Failed to upload photo. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Upload Photo</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo *
            </label>
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null)
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <div className="flex items-center justify-center gap-2 text-[#0067c8] font-medium">
                    <Upload size={16} />
                    <span>Click to upload photo</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG or WebP (max 10MB, auto-compressed)
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Annual Fundraising Gala 2025"
              disabled={isUploading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Our club raised **$50,000** for *literacy programs* with 200 attendees! (Markdown supported)"
              rows={3}
              disabled={isUploading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports markdown: **bold** and *italics*
            </p>
          </div>

          {/* Date, Photographer, Location row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Date
              </label>
              <input
                type="date"
                value={formData.photo_date}
                onChange={(e) => setFormData({ ...formData, photo_date: e.target.value })}
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photographer
              </label>
              <input
                type="text"
                value={formData.photographer_name}
                onChange={(e) => setFormData({ ...formData, photographer_name: e.target.value })}
                placeholder="Jane Smith"
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Georgetown"
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>

          {/* Rotary Year and Category row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotary Year
              </label>
              <select
                value={formData.rotary_year_id}
                onChange={(e) => setFormData({ ...formData, rotary_year_id: e.target.value })}
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              >
                <option value="">None / General</option>
                {rotaryYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.rotary_year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Photo['category'] })}
                disabled={isUploading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              >
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="fellowship">Fellowship</option>
                <option value="service">Service</option>
                <option value="community">Community</option>
                <option value="members">Members</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="fundraising, youth, literacy..."
                disabled={isUploading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isUploading || !tagInput.trim()}
                className="px-4 py-3 min-h-[44px] bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#0067c8] text-white text-sm rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-gray-200"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as Photo['visibility'] })}
              disabled={isUploading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent disabled:opacity-50"
            >
              <option value="public">Public (visible to everyone)</option>
              <option value="members_only">Members Only</option>
              <option value="officers_only">Officers Only</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile || !formData.title.trim()}
              className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload Photo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
