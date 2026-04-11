import { logger } from '../utils/logger'
import { useState, useEffect } from 'react'
import { Plus, Menu, X, Building2, Download, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Partner } from '../types/database'
import { format } from 'date-fns'
import PartnerModal from './PartnerModal'
import PartnerDetailModal from './PartnerDetailModal'

// Partner type color mapping
const getPartnerTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'Rotary Club': '#0067c8',      // Rotary Azure
    'Foundation': '#7c3aed',       // Purple
    'NGO': '#059669',              // Green
    'Corporate': '#dc2626',        // Red
    'Government': '#ea580c',       // Orange
  }
  return colorMap[type] || '#6b7280'
}

// Partner type icon mapping
const getPartnerTypeIcon = (type: string) => {
  switch (type) {
    case 'Rotary Club': return '⚙️'
    case 'Foundation': return '🏛️'
    case 'NGO': return '🤝'
    case 'Corporate': return '🏢'
    case 'Government': return '🏛️'
    default: return '🤝'
  }
}

export default function PartnersPage() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof Partner>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        logger.error('Error loading partners:', error)
        setPartners([])
      } else {
        setPartners(data || [])
      }
    } catch (error) {
      logger.error('Error loading partners:', error)
      setPartners([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPartner = () => {
    setSelectedPartner(null)
    setIsAddModalOpen(true)
  }

  const handleViewPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsViewModalOpen(true)
  }

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsViewModalOpen(false)
    setIsAddModalOpen(true)
  }

  const handleModalClose = () => {
    setIsAddModalOpen(false)
    setIsViewModalOpen(false)
    setSelectedPartner(null)
    loadPartners()
  }

  const filteredPartners = partners.filter((partner) => {
    if (typeFilter !== 'all' && partner.type !== typeFilter) return false
    if (searchQuery && !partner.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue == null) return 1
    if (bValue == null) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Contact Info', 'Created Date']
    const rows = sortedPartners.map(p => [
      p.name,
      p.type,
      p.contact_info || '',
      format(new Date(p.created_at), 'MMM d, yyyy')
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `partners-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueTypes = Array.from(new Set(partners.map(p => p.type))).sort()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-12">Loading partners...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Professional Header - Mobile Optimized */}
      <header className="bg-[#0067c8] shadow-md relative">
        <div className="px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Building2 className="h-6 md:h-7 w-6 md:w-7 text-white" />
              <div>
                <p className="text-xs text-blue-200 font-medium uppercase tracking-wide hidden md:block"
                   style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Georgetown <span className="whitespace-nowrap">Rotary Club</span>
                </p>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}>
                  PARTNERS
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-3 lg:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/20">
                Speakers
              </button>

              <button
                onClick={() => navigate('/service-projects')}
                className="px-3 lg:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/20">
                Projects
              </button>

              {/* View Mode Buttons */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'cards' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}>
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}>
                  List
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 lg:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/20">
                Filter
              </button>

              <button
                onClick={() => navigate('/members')}
                className="px-3 lg:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/20">
                Members
              </button>

              {viewMode === 'list' && (
                <button
                  onClick={exportToCSV}
                  className="px-3 lg:px-5 py-2.5 bg-[#f7a81b] hover:bg-[#f4b000] text-white rounded-lg transition-all duration-200 font-medium text-sm border border-[#f7a81b] flex items-center gap-2">
                  <Download size={16} />
                  Export CSV
                </button>
              )}

              <div className="w-px h-8 bg-white/20 mx-1 lg:mx-2"></div>

              <button
                onClick={handleAddPartner}
                className="p-2.5 bg-[#f7a81b] hover:bg-[#f4b000] text-[#0067c8] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-[#f7a81b]"
                aria-label="Add Partner"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={handleAddPartner}
                className="p-2.5 bg-[#f7a81b] text-[#0067c8] rounded-lg shadow-md"
                aria-label="Add Partner"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-white rounded-lg"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#004a8a] shadow-lg z-50">
            <div className="px-4 py-2 space-y-2">
              <button
                onClick={() => {
                  navigate('/')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                Speakers
              </button>
              <button
                onClick={() => {
                  navigate('/service-projects')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                Projects
              </button>
              <button
                onClick={() => {
                  setViewMode('cards')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                Cards View
              </button>
              <button
                onClick={() => {
                  setViewMode('list')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                List View
              </button>
              <button
                onClick={() => {
                  setShowFilters(!showFilters)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                Filter
              </button>
              <button
                onClick={() => {
                  navigate('/members')
                  setIsMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-white/10 rounded-lg"
              >
                Members
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4">

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search partners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0067c8] focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setTypeFilter('all')
                    setSearchQuery('')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {sortedPartners.length} of {partners.length} partners
        </div>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <>
            {sortedPartners.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  {typeFilter === 'all' && !searchQuery
                    ? 'No partners yet. Add your first partner to get started.'
                    : 'No partners match your filters.'}
                </p>
                {(typeFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setTypeFilter('all')
                      setSearchQuery('')
                    }}
                    className="text-[#0067c8] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    onClick={() => handleViewPartner(partner)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow group relative"
                  >
                    {/* Edit Icon - Top Right - Always Visible */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditPartner(partner)
                      }}
                      className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                      aria-label="Edit partner"
                      title="Edit partner"
                    >
                      <Pencil size={16} className="text-gray-400 hover:text-[#0067c8] transition-colors" />
                    </button>

                    {/* Type Badge */}
                    <div className="mb-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getPartnerTypeColor(partner.type) }}
                      >
                        <span>{getPartnerTypeIcon(partner.type)}</span>
                        {partner.type}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#0067c8] transition-colors">
                      {partner.name}
                    </h3>

                    {/* Contact Info */}
                    {partner.contact_info && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {partner.contact_info}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                      <span>Added {format(new Date(partner.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
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
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('type')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPartners.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No partners found.
                      </td>
                    </tr>
                  ) : (
                    sortedPartners.map((partner) => (
                      <tr
                        key={partner.id}
                        onClick={() => handleViewPartner(partner)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white rounded"
                            style={{ backgroundColor: getPartnerTypeColor(partner.type) }}
                          >
                            <span>{getPartnerTypeIcon(partner.type)}</span>
                            {partner.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {partner.contact_info || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(partner.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Partner Modal */}
      {isAddModalOpen && (
        <PartnerModal
          partner={selectedPartner}
          onClose={handleModalClose}
        />
      )}

      {/* View Partner Modal */}
      {isViewModalOpen && selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          onClose={handleModalClose}
          onEdit={() => handleEditPartner(selectedPartner)}
        />
      )}
    </div>
  )
}
