-- User in-app notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'system',
  title      TEXT        NOT NULL,
  body       TEXT,
  data       JSONB       DEFAULT '{}',
  actor_id   UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifs_user_id  ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifs_unread    ON user_notifications(user_id, read_at) WHERE read_at IS NULL;

-- verification_notes for manual admin override
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;
