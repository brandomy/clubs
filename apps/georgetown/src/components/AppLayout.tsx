import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import DesktopSecondaryNav from './DesktopSecondaryNav'
import FilterBar from './FilterBar'
import OfflineBanner from './OfflineBanner'
import InstallPrompt from './InstallPrompt'

interface ViewConfig {
  id: string
  label: string
  icon: LucideIcon
  desktopOnly?: boolean
}

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

interface AppLayoutProps {
  // AppHeader props
  sectionName: string
  onAddClick?: () => void
  addButtonLabel?: string
  showAddButton?: boolean
  children: ReactNode
  headerInfo?: ReactNode

  // ViewSwitcher props (optional)
  views?: ViewConfig[]
  activeView?: string
  onViewChange?: (view: string) => void

  // FilterBar props (optional)
  showFilters?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterConfig[]
  resultCount?: number
  totalCount?: number
  entityName?: string

  // Filters toggle in header (optional)
  showFiltersToggle?: boolean
  filtersExpanded?: boolean
  onFiltersToggle?: () => void

  // Settings button in header (optional)
  showSettingsButton?: boolean
  onSettingsClick?: () => void

  // Layout options
  showBottomNav?: boolean
  showSecondaryNav?: boolean
}

export default function AppLayout({
  sectionName,
  onAddClick,
  addButtonLabel,
  showAddButton = false,
  children,
  headerInfo,
  views,
  activeView,
  onViewChange,
  showFilters = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange = () => {},
  filters = [],
  resultCount = 0,
  totalCount = 0,
  entityName = 'items',
  showFiltersToggle = false,
  filtersExpanded = false,
  onFiltersToggle,
  showSettingsButton = false,
  onSettingsClick,
  showBottomNav = true,
  showSecondaryNav = true,
}: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-3 focus:bg-white focus:text-[#0067c8] focus:font-semibold focus:rounded-lg focus:shadow-lg focus:min-h-[44px] focus:inline-flex focus:items-center"
      >
        Skip to main content
      </a>

      {/* Sticky Header Stack */}
      <div className="relative">
        <AppHeader
          sectionName={sectionName}
          onAddClick={onAddClick}
          addButtonLabel={addButtonLabel}
          showAddButton={showAddButton}
          views={views}
          activeView={activeView}
          onViewChange={onViewChange}
          showFiltersToggle={showFiltersToggle}
          filtersExpanded={filtersExpanded}
          onFiltersToggle={onFiltersToggle}
          showSettingsButton={showSettingsButton}
          onSettingsClick={onSettingsClick}
          headerInfo={headerInfo}
        />
        {showSecondaryNav && <DesktopSecondaryNav />}
      </div>

      {showFilters && (
        <FilterBar
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filters={filters}
          resultCount={resultCount}
          totalCount={totalCount}
          entityName={entityName}
        />
      )}

      {/* Main Content Area */}
      <main id="main-content" className={`flex-1 ${showBottomNav ? 'pb-20' : 'pb-4'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}

      {/* iOS Install Prompt */}
      <InstallPrompt />
    </div>
  )
}
