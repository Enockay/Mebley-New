/**
 * Shape of a person on the Discover screens, normalised from /api/discover.
 */
import { childrenLabel } from '@/lib/profile-details'

export type PromptAnswer = { id?: string; question: string; answer: string }

export type DiscoverPerson = {
  id: string
  name: string
  ageLabel: string | null
  location: string | null
  /** First part of the location, e.g. "Kilimani" */
  area: string | null
  distanceKm: number | null
  photos: string[]
  verified: boolean
  score: number
  reasons: string[]
  lookingFor: string[]
  interests: string[]
  prompts: PromptAnswer[]
  bio: string | null
  occupation: string | null
  heightCm: number | null
  education: string | null
  languages: string[]
  drinking: string | null
  children: string | null
  online: boolean
  spotlight: boolean
  hereTonight: boolean
  voiceNoteUrl: string | null
  likesCount: number
}

export const AGE_RANGE_LABELS: Record<string, string> = {
  '18_24': '18–24', '25_34': '25–34', '35_40': '35–40', '40_50': '40–50', '50_65': '50–65', '65_plus': '65+',
}

const titleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())
/** "serious relationship" -> "Serious relationship" */
export const intentLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function isOnline(lastActive?: string | null): boolean {
  if (!lastActive) return false
  const t = new Date(lastActive).getTime()
  return !Number.isNaN(t) && Date.now() - t <= 5 * 60 * 1000
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toPerson(sp: { score: number; reasons: string[]; profile: any }): DiscoverPerson {
  const p = sp.profile ?? {}
  const photos: string[] = (Array.isArray(p.photos) ? p.photos : [])
    .map((x: any) => (typeof x === 'string' ? x : x?.url))
    .filter(Boolean)
  const location: string | null = p.location || null
  return {
    id: p.id,
    name: p.full_name ?? 'Member',
    ageLabel: p.age ? String(p.age) : AGE_RANGE_LABELS[p.age_range] ?? null,
    location,
    area: location ? titleCase(location.split(',')[0].trim()) : null,
    distanceKm: typeof p.distance_km === 'number' ? p.distance_km : null,
    photos,
    verified: !!p.photo_verified,
    score: Math.max(0, Math.min(100, Math.round(sp.score ?? 0))),
    reasons: Array.isArray(sp.reasons) ? sp.reasons : [],
    lookingFor: Array.isArray(p.looking_for) ? p.looking_for : [],
    interests: Array.isArray(p.interests) ? p.interests : [],
    prompts: (Array.isArray(p.prompts) ? p.prompts : []).filter((x: any) => x?.question && x?.answer),
    bio: p.bio || null,
    occupation: p.occupation || null,
    heightCm: p.height_cm ?? null,
    education: p.education ?? null,
    languages: Array.isArray(p.languages) ? p.languages : [],
    drinking: p.drinking ?? null,
    children: p.children ?? null,
    online: isOnline(p.last_active),
    spotlight: !!p.spotlight,
    hereTonight: !!p.here_tonight,
    voiceNoteUrl: p.voice_note_url ?? null,
    likesCount: Number(p.received_likes_count) || 0,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** "Kilimani · 3 km away" */
export function whereText(p: DiscoverPerson, opts: { away?: boolean; full?: boolean } = {}): string {
  const place = opts.full ? p.location : p.area
  const dist = p.distanceKm != null ? `${p.distanceKm < 1 ? '<1' : p.distanceKm} km${opts.away ? ' away' : ''}` : null
  return [place, dist].filter(Boolean).join(' · ')
}

/** Short "why you match" line, e.g. "You both want something serious and love dancing." */
export function matchSummary(p: DiscoverPerson): string {
  if (p.reasons.length === 0) return 'You have things in common.'
  return p.reasons.slice(0, 2).join(' · ')
}

/** "Looking for" chips: intents plus the children preference. */
export function lookingForChips(p: DiscoverPerson): { label: string; accent: boolean }[] {
  const chips = p.lookingFor.slice(0, 2).map(v => ({ label: intentLabel(v), accent: true }))
  const kids = childrenLabel(p.children)
  if (kids) chips.push({ label: kids, accent: false })
  return chips
}
