import { logger } from '../utils/logger'
import { supabase } from './supabase'
import type { AreaOfFocus } from '../utils/areaOfFocusColors'

/**
 * Impact Stats Helper
 *
 * Calculates lifetime impact statistics from service projects and speakers
 * Supports filtering by Rotary year, Area of Focus, and Status
 */

export interface ImpactFilters {
  rotaryYear?: string // e.g., "2024-2025" or "all"
  areaOfFocus?: AreaOfFocus | 'all'
  status?: string | 'all'
}

export interface LifetimeImpact {
  peopleServed: number
  projectValue: number
  projectsCompleted: number
  speakersHosted: number
  activeProjects: number
  totalProjects: number
}

export interface AreaImpact {
  area: AreaOfFocus
  peopleServed: number
  projectValue: number
  projectCount: number
}

export interface YearImpact {
  year: string
  peopleServed: number
  projectValue: number
  projectCount: number
  speakersCount: number
}

/**
 * Get lifetime impact statistics with optional filters
 */
export async function getLifetimeImpact(filters?: ImpactFilters): Promise<LifetimeImpact> {
  try {
    // Build service projects query
    let projectsQuery = supabase
      .from('gt_service_projects')
      .select('*')

    // Apply filters
    if (filters?.areaOfFocus && filters.areaOfFocus !== 'all') {
      projectsQuery = projectsQuery.eq('area_of_focus', filters.areaOfFocus)
    }

    if (filters?.status && filters.status !== 'all') {
      projectsQuery = projectsQuery.eq('status', filters.status)
    }

    // Rotary year filtering would require joining with rotary_years table
    // For MVP, we'll use project_year (calendar year)
    if (filters?.rotaryYear && filters.rotaryYear !== 'all') {
      // Parse Rotary year like "2024-2025" → 2024
      const startYear = parseInt(filters.rotaryYear.split('-')[0])
      projectsQuery = projectsQuery.eq('project_year', startYear)
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) throw projectsError

    // Calculate aggregate stats
    const peopleServed = projects?.reduce((sum, p) => sum + (p.beneficiary_count || 0), 0) || 0
    const projectValue = projects?.reduce((sum, p) => sum + (p.project_value_rm || 0), 0) || 0
    const projectsCompleted = projects?.filter(p => p.status === 'Completed').length || 0
    const activeProjects = projects?.filter(p => ['Planning', 'Approved', 'Execution'].includes(p.status)).length || 0
    const totalProjects = projects?.length || 0

    // Get speakers count (spoken status only)
    const speakersQuery = supabase
      .from('gt_speakers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'spoken')

    // Apply Rotary year filter if needed
    if (filters?.rotaryYear && filters.rotaryYear !== 'all') {
      // Would need rotary_year_id filter - for MVP, skip this filter for speakers
      // or use scheduled_date year matching
    }

    const { count: speakersHosted, error: speakersError } = await speakersQuery

    if (speakersError) throw speakersError

    return {
      peopleServed,
      projectValue,
      projectsCompleted,
      speakersHosted: speakersHosted || 0,
      activeProjects,
      totalProjects,
    }
  } catch (error) {
    logger.error('Error calculating lifetime impact:', error)
    return {
      peopleServed: 0,
      projectValue: 0,
      projectsCompleted: 0,
      speakersHosted: 0,
      activeProjects: 0,
      totalProjects: 0,
    }
  }
}

/**
 * Get impact statistics grouped by Area of Focus
 */
export async function getImpactByAreaOfFocus(filters?: ImpactFilters): Promise<AreaImpact[]> {
  try {
    let query = supabase
      .from('gt_service_projects')
      .select('area_of_focus, beneficiary_count, project_value_rm')

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    // Apply Rotary year filter
    if (filters?.rotaryYear && filters.rotaryYear !== 'all') {
      const startYear = parseInt(filters.rotaryYear.split('-')[0])
      query = query.eq('project_year', startYear)
    }

    const { data: projects, error } = await query

    if (error) throw error

    // Group by area of focus
    const areaMap = new Map<AreaOfFocus, { peopleServed: number; projectValue: number; projectCount: number }>()

    projects?.forEach(project => {
      const area = project.area_of_focus as AreaOfFocus
      const existing = areaMap.get(area) || { peopleServed: 0, projectValue: 0, projectCount: 0 }

      areaMap.set(area, {
        peopleServed: existing.peopleServed + (project.beneficiary_count || 0),
        projectValue: existing.projectValue + (project.project_value_rm || 0),
        projectCount: existing.projectCount + 1,
      })
    })

    // Convert to array and sort by project value descending
    return Array.from(areaMap.entries())
      .map(([area, stats]) => ({
        area,
        ...stats,
      }))
      .sort((a, b) => b.projectValue - a.projectValue)
  } catch (error) {
    logger.error('Error calculating impact by area:', error)
    return []
  }
}

/**
 * Get impact statistics over time (by Rotary year)
 */
export async function getImpactOverTime(filters?: ImpactFilters): Promise<YearImpact[]> {
  try {
    let projectsQuery = supabase
      .from('gt_service_projects')
      .select('project_year, beneficiary_count, project_value_rm')

    // Apply area filter
    if (filters?.areaOfFocus && filters.areaOfFocus !== 'all') {
      projectsQuery = projectsQuery.eq('area_of_focus', filters.areaOfFocus)
    }

    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      projectsQuery = projectsQuery.eq('status', filters.status)
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) throw projectsError

    // Get speakers grouped by year
    const speakersQuery = supabase
      .from('gt_speakers')
      .select('scheduled_date')
      .eq('status', 'spoken')
      .not('scheduled_date', 'is', null)

    const { data: speakers, error: speakersError } = await speakersQuery

    if (speakersError) throw speakersError

    // Group projects by year
    const yearMap = new Map<number, { peopleServed: number; projectValue: number; projectCount: number; speakersCount: number }>()

    projects?.forEach(project => {
      const year = project.project_year
      const existing = yearMap.get(year) || { peopleServed: 0, projectValue: 0, projectCount: 0, speakersCount: 0 }

      yearMap.set(year, {
        peopleServed: existing.peopleServed + (project.beneficiary_count || 0),
        projectValue: existing.projectValue + (project.project_value_rm || 0),
        projectCount: existing.projectCount + 1,
        speakersCount: existing.speakersCount,
      })
    })

    // Group speakers by year
    speakers?.forEach(speaker => {
      if (speaker.scheduled_date) {
        const year = new Date(speaker.scheduled_date).getFullYear()
        const existing = yearMap.get(year) || { peopleServed: 0, projectValue: 0, projectCount: 0, speakersCount: 0 }

        yearMap.set(year, {
          ...existing,
          speakersCount: existing.speakersCount + 1,
        })
      }
    })

    // Convert to array and sort by year descending (most recent first)
    return Array.from(yearMap.entries())
      .map(([year, stats]) => ({
        year: `${year}-${year + 1}`, // Convert to Rotary year format
        ...stats,
      }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year))
  } catch (error) {
    logger.error('Error calculating impact over time:', error)
    return []
  }
}

/**
 * Get available Rotary years for filter dropdown
 */
export async function getAvailableRotaryYears(): Promise<string[]> {
  try {
    const { data: projects, error } = await supabase
      .from('gt_service_projects')
      .select('project_year')
      .order('project_year', { ascending: false })

    if (error) throw error

    // Get unique years and convert to Rotary year format
    const uniqueYears = [...new Set(projects?.map(p => p.project_year) || [])]
    return uniqueYears.map(year => `${year}-${year + 1}`)
  } catch (error) {
    logger.error('Error fetching available years:', error)
    return []
  }
}
