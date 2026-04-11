import { useState, useRef, useEffect } from 'react'
import { Settings, X } from 'lucide-react'

interface ColumnSettingsProps {
  visibleColumns: Record<string, boolean>
  columnLabels: Record<string, string>
  toggleColumn: (column: string) => void
}

export default function ColumnSettings({ visibleColumns, columnLabels, toggleColumn }: ColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
      >
        <Settings size={18} />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Column Visibility</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-3 max-h-96 overflow-y-auto">
            {Object.keys(visibleColumns).map((column) => (
              <label
                key={column}
                className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[column]}
                  onChange={() => toggleColumn(column)}
                  className="rounded border-gray-300 text-[#0067c8] focus:ring-[#0067c8]"
                />
                <span className="text-sm text-gray-700">
                  {columnLabels[column]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
