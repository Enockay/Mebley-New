'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase-client'

export interface MatchProfile {
  id: string
  username: string
  full_name: string
  age: number | null
  gender: string
  bio: string
  location: string
  interests: string[]
  photos: any[]
  looking_for: string[]
  profile_completeness: number
  last_active: string
}

export interface ScoredProfile {
  score: number
  reasons: string[]
  profile: MatchProfile
}

export interface DiscoverResponse {
  profiles: ScoredProfile[]
  page: number
  total: number
}

export async function getDiscoverProfiles(page = 1, limit = 20): Promise<DiscoverResponse> {
  const response = await fetch(`/api/discover?page=${page}&limit=${limit}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function likeProfile(likeeId: string): Promise<{ isMatch: boolean }> {
  const supabase = createBrowserSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('likes')
    .insert({ liker_id: user.id, likee_id: likeeId })

  if (error) throw error

  // Check if mutual match
  const { data: mutualLike } = await supabase
    .from('likes')
    .select('id')
    .eq('liker_id', likeeId)
    .eq('likee_id', user.id)
    .maybeSingle()

  return { isMatch: !!mutualLike }
}

export async function passProfile(passedId: string): Promise<void> {
  // For now just a client-side skip — could store in DB later
  console.log('Passed profile:', passedId)
}

export async function blockUser(userId: string, reason?: string): Promise<void> {
  const supabase = createBrowserSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('blocked_users')
    .insert({ blocker_id: user.id, blocked_id: userId, reason })

  if (error) throw error
}