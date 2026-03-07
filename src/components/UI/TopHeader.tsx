'use client'

import { Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Safely extracts a URL from whatever shape photos[0] comes back as.
// Handles: { url: string }, { url: string, slot: number, s3Key: string },
// a plain string, or null/undefined.
function getPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null
  const first = photos[0]
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && 'url' in first && typeof first.url === 'string') return first.url
  return null
}

export default function TopHeader() {
  const { profile, signOut } = useAuth()

  const avatarUrl = getPhotoUrl(profile?.photos)

  // Initials fallback — up to 2 chars from full_name
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-pink-500" fill="currentColor" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Crotchet
          </h1>
        </div>

        {/* Right side — avatar + name + sign out */}
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile?.full_name ?? 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-semibold select-none">
                {initials}
              </span>
            )}
          </div>

          {/* Name — hidden on very small screens */}
          <span className="hidden sm:block text-sm text-gray-600 max-w-[120px] truncate">
            {profile?.full_name}
          </span>

          {/* Sign out */}
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
