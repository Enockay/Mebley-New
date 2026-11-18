/** Sample data for the dev-only app previews (/studio/app). Not used in production. */
import type { DiscoverPerson } from '@/components/App/discover-model'
import type { FrameData } from '@/components/App/AppFrame'

export const FRAME: FrameData = { name: 'Enock Mwema', photo: null, credits: 75, completeness: 90, likes: 4, unread: 2, isAdmin: false }

const base: Omit<DiscoverPerson, 'id' | 'name'> = {
  ageLabel: '18–24', location: 'Kilimani, Nairobi', area: 'Kilimani', distanceKm: 3, photos: [], verified: false,
  score: 80, reasons: [], lookingFor: [], interests: [], prompts: [], bio: null, occupation: null, heightCm: null,
  education: null, languages: [], drinking: null, children: null, online: false, spotlight: false, hereTonight: false,
  voiceNoteUrl: null, likesCount: 0,
}

export const PEOPLE: DiscoverPerson[] = [
  {
    ...base, id: 'p1', name: 'Wanjiru', ageLabel: '18–24', location: 'Kilimani, Nairobi', area: 'Kilimani', distanceKm: 3,
    photos: ['/img/profile-amara-720.webp', '/img/story-1-320.webp', '/img/story-3-320.webp'], verified: true, score: 86, online: true,
    reasons: ['You both want something serious', 'You both love dancing'],
    lookingFor: ['serious relationship'], children: 'open', interests: ['Dance', 'Hip-hop', 'Yoga', 'Wine tasting', 'Beach holidays'],
    prompts: [{ question: 'My perfect Sunday', answer: 'Church in the morning, nyama choma with friends, then a long walk at Karura before sunset.' }],
    occupation: 'Marketing executive', heightCm: 168, education: 'bachelors', languages: ['English', 'Swahili'], drinking: 'socially',
  },
  { ...base, id: 'p2', name: 'Amani', ageLabel: '25–34', location: 'Westlands, Nairobi', area: 'Westlands', distanceKm: 5, score: 81, photos: ['/img/story-2-320.webp'] },
  { ...base, id: 'p3', name: 'Zawadi', ageLabel: '18–24', location: 'South B, Nairobi', area: 'South B', distanceKm: 8, score: 77 },
  { ...base, id: 'p4', name: 'Neema', ageLabel: '25–34', location: 'Kileleshwa, Nairobi', area: 'Kileleshwa', distanceKm: 4, score: 74, photos: ['/img/story-3-320.webp'] },
  { ...base, id: 'p5', name: 'Achieng', ageLabel: '25–34', location: 'Ngong Rd, Nairobi', area: 'Ngong Rd', distanceKm: 6, score: 70 },
]
