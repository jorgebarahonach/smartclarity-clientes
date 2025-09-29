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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userWithRole = await fetchUserRole(session.user)
        setUser(userWithRole)
      } else {
        setUser(null)
      }
      setLoading(false)
    }).catch(error => {
      console.error('useAuth: Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes (sync callback; defer role fetch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          try {
            const userWithRole = await fetchUserRole(session.user!)
            setUser(userWithRole)
          } catch (e) {
            console.error('useAuth: role fetch error (listener):', e)
          } finally {
            setLoading(false)
          }
        }, 0)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

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
    try {
      // Clear user state immediately
      setUser(null)
      setLoading(false)
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      // Even if there's an error, we've already cleared the local state
      if (error) {
        console.warn('Sign out warning (user cleared anyway):', error)
      }
    } catch (error) {
      console.warn('Sign out error (user cleared anyway):', error)
    }
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