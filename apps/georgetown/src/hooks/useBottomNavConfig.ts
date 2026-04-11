import { logger } from '../utils/logger'
/**
 * useBottomNavConfig Hook
 * Manages user's customizable bottom navigation preferences
 *
 * Features:
 * - Persists selected nav items (max 5) and their order in localStorage
 * - Provides default configuration on first visit
 * - Updates in real-time across components
 */

import { useState, useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Users, Calendar, Target, Mic, Clock, Handshake, Camera, Info, BarChart3 } from 'lucide-react'

export interface NavItem {
  id: string
  path: string
  icon: LucideIcon
  label: string
}

// All available navigation items
export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'members', path: '/members', icon: Users, label: 'Members' },
  { id: 'calendar', path: '/calendar', icon: Calendar, label: 'Calendar' },
  { id: 'speakers', path: '/speakers', icon: Mic, label: 'Speakers' },
  { id: 'projects', path: '/projects', icon: Target, label: 'Projects' },
  { id: 'partners', path: '/partners', icon: Handshake, label: 'Partners' },
  { id: 'timeline', path: '/timeline', icon: Clock, label: 'Timeline' },
  { id: 'photos', path: '/photos', icon: Camera, label: 'Photos' },
  { id: 'impact', path: '/impact', icon: BarChart3, label: 'Impact' },
  { id: 'about', path: '/about', icon: Info, label: 'About' },
]

// Default selected items (most-used 5)
const DEFAULT_NAV_ITEM_IDS = ['members', 'calendar', 'speakers', 'projects', 'photos']

const STORAGE_KEY = 'bottom-nav-config'
const MAX_NAV_ITEMS = 5

interface BottomNavConfig {
  selectedItemIds: string[]
}

export function useBottomNavConfig() {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(DEFAULT_NAV_ITEM_IDS)

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config: BottomNavConfig = JSON.parse(stored)
        // Validate that all IDs exist in ALL_NAV_ITEMS
        const validIds = config.selectedItemIds.filter(id =>
          ALL_NAV_ITEMS.some(item => item.id === id)
        )
        if (validIds.length > 0) {
          setSelectedItemIds(validIds.slice(0, MAX_NAV_ITEMS))
        }
      }
    } catch (error) {
      logger.error('Failed to load bottom nav config:', error)
    }
  }, [])

  // Save configuration to localStorage whenever it changes
  const updateSelectedItems = (itemIds: string[]) => {
    const validIds = itemIds.slice(0, MAX_NAV_ITEMS)
    setSelectedItemIds(validIds)

    try {
      const config: BottomNavConfig = { selectedItemIds: validIds }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      logger.error('Failed to save bottom nav config:', error)
    }
  }

  // Get the actual nav items based on selected IDs (in order)
  const selectedNavItems = selectedItemIds
    .map(id => ALL_NAV_ITEMS.find(item => item.id === id))
    .filter((item): item is NavItem => item !== undefined)

  // Get available items (not currently selected)
  const availableNavItems = ALL_NAV_ITEMS.filter(
    item => !selectedItemIds.includes(item.id)
  )

  const canAddMore = selectedItemIds.length < MAX_NAV_ITEMS
  const maxItemsReached = selectedItemIds.length >= MAX_NAV_ITEMS

  return {
    selectedNavItems,
    availableNavItems,
    allNavItems: ALL_NAV_ITEMS,
    selectedItemIds,
    updateSelectedItems,
    canAddMore,
    maxItemsReached,
    maxItems: MAX_NAV_ITEMS,
  }
}
