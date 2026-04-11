import { logger } from '../utils/logger'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { RolePermission } from '../types/database'

/**
 * usePermissions Hook
 * Purpose: Check user permissions based on role
 *
 * Usage:
 * const { hasPermission, canCreate, canRead, canUpdate, canDelete, isLoading } = usePermissions()
 * const canRSVP = canRead('events')
 * const canTakeAttendance = canCreate('attendance')
 */

type Resource = 'speakers' | 'members' | 'events' | 'attendance' | 'projects' | 'partners' | 'timeline' | 'settings'
type PermissionType = 'create' | 'read' | 'update' | 'delete'

interface UsePermissionsReturn {
  hasPermission: (resource: Resource, action: PermissionType) => boolean
  canCreate: (resource: Resource) => boolean
  canRead: (resource: Resource) => boolean
  canUpdate: (resource: Resource) => boolean
  canDelete: (resource: Resource) => boolean
  isOfficer: boolean
  isAdmin: boolean
  isLoading: boolean
  permissions: RolePermission[]
}

export function usePermissions(): UsePermissionsReturn {
  const { userRole, isLoading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userRole?.role) {
        setPermissions([])
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', userRole.role)

        if (error) throw error

        setPermissions(data || [])
      } catch (error) {
        logger.error('Error fetching permissions:', error)
        setPermissions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [userRole?.role])

  const hasPermission = useCallback(
    (resource: Resource, action: PermissionType): boolean => {
      if (!userRole) return false

      // Admins have all permissions
      if (userRole.role === 'admin') return true

      const permission = permissions.find(p => p.resource === resource)
      if (!permission) return false

      switch (action) {
        case 'create':
          return permission.can_create
        case 'read':
          return permission.can_read
        case 'update':
          return permission.can_update
        case 'delete':
          return permission.can_delete
        default:
          return false
      }
    },
    [userRole, permissions]
  )

  const canCreate = useCallback((resource: Resource) => hasPermission(resource, 'create'), [hasPermission])
  const canRead = useCallback((resource: Resource) => hasPermission(resource, 'read'), [hasPermission])
  const canUpdate = useCallback((resource: Resource) => hasPermission(resource, 'update'), [hasPermission])
  const canDelete = useCallback((resource: Resource) => hasPermission(resource, 'delete'), [hasPermission])

  const isOfficer = userRole?.role === 'officer' || userRole?.role === 'admin'
  const isAdmin = userRole?.role === 'admin'

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isOfficer,
    isAdmin,
    isLoading: authLoading || isLoading,
    permissions
  }
}
