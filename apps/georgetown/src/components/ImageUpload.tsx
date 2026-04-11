import { logger } from '../utils/logger'
import { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Move, Link } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImage, isValidImageType, formatFileSize } from '../utils/imageCompression'

interface ImageUploadProps {
  // Core props
  currentImageUrl?: string
  onImageChange: (url: string | null) => void
  bucketName: 'project-images' | 'speaker-portraits' | 'member-portraits' | 'partner-logos'
  filePrefix: string  // e.g., "speaker-", "member-", "partner-"
  disabled?: boolean

  // Optional customization
  label?: string  // Default: "Image"
  helpText?: string  // Default: auto-generated based on bucket
  maxSizeMB?: number  // Default: 10, portraits: 5
  aspectRatio?: '1:1' | '16:9' | 'free'  // Default: 'free', portraits: '1:1'

  // Project-specific (optional)
  currentImagePosition?: string
  onPositionChange?: (position: string) => void
  showPositionControl?: boolean  // Default: false
}

const POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
]

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  bucketName,
  filePrefix,
  disabled = false,
  label = 'Image',
  helpText,
  maxSizeMB = 10,
  aspectRatio = 'free',
  currentImagePosition = 'center',
  onPositionChange,
  showPositionControl = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [imagePosition, setImagePosition] = useState(currentImagePosition)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state with props when they change
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
  }, [currentImageUrl])

  useEffect(() => {
    setImagePosition(currentImagePosition || 'center')
  }, [currentImagePosition])

  const processFile = async (file: File) => {
    setError(null)

    // Validate file type
    if (!isValidImageType(file)) {
      setError('Please select a valid image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (configurable max before compression)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image file is too large (max ${maxSizeMB}MB)`)
      return
    }

    try {
      setIsUploading(true)

      // Compress image
      const compressedBlob = await compressImage(file)
      logger.log(`Compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedBlob.size)}`)

      // Generate file name
      const fileExt = 'jpg' // Always save as JPG after compression
      const timestamp = Date.now()
      const fileName = `${filePrefix}${timestamp}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true, // Replace if exists
        })

      if (uploadError) {
        logger.error('Upload error:', uploadError)
        setError('Failed to upload image. Please try again.')
        return
      }

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      // Add timestamp to prevent browser caching when replacing images
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

      setPreviewUrl(cacheBustedUrl)
      onImageChange(cacheBustedUrl)
    } catch (err) {
      logger.error('Image upload error:', err)
      setError('Failed to process image. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    await processFile(file)
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Validate URL format
    try {
      new URL(urlInput)
      setPreviewUrl(urlInput)
      onImageChange(urlInput)
      setUrlInput('')
      setShowUrlInput(false)
      setError(null)
    } catch {
      setError('Please enter a valid URL (must start with http:// or https://)')
    }
  }

  const handleRemove = async () => {
    if (!previewUrl) return

    try {
      // Extract file path from URL
      const url = new URL(previewUrl)
      const pathMatch = url.pathname.match(new RegExp(`\\/${bucketName}\\/(.+)$`))

      if (pathMatch) {
        const filePath = pathMatch[1]
        await supabase.storage.from(bucketName).remove([filePath])
      }
    } catch (err) {
      logger.error('Error removing image:', err)
    }

    setPreviewUrl(null)
    setImagePosition('center')
    onImageChange(null)
    if (onPositionChange) {
      onPositionChange('center')
    }
  }

  const handlePositionChange = (newPosition: string) => {
    setImagePosition(newPosition)
    if (onPositionChange) {
      onPositionChange(newPosition)
    }
  }

  // Generate default help text if not provided
  const defaultHelpText = helpText || `JPG, PNG or WebP (max ${maxSizeMB}MB, auto-compressed)${aspectRatio === '1:1' ? ' • Square format recommended (400x400px)' : ''}`

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {previewUrl ? (
        <div className="space-y-3">
          <div className={`relative inline-block ${aspectRatio === '1:1' ? 'max-w-sm mx-auto' : 'w-full'}`}>
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className={`rounded-lg border border-gray-300 ${
                aspectRatio === '1:1'
                  ? 'w-full aspect-square object-cover'
                  : 'w-full max-w-md h-64 object-cover'
              }`}
              style={{ objectPosition: imagePosition }}
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 min-h-[44px] min-w-[44px] p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Position Selector - Only show if enabled */}
          {showPositionControl && (
            <div className="flex items-center space-x-2">
              <Move className="w-4 h-4 text-gray-500" />
              <label className="text-sm text-gray-700">Focal Point:</label>
              <select
                value={imagePosition}
                onChange={(e) => handlePositionChange(e.target.value)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure focus:border-transparent disabled:opacity-50"
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Adjust how image appears in card view</span>
            </div>
          )}

          {/* URL Input Option - Available even when image exists */}
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled || isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-azure hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link className="w-4 h-4" />
              <span>Replace with image URL</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlSubmit()
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={disabled || isUploading}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={disabled || isUploading || !urlInput.trim()}
                  className="px-4 py-3 min-h-[44px] bg-azure text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false)
                    setUrlInput('')
                    setError(null)
                  }}
                  disabled={disabled || isUploading}
                  className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  aria-label="Cancel URL input"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Enter a direct URL to replace current image (must start with http:// or https://)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              aspectRatio === '1:1' ? 'aspect-square max-w-sm mx-auto' : ''
            } ${
              isDragging
                ? 'border-azure bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer ${disabled || isUploading ? 'cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                  <>
                    <div className="w-12 h-12 border-4 border-azure border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Compressing and uploading...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className={`w-12 h-12 ${isDragging ? 'text-azure' : 'text-gray-400'}`} />
                    <div className="flex items-center space-x-2 text-azure font-medium">
                      <Upload className="w-4 h-4" />
                      <span>{isDragging ? 'Drop image here' : 'Click to upload or drag & drop'}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {defaultHelpText}
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* URL Input Option */}
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              disabled={disabled || isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-azure hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link className="w-4 h-4" />
              <span>Or enter image URL</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlSubmit()
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={disabled || isUploading}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-azure focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={disabled || isUploading || !urlInput.trim()}
                  className="px-4 py-3 min-h-[44px] bg-azure text-white text-sm font-medium rounded-lg hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false)
                    setUrlInput('')
                    setError(null)
                  }}
                  disabled={disabled || isUploading}
                  className="min-h-[44px] min-w-[44px] p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  aria-label="Cancel URL input"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Enter a direct URL to an existing image (must start with http:// or https://)
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
