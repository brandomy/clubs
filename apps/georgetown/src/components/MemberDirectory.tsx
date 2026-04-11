import { logger } from '../utils/logger'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Member, MemberAttendanceStats } from '../types/database'
import { LayoutGrid, List, Download, Users, Settings, X, AlertTriangle } from 'lucide-react'
import MemberCard from './MemberCard'
import MemberModal from './MemberModal'
import MemberDetailModal from './MemberDetailModal'
import AppLayout from './AppLayout'
import { AttendanceDashboard } from './meetings'
import { format } from 'date-fns'

export default function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('active-honorary') // Default shows Active + Honorary
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [sortField, setSortField] = useState<keyof Member>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const columnSettingsRef = useRef<HTMLDivElement>(null)

  // Attendance state
  const [attendanceStats, setAttendanceStats] = useState<Record<string, MemberAttendanceStats>>({})
  const [showAttendanceDashboard, setShowAttendanceDashboard] = useState(false)
  const [selectedMemberForAttendance, setSelectedMemberForAttendance] = useState<Member | null>(null)

  // Column visibility and order state - default shows essential columns
  const [columnOrder, setColumnOrder] = useState([
    { key: 'name', label: 'Name', visible: true },
    { key: 'rotary_id', label: 'Rotary ID', visible: true },
    { key: 'roles', label: 'Roles', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'attendance', label: 'Attendance %', visible: true },
    { key: 'classification', label: 'Classification', visible: false },
    { key: 'gender', label: 'Gender', visible: false },
    { key: 'birthday', label: 'Birthday', visible: false },
    { key: 'member_since', label: 'Member Since', visible: false },
    { key: 'mobile', label: 'Mobile', visible: false },
    { key: 'email', label: 'Email', visible: true },
  ])
  // Drag-and-drop state for robust reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchMembers()
    fetchAttendanceStats()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, searchTerm, filterRole, filterType])

  // Close column settings when clicking outside
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

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('gt_members')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        logger.error('Error fetching members:', error)
        return
      }

      setMembers(data || [])
    } catch (error) {
      logger.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceStats = async () => {
    try {
      const { data, error } = await supabase
        .from('gt_member_attendance_stats')
        .select('*')

      if (error) {
        logger.error('Error fetching attendance stats:', error)
        return
      }

      // Convert array to object keyed by member_id for easy lookup
      const statsMap: Record<string, MemberAttendanceStats> = {}
      data?.forEach(stat => {
        statsMap[stat.member_id] = stat
      })
      setAttendanceStats(statsMap)
    } catch (error) {
      logger.error('Error:', error)
    }
  }

  const filterMembers = () => {
    let filtered = [...members]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(term) ||
        (member.roles && member.roles.some(role => role.toLowerCase().includes(term))) ||
        (member.classification && member.classification.toLowerCase().includes(term)) ||
        (member.email && member.email.toLowerCase().includes(term))
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      const officerRoles = ['President', 'President-Elect', 'Immediate Past President', 'Vice President', 'Secretary', 'Treasurer', 'Sergeant-at-Arms']
      const committeeChairRoles = ['Club Service Chair', 'Foundation Chair', 'International Service Chair', 'Membership Chair', 'Public Image Chair', 'Service Projects Chair', 'Youth Service Chair']

      filtered = filtered.filter(member => {
        const memberRoles = member.roles || []

        if (filterRole === 'officers-and-chairs') {
          return memberRoles.some(role =>
            officerRoles.includes(role) || committeeChairRoles.includes(role)
          )
        }
        if (filterRole === 'officers') {
          return memberRoles.some(role => officerRoles.includes(role))
        }
        if (filterRole === 'chairs') {
          return memberRoles.some(role => committeeChairRoles.includes(role))
        }
        if (filterRole === 'members') {
          return memberRoles.length === 0 || memberRoles.includes('Member') || memberRoles.includes('Director')
        }
        return memberRoles.includes(filterRole)
      })
    }

    // Member type filter
    if (filterType === 'active-honorary') {
      // Default: Show Active and Honorary, exclude Former Members
      filtered = filtered.filter(member =>
        member.type === 'Active' || member.type === 'Honorary' || !member.type
      )
    } else if (filterType === 'Active') {
      filtered = filtered.filter(member => member.type === 'Active' || (!member.type && member.active))
    } else if (filterType === 'Honorary') {
      filtered = filtered.filter(member => member.type === 'Honorary' || (!member.type && !member.active))
    } else if (filterType === 'Former Member') {
      filtered = filtered.filter(member => member.type === 'Former Member')
    }
    // 'all' shows everything, no filtering needed

    setFilteredMembers(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterRole('all')
    setFilterType('active-honorary')
    setFiltersExpanded(false)
  }

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (aValue == null) return 1
    if (bValue == null) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Build headers and data based on visible columns in user's chosen order
    const columnConfig = [
      { key: 'name', header: 'Name', getValue: (m: Member) => m.name },
      { key: 'rotary_id', header: 'Rotary ID', getValue: (m: Member) => m.rotary_id || '' },
      { key: 'roles', header: 'Club Roles', getValue: (m: Member) => m.roles && m.roles.length > 0 ? m.roles.join(', ') : 'Member' },
      { key: 'type', header: 'Membership Status', getValue: (m: Member) => m.type || 'Active' },
      { key: 'classification', header: 'Classification', getValue: (m: Member) => m.classification || '' },
      { key: 'gender', header: 'Gender', getValue: (m: Member) => m.gender || '' },
      { key: 'birthday', header: 'Birthday', getValue: (m: Member) => m.birth_month && m.birth_day ? `${monthNames[m.birth_month - 1]} ${m.birth_day}` : '' },
      { key: 'member_since', header: 'Member Since', getValue: (m: Member) => m.member_since || '' },
      { key: 'mobile', header: 'Mobile', getValue: (m: Member) => m.mobile || '' },
      { key: 'email', header: 'Email', getValue: (m: Member) => m.email || '' },
    ]

    const visibleCols = columnOrder.filter(col => col.visible)
    const headers = visibleCols.map(col => col.label)

    const rows = sortedMembers.map(m =>
      visibleCols.map(col => {
        const configItem = columnConfig.find(c => c.key === col.key)
        return configItem ? configItem.getValue(m) : ''
      })
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFilterSummary = () => {
    const active = members.filter(m => m.type === 'Active' || (!m.type && m.active)).length
    const honorary = members.filter(m => m.type === 'Honorary' || (!m.type && !m.active)).length
    const total = active + honorary // Total = Active + Honorary (excludes Former Members)
    const officers = members.filter(m =>
      m.roles && m.roles.length > 0 && m.roles.some(r => r !== 'Member')
    ).length

    return { total, active, honorary, officers }
  }

  const stats = getFilterSummary()

  // Filter configurations for FilterBar
  const filterConfigs = [
    {
      id: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'officers-and-chairs', label: 'Club Officers & Committee Chairs' },
        { value: 'officers', label: 'Club Officers' },
        { value: 'chairs', label: 'Club Committee Chairs' },
        { value: 'members', label: 'Regular Members' },
      ],
      value: filterRole,
      onChange: (value: string) => setFilterRole(value),
    },
    {
      id: 'type',
      label: 'Membership Status',
      type: 'select' as const,
      options: [
        { value: 'all', label: 'All' },
        { value: 'active-honorary', label: 'Active & Honorary' },
        { value: 'Active', label: 'Active' },
        { value: 'Honorary', label: 'Honorary' },
        { value: 'Former Member', label: 'Former Member' },
      ],
      value: filterType,
      onChange: (value: string) => setFilterType(value),
    },
  ]

  // View configurations for ViewSwitcher
  const viewConfigs = [
    { id: 'cards', label: 'Cards', icon: LayoutGrid },
    { id: 'list', label: 'List', icon: List },
  ]

  if (loading) {
    return (
      <AppLayout
        sectionName="Members"
        showAddButton={false}
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0067c8] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading members...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      sectionName="Members"
      onAddClick={() => setShowAddModal(true)}
      addButtonLabel="Add Member"
      showAddButton={true}
      views={viewConfigs}
      activeView={viewMode}
      onViewChange={(view) => setViewMode(view as 'cards' | 'list')}
      showFiltersToggle={true}
      filtersExpanded={filtersExpanded}
      onFiltersToggle={() => setFiltersExpanded(!filtersExpanded)}
      showFilters={filtersExpanded}
      searchPlaceholder="Search members by name, role, or classification..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfigs}
      resultCount={filteredMembers.length}
      totalCount={members.length}
      entityName="members"
    >
      {/* Stats Summary */}
      <div className="px-4 pt-6 pb-4">
        <div className="grid grid-cols-4 gap-3 bg-white rounded-lg shadow p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0067c8]">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f7a81b]">{stats.active}</div>
            <div className="text-xs text-gray-600">Total Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f7a81b]">{stats.honorary}</div>
            <div className="text-xs text-gray-600">Total Honorary</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#0067c8]">{stats.officers}</div>
            <div className="text-xs text-gray-600">Officers</div>
          </div>
        </div>
      </div>

      {/* Action Buttons for List View */}
      {viewMode === 'list' && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7a81b] text-white rounded-lg hover:bg-[#e09916] transition-colors font-medium"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>

            {/* Column Settings Button */}
            <div className="relative" ref={columnSettingsRef}>
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Column Settings"
              >
                <Settings size={18} className="text-gray-600" />
                <span className="text-sm text-gray-600">Columns</span>
              </button>

              {/* Column Settings Dropdown */}
              {showColumnSettings && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">Column Visibility & Order</div>
                      <button
                        onClick={() => setShowColumnSettings(false)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Close"
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Drag to reorder columns</p>
                    <div className="space-y-1">
                      {columnOrder.map((column, index) => (
                        <label
                          key={column.key}
                          draggable
                          onDragStart={() => handleColumnDragStart(index)}
                          onDragOver={(e) => handleColumnDragOver(e, index)}
                          onDragEnd={handleColumnDragEnd}
                          onDragLeave={handleColumnDragLeave}
                          className={`flex items-center gap-2 p-2 rounded cursor-move transition-all ${
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
                            className="w-4 h-4 text-[#0067c8] border-gray-300 rounded focus:ring-[#0067c8]"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {column.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-6">
        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredMembers.length} of {members.length} members
          {searchTerm && (
            <span className="ml-2">
              for "<span className="font-medium text-gray-900">{searchTerm}</span>"
            </span>
          )}
        </div>

        {/* Member Grid or List */}
        {filteredMembers.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnOrder
                        .filter((col) => col.visible)
                        .map((col) => {
                          const isSortable = col.key !== 'roles' && col.key !== 'birthday' && col.key !== 'mobile'
                          return (
                            <th
                              key={col.key}
                              onClick={() => isSortable && handleSort(col.key as keyof Member)}
                              className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                isSortable ? 'cursor-pointer hover:bg-gray-100' : ''
                              }`}
                            >
                              {col.label} {isSortable && sortField === col.key && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                          )
                        })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedMembers.map((member) => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      const birthday = member.birth_month && member.birth_day
                        ? `${monthNames[member.birth_month - 1]} ${member.birth_day}`
                        : ''

                      return (
                        <tr
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          {columnOrder
                            .filter((col) => col.visible)
                            .map((col) => {
                              // Render cell content based on column key
                              switch (col.key) {
                                case 'name':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                    </td>
                                  )
                                case 'rotary_id':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600 font-mono">{member.rotary_id || '—'}</div>
                                    </td>
                                  )
                                case 'roles':
                                  return (
                                    <td key={col.key} className="px-6 py-4">
                                      <div className="text-sm text-gray-600">
                                        {member.roles && member.roles.length > 0 ? member.roles.join(', ') : 'Member'}
                                      </div>
                                    </td>
                                  )
                                case 'type':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        member.type === 'Active' ? 'bg-green-100 text-green-800' :
                                        member.type === 'Honorary' ? 'bg-blue-100 text-blue-800' :
                                        member.type === 'Former Member' ? 'bg-gray-100 text-gray-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {member.type || 'Active'}
                                      </span>
                                    </td>
                                  )
                                case 'attendance': {
                                  const stats = attendanceStats[member.id]
                                  const isAtRisk = stats && ((stats.ytd_percentage !== null && stats.ytd_percentage !== undefined && stats.ytd_percentage < 60) || stats.consecutive_absences >= 4)
                                  return (
                                    <td
                                      key={col.key}
                                      className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedMemberForAttendance(member)
                                        setShowAttendanceDashboard(true)
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isAtRisk && (
                                          <AlertTriangle className="w-4 h-4 text-red-500" aria-label="At-risk member" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                          isAtRisk ? 'text-red-600' : stats?.ytd_percentage ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                          {stats?.ytd_percentage !== null && stats?.ytd_percentage !== undefined
                                            ? `${stats.ytd_percentage.toFixed(1)}%`
                                            : '—'}
                                        </span>
                                      </div>
                                    </td>
                                  )
                                }
                                case 'classification':
                                  return (
                                    <td key={col.key} className="px-6 py-4">
                                      <div className="text-sm text-gray-600">{member.classification || '—'}</div>
                                    </td>
                                  )
                                case 'gender':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">{member.gender || '—'}</div>
                                    </td>
                                  )
                                case 'birthday':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">{birthday || '—'}</div>
                                    </td>
                                  )
                                case 'member_since':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">{member.member_since || '—'}</div>
                                    </td>
                                  )
                                case 'mobile':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">{member.mobile || '—'}</div>
                                    </td>
                                  )
                                case 'email':
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">{member.email || '—'}</div>
                                    </td>
                                  )
                                default:
                                  return (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-600">—</div>
                                    </td>
                                  )
                              }
                            })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterRole !== 'all' || filterType !== 'active-honorary'
                ? 'Try adjusting your search or filters'
                : 'No members are currently in the directory'
              }
            </p>
            {(searchTerm || filterRole !== 'all' || filterType !== 'active-honorary') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004080] transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <MemberModal member={null} onClose={() => setShowAddModal(false)} />
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Attendance Dashboard Modal */}
      {showAttendanceDashboard && selectedMemberForAttendance && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowAttendanceDashboard(false)}
        >
          <div
            className="w-full md:max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setShowAttendanceDashboard(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                aria-label="Close dashboard"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <AttendanceDashboard memberId={selectedMemberForAttendance.id} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}