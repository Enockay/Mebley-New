/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user:           User | null
  profile:        Profile | null
  session:        Session | null
  loading:        boolean
  creditBalance:  number
  signUp:         (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn:         (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut:        () => Promise<void>
  refreshProfile: () => Promise<void>
  linkEmail:      (email: string, password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                 = useState<User | null>(null)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [session, setSession]           = useState<Session | null>(null)
  const [loading, setLoading]           = useState(true)
  const [creditBalance, setCreditBalance] = useState(0)

  const refreshProfile = async () => {
    const currentUser = (await supabase.auth.getUser()).data.user
    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()
      setProfile(data)

      // Fetch credit wallet balance
      const { data: wallet } = await (supabase as any)
        .from('credit_wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle()
      setCreditBalance(wallet?.balance ?? 0)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      ;(async () => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await refreshProfile()
        setLoading(false)
      })()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      ;(async () => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await refreshProfile()
        else setProfile(null)
      })()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setCreditBalance(0)
  }

  // Link email+password to current account (e.g. Google user adding email/password)
  const linkEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error: updateError } = await supabase.auth.updateUser({ email, password })
      if (updateError) return { error: updateError.message }
      if (user) {
        await supabase.from('profiles').update({
          verified_email: true,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)
      }
      return { error: null }
    } catch (err: any) {
      return { error: err.message ?? 'Failed to link email' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, creditBalance,
      signUp, signIn, signOut, refreshProfile, linkEmail,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
