// App-level constants for interests, intents, prompts, and related types.
// Separated from database.types.ts so regenerating Supabase types
// never wipes these out.

export type RelationshipIntent = {
  value: string
  label: string
  emoji: string
  description: string
}

export type InterestCategory = {
  label: string
  emoji: string
  tags: string[]
}

export type ProfilePrompt = {
  id:       string   // stable ID — never change these once in production
  question: string
  emoji:    string
}

// ── Relationship intents ──────────────────────────────────────────────────────

export const RELATIONSHIP_INTENTS: RelationshipIntent[] = [
  { value: 'serious relationship', label: 'Serious Relationship', emoji: '💍', description: 'Looking for a long-term committed partner' },
  { value: 'casual dating',        label: 'Casual Dating',        emoji: '😊', description: 'Getting to know people, no pressure' },
  { value: 'friendship',           label: 'Friendship',           emoji: '🤝', description: 'Meeting new friends and connections' },
  { value: 'networking',           label: 'Networking',           emoji: '💼', description: 'Professional connections and opportunities' },
  { value: 'not sure yet',         label: 'Not Sure Yet',         emoji: '🤔', description: 'Open to seeing where things go' },
]

// ── Interests by category ─────────────────────────────────────────────────────

export const INTERESTS_BY_CATEGORY: InterestCategory[] = [
  { label: 'Arts & Culture',     emoji: '🎨', tags: ['Painting', 'Sculpture', 'Theatre', 'Museums', 'Dance', 'Poetry'] },
  { label: 'Food & Drink',       emoji: '🍕', tags: ['Cooking', 'Wine tasting', 'Coffee', 'Vegan food', 'Street food', 'Baking'] },
  { label: 'Music',              emoji: '🎵', tags: ['Live concerts', 'DJing', 'Playing guitar', 'Jazz', 'Hip-hop', 'Classical'] },
  { label: 'Sports & Fitness',   emoji: '⚽', tags: ['Running', 'Gym', 'Football', 'Basketball', 'Yoga', 'Cycling', 'Swimming'] },
  { label: 'Travel',             emoji: '✈️', tags: ['Backpacking', 'Road trips', 'Beach holidays', 'Cultural travel', 'Adventure travel'] },
  { label: 'Technology',         emoji: '💻', tags: ['AI', 'Startups', 'Coding', 'Gadgets', 'Crypto', 'Design'] },
  { label: 'Film & TV',          emoji: '🎬', tags: ['Documentaries', 'Sci-fi', 'Rom-coms', 'Anime', 'Horror', 'Indie films'] },
  { label: 'Books',              emoji: '📚', tags: ['Sci-fi novels', 'Self-help', 'History', 'Biographies', 'Fantasy', 'Poetry'] },
  { label: 'Gaming',             emoji: '🎮', tags: ['PC gaming', 'Console gaming', 'Mobile gaming', 'Board games', 'VR'] },
  { label: 'Outdoors',           emoji: '🌿', tags: ['Hiking', 'Camping', 'Rock climbing', 'Bird watching', 'Gardening'] },
  { label: 'Fashion',            emoji: '👗', tags: ['Streetwear', 'Vintage', 'Thrifting', 'Luxury fashion', 'Sustainable fashion'] },
  { label: 'Wellness',           emoji: '🧘', tags: ['Meditation', 'Mental health', 'Journaling', 'Pilates', 'Nutrition'] },
  { label: 'Photography',        emoji: '📷', tags: ['Portrait', 'Street photography', 'Nature', 'Film photography', 'Drone'] },
  { label: 'Cooking',            emoji: '👨‍🍳', tags: ['Meal prep', 'BBQ', 'Baking', 'International cuisine', 'Fermentation'] },
  { label: 'Politics & Society', emoji: '🌍', tags: ['Activism', 'Community work', 'Debate', 'Environmentalism'] },
]

// ── Profile prompts ───────────────────────────────────────────────────────────
// 20 curated questions across different personality dimensions.
// IDs are stable strings — never rename them once users have answered them,
// or existing answers will lose their question label.
// Stored in profiles.prompts as jsonb[]: [{id, question, answer}]

export const PROFILE_PROMPTS: ProfilePrompt[] = [
  // About personality
  { id: 'p01', emoji: '🌟', question: 'The most spontaneous thing I\'ve ever done' },
  { id: 'p02', emoji: '😂', question: 'My most controversial opinion' },
  { id: 'p03', emoji: '🧠', question: 'I get way too passionate about' },
  { id: 'p04', emoji: '🎭', question: 'People would be surprised to know I' },
  { id: 'p05', emoji: '🔥', question: 'A hill I will die on' },

  // About life & values
  { id: 'p06', emoji: '🌍', question: 'The one place that changed how I see the world' },
  { id: 'p07', emoji: '💡', question: 'The life lesson it took me too long to learn' },
  { id: 'p08', emoji: '🙏', question: 'What I value most in a person' },
  { id: 'p09', emoji: '🚀', question: 'My biggest goal right now' },
  { id: 'p10', emoji: '💬', question: 'The conversation I could have forever' },

  // About connection
  { id: 'p11', emoji: '💘', question: 'The way to win me over is' },
  { id: 'p12', emoji: '🤝', question: 'I know it\'s a good date when' },
  { id: 'p13', emoji: '❤️', question: 'What a relationship means to me' },
  { id: 'p14', emoji: '🎁', question: 'My love language is' },
  { id: 'p15', emoji: '🔑', question: 'The thing I\'m looking for that most people miss' },

  // Fun / light
  { id: 'p16', emoji: '🍕', question: 'I will judge you if you don\'t like' },
  { id: 'p17', emoji: '📺', question: 'My comfort show that I\'ve rewatched too many times' },
  { id: 'p18', emoji: '🎵', question: 'The song that perfectly describes me right now' },
  { id: 'p19', emoji: '🌙', question: 'My ideal Sunday looks like' },
  { id: 'p20', emoji: '✈️', question: 'Next trip on my list' },
]
