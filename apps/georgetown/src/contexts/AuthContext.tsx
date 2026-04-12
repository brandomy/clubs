import { logger } from '../utils/logger'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/database'

interface AuthUser {
  id: string
  email?: string
}

interface AuthContextType {
  user: AuthUser | null
  userRole: UserRole | null
  memberId: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email })
        await fetchUserRole(session.user.id)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email })
        fetchUserRole(session.user.id)
      } else {
        setUser(null)
        setUserRole(null)
        setMemberId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('gt_user_roles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      setUserRole(data)
      setMemberId(data.member_id || null)
    } catch (error) {
      logger.error('Error fetching user role:', error)
      setUserRole(null)
      setMemberId(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      setUser({ id: data.user.id, email: data.user.email })
      await fetchUserRole(data.user.id)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setUserRole(null)
    setMemberId(null)
  }

  return (
    <AuthContext.Provider value={{ user, userRole, memberId, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
