'use client'

import { Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function TopHeader() {
  const { profile, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Crotchet
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile?.full_name}</span>
          <button
            onClick={() => signOut()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  )
}