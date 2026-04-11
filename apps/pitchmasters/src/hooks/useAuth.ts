/**
 * useAuth Hook
 * Purpose: Access authentication state and actions
 *
 * Reads from AuthContext — wrap your app in <AuthProvider> (see App.tsx).
 *
 * Usage:
 * const { user, isLoading, signIn, signOut } = useAuth()
 */

export { useAuthContext as useAuth } from '../contexts/AuthContext';
