-- Core PostgreSQL schema for migrated matching/discovery flow
-- Covers: discover, likes, passes, moderation blocks, matches, conversations

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL,
  age_range text,
  gender text NOT NULL,
  bio text,
  location text,
  nationality text,
  latitude double precision,
  longitude double precision,
  interests text[] NOT NULL DEFAULT '{}',
  photos jsonb[] NOT NULL DEFAULT '{}',
  looking_for text[] NOT NULL DEFAULT '{}',
  prompts jsonb[] DEFAULT '{}',
  profile_completeness integer,
  last_active timestamptz,
  age_min integer,
  age_max integer,
  distance_max integer,
  gender_preference text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  visible boolean DEFAULT true,
  tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  likee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT likes_no_self_like CHECK (liker_id <> likee_id),
  CONSTRAINT likes_unique_pair UNIQUE (liker_id, likee_id)
);

CREATE TABLE IF NOT EXISTS passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  passed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT passes_no_self_pass CHECK (passer_id <> passed_id),
  CONSTRAINT passes_unique_pair UNIQUE (passer_id, passed_id)
);

CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT blocked_users_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocked_users_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT matches_no_self_match CHECK (user1_id <> user2_id),
  CONSTRAINT matches_unique_pair UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  is_archived_by uuid[],
  is_muted_by uuid[],
  is_pinned_by uuid[],
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_discover_base
  ON profiles (is_active, visible, gender, last_active DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_age_range
  ON profiles (age_range);

CREATE INDEX IF NOT EXISTS idx_profiles_location_lower
  ON profiles ((lower(location)));

CREATE INDEX IF NOT EXISTS idx_profiles_interests_gin
  ON profiles USING gin (interests);

CREATE INDEX IF NOT EXISTS idx_profiles_looking_for_gin
  ON profiles USING gin (looking_for);

CREATE INDEX IF NOT EXISTS idx_profiles_gender_preference_gin
  ON profiles USING gin (gender_preference);

CREATE INDEX IF NOT EXISTS idx_likes_liker
  ON likes (liker_id);

CREATE INDEX IF NOT EXISTS idx_likes_likee
  ON likes (likee_id);

CREATE INDEX IF NOT EXISTS idx_passes_passer
  ON passes (passer_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker
  ON blocked_users (blocker_id);

CREATE INDEX IF NOT EXISTS idx_matches_user1
  ON matches (user1_id);

CREATE INDEX IF NOT EXISTS idx_matches_user2
  ON matches (user2_id);

COMMIT;
