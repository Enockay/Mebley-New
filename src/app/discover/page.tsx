'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Discover from '@/components/Discover/Discover'

export default function DiscoverPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const discoverBg = 'radial-gradient(44% 50% at 8% 90%, rgba(236,72,153,0.24), transparent 72%), radial-gradient(38% 44% at 92% 10%, rgba(139,92,246,0.22), transparent 74%), linear-gradient(140deg,#0a031a 0%,#16042b 36%,#2b0644 70%,#3f0854 100%)'

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
        background: discoverBg,
      }}>
        <div style={{
          width: 44, height: 44,
          border: '2.5px solid rgba(244,63,94,0.15)',
          borderTopColor: '#f43f5e',
          borderRadius: '50%',
          animation: 'spin-slow 0.9s linear infinite',
        }} />
        <p style={{ color: 'rgba(245,220,250,0.85)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, background: discoverBg }}>
      <Discover />
    </div>
  )
}