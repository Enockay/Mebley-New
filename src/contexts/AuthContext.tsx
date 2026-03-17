'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user:           User | null
  profile:        Profile | null
  session:        Session | null
  loading:        boolean        // true ONLY during initial session check
  profileLoading: boolean        // true while profile is being fetched
  signUp:         (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn:         (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut:        () => Promise<void>
  refreshProfile: () => Promise<void>
  linkEmail:      (email: string, password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)     return 'Password must be at least 8 characters'
  if (password.length > 128)   return 'Password is too long'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                   = useState<User | null>(null)
  const [profile, setProfile]             = useState<Profile | null>(null)
  const [session, setSession]             = useState<Session | null>(null)
  const [loading, setLoading]             = useState(true)   // initial boot only
  const [profileLoading, setProfileLoading] = useState(false) // profile fetch

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const refreshProfile = async (userId?: string) => {
    const id = userId ?? user?.id
    if (!id) { setProfile(null); return }
    setProfileLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      setProfile(data ?? null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { user: validatedUser } } = await supabase.auth.getUser()

      if (!mounted) return

      if (validatedUser) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        setUser(validatedUser)
        await refreshProfile(validatedUser.id)
      }

      // Only set loading false AFTER everything is resolved
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        setSession(newSession)

        if (newSession?.user) {
          const { data: { user: validatedUser } } = await supabase.auth.getUser()
          if (!mounted) return
          setUser(validatedUser)
          await refreshProfile(validatedUser?.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const strengthError = validatePasswordStrength(password)
    if (strengthError) {
      return { error: { name: 'AuthApiError', message: strengthError, status: 400 } as AuthError }
    }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const linkEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    const strengthError = validatePasswordStrength(password)
    if (strengthError) return { error: strengthError }
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email, password })
      if (updateError) return { error: updateError.message }
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Failed to link email' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session,
      loading, profileLoading,
      signUp, signIn, signOut, refreshProfile, linkEmail,
    }}>
      {/* Render children always — pages handle their own loading states */}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}