/**
 * useAuth Hook
 * Purpose: Manage Supabase authentication state and user role
 *
 * Reads from AuthContext — wrap your app in <AuthProvider> (see App.tsx).
 *
 * Usage:
 * const { user, userRole, memberId, isLoading, signIn, signOut } = useAuth()
 */

export { useAuthContext as useAuth } from '../contexts/AuthContext'
