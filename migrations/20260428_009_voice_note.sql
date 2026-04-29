-- ─── Voice note URL on profiles ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS voice_note_url text;
