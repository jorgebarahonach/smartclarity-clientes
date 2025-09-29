import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type UserWithRole = User & {
  role?: 'admin' | 'client'
}

type AuthContextType = {
  user: UserWithRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error fetching user role:', error)
        return { ...user, role: 'client' as const }
      }
      
      if (!data || data.length === 0) {
        // User has no role assigned, default to client
        return { ...user, role: 'client' as const }
      }
      
      // If user has multiple roles, prefer admin
      const roles = data.map(r => r.role)
      const role = roles.includes('admin') ? 'admin' : roles[0]
      
      return { ...user, role: role as 'admin' | 'client' }
    } catch (error) {
      console.error('Error fetching user role:', error)
      return { ...user, role: 'client' as const }
    }
  }

  useEffect(() => {
    console.log('useAuth: Starting auth initialization')
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('useAuth: Session data:', session?.user?.email || 'No session')
      if (session?.user) {
        console.log('useAuth: Fetching user role for:', session.user.email)
        const userWithRole = await fetchUserRole(session.user)
        console.log('useAuth: User with role:', userWithRole.email, userWithRole.role)
        setUser(userWithRole)
      } else {
        console.log('useAuth: No session found')
        setUser(null)
      }
      console.log('useAuth: Setting loading to false')
      setLoading(false)
    }).catch(error => {
      console.error('useAuth: Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userWithRole = await fetchUserRole(session.user)
          setUser(userWithRole)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}