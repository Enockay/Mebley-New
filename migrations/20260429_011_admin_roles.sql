BEGIN;

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'moderator')),
  CONSTRAINT user_roles_unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON user_roles(role);

COMMIT;
