// Re-export Supabase generated types
export type { Database } from './supabase-generated.types'

// ─── Relationship Intents ─────────────────────────────────────────────────────

export type RelationshipIntent =
  | 'long-term'
  | 'casual'
  | 'friendship'
  | 'marriage'
  | 'open-to-anything'

export const RELATIONSHIP_INTENTS: Record<RelationshipIntent, {
  label: string
  emoji: string
  description: string
}> = {
  'long-term': {
    label: 'Long-term relationship',
    emoji: '💑',
    description: 'Looking for something serious and lasting',
  },
  'casual': {
    label: 'Casual dating',
    emoji: '😊',
    description: 'Keeping it fun and low-pressure',
  },
  'friendship': {
    label: 'Friendship',
    emoji: '🤝',
    description: 'Just looking to meet new people',
  },
  'marriage': {
    label: 'Marriage',
    emoji: '💍',
    description: 'Ready to find my life partner',
  },
  'open-to-anything': {
    label: 'Open to anything',
    emoji: '✨',
    description: "Let's see where things go",
  },
}

// ─── Interests System ─────────────────────────────────────────────────────────

export type InterestCategory =
  | 'music' | 'sports' | 'food' | 'travel' | 'arts'
  | 'tech' | 'wellness' | 'outdoors' | 'gaming' | 'film'
  | 'reading' | 'social'

export const INTERESTS_BY_CATEGORY: Record<InterestCategory, {
  label: string
  emoji: string
  tags: string[]
}> = {
  music: {
    label: 'Music', emoji: '🎵',
    tags: ['Pop', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Rock', 'Electronic', 'Afrobeats', 'Gospel', 'Country'],
  },
  sports: {
    label: 'Sports', emoji: '⚽',
    tags: ['Football', 'Basketball', 'Tennis', 'Running', 'Swimming', 'Cycling', 'Yoga', 'Gym', 'Cricket', 'Rugby'],
  },
  food: {
    label: 'Food & Drink', emoji: '🍕',
    tags: ['Cooking', 'Baking', 'Coffee', 'Wine', 'Vegan', 'Foodie', 'BBQ', 'Sushi', 'Street Food', 'Fine Dining'],
  },
  travel: {
    label: 'Travel', emoji: '✈️',
    tags: ['Backpacking', 'Luxury Travel', 'Road Trips', 'Beach', 'Mountains', 'City Breaks', 'Solo Travel', 'Adventure'],
  },
  arts: {
    label: 'Arts & Culture', emoji: '🎨',
    tags: ['Painting', 'Photography', 'Theatre', 'Museums', 'Dance', 'Fashion', 'Architecture', 'Design'],
  },
  tech: {
    label: 'Tech', emoji: '💻',
    tags: ['Coding', 'AI', 'Startups', 'Gadgets', 'Crypto', 'Web3', 'Robotics', 'Science'],
  },
  wellness: {
    label: 'Wellness', emoji: '🧘',
    tags: ['Meditation', 'Mindfulness', 'Mental Health', 'Nutrition', 'Pilates', 'Hiking', 'Self-care'],
  },
  outdoors: {
    label: 'Outdoors', emoji: '🌿',
    tags: ['Camping', 'Hiking', 'Surfing', 'Climbing', 'Fishing', 'Gardening', 'Wildlife'],
  },
  gaming: {
    label: 'Gaming', emoji: '🎮',
    tags: ['Console Gaming', 'PC Gaming', 'Mobile Gaming', 'Esports', 'Board Games', 'Chess', 'VR'],
  },
  film: {
    label: 'Film & TV', emoji: '🎬',
    tags: ['Movies', 'Netflix', 'Anime', 'Documentaries', 'Sci-Fi', 'Horror', 'Comedy', 'Drama'],
  },
  reading: {
    label: 'Reading', emoji: '📚',
    tags: ['Fiction', 'Non-Fiction', 'Poetry', 'Self-Help', 'Biography', 'Thriller', 'Fantasy', 'History'],
  },
  social: {
    label: 'Social', emoji: '🎉',
    tags: ['Parties', 'Volunteering', 'Networking', 'Karaoke', 'Comedy Shows', 'Live Music', 'Festivals'],
  },
}

export const ALL_INTEREST_TAGS = Object.values(INTERESTS_BY_CATEGORY)
  .flatMap(({ tags }) => tags)

// ─── Shared Profile Type ──────────────────────────────────────────────────────

export type Profile = {
  id: string
  username: string
  full_name: string
  gender: string
  date_of_birth: string
  bio: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  photos: string[]
  interests: string[]
  looking_for: RelationshipIntent[]
  profile_completeness: number
  is_verified: boolean
  is_active: boolean
  last_active: string
  created_at: string
  updated_at: string
}

// ─── Match Types ──────────────────────────────────────────────────────────────

export type MatchScore = {
  total: number
  breakdown: {
    interests: number
    intent: number
    location: number
    activity: number
    completeness: number
  }
  reasons: string[]
}

// ─── Global / i18n ────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'es' | 'fr' | 'pt' | 'sw' | 'ar' | 'zh' | 'hi'

export const SUPPORTED_LOCALES: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  sw: 'Kiswahili',
  ar: 'العربية',
  zh: '中文',
  hi: 'हिन्दी',
}