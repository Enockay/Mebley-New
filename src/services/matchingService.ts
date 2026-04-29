'use client'

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

export async function likeProfile(
  likeeId: string,
  options?: { stitch?: boolean; note?: string }
): Promise<{ isMatch: boolean; conversationId?: string | null }> {
  const response = await fetch('/api/likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ likeeId, ...options }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  const data = await response.json()
  return {
    isMatch: !!data?.isMatch,
    conversationId: data?.conversationId ?? null,
  }
}

export async function passProfile(passedId: string): Promise<void> {
  const response = await fetch('/api/passes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passedId }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
}

export async function blockUser(userId: string, reason?: string): Promise<void> {
  const response = await fetch('/api/moderation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'block',
      targetId: userId,
      reason,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
}