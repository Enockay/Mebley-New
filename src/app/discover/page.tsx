/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Discover from '@/components/Discover/Discover'

export default function DiscoverPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  if (loading) {
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

  if (!profile) { router.push('/setup'); return null }

  return (
    <div style={{ flex: 1 }}>
      <Discover />
    </div>
  )
}