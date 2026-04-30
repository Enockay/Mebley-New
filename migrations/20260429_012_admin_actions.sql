-- Immutable audit log for admin moderation decisions (and future admin actions).

BEGIN;

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_actions_action_check CHECK (
    action IN ('moderation_ban', 'moderation_dismiss')
  )
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_actor_created
  ON admin_actions(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created
  ON admin_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user
  ON admin_actions(target_user_id, created_at DESC);

COMMIT;
