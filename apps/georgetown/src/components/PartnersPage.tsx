import { logger } from '../utils/logger'
import { useState, useEffect, useRef } from 'react'
import { LayoutGrid, List as ListIcon, Download, Settings, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Partner } from '../types/database'
import AppLayout from './AppLayout'
import PartnerModal from './PartnerModal'
import PartnerDetailModal from './PartnerDetailModal'
import PartnerCard from './PartnerCard'
import { getPartnerTypeColor } from '../utils/partnerHelpers'
import { format } from 'date-fns'

export default function PartnersPage() {
  // View state
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Data state
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<keyof Partner>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Column visibility and order state
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columnOrder, setColumnOrder] = useState([
    { key: 'name', label: 'Name', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'contact_name', label: 'Contact Person', visible: true },
    { key: 'contact_email', label: 'Email', visible: true },
    { key: 'contact_phone', label: 'Phone', visible: false },
    { key: 'website', label: 'Website', visible: false },
    { key: 'relationship_since', label: 'Partner Since', visible: true },
  ])
  // Drag-and-drop state for robust reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const columnSettingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPartners()
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

  const loadPartners = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('gt_partners')
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

  const handleSort = (field: keyof Partner) => {
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    // Only update visual indicator, don't reorder yet (performance optimization)
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
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

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  // Column configuration for CSV export
  const columnConfig = [
    { key: 'name', header: 'Name', getValue: (p: Partner) => p.name },
    { key: 'type', header: 'Type', getValue: (p: Partner) => p.type },
    { key: 'status', header: 'Status', getValue: (p: Partner) => p.status || 'Active' },
    { key: 'contact_name', header: 'Contact Person', getValue: (p: Partner) => p.contact_name || '' },
    { key: 'contact_email', header: 'Email', getValue: (p: Partner) => p.contact_email || '' },
    { key: 'contact_phone', header: 'Phone', getValue: (p: Partner) => p.contact_phone || '' },
    { key: 'website', header: 'Website', getValue: (p: Partner) => p.website || '' },
    { key: 'relationship_since', header: 'Partner Since', getValue: (p: Partner) => p.relationship_since || '' },
  ]

  const exportToCSV = () => {
    // Only export visible columns in the user's chosen order
    const visibleCols = columnOrder.filter(col => col.visible)
    const headers = visibleCols.map(col => col.label)

    const rows = sortedPartners.map(p =>
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
    a.download = `partners-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    // Type filter
    if (typeFilter !== 'all' && partner.type !== typeFilter) return false

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Active' && partner.status !== 'Active') return false
      if (statusFilter === 'Inactive' && partner.status !== 'Inactive') return false
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        partner.name.toLowerCase().includes(searchLower) ||
        partner.contact_name?.toLowerCase().includes(searchLower) ||
        partner.contact_email?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Sort partners
  const sortedPartners = [...filteredPartners].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue == null) return 1
    if (bValue == null) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Get unique types for filter dropdown
  const uniqueTypes = ['all', ...Array.from(new Set(partners.map(p => p.type))).sort()]

  return (
    <AppLayout
      sectionName="PARTNERS"
      onAddClick={handleAddPartner}
      addButtonLabel="+ Partner"
      showAddButton={true}
      views={[
        { id: 'cards', label: 'Cards', icon: LayoutGrid },
        { id: 'list', label: 'List', icon: ListIcon },
      ]}
      activeView={viewMode}
      onViewChange={(view) => setViewMode(view as 'cards' | 'list')}
      showFiltersToggle={true}
      filtersExpanded={filtersExpanded}
      onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
      showFilters={filtersExpanded}
      searchPlaceholder="Search partners..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[
        {
          id: 'type',
          label: 'Type',
          type: 'select',
          options: uniqueTypes.map(type => ({
            value: type,
            label: type === 'all' ? 'All Types' : type,
          })),
          value: typeFilter,
          onChange: setTypeFilter,
        },
        {
          id: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ],
          value: statusFilter,
          onChange: setStatusFilter,
        },
      ]}
      resultCount={filteredPartners.length}
      totalCount={partners.length}
      entityName="partners"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0067c8]"></div>
            <p className="mt-4 text-gray-600">Loading partners...</p>
          </div>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No partners match your filters'
              : 'No partners yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Start by adding your first partner organization.'}
          </p>
          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setStatusFilter('all')
              }}
              className="text-[#0067c8] hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="px-4 pt-6 pb-6">
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
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={handleDragLeave}
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
                          onClick={() => handleSort(col.key as keyof Partner)}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          {col.label} {sortField === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      onClick={() => handleViewPartner(partner)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {columnOrder
                        .filter((col) => col.visible)
                        .map((col) => {
                          // Render cell content based on column key
                          switch (col.key) {
                            case 'name':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {partner.name}
                                </td>
                              )
                            case 'type':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className="inline-flex px-2 py-1 text-xs font-semibold text-white rounded"
                                    style={{ backgroundColor: getPartnerTypeColor(partner.type) }}
                                  >
                                    {partner.type}
                                  </span>
                                </td>
                              )
                            case 'status':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      partner.status === 'Inactive'
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {partner.status || 'Active'}
                                  </span>
                                </td>
                              )
                            case 'contact_name':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.contact_name || '-'}
                                </td>
                              )
                            case 'contact_email':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.contact_email || '-'}
                                </td>
                              )
                            case 'contact_phone':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.contact_phone || '-'}
                                </td>
                              )
                            case 'website':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.website ? (
                                    <a
                                      href={partner.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#0067c8] hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {partner.website}
                                    </a>
                                  ) : '-'}
                                </td>
                              )
                            case 'relationship_since':
                              return (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {partner.relationship_since ? format(new Date(partner.relationship_since), 'MMM yyyy') : '-'}
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
        </div>
      ) : (
        // Cards View
        <div className="px-4 pt-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onClick={handleViewPartner}
              onEdit={handleEditPartner}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <PartnerModal
          partner={selectedPartner}
          onClose={handleModalClose}
        />
      )}

      {isViewModalOpen && selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          onClose={handleModalClose}
          onEdit={() => handleEditPartner(selectedPartner)}
        />
      )}
    </AppLayout>
  )
}
