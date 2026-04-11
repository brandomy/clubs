import { logger } from '../utils/logger'
import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { supabase } from '../lib/supabase'
import type { Speaker } from '../types/database'
import Column from './Column'
import SpeakerCard from './SpeakerCard'
import SpeakerModal from './SpeakerModal'
import SpeakerDetailModal from './SpeakerDetailModal'
import AppLayout from './AppLayout'
import SpeakerCardExpanded from './SpeakerCardExpanded'
import { BadgeCheck, Calendar, LayoutGrid, Columns3, Table as TableIcon, Download, Settings, X } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { getRotaryYearFromDate } from '../lib/rotary-year-utils'
import { updateRotaryYearStats } from '../lib/timeline-stats'
import { trackInteraction, trackCTA } from '../utils/analytics'

const allColumns = [
  { id: 'ideas', title: 'IDEAS', color: 'bg-purple-50 border-purple-300' },
  { id: 'approached', title: 'APPROACHED', color: 'bg-blue-50 border-blue-300' },
  { id: 'agreed', title: 'AGREED', color: 'bg-green-50 border-green-300' },
  { id: 'scheduled', title: 'SCHEDULED', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'spoken', title: 'SPOKEN', color: 'bg-gray-50 border-gray-300' },
  { id: 'dropped', title: 'DROPPED', color: 'bg-red-50 border-red-300' },
] as const

const activeColumns = allColumns.filter(col => col.id !== 'dropped')

// View configurations for ViewSwitcher
const viewConfigs = [
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'spreadsheet', label: 'List', icon: TableIcon },
]

export default function KanbanBoard() {
  const navigate = useNavigate()
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'board' | 'spreadsheet' | 'calendar'>('cards')
  const [defaultStatus, setDefaultStatus] = useState<Speaker['status'] | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null)
  const [viewingSpeaker, setViewingSpeaker] = useState<Speaker | null>(null)

  // List view: Sorting state
  const [sortField, setSortField] = useState<keyof Speaker>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // List view: Column visibility and order state
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columnOrder, setColumnOrder] = useState([
    { key: 'name', label: 'Name', visible: true },
    { key: 'organization', label: 'Organization', visible: true },
    { key: 'topic', label: 'Topic', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'phone', label: 'Phone', visible: false },
    { key: 'scheduled_date', label: 'Scheduled', visible: true },
    { key: 'is_rotarian', label: 'Rotarian', visible: false },
  ])
  // Drag-and-drop state for robust reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // List view: Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active') // active = not dropped/spoken
  const [rotarianFilter, setRotarianFilter] = useState<string>('all')
  const [scheduledFilter, setScheduledFilter] = useState<string>('all')
  const [recommendedFilter, setRecommendedFilter] = useState<string>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const columnSettingsRef = useRef<HTMLDivElement>(null)

  // Show dropped column based on status filter
  const showDroppedColumn = statusFilter === 'all' || statusFilter === 'dropped'
  const columns = showDroppedColumn ? allColumns : activeColumns

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchSpeakers()
    const subscription = supabase
      .channel('speakers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speakers' },
        handleRealtimeUpdate
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Redirect to /calendar when calendar view mode is selected
  useEffect(() => {
    if (viewMode === 'calendar') {
      navigate('/calendar')
    }
  }, [viewMode, navigate])

  // Legacy query parameter handler removed - now using URL routing
  // Shared speaker URLs use new format: /speakers/:id
  // See SpeakerDetailRoute.tsx for implementation

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

  const fetchSpeakers = async () => {
    const { data, error } = await supabase
      .from('speakers')
      .select('*')
      .order('position', { ascending: true })

    if (error) {
      logger.error('Error fetching speakers:', error)
    } else {
      setSpeakers(data || [])
    }
    setLoading(false)
  }

  // Filter speakers with search and filters (all views)
  const filteredSpeakers = speakers.filter(speaker => {
    // Search filter (name, organization, topic, email)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        speaker.name.toLowerCase().includes(searchLower) ||
        speaker.organization?.toLowerCase().includes(searchLower) ||
        speaker.topic?.toLowerCase().includes(searchLower) ||
        speaker.email?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter === 'active') {
      // Active = not dropped and not spoken
      if (speaker.status === 'dropped' || speaker.status === 'spoken') return false
    } else if (statusFilter === 'pipeline') {
      // Pipeline = ideas, approached, agreed, scheduled (active pipeline)
      if (!['ideas', 'approached', 'agreed', 'scheduled'].includes(speaker.status)) return false
    } else if (statusFilter === 'scheduled') {
      if (speaker.status !== 'scheduled') return false
    } else if (statusFilter === 'spoken') {
      if (speaker.status !== 'spoken') return false
    } else if (statusFilter === 'dropped') {
      if (speaker.status !== 'dropped') return false
    }
    // 'all' shows everything

    // Rotarian filter
    if (rotarianFilter === 'rotarians') {
      if (!speaker.is_rotarian) return false
    } else if (rotarianFilter === 'non-rotarians') {
      if (speaker.is_rotarian) return false
    }

    // Scheduled date filter
    if (scheduledFilter !== 'all' && speaker.scheduled_date) {
      const schedDate = new Date(speaker.scheduled_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (scheduledFilter === 'upcoming') {
        if (schedDate < today) return false
      } else if (scheduledFilter === 'past') {
        if (schedDate >= today) return false
      }
    } else if (scheduledFilter !== 'all' && !speaker.scheduled_date) {
      // If filtering by date but speaker has no date, exclude them
      return false
    }

    // Recommended filter
    if (recommendedFilter === 'recommended') {
      if (!speaker.recommend) return false
    }

    return true
  })

  // List view: Helper functions for sorting and export
  const handleSort = (field: keyof Speaker) => {
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

  const exportToCSV = () => {
    // Track CSV export
    trackInteraction('csv-export', 'kanban-board', sortedSpeakers.length)

    // Only export visible columns in the user's chosen order
    const visibleCols = columnOrder.filter(col => col.visible)
    const headers = visibleCols.map(col => col.label)

    const rows = sortedSpeakers.map(speaker =>
      visibleCols.map(col => {
        const value = speaker[col.key as keyof Speaker]
        if (col.key === 'scheduled_date' && value) {
          return format(new Date(value as string), 'MMM d, yyyy')
        }
        if (col.key === 'is_rotarian') {
          return value ? 'Yes' : 'No'
        }
        return value || ''
      })
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `speakers-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Sort speakers by status priority (Cards/Board view) OR by manual sort field (List view)
  const statusPriority: Record<string, number> = {
    scheduled: 1,  // Most urgent - confirm details, prep intro, coordinate logistics
    agreed: 2,     // Next priority - assign a date, active task
    approached: 3, // In negotiation - waiting for response, need follow up
    ideas: 4,      // Brainstorming phase - not urgent
    spoken: 5,     // Historical record - lowest priority for current planning
    dropped: 6     // Archive - no action needed
  }

  const sortedSpeakers = [...filteredSpeakers].sort((a, b) => {
    // List view: Use manual sorting
    if (viewMode === 'spreadsheet') {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue == null) return 1
      if (bValue == null) return -1

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    }

    // Cards/Board view: Use status priority sorting
    const aPriority = statusPriority[a.status] || 999
    const bPriority = statusPriority[b.status] || 999

    // Sort by status priority first
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    // Within same status: Scheduled speakers sort by date (upcoming first)
    if (a.status === 'scheduled' && b.status === 'scheduled' && a.scheduled_date && b.scheduled_date) {
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    }

    // Otherwise maintain position order within same status
    return a.position - b.position
  })

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setSpeakers((prev) => [...prev, payload.new as Speaker])
    } else if (payload.eventType === 'UPDATE') {
      setSpeakers((prev) =>
        prev.map((speaker) =>
          speaker.id === payload.new.id ? (payload.new as Speaker) : speaker
        )
      )
    } else if (payload.eventType === 'DELETE') {
      setSpeakers((prev) =>
        prev.filter((speaker) => speaker.id !== payload.old.id)
      )
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeSpeaker = speakers.find((s) => s.id === activeId)
    if (!activeSpeaker) return

    if (columns.some((col) => col.id === overId)) {
      const newStatus = overId as Speaker['status']
      if (activeSpeaker.status !== newStatus) {
        // Track speaker status change via drag-and-drop
        trackInteraction('speaker-status-changed', 'kanban-board', `${activeSpeaker.status}-to-${newStatus}`)
        updateSpeakerStatus(activeId, newStatus)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeSpeaker = speakers.find((s) => s.id === activeId)
    const overSpeaker = speakers.find((s) => s.id === overId)

    if (activeSpeaker && overSpeaker && activeSpeaker.status === overSpeaker.status) {
      const columnSpeakers = speakers.filter((s) => s.status === activeSpeaker.status)
      const oldIndex = columnSpeakers.findIndex((s) => s.id === activeId)
      const newIndex = columnSpeakers.findIndex((s) => s.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSpeakers = arrayMove(columnSpeakers, oldIndex, newIndex)
        updateSpeakerPositions(reorderedSpeakers)
      }
    }

    setActiveId(null)
  }

  const updateSpeakerStatus = async (speakerId: string, newStatus: Speaker['status']) => {
    const speaker = speakers.find(s => s.id === speakerId)
    const updatedSpeakers = speakers.map((speaker) =>
      speaker.id === speakerId ? { ...speaker, status: newStatus } : speaker
    )
    setSpeakers(updatedSpeakers)

    const { error } = await supabase
      .from('speakers')
      .update({ status: newStatus, updated_by: 'current_user' })
      .eq('id', speakerId)

    if (error) {
      logger.error('Error updating speaker status:', error)
      fetchSpeakers()
      return
    }

    // Auto-link to Rotary year when speaker moved to "spoken" status
    if (newStatus === 'spoken' && speaker?.scheduled_date) {
      try {
        const rotaryYear = getRotaryYearFromDate(speaker.scheduled_date)
        logger.log(`Speaker marked as spoken. Auto-linking to Rotary year: ${rotaryYear}`)

        // Find Rotary year record
        const { data: yearRecord, error: yearError } = await supabase
          .from('rotary_years')
          .select('id')
          .eq('rotary_year', rotaryYear)
          .single()

        if (yearError) {
          logger.warn('Rotary year record not found:', rotaryYear, yearError)
        } else if (yearRecord) {
          logger.log('Found Rotary year record:', yearRecord.id)

          // Link speaker to Rotary year
          const { error: linkError } = await supabase
            .from('speakers')
            .update({ rotary_year_id: yearRecord.id })
            .eq('id', speakerId)

          if (linkError) {
            logger.error('Error linking speaker to Rotary year:', linkError)
          } else {
            logger.log('Speaker linked to Rotary year successfully')

            // Update statistics for this Rotary year
            await updateRotaryYearStats(yearRecord.id)
            logger.log('Rotary year statistics updated')
          }
        }
      } catch (err) {
        logger.error('Error in speaker auto-linking:', err)
      }
    }
  }

  const updateSpeakerPositions = async (columnSpeakers: Speaker[]) => {
    const updates = columnSpeakers.map((speaker, index) => ({
      ...speaker,
      position: index,
    }))

    const updatedSpeakers = speakers.map((speaker) => {
      const update = updates.find((u) => u.id === speaker.id)
      return update || speaker
    })
    setSpeakers(updatedSpeakers)

    for (const [index, speaker] of columnSpeakers.entries()) {
      await supabase
        .from('speakers')
        .update({ position: index, updated_by: 'current_user' })
        .eq('id', speaker.id)
    }
  }

  const handleAddSpeakerInColumn = (status: string) => {
    setDefaultStatus(status as Speaker['status'])
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setDefaultStatus(null)
  }

  // Filter configurations for List view
  const filterConfigs = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active Pipeline' },
        { value: 'pipeline', label: 'Pipeline Only (Ideas-Scheduled)' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'spoken', label: 'Spoken' },
        { value: 'dropped', label: 'Dropped' },
      ],
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value),
    },
    {
      id: 'rotarian',
      label: 'Rotarian Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Speakers' },
        { value: 'rotarians', label: 'Rotarians Only' },
        { value: 'non-rotarians', label: 'Non-Rotarians' },
      ],
      value: rotarianFilter,
      onChange: (value: string) => setRotarianFilter(value),
    },
    {
      id: 'scheduled',
      label: 'Scheduled Date',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Dates' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'past', label: 'Past' },
      ],
      value: scheduledFilter,
      onChange: (value: string) => setScheduledFilter(value),
    },
    {
      id: 'recommended',
      label: 'Recommendation',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Speakers' },
        { value: 'recommended', label: 'Recommended Only' },
      ],
      value: recommendedFilter,
      onChange: (value: string) => setRecommendedFilter(value),
    },
  ]

  const activeSpeaker = activeId
    ? speakers.find((s) => s.id === activeId)
    : null

  if (loading) {
    return (
      <AppLayout
        sectionName="SPEAKERS"
        showAddButton={false}
      >
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0067c8]"></div>
            </div>
            <div className="text-lg text-gray-600">Loading Georgetown Rotary Speakers...</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate summary statistics
  const getSpeakerStats = () => {
    const scheduled = speakers.filter(s => s.status === 'scheduled').length
    const pipeline = speakers.filter(s =>
      s.status === 'ideas' || s.status === 'approached' || s.status === 'agreed'
    ).length

    // Get current Rotary year (July 1 - June 30)
    const now = new Date()
    const currentYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
    const rotaryYearStart = new Date(currentYear, 6, 1) // July 1
    const rotaryYearEnd = new Date(currentYear + 1, 5, 30) // June 30

    const spokenThisYear = speakers.filter(s => {
      if (s.status !== 'spoken' || !s.scheduled_date) return false
      const speakDate = new Date(s.scheduled_date)
      return speakDate >= rotaryYearStart && speakDate <= rotaryYearEnd
    }).length

    // Speakers Bureau = recommended speakers (recommend=true AND status='spoken')
    const bureau = speakers.filter(s => s.recommend === true && s.status === 'spoken').length

    return { scheduled, pipeline, spokenThisYear, bureau }
  }

  const stats = getSpeakerStats()

  return (
    <AppLayout
      sectionName="SPEAKERS"
      onAddClick={handleAddSpeakerInColumn.bind(null, 'ideas')}
      addButtonLabel="Speaker"
      showAddButton={true}
      views={viewConfigs}
      activeView={viewMode}
      onViewChange={(view) => {
        // Track view mode change
        trackInteraction('view-mode-changed', 'kanban-board', view)

        if (view === 'calendar') {
          navigate('/calendar')
        } else {
          setViewMode(view as 'cards' | 'board' | 'spreadsheet' | 'calendar')
        }
      }}
      showFiltersToggle={true}
      filtersExpanded={filtersExpanded}
      onFiltersToggle={() => {
        const newState = !filtersExpanded
        trackInteraction('filters-toggled', 'kanban-board', newState ? 'expanded' : 'collapsed')
        setFiltersExpanded(newState)
      }}
      showFilters={filtersExpanded}
      searchPlaceholder="Search speakers..."
      searchValue={searchTerm}
      onSearchChange={(value) => {
        if (value.length > 0 && searchTerm.length === 0) {
          // Track when search is initiated
          trackInteraction('search-initiated', 'kanban-board', 'speakers')
        }
        setSearchTerm(value)
      }}
      filters={filterConfigs}
      resultCount={filteredSpeakers.length}
      totalCount={speakers.length}
      entityName="speakers"
    >
      {/* Summary Panel */}
      <div className="px-4 pt-6 pb-4">
        <div className="grid grid-cols-4 gap-3 bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0067c8]">{stats.scheduled}</div>
            <div className="text-xs text-gray-600">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f7a81b]">{stats.pipeline}</div>
            <div className="text-xs text-gray-600">Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.spokenThisYear}</div>
            <div className="text-xs text-gray-600">Spoken This Year</div>
          </div>
          <button
            onClick={() => {
              trackCTA('speakers-bureau', 'kanban-stats-panel', '/speakers-bureau')
              navigate('/speakers-bureau')
            }}
            className="text-center hover:bg-blue-50 rounded-lg transition-colors cursor-pointer p-2"
            title="View Speakers Bureau"
          >
            <div className="text-2xl font-bold text-[#0067c8] hover:text-[#004a8a]">{stats.bureau}</div>
            <div className="text-xs text-gray-600">Speakers Bureau</div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Horizontal Scroll Board - Industry Standard (Trello/Asana Pattern) */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pt-6 pb-4">
              <div className="flex gap-4 h-full snap-x snap-mandatory">
                {columns.map((column) => {
                  const columnSpeakers = speakers
                    .filter((speaker) => speaker.status === column.id)
                    .sort((a, b) => a.position - b.position)

                  return (
                    <div key={column.id} className="flex-none w-[85vw] md:w-80 snap-start">
                      <Column
                        id={column.id}
                        title={column.title}
                        color={column.color}
                        count={columnSpeakers.length}
                        onAddSpeaker={handleAddSpeakerInColumn}
                      >
                        <SortableContext
                          items={columnSpeakers.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {columnSpeakers.map((speaker) => (
                            <SpeakerCard key={speaker.id} speaker={speaker} />
                          ))}
                        </SortableContext>
                      </Column>
                    </div>
                  )
                })}
              </div>
            </div>

            <DragOverlay>
              {activeSpeaker && <SpeakerCard speaker={activeSpeaker} isDragging />}
            </DragOverlay>
          </DndContext>
        ) : viewMode === 'calendar' ? (
          /* Calendar View - Navigate to Calendar Page */
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <Calendar size={64} className="mx-auto text-[#0067c8] mb-4" />
              <p className="text-gray-600 mb-4">Redirecting to Calendar view...</p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View */
          <div className="overflow-auto p-4 md:p-8 h-full">
            {filteredSpeakers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  No speakers yet. Add your first speaker to get started.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedSpeakers.map((speaker) => (
                  <SpeakerCardExpanded
                    key={speaker.id}
                    speaker={speaker}
                    onView={setViewingSpeaker}
                    onEdit={setEditingSpeaker}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* List/Spreadsheet View */
          <div className="overflow-auto px-4 pt-6 pb-6 h-full">
            {/* Export CSV Button and Column Settings */}
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

            {/* Table */}
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
                            onClick={() => handleSort(col.key as keyof Speaker)}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            {col.label} {sortField === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedSpeakers.map((speaker) => (
                      <tr
                        key={speaker.id}
                        onClick={() => {
                          trackInteraction('speaker-row-clicked', 'kanban-list-view', speaker.id)
                          setViewingSpeaker(speaker)
                        }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {columnOrder
                          .filter((col) => col.visible)
                          .map((col) => {
                            // Render cell content based on column key
                            switch (col.key) {
                              case 'name':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0067c8] to-[#004080] text-white flex items-center justify-center text-xs font-semibold mr-3">
                                        {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{speaker.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                )
                              case 'organization':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {speaker.organization || '-'}
                                  </td>
                                )
                              case 'topic':
                                return (
                                  <td key={col.key} className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                    {speaker.topic || '-'}
                                  </td>
                                )
                              case 'status':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      speaker.status === 'ideas' ? 'bg-slate-100 text-slate-800' :
                                      speaker.status === 'approached' ? 'bg-blue-100 text-blue-800' :
                                      speaker.status === 'agreed' ? 'bg-emerald-100 text-emerald-800' :
                                      speaker.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                                      speaker.status === 'spoken' ? 'bg-gray-100 text-gray-800' :
                                      'bg-rose-100 text-rose-800'
                                    }`}>
                                      {speaker.status.toUpperCase()}
                                    </span>
                                  </td>
                                )
                              case 'email':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {speaker.email || '-'}
                                  </td>
                                )
                              case 'phone':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {speaker.phone || '-'}
                                  </td>
                                )
                              case 'scheduled_date':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {speaker.scheduled_date ? format(new Date(speaker.scheduled_date), 'MMM d, yyyy') : '-'}
                                  </td>
                                )
                              case 'is_rotarian':
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {speaker.is_rotarian ? (
                                      <BadgeCheck size={16} className="text-[#f7a81b]" />
                                    ) : '-'}
                                  </td>
                                )
                              default:
                                return (
                                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <SpeakerModal
          speaker={null}
          onClose={handleCloseAddModal}
          defaultStatus={defaultStatus || undefined}
        />
      )}

      {viewingSpeaker && (
        <SpeakerDetailModal
          speaker={viewingSpeaker}
          onClose={() => setViewingSpeaker(null)}
        />
      )}

      {editingSpeaker && (
        <SpeakerModal
          speaker={editingSpeaker}
          onClose={() => setEditingSpeaker(null)}
        />
      )}
    </AppLayout>
  )
}