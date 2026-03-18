'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Discover from '@/components/Discover/Discover'

export default function DiscoverPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return                               // still resolving — wait
    if (!user) { router.push('/auth'); return }       // no session → login
    if (!profile) { router.push('/setup'); return }   // no profile → setup
  }, [user, profile, loading, router])

  // Block render until session AND profile are both confirmed
  // Prevents the white flash and premature /setup redirect
  if (loading || !user || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
        background: 'var(--linen)',
      }}>
        <div style={{
          width: 44, height: 44,
          border: '2.5px solid rgba(244,63,94,0.15)',
          borderTopColor: '#f43f5e',
          borderRadius: '50%',
          animation: 'spin-slow 0.9s linear infinite',
        }} />
        <p style={{ color: '#a37a82', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1 }}>
      <Discover />
    </div>
  )
}