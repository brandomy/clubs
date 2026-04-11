import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, CheckCircle, Target } from 'lucide-react'
import AppLayout from './AppLayout'
import ProjectsList from './ProjectsList'
import ServiceProjectDetailModal from './ServiceProjectDetailModal'
import type { ServiceProject } from '../types/database'
import type { AreaOfFocus } from '../utils/areaOfFocusColors'
import { getAreaOfFocusColor } from '../utils/areaOfFocusColors'
import { supabase } from '../lib/supabase'
import {
  getLifetimeImpact,
  getImpactByAreaOfFocus,
  getAvailableRotaryYears,
  type LifetimeImpact,
  type AreaImpact,
  type ImpactFilters,
} from '../lib/impact-stats'

const AREAS_OF_FOCUS: (AreaOfFocus | 'all')[] = [
  'all',
  'Peace',
  'Disease',
  'Water',
  'Maternal/Child',
  'Education',
  'Economy',
  'Environment',
]

const PROJECT_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Execution', label: 'In Progress' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Idea', label: 'Ideas' },
]

export default function ImpactPage() {
  // Filter state
  const [rotaryYear, setRotaryYear] = useState<string>('all')
  const [areaOfFocus, setAreaOfFocus] = useState<AreaOfFocus | 'all'>('all')
  const [status, setStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Data state
  const [lifetimeImpact, setLifetimeImpact] = useState<LifetimeImpact>({
    peopleServed: 0,
    projectValue: 0,
    projectsCompleted: 0,
    speakersHosted: 0,
    activeProjects: 0,
    totalProjects: 0,
  })
  const [areaImpacts, setAreaImpacts] = useState<AreaImpact[]>([])
  const [projects, setProjects] = useState<ServiceProject[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ServiceProject | null>(null)

  // Load initial data
  useEffect(() => {
    loadImpactData()
  }, [rotaryYear, areaOfFocus, status])

  async function loadImpactData() {
    setIsLoading(true)
    try {
      const filters: ImpactFilters = {
        rotaryYear: rotaryYear === 'all' ? undefined : rotaryYear,
        areaOfFocus: areaOfFocus === 'all' ? undefined : areaOfFocus,
        status: status === 'all' ? undefined : status,
      }

      // Load all impact data in parallel
      const [lifetime, areaStats, yearsData, projectsData] = await Promise.all([
        getLifetimeImpact(filters),
        getImpactByAreaOfFocus(filters),
        getAvailableRotaryYears(),
        loadProjects(filters),
      ])

      setLifetimeImpact(lifetime)
      setAreaImpacts(areaStats)
      setAvailableYears(['all', ...yearsData])
      setProjects(projectsData)
    } catch (error) {
      logger.error('Error loading impact data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadProjects(filters: ImpactFilters): Promise<ServiceProject[]> {
    try {
      let query = supabase
        .from('service_projects')
        .select('*')
        .order('start_date', { ascending: false })

      // Apply filters
      if (filters.areaOfFocus) {
        query = query.eq('area_of_focus', filters.areaOfFocus)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.rotaryYear) {
        const startYear = parseInt(filters.rotaryYear.split('-')[0])
        query = query.eq('project_year', startYear)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error loading projects:', error)
      return []
    }
  }

  // Filter projects by search term
  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.champion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AppLayout
      sectionName="IMPACT"
      showAddButton={false}
      showFilters
      searchPlaceholder="Search projects..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        {
          id: 'year',
          label: 'Rotary Year',
          type: 'select',
          options: availableYears.map(year => ({
            value: year,
            label: year === 'all' ? 'All Years' : year,
          })),
          value: rotaryYear,
          onChange: setRotaryYear,
        },
        {
          id: 'area',
          label: 'Area of Focus',
          type: 'select',
          options: AREAS_OF_FOCUS.map(area => ({
            value: area,
            label: area === 'all' ? 'All Areas' : area,
          })),
          value: areaOfFocus,
          onChange: setAreaOfFocus,
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: PROJECT_STATUSES,
          value: status,
          onChange: setStatus,
        },
      ]}
      resultCount={filteredProjects.length}
      totalCount={projects.length}
      entityName="projects"
    >
      <div className="space-y-6 pb-6">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0067c8]"></div>
              <p className="mt-4 text-gray-600">Loading impact data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Lifetime Impact Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* People Served */}
              <div className="bg-gradient-to-br from-[#0067c8] to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 opacity-80" />
                  <TrendingUp className="h-5 w-5 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {lifetimeImpact.peopleServed.toLocaleString()}
                </h3>
                <p className="text-sm opacity-90">People Served</p>
              </div>

              {/* Project Value */}
              <div className="bg-gradient-to-br from-[#f7a81b] to-yellow-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 opacity-80" />
                  <TrendingUp className="h-5 w-5 opacity-60" />
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  RM {(lifetimeImpact.projectValue / 1000).toFixed(0)}K
                </h3>
                <p className="text-sm opacity-90">Project Value</p>
              </div>

              {/* Projects Completed */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-8 w-8 opacity-80" />
                  <span className="text-sm opacity-80">
                    of {lifetimeImpact.totalProjects}
                  </span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {lifetimeImpact.projectsCompleted}
                </h3>
                <p className="text-sm opacity-90">Completed Projects</p>
              </div>

              {/* Speakers Hosted */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-8 w-8 opacity-80" />
                  <span className="text-sm opacity-80">
                    {lifetimeImpact.activeProjects} active
                  </span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {lifetimeImpact.speakersHosted}
                </h3>
                <p className="text-sm opacity-90">Speakers Hosted</p>
              </div>
            </div>

            {/* Impact by Area of Focus */}
            {areaImpacts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Impact by Area of Focus
                </h2>
                <div className="space-y-3">
                  {areaImpacts.map((area) => (
                    <div key={area.area} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getAreaOfFocusColor(area.area) }}
                          ></span>
                          <span className="font-semibold text-gray-900">
                            {area.area}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {area.projectCount} {area.projectCount === 1 ? 'project' : 'projects'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 ml-7">
                        <div>
                          <p className="text-xs text-gray-500">People Served</p>
                          <p className="text-lg font-semibold text-[#0067c8]">
                            {area.peopleServed.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Project Value</p>
                          <p className="text-lg font-semibold text-[#f7a81b]">
                            RM {area.projectValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Projects List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-1">
                Projects
                {searchTerm && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (filtered by search)
                  </span>
                )}
              </h2>
              {filteredProjects.length > 0 ? (
                <ProjectsList
                  projects={filteredProjects}
                  onProjectClick={setSelectedProject}
                />
              ) : (
                <div className="bg-white rounded-lg p-12 text-center shadow">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {searchTerm
                      ? 'No projects match your search'
                      : 'No projects found with selected filters'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setRotaryYear('all')
                      setAreaOfFocus('all')
                      setStatus('all')
                    }}
                    className="mt-4 text-[#0067c8] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ServiceProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </AppLayout>
  )
}
