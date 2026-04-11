import { logger } from '../utils/logger'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { LayoutGrid, List, Columns3, Download, Settings, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ServiceProject } from '../types/database'
import { getAreaOfFocusColor } from '../utils/areaOfFocusColors'
import { format } from 'date-fns'
import ServiceProjectModal from './ServiceProjectModal'
import ServiceProjectPageCard from './ServiceProjectPageCard'
import AppLayout from './AppLayout'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'

// Draggable Project Card Component
function DraggableProjectCard({ project, onViewProject }: { project: ServiceProject; onViewProject: (project: ServiceProject) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onViewProject(project)}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-move transition-shadow"
    >
      {/* Area of Focus Badge */}
      <div className="mb-2">
        <span
          className="inline-block px-2 py-1 rounded text-xs font-semibold text-white"
          style={{ backgroundColor: getAreaOfFocusColor(project.area_of_focus) }}
        >
          {project.area_of_focus}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
        {project.project_name}
      </h4>

      {/* Champion */}
      <p className="text-xs text-gray-600 mb-2">
        {project.champion}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{project.type}</span>
        {project.project_value_rm && (
          <span className="font-semibold text-[#0067c8]">
            RM {project.project_value_rm.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

// Project Column Component
function ProjectColumn({
  id,
  title,
  count,
  projects,
  onViewProject,
}: {
  id: string
  title: string
  count: number
  projects: ServiceProject[]
  onViewProject: (project: ServiceProject) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const getHeaderColor = (columnId: string) => {
    const colorMap: Record<string, string> = {
      'Idea': 'text-slate-700',       // Matches Speakers "Ideas" (gray/neutral - brainstorming)
      'Planning': 'text-blue-700',     // Matches Speakers "Approached" (blue - active preparation)
      'Approved': 'text-emerald-700',  // Matches Speakers "Agreed" (green - approved/confirmed)
      'Execution': 'text-amber-700',   // Matches Speakers "Scheduled" (amber - in progress/attention)
      'Completed': 'text-gray-700',    // Matches Speakers "Spoken" (gray - finished/archived)
      'Dropped': 'text-rose-700',      // Matches Speakers "Dropped" (red - negative/terminated)
    }
    return colorMap[columnId] || 'text-gray-700'
  }

  return (
    <div className="flex flex-col">
      <div
        className={`flex flex-col min-h-[500px] rounded-lg border bg-white ${
          isOver ? 'ring-2 ring-[#0067c8] ring-opacity-30 shadow-lg' : 'shadow-sm'
        } transition-all duration-200 hover:shadow-md border-gray-200`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3
              className={`text-sm font-semibold uppercase tracking-wide ${getHeaderColor(id)}`}
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              {title}
            </h3>
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full min-w-[24px] text-center">
              {count}
            </span>
          </div>
        </div>

        {/* Drop Zone */}
        <div ref={setNodeRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
          <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {projects.map((project) => (
              <DraggableProjectCard
                key={project.id}
                project={project}
                onViewProject={onViewProject}
              />
            ))}
          </SortableContext>

          {count === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <div className="mb-2 text-gray-300">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              Drop projects here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ServiceProjectsPage() {
  const [projects, setProjects] = useState<ServiceProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'board' | 'list'>('cards')
  const [statusFilter, setStatusFilter] = useState<string>('active') // Default to Planning + Execution
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ServiceProject | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showDropped, setShowDropped] = useState(false)
  const [sortField, setSortField] = useState<keyof ServiceProject>('start_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columnOrder, setColumnOrder] = useState([
    { key: 'project_name', label: 'Project Name', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'area_of_focus', label: 'Area of Focus', visible: true },
    { key: 'champion', label: 'Champion', visible: true },
    { key: 'start_date', label: 'Start Date', visible: true },
    { key: 'end_date', label: 'End Date', visible: false },
    { key: 'project_value_rm', label: 'Value (RM)', visible: true },
    { key: 'project_year', label: 'Rotary Year', visible: true },
    { key: 'location', label: 'Location', visible: false },
    { key: 'beneficiary_count', label: 'Beneficiaries', visible: false },
  ])
  // Drag-and-drop state for robust reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const columnSettingsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    loadProjects()
  }, [])

  // Click outside handler for column settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSettingsRef.current && !columnSettingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false)
      }
    }

    if (showColumnSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnSettings])

  const loadProjects = async () => {
    try {
      setIsLoading(true)

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('service_projects')
        .select('*')
        .order('start_date', { ascending: false })

      if (projectsError) {
        // Table doesn't exist yet (before migration) - just show empty state
        logger.error('Service projects error:', projectsError)
        setProjects([])
        setIsLoading(false)
        return
      }

      // Fetch partners for each project
      const projectsWithPartners = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: partnerLinks } = await supabase
            .from('project_partners')
            .select('partner_id')
            .eq('project_id', project.id)

          if (partnerLinks && partnerLinks.length > 0) {
            const { data: partners } = await supabase
              .from('partners')
              .select('*')
              .in('id', partnerLinks.map((link) => link.partner_id))

            return { ...project, partners: partners || [] }
          }

          return { ...project, partners: [] }
        })
      )

      setProjects(projectsWithPartners)
    } catch (error) {
      logger.error('Error loading projects:', error)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProject = () => {
    setSelectedProject(null)
    setIsAddModalOpen(true)
  }

  const handleViewProject = (project: ServiceProject) => {
    // Navigate to project detail route instead of opening modal directly
    navigate(`/projects/${project.id}`)
  }

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setSelectedProject(null)
    loadProjects()
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const projectId = active.id as string
    const newStatus = over.id as ServiceProject['status']
    const project = projects.find((p) => p.id === projectId)

    if (!project || project.status === newStatus) return

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    )

    // Update database
    const { error } = await supabase
      .from('service_projects')
      .update({ status: newStatus })
      .eq('id', projectId)

    if (error) {
      logger.error('Error updating project status:', error)
      // Revert on error
      loadProjects()
    }
  }

  const filteredProjects = projects.filter((project) => {
    // Handle status filter
    if (statusFilter === 'active') {
      // Show Planning + Execution + This Year's Completed projects
      const currentYear = new Date().getFullYear()
      const isActiveStatus = project.status === 'Planning' || project.status === 'Execution'
      const isThisYearCompleted = project.status === 'Completed' && project.project_year === currentYear

      if (!isActiveStatus && !isThisYearCompleted) return false
    } else if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false
    }

    if (areaFilter !== 'all' && project.area_of_focus !== areaFilter) return false
    if (typeFilter !== 'all' && project.type !== typeFilter) return false
    if (yearFilter !== 'all' && project.project_year.toString() !== yearFilter) return false
    return true
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue == null) return 1
    if (bValue == null) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: keyof ServiceProject) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleColumn = (key: string) => {
    setColumnOrder((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    )
  }

  const handleColumnDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleColumnDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    // Only update visual indicator, don't reorder yet (performance optimization)
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleColumnDragEnd = () => {
    // Only reorder on drop (single state update instead of hundreds)
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...columnOrder]
      const draggedItem = newOrder[draggedIndex]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(dragOverIndex, 0, draggedItem)
      setColumnOrder(newOrder)
    }
    // Reset drag state
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleColumnDragLeave = () => {
    setDragOverIndex(null)
  }

  // Column configuration for CSV export
  const columnConfig = [
    { key: 'project_name', header: 'Project Name', getValue: (p: ServiceProject) => p.project_name },
    { key: 'status', header: 'Status', getValue: (p: ServiceProject) => p.status },
    { key: 'type', header: 'Type', getValue: (p: ServiceProject) => p.type },
    { key: 'area_of_focus', header: 'Area of Focus', getValue: (p: ServiceProject) => p.area_of_focus },
    { key: 'champion', header: 'Project Lead', getValue: (p: ServiceProject) => p.champion },
    { key: 'start_date', header: 'Start Date', getValue: (p: ServiceProject) => p.start_date },
    { key: 'end_date', header: 'End Date', getValue: (p: ServiceProject) => p.end_date || '' },
    { key: 'project_value_rm', header: 'Value (RM)', getValue: (p: ServiceProject) => p.project_value_rm || '' },
    { key: 'project_year', header: 'Year', getValue: (p: ServiceProject) => p.project_year },
    { key: 'location', header: 'Location', getValue: (p: ServiceProject) => p.location || '' },
    { key: 'beneficiary_count', header: 'Beneficiaries', getValue: (p: ServiceProject) => p.beneficiary_count || '' },
  ]

  const exportToCSV = () => {
    // Only export visible columns in the user's chosen order
    const visibleCols = columnOrder.filter(col => col.visible)
    const headers = visibleCols.map(col => col.label)

    const rows = sortedProjects.map(p =>
      visibleCols.map(col => {
        const configItem = columnConfig.find(c => c.key === col.key)
        return configItem ? configItem.getValue(p) : ''
      })
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-projects-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueYears = Array.from(new Set(projects.map(p => p.project_year))).sort((a, b) => b - a)

  // Calculate summary statistics
  const getProjectStats = () => {
    const total = projects.length
    const active = projects.filter(p => p.status === 'Planning' || p.status === 'Execution').length

    // Get current Rotary year (July 1 - June 30)
    const now = new Date()
    const currentYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
    const currentRotaryYear = currentYear

    const completedThisYear = projects.filter(p =>
      p.status === 'Completed' && p.project_year === currentRotaryYear
    ).length

    const totalValue = projects
      .filter(p => p.status === 'Planning' || p.status === 'Execution')
      .reduce((sum, p) => sum + (p.project_value_rm || 0), 0)

    return { total, active, completedThisYear, totalValue }
  }

  const stats = getProjectStats()

  // Filter configurations
  const filterConfigs = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Current Year Progress (Active + Completed)' },
        { value: 'all', label: 'All Statuses' },
        { value: 'Idea', label: 'Idea' },
        { value: 'Planning', label: 'Planning' },
        { value: 'Execution', label: 'Execution' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Dropped', label: 'Dropped' },
      ],
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value),
    },
    {
      id: 'area',
      label: 'Area of Focus',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Areas' },
        { value: 'Peace', label: 'Peace' },
        { value: 'Disease', label: 'Disease' },
        { value: 'Water', label: 'Water' },
        { value: 'Maternal/Child', label: 'Maternal/Child' },
        { value: 'Education', label: 'Education' },
        { value: 'Economy', label: 'Economy' },
        { value: 'Environment', label: 'Environment' },
      ],
      value: areaFilter,
      onChange: (value: string) => setAreaFilter(value),
    },
    {
      id: 'type',
      label: 'Type',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'Club', label: 'Club' },
        { value: 'Joint', label: 'Joint' },
        { value: 'Global Grant', label: 'Global Grant' },
      ],
      value: typeFilter,
      onChange: (value: string) => setTypeFilter(value),
    },
    {
      id: 'year',
      label: 'Year',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Years' },
        ...uniqueYears.map((year) => ({ value: year.toString(), label: year.toString() })),
      ],
      value: yearFilter,
      onChange: (value: string) => setYearFilter(value),
    },
  ]

  // View configurations
  const viewConfigs = [
    { id: 'cards', label: 'Cards', icon: LayoutGrid },
    { id: 'board', label: 'Board', icon: Columns3 },
    { id: 'list', label: 'List', icon: List },
  ]

  if (isLoading) {
    return (
      <AppLayout
        sectionName="Projects"
        showAddButton={false}
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0067c8] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service projects...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sectionName="Projects"
      onAddClick={handleAddProject}
      addButtonLabel="Add Project"
      showAddButton={true}
      views={viewConfigs}
      activeView={viewMode}
      onViewChange={(view) => setViewMode(view as 'cards' | 'board' | 'list')}
      showFiltersToggle={true}
      filtersExpanded={filtersExpanded}
      onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
      showFilters={filtersExpanded}
      filters={filterConfigs}
      resultCount={sortedProjects.length}
      totalCount={projects.length}
      entityName="projects"
    >
      {/* Summary Panel */}
      <div className="px-4 pt-6 pb-4">
        <div className="grid grid-cols-4 gap-3 bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0067c8]">{stats.total}</div>
            <div className="text-xs text-gray-600 leading-tight">Total<br />Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f7a81b]">{stats.active}</div>
            <div className="text-xs text-gray-600 leading-tight">Active<br />Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f7a81b]">{stats.completedThisYear}</div>
            <div className="text-xs text-gray-600 leading-tight">Completed<br />This Year</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-[#0067c8] leading-tight">
              RM {(stats.totalValue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-600 leading-tight">Total Value<br />(RM)</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pb-6">
        {/* Export CSV Button and Column Settings for List View */}
        {viewMode === 'list' && (
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7a81b] text-white rounded-lg hover:bg-[#e09916] transition-colors font-medium"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>

            {/* Column Settings Dropdown */}
            <div className="relative" ref={columnSettingsRef}>
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Settings size={18} />
                <span>Columns</span>
              </button>

              {showColumnSettings && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 text-sm">Column Visibility & Order</h3>
                    <button
                      onClick={() => setShowColumnSettings(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Column Checkboxes with Drag-and-Drop */}
                  <div className="p-3 max-h-96 overflow-y-auto">
                    <p className="text-xs text-gray-500 mb-2 px-2">Drag to reorder columns</p>
                    {columnOrder.map((column, index) => (
                      <label
                        key={column.key}
                        draggable
                        onDragStart={() => handleColumnDragStart(index)}
                        onDragOver={(e) => handleColumnDragOver(e, index)}
                        onDragEnd={handleColumnDragEnd}
                        onDragLeave={handleColumnDragLeave}
                        className={`flex items-center gap-2 px-2 py-2 rounded cursor-move transition-all ${
                          draggedIndex === index
                            ? 'opacity-40 bg-gray-100'
                            : dragOverIndex === index
                            ? 'border-t-2 border-[#0067c8] bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-400 text-xs">⋮⋮</span>
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumn(column.key)}
                          className="rounded border-gray-300 text-[#0067c8] focus:ring-[#0067c8]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-700 flex-1">
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <>
          {sortedProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {statusFilter === 'all'
                  ? 'No service projects yet. Create your first project to get started.'
                  : statusFilter === 'active'
                  ? 'No active or completed projects for this year. Try changing the filter to see other projects.'
                  : `No projects with status "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => (
                <ServiceProjectPageCard
                  key={project.id}
                  project={project}
                  onClick={handleViewProject}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columnOrder
                    .filter((col) => col.visible)
                    .map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key as keyof ServiceProject)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        {col.label} {sortField === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => handleViewProject(project)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {columnOrder
                      .filter((col) => col.visible)
                      .map((col) => {
                        // Render cell content based on column key
                        switch (col.key) {
                          case 'project_name':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {project.project_name}
                              </td>
                            )
                          case 'status':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    project.status === 'Completed'
                                      ? 'bg-green-100 text-green-800'
                                      : project.status === 'Execution'
                                      ? 'bg-blue-100 text-blue-800'
                                      : project.status === 'Planning'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : project.status === 'Dropped'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {project.status}
                                </span>
                              </td>
                            )
                          case 'type':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.type}
                              </td>
                            )
                          case 'area_of_focus':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className="inline-flex px-2 py-1 text-xs font-semibold text-white rounded"
                                  style={{ backgroundColor: getAreaOfFocusColor(project.area_of_focus) }}
                                >
                                  {project.area_of_focus}
                                </span>
                              </td>
                            )
                          case 'champion':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.champion}
                              </td>
                            )
                          case 'start_date':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(project.start_date), 'MMM d, yyyy')}
                              </td>
                            )
                          case 'end_date':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.end_date ? format(new Date(project.end_date), 'MMM d, yyyy') : '-'}
                              </td>
                            )
                          case 'project_value_rm':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {project.project_value_rm ? `RM ${project.project_value_rm.toLocaleString()}` : '-'}
                              </td>
                            )
                          case 'project_year':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.project_year}
                              </td>
                            )
                          case 'location':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.location || '-'}
                              </td>
                            )
                          case 'beneficiary_count':
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {project.beneficiary_count || '-'}
                              </td>
                            )
                          default:
                            return (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                -
                              </td>
                            )
                        }
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Toggle Dropped Column */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowDropped(!showDropped)}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showDropped ? 'Hide Dropped' : 'Show Dropped'}
            </button>
          </div>

          {/* Horizontal Scroll Board - Industry Standard (Trello/Asana Pattern) */}
          <div className="overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 snap-x snap-mandatory" style={{ minHeight: '600px' }}>
              {['Idea', 'Planning', 'Approved', 'Execution', 'Completed', ...(showDropped ? ['Dropped'] : [])].map((status) => {
                const columnProjects = projects.filter((p) => p.status === status)
                return (
                  <div key={status} className="flex-none w-[85vw] md:w-80 snap-start">
                    <ProjectColumn
                      id={status}
                      title={status.toUpperCase()}
                      count={columnProjects.length}
                      projects={columnProjects}
                      onViewProject={handleViewProject}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="bg-white border-2 border-[#0067c8] rounded-lg p-3 shadow-xl opacity-90">
                <div className="text-sm font-semibold text-gray-900">
                  {projects.find((p) => p.id === activeId)?.project_name}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <ServiceProjectModal project={selectedProject} onClose={handleModalClose} />
      )}

      {/* Nested routes render here (e.g., ProjectDetailRoute) */}
      <Outlet />
    </AppLayout>
  )
}
