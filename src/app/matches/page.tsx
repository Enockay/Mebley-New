'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Matches from '@/components/Matches/Matches'
import MatchesList from '@/components/Matches/MatchesList'
import Chat from '@/components/Messages/Chat'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function MatchesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [chatView, setChatView] = useState<{
    conversationId: string
    profile: Profile
  } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500" />
      </div>
    )
  }

  if (chatView) {
    return (
      <div className="h-screen">
        <Chat
          conversationId={chatView.conversationId}
          otherProfile={chatView.profile}
          onBack={() => setChatView(null)}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Matches
        onOpenChat={(conversationId, profile) =>
          setChatView({ conversationId, profile })
        }
      />
    </div>
  )
}