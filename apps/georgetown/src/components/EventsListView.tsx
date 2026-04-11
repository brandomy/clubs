import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as CalendarIcon, MapPin, Mic, List, Download, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Speaker, Location } from '../types/database'
import { format, endOfMonth, addMonths, addYears } from 'date-fns'
import AppLayout from './AppLayout'
import EventViewModal from './EventViewModal'
import AddEventModal from './AddEventModal'
import { RSVPButton, RSVPModal, RSVPList, AttendanceChecker } from './meetings'
import { usePermissions } from '../hooks/usePermissions'
import ColumnSettings from './ColumnSettings'
import { useTableFilters } from '../hooks/useTableFilters'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Event {
  id: string
  date: string
  start_time?: string
  end_time?: string
  type: 'club_meeting' | 'club_assembly' | 'club_social' | 'service_project' | 'holiday' | 'observance'
  title: string
  description?: string
  agenda?: string
  location_id?: string
  location?: Location
}

interface EventWithSpeakers extends Event {
  speakers: Speaker[]
}

export default function EventsListView() {
  const navigate = useNavigate()
  const { isOfficer } = usePermissions()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [events, setEvents] = useState<EventWithSpeakers[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

  // RSVP & Attendance state
  const [selectedEventForRSVP, setSelectedEventForRSVP] = useState<Event | null>(null)
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null)
  const [showRSVPModal, setShowRSVPModal] = useState(false)
  const [showRSVPListModal, setShowRSVPListModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  // Filter, search and sorting state (via hook)
  const {
    showFilters, setShowFilters,
    showHolidays, setShowHolidays,
    selectedType, setSelectedType,
    selectedLocation, setSelectedLocation,
    searchTerm, setSearchTerm,
    sortField, sortDirection, handleSort,
    sortedEvents,
  } = useTableFilters(events)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    startTime: true,
    title: true,
    type: true,
    location: true,
    speakers: true,
    description: false,
  })

  // Column order and widths state with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('eventsListColumnOrder')
    return saved ? JSON.parse(saved) : ['date', 'startTime', 'title', 'type', 'location', 'speakers', 'description']
  })

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('eventsListColumnWidths')
    return saved ? JSON.parse(saved) : {}
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  // Calculate Rotary year start (July 1 of current Rotary year)
  const getRotaryYearStart = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    // If we're before July, the Rotary year started last July
    // If we're July or after, the Rotary year started this July
    if (currentMonth < 7) {
      return `${currentYear - 1}-07-01`
    } else {
      return `${currentYear}-07-01`
    }
  }

  useEffect(() => {
    // Set default date range to show upcoming events (today + 6 months)
    // This ensures users see future events by default, like the calendar
    const today = new Date()
    const sixMonthsLater = addMonths(today, 6)

    setStartDate(format(today, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(sixMonthsLater), 'yyyy-MM-dd'))

    // Fetch locations for filter dropdown
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching locations:', error)
      return
    }

    setLocations(data || [])
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchEvents()
    }
  }, [startDate, endDate])


  // Save column order to localStorage
  useEffect(() => {
    localStorage.setItem('eventsListColumnOrder', JSON.stringify(columnOrder))
  }, [columnOrder])

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('eventsListColumnWidths', JSON.stringify(columnWidths))
  }, [columnWidths])

  // DND sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchEvents = async () => {
    // Only show loading spinner on initial page load, not on filter changes
    if (isInitialLoad) {
      setLoading(true)
    }

    // Fetch events with locations
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        location:locations(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (eventsError) {
      logger.error('Error fetching events:', eventsError)
      setLoading(false)
      setIsInitialLoad(false)
      return
    }

    // Fetch speakers for the date range (any status with a scheduled_date)
    const { data: speakersData, error: speakersError } = await supabase
      .from('speakers')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .not('scheduled_date', 'is', null)
      .order('scheduled_date', { ascending: true })

    if (speakersError) {
      logger.error('Error fetching speakers:', speakersError)
      setLoading(false)
      setIsInitialLoad(false)
      return
    }

    // Combine events with their speakers
    const eventsWithSpeakers: EventWithSpeakers[] = (eventsData || []).map(event => ({
      ...event,
      speakers: (speakersData || []).filter(speaker => speaker.scheduled_date === event.date)
    }))

    setEvents(eventsWithSpeakers)
    setLoading(false)
    setIsInitialLoad(false)
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }))
  }

  // Handle column reordering via drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((columns) => {
        const oldIndex = columns.indexOf(active.id as string)
        const newIndex = columns.indexOf(over.id as string)
        return arrayMove(columns, oldIndex, newIndex)
      })
    }
  }

  // Handle column resize start
  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setResizingColumn(column)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[column] || 150)
  }

  // Handle column resize move
  useEffect(() => {
    if (!resizingColumn) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + deltaX) // Minimum 80px width
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  // Get column width style
  const getColumnWidth = (column: string) => {
    return columnWidths[column] ? `${columnWidths[column]}px` : undefined
  }

  // Column labels for display
  const columnLabels: Record<string, string> = {
    date: 'Date',
    startTime: 'Start Time',
    title: 'Title',
    type: 'Type',
    location: 'Location',
    speakers: 'Speaker(s)',
    description: 'Description',
  }

  const exportToCSV = () => {
    // Use column order to maintain consistent CSV export
    const headers: string[] = []
    const columnGetters: Record<string, (event: EventWithSpeakers) => string> = {
      date: (event) => formatDisplayDate(event.date),
      startTime: (event) => formatTime(event.start_time || ''),
      title: (event) => event.title,
      type: (event) => event.type,
      location: (event) => event.location?.name || '',
      speakers: (event) => event.speakers.map(s => s.name).join('; '),
      description: (event) => event.description || '',
    }

    // Build headers based on column order and visibility
    columnOrder.forEach(column => {
      if (visibleColumns[column as keyof typeof visibleColumns]) {
        headers.push(columnLabels[column])
      }
    })

    // Build rows based on column order and visibility
    const rows = sortedEvents.map(event => {
      const row: string[] = []
      columnOrder.forEach(column => {
        if (visibleColumns[column as keyof typeof visibleColumns]) {
          row.push(columnGetters[column](event))
        }
      })
      return row
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendar-events-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetFilters = () => {
    const rotaryYearStart = getRotaryYearStart()
    const rotaryYearStartDate = new Date(rotaryYearStart)
    const fiveMonthsLater = addMonths(rotaryYearStartDate, 5)

    setStartDate(rotaryYearStart)
    setEndDate(format(endOfMonth(fiveMonthsLater), 'yyyy-MM-dd'))
    setShowHolidays(false)
    setSelectedType('all')
    setSelectedLocation('all')
  }

  const handleClearFilters = () => {
    handleResetFilters()
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false)
    setSelectedEvent(null)
  }

  const handleNext3Months = () => {
    const today = new Date()
    const threeMonthsLater = addMonths(today, 3)
    setStartDate(format(today, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(threeMonthsLater), 'yyyy-MM-dd'))
  }

  const handleNext6Months = () => {
    const today = new Date()
    const sixMonthsLater = addMonths(today, 6)
    setStartDate(format(today, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(sixMonthsLater), 'yyyy-MM-dd'))
  }

  const handleNext1Year = () => {
    const today = new Date()
    const oneYearLater = addYears(today, 1)
    setStartDate(format(today, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(oneYearLater), 'yyyy-MM-dd'))
  }

  // Navigate backward by 1 month
  const handlePreviousMonth = () => {
    const currentStart = new Date(startDate)
    const currentEnd = new Date(endDate)
    const newStart = addMonths(currentStart, -1)
    const newEnd = addMonths(currentEnd, -1)
    setStartDate(format(newStart, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(newEnd), 'yyyy-MM-dd'))
  }

  // Navigate forward by 1 month
  const handleNextMonth = () => {
    const currentStart = new Date(startDate)
    const currentEnd = new Date(endDate)
    const newStart = addMonths(currentStart, 1)
    const newEnd = addMonths(currentEnd, 1)
    setStartDate(format(newStart, 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(newEnd), 'yyyy-MM-dd'))
  }

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'EEE, MMM d, yyyy')
  }

  // Format time to HH:mm (remove seconds)
  const formatTime = (timeString: string) => {
    if (!timeString) return '-'
    // Time is in format HH:mm:ss, we want HH:mm
    return timeString.substring(0, 5)
  }

  const getEventTypeBadge = (type: Event['type']) => {
    const styles = {
      club_meeting: 'bg-[#0067c8] text-white',
      club_assembly: 'bg-green-600 text-white',
      board_meeting: 'bg-gray-700 text-white',
      committee_meeting: 'bg-indigo-600 text-white',
      club_social: 'bg-purple-500 text-white',
      service_project: 'bg-[#00adbb] text-white',
      observance: 'bg-[#f7a81b] text-white',
      holiday: 'bg-[#d41367] text-white'
    }

    const labels = {
      club_meeting: 'Meeting',
      club_assembly: 'Assembly',
      board_meeting: 'Board Meeting',
      committee_meeting: 'Committee',
      club_social: 'Social',
      service_project: 'Service',
      observance: 'Observance',
      holiday: 'Holiday'
    }

    return (
      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${styles[type]}`}>
        {labels[type]}
      </span>
    )
  }

  // Sortable Header Component for drag and drop
  interface SortableHeaderProps {
    column: string
    label: string
    isSortable: boolean
    isLastColumn: boolean
  }

  const SortableHeader = ({ column, label, isSortable, isLastColumn }: SortableHeaderProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      width: getColumnWidth(column),
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <th
        ref={setNodeRef}
        style={style}
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative group"
        {...attributes}
      >
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-gray-200 rounded"
          >
            <GripVertical size={14} className="text-gray-400" />
          </div>
          <div
            onClick={() => isSortable && handleSort(column as 'date' | 'type' | 'title' | 'location')}
            className="flex-1"
          >
            {label} {isSortable && sortField === column && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        </div>

        {/* Resize Handle */}
        {!isLastColumn && (
          <div
            onMouseDown={(e) => handleResizeStart(column, e)}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
            style={{ touchAction: 'none' }}
          />
        )}
      </th>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0067c8]"></div>
          </div>
          <div className="text-lg text-gray-600">Loading events...</div>
        </div>
      </div>
    )
  }

  const handleViewChange = (view: string) => {
    if (view === 'calendar') {
      navigate('/calendar')
    } else {
      setViewMode(view as 'calendar' | 'list')
    }
  }

  return (
    <AppLayout
      sectionName="CALENDAR"
      onAddClick={() => setIsAddEventModalOpen(true)}
      addButtonLabel="+ Event"
      showAddButton={true}
      views={[
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'list', label: 'List', icon: List },
      ]}
      activeView={viewMode}
      onViewChange={handleViewChange}
      showFilters={false}
      showFiltersToggle={true}
      filtersExpanded={showFilters}
      onFiltersToggle={() => setShowFilters(!showFilters)}
      searchPlaceholder="Search events, speakers, locations..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      resultCount={sortedEvents.length}
      totalCount={events.length}
      entityName="events"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Filters Card - Only show when expanded */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="club_meeting">Club Meeting</option>
                    <option value="club_assembly">Club Assembly</option>
                    <option value="club_social">Club Social</option>
                    <option value="board_meeting">Board Meeting</option>
                    <option value="committee_meeting">Committee Meeting</option>
                    <option value="service_project">Service Project</option>
                    <option value="holiday">Holiday</option>
                    <option value="observance">Observance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      onChange={handleNext3Months}
                      className="w-4 h-4 text-[#0067c8] border-gray-300 focus:ring-[#0067c8]"
                    />
                    <span className="text-sm font-medium text-gray-700">Next 3 Months</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      onChange={handleNext6Months}
                      className="w-4 h-4 text-[#0067c8] border-gray-300 focus:ring-[#0067c8]"
                    />
                    <span className="text-sm font-medium text-gray-700">Next 6 Months</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dateRange"
                      onChange={handleNext1Year}
                      className="w-4 h-4 text-[#0067c8] border-gray-300 focus:ring-[#0067c8]"
                    />
                    <span className="text-sm font-medium text-gray-700">Next 1 Year</span>
                  </label>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-1.5 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] transition-colors text-sm font-semibold"
                  >
                    Clear All Filters
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHolidays}
                    onChange={(e) => setShowHolidays(e.target.checked)}
                    className="w-4 h-4 text-[#0067c8] border-gray-300 rounded focus:ring-[#0067c8]"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Holidays</span>
                </label>
              </div>
            </div>
        )}

        {/* Date Range and Controls */}
        {sortedEvents.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3">
            {/* Date Range Display with Navigation - Left (Most Important) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 text-[#0067c8] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="text-lg md:text-xl text-[#0067c8] font-bold">
                {format(new Date(startDate), 'MMM yyyy')} to {format(new Date(endDate), 'MMM yyyy')}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 text-[#0067c8] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Export CSV Button and Column Settings - Right */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#f7a81b] text-white rounded-lg hover:bg-[#e09916] transition-colors font-medium"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>

              <ColumnSettings
                visibleColumns={visibleColumns}
                columnLabels={columnLabels}
                toggleColumn={toggleColumn}
              />
            </div>
          </div>
        )}

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm mt-1">Try adjusting your date range{!showHolidays && ' or enable "Show Holidays"'}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        <tr>
                          {columnOrder.map((column, index) => {
                            // Only render if column is visible
                            if (!visibleColumns[column as keyof typeof visibleColumns]) return null

                            const isSortable = ['date', 'type', 'title', 'location', 'startTime'].includes(column)
                            const visibleColumns_array = columnOrder.filter(col => visibleColumns[col as keyof typeof visibleColumns])
                            const isLastColumn = index === visibleColumns_array.length - 1

                            return (
                              <SortableHeader
                                key={column}
                                column={column}
                                label={columnLabels[column]}
                                isSortable={isSortable}
                                isLastColumn={isLastColumn}
                              />
                            )
                          })}
                        </tr>
                      </SortableContext>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedEvents.map((event) => (
                        <tr
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {columnOrder.map((column) => {
                            // Only render if column is visible
                            if (!visibleColumns[column as keyof typeof visibleColumns]) return null

                            // Render cell based on column type
                            if (column === 'date') {
                              return (
                                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ width: getColumnWidth(column) }}>
                                  {formatDisplayDate(event.date)}
                                </td>
                              )
                            }
                            if (column === 'startTime') {
                              return (
                                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" style={{ width: getColumnWidth(column) }}>
                                  {formatTime(event.start_time || '')}
                                </td>
                              )
                            }
                            if (column === 'title') {
                              return (
                                <td key={column} className="px-6 py-4 text-sm text-gray-900" style={{ width: getColumnWidth(column) }}>
                                  {event.title}
                                </td>
                              )
                            }
                            if (column === 'type') {
                              return (
                                <td key={column} className="px-6 py-4 whitespace-nowrap" style={{ width: getColumnWidth(column) }}>
                                  {getEventTypeBadge(event.type)}
                                </td>
                              )
                            }
                            if (column === 'location') {
                              return (
                                <td key={column} className="px-6 py-4" style={{ width: getColumnWidth(column) }}>
                                  {event.location ? (
                                    <div className="flex items-start gap-2">
                                      <MapPin size={16} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900">
                                          {event.location.name}
                                        </div>
                                        {event.location.address && (
                                          <div className="text-xs text-gray-500">
                                            {event.location.address}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">No location</span>
                                  )}
                                </td>
                              )
                            }
                            if (column === 'speakers') {
                              return (
                                <td key={column} className="px-6 py-4" style={{ width: getColumnWidth(column) }}>
                                  {event.speakers.length > 0 ? (
                                    <div className="space-y-2">
                                      {event.speakers.map((speaker) => (
                                        <div key={speaker.id} className="flex items-start gap-2">
                                          <Mic size={16} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900">
                                              {speaker.name}
                                            </div>
                                            {speaker.organization && (
                                              <div className="text-xs text-gray-500">
                                                {speaker.organization}
                                              </div>
                                            )}
                                            {speaker.topic && (
                                              <div className="text-xs text-gray-600 italic mt-0.5">
                                                "{speaker.topic}"
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">No speaker scheduled</span>
                                  )}
                                </td>
                              )
                            }
                            if (column === 'description') {
                              return (
                                <td key={column} className="px-6 py-4 text-sm text-gray-500" style={{ width: getColumnWidth(column) }}>
                                  <div className="line-clamp-2">
                                    {event.description || '-'}
                                  </div>
                                </td>
                              )
                            }
                            return null
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DndContext>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatDisplayDate(event.date)}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{event.title}</div>
                      </div>
                      {getEventTypeBadge(event.type)}
                    </div>

                    {event.location && (
                      <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded">
                        <MapPin size={14} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {event.location.name}
                          </div>
                          {event.location.address && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {event.location.address.split(',')[0]}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {event.speakers.length > 0 && (
                      <div className="space-y-2">
                        {event.speakers.map((speaker) => (
                          <div key={speaker.id} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                            <Mic size={14} className="text-[#0067c8] mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {speaker.name}
                              </div>
                              {speaker.organization && (
                                <div className="text-xs text-gray-600">
                                  {speaker.organization}
                                </div>
                              )}
                              {speaker.topic && (
                                <div className="text-xs text-gray-600 italic mt-0.5">
                                  "{speaker.topic}"
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!event.location && event.speakers.length === 0 && (
                      <div className="text-xs text-gray-400 italic">
                        No location or speaker scheduled
                      </div>
                    )}

                    {/* RSVP Section - All Meeting Types */}
                    {['club_meeting', 'club_assembly', 'club_social', 'board_meeting', 'committee_meeting', 'service_project'].includes(event.type) && (
                      <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <RSVPButton
                          eventId={event.id}
                          onDetailsClick={() => {
                            setSelectedEventForRSVP(event)
                            setShowRSVPModal(true)
                          }}
                        />

                        {/* Officer Actions */}
                        {isOfficer && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEventForRSVP(event)
                                setShowRSVPListModal(true)
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                            >
                              View RSVPs
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEventForAttendance(event)
                                setShowAttendanceModal(true)
                              }}
                              className="text-sm text-green-600 hover:text-green-700 font-medium underline"
                            >
                              Take Attendance
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Summary Stats */}
        {sortedEvents.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-[#0067c8]">{sortedEvents.length}</div>
              <div className="text-xs text-gray-600 mt-1">Total Events</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-[#0067c8]">
                {sortedEvents.filter(e => e.type === 'club_meeting').length}
              </div>
              <div className="text-xs text-gray-600 mt-1">Club Meetings</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-[#0067c8]">
                {sortedEvents.reduce((acc, e) => acc + e.speakers.length, 0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Speakers</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-[#0067c8]">
                {sortedEvents.filter(e => e.location).length}
              </div>
              <div className="text-xs text-gray-600 mt-1">With Location</div>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isAddEventModalOpen && (
        <AddEventModal
          onClose={() => setIsAddEventModalOpen(false)}
          onEventAdded={fetchEvents}
        />
      )}

      {/* Event View Modal */}
      {isEventModalOpen && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={handleCloseEventModal}
          onEventUpdated={fetchEvents}
          onOpenRSVP={() => {
            setSelectedEventForRSVP(selectedEvent)
            setIsEventModalOpen(false)
            setShowRSVPModal(true)
          }}
        />
      )}

      {/* RSVP Modal */}
      {showRSVPModal && selectedEventForRSVP && (
        <RSVPModal
          eventId={selectedEventForRSVP.id}
          eventType={selectedEventForRSVP.type}
          eventDate={selectedEventForRSVP.date}
          isOpen={showRSVPModal}
          onClose={() => {
            setShowRSVPModal(false)
            setSelectedEventForRSVP(null)
          }}
        />
      )}

      {/* RSVP List Modal (Officers) */}
      {showRSVPListModal && selectedEventForRSVP && (
        <RSVPList
          eventId={selectedEventForRSVP.id}
          isOpen={showRSVPListModal}
          onClose={() => {
            setShowRSVPListModal(false)
            setSelectedEventForRSVP(null)
          }}
        />
      )}

      {/* Attendance Checker Modal (Officers) */}
      {showAttendanceModal && selectedEventForAttendance && (
        <AttendanceChecker
          eventId={selectedEventForAttendance.id}
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false)
            setSelectedEventForAttendance(null)
          }}
        />
      )}
    </AppLayout>
  )
}
