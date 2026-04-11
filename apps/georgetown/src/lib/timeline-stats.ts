/**
 * Timeline Statistics Utilities
 *
 * Auto-calculates statistics for Rotary years based on speakers and service projects.
 * Provides functions to aggregate and update year-level metrics.
 */

import { supabase } from './supabase'

/**
 * Statistics structure for a Rotary year
 */
export type RotaryYearStats = {
  meetings: number
  speakers: number
  projects: number
  beneficiaries: number
  project_value_rm: number
  volunteer_hours?: number
}

/**
 * Calculate comprehensive statistics for a Rotary year.
 *
 * Aggregates data from:
 * - Speakers who spoke during the year
 * - Service projects completed during the year
 *
 * @param rotaryYearId - UUID of the Rotary year record
 * @returns Calculated statistics object
 */
export async function calculateRotaryYearStats(
  rotaryYearId: string
): Promise<RotaryYearStats> {
  // First, get the Rotary year record to get date range
  const { data: rotaryYearData, error: yearError } = await supabase
    .from('rotary_years')
    .select('start_date, end_date, rotary_year')
    .eq('id', rotaryYearId)
    .single()

  if (yearError) {
    console.error('Error fetching rotary year data:', yearError)
    return {
      meetings: 0,
      speakers: 0,
      projects: 0,
      beneficiaries: 0,
      project_value_rm: 0,
      volunteer_hours: 0
    }
  }

  // Fetch speakers for this year using BOTH rotary_year_id AND date range fallback
  // This handles speakers that were marked "spoken" before auto-linking was implemented
  const { data: speakers, error: speakersError } = await supabase
    .from('speakers')
    .select('*')
    .eq('status', 'spoken')
    .gte('scheduled_date', rotaryYearData.start_date)
    .lte('scheduled_date', rotaryYearData.end_date)

  if (speakersError) {
    console.error('Error fetching speakers for stats:', speakersError) // eslint-disable-line no-console
  }

  // Fetch completed service projects for this year using BOTH methods
  const { data: projects, error: projectsError } = await supabase
    .from('service_projects')
    .select('*')
    .eq('rotary_year_id', rotaryYearId)
    .eq('status', 'Completed')

  if (projectsError) {
    console.error('Error fetching projects for stats:', projectsError) // eslint-disable-line no-console
  }

  // Calculate totals from service projects
  const totalBeneficiaries = projects?.reduce(
    (sum, p) => sum + (p.beneficiary_count || 0),
    0
  ) || 0

  const totalProjectValue = projects?.reduce(
    (sum, p) => sum + (Number(p.project_value_rm) || 0),
    0
  ) || 0

  return {
    meetings: speakers?.length || 0,
    speakers: speakers?.length || 0,
    projects: projects?.length || 0,
    beneficiaries: totalBeneficiaries,
    project_value_rm: totalProjectValue,
    volunteer_hours: 0  // TODO: Add volunteer hours tracking in future
  }
}

/**
 * Update the statistics for a Rotary year.
 * Recalculates and saves to the rotary_years table.
 *
 * @param rotaryYearId - UUID of the Rotary year record
 * @returns Updated statistics or null if error
 */
export async function updateRotaryYearStats(
  rotaryYearId: string
): Promise<RotaryYearStats | null> {
  const stats = await calculateRotaryYearStats(rotaryYearId)

  const { error } = await supabase
    .from('rotary_years')
    .update({ stats })
    .eq('id', rotaryYearId)

  if (error) {
    console.error('Error updating rotary year stats:', error) // eslint-disable-line no-console
    return null
  }

  return stats
}

/**
 * Recalculate statistics for all Rotary years.
 * Useful for batch updates or data migrations.
 *
 * @returns Number of years updated
 */
export async function recalculateAllRotaryYearStats(): Promise<number> {
  const { data: rotaryYears, error } = await supabase
    .from('rotary_years')
    .select('id')

  if (error) {
    console.error('Error fetching rotary years:', error)
    return 0
  }

  let updatedCount = 0

  for (const year of rotaryYears || []) {
    const result = await updateRotaryYearStats(year.id)
    if (result) {
      updatedCount++
    }
  }

  return updatedCount
}

/**
 * Get formatted statistics for display.
 *
 * @param stats - Raw statistics object
 * @returns Formatted strings for UI display
 */
export function formatRotaryYearStats(stats: RotaryYearStats) {
  return {
    meetings: `${stats.meetings} meetings`,
    speakers: `${stats.speakers} speakers`,
    projects: `${stats.projects} completed projects`,
    beneficiaries: `${stats.beneficiaries.toLocaleString()} people served`,
    projectValue: `RM ${stats.project_value_rm.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`,
    volunteerHours: stats.volunteer_hours
      ? `${stats.volunteer_hours.toLocaleString()} volunteer hours`
      : 'Not tracked'
  }
}

/**
 * Calculate year-over-year growth percentages.
 *
 * @param currentStats - Current year statistics
 * @param previousStats - Previous year statistics
 * @returns Growth percentages for each metric
 */
export function calculateYearOverYearGrowth(
  currentStats: RotaryYearStats,
  previousStats: RotaryYearStats
) {
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    meetings: calculateGrowth(currentStats.meetings, previousStats.meetings),
    speakers: calculateGrowth(currentStats.speakers, previousStats.speakers),
    projects: calculateGrowth(currentStats.projects, previousStats.projects),
    beneficiaries: calculateGrowth(
      currentStats.beneficiaries,
      previousStats.beneficiaries
    ),
    projectValue: calculateGrowth(
      currentStats.project_value_rm,
      previousStats.project_value_rm
    )
  }
}

/**
 * Get summary statistics for a date range.
 * Useful for multi-year reports or club history summaries.
 *
 * @param rotaryYearIds - Array of Rotary year UUIDs
 * @returns Aggregated statistics across all years
 */
export async function getMultiYearStats(
  rotaryYearIds: string[]
): Promise<RotaryYearStats> {
  const allStats: RotaryYearStats = {
    meetings: 0,
    speakers: 0,
    projects: 0,
    beneficiaries: 0,
    project_value_rm: 0,
    volunteer_hours: 0
  }

  for (const yearId of rotaryYearIds) {
    const stats = await calculateRotaryYearStats(yearId)
    allStats.meetings += stats.meetings
    allStats.speakers += stats.speakers
    allStats.projects += stats.projects
    allStats.beneficiaries += stats.beneficiaries
    allStats.project_value_rm += stats.project_value_rm
    allStats.volunteer_hours = (allStats.volunteer_hours || 0) + (stats.volunteer_hours || 0)
  }

  return allStats
}

/**
 * Validate if statistics need recalculation.
 * Compares stored stats with fresh calculation.
 *
 * @param rotaryYearId - UUID of the Rotary year record
 * @returns True if stats are current, false if they need update
 */
export async function validateRotaryYearStats(
  rotaryYearId: string
): Promise<boolean> {
  // Fetch stored stats
  const { data: rotaryYear, error } = await supabase
    .from('rotary_years')
    .select('stats')
    .eq('id', rotaryYearId)
    .single()

  if (error || !rotaryYear) {
    return false
  }

  // Calculate fresh stats
  const freshStats = await calculateRotaryYearStats(rotaryYearId)
  const storedStats = rotaryYear.stats as RotaryYearStats

  // Compare key metrics
  return (
    storedStats.meetings === freshStats.meetings &&
    storedStats.speakers === freshStats.speakers &&
    storedStats.projects === freshStats.projects &&
    storedStats.beneficiaries === freshStats.beneficiaries &&
    storedStats.project_value_rm === freshStats.project_value_rm
  )
}
