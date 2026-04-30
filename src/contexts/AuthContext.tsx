/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AppUser = { id: string; email: string }
type AuthResult = { error: { message: string } | null; isAdmin?: boolean }

interface AuthContextType {
  user:           AppUser | null
  profile:        Profile | null
  session:        { authenticated: boolean } | null
  loading:        boolean
  creditBalance:  number
  /** Mirrors `user_roles.role = 'admin'` — same rule as admin APIs. */
  isAdmin:        boolean
  signUp:         (email: string, password: string) => Promise<AuthResult>
  signIn:         (email: string, password: string) => Promise<AuthResult>
  signOut:        () => Promise<void>
  refreshProfile: () => Promise<void>
  linkEmail:      (email: string, password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                 = useState<AppUser | null>(null)
  const [profile, setProfile]           = useState<Profile | null>(null)
  const [session, setSession]           = useState<{ authenticated: boolean } | null>(null)
  const [loading, setLoading]           = useState(true)
  const [creditBalance, setCreditBalance] = useState(0)
  const [isAdmin, setIsAdmin]           = useState(false)

  const refreshProfile = async () => {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setUser(data.user ?? null)
    setProfile(data.profile ?? null)
    setCreditBalance(data.creditBalance ?? 0)
    setIsAdmin(!!data.isAdmin)
    setSession(data.user ? { authenticated: true } : null)
  }

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))
  }, [])

  const signUp = async (email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { error: { message: json.error ?? 'Sign up failed' } }
    await refreshProfile()
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { error: { message: json.error ?? 'Sign in failed' } }
    await refreshProfile()
    return { error: null, isAdmin: !!json.isAdmin }
  }

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setUser(null)
    setSession(null)
    setProfile(null)
    setCreditBalance(0)
    setIsAdmin(false)
  }

  // Link email+password to current account (e.g. Google user adding email/password)
  const linkEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Deprecated in Postgres-native auth flow.
    console.warn('linkEmail is not supported in PostgreSQL auth mode', email, password)
    return { error: 'Link email is not supported in this auth mode' }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, creditBalance, isAdmin,
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
