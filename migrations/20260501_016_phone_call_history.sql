-- 20260501_016_phone_call_history.sql
-- Adds phone auth support and call history tracking

BEGIN;

-- Phone on app_users (nullable; users can keep email-only)
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_phone
  ON app_users(phone) WHERE phone IS NOT NULL;

-- Call history (primary Postgres — all live app data lives here)
CREATE TABLE IF NOT EXISTS call_history (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  text        NOT NULL,
  caller_id        uuid        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  callee_id        uuid        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  channel_name     text        NOT NULL,
  call_type        text        NOT NULL DEFAULT 'video'
                               CHECK (call_type IN ('video', 'voice')),
  status           text        NOT NULL DEFAULT 'initiated'
                               CHECK (status IN ('initiated','answered','missed','declined','ended')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  answered_at      timestamptz,
  ended_at         timestamptz,
  duration_seconds int,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_history_caller ON call_history(caller_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_history_callee ON call_history(callee_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_history_conv   ON call_history(conversation_id);

COMMIT;

-- ── Run this in the Supabase SQL editor for video thumbnails ──────────────────
-- ALTER TABLE profile_videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
-- ─────────────────────────────────────────────────────────────────────────────
