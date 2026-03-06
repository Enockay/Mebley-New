'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Settings } from 'lucide-react'
import EditProfile from '@/components/Profile/EditProfile'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-pink-100 rounded-2xl flex items-center justify-center">
              <div className="text-9xl opacity-30">👤</div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.full_name}
              </h3>
              <p className="text-gray-600">@{profile.username}</p>
            </div>

            {profile.location && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Location</h4>
                <p className="text-gray-600">{profile.location}</p>
              </div>
            )}

            {profile.bio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Looking for</h4>
              <p className="text-gray-600">{profile.looking_for.join(', ')}</p>
            </div>

            {profile.interests.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
    </div>
  )
}