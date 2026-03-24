-- Bring existing profiles table up to app-compatible shape.
-- Needed when profiles already exists from older schema.

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender text DEFAULT '',
  ADD COLUMN IF NOT EXISTS photos jsonb[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender_preference text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verified_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS distance_max integer DEFAULT 500,
  ADD COLUMN IF NOT EXISTS profile_completeness integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_discover_base
  ON profiles (is_active, visible, gender, last_active DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_interests_gin
  ON profiles USING gin (interests);

CREATE INDEX IF NOT EXISTS idx_profiles_looking_for_gin
  ON profiles USING gin (looking_for);

CREATE INDEX IF NOT EXISTS idx_profiles_gender_preference_gin
  ON profiles USING gin (gender_preference);

COMMIT;
