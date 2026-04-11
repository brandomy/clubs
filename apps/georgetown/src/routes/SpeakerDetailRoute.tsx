import { logger } from '../utils/logger'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SpeakerDetailModal from '../components/SpeakerDetailModal'
import type { Speaker } from '../types/database'
import { validateUUID, LoadingModal } from './RouteUtils.tsx'
import { updateMetaTags, getSpeakerMetaTags, resetMetaTags } from '../utils/metaTags'

/**
 * Route component for speaker detail view
 * URL: /speakers/:speakerId
 *
 * Loads speaker data from database and renders detail modal
 * Handles loading states, errors, and navigation
 */
export default function SpeakerDetailRoute() {
  const { speakerId } = useParams<{ speakerId: string }>()
  const navigate = useNavigate()
  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSpeaker()
  }, [speakerId])

  const loadSpeaker = async () => {
    // Validate UUID format before making database query
    if (!speakerId || !validateUUID(speakerId)) {
      logger.warn('Invalid speaker ID format:', speakerId)
      navigate('/speakers')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('gt_speakers')
        .select('*')
        .eq('id', speakerId)
        .single()

      if (error || !data) {
        logger.error('Error loading speaker:', error)
        // Speaker not found - redirect to board
        navigate('/speakers')
        return
      }

      setSpeaker(data)

      // Update meta tags for social sharing
      const metaTags = getSpeakerMetaTags(data)
      updateMetaTags(metaTags)
    } catch (err) {
      logger.error('Error loading speaker:', err)
      setError('Failed to load speaker')
      // On error, redirect to board after a moment
      setTimeout(() => navigate('/speakers'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset meta tags to default
    resetMetaTags()
    // Navigate back to speakers board
    navigate('/speakers')
  }

  const handleEdit = () => {
    // Navigate to edit view
    navigate(`/speakers/${speakerId}/edit`)
  }

  // Show loading state
  if (loading) {
    return <LoadingModal />
  }

  // Show error state (with auto-redirect)
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md shadow-xl">
          <div className="flex items-center text-red-600 mb-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to speakers board...</p>
        </div>
      </div>
    )
  }

  // If no speaker after loading, return null (already redirected)
  if (!speaker) {
    return null
  }

  // Render detail modal
  return (
    <SpeakerDetailModal
      speaker={speaker}
      onClose={handleClose}
      onEdit={handleEdit}
    />
  )
}
