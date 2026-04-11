import { logger } from '../utils/logger'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ServiceProjectDetailModal from '../components/ServiceProjectDetailModal'
import type { ServiceProject } from '../types/database'
import { validateUUID, LoadingModal } from './RouteUtils.tsx'

/**
 * Route component for project detail view
 * URL: /projects/:projectId
 *
 * Loads project data from database and renders detail modal
 * Handles loading states, errors, and navigation
 */
export default function ProjectDetailRoute() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ServiceProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    // Validate UUID format before making database query
    if (!projectId || !validateUUID(projectId)) {
      logger.warn('Invalid project ID format:', projectId)
      navigate('/projects')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from('gt_service_projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !projectData) {
        logger.error('Error loading project:', projectError)
        // Project not found - redirect to projects page
        navigate('/projects')
        return
      }

      // Fetch partners for the project
      const { data: partnerLinks } = await supabase
        .from('gt_project_partners')
        .select('partner_id')
        .eq('project_id', projectId)

      if (partnerLinks && partnerLinks.length > 0) {
        const { data: partners } = await supabase
          .from('gt_partners')
          .select('*')
          .in('id', partnerLinks.map((link) => link.partner_id))

        setProject({ ...projectData, partners: partners || [] })
      } else {
        setProject({ ...projectData, partners: [] })
      }
    } catch (err) {
      logger.error('Error loading project:', err)
      setError('Failed to load project')
      // On error, redirect to projects page after a moment
      setTimeout(() => navigate('/projects'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Navigate back to projects page
    navigate('/projects')
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
          <p className="text-sm text-gray-500">Redirecting to projects page...</p>
        </div>
      </div>
    )
  }

  // If no project after loading, return null (already redirected)
  if (!project) {
    return null
  }

  // Render detail modal
  return (
    <ServiceProjectDetailModal
      project={project}
      onClose={handleClose}
    />
  )
}
