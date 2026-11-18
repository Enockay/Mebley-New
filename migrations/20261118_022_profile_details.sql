-- Profile details shown on Discover ("Basics") and the full profile view.
-- All optional; the app hides any that are empty. Allowed values are kept
-- in src/lib/profile-details.ts.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS occupation  text,
  ADD COLUMN IF NOT EXISTS height_cm   smallint CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 230),
  ADD COLUMN IF NOT EXISTS education   text,
  ADD COLUMN IF NOT EXISTS languages   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS drinking    text,
  ADD COLUMN IF NOT EXISTS children    text;
