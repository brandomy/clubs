import { useState } from 'react'

interface EventBase {
  type: string
  title: string
  description?: string
  location_id?: string
  location?: { name: string }
  speakers: Array<{
    id: string
    name: string
    organization?: string
    topic: string
  }>
}

type SortField = 'date' | 'type' | 'title' | 'location'

interface UseTableFiltersResult<T extends EventBase & { date: string }> {
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  showHolidays: boolean
  setShowHolidays: (v: boolean) => void
  selectedType: string
  setSelectedType: (v: string) => void
  selectedLocation: string
  setSelectedLocation: (v: string) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  handleSort: (field: SortField) => void
  filteredEvents: T[]
  sortedEvents: T[]
}

export function useTableFilters<T extends EventBase & { date: string }>(
  events: T[]
): UseTableFiltersResult<T> {
  const [showFilters, setShowFilters] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredEvents = events
    .filter(event => showHolidays || event.type !== 'holiday')
    .filter(event => selectedType === 'all' || event.type === selectedType)
    .filter(event => selectedLocation === 'all' || event.location_id === selectedLocation)
    .filter(event => {
      if (!searchTerm) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.name.toLowerCase().includes(searchLower) ||
        event.speakers.some(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.organization?.toLowerCase().includes(searchLower) ||
          s.topic.toLowerCase().includes(searchLower)
        )
      )
    })

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let comparison = 0
    if (sortField === 'date') {
      comparison = a.date.localeCompare(b.date)
    } else if (sortField === 'type') {
      comparison = a.type.localeCompare(b.type)
    } else if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else if (sortField === 'location') {
      const aLocation = a.location?.name || ''
      const bLocation = b.location?.name || ''
      comparison = aLocation.localeCompare(bLocation)
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  return {
    showFilters,
    setShowFilters,
    showHolidays,
    setShowHolidays,
    selectedType,
    setSelectedType,
    selectedLocation,
    setSelectedLocation,
    searchTerm,
    setSearchTerm,
    sortField,
    sortDirection,
    handleSort,
    filteredEvents,
    sortedEvents,
  }
}
