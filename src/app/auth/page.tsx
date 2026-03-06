'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import Login from '@/components/Auth/Login'
import Signup from '@/components/Auth/Signup'

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup'>('login')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Logo */}
      <div className="flex justify-center pt-12 pb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-10 h-10 text-pink-500" fill="currentColor" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Crotchet
          </h1>
        </div>
      </div>

      {view === 'login' ? (
        <Login onToggle={() => setView('signup')} />
      ) : (
        <Signup
          onToggle={() => setView('login')}
          onProfileSetup={() => router.push('/discover')}
        />
      )}
    </div>
  )
}