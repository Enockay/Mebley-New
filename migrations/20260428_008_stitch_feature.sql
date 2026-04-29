-- ─── Stitch columns on likes ─────────────────────────────────────────────────
-- A Stitch is a super-like sent with a personal note.
-- is_stitch  : true when the like was sent as a Stitch
-- stitch_note: the personal message attached (max 280 chars)

ALTER TABLE likes
  ADD COLUMN IF NOT EXISTS is_stitch   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stitch_note text    CHECK (char_length(stitch_note) <= 280);

-- Speed up queries that filter only Stitches
CREATE INDEX IF NOT EXISTS likes_is_stitch_idx ON likes(is_stitch) WHERE is_stitch = true;
