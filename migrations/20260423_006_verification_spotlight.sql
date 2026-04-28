-- ─── Photo verification columns ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS photo_verified         boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz;

-- ─── Spotlight uses the existing boosts table ─────────────────────────────────
-- boost_type = 'spotlight' is inserted by the credits/spend API.
-- No schema change needed — boosts table already has boost_type (text NOT NULL).

-- ─── Index to quickly look up active spotlight boosts for a set of users ─────
CREATE INDEX IF NOT EXISTS boosts_spotlight_active_idx
  ON boosts(user_id, expires_at)
  WHERE boost_type = 'spotlight';
