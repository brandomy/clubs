import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'multiselect'
  options: FilterOption[]
  value: string | string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void
}

interface FilterBarProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterConfig[]
  resultCount: number
  totalCount: number
  entityName: string
}

export default function FilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
  resultCount,
  totalCount,
  entityName,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = filters.some((filter) => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0
    }
    return filter.value !== 'all' && filter.value !== ''
  })

  const activeFilterCount = filters.reduce((count, filter) => {
    if (Array.isArray(filter.value)) {
      return count + (filter.value.length > 0 ? 1 : 0)
    }
    return count + (filter.value !== 'all' && filter.value !== '' ? 1 : 0)
  }, 0)

  const clearAllFilters = () => {
    filters.forEach((filter) => {
      if (Array.isArray(filter.value)) {
        filter.onChange([])
      } else {
        filter.onChange('all')
      }
    })
    onSearchChange('')
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 focus:border-[#f7a81b] focus:ring-2 focus:ring-[#f7a81b]/20 transition-all text-gray-900 placeholder-gray-500"
          />

          {/* Filter Toggle Button (All Screen Sizes) */}
          {filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 transition-colors ${
                showFilters || hasActiveFilters
                  ? 'text-[#0067c8] bg-blue-50'
                  : 'text-gray-400'
              }`}
              aria-label="Toggle filters"
            >
              <div className="relative">
                <Filter size={18} />
                {activeFilterCount > 0 && !showFilters && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#f7a81b] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Collapsible Filter Panel (All Screen Sizes) */}
        {showFilters && filters.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900">Filters</span>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter controls - Mobile: Vertical, Desktop: Horizontal */}
            <div className="flex flex-col md:flex-row md:flex-wrap gap-3">
              {filters.map((filter) => (
                <div key={filter.id} className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-600 mb-1">
                    {filter.label}
                  </label>
                  <select
                    value={
                      Array.isArray(filter.value)
                        ? filter.value.join(',')
                        : filter.value
                    }
                    onChange={(e) => {
                      if (filter.type === 'multiselect') {
                        filter.onChange(
                          e.target.value ? e.target.value.split(',') : []
                        )
                      } else {
                        filter.onChange(e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-[#0067c8] focus:ring-2 focus:ring-[#0067c8]/20"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="flex-1 md:flex-initial px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 md:flex-initial px-4 py-2 bg-[#0067c8] text-white rounded-lg hover:bg-[#004a8a] text-sm font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          Showing {resultCount.toLocaleString()} of {totalCount.toLocaleString()}{' '}
          {entityName}
          {searchValue && (
            <span className="ml-1">
              for "<span className="font-medium text-gray-900">{searchValue}</span>"
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
