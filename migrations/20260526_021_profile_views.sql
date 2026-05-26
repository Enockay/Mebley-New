-- Track who viewed whose profile.
-- One row per (viewer, viewed) pair; re-viewing updates the timestamp.
CREATE TABLE IF NOT EXISTS profile_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (viewer_id, viewed_id)
);

CREATE INDEX IF NOT EXISTS profile_views_viewed_id_idx ON profile_views (viewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_id_idx ON profile_views (viewer_id);
