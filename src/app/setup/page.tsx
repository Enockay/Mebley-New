'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import ProfileSetup from '@/components/Profile/ProfileSetup'
import { Loader2 } from 'lucide-react'

export default function SetupPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/auth')
      // If profile is complete enough (has interests), go to discover
      else if (profile && profile.interests && (profile.interests as string[]).length > 0) {
        router.push('/discover')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    )
  }

  return <ProfileSetup />
}
